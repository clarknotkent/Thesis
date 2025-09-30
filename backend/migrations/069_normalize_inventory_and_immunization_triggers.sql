-- 069_normalize_inventory_and_immunization_triggers.sql
-- Purpose: Eliminate duplicate writes by ensuring exactly one set of triggers exist
-- - On inventorytransactions: one BEFORE INSERT apply trigger, one AFTER activity trigger, one AFTER history trigger
-- - On immunizations: one AFTER INSERT trigger that inserts an ISSUE row into inventorytransactions when inventory_id is present
-- This migration drops any legacy/duplicate triggers regardless of their names and recreates a canonical set.

DO $$
DECLARE
  rec RECORD;
BEGIN
  -- 1) Normalize triggers on inventorytransactions
  -- Drop any triggers on inventorytransactions that call our known functions, regardless of trigger name
  FOR rec IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE c.relname = 'inventorytransactions'
      AND t.tgenabled <> 'D'
      AND p.proname IN (
        'trg_inventory_transaction_apply',
        'trg_inventorytransactions_activity_fn',
        'trg_inventorytransactions_history_fn'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.inventorytransactions', rec.tgname);
  END LOOP;

  -- Also drop a known legacy trigger name if it exists (older naming)
  IF EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'inventorytransactions' AND t.tgname = 'apply_inventory_transaction'
  ) THEN
    EXECUTE 'DROP TRIGGER apply_inventory_transaction ON public.inventorytransactions';
  END IF;

  -- Recreate canonical triggers if their functions exist
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_inventory_transaction_apply') THEN
    EXECUTE 'CREATE TRIGGER trg_inventorytransactions_apply BEFORE INSERT ON public.inventorytransactions FOR EACH ROW EXECUTE FUNCTION public.trg_inventory_transaction_apply()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_inventorytransactions_activity_fn') THEN
    EXECUTE 'CREATE TRIGGER trg_inventorytransactions_activity AFTER INSERT OR UPDATE OR DELETE ON public.inventorytransactions FOR EACH ROW EXECUTE FUNCTION public.trg_inventorytransactions_activity_fn()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_inventorytransactions_history_fn') THEN
    EXECUTE 'CREATE TRIGGER trg_inventorytransactions_history AFTER INSERT OR UPDATE OR DELETE ON public.inventorytransactions FOR EACH ROW EXECUTE FUNCTION public.trg_inventorytransactions_history_fn()';
  END IF;

  -- 2) Normalize immunization issue-inventory trigger
  -- Drop any triggers on immunizations that call our function or use known legacy names
  FOR rec IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE c.relname = 'immunizations'
      AND t.tgenabled <> 'D'
      AND (
        p.proname = 'trg_immunization_issue_inventory'
        OR t.tgname IN ('immunization_issue_inventory','trg_immunization_issue_inventory')
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.immunizations', rec.tgname);
  END LOOP;

  -- Recreate a single canonical trigger on immunizations if function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_immunization_issue_inventory') THEN
    EXECUTE 'CREATE TRIGGER immunization_issue_inventory AFTER INSERT ON public.immunizations FOR EACH ROW EXECUTE FUNCTION public.trg_immunization_issue_inventory()';
  END IF;
END $$;
