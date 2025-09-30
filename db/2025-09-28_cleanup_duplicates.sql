-- Finalization cleanup: drop duplicates, obsolete functions, and patch minor gaps
-- Safe to run after:
--   1) 2025-09-28_refactor_tables.sql
--   2) cleaned_views.sql
--   3) 2025-09-28_remove_auth_helpers_prepare_rls.sql
--   4) 2025-09-28_fix_user_mapping_stability.sql
--   5) 2025-09-28_rls_refinement.sql
--   6) 2025-09-28_unify_history_triggers.sql

BEGIN;

-- 1) Drop duplicate soft_delete_row variant (keep the canonical 4-arg version)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'soft_delete_row'
      AND p.pronargs = 5
  ) THEN
    DROP FUNCTION IF EXISTS public.soft_delete_row(text, text, bigint, bigint, text);
  END IF;
END$$;

-- 2) Remove legacy per-table history trigger functions (replaced by generic history)
--    These should be orphaned after 2025-09-28_unify_history_triggers.sql recreates triggers.
DROP FUNCTION IF EXISTS public.trg_immunizations_history_fn() CASCADE;
DROP FUNCTION IF EXISTS public.trg_inventory_history_fn() CASCADE;
DROP FUNCTION IF EXISTS public.trg_inventory_requests_history_fn() CASCADE;
DROP FUNCTION IF EXISTS public.trg_deworming_history_fn() CASCADE;

-- 3) Provide a no-op ensure_activitylogs_partition(ts) to satisfy trg_activitylogs_partition()
CREATE OR REPLACE FUNCTION public.ensure_activitylogs_partition(ts timestamp)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Intentionally no-op; can be enhanced to create partitions if/when needed.
  RETURN;
END;
$$;
COMMENT ON FUNCTION public.ensure_activitylogs_partition(timestamp) IS 'No-op placeholder to avoid orphan calls from trg_activitylogs_partition(); safe to replace later with real partitioning logic.';

-- 4) Remove DB-level age calculation from insert_patient_bypass_trigger()
--    Replace function to stop computing/returning age_months directly from DB.
CREATE OR REPLACE FUNCTION public.insert_patient_bypass_trigger(
    p_firstname text,
    p_surname text,
    p_middlename text DEFAULT NULL::text,
    p_date_of_birth date DEFAULT NULL::date,
    p_sex text DEFAULT NULL::text,
    p_address text DEFAULT NULL::text,
    p_barangay text DEFAULT NULL::text,
    p_health_center text DEFAULT NULL::text,
    p_guardian_id bigint DEFAULT NULL::bigint,
    p_mother_name text DEFAULT NULL::text,
    p_mother_occupation text DEFAULT NULL::text,
    p_mother_contact_number text DEFAULT NULL::text,
    p_father_name text DEFAULT NULL::text,
    p_father_occupation text DEFAULT NULL::text,
    p_father_contact_number text DEFAULT NULL::text,
    p_family_number text DEFAULT NULL::text,
    p_tags text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_patient_id bigint;
  result_json json;
BEGIN
  INSERT INTO patients (
    firstname, surname, middlename, date_of_birth, sex, address, barangay, health_center, guardian_id,
    mother_name, mother_occupation, mother_contact_number,
    father_name, father_occupation, father_contact_number,
    family_number, tags, date_registered
  ) VALUES (
    p_firstname, p_surname, p_middlename, p_date_of_birth, p_sex,
    p_address, p_barangay, p_health_center, p_guardian_id,
    p_mother_name, p_mother_occupation, p_mother_contact_number,
    p_father_name, p_father_occupation, p_father_contact_number,
    p_family_number, p_tags, CURRENT_TIMESTAMP
  ) RETURNING patient_id INTO new_patient_id;

  result_json := json_build_object(
    'patient_id', new_patient_id,
    'firstname', p_firstname,
    'surname', p_surname,
    'middlename', p_middlename,
    'date_of_birth', p_date_of_birth,
    'sex', p_sex,
    'address', p_address,
    'barangay', p_barangay,
    'health_center', p_health_center,
    'guardian_id', p_guardian_id,
    'mother_name', p_mother_name,
    'mother_occupation', p_mother_occupation,
    'mother_contact_number', p_mother_contact_number,
    'father_name', p_father_name,
    'father_occupation', p_father_occupation,
    'father_contact_number', p_father_contact_number,
    'family_number', p_family_number,
    'tags', p_tags,
    'date_registered', CURRENT_TIMESTAMP
  );

  RETURN result_json;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error creating patient: %', SQLERRM;
END;
$$;

COMMIT;
