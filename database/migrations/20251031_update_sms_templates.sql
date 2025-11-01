BEGIN;

-- Update 1-week template to clean multi-line format (on {scheduled_date})
UPDATE sms_templates
SET template = E'Good Day, {guardian_title} {guardian_last_name}! This is a reminder that your child, {patient_name} has scheduled on {scheduled_date} for the following vaccines:\n\n{vaccine_lines}\n\nSee you there! Thank you!',
    updated_at = now()
WHERE lower(trigger_type) = '1-week' AND COALESCE(is_deleted,false) = false;

-- Update 3-days template to clean multi-line format (on {scheduled_date})
UPDATE sms_templates
SET template = E'Good Day, {guardian_title} {guardian_last_name}! This is a reminder that your child, {patient_name} has scheduled on {scheduled_date} for the following vaccines:\n\n{vaccine_lines}\n\nSee you there! Thank you!',
    updated_at = now()
WHERE lower(trigger_type) = '3-days' AND COALESCE(is_deleted,false) = false;

-- Update 1-day template to clean multi-line format (tomorrow, {scheduled_date})
UPDATE sms_templates
SET template = E'Good Day, {guardian_title} {guardian_last_name}! This is a reminder that your child, {patient_name} has scheduled tomorrow, {scheduled_date} for the following vaccines:\n\n{vaccine_lines}\n\nSee you there! Thank you!',
    updated_at = now()
WHERE lower(trigger_type) = '1-day' AND COALESCE(is_deleted,false) = false;

-- Update 0-day template to clean multi-line format (today, {scheduled_date})
UPDATE sms_templates
SET template = E'Good Day, {guardian_title} {guardian_last_name}! This is a reminder that your child, {patient_name} has scheduled today, {scheduled_date} for the following vaccines:\n\n{vaccine_lines}\n\nSee you! Thank you!',
    updated_at = now()
WHERE lower(trigger_type) = '0-day' AND COALESCE(is_deleted,false) = false;

-- Update general manual notice to clean multi-line format (on {scheduled_date})
UPDATE sms_templates
SET template = E'Good Day, {guardian_title} {guardian_last_name}! This is a reminder that your child, {patient_name} has scheduled on {scheduled_date} for the following vaccines:\n\n{vaccine_lines}\n\nSee you there! Thank you!',
    updated_at = now()
WHERE lower(trigger_type) = 'manual' AND COALESCE(is_deleted,false) = false
  AND (lower(name) NOT LIKE 'reschedule%' AND lower(name) NOT LIKE 're-schedule%');

-- Ensure a dedicated reschedule template exists (backend looks up trigger_type = 'reschedule')
-- First, attempt to convert any manual template clearly marked as reschedule
UPDATE sms_templates
SET trigger_type = 'reschedule',
    template = E'Good Day, {guardian_title} {guardian_last_name}! Your child, {patient_name}, has updated appointments. New schedule(s): {schedule_summary}. Thank you!',
    is_active = true,
    updated_at = now()
WHERE lower(trigger_type) = 'manual'
  AND (lower(name) LIKE 'reschedule%' OR lower(name) LIKE 're-schedule%')
  AND COALESCE(is_deleted,false) = false;

-- If no reschedule template exists, insert one
INSERT INTO sms_templates (name, template, trigger_type, time_range, is_active, is_deleted, created_at, updated_at)
SELECT 'Reschedule Alert',
  E'Good Day, {guardian_title} {guardian_last_name}! Your child, {patient_name}, has updated appointments. New schedule(s): {schedule_summary}. Thank you!',
       'reschedule',
       'day',
       true,
       false,
       now(),
       now()
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates WHERE lower(trigger_type) = 'reschedule' AND COALESCE(is_deleted,false) = false
);

COMMIT;
