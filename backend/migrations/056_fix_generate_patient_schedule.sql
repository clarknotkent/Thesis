-- Migration 056: Fix generate_patient_schedule to avoid ambiguous column references
BEGIN;

-- Replace generate_patient_schedule with a qualified, unambiguous implementation
CREATE OR REPLACE FUNCTION public.generate_patient_schedule(p_patient_id bigint, p_user_id bigint DEFAULT NULL::bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_birth date;
    rec_master RECORD;
    rec_dose RECORD;
    v_prev_sched_date date;
    v_scheduled_date date;
BEGIN
    SELECT date_of_birth INTO v_birth FROM patients WHERE patient_id = p_patient_id;
    IF v_birth IS NULL THEN
        RAISE EXCEPTION 'Patient % not found', p_patient_id;
    END IF;

    FOR rec_master IN SELECT sm.id AS schedule_id, sm.vaccine_id, sm.total_doses FROM schedule_master sm WHERE sm.is_deleted = FALSE LOOP
        FOR rec_dose IN SELECT sd.dose_number, sd.due_after_days, sd.min_interval_days, sd.max_interval_days, sd.min_interval_other_vax, sm.concurrent_allowed
                       FROM schedule_doses sd
                       JOIN schedule_master sm ON sd.schedule_id = sm.id
                       WHERE sd.schedule_id = rec_master.schedule_id
                       ORDER BY sd.dose_number LOOP
            -- Canonical generation: always use DOB + due_after_days for scheduled date
            v_scheduled_date := (v_birth + (COALESCE(rec_dose.due_after_days,0) * INTERVAL '1 day'))::date;

            INSERT INTO patientschedule(patient_id, vaccine_id, dose_number, scheduled_date, eligible_date, status, created_by, updated_by)
            VALUES (p_patient_id, rec_master.vaccine_id, rec_dose.dose_number, v_scheduled_date, v_scheduled_date, 'Pending', p_user_id, p_user_id)
            ON CONFLICT (patient_id, vaccine_id, dose_number) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$function$;

COMMIT;
