BEGIN;
SET search_path = public;

-- Safety backfill: before dropping vitalsigns.immunization_id, populate immunizations.vital_id when possible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='vitalsigns' AND column_name='immunization_id'
  ) THEN
    UPDATE public.immunizations i
    SET vital_id = vs.vital_id
    FROM public.vitalsigns vs
    WHERE vs.immunization_id = i.immunization_id
      AND i.vital_id IS NULL;
  END IF;
END$$;

-- Drop dependent policy first to allow column removal
DROP POLICY IF EXISTS vitalsigns_read ON public.vitalsigns;

-- Drop dependent index if it exists
DROP INDEX IF EXISTS public.idx_vitalsigns_immunization_active;

-- Drop dependent constraints on vitalsigns.immunization_id
ALTER TABLE public.vitalsigns DROP CONSTRAINT IF EXISTS vitalsigns_immunization_id_fkey;
ALTER TABLE public.vitalsigns DROP CONSTRAINT IF EXISTS vitalsigns_visit_or_immunization_chk;

-- Finally, drop the column
ALTER TABLE public.vitalsigns DROP COLUMN IF EXISTS immunization_id;

-- Recreate vitalsigns_read policy without relying on immunization_id
-- Guardians can see vitalsigns if:
--  - via visit chain: vitalsigns.visit_id -> visits.patient_id -> guardian
--  - via immunization chain: immunizations.vital_id = vitalsigns.vital_id -> (patient via i.patient_id or i.visit_id)
--  - via deworming chain: deworming.vital_id = vitalsigns.vital_id -> (patient via d.patient_id or d.visit_id)
--  - via vitamina chain: vitamina.vital_id = vitalsigns.vital_id -> (patient via va.patient_id or va.visit_id)
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
    NOT is_deleted AND EXISTS (
      SELECT 1
      FROM immunizations i
      LEFT JOIN visits v ON v.visit_id = i.visit_id
      JOIN patients p ON p.patient_id = COALESCE(i.patient_id, v.patient_id)
      JOIN guardians g ON g.guardian_id = p.guardian_id
      WHERE i.vital_id = vitalsigns.vital_id
        AND g.user_id = public.current_app_user_id()
        AND p.is_deleted = false
    )
  )
  OR (
    NOT is_deleted AND EXISTS (
      SELECT 1
      FROM deworming d
      LEFT JOIN visits v ON v.visit_id = d.visit_id
      JOIN patients p ON p.patient_id = COALESCE(d.patient_id, v.patient_id)
      JOIN guardians g ON g.guardian_id = p.guardian_id
      WHERE d.vital_id = vitalsigns.vital_id
        AND g.user_id = public.current_app_user_id()
        AND p.is_deleted = false
    )
  )
  OR (
    NOT is_deleted AND EXISTS (
      SELECT 1
      FROM vitamina va
      LEFT JOIN visits v ON v.visit_id = va.visit_id
      JOIN patients p ON p.patient_id = COALESCE(va.patient_id, v.patient_id)
      JOIN guardians g ON g.guardian_id = p.guardian_id
      WHERE va.vital_id = vitalsigns.vital_id
        AND g.user_id = public.current_app_user_id()
        AND p.is_deleted = false
    )
  )
);

COMMIT;
