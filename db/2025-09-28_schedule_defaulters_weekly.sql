-- Ensure weekly defaulters refresh is scheduled and calls the actual refresh function.
-- Idempotent: it drops existing cron job with the same name and re-creates it.

BEGIN;
SET search_path = public;

-- Wrapper to call the actual refresh implementation (assumed to exist: public.refresh_defaulters())
CREATE OR REPLACE FUNCTION public.refresh_defaulters_materialized()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Call the canonical refresh function if present; ignore if missing
  PERFORM 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE p.proname = 'refresh_defaulters' AND n.nspname = 'public';
  IF FOUND THEN
    PERFORM public.refresh_defaulters();
  END IF;
END;$$;

-- Only proceed if pg_cron is installed
DO $$
DECLARE v_job_id integer;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule any existing job with the same name
    SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'refresh_defaulters_weekly' LIMIT 1;
    IF v_job_id IS NOT NULL THEN
      PERFORM cron.unschedule(v_job_id);
    END IF;
    -- Schedule weekly on Sunday 23:30 server time
    PERFORM cron.schedule(
      'refresh_defaulters_weekly',
      '30 23 * * 0',
      'SELECT public.refresh_defaulters_materialized();'
    );
  END IF;
END$$;

COMMIT;
