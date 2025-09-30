-- Migration: Add function to update patient schedule statuses based on dates
-- This function updates schedule statuses when scheduled dates have passed
-- Once a schedule is marked as 'completed', its status becomes immutable

CREATE OR REPLACE FUNCTION public.update_patient_schedule_statuses()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    v_actor bigint := NULLIF(current_setting('app.user_id', true),'')::bigint;
BEGIN
    -- Update schedules that are past due but not yet completed
    -- Preserve 'Rescheduled' status - don't change it to 'Pending'
    UPDATE patientschedule
    SET
        status = CASE
            WHEN status = 'Rescheduled' AND scheduled_date >= CURRENT_DATE THEN status  -- Keep Rescheduled
            WHEN scheduled_date < CURRENT_DATE THEN 'Missed'
            ELSE 'Pending'
        END,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = v_actor
    WHERE
        status NOT IN ('Completed')  -- Don't update completed schedules
        AND is_deleted = false
        AND scheduled_date <= CURRENT_DATE;

    -- Log the status update operation
    INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description)
    VALUES ('SCHEDULE_UPDATE', v_actor, 'patientschedule', NULL, 'System updated Schedule Statuses');
END;
$function$;

-- Create a function to get schedule status for a specific schedule
CREATE OR REPLACE FUNCTION public.get_schedule_status(p_schedule_id bigint)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
    v_scheduled_date date;
    v_status text;
BEGIN
    SELECT scheduled_date, status INTO v_scheduled_date, v_status
    FROM patientschedule
    WHERE patient_schedule_id = p_schedule_id AND is_deleted = false;

    IF NOT FOUND THEN
        RETURN 'not_found';
    END IF;

    -- If already completed, return the current status
    IF v_status IN ('completed', 'administered', 'given') THEN
        RETURN v_status;
    END IF;

    -- Calculate status based on date
    IF v_scheduled_date < CURRENT_DATE THEN
        RETURN 'overdue';
    ELSIF v_scheduled_date = CURRENT_DATE THEN
        RETURN 'due';
    ELSE
        RETURN 'pending';
    END IF;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_patient_schedule_statuses() TO public;
GRANT EXECUTE ON FUNCTION public.get_schedule_status(bigint) TO public;

-- Create a trigger function to update schedule statuses on login activity
CREATE OR REPLACE FUNCTION public.trigger_schedule_update_on_activity()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only update schedules on login activities to avoid excessive updates
    IF NEW.action_type = 'LOGIN' OR NEW.action_type = 'USER_LOGIN' THEN
        PERFORM update_patient_schedule_statuses();
    END IF;
    RETURN NEW;
END;
$function$;

-- Create trigger that runs after INSERT on activitylogs table for login events
CREATE OR REPLACE TRIGGER activitylogs_schedule_update_trigger
    AFTER INSERT ON activitylogs
    FOR EACH ROW
    WHEN (NEW.action_type = 'LOGIN' OR NEW.action_type = 'USER_LOGIN')
    EXECUTE FUNCTION trigger_schedule_update_on_activity();

-- Keep the existing trigger for real-time updates on schedule modifications
CREATE OR REPLACE FUNCTION public.trigger_update_schedule_statuses()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Call the update function after any change to patientschedule table
    PERFORM update_patient_schedule_statuses();
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger that runs after INSERT or UPDATE on patientschedule table
CREATE OR REPLACE TRIGGER patientschedule_status_update_trigger
    AFTER INSERT OR UPDATE ON patientschedule
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_update_schedule_statuses();

-- Create a scheduled function to run daily status updates (requires pg_cron extension)
-- Uncomment the following lines if pg_cron is available in your Supabase instance:
/*
-- Enable pg_cron if not already enabled
-- SELECT cron.schedule(
--     'daily-schedule-status-update',
--     '0 2 * * *',  -- Run at 2 AM daily
--     'SELECT update_patient_schedule_statuses();'
-- );
*/