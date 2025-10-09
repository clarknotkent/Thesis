-- 070_add_scheduled_functions_and_expiry_check.sql
-- Purpose: Add scheduled functions for 7AM and 5PM status updates, expiry checking function, and update validate_manual_schedule_edit

-- Function to check for expired inventory and create EXPIRED transactions
CREATE OR REPLACE FUNCTION public.check_and_expire_inventory()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    inv_record RECORD;
    current_balance INTEGER;
BEGIN
    -- Find all inventory items that have expired and are not already marked as expired
    FOR inv_record IN
        SELECT i.inventory_id, i.vaccine_id, i.current_stock_level, i.expiration_date,
               COALESCE(SUM(it.quantity), 0) as total_issued
        FROM inventory i
        LEFT JOIN inventorytransactions it ON it.inventory_id = i.inventory_id
            AND it.transaction_type = 'ISSUE'
            AND it.date >= CURRENT_DATE - INTERVAL '30 days'  -- Recent issues only
        WHERE i.is_deleted = FALSE
            AND i.expiration_date < CURRENT_DATE
            AND i.current_stock_level > 0
            AND NOT EXISTS (
                SELECT 1 FROM inventorytransactions it2
                WHERE it2.inventory_id = i.inventory_id
                    AND it2.transaction_type = 'EXPIRED'
            )
        GROUP BY i.inventory_id, i.vaccine_id, i.current_stock_level, i.expiration_date
    LOOP
        -- Calculate current balance (this should match current_stock_level)
        current_balance := inv_record.current_stock_level;

        -- Create EXPIRED transaction for the entire remaining stock
        INSERT INTO inventorytransactions (
            inventory_id,
            transaction_type,
            quantity,
            balance_after,
            performed_by,
            created_by,
            remarks,
            date
        ) VALUES (
            inv_record.inventory_id,
            'EXPIRED',
            -current_balance,  -- Negative quantity for expiry
            0,  -- Balance becomes 0
            NULL,  -- System operation
            NULL,  -- System operation
            'Automatic expiry check - vaccine expired on ' || inv_record.expiration_date,
            CURRENT_TIMESTAMP
        );

        -- Update inventory stock level to 0
        UPDATE inventory
        SET current_stock_level = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE inventory_id = inv_record.inventory_id;
    END LOOP;
END;
$function$;

-- Function to update patient schedule statuses (7AM and 5PM)
CREATE OR REPLACE FUNCTION public.update_patient_schedule_statuses()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    schedule_record RECORD;
    new_status TEXT;
    grace_days INTEGER;
    today DATE := CURRENT_DATE;
BEGIN
    -- Update statuses for all active schedules
    FOR schedule_record IN
        SELECT ps.patient_schedule_id, ps.patient_id, ps.vaccine_id, ps.dose_number,
               ps.scheduled_date, ps.actual_date, ps.status,
               sd.grace_period_days
        FROM patientschedule ps
        JOIN schedule_master sm ON sm.vaccine_id = ps.vaccine_id
        JOIN schedule_doses sd ON sd.schedule_id = sm.id AND sd.dose_number = ps.dose_number
        WHERE ps.is_deleted = FALSE
            AND ps.status NOT IN ('Completed', 'Cancelled')
    LOOP
        -- Determine new status based on dates and grace period
        IF schedule_record.actual_date IS NOT NULL THEN
            new_status := 'Completed';
        ELSIF schedule_record.scheduled_date < today THEN
            -- Check if within grace period
            grace_days := COALESCE(schedule_record.grace_period_days, 0);
            IF schedule_record.scheduled_date + grace_days >= today THEN
                new_status := 'Overdue';
            ELSE
                new_status := 'Missed';
            END IF;
        ELSE
            new_status := 'Scheduled';
        END IF;

        -- Update status if changed
        IF schedule_record.status != new_status THEN
            UPDATE patientschedule
            SET status = new_status,
                updated_at = CURRENT_TIMESTAMP
            WHERE patient_schedule_id = schedule_record.patient_schedule_id;
        END IF;
    END LOOP;

    -- Update patient tags based on defaulter status
    PERFORM refresh_defaulters();
END;
$function$;

-- Update validate_manual_schedule_edit to check both min_interval_days and min_interval_other_vax
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
    v_details jsonb;
BEGIN
    SELECT * INTO rec FROM patientschedule WHERE patient_schedule_id = p_patient_schedule_id;
    IF NOT FOUND THEN RETURN; END IF;

    SELECT date_of_birth INTO v_dob FROM patients WHERE patient_id = rec.patient_id;

    -- Get both interval values
    SELECT sd.min_interval_days, sd.min_interval_other_vax
    INTO v_min_same, v_min_other
    FROM schedule_master sm
    JOIN schedule_doses sd ON sd.schedule_id = sm.id
    WHERE sm.vaccine_id = rec.vaccine_id AND sd.dose_number = rec.dose_number
    LIMIT 1;

    v_due_date := (v_dob + ((SELECT sd.due_after_days FROM schedule_master sm JOIN schedule_doses sd ON sd.schedule_id = sm.id WHERE sm.vaccine_id = rec.vaccine_id AND sd.dose_number = rec.dose_number LIMIT 1) * INTERVAL '1 day'))::date;

    -- Get last same vaccine dose date
    SELECT MAX(COALESCE(ps.actual_date, ps.scheduled_date)) INTO v_last_same
    FROM patientschedule ps
    WHERE ps.patient_id = rec.patient_id AND ps.vaccine_id = rec.vaccine_id AND ps.dose_number < rec.dose_number AND ps.is_deleted = FALSE;

    -- Get last other vaccine dose date
    SELECT MAX(COALESCE(ps.actual_date, ps.scheduled_date)) INTO v_last_other
    FROM patientschedule ps
    WHERE ps.patient_id = rec.patient_id AND ps.vaccine_id <> rec.vaccine_id AND ps.is_deleted = FALSE;

    v_details := jsonb_build_object('patient_schedule_id', rec.patient_schedule_id, 'patient_id', rec.patient_id, 'vaccine_id', rec.vaccine_id, 'dose_number', rec.dose_number, 'scheduled_date', rec.scheduled_date, 'due_date', v_due_date);

    -- Warn if scheduled_date is earlier than DOB + due_after_days
    IF rec.scheduled_date < v_due_date THEN
        INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description)
        VALUES ('SCHEDULE_UPDATE', p_user_id, 'patientschedule', rec.patient_schedule_id, 'Scheduled before due date - patient_id: ' || rec.patient_id || ', vaccine_id: ' || rec.vaccine_id || ', dose: ' || rec.dose_number || ', scheduled: ' || rec.scheduled_date || ', due: ' || v_due_date);
    END IF;

    -- Warn if min_interval_days violated for same vaccine
    IF v_min_same IS NOT NULL AND v_last_same IS NOT NULL THEN
        IF rec.scheduled_date < (v_last_same + (v_min_same * INTERVAL '1 day'))::date THEN
            INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description)
            VALUES ('SCHEDULE_UPDATE', p_user_id, 'patientschedule', rec.patient_schedule_id, 'Violates min_interval_days - patient_id: ' || rec.patient_id || ', vaccine_id: ' || rec.vaccine_id || ', dose: ' || rec.dose_number || ', scheduled: ' || rec.scheduled_date || ', min_interval_days: ' || v_min_same || ', last_same: ' || v_last_same);
        END IF;
    END IF;

    -- Warn if min_interval_other_vax violated
    IF v_min_other IS NOT NULL AND v_last_other IS NOT NULL THEN
        IF rec.scheduled_date < (v_last_other + (v_min_other * INTERVAL '1 day'))::date THEN
            INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description)
            VALUES ('SCHEDULE_UPDATE', p_user_id, 'patientschedule', rec.patient_schedule_id, 'Violates min_interval_other_vax - patient_id: ' || rec.patient_id || ', vaccine_id: ' || rec.vaccine_id || ', dose: ' || rec.dose_number || ', scheduled: ' || rec.scheduled_date || ', min_interval_days: ' || v_min_other || ', last_other: ' || v_last_other);
        END IF;
    END IF;

    RETURN;
END;
$function$;

-- Schedule the functions using pg_cron
-- Note: These will run in the postgres user's context, so ensure proper permissions

-- Wrapper functions for scheduled tasks
CREATE OR REPLACE FUNCTION public.check_expired_inventory_scheduled()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Call the canonical expiry check function if present; ignore if missing
  PERFORM 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE p.proname = 'check_and_expire_inventory' AND n.nspname = 'public';
  IF FOUND THEN
    PERFORM public.check_and_expire_inventory();
  END IF;
END;$$;

CREATE OR REPLACE FUNCTION public.update_schedule_statuses_scheduled()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Call the canonical status update function if present; ignore if missing
  PERFORM 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE p.proname = 'update_patient_schedule_statuses' AND n.nspname = 'public';
  IF FOUND THEN
    PERFORM public.update_patient_schedule_statuses();
  END IF;
END;$$;

-- Only proceed if pg_cron is installed
DO $$
DECLARE v_job_id integer;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule expiry check to run daily at 2 AM
    SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'check-expired-inventory' LIMIT 1;
    IF v_job_id IS NOT NULL THEN
      PERFORM cron.unschedule(v_job_id);
    END IF;
    PERFORM cron.schedule(
      'check-expired-inventory',
      '0 2 * * *',
      'SELECT public.check_expired_inventory_scheduled();'
    );

    -- Schedule status updates at 7 AM
    SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'update-schedule-statuses-7am' LIMIT 1;
    IF v_job_id IS NOT NULL THEN
      PERFORM cron.unschedule(v_job_id);
    END IF;
    PERFORM cron.schedule(
      'update-schedule-statuses-7am',
      '0 7 * * *',
      'SELECT public.update_schedule_statuses_scheduled();'
    );

    -- Schedule status updates at 5 PM
    SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'update-schedule-statuses-5pm' LIMIT 1;
    IF v_job_id IS NOT NULL THEN
      PERFORM cron.unschedule(v_job_id);
    END IF;
    PERFORM cron.schedule(
      'update-schedule-statuses-5pm',
      '0 17 * * *',
      'SELECT public.update_schedule_statuses_scheduled();'
    );
  END IF;
END$$;