-- ============================================================================
-- STEP 1B: Supabase Migrations for Offline-First Architecture
-- ============================================================================
-- Purpose: Add updated_at columns and auto-update triggers for conflict detection
-- Run this in your Supabase SQL Editor BEFORE testing conflict resolution
-- ============================================================================

-- ============================================================================
-- 1. Add updated_at column to patients table
-- ============================================================================

-- Add column if it doesn't exist
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Populate existing rows with current timestamp
UPDATE patients 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Make it NOT NULL after populating
ALTER TABLE patients 
ALTER COLUMN updated_at SET NOT NULL;

-- Create index for faster conflict detection queries
CREATE INDEX IF NOT EXISTS idx_patients_updated_at ON patients(updated_at);

COMMENT ON COLUMN patients.updated_at IS 'Timestamp of last update - used for conflict detection';

-- ============================================================================
-- 2. Create trigger function to auto-update timestamps
-- ============================================================================

-- Create or replace the trigger function (reusable for all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at column to current timestamp on UPDATE';

-- ============================================================================
-- 3. Create trigger for patients table
-- ============================================================================

-- Drop existing trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;

-- Create trigger
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_patients_updated_at ON patients IS 'Automatically updates updated_at timestamp whenever a patient record is modified';

-- ============================================================================
-- 4. Add updated_at column to immunizations table
-- ============================================================================

-- Add column if it doesn't exist
ALTER TABLE immunizations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Populate existing rows with current timestamp
UPDATE immunizations 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Make it NOT NULL after populating
ALTER TABLE immunizations 
ALTER COLUMN updated_at SET NOT NULL;

-- Create index for faster conflict detection queries
CREATE INDEX IF NOT EXISTS idx_immunizations_updated_at ON immunizations(updated_at);

COMMENT ON COLUMN immunizations.updated_at IS 'Timestamp of last update - used for conflict detection';

-- ============================================================================
-- 5. Create trigger for immunizations table
-- ============================================================================

-- Drop existing trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS update_immunizations_updated_at ON immunizations;

-- Create trigger
CREATE TRIGGER update_immunizations_updated_at
    BEFORE UPDATE ON immunizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_immunizations_updated_at ON immunizations IS 'Automatically updates updated_at timestamp whenever an immunization record is modified';

-- ============================================================================
-- 6. Verification Queries
-- ============================================================================

-- Check that columns exist
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('patients', 'immunizations')
  AND column_name = 'updated_at';

-- Check that triggers exist
SELECT 
    trigger_name, 
    event_object_table, 
    action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('update_patients_updated_at', 'update_immunizations_updated_at');

-- ============================================================================
-- 7. Test the triggers (Optional - for verification)
-- ============================================================================

-- Test patients trigger
-- Find a test patient
SELECT id, firstname, surname, updated_at 
FROM patients 
LIMIT 1;

-- Update the patient (replace <patient_id> with actual ID from above)
-- UPDATE patients 
-- SET firstname = firstname 
-- WHERE id = '<patient_id>';

-- Verify updated_at changed
-- SELECT id, firstname, surname, updated_at 
-- FROM patients 
-- WHERE id = '<patient_id>';

-- Test immunizations trigger
-- Find a test immunization
SELECT id, vaccine_name, updated_at 
FROM immunizations 
LIMIT 1;

-- Update the immunization (replace <immunization_id> with actual ID from above)
-- UPDATE immunizations 
-- SET vaccine_name = vaccine_name 
-- WHERE id = '<immunization_id>';

-- Verify updated_at changed
-- SELECT id, vaccine_name, updated_at 
-- FROM immunizations 
-- WHERE id = '<immunization_id>';

-- ============================================================================
-- SUCCESS! Your Supabase database is now ready for conflict detection
-- ============================================================================

-- Expected Behavior:
-- 1. Every UPDATE on patients/immunizations automatically updates updated_at
-- 2. The syncService can compare local vs server timestamps
-- 3. Conflicts are detected when server timestamp > local timestamp
-- 4. "Reject & Refresh" strategy prevents data loss

-- Next Steps:
-- 1. Test conflict detection as described in TESTING_GUIDE.md (Test 6)
-- 2. Verify that stale updates are rejected
-- 3. Confirm that users receive conflict notifications

-- ============================================================================
-- Optional: Add updated_at to other tables (guardians, visits, etc.)
-- ============================================================================

-- If you want conflict detection for guardians:
-- ALTER TABLE guardians ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- CREATE TRIGGER update_guardians_updated_at BEFORE UPDATE ON guardians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- If you want conflict detection for visits:
-- ALTER TABLE visits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- End of Migration
-- ============================================================================
