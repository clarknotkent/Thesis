# Database Migration Required

## Problem
The `patients` table is missing the `age_months` column that the database trigger `trg_update_patient_age_fields` expects.

## Solution
Run this SQL in your Supabase SQL Editor:

```sql
-- Add age_months column to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS age_months INTEGER;

-- Create or replace the function to update age_months
CREATE OR REPLACE FUNCTION update_patient_age_fields() 
RETURNS trigger AS $$
BEGIN
    -- Calculate age in months from date_of_birth
    IF NEW.date_of_birth IS NOT NULL THEN
        NEW.age_months = (
            (EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.date_of_birth)) * 12) + 
            EXTRACT(MONTH FROM AGE(CURRENT_DATE, NEW.date_of_birth))
        )::INTEGER;
    ELSE
        NEW.age_months = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trg_update_patient_age_fields ON patients;
CREATE TRIGGER trg_update_patient_age_fields 
    BEFORE INSERT OR UPDATE ON patients 
    FOR EACH ROW EXECUTE FUNCTION update_patient_age_fields();

-- Update existing records to have age_months calculated
UPDATE patients 
SET age_months = (
    (EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) * 12) + 
    EXTRACT(MONTH FROM AGE(CURRENT_DATE, date_of_birth))
)::INTEGER
WHERE date_of_birth IS NOT NULL AND age_months IS NULL;
```

## Steps to Apply
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Paste the above SQL
4. Run it
5. Test patient creation - it should work after this

## What This Does
- Adds the missing `age_months` column to the `patients` table
- Creates/fixes the trigger function to automatically calculate age in months
- Updates existing patient records with calculated ages
- Ensures new patients will have age automatically calculated

After running this SQL, patient creation should work perfectly!