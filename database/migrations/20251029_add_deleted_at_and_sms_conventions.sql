-- Migration: Add deleted_at columns and align SMS conventions
-- Date: 2025-10-29

-- 1) Add deleted_at to guardian_auto_send_settings
ALTER TABLE public.guardian_auto_send_settings
  ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone;

-- 2) Add scheduled_at and deleted_at to sms_logs
ALTER TABLE public.sms_logs
  ADD COLUMN IF NOT EXISTS scheduled_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone;

-- 3) Add deleted_at to sms_templates
ALTER TABLE public.sms_templates
  ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone;

-- NOTE: We intentionally do NOT add CHECK constraints here for
-- sms_logs.type/status or sms_templates.trigger_type to avoid breaking
-- existing data during rollout. Enforcement will be done at the API layer.

-- Optional helpful indexes (safe if re-run)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_sms_logs_pending_scheduled_at'
  ) THEN
    EXECUTE 'CREATE INDEX idx_sms_logs_pending_scheduled_at ON public.sms_logs (status, scheduled_at)';
  END IF;
END $$;
