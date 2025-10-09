-- Migration: 073_add_outside_field_to_visits.sql
-- Description: Add outside boolean field to visits table for tracking outside/inside transactions
-- Date: 2025-01-27

-- Add outside field to visits table
ALTER TABLE visits ADD COLUMN outside BOOLEAN DEFAULT FALSE;

-- Add comment to the column
COMMENT ON COLUMN visits.outside IS 'Indicates if the visit was conducted outside the facility (TRUE) or inside (FALSE)';

-- Create index for performance
CREATE INDEX idx_visits_outside ON visits(outside);

-- Update existing records to have outside = FALSE (inside by default)
UPDATE visits SET outside = FALSE WHERE outside IS NULL;