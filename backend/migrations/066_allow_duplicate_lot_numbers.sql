-- 066_allow_duplicate_lot_numbers.sql
-- Allow duplicate lot numbers per vaccine by removing the unique constraint on (vaccine_id, lot_number)
-- and replacing it with a non-unique index for performance.

DO $$
BEGIN
  -- Drop the unique constraint if it exists (name from error: inventory_vaccine_id_lot_number_key)
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'inventory' AND c.conname = 'inventory_vaccine_id_lot_number_key'
  ) THEN
    ALTER TABLE public.inventory DROP CONSTRAINT inventory_vaccine_id_lot_number_key;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- inventory table might not exist in some environments; ignore.
  NULL;
END $$;

-- Recreate a non-unique index to keep lookups fast (safe if run multiple times)
CREATE INDEX IF NOT EXISTS idx_inventory_vaccine_lot ON public.inventory (vaccine_id, lot_number);

-- Optional: if you also want to avoid duplicate exact rows, you could add a weaker uniqueness including expiration_date
-- Uncomment if needed in future:
-- CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_vaccine_lot_exp ON public.inventory (vaccine_id, lot_number, expiration_date) WHERE is_deleted = false;
