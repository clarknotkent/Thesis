-- 068_reset_inventorytransactions_triggers.sql
-- Ensure there is exactly one set of triggers on inventorytransactions for apply, activity, and history

DO $$
BEGIN
  -- Drop existing triggers if any
  IF EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'inventorytransactions' AND t.tgname = 'trg_inventorytransactions_apply'
  ) THEN
    EXECUTE 'DROP TRIGGER trg_inventorytransactions_apply ON public.inventorytransactions';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'inventorytransactions' AND t.tgname = 'trg_inventorytransactions_activity'
  ) THEN
    EXECUTE 'DROP TRIGGER trg_inventorytransactions_activity ON public.inventorytransactions';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'inventorytransactions' AND t.tgname = 'trg_inventorytransactions_history'
  ) THEN
    EXECUTE 'DROP TRIGGER trg_inventorytransactions_history ON public.inventorytransactions';
  END IF;

  -- Recreate apply trigger (requires function to exist)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_inventory_transaction_apply') THEN
    EXECUTE 'CREATE TRIGGER trg_inventorytransactions_apply BEFORE INSERT ON public.inventorytransactions FOR EACH ROW EXECUTE FUNCTION public.trg_inventory_transaction_apply()';
  END IF;

  -- Recreate activity trigger
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_inventorytransactions_activity_fn') THEN
    EXECUTE 'CREATE TRIGGER trg_inventorytransactions_activity AFTER INSERT OR UPDATE OR DELETE ON public.inventorytransactions FOR EACH ROW EXECUTE FUNCTION public.trg_inventorytransactions_activity_fn()';
  END IF;

  -- Recreate history trigger
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_inventorytransactions_history_fn') THEN
    EXECUTE 'CREATE TRIGGER trg_inventorytransactions_history AFTER INSERT OR UPDATE OR DELETE ON public.inventorytransactions FOR EACH ROW EXECUTE FUNCTION public.trg_inventorytransactions_history_fn()';
  END IF;
END $$;
