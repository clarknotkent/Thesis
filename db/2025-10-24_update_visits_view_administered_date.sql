-- Update visits_view to include administered_date and outside field in immunizations_given
-- This will allow the frontend to display vaccine administered dates and determine if visit was outside facility

CREATE OR REPLACE VIEW visits_view AS
SELECT
  v.visit_id,
  v.patient_id,
  p.full_name AS patient_name,
  v.visit_date,
  v.findings,
  v.service_rendered,
  ru.full_name AS recorded_by,
  (
    SELECT COALESCE(json_agg(json_build_object(
             'vaccine_id', im.vaccine_id,
             'antigen_name', vm.antigen_name,
             'dose_number', im.dose_number,
             'administered_date', timezone('Asia/Manila', im.administered_date::timestamptz),
             'outside', COALESCE(im.outside, false)
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