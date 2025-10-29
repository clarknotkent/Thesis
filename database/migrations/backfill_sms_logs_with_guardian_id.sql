BEGIN;

-- 1) Clear link table completely
TRUNCATE TABLE sms_log_patientschedule RESTART IDENTITY;

-- 2) Keep id=1, delete the rest in sms_logs
DELETE FROM sms_logs WHERE id <> 1;

-- 3) Reset sequence to start at 2
DO $$
DECLARE
  seq_name text;
BEGIN
  SELECT pg_get_serial_sequence('sms_logs', 'id') INTO seq_name;
  IF seq_name IS NOT NULL THEN
    PERFORM setval(seq_name, 1, true);
  END IF;
END$$;

-- 4) Backfill combined messages with vaccine names, dose numbers, guardian info
WITH base AS (
  SELECT
    ps.patient_id,
    ps.scheduled_date::date AS sched_date,
    array_agg(ps.patient_schedule_id ORDER BY ps.patient_schedule_id) AS ps_ids,
    -- Get guardian_id from patients table
    p.guardian_id,
    pv.full_name AS patient_name,
    split_part(pv.full_name, ' ', array_length(string_to_array(pv.full_name, ' '), 1)) AS guardian_last_name,
    pv.guardian_contact_number AS phone,
    pv.relationship_to_guardian,
    CASE 
      WHEN lower(pv.relationship_to_guardian) = 'mother' THEN 'Ms.'
      WHEN lower(pv.relationship_to_guardian) = 'father' THEN 'Mr.'
      ELSE ''
    END AS guardian_title,
    string_agg(DISTINCT v.antigen_name, ', ' ORDER BY v.antigen_name) AS vaccine_names,
    string_agg('Dose ' || COALESCE(ps.dose_number, 1)::text, ', ') AS dose_numbers
  FROM patientschedule ps
  JOIN patients p ON p.patient_id = ps.patient_id  -- ← Added this join to get guardian_id
  JOIN patients_view pv ON pv.patient_id = ps.patient_id
  LEFT JOIN vaccinemaster v ON v.vaccine_id = ps.vaccine_id
  WHERE ps.is_deleted = false
    AND ps.scheduled_date >= current_date
    AND pv.guardian_contact_number IS NOT NULL
  GROUP BY ps.patient_id, ps.scheduled_date::date, p.guardian_id, pv.full_name, pv.guardian_contact_number, pv.relationship_to_guardian
),
d AS (
  SELECT unnest(array[7,3,1,0]) AS days
),
rows AS (
  SELECT
    b.patient_id,
    b.guardian_id,  -- ← Pass through guardian_id
    b.sched_date,
    b.ps_ids,
    b.patient_name,
    b.guardian_last_name,
    b.guardian_title,
    b.phone,
    b.vaccine_names,
    b.dose_numbers,
    d.days AS days_until,
    ((b.sched_date - d.days) + time '08:00') AT TIME ZONE 'Asia/Manila' AS run_at
  FROM base b
  CROSS JOIN d
  WHERE (((b.sched_date - d.days) + time '08:00') AT TIME ZONE 'Asia/Manila') >= now()
),
with_trigger AS (
  SELECT
    r.*,
    CASE r.days_until
      WHEN 7 THEN '1-week'
      WHEN 3 THEN '3-days'
      WHEN 1 THEN '1-day'
      WHEN 0 THEN '0-day'
      ELSE NULL
    END AS trigger_type
  FROM rows r
),
tpl_pick AS (
  SELECT
    w.*,
    t.id AS template_id,
    t.template AS template_text
  FROM with_trigger w
  LEFT JOIN LATERAL (
    SELECT t2.id, t2.template, t2.updated_at, t2.created_at
    FROM sms_templates t2
    WHERE lower(t2.trigger_type) = lower(w.trigger_type)
      AND COALESCE(t2.is_active, true) = true
      AND COALESCE(t2.is_deleted, false) = false
    ORDER BY t2.updated_at DESC NULLS LAST,
             t2.created_at DESC NULLS LAST,
             t2.id DESC
    LIMIT 1
  ) t ON true
),
render AS (
  SELECT
    p.patient_id,
    p.guardian_id,  -- ← Pass through guardian_id
    p.sched_date,
    p.ps_ids,
    p.phone,
    p.days_until,
    p.run_at,
    p.template_id,
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
                        p.template_text,
                        format(
                          'Good Day, %s %s! This is a reminder that your child, %s has %s (%s) scheduled on %s. See you there! Thank you!',
                          COALESCE(p.guardian_title, ''),
                          COALESCE(p.guardian_last_name, 'Guardian'),
                          COALESCE(p.patient_name, 'patient'),
                          COALESCE(p.vaccine_names, 'vaccines'),
                          COALESCE(p.dose_numbers, 'Dose 1'),
                          to_char(p.sched_date, 'YYYY-MM-DD')
                        )
                      ),
                      '{patient_name}', COALESCE(p.patient_name, '')
                    ),
                    '{patient_first_name}', split_part(COALESCE(p.patient_name,''), ' ', 1)
                  ),
                  '{guardian_title}', COALESCE(p.guardian_title, '')
                ),
                '{guardian_last_name}', COALESCE(p.guardian_last_name, '')
              ),
              '{vaccine_name}', COALESCE(p.vaccine_names, '')
            ),
            '{dose_number}', COALESCE(p.dose_numbers, '')
          ),
          '{scheduled_date}', to_char(p.sched_date, 'YYYY-MM-DD')
        ),
        '{appointment_date}', to_char(p.sched_date, 'YYYY-MM-DD')
      ),
      '{health_center}', 'Barangay Health Center'
    ) AS message_text
  FROM tpl_pick p
),
ins AS (
  INSERT INTO sms_logs (
    guardian_id, patient_id, phone_number, message, type, status, scheduled_at, template_id, created_at, updated_at
  )
  SELECT
    r.guardian_id,  -- ← Use actual guardian_id instead of NULL
    r.patient_id,
    r.phone,
    r.message_text,
    'scheduled',
    'pending',
    r.run_at,
    r.template_id,
    now(), now()
  FROM render r
  RETURNING id, patient_id, guardian_id, scheduled_at
),
link AS (
  INSERT INTO sms_log_patientschedule (sms_log_id, patient_schedule_id)
  SELECT i.id, ps_id
  FROM ins i
  JOIN rows rw ON rw.patient_id = i.patient_id AND rw.guardian_id = i.guardian_id AND rw.run_at = i.scheduled_at
  CROSS JOIN LATERAL unnest(rw.ps_ids) AS ps_id
  RETURNING 1
)
SELECT
  (SELECT count(*) FROM ins)  AS sms_created,
  (SELECT count(*) FROM link) AS links_created;

COMMIT;
