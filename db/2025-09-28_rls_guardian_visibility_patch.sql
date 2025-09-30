-- Patch RLS to ensure guardians can see all their child-related data and align notifications policy.
-- Safe to run after 2025-09-28_rls_refinement.sql

BEGIN;
SET search_path = public;

-- Immunizations: extend guardian visibility to include outside immunizations linked via patient_id
SELECT public._drop_policy('public','immunizations','immunizations_read');
CREATE POLICY immunizations_read ON public.immunizations FOR SELECT
USING (
  (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role') AND NOT is_deleted)
  OR (
    NOT is_deleted AND (
    (SELECT v.patient_id FROM visits v WHERE v.visit_id = immunizations.visit_id) IN (
      SELECT p.patient_id FROM patients p JOIN guardians g ON g.guardian_id=p.guardian_id WHERE g.user_id = public.current_app_user_id()
    )
    )
  )
  OR (
    NOT is_deleted AND immunizations.patient_id IS NOT NULL AND immunizations.patient_id IN (
      SELECT p.patient_id FROM patients p JOIN guardians g ON g.guardian_id=p.guardian_id WHERE g.user_id = public.current_app_user_id()
    )
  )
);

-- Vitalsigns: extend guardian visibility via immunization chain when present
SELECT public._drop_policy('public','vitalsigns','vitalsigns_read');
CREATE POLICY vitalsigns_read ON public.vitalsigns FOR SELECT
USING (
  (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role') AND NOT is_deleted)
  OR (
    NOT is_deleted AND (
      (SELECT v.patient_id FROM visits v WHERE v.visit_id = vitalsigns.visit_id)
      IN (SELECT p.patient_id FROM patients p JOIN guardians g ON g.guardian_id=p.guardian_id WHERE g.user_id = public.current_app_user_id())
    )
  )
  OR (
    NOT is_deleted AND vitalsigns.immunization_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM immunizations i
      LEFT JOIN visits v ON v.visit_id = i.visit_id
      JOIN patients p ON p.patient_id = COALESCE(i.patient_id, v.patient_id)
      JOIN guardians g ON g.guardian_id = p.guardian_id
      WHERE i.immunization_id = vitalsigns.immunization_id
        AND g.user_id = public.current_app_user_id()
        AND p.is_deleted = false
    )
  )
);

-- Birthhistory: clinicians read non-deleted; guardians read records for their dependents; writes by clinicians/admin/service
SELECT public._drop_all_policies('public','birthhistory');
CREATE POLICY birthhistory_read ON public.birthhistory FOR SELECT
USING (
  (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role') AND NOT is_deleted)
  OR (
    patient_id IN (
      SELECT p.patient_id FROM patients p JOIN guardians g ON g.guardian_id=p.guardian_id WHERE g.user_id = public.current_app_user_id() AND p.is_deleted = false
    )
    AND NOT is_deleted
  )
);
CREATE POLICY birthhistory_insert ON public.birthhistory FOR INSERT
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
CREATE POLICY birthhistory_update ON public.birthhistory FOR UPDATE
USING (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));

-- Notifications: scope to recipient_user_id (no created_by column present)
SELECT public._drop_policy('public','notifications','notifications_read');
CREATE POLICY notifications_read ON public.notifications FOR SELECT
USING (
  public.current_app_role() IN ('Admin','service_role')
  OR (recipient_user_id = public.current_app_user_id())
);

COMMIT;
