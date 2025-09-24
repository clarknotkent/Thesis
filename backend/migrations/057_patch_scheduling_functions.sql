-- Migration 057: Patch scheduling helper functions to avoid ambiguous columns and tighten logic
BEGIN;

-- 1) enforce_vaccine_interval: validate scheduled_date against previous actual_date and configured min/max intervals
CREATE OR REPLACE FUNCTION public.enforce_vaccine_interval()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_last_actual_date DATE;
    v_min_interval INTEGER;
    v_max_interval INTEGER;
    v_min_interval_other INTEGER;
    v_concurrent BOOLEAN;
    v_last_other_date DATE;
BEGIN
    SELECT MAX(ps.actual_date) INTO v_last_actual_date
    FROM patientschedule ps
    WHERE ps.patient_id = NEW.patient_id
      AND ps.vaccine_id = NEW.vaccine_id
      AND ps.dose_number < NEW.dose_number
      AND ps.is_deleted = FALSE;

    SELECT sd.min_interval_days, sd.max_interval_days, sd.min_interval_other_vax, sm.concurrent_allowed
    INTO v_min_interval, v_max_interval, v_min_interval_other, v_concurrent
    FROM schedule_doses sd
    JOIN schedule_master sm ON sd.schedule_id = sm.id
    WHERE sm.vaccine_id = NEW.vaccine_id AND sd.dose_number = NEW.dose_number
    LIMIT 1;

    -- Only enforce intervals on UPDATE operations (manual edits or reconciling actual_date),
    -- allow canonical generation (INSERT) to set DOB + due_after_days without interference.
    IF TG_OP = 'UPDATE' THEN
        IF v_last_actual_date IS NOT NULL AND v_min_interval IS NOT NULL THEN
            IF NEW.scheduled_date < (v_last_actual_date + (v_min_interval * INTERVAL '1 day'))::date THEN
                RAISE EXCEPTION 'Scheduled date violates minimum interval rule!';
            END IF;
        END IF;
        IF v_last_actual_date IS NOT NULL AND v_max_interval IS NOT NULL THEN
            IF NEW.scheduled_date > (v_last_actual_date + (v_max_interval * INTERVAL '1 day'))::date THEN
                RAISE EXCEPTION 'Scheduled date violates maximum interval rule!';
            END IF;
        END IF;

        -- Enforce minimum spacing from other vaccines only when concurrency is NOT allowed
        IF (v_concurrent IS NULL OR v_concurrent = FALSE) AND v_min_interval_other IS NOT NULL THEN
            SELECT MAX(COALESCE(ps.actual_date, ps.scheduled_date)) INTO v_last_other_date
            FROM patientschedule ps
            WHERE ps.patient_id = NEW.patient_id
              AND ps.vaccine_id <> NEW.vaccine_id
              AND ps.is_deleted = FALSE;

            IF v_last_other_date IS NOT NULL THEN
                IF NEW.scheduled_date < (v_last_other_date + (v_min_interval_other * INTERVAL '1 day'))::date THEN
                    RAISE EXCEPTION 'Scheduled date violates minimum interval rule with other vaccines!';
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- 2) recalc_patient_schedule: mark completed dose and recompute subsequent scheduled_date values
CREATE OR REPLACE FUNCTION public.recalc_patient_schedule(p_patient_id bigint, p_vaccine_id bigint, p_dose_number integer, p_actual_date date, p_user_id bigint DEFAULT NULL::bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_next_dose integer := p_dose_number + 1;
    v_sched RECORD;
    v_new_sched date;
    v_prev_sched_date date;
BEGIN
    -- Mark the current dose completed
    UPDATE patientschedule
      SET actual_date = p_actual_date,
          status = 'Completed',
          updated_at = now(),
          updated_by = p_user_id
    WHERE patient_id = p_patient_id AND vaccine_id = p_vaccine_id AND dose_number = p_dose_number;

    LOOP
        SELECT ps.patient_schedule_id, ps.scheduled_date, ps.actual_date, sd.min_interval_days, sd.max_interval_days, sd.min_interval_other_vax, sm.concurrent_allowed
        INTO v_sched
        FROM patientschedule ps
        JOIN schedule_doses sd ON sd.schedule_id = (SELECT id FROM schedule_master WHERE vaccine_id = p_vaccine_id) AND sd.dose_number = ps.dose_number
        JOIN schedule_master sm ON sd.schedule_id = sm.id
        WHERE ps.patient_id = p_patient_id AND ps.vaccine_id = p_vaccine_id AND ps.dose_number = v_next_dose
        LIMIT 1;

        EXIT WHEN NOT FOUND;

        IF v_sched.actual_date IS NULL THEN
            -- compute desired date from actual_date + min_interval_days
            v_new_sched := (p_actual_date + COALESCE(v_sched.min_interval_days,0) * INTERVAL '1 day')::date;

            -- If the existing scheduled date is already >= v_new_sched and not past max_interval, leave it
            IF v_sched.scheduled_date IS NOT NULL AND v_sched.scheduled_date >= v_new_sched THEN
                -- keep existing schedule
                NULL;
            ELSE
                -- apply min_interval_other_vax if concurrency is disallowed
                IF (v_sched.concurrent_allowed IS NULL OR v_sched.concurrent_allowed = FALSE) AND v_sched.min_interval_other_vax IS NOT NULL THEN
                    SELECT MAX(COALESCE(ps2.actual_date, ps2.scheduled_date)) INTO v_prev_sched_date
                    FROM patientschedule ps2
                    WHERE ps2.patient_id = p_patient_id
                      AND ps2.vaccine_id <> p_vaccine_id
                      AND ps2.is_deleted = FALSE;

                    IF v_prev_sched_date IS NOT NULL THEN
                        IF v_new_sched < (v_prev_sched_date + (v_sched.min_interval_other_vax * INTERVAL '1 day'))::date THEN
                            v_new_sched := (v_prev_sched_date + (v_sched.min_interval_other_vax * INTERVAL '1 day'))::date;
                        END IF;
                    END IF;
                END IF;

                -- If max_interval exists and v_new_sched exceeds it, insert a note via activitylogs
                IF v_sched.max_interval_days IS NOT NULL THEN
                    IF v_new_sched > (p_actual_date + (v_sched.max_interval_days * INTERVAL '1 day'))::date THEN
                        INSERT INTO activitylogs(action_type, actor_user_id, target_table, target_id, details)
                        VALUES ('SCHEDULE_ADJUSTED_SYSTEM', p_user_id, 'patientschedule', v_sched.patient_schedule_id,
                                jsonb_build_object('note','computed next dose exceeds max_interval','computed_date', v_new_sched));
                    END IF;
                END IF;

                -- apply update
                UPDATE patientschedule
                  SET scheduled_date = v_new_sched,
                      eligible_date = v_new_sched,
                      updated_at = now(),
                      updated_by = p_user_id
                WHERE patient_schedule_id = v_sched.patient_schedule_id;
            END IF;
        END IF;

        v_next_dose := v_next_dose + 1;
    END LOOP;

    PERFORM recompute_patient_schedule_statuses(p_patient_id);
END;
$function$;

-- 3) recalc_patient_schedule_enhanced: similar to recalc but emits activity logs for adjustments
CREATE OR REPLACE FUNCTION public.recalc_patient_schedule_enhanced(p_patient_id bigint, p_vaccine_id bigint, p_dose_number integer, p_actual_date date, p_user_id bigint DEFAULT NULL::bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_next_dose integer := p_dose_number + 1;
    v_sched RECORD;
    v_new_sched date;
    v_actor uuid := current_setting('app.user_id', true)::uuid;
    v_prev_sched_date date;
BEGIN
    UPDATE patientschedule
      SET actual_date = p_actual_date,
          status = 'Completed',
          updated_at = now(),
          updated_by = p_user_id
    WHERE patient_id = p_patient_id AND vaccine_id = p_vaccine_id AND dose_number = p_dose_number;

    LOOP
        SELECT ps.patient_schedule_id, ps.scheduled_date, ps.actual_date, sd.min_interval_days, sd.max_interval_days, sd.min_interval_other_vax, sm.concurrent_allowed
        INTO v_sched
        FROM patientschedule ps
        JOIN schedule_doses sd ON sd.schedule_id = (SELECT id FROM schedule_master WHERE vaccine_id = p_vaccine_id) AND sd.dose_number = ps.dose_number
        JOIN schedule_master sm ON sd.schedule_id = sm.id
        WHERE ps.patient_id = p_patient_id AND ps.vaccine_id = p_vaccine_id AND ps.dose_number = v_next_dose
        LIMIT 1;

        EXIT WHEN NOT FOUND;

        IF v_sched.actual_date IS NULL THEN
            v_new_sched := (p_actual_date + COALESCE(v_sched.min_interval_days,0) * INTERVAL '1 day')::date;

            -- apply concurrency rules: shift if concurrency disallowed and min_interval_other_vax present
            IF (v_sched.concurrent_allowed IS NULL OR v_sched.concurrent_allowed = FALSE) AND v_sched.min_interval_other_vax IS NOT NULL THEN
                SELECT MAX(COALESCE(ps2.actual_date, ps2.scheduled_date)) INTO v_prev_sched_date
                FROM patientschedule ps2
                WHERE ps2.patient_id = p_patient_id
                  AND ps2.vaccine_id <> p_vaccine_id
                  AND ps2.is_deleted = FALSE;

                IF v_prev_sched_date IS NOT NULL THEN
                    IF v_new_sched < (v_prev_sched_date + (v_sched.min_interval_other_vax * INTERVAL '1 day'))::date THEN
                        v_new_sched := (v_prev_sched_date + (v_sched.min_interval_other_vax * INTERVAL '1 day'))::date;
                    END IF;
                END IF;
            END IF;

            IF v_sched.scheduled_date IS DISTINCT FROM v_new_sched THEN
                UPDATE patientschedule
                  SET scheduled_date = v_new_sched,
                      eligible_date = v_new_sched,
                      updated_at = now(),
                      updated_by = p_user_id
                WHERE patient_schedule_id = v_sched.patient_schedule_id;

                INSERT INTO activitylogs(action_type, actor_user_id, target_table, target_id, details)
                VALUES ('SCHEDULE_ADJUSTED_USER', v_actor, 'patientschedule', v_sched.patient_schedule_id,
                        jsonb_build_object('adjust_reason','recalc_enhanced','from', v_sched.scheduled_date, 'to', v_new_sched));
            END IF;
        END IF;

        v_next_dose := v_next_dose + 1;
    END LOOP;

    PERFORM recompute_patient_schedule_statuses(p_patient_id);
END;
$function$;

-- Helper: validate_manual_schedule_edit
-- This function logs non-blocking warnings when a manual edit violates scheduling rules.
CREATE OR REPLACE FUNCTION public.validate_manual_schedule_edit(p_patient_schedule_id bigint, p_user_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    rec RECORD;
    v_dob date;
    v_due_date date;
    v_last_other date;
    v_min_other integer;
    v_details jsonb;
BEGIN
    SELECT * INTO rec FROM patientschedule WHERE patient_schedule_id = p_patient_schedule_id;
    IF NOT FOUND THEN RETURN; END IF;

    SELECT date_of_birth INTO v_dob FROM patients WHERE patient_id = rec.patient_id;
    SELECT sd.min_interval_other_vax INTO v_min_other
    FROM schedule_master sm
    JOIN schedule_doses sd ON sd.schedule_id = sm.id
    WHERE sm.vaccine_id = rec.vaccine_id AND sd.dose_number = rec.dose_number
    LIMIT 1;

    v_due_date := (v_dob + ((SELECT sd.due_after_days FROM schedule_master sm JOIN schedule_doses sd ON sd.schedule_id = sm.id WHERE sm.vaccine_id = rec.vaccine_id AND sd.dose_number = rec.dose_number LIMIT 1) * INTERVAL '1 day'))::date;

    SELECT MAX(COALESCE(ps.actual_date, ps.scheduled_date)) INTO v_last_other
    FROM patientschedule ps
    WHERE ps.patient_id = rec.patient_id AND ps.vaccine_id <> rec.vaccine_id AND ps.is_deleted = FALSE;

    v_details := jsonb_build_object('patient_schedule_id', rec.patient_schedule_id, 'patient_id', rec.patient_id, 'vaccine_id', rec.vaccine_id, 'dose_number', rec.dose_number, 'scheduled_date', rec.scheduled_date, 'due_date', v_due_date);

    -- Warn if scheduled_date is earlier than DOB + due_after_days
    IF rec.scheduled_date < v_due_date THEN
        INSERT INTO activitylogs(action_type, actor_user_id, target_table, target_id, details)
        VALUES ('SCHEDULE_EDIT_WARNING', p_user_id, 'patientschedule', rec.patient_schedule_id, v_details || jsonb_build_object('warning','scheduled before due date'));
    END IF;

    -- Warn if concurrency disallowed and min_interval_other_vax violated
    IF v_min_other IS NOT NULL AND v_last_other IS NOT NULL THEN
        IF rec.scheduled_date < (v_last_other + (v_min_other * INTERVAL '1 day'))::date THEN
            INSERT INTO activitylogs(action_type, actor_user_id, target_table, target_id, details)
            VALUES ('SCHEDULE_EDIT_WARNING', p_user_id, 'patientschedule', rec.patient_schedule_id, v_details || jsonb_build_object('warning','violates min_interval_other_vax','min_interval_days', v_min_other, 'last_other', v_last_other));
        END IF;
    END IF;

    RETURN;
END;
$function$;

-- 4) recompute_schedule_status: set status based on scheduled/actual dates
CREATE OR REPLACE FUNCTION public.recompute_schedule_status(p_id bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_rec RECORD;
    v_new_status text;
BEGIN
    SELECT * INTO v_rec FROM patientschedule WHERE patient_schedule_id = p_id;
    IF NOT FOUND THEN RETURN; END IF;

    IF v_rec.actual_date IS NOT NULL THEN
        v_new_status := 'Completed';
    ELSIF v_rec.scheduled_date < CURRENT_DATE THEN
        v_new_status := 'Missed';
    ELSIF v_rec.scheduled_date = CURRENT_DATE THEN
        v_new_status := 'Pending';
    ELSE
        v_new_status := 'Pending';
    END IF;

    IF v_rec.status IS DISTINCT FROM v_new_status THEN
        UPDATE patientschedule SET status = v_new_status, updated_at = now() WHERE patient_schedule_id = p_id;
    END IF;
END;
$function$;

-- 5) recompute_patient_schedule_statuses: iterate patient schedule rows
CREATE OR REPLACE FUNCTION public.recompute_patient_schedule_statuses(p_patient_id bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT patient_schedule_id FROM patientschedule WHERE patient_id = p_patient_id LOOP
        PERFORM recompute_schedule_status(r.patient_schedule_id);
    END LOOP;
END;
$function$;

-- 6) update_patient_fic_cic_tag: keep logic but qualify columns
CREATE OR REPLACE FUNCTION public.update_patient_fic_cic_tag()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_missed_count INTEGER;
    v_total_required INTEGER;
    v_latest_completion DATE;
    v_dob DATE;
BEGIN
    SELECT date_of_birth INTO v_dob FROM patients WHERE patient_id = NEW.patient_id;

    SELECT COUNT(*) INTO v_total_required FROM schedule_master WHERE is_deleted = FALSE;

    SELECT COUNT(*) INTO v_missed_count
    FROM patientschedule ps
    WHERE ps.patient_id = NEW.patient_id
      AND ps.status = 'Completed'
      AND ps.is_deleted = FALSE;

    SELECT MAX(ps.actual_date) INTO v_latest_completion
    FROM patientschedule ps
    WHERE ps.patient_id = NEW.patient_id
      AND ps.status = 'Completed'
      AND ps.is_deleted = FALSE;

    IF v_missed_count = v_total_required AND v_latest_completion IS NOT NULL THEN
        IF v_latest_completion <= (v_dob + INTERVAL '12 months 29 days') THEN
            UPDATE patients SET tags = 'FIC' WHERE patient_id = NEW.patient_id;
        ELSE
            UPDATE patients SET tags = 'CIC' WHERE patient_id = NEW.patient_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- 7) update_patient_tag_on_patientschedule_update: set Defaulter/None tags
CREATE OR REPLACE FUNCTION public.update_patient_tag_on_patientschedule_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_missed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_missed_count
    FROM patientschedule ps
    WHERE ps.patient_id = NEW.patient_id AND ps.status = 'Missed' AND ps.is_deleted = FALSE;

    IF v_missed_count > 0 THEN
        UPDATE patients SET tags = 'Defaulter' WHERE patient_id = NEW.patient_id;
    ELSE
        UPDATE patients SET tags = 'None' WHERE patient_id = NEW.patient_id;
    END IF;

    RETURN NEW;
END;
$function$;

COMMIT;
