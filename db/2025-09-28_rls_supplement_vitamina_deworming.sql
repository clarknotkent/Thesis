-- Supplemental RLS policies for vitamina and deworming tables
-- Applies the same guardian/clinician access pattern as patients/immunizations.

BEGIN;
SET search_path = public;

-- Helpers are expected to be created by prepare RLS script:
-- public.current_app_role() and public.current_app_user_id()

-- Vitamina
DO $$
DECLARE r record;
BEGIN
  IF to_regclass('public.vitamina') IS NOT NULL THEN
    ALTER TABLE public.vitamina ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies to avoid overlaps
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='vitamina' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.vitamina', r.policyname);
    END LOOP;

    -- Clinicians: read non-deleted
    CREATE POLICY vitamina_read_clinicians ON public.vitamina
      FOR SELECT USING (
        current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role')
        AND is_deleted = false
      );

    -- Guardians: read rows for their dependents (via visit -> patient)
    CREATE POLICY vitamina_read_guardians ON public.vitamina
      FOR SELECT USING (
        current_app_role() = 'Guardian'
        AND EXISTS (
          SELECT 1
          FROM visits v
          JOIN patients p ON p.patient_id = v.patient_id
          WHERE v.visit_id = vitamina.visit_id
            AND p.guardian_id = (SELECT g.guardian_id FROM guardians g WHERE g.user_id = current_app_user_id())
            AND p.is_deleted = false
        )
        AND vitamina.is_deleted = false
      );

    -- Writes restricted to clinicians/admin/service
    CREATE POLICY vitamina_write ON public.vitamina
      FOR INSERT TO public
      WITH CHECK (current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
    CREATE POLICY vitamina_update ON public.vitamina
      FOR UPDATE USING (current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'))
      WITH CHECK (current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
  END IF;
END$$;

-- Deworming
DO $$
DECLARE r record;
BEGIN
  IF to_regclass('public.deworming') IS NOT NULL THEN
    ALTER TABLE public.deworming ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies to avoid overlaps
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='deworming' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.deworming', r.policyname);
    END LOOP;

    -- Clinicians: read non-deleted
    CREATE POLICY deworming_read_clinicians ON public.deworming
      FOR SELECT USING (
        current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role')
        AND is_deleted = false
      );

    -- Guardians: read rows for their dependents (via visit -> patient)
    CREATE POLICY deworming_read_guardians ON public.deworming
      FOR SELECT USING (
        current_app_role() = 'Guardian'
        AND EXISTS (
          SELECT 1
          FROM visits v
          JOIN patients p ON p.patient_id = v.patient_id
          WHERE v.visit_id = deworming.visit_id
            AND p.guardian_id = (SELECT g.guardian_id FROM guardians g WHERE g.user_id = current_app_user_id())
            AND p.is_deleted = false
        )
        AND deworming.is_deleted = false
      );

    -- Writes restricted to clinicians/admin/service
    CREATE POLICY deworming_write ON public.deworming
      FOR INSERT TO public
      WITH CHECK (current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
    CREATE POLICY deworming_update ON public.deworming
      FOR UPDATE USING (current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'))
      WITH CHECK (current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
  END IF;
END$$;

COMMIT;
