-- 061_enforce_birthhistory_1to1.sql
-- Enforce strict 1:1 relationship between patients and birthhistory
-- Assumes table is empty or user has intentionally cleared it.

DO $$
BEGIN
  -- If birthhistory table doesn't exist, nothing to do
  IF to_regclass('public.birthhistory') IS NULL THEN
    RAISE NOTICE 'Table birthhistory not found - skipping 1:1 enforcement migration.';
    RETURN;
  END IF;

  -- Truncate the table to ensure a clean state (user confirmed tables are empty/reset)
  EXECUTE 'TRUNCATE TABLE public.birthhistory RESTART IDENTITY CASCADE';
  RAISE NOTICE 'Truncated birthhistory table.';

  -- Create unique partial index on patient_id for non-deleted rows
  BEGIN
    EXECUTE 'CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_birthhistory_patient ON public.birthhistory(patient_id) WHERE (is_deleted = false)';
    RAISE NOTICE 'Created unique index uq_birthhistory_patient (CONCURRENTLY)';
  EXCEPTION WHEN others THEN
    -- If CONCURRENTLY not allowed in this environment, try without CONCURRENTLY (may take a lock)
    RAISE NOTICE 'CONCURRENTLY failed for uq_birthhistory_patient: % - attempting regular index', SQLERRM;
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_birthhistory_patient ON public.birthhistory(patient_id) WHERE (is_deleted = false)';
    RAISE NOTICE 'Created unique index uq_birthhistory_patient (non-concurrent)';
  END;

  -- Add foreign key constraint if it does not already exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint pc
    JOIN pg_class rc ON rc.oid = pc.conrelid
    WHERE pc.contype = 'f'
      AND rc.relname = 'birthhistory'
      AND pc.conname = 'fk_birthhistory_patient'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.birthhistory ADD CONSTRAINT fk_birthhistory_patient FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE';
      RAISE NOTICE 'Added foreign key constraint fk_birthhistory_patient';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Failed to add foreign key fk_birthhistory_patient: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Foreign key fk_birthhistory_patient already exists - skipping';
  END IF;

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error in 061_enforce_birthhistory_1to1.sql: %', SQLERRM;
END$$;
