BEGIN;

-- Update existing SMS logs' message to the new clean format in place
-- This updates logs that have linked patient schedules (via sms_log_patientschedule)
-- It uses the template referenced by sms_logs.template_id when available;
-- otherwise falls back to a clean default that includes {vaccine_lines} and long dates.

WITH log_core AS (
  SELECT l.id AS log_id, l.patient_id, l.guardian_id, l.template_id, l.scheduled_at, l.type, l.status
  FROM sms_logs l
),
link_ps AS (
  SELECT
    slp.sms_log_id AS log_id,
    ps.patient_schedule_id,
    ps.vaccine_id,
    COALESCE(ps.dose_number, 1) AS dose_number,
    ps.scheduled_date::date AS sched_date
  FROM sms_log_patientschedule slp
  JOIN patientschedule ps ON ps.patient_schedule_id = slp.patient_schedule_id
  WHERE ps.is_deleted = false
),
with_vax AS (
  SELECT
    lp.log_id,
    lp.sched_date,
    string_agg(DISTINCT vm.antigen_name, ', ' ORDER BY vm.antigen_name) AS vaccine_names,
    string_agg('Dose ' || lp.dose_number::text, ', ' ORDER BY lp.dose_number) AS dose_numbers,
    string_agg(
      format('%s — Dose %s', COALESCE(vm.antigen_name, 'vaccine'), lp.dose_number),
      E',\n' ORDER BY vm.antigen_name, lp.dose_number
    ) AS vaccine_lines
  FROM link_ps lp
  LEFT JOIN vaccinemaster vm ON vm.vaccine_id = lp.vaccine_id
  GROUP BY lp.log_id, lp.sched_date
),
pat AS (
  SELECT
    lc.log_id,
    pv.full_name AS patient_name,
    pv.guardian_contact_number AS phone,
    pv.relationship_to_guardian,
    CASE 
      WHEN lower(pv.relationship_to_guardian) = 'mother' THEN 'Ms.'
      WHEN lower(pv.relationship_to_guardian) = 'father' THEN 'Mr.'
      ELSE ''
    END AS guardian_title,
    split_part(pv.full_name, ' ', array_length(string_to_array(pv.full_name, ' '), 1)) AS guardian_last_name
  FROM log_core lc
  LEFT JOIN patients_view pv ON pv.patient_id = lc.patient_id
),
with_tpl AS (
  SELECT
    lc.log_id,
    lc.patient_id,
    lc.guardian_id,
    lc.template_id,
    lc.scheduled_at,
    lc.type,
    lc.status,
    wt.sched_date,
    wt.vaccine_names,
    wt.dose_numbers,
    wt.vaccine_lines,
    pat.patient_name,
    pat.guardian_title,
    pat.guardian_last_name,
    t.template AS template_text,
    t.trigger_type
  FROM log_core lc
  JOIN with_vax wt ON wt.log_id = lc.log_id
  LEFT JOIN pat ON pat.log_id = lc.log_id
  LEFT JOIN sms_templates t ON t.id = lc.template_id
),
render AS (
  SELECT
    w.log_id,
    -- Build message using template if present; else fallback
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        COALESCE(
                          w.template_text,
                          format(
                            E'Good Day, %%s %%s! This is a reminder that your child, %%s has scheduled on %%s for the following vaccines:\n\n%%s\n\nSee you there! Thank you!'
                          )
                        ),
                        '{patient_name}', COALESCE(w.patient_name, '')
                      ),
                      '{patient_first_name}', split_part(COALESCE(w.patient_name,''), ' ', 1)
                    ),
                    '{guardian_title}', COALESCE(w.guardian_title, '')
                  ),
                  '{guardian_last_name}', COALESCE(w.guardian_last_name, '')
                ),
                '{vaccine_name}', COALESCE(w.vaccine_names, '')
              ),
              '{dose_number}', COALESCE(w.dose_numbers, '')
            ),
            '{vaccine_lines}', COALESCE(w.vaccine_lines, '')
          ),
          '{scheduled_date}', to_char(w.sched_date, 'FMMonth DD, YYYY')
        ),
        '{appointment_date}', to_char(w.sched_date, 'FMMonth DD, YYYY')
      ),
      '{health_center}', 'Barangay Health Center'
    ) AS message_replaced,
    -- Provide formatted fallback with %%s placeholders replaced
    CASE WHEN w.template_text IS NULL THEN
      format(
        E'Good Day, %s %s! This is a reminder that your child, %s has scheduled on %s for the following vaccines:\n\n%s\n\nSee you there! Thank you!',
        COALESCE(w.guardian_title, ''),
        COALESCE(w.guardian_last_name, 'Guardian'),
        COALESCE(w.patient_name, 'patient'),
        to_char(w.sched_date, 'FMMonth DD, YYYY'),
        COALESCE(w.vaccine_lines, '')
      )
    ELSE NULL END AS message_fallback
  FROM with_tpl w
)
UPDATE sms_logs l
SET message = COALESCE(r.message_replaced, r.message_fallback, l.message),
    updated_at = now()
FROM render r
WHERE r.log_id = l.id;

COMMIT;
