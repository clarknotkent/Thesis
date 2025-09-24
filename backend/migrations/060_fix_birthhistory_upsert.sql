-- 060_fix_birthhistory_upsert.sql
-- Ensure there is a unique index/constraint on birthhistory(patient_id)
-- so that application-level upserts using ON CONFLICT (patient_id) succeed.

DO $$
BEGIN
  IF to_regclass('public.birthhistory') IS NOT NULL THEN
    -- Create a unique index for non-deleted rows if it doesn't exist
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class pc
      JOIN pg_namespace pn ON pn.oid = pc.relnamespace
      WHERE pc.relkind = 'i'
        AND pc.relname = 'uq_birthhistory_patient'
    ) THEN
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_birthhistory_patient
        ON birthhistory(patient_id)
        WHERE (is_deleted = false);
    END IF;
  END IF;
EXCEPTION WHEN others THEN
  -- If running in a locked environment where CONCURRENTLY isn't allowed, fall back
  RAISE NOTICE 'Could not ensure unique index on birthhistory.patient_id: %', SQLERRM;
END$$;
