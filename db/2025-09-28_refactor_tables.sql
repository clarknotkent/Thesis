-- Refactor tables to support outside immunizations and flexible vitalsigns linkage
-- Safe defaults: do not rename existing columns; only add columns/constraints or relax NOT NULLs.

BEGIN;

-- 1) Immunizations: support outside administration not tied to a visit; ensure either visit_id or patient_id is present
ALTER TABLE public.immunizations
  ADD COLUMN IF NOT EXISTS patient_id bigint,
  ADD COLUMN IF NOT EXISTS outside boolean NOT NULL DEFAULT false;

ALTER TABLE public.immunizations
  ADD CONSTRAINT IF NOT EXISTS immunizations_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);

-- Either visit-based or outside (patient-based) immunization must be linked
ALTER TABLE public.immunizations
  ADD CONSTRAINT IF NOT EXISTS immunizations_visit_or_patient_chk
  CHECK (visit_id IS NOT NULL OR patient_id IS NOT NULL);

-- Outside administrations should not impact inventory; enforce inventory_id NULL when outside=true
ALTER TABLE public.immunizations
  ADD CONSTRAINT IF NOT EXISTS immunizations_outside_inventory_chk
  CHECK (NOT outside OR inventory_id IS NULL);

-- 2) Vital signs: allow capturing vitals for outside immunizations
-- Allow vitalsigns to exist without a visit when tied directly to an immunization
DO $$
BEGIN
  -- Drop NOT NULL if present; ignore if already nullable
  BEGIN
    ALTER TABLE public.vitalsigns ALTER COLUMN visit_id DROP NOT NULL;
  EXCEPTION WHEN others THEN
    -- ignore if constraint not present
    NULL;
  END;
END$$;

ALTER TABLE public.vitalsigns
  ADD COLUMN IF NOT EXISTS immunization_id bigint;

ALTER TABLE public.vitalsigns
  ADD CONSTRAINT IF NOT EXISTS vitalsigns_immunization_id_fkey
  FOREIGN KEY (immunization_id) REFERENCES public.immunizations(immunization_id);

-- Require either a visit_id or an immunization_id
ALTER TABLE public.vitalsigns
  ADD CONSTRAINT IF NOT EXISTS vitalsigns_visit_or_immunization_chk
  CHECK (visit_id IS NOT NULL OR immunization_id IS NOT NULL);

COMMIT;

-- Notes:
-- - Views in db/cleaned_views.sql already tolerate outside immunizations by deriving patient_id via COALESCE.
-- - visits_view intentionally aggregates vitals by visit; outside vitals will not appear there, but can be exposed via a separate view if needed later.
