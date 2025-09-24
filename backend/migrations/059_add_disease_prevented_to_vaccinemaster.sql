-- Migration 059: add disease_prevented column to vaccinemaster
BEGIN;

-- Add column (initially nullable so updates can proceed)
ALTER TABLE IF EXISTS vaccinemaster
  ADD COLUMN IF NOT EXISTS disease_prevented text;

-- Backfill existing rows with a safe placeholder so column can be made NOT NULL
UPDATE vaccinemaster
SET disease_prevented = 'Tuberculosis'
WHERE disease_prevented IS NULL;

-- Enforce NOT NULL constraint after backfill
ALTER TABLE vaccinemaster
  ALTER COLUMN disease_prevented SET NOT NULL;

COMMIT;
