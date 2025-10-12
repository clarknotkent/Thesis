-- Vaccination reminder notifications scheduler
-- Runs daily to check for upcoming vaccinations and schedule reminders

BEGIN;
SET search_path = public;

-- Function to send vaccination reminders
CREATE OR REPLACE FUNCTION public.schedule_vaccination_reminders()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  reminder_record RECORD;
  reminder_days INTEGER;
  reminder_date DATE;
  template_code TEXT;
  message_text TEXT;
BEGIN
  -- 14-day reminders
  FOR reminder_record IN
    SELECT
      ps.patient_schedule_id,
      ps.patient_id,
      ps.vaccine_id,
      ps.dose_number,
      ps.scheduled_date,
      pv.full_name,
      pv.guardian_user_id,
      pv.guardian_contact_number,
      pv.guardian_email,
      vm.antigen_name,
      vm.brand_name
    FROM patientschedule ps
    JOIN patients_view pv ON ps.patient_id = pv.patient_id
    JOIN vaccinemaster vm ON ps.vaccine_id = vm.vaccine_id
    WHERE ps.status = 'scheduled'
      AND ps.is_deleted = false
      AND ps.scheduled_date = CURRENT_DATE + INTERVAL '14 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.related_entity_type = 'patient_schedule'
          AND n.related_entity_id = ps.patient_schedule_id
          AND n.template_code = 'vaccination_reminder_14'
          AND n.is_deleted = false
      )
  LOOP
    INSERT INTO notifications (
      channel, recipient_user_id, recipient_phone, recipient_email,
      template_code, message_body, related_entity_type, related_entity_id,
      scheduled_at, status, created_by
    ) VALUES (
      'in-app', reminder_record.guardian_user_id, reminder_record.guardian_contact_number, reminder_record.guardian_email,
      'vaccination_reminder_14',
      format('Reminder: %s vaccination (Dose %s) for %s is scheduled in 14 days on %s.',
             reminder_record.antigen_name, reminder_record.dose_number, reminder_record.full_name, reminder_record.scheduled_date),
      'patient_schedule', reminder_record.patient_schedule_id,
      CURRENT_TIMESTAMP, 'pending', NULL
    );
  END LOOP;

  -- 7-day reminders
  FOR reminder_record IN
    SELECT
      ps.patient_schedule_id,
      ps.patient_id,
      ps.vaccine_id,
      ps.dose_number,
      ps.scheduled_date,
      pv.full_name,
      pv.guardian_user_id,
      pv.guardian_contact_number,
      pv.guardian_email,
      vm.antigen_name,
      vm.brand_name
    FROM patientschedule ps
    JOIN patients_view pv ON ps.patient_id = pv.patient_id
    JOIN vaccinemaster vm ON ps.vaccine_id = vm.vaccine_id
    WHERE ps.status = 'scheduled'
      AND ps.is_deleted = false
      AND ps.scheduled_date = CURRENT_DATE + INTERVAL '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.related_entity_type = 'patient_schedule'
          AND n.related_entity_id = ps.patient_schedule_id
          AND n.template_code = 'vaccination_reminder_7'
          AND n.is_deleted = false
      )
  LOOP
    INSERT INTO notifications (
      channel, recipient_user_id, recipient_phone, recipient_email,
      template_code, message_body, related_entity_type, related_entity_id,
      scheduled_at, status, created_by
    ) VALUES (
      'in-app', reminder_record.guardian_user_id, reminder_record.guardian_contact_number, reminder_record.guardian_email,
      'vaccination_reminder_7',
      format('Reminder: %s vaccination (Dose %s) for %s is scheduled in 7 days on %s.',
             reminder_record.antigen_name, reminder_record.dose_number, reminder_record.full_name, reminder_record.scheduled_date),
      'patient_schedule', reminder_record.patient_schedule_id,
      CURRENT_TIMESTAMP, 'pending', NULL
    );
  END LOOP;

  -- Due date reminders (0 days)
  FOR reminder_record IN
    SELECT
      ps.patient_schedule_id,
      ps.patient_id,
      ps.vaccine_id,
      ps.dose_number,
      ps.scheduled_date,
      pv.full_name,
      pv.guardian_user_id,
      pv.guardian_contact_number,
      pv.guardian_email,
      vm.antigen_name,
      vm.brand_name
    FROM patientschedule ps
    JOIN patients_view pv ON ps.patient_id = pv.patient_id
    JOIN vaccinemaster vm ON ps.vaccine_id = vm.vaccine_id
    WHERE ps.status = 'scheduled'
      AND ps.is_deleted = false
      AND ps.scheduled_date = CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.related_entity_type = 'patient_schedule'
          AND n.related_entity_id = ps.patient_schedule_id
          AND n.template_code = 'vaccination_reminder_0'
          AND n.is_deleted = false
      )
  LOOP
    INSERT INTO notifications (
      channel, recipient_user_id, recipient_phone, recipient_email,
      template_code, message_body, related_entity_type, related_entity_id,
      scheduled_at, status, created_by
    ) VALUES (
      'in-app', reminder_record.guardian_user_id, reminder_record.guardian_contact_number, reminder_record.guardian_email,
      'vaccination_reminder_0',
      format('Reminder: %s vaccination (Dose %s) for %s is due today (%s).',
             reminder_record.antigen_name, reminder_record.dose_number, reminder_record.full_name, reminder_record.scheduled_date),
      'patient_schedule', reminder_record.patient_schedule_id,
      CURRENT_TIMESTAMP, 'pending', NULL
    );
  END LOOP;

  -- Overdue notifications (missed vaccinations)
  FOR reminder_record IN
    SELECT
      ps.patient_schedule_id,
      ps.patient_id,
      ps.vaccine_id,
      ps.dose_number,
      ps.scheduled_date,
      pv.full_name,
      pv.guardian_user_id,
      pv.guardian_contact_number,
      pv.guardian_email,
      vm.antigen_name,
      vm.brand_name
    FROM patientschedule ps
    JOIN patients_view pv ON ps.patient_id = pv.patient_id
    JOIN vaccinemaster vm ON ps.vaccine_id = vm.vaccine_id
    WHERE ps.status = 'scheduled'
      AND ps.is_deleted = false
      AND ps.scheduled_date < CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.related_entity_type = 'patient_schedule'
          AND n.related_entity_id = ps.patient_schedule_id
          AND n.template_code = 'vaccination_overdue'
          AND n.is_deleted = false
      )
  LOOP
    INSERT INTO notifications (
      channel, recipient_user_id, recipient_phone, recipient_email,
      template_code, message_body, related_entity_type, related_entity_id,
      scheduled_at, status, created_by
    ) VALUES (
      'in-app', reminder_record.guardian_user_id, reminder_record.guardian_contact_number, reminder_record.guardian_email,
      'vaccination_overdue',
      format('Alert: %s vaccination (Dose %s) for %s was due on %s and has not been administered.',
             reminder_record.antigen_name, reminder_record.dose_number, reminder_record.full_name, reminder_record.scheduled_date),
      'patient_schedule', reminder_record.patient_schedule_id,
      CURRENT_TIMESTAMP, 'pending', NULL
    );
  END LOOP;

END;
$$;

-- Schedule the reminder function to run daily at 9 AM
DO $$
DECLARE v_job_id integer;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule any existing job with the same name
    SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'vaccination_reminders_daily' LIMIT 1;
    IF v_job_id IS NOT NULL THEN
      PERFORM cron.unschedule(v_job_id);
    END IF;
    -- Schedule daily at 9 AM
    PERFORM cron.schedule(
      'vaccination_reminders_daily',
      '0 9 * * *',
      'SELECT public.schedule_vaccination_reminders();'
    );
  END IF;
END$$;

COMMIT;