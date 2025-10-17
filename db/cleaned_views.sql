-- Cleaned and fixed views for the "public" schema
-- Source of truth: Thesis/schema overview.txt and triggers & functions.txt (catalog)
-- Notes:
-- - No table/column names were changed.
-- - Computed columns in views are explicitly derived here.
-- - Where original logic wasn’t available, conservative, documented assumptions were used (see DATABASE_CLEANUP_NOTES.md).

SET search_path = public;

BEGIN;

-- Ensure clean replace by dropping existing views first (avoids type-change conflicts)
DROP VIEW IF EXISTS
  activitylogs_view,
  conversations_view,
  dashboard_view,
  defaulters_view,
  duesoon_view,
  immunizationhistory_view,
  inventorylowstock_view,
  monthlyreports_view,
  notifications_view,
  patients_view,
  patientschedule_view,
  tcl_view,
  users_with_uuid,
  vaccine_report_view,
  visits_view,
  worker_progress_view
CASCADE;

-- 1) activitylogs_view
CREATE OR REPLACE VIEW activitylogs_view AS
SELECT
  a.log_id,
  a.user_id,
  a.action_type,
  a.entity_type,
  a.entity_id,
  a.description,
  a.old_value,
  a.new_value,
  timezone('Asia/Manila', a."timestamp"::timestamptz) AS "timestamp",
  COALESCE(u.full_name, 'System') AS user_fullname,
  u.username,
  u.role AS user_role
FROM activitylogs a
LEFT JOIN users u ON u.user_id = a.user_id;

-- 2) conversations_view
CREATE OR REPLACE VIEW conversations_view AS
SELECT
  c.conversation_id,
  c.subject,
  c.created_by,
  timezone('Asia/Manila', c.created_at::timestamptz) AS created_at,
  (
    SELECT json_agg(
             json_build_object(
               'user_id', cp.user_id,
               'fullname', u.full_name,
               'joined_at', timezone('Asia/Manila', cp.joined_at::timestamptz),
               'left_at', timezone('Asia/Manila', cp.left_at::timestamptz)
             )
           ORDER BY cp.joined_at)
    FROM conversationparticipants cp
    LEFT JOIN users u ON u.user_id = cp.user_id
    WHERE cp.conversation_id = c.conversation_id
      AND COALESCE(cp.is_deleted, false) = false
  ) AS participants,
  (
    SELECT m.message_content
    FROM messages m
    WHERE m.conversation_id = c.conversation_id
      AND COALESCE(m.is_deleted, false) = false
    ORDER BY COALESCE(m.created_at, m.delivered_at, m.read_at) DESC NULLS LAST
    LIMIT 1
  ) AS latest_message,
  (
    SELECT timezone('Asia/Manila', COALESCE(m.created_at, m.delivered_at, m.read_at)::timestamptz)
    FROM messages m
    WHERE m.conversation_id = c.conversation_id
      AND COALESCE(m.is_deleted, false) = false
    ORDER BY COALESCE(m.created_at, m.delivered_at, m.read_at) DESC NULLS LAST
    LIMIT 1
  ) AS latest_message_time
FROM conversations c;

-- 3) dashboard_view
CREATE OR REPLACE VIEW dashboard_view AS
WITH stock AS (
  SELECT COALESCE(SUM(i.current_stock_level), 0)::numeric AS total_stock
  FROM inventory i
  WHERE COALESCE(i.is_deleted, false) = false
), stock_by_cat AS (
  SELECT
    vm.category,
    COALESCE(SUM(i.current_stock_level), 0) AS total
  FROM vaccinemaster vm
  LEFT JOIN inventory i ON i.vaccine_id = vm.vaccine_id AND COALESCE(i.is_deleted, false) = false
  GROUP BY vm.category
)
SELECT
  (SELECT COUNT(*) FROM patients p WHERE COALESCE(p.is_deleted, false) = false) AS total_patients,
  (SELECT COUNT(*) FROM users u WHERE COALESCE(u.is_deleted, false) = false AND u.role = 'HealthWorker') AS total_healthworkers,
  (SELECT COUNT(*) FROM users u WHERE COALESCE(u.is_deleted, false) = false AND u.role = 'Nurse') AS total_nurses,
  (SELECT COUNT(*) FROM users u WHERE COALESCE(u.is_deleted, false) = false AND u.role = 'Nutritionist') AS total_nutritionists,
  (SELECT COUNT(*) FROM guardians g WHERE COALESCE(g.is_deleted, false) = false) AS total_guardians,
  (SELECT total_stock FROM stock) AS total_vaccine_stock,
  (
    SELECT COUNT(*)
    FROM immunizations i
    WHERE COALESCE(i.is_deleted, false) = false
      AND DATE(i.administered_date) = CURRENT_DATE
  ) AS total_vaccinations_today,
  (
    SELECT COUNT(*)
    FROM patientschedule s
    WHERE COALESCE(s.is_deleted, false) = false
      AND s.actual_date IS NULL
      AND s.scheduled_date < CURRENT_DATE
  ) AS total_defaulters,
  (
    SELECT COUNT(*)
    FROM patientschedule s
    WHERE COALESCE(s.is_deleted, false) = false
      AND s.actual_date IS NULL
      AND s.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  ) AS total_due_soon,
  (
    SELECT jsonb_object_agg(stock_by_cat.category::text, stock_by_cat.total)
    FROM stock_by_cat
  ) AS stock_by_category;

-- 4) defaulters_view
CREATE OR REPLACE VIEW defaulters_view AS
SELECT
  p.patient_id,
  p.full_name AS patient_name,
  (g.surname || ', ' || g.firstname || COALESCE(' ' || g.middlename, ''))::text AS guardian_name,
  g.contact_number,
  p.barangay,
  s.vaccine_id,
  vm.antigen_name AS next_due_antigen,
  vm.category,
  s.dose_number,
  s.scheduled_date,
  'Overdue'::text AS status,
  GREATEST((CURRENT_DATE - s.scheduled_date), 0)::int AS days_overdue
FROM patientschedule s
JOIN patients p ON p.patient_id = s.patient_id
LEFT JOIN guardians g ON g.guardian_id = p.guardian_id
JOIN vaccinemaster vm ON vm.vaccine_id = s.vaccine_id
WHERE COALESCE(s.is_deleted, false) = false
  AND s.actual_date IS NULL
  AND s.scheduled_date < CURRENT_DATE;

-- 5) duesoon_view
CREATE OR REPLACE VIEW duesoon_view AS
SELECT
  p.patient_id,
  p.full_name AS patient_name,
  g.contact_number AS guardian_contact,
  vm.antigen_name AS antigen_name,
  vm.category,
  s.dose_number,
  s.scheduled_date,
  GREATEST((s.scheduled_date - CURRENT_DATE), 0)::int AS days_until_due
FROM patientschedule s
JOIN patients p ON p.patient_id = s.patient_id
LEFT JOIN guardians g ON g.guardian_id = p.guardian_id
JOIN vaccinemaster vm ON vm.vaccine_id = s.vaccine_id
WHERE COALESCE(s.is_deleted, false) = false
  AND s.actual_date IS NULL
  AND s.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';

-- 6) immunizationhistory_view
CREATE OR REPLACE VIEW immunizationhistory_view AS
SELECT
  COALESCE(im.patient_id, p.patient_id) AS patient_id,
  p.full_name AS patient_name,
  im.vaccine_id,
  vm.antigen_name,
  vm.category,
  im.dose_number,
  timezone('Asia/Manila', COALESCE(im.administered_date, v.visit_date)::timestamptz) AS immunization_date,
  u.full_name AS administered_by,
  im.remarks,
  im.inventory_id
FROM immunizations im
LEFT JOIN visits v ON v.visit_id = im.visit_id
-- allow direct linkage to patient when visit_id is null (outside immunizations)
JOIN patients p ON p.patient_id = COALESCE(im.patient_id, v.patient_id)
JOIN vaccinemaster vm ON vm.vaccine_id = im.vaccine_id
LEFT JOIN users u ON u.user_id = im.administered_by
WHERE COALESCE(im.is_deleted, false) = false;

-- 7) inventorylowstock_view
-- Assumption: minimum_threshold is a per-vaccine alert threshold.
-- Since no config table is listed, we expose a constant default (10) per vaccine.
CREATE OR REPLACE VIEW inventorylowstock_view AS
WITH inv AS (
  SELECT
    i.vaccine_id,
    COALESCE(SUM(i.current_stock_level), 0)::bigint AS current_stock_level,
    SUM(CASE WHEN i.expiration_date <= CURRENT_DATE + INTERVAL '30 days' AND COALESCE(i.current_stock_level,0) > 0 THEN 1 ELSE 0 END)::bigint AS expiration_soon_count
  FROM inventory i
  WHERE COALESCE(i.is_deleted, false) = false
  GROUP BY i.vaccine_id
)
SELECT
  vm.vaccine_id,
  vm.antigen_name,
  vm.brand_name,
  vm.category,
  COALESCE(inv.current_stock_level, 0) AS current_stock_level,
  COALESCE(inv.expiration_soon_count, 0) AS expiration_soon_count,
  10::integer AS minimum_threshold
FROM vaccinemaster vm
LEFT JOIN inv ON inv.vaccine_id = vm.vaccine_id
WHERE COALESCE(vm.is_deleted, false) = false;

-- 8) monthlyreports_view
CREATE OR REPLACE VIEW monthlyreports_view AS
WITH im AS (
  SELECT im.immunization_id, im.vaccine_id, im.dose_number, COALESCE(im.administered_date, v.visit_date) AS administered_on, p.sex
  FROM immunizations im
  LEFT JOIN visits v ON v.visit_id = im.visit_id
  JOIN patients p ON p.patient_id = v.patient_id
  WHERE COALESCE(im.is_deleted, false) = false
), im_month AS (
  SELECT to_char(administered_date, 'YYYY-MM') AS report_month,
         COUNT(*) AS total_vaccinated,
         COUNT(*) FILTER (WHERE p.sex = 'Male') AS male_vaccinated,
         COUNT(*) FILTER (WHERE p.sex = 'Female') AS female_vaccinated
  FROM immunizations im2
  LEFT JOIN visits v2 ON v2.visit_id = im2.visit_id
  JOIN patients p ON p.patient_id = v2.patient_id
  WHERE COALESCE(im2.is_deleted, false) = false
  GROUP BY 1
), vitamina_month AS (
  SELECT to_char(v.visit_date, 'YYYY-MM') AS report_month, COUNT(*) AS vitamina_given
  FROM vitamina vt
  JOIN visits v ON v.visit_id = vt.visit_id
  WHERE COALESCE(vt.is_deleted, false) = false
  GROUP BY 1
), deworming_month AS (
  SELECT to_char(v.visit_date, 'YYYY-MM') AS report_month, COUNT(*) AS deworming_given
  FROM deworming d
  JOIN visits v ON v.visit_id = d.visit_id
  WHERE COALESCE(d.is_deleted, false) = false
  GROUP BY 1
), usage_antigen AS (
  SELECT to_char(COALESCE(im.administered_date, v.visit_date), 'YYYY-MM') AS report_month,
         vm.antigen_name,
         COUNT(*) AS used
  FROM immunizations im
  LEFT JOIN visits v ON v.visit_id = im.visit_id
  JOIN vaccinemaster vm ON vm.vaccine_id = im.vaccine_id
  WHERE COALESCE(im.is_deleted, false) = false
  GROUP BY 1,2
), usage_brand AS (
  SELECT to_char(COALESCE(im.administered_date, v.visit_date), 'YYYY-MM') AS report_month,
         vm.brand_name,
         COUNT(*) AS used
  FROM immunizations im
  LEFT JOIN visits v ON v.visit_id = im.visit_id
  JOIN vaccinemaster vm ON vm.vaccine_id = im.vaccine_id
  WHERE COALESCE(im.is_deleted, false) = false
  GROUP BY 1,2
), usage_category AS (
  SELECT to_char(COALESCE(im.administered_date, v.visit_date), 'YYYY-MM') AS report_month,
         vm.category,
         COUNT(*) AS used
  FROM immunizations im
  LEFT JOIN visits v ON v.visit_id = im.visit_id
  JOIN vaccinemaster vm ON vm.vaccine_id = im.vaccine_id
  WHERE COALESCE(im.is_deleted, false) = false
  GROUP BY 1,2
)
SELECT
  m.report_month,
  COALESCE(m.count, 0)::bigint AS total_patients_seen,
  COALESCE(im_month.male_vaccinated, 0)::bigint AS male_vaccinated,
  COALESCE(im_month.female_vaccinated, 0)::bigint AS female_vaccinated,
  COALESCE(im_month.total_vaccinated, 0)::bigint AS total_vaccinated,
  COALESCE(vm.vitamina_given, 0)::bigint AS vitamina_given,
  COALESCE(dw.deworming_given, 0)::bigint AS deworming_given,
  (
    SELECT jsonb_object_agg(antigen_name, used)
    FROM usage_antigen ua
    WHERE ua.report_month = m.report_month
  ) AS vaccines_used_by_antigen,
  (
    SELECT jsonb_object_agg(brand_name, used)
    FROM usage_brand ub
    WHERE ub.report_month = m.report_month
  ) AS vaccines_used_by_brand,
  (
    SELECT jsonb_object_agg(category::text, used)
    FROM usage_category uc
    WHERE uc.report_month = m.report_month
  ) AS vaccines_used_by_category
FROM (
  SELECT to_char(visit_date, 'YYYY-MM') AS report_month, COUNT(*)
  FROM visits
  GROUP BY 1
) m
LEFT JOIN im_month ON im_month.report_month = m.report_month
LEFT JOIN vitamina_month vm ON vm.report_month = m.report_month
LEFT JOIN deworming_month dw ON dw.report_month = m.report_month;

-- 9) notifications_view
CREATE OR REPLACE VIEW notifications_view AS
SELECT
  n.notification_id,
  n.channel,
  n.recipient_user_id,
  n.recipient_phone,
  n.recipient_email,
  n.template_code,
  n.message_body,
  n.related_entity_type,
  n.related_entity_id,
  timezone('Asia/Manila', n.scheduled_at::timestamptz) AS scheduled_at,
  timezone('Asia/Manila', n.sent_at::timestamptz) AS sent_at,
  n.status,
  n.error_message,
  n.created_by,
  timezone('Asia/Manila', n.created_at::timestamptz) AS created_at,
  n.is_deleted,
  timezone('Asia/Manila', n.deleted_at::timestamptz) AS deleted_at,
  n.deleted_by,
  (u.full_name)::text AS recipient_name
FROM notifications n
LEFT JOIN users u ON u.user_id = n.recipient_user_id;

-- 10) patients_view
CREATE OR REPLACE VIEW patients_view AS
SELECT
  p.patient_id,
  p.surname,
  p.firstname,
  p.middlename,
  p.sex,
  p.date_of_birth,
  p.address,
  p.barangay,
  p.health_center,
  timezone('Asia/Manila', p.date_registered::timestamptz) AS date_registered,
  p.mother_name,
  p.mother_occupation,
  p.mother_contact_number,
  p.father_name,
  p.father_occupation,
  p.father_contact_number,
  p.guardian_id,
  g.surname AS guardian_surname,
  g.firstname AS guardian_firstname,
  g.middlename AS guardian_middlename,
  g.birthdate AS guardian_birthdate,
  g.address AS guardian_address,
  g.occupation AS guardian_occupation,
  g.contact_number AS guardian_contact_number,
  g.alternative_contact_number AS guardian_alternative_contact_number,
  g.email AS guardian_email,
  p.relationship_to_guardian,
  g.family_number AS guardian_family_number,
  timezone('Asia/Manila', g.date_registered::timestamptz) AS guardian_date_registered,
  g.user_id AS guardian_user_id,
  p.tags,
  p.is_deleted,
  timezone('Asia/Manila', p.deleted_at::timestamptz) AS deleted_at,
  p.deleted_by,
  timezone('Asia/Manila', p.created_at::timestamptz) AS created_at,
  p.created_by,
  timezone('Asia/Manila', p.updated_at::timestamptz) AS updated_at,
  p.updated_by,
  p.full_name,
  (
    SELECT timezone('Asia/Manila', MAX(COALESCE(im.administered_date, v.visit_date))::timestamptz)
    FROM immunizations im
    LEFT JOIN visits v ON v.visit_id = im.visit_id
    WHERE COALESCE(im.is_deleted, false) = false
      AND COALESCE(im.patient_id, v.patient_id) = p.patient_id
  ) AS last_vaccination_date,
  b.birthhistory_id,
  b.birth_weight,
  b.birth_length,
  b.place_of_birth,
  b.address_at_birth,
  b.time_of_birth,
  b.attendant_at_birth,
  b.type_of_delivery,
  b.ballards_score,
  b.hearing_test_date,
  b.newborn_screening_date,
  b.newborn_screening_result
FROM patients p
LEFT JOIN guardians g ON g.guardian_id = p.guardian_id
LEFT JOIN birthhistory b ON b.patient_id = p.patient_id
WHERE COALESCE(p.is_deleted, false) = false;

-- 11) patientschedule_view
CREATE OR REPLACE VIEW patientschedule_view AS
SELECT
  s.patient_schedule_id,
  s.patient_id,
  p.full_name AS patient_name,
  s.vaccine_id,
  vm.antigen_name,
  vm.category,
  s.dose_number,
  s.scheduled_date,
  s.eligible_date,
  s.actual_date,
  s.status,
  CASE
    WHEN s.actual_date IS NULL AND s.scheduled_date < CURRENT_DATE
      THEN GREATEST((CURRENT_DATE - s.scheduled_date), 0)::int
    ELSE 0
  END AS days_overdue,
  timezone('Asia/Manila', s.created_at::timestamptz) AS created_at,
  timezone('Asia/Manila', s.updated_at::timestamptz) AS updated_at,
  s.created_by,
  s.updated_by
FROM patientschedule s
JOIN patients p ON p.patient_id = s.patient_id
JOIN vaccinemaster vm ON vm.vaccine_id = s.vaccine_id
WHERE COALESCE(s.is_deleted, false) = false;

-- 12) tcl_view (Target Client List summary)
CREATE OR REPLACE VIEW tcl_view AS
WITH latest_visit AS (
  SELECT v.patient_id, MAX(v.visit_date) AS latest_visit_date
  FROM visits v
  GROUP BY v.patient_id
), imm_status AS (
  -- Summarize last known status per antigen for each patient
  SELECT s.patient_id,
         jsonb_agg(
           jsonb_build_object(
             'antigen', vm.antigen_name,
             'dose', s.dose_number,
             'status', s.status,
             'scheduled_date', s.scheduled_date,
             'actual_date', s.actual_date
           ) ORDER BY vm.antigen_name, s.dose_number
         ) AS immunization_status
  FROM patientschedule s
  JOIN vaccinemaster vm ON vm.vaccine_id = s.vaccine_id
  WHERE COALESCE(s.is_deleted, false) = false
  GROUP BY s.patient_id
), vit_status AS (
  SELECT v.patient_id, CASE WHEN COUNT(vt.vitamina_id) > 0 THEN 'Yes' ELSE 'No' END AS vitamina_status
  FROM visits v
  LEFT JOIN vitamina vt ON vt.visit_id = v.visit_id AND COALESCE(vt.is_deleted, false) = false
  GROUP BY v.patient_id
), dew_status AS (
  SELECT v.patient_id, CASE WHEN COUNT(d.deworming_id) > 0 THEN 'Yes' ELSE 'No' END AS deworming_status
  FROM visits v
  LEFT JOIN deworming d ON d.visit_id = v.visit_id AND COALESCE(d.is_deleted, false) = false
  GROUP BY v.patient_id
)
SELECT
  p.patient_id,
  p.full_name AS patient_name,
  p.sex,
  p.date_of_birth,
  EXTRACT(EPOCH FROM (CURRENT_DATE::timestamp - p.date_of_birth::timestamp)) / (30*24*60*60)::double precision AS age_months,
  EXTRACT(EPOCH FROM (CURRENT_DATE::timestamp - p.date_of_birth::timestamp)) / (24*60*60)::double precision AS age_days,
  p.barangay,
  p.health_center,
  (g.surname || ', ' || g.firstname || COALESCE(' ' || g.middlename, ''))::text AS guardian_name,
  g.contact_number AS guardian_contact,
  timezone('Asia/Manila', lv.latest_visit_date::timestamptz) AS latest_visit_date,
  COALESCE(isx.immunization_status, '[]'::jsonb) AS immunization_status,
  COALESCE(vsx.vitamina_status, 'No') AS vitamina_status,
  COALESCE(dsx.deworming_status, 'No') AS deworming_status,
  p.tags
FROM patients p
LEFT JOIN guardians g ON g.guardian_id = p.guardian_id
LEFT JOIN latest_visit lv ON lv.patient_id = p.patient_id
LEFT JOIN imm_status isx ON isx.patient_id = p.patient_id
LEFT JOIN vit_status vsx ON vsx.patient_id = p.patient_id
LEFT JOIN dew_status dsx ON dsx.patient_id = p.patient_id
WHERE COALESCE(p.is_deleted, false) = false;

-- 13) users_with_uuid
CREATE OR REPLACE VIEW users_with_uuid AS
SELECT
  u.user_id,
  u.username,
  u.email,
  u.role,
  u.hw_type,
  u.firstname,
  u.middlename,
  u.surname,
  u.contact_number,
  u.address,
  u.sex,
  u.birthdate,
  u.employee_id,
  u.professional_license_no,
  u.created_by,
  u.updated_by,
  timezone('Asia/Manila', u.date_registered::timestamptz) AS date_registered,
  timezone('Asia/Manila', u.last_login::timestamptz) AS last_login,
  u.is_deleted,
  m.uuid AS supabase_uuid
FROM users u
LEFT JOIN user_mapping m ON m.user_id = u.user_id;

-- 14) vaccine_report_view
CREATE OR REPLACE VIEW vaccine_report_view AS
WITH base AS (
  SELECT
    vm.antigen_name,
    im.dose_number,
    p.sex,
    CASE WHEN COALESCE(im.administered_date, v.visit_date) <= p.date_of_birth + INTERVAL '1 day'
         THEN 'within' ELSE 'after' END AS timing
  FROM immunizations im
  LEFT JOIN visits v ON v.visit_id = im.visit_id
  JOIN patients p ON p.patient_id = v.patient_id
  JOIN vaccinemaster vm ON vm.vaccine_id = im.vaccine_id
  WHERE COALESCE(im.is_deleted, false) = false
)
SELECT
  antigen_name,
  dose_number,
  COUNT(*) FILTER (WHERE timing = 'within')::bigint AS within_24h_total,
  COUNT(*) FILTER (WHERE timing = 'within' AND sex = 'Male')::bigint AS within_24h_male,
  COUNT(*) FILTER (WHERE timing = 'within' AND sex = 'Female')::bigint AS within_24h_female,
  COUNT(*) FILTER (WHERE timing = 'after')::bigint AS after_24h_total,
  COUNT(*) FILTER (WHERE timing = 'after' AND sex = 'Male')::bigint AS after_24h_male,
  COUNT(*) FILTER (WHERE timing = 'after' AND sex = 'Female')::bigint AS after_24h_female
FROM base
GROUP BY antigen_name, dose_number
ORDER BY antigen_name, dose_number;

-- 15) visits_view
CREATE OR REPLACE VIEW visits_view AS
SELECT
  v.visit_id,
  v.patient_id,
  p.full_name AS patient_name,
  timezone('Asia/Manila', v.visit_date::timestamptz) AS visit_date,
  v.findings,
  v.service_rendered,
  ru.full_name AS recorded_by,
  (
    SELECT COALESCE(json_agg(json_build_object(
             'vaccine_id', im.vaccine_id,
             'antigen_name', vm.antigen_name,
             'dose_number', im.dose_number
           ) ORDER BY vm.antigen_name, im.dose_number), '[]'::json)
    FROM immunizations im
    JOIN vaccinemaster vm ON vm.vaccine_id = im.vaccine_id
    WHERE im.visit_id = v.visit_id AND COALESCE(im.is_deleted, false) = false
  ) AS immunizations_given,
  EXISTS (
    SELECT 1 FROM vitamina vt
    WHERE vt.visit_id = v.visit_id AND COALESCE(vt.is_deleted, false) = false
  ) AS vitamina_given,
  EXISTS (
    SELECT 1 FROM deworming d
    WHERE d.visit_id = v.visit_id AND COALESCE(d.is_deleted, false) = false
  ) AS deworming_given,
  (
    SELECT json_build_object(
             'temperature', vs.temperature,
             'respiration_rate', vs.respiration_rate,
             'weight', vs.weight,
             'height_length', vs.height_length,
             'muac', vs.muac
           )
    FROM vitalsigns vs
    WHERE vs.visit_id = v.visit_id AND COALESCE(vs.is_deleted, false) = false
    ORDER BY vs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS vital_signs
FROM visits v
JOIN patients p ON p.patient_id = v.patient_id
LEFT JOIN users ru ON ru.user_id = v.recorded_by
WHERE COALESCE(v.is_deleted, false) = false;

-- 16) worker_progress_view
CREATE OR REPLACE VIEW worker_progress_view AS
SELECT
  u.user_id,
  u.role,
  u.firstname,
  u.surname,
  (
    SELECT COUNT(*) FROM immunizations im
    WHERE im.administered_by = u.user_id AND COALESCE(im.is_deleted, false) = false
  )::bigint AS vaccines_administered,
  (
    SELECT COUNT(*) FROM vitamina vt
    WHERE vt.administered_by = u.user_id AND COALESCE(vt.is_deleted, false) = false
  )::bigint AS vitamina_administered,
  (
    SELECT COUNT(*) FROM deworming d
    WHERE d.administered_by = u.user_id AND COALESCE(d.is_deleted, false) = false
  )::bigint AS deworming_administered
FROM users u
WHERE COALESCE(u.is_deleted, false) = false;

-- End of cleaned views
