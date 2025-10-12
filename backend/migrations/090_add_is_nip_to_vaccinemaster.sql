-- Migration 090: add is_nip boolean column to vaccinemaster
ALTER TABLE IF EXISTS vaccinemaster
ADD COLUMN IF NOT EXISTS is_nip boolean DEFAULT false;

-- Backfill common NIP antigen names (best-effort) can be performed manually.
-- This migration only adds the column with default false.

COMMENT ON COLUMN vaccinemaster.is_nip IS 'Flag to mark whether a vaccine is part of the National Immunization Program (NIP)';
