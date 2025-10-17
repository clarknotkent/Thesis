-- Add user role to activitylogs_view
-- This migration updates the activitylogs_view to include user role information

-- Drop the existing view
DROP VIEW IF EXISTS activitylogs_view CASCADE;

-- Recreate the view with user role
CREATE OR REPLACE VIEW activitylogs_view AS
SELECT
  a.log_id,
  a.user_id,
  a.action_type,
  a.entity_type,
  a.entity_id,
  a.description,
  a.old_value,
  a.new_value,
  timezone('Asia/Manila', a."timestamp"::timestamptz) AS "timestamp",
  COALESCE(u.full_name, 'System') AS user_fullname,
  u.username,
  u.role AS user_role
FROM activitylogs a
LEFT JOIN users u ON u.user_id = a.user_id;

-- Grant appropriate permissions
GRANT SELECT ON activitylogs_view TO authenticated;

-- Test the view
SELECT 
  log_id,
  user_id,
  user_fullname,
  user_role,
  action_type,
  description,
  timestamp
FROM activitylogs_view
ORDER BY timestamp DESC
LIMIT 5;
