-- Migration 058: Recompute schedule status using per-dose grace period
BEGIN;

-- Replace recompute_schedule_status to use grace_period_days from schedule_doses
CREATE OR REPLACE FUNCTION public.recompute_schedule_status(p_id bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_rec RECORD;
    v_grace integer := 0;
    v_new_status text;
    v_sched_date date;
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
        v_new_status := 'Pending';
    ELSE
        -- Preserve explicit Rescheduled marking for future-dated schedules
        IF v_rec.status = 'Rescheduled' AND v_sched_date >= CURRENT_DATE THEN
            v_new_status := 'Rescheduled';
        ELSIF (v_sched_date + (COALESCE(v_grace,0) * INTERVAL '1 day'))::date < CURRENT_DATE THEN
            v_new_status := 'Missed';
        ELSIF v_sched_date <= CURRENT_DATE THEN
            v_new_status := 'Due';
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
