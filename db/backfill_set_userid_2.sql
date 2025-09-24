-- Backfill activitylogs.user_id where NULL -> set to 2
-- IMPORTANT: Run on a staging or after taking a DB backup. This script is idempotent for the UPDATE step.
-- 1) Create a backup table snapshot for auditing
-- 2) Update rows in activitylogs set user_id = 2 where user_id is NULL
-- 3) Provide verification selects

BEGIN;

-- Create audit backup (only create if not exists)
CREATE TABLE IF NOT EXISTS activitylogs_backfill_userid_2 AS
SELECT now() as backfill_run_at, * FROM activitylogs WHERE user_id IS NULL;

-- Count how many rows will be updated
SELECT count(*) AS will_update_count FROM activitylogs WHERE user_id IS NULL;

-- Safety check: preview few rows
SELECT id, action_type, entity_type, entity_id, new_value, created_at, user_id
FROM activitylogs
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- Perform the update: set user_id = 2 for all NULLs
UPDATE activitylogs
SET user_id = 2
WHERE user_id IS NULL;

-- Verification: how many NULLs remain
SELECT count(*) AS nulls_remaining FROM activitylogs WHERE user_id IS NULL;

COMMIT;

-- Notes:
-- - If you need to undo this exact operation, you can use the backup table created above to restore user_id values for rows captured at backup time.
-- - Example restore (careful: this will overwrite existing values):
--   UPDATE activitylogs a
--   SET user_id = b.user_id
--   FROM activitylogs_backfill_userid_2 b
--   WHERE a.id = b.id;

-- End of script
