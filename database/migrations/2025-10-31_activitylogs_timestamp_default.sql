-- Migration: Set default timestamp on activitylogs.timestamp to now()
-- Date: 2025-10-31

BEGIN;

-- Ensure future inserts that omit the timestamp still get a value
ALTER TABLE public.activitylogs
  ALTER COLUMN "timestamp" SET DEFAULT now();

-- Backfill any existing NULL timestamps
UPDATE public.activitylogs
  SET "timestamp" = now()
  WHERE "timestamp" IS NULL;

COMMIT;
