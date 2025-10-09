-- 071_remove_absolute_latest_days.sql
-- Purpose: Remove absolute_latest_days column from schedule_doses table as it's no longer needed

-- Drop the column from schedule_doses table
ALTER TABLE schedule_doses DROP COLUMN IF EXISTS absolute_latest_days;

-- Update any constraints that might reference this column
-- (The chk_schedule_doses_positive_intervals constraint should be automatically updated)