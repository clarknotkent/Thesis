-- 073_enforce_patientschedule_intervals.sql
-- Purpose: Ensure patientschedule always adheres to min_interval_days and min_interval_other_vax.
-- Changes:
-- 1) Tighten enforcement in public.enforce_vaccine_interval:
--    - Keep strict enforcement on UPDATE (manual edits, reconciliations).
--    - On INSERT, enforce only if the inserted scheduled_date deviates from the baseline
--      (DOB + due_after_days); this preserves canonical generation while preventing ad-hoc inserts
--      that violate intervals.
--    - Respect schedule_master.concurrent_allowed when enforcing other-vax minimum spacing.
-- 2) Align public.validate_manual_schedule_edit warnings with concurrent_allowed and include
--    a max-interval warning for same vaccine.

SET search_path = public;

BEGIN;

-- 1) Recreate enforce_vaccine_interval with INSERT baseline allowance and concurrency guard
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
    v_dob DATE;
    v_due_after INTEGER;
    v_baseline_due DATE;
BEGIN
    -- Gather patient DOB and schedule metadata
    SELECT p.date_of_birth INTO v_dob FROM patients p WHERE p.patient_id = NEW.patient_id;

    SELECT sd.min_interval_days, sd.max_interval_days, sd.min_interval_other_vax, sm.concurrent_allowed,
           sd.due_after_days
    INTO v_min_interval, v_max_interval, v_min_interval_other, v_concurrent, v_due_after
    FROM schedule_doses sd
    JOIN schedule_master sm ON sd.schedule_id = sm.id
    WHERE sm.vaccine_id = NEW.vaccine_id AND sd.dose_number = NEW.dose_number
    LIMIT 1;

    -- Compute baseline due date (DOB + due_after_days) if available
    IF v_dob IS NOT NULL AND v_due_after IS NOT NULL THEN
        v_baseline_due := (v_dob + (v_due_after * INTERVAL '1 day'))::date;
    ELSE
        v_baseline_due := NULL;
    END IF;

    -- Previous same-vaccine actual date
    SELECT MAX(ps.actual_date) INTO v_last_actual_date
    FROM patientschedule ps
    WHERE ps.patient_id = NEW.patient_id
      AND ps.vaccine_id = NEW.vaccine_id
      AND ps.dose_number < NEW.dose_number
      AND COALESCE(ps.is_deleted, false) = false;

    -- Latest other-vaccine date (actual first, else scheduled)
    SELECT MAX(COALESCE(ps.actual_date, ps.scheduled_date)) INTO v_last_other_date
    FROM patientschedule ps
    WHERE ps.patient_id = NEW.patient_id
      AND ps.vaccine_id <> NEW.vaccine_id
      AND COALESCE(ps.is_deleted, false) = false;

    -- Decide whether to enforce on INSERT. We enforce if the scheduled_date deviates from the baseline
    -- DOB+due_after_days. This prevents ad-hoc inserts that violate intervals but keeps canonical generation intact.
    IF TG_OP = 'INSERT' THEN
        IF v_baseline_due IS NOT NULL AND NEW.scheduled_date = v_baseline_due THEN
            RETURN NEW; -- canonical baseline, allow
        END IF;
        -- Fall through to enforcement if deviates from baseline or baseline unknown
    END IF;

    -- Enforce SAME-vaccine min/max intervals relative to the last actual date
    IF v_last_actual_date IS NOT NULL THEN
        IF v_min_interval IS NOT NULL THEN
            IF NEW.scheduled_date < (v_last_actual_date + (v_min_interval * INTERVAL '1 day'))::date THEN
                RAISE EXCEPTION 'Scheduled date violates min_interval_days (% days) since last actual dose (%).', v_min_interval, v_last_actual_date;
            END IF;
        END IF;
        IF v_max_interval IS NOT NULL THEN
            IF NEW.scheduled_date > (v_last_actual_date + (v_max_interval * INTERVAL '1 day'))::date THEN
                RAISE EXCEPTION 'Scheduled date violates max_interval_days (% days) since last actual dose (%).', v_max_interval, v_last_actual_date;
            END IF;
        END IF;
    END IF;

    -- Enforce OTHER-vaccine minimum spacing only when concurrency is NOT allowed
    IF (v_concurrent IS NULL OR v_concurrent = FALSE) AND v_min_interval_other IS NOT NULL THEN
        IF v_last_other_date IS NOT NULL THEN
            IF NEW.scheduled_date < (v_last_other_date + (v_min_interval_other * INTERVAL '1 day'))::date THEN
                RAISE EXCEPTION 'Scheduled date violates min_interval_other_vax (% days) since last other vaccine (%).', v_min_interval_other, v_last_other_date;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- Ensure trigger remains BEFORE INSERT OR UPDATE (idempotent if already present)
DROP TRIGGER IF EXISTS trg_enforce_vaccine_interval ON public.patientschedule;
CREATE TRIGGER trg_enforce_vaccine_interval
BEFORE INSERT OR UPDATE ON public.patientschedule
FOR EACH ROW EXECUTE FUNCTION public.enforce_vaccine_interval();

-- 2) Recreate validate_manual_schedule_edit to respect concurrency and add a max-interval warning
CREATE OR REPLACE FUNCTION public.validate_manual_schedule_edit(p_patient_schedule_id bigint, p_user_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    rec RECORD;
    v_dob date;
    v_due_date date;
    v_last_same date;
    v_last_other date;
    v_min_same integer;
    v_min_other integer;
    v_due_after integer;
    v_max_same integer;
    v_concurrent boolean;
BEGIN
    SELECT * INTO rec FROM patientschedule WHERE patient_schedule_id = p_patient_schedule_id;
    IF NOT FOUND THEN RETURN; END IF;

    SELECT date_of_birth INTO v_dob FROM patients WHERE patient_id = rec.patient_id;

    -- Load interval rules and concurrency flag
    SELECT sd.min_interval_days, sd.min_interval_other_vax, sd.due_after_days, sd.max_interval_days, sm.concurrent_allowed
    INTO v_min_same, v_min_other, v_due_after, v_max_same, v_concurrent
    FROM schedule_master sm
    JOIN schedule_doses sd ON sd.schedule_id = sm.id
    WHERE sm.vaccine_id = rec.vaccine_id AND sd.dose_number = rec.dose_number
    LIMIT 1;

    v_due_date := (v_dob + (COALESCE(v_due_after, 0) * INTERVAL '1 day'))::date;

    -- Last same-vax actual/scheduled and other-vax date
    SELECT MAX(COALESCE(ps.actual_date, ps.scheduled_date)) INTO v_last_same
    FROM patientschedule ps
    WHERE ps.patient_id = rec.patient_id AND ps.vaccine_id = rec.vaccine_id AND ps.dose_number < rec.dose_number AND COALESCE(ps.is_deleted,false) = false;

    SELECT MAX(COALESCE(ps.actual_date, ps.scheduled_date)) INTO v_last_other
    FROM patientschedule ps
    WHERE ps.patient_id = rec.patient_id AND ps.vaccine_id <> rec.vaccine_id AND COALESCE(ps.is_deleted,false) = false;

    -- Warn if scheduled before baseline due date
    IF v_due_date IS NOT NULL AND rec.scheduled_date < v_due_date THEN
        INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description)
        VALUES ('SCHEDULE_UPDATE', p_user_id, 'patientschedule', rec.patient_schedule_id,
                'Scheduled before baseline due date (' || v_due_date || ')');
    END IF;

    -- Warn if same-vax min interval violated
    IF v_min_same IS NOT NULL AND v_last_same IS NOT NULL THEN
        IF rec.scheduled_date < (v_last_same + (v_min_same * INTERVAL '1 day'))::date THEN
            INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description)
            VALUES ('SCHEDULE_UPDATE', p_user_id, 'patientschedule', rec.patient_schedule_id,
                    'Violates min_interval_days (' || v_min_same || 'd) since last same-vax at ' || v_last_same);
        END IF;
        -- Also warn if exceeds max interval
        IF v_max_same IS NOT NULL AND rec.scheduled_date > (v_last_same + (v_max_same * INTERVAL '1 day'))::date THEN
            INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description)
            VALUES ('SCHEDULE_UPDATE', p_user_id, 'patientschedule', rec.patient_schedule_id,
                    'Exceeds max_interval_days (' || v_max_same || 'd) since last same-vax at ' || v_last_same);
        END IF;
    END IF;

    -- Warn for other-vax min only when concurrency is NOT allowed
    IF (v_concurrent IS NULL OR v_concurrent = FALSE) AND v_min_other IS NOT NULL AND v_last_other IS NOT NULL THEN
        IF rec.scheduled_date < (v_last_other + (v_min_other * INTERVAL '1 day'))::date THEN
            INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description)
            VALUES ('SCHEDULE_UPDATE', p_user_id, 'patientschedule', rec.patient_schedule_id,
                    'Violates min_interval_other_vax (' || v_min_other || 'd) since last other-vax at ' || v_last_other);
        END IF;
    END IF;

    RETURN;
END;
$function$;

-- 3) Recreate recalc_patient_schedule_enhanced to align with interval rules and concurrency
CREATE OR REPLACE FUNCTION public.recalc_patient_schedule_enhanced(
    p_patient_id bigint,
    p_vaccine_id bigint,
    p_dose_number integer,
    p_actual_date date,
    p_user_id bigint DEFAULT NULL::bigint
)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    v_next_dose integer := p_dose_number + 1;
    v_row RECORD;
    v_dob date;
    v_min_same integer;
    v_max_same integer;
    v_min_other integer;
    v_due_after integer;
    v_concurrent boolean;
    v_new_sched date;
    v_last_other date;
BEGIN
    -- Mark current dose as completed
    UPDATE patientschedule
      SET actual_date = p_actual_date,
          status = 'Completed',
          updated_at = now(),
          updated_by = p_user_id
    WHERE patient_id = p_patient_id AND vaccine_id = p_vaccine_id AND dose_number = p_dose_number;

    -- Get DOB for baseline
    SELECT date_of_birth INTO v_dob FROM patients WHERE patient_id = p_patient_id;

    LOOP
        -- Load next dose schedule row and rules
        SELECT ps.patient_schedule_id, ps.scheduled_date, ps.actual_date,
               sd.min_interval_days, sd.max_interval_days, sd.due_after_days, sd.min_interval_other_vax,
               sm.concurrent_allowed
        INTO v_row
        FROM patientschedule ps
        JOIN schedule_master sm ON sm.vaccine_id = ps.vaccine_id
        JOIN schedule_doses sd ON sd.schedule_id = sm.id AND sd.dose_number = ps.dose_number
        WHERE ps.patient_id = p_patient_id AND ps.vaccine_id = p_vaccine_id AND ps.dose_number = v_next_dose
        LIMIT 1;

        EXIT WHEN NOT FOUND;

        -- Only adjust if not yet taken
        IF v_row.actual_date IS NULL THEN
            -- Baseline by master: DOB + due_after_days
            v_new_sched := (v_dob + (COALESCE(v_row.due_after_days, 0) * INTERVAL '1 day'))::date;

            -- Enforce same-vax min interval from just-completed dose
            IF p_actual_date IS NOT NULL AND v_row.min_interval_days IS NOT NULL THEN
                IF v_new_sched < (p_actual_date + (v_row.min_interval_days * INTERVAL '1 day'))::date THEN
                    v_new_sched := (p_actual_date + (v_row.min_interval_days * INTERVAL '1 day'))::date;
                END IF;
            END IF;

            -- Cap by same-vax max interval if defined
            IF p_actual_date IS NOT NULL AND v_row.max_interval_days IS NOT NULL THEN
                IF v_new_sched > (p_actual_date + (v_row.max_interval_days * INTERVAL '1 day'))::date THEN
                    v_new_sched := (p_actual_date + (v_row.max_interval_days * INTERVAL '1 day'))::date;
                END IF;
            END IF;

            -- Enforce other-vax min spacing only if concurrency not allowed
            IF (v_row.concurrent_allowed IS NULL OR v_row.concurrent_allowed = FALSE) AND v_row.min_interval_other_vax IS NOT NULL THEN
                SELECT MAX(COALESCE(ps2.actual_date, ps2.scheduled_date)) INTO v_last_other
                FROM patientschedule ps2
                WHERE ps2.patient_id = p_patient_id AND ps2.vaccine_id <> p_vaccine_id AND COALESCE(ps2.is_deleted,false) = false;
                IF v_last_other IS NOT NULL AND v_new_sched < (v_last_other + (v_row.min_interval_other_vax * INTERVAL '1 day'))::date THEN
                    v_new_sched := (v_last_other + (v_row.min_interval_other_vax * INTERVAL '1 day'))::date;
                END IF;
            END IF;

            -- Apply if changed
            IF v_row.scheduled_date IS DISTINCT FROM v_new_sched THEN
                UPDATE patientschedule
                  SET scheduled_date = v_new_sched,
                      eligible_date = v_new_sched,
                      updated_at = now(),
                      updated_by = p_user_id
                WHERE patient_schedule_id = v_row.patient_schedule_id;

                INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description)
                VALUES ('SCHEDULE_UPDATE', p_user_id, 'patientschedule', v_row.patient_schedule_id,
                        'Recalculated schedule to ' || v_new_sched || ' (rules applied)');
            END IF;
        END IF;

        v_next_dose := v_next_dose + 1;
    END LOOP;

    PERFORM recompute_patient_schedule_statuses(p_patient_id);
END;
$function$;

-- 4) Harmonize status computation and timezone usage in recompute_schedule_status
CREATE OR REPLACE FUNCTION public.recompute_schedule_status(p_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    v_rec RECORD;
    v_grace integer := 0;
    v_new_status text;
    v_sched_date date;
    today date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::date;
BEGIN
    SELECT * INTO v_rec FROM patientschedule WHERE patient_schedule_id = p_id;
    IF NOT FOUND THEN RETURN; END IF;

    -- determine grace days from master schedule doses
    SELECT sd.grace_period_days INTO v_grace
    FROM schedule_doses sd
    JOIN schedule_master sm ON sd.schedule_id = sm.id
    WHERE sm.vaccine_id = v_rec.vaccine_id
      AND sd.dose_number = v_rec.dose_number
    LIMIT 1;

    v_sched_date := v_rec.scheduled_date;

    IF v_rec.actual_date IS NOT NULL THEN
        v_new_status := 'Completed';
    ELSIF v_sched_date IS NULL THEN
        v_new_status := 'Scheduled';
    ELSE
        IF v_sched_date < today THEN
            -- If still within grace window: Overdue, else Missed
            IF (v_sched_date + (COALESCE(v_grace,0) * INTERVAL '1 day'))::date >= today THEN
                v_new_status := 'Overdue';
            ELSE
                v_new_status := 'Missed';
            END IF;
        ELSE
            v_new_status := 'Scheduled';
        END IF;
    END IF;

    IF v_rec.status IS DISTINCT FROM v_new_status THEN
        UPDATE patientschedule SET status = v_new_status, updated_at = now() WHERE patient_schedule_id = p_id;
    END IF;
END;
$function$;

COMMIT;
