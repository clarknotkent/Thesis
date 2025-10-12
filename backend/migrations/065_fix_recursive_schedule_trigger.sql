-- Migration 065: Fix recursive patient schedule update trigger
-- Drop the problematic trigger that causes stack depth limit exceeded

-- Drop the recursive trigger
DROP TRIGGER IF EXISTS patientschedule_status_update_trigger ON patientschedule;

-- Recreate the trigger function with recursion prevention
CREATE OR REPLACE FUNCTION public.trigger_update_schedule_statuses()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_patient_id bigint;
    v_updated_count int := 0;
BEGIN
    -- Prevent recursion by checking if we're already in a schedule update
    IF current_setting('app.schedule_update_in_progress', true) = 'true' THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Set flag to prevent recursion
    PERFORM set_config('app.schedule_update_in_progress', 'true', false);

    -- Get patient_id from the triggering record
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_patient_id := NEW.patient_id;
    ELSE
        v_patient_id := OLD.patient_id;
    END IF;

    -- Update schedule statuses for this patient only (avoid cascading updates)
    UPDATE patientschedule
    SET status = CASE
        WHEN actual_date IS NOT NULL THEN 'Completed'::schedule_status_enum
        -- Preserve explicit Rescheduled marking for future-dated schedules
        WHEN status = 'Rescheduled' AND scheduled_date >= CURRENT_DATE THEN 'Rescheduled'::schedule_status_enum
        WHEN scheduled_date < CURRENT_DATE - INTERVAL '30 days' THEN 'Missed'::schedule_status_enum
        ELSE 'Pending'::schedule_status_enum
    END,
    updated_at = now(),
    updated_by = NULLIF(current_setting('app.user_id', true),'')::bigint
    WHERE patient_id = v_patient_id
    AND is_deleted = false;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    -- Reset the recursion flag
    PERFORM set_config('app.schedule_update_in_progress', 'false', false);

    RETURN COALESCE(NEW, OLD);
END; $function$;

-- Recreate the trigger
CREATE TRIGGER patientschedule_status_update_trigger
    AFTER INSERT OR UPDATE ON patientschedule
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_update_schedule_statuses();