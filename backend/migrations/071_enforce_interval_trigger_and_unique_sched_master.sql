-- 071_enforce_interval_trigger_and_unique_sched_master.sql
-- Purpose:
-- 1) Ensure patientschedule updates respect min intervals (same vaccine and other vaccines)
--    by creating a BEFORE trigger that invokes public.enforce_vaccine_interval().
-- 2) Guarantee a 1-to-1 relationship between vaccinemaster and schedule_master
--    by enforcing a unique constraint on schedule_master.vaccine_id (if not already present).

BEGIN;

-- 1) Create/replace the interval enforcement trigger on patientschedule
--    Note: enforce_vaccine_interval() already only enforces on UPDATE; it is safe to attach to INSERT OR UPDATE.
DO $$
BEGIN
  -- Drop any existing trigger with a known name to avoid duplicates
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'patientschedule' AND t.tgname = 'trg_patientschedule_enforce_interval'
  ) THEN
    EXECUTE 'DROP TRIGGER trg_patientschedule_enforce_interval ON public.patientschedule';
  END IF;

  -- Only create the trigger if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
             WHERE p.proname = 'enforce_vaccine_interval' AND ns.nspname = 'public') THEN
    EXECUTE 'CREATE TRIGGER trg_patientschedule_enforce_interval
             BEFORE INSERT OR UPDATE OF scheduled_date ON public.patientschedule
             FOR EACH ROW
             WHEN (NEW.is_deleted IS DISTINCT FROM TRUE)
             EXECUTE FUNCTION public.enforce_vaccine_interval()';
  END IF;
END$$;

-- 2) Enforce unique schedule_master per vaccine (one schedule_master per vaccinemaster)
DO $$
DECLARE
  v_exists boolean;
BEGIN
  -- Check if any unique constraint exists on (vaccine_id)
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.contype = 'u'
      AND n.nspname = 'public'
      AND rel.relname = 'schedule_master'
      AND pg_get_constraintdef(c.oid) ILIKE '%(vaccine_id)%'
  ) INTO v_exists;

  IF NOT v_exists THEN
    ALTER TABLE public.schedule_master
      ADD CONSTRAINT uq_schedule_master_vaccine UNIQUE (vaccine_id);
  END IF;
END$$;

COMMIT;
