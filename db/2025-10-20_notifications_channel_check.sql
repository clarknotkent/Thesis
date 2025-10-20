-- Normalize existing channel values to DB tokens (Push, SMS, Email)
UPDATE notifications
SET channel = CASE
  WHEN lower(channel) IN ('in-app','inapp','notification','push','push-notification') THEN 'Push'
  WHEN lower(channel) IN ('sms','sms-text','text','mobile') THEN 'SMS'
  WHEN lower(channel) IN ('email','e-mail','mail') THEN 'Email'
  ELSE channel
END
WHERE channel IS NOT NULL
  AND lower(channel) NOT IN ('push','sms','email');

-- Drop existing check constraint if it exists (name may vary across environments)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'notifications' AND c.conname = 'notifications_channel_check'
  ) THEN
    EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT notifications_channel_check';
  END IF;
END $$;

-- Add a robust check constraint ensuring only canonical values are allowed (case-insensitive)
ALTER TABLE notifications
  ADD CONSTRAINT notifications_channel_check
  CHECK (channel IN ('Push','SMS','Email'));

-- Optional: index on channel for filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'notifications' AND indexname = 'idx_notifications_channel'
  ) THEN
    CREATE INDEX idx_notifications_channel ON notifications (channel);
  END IF;
END $$;

-- Normalize existing status values to DB tokens (Queued, Sent, Failed, Delivered)
UPDATE notifications
SET status = CASE
  WHEN lower(status) IN ('pending','queue','queued','schedule','scheduled') THEN 'Queued'
  WHEN lower(status) = 'sent' THEN 'Sent'
  WHEN lower(status) = 'failed' THEN 'Failed'
  WHEN lower(status) = 'delivered' THEN 'Delivered'
  ELSE status
END
WHERE status IS NOT NULL
  AND lower(status) NOT IN ('queued','sent','failed','delivered');

-- Drop existing status check if present and add one that enforces DB tokens
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'notifications' AND c.conname = 'notifications_status_check'
  ) THEN
    EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT notifications_status_check';
  END IF;
END $$;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_status_check
  CHECK (status IN ('Queued','Sent','Failed','Delivered'));
