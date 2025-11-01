-- Add approved_by / approved_at to immunizations so frontend can persist approver info
-- This migration is idempotent (uses IF NOT EXISTS) and also creates a FK and index.
BEGIN;

-- add column to record who approved the manual edit (references users.user_id)
ALTER TABLE public.immunizations
  ADD COLUMN IF NOT EXISTS approved_by bigint;

-- optional timestamp when approval occurred; default to now() for future inserts
ALTER TABLE public.immunizations
  ADD COLUMN IF NOT EXISTS approved_at timestamptz DEFAULT now();

-- backfill approved_at for existing rows where approved_by is present but approved_at is null
UPDATE public.immunizations
SET approved_at = now()
WHERE approved_by IS NOT NULL AND approved_at IS NULL;

-- add foreign key constraint to users.user_id if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'immunizations_approved_by_fkey'
  ) THEN
    ALTER TABLE public.immunizations
      ADD CONSTRAINT immunizations_approved_by_fkey
      FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON UPDATE CASCADE;
  END IF;
END$$;

-- index for faster lookups on approved_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_immunizations_approved_by'
  ) THEN
    CREATE INDEX idx_immunizations_approved_by ON public.immunizations (approved_by);
  END IF;
END$$;

COMMIT;

-- Notes:
-- After applying this migration, restart PostgREST / API server so the schema cache picks up the new column.
-- To apply locally from the backend folder (requires DATABASE_URL or PG* env vars in .env):
--   node scripts/run-migration.js ..\database\migrations\20251101_add_approved_by_to_immunizations.sql
