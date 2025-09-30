BEGIN;
SET search_path TO public;

-- Immunizations: vital ownership by service row
ALTER TABLE public.immunizations
  ADD COLUMN IF NOT EXISTS vital_id bigint;

-- Deworming: outside workflow + vitals + descriptive fields
ALTER TABLE public.deworming
  ADD COLUMN IF NOT EXISTS patient_id bigint,
  ADD COLUMN IF NOT EXISTS vaccine_id bigint,
  ADD COLUMN IF NOT EXISTS inventory_id bigint,
  ADD COLUMN IF NOT EXISTS age_at_administration integer,
  ADD COLUMN IF NOT EXISTS facility_name text,
  ADD COLUMN IF NOT EXISTS outside boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vital_id bigint;

-- Vitamina: outside workflow + vitals + descriptive fields
ALTER TABLE public.vitamina
  ADD COLUMN IF NOT EXISTS patient_id bigint,
  ADD COLUMN IF NOT EXISTS vaccine_id bigint,
  ADD COLUMN IF NOT EXISTS inventory_id bigint,
  ADD COLUMN IF NOT EXISTS age_at_administration integer,
  ADD COLUMN IF NOT EXISTS facility_name text,
  ADD COLUMN IF NOT EXISTS outside boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vital_id bigint;

-- Add foreign keys (NOT VALID to avoid legacy row failures)

-- Immunizations FKs
DO $$
BEGIN
  -- patient_id FK (if not present)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'immunizations_patient_id_fkey'
  ) THEN
    ALTER TABLE public.immunizations
      ADD CONSTRAINT immunizations_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) NOT VALID;
  END IF;

  -- vaccine_id FK (if not present)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'immunizations_vaccine_id_fkey'
  ) THEN
    ALTER TABLE public.immunizations
      ADD CONSTRAINT immunizations_vaccine_id_fkey
      FOREIGN KEY (vaccine_id) REFERENCES public.vaccinemaster(vaccine_id) NOT VALID;
  END IF;

  -- vital_id FK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'immunizations_vital_id_fkey'
  ) THEN
    ALTER TABLE public.immunizations
      ADD CONSTRAINT immunizations_vital_id_fkey
      FOREIGN KEY (vital_id) REFERENCES public.vitalsigns(vital_id) NOT VALID;
  END IF;
END$$;

-- Deworming FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deworming_patient_id_fkey'
  ) THEN
    ALTER TABLE public.deworming
      ADD CONSTRAINT deworming_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deworming_vaccine_id_fkey'
  ) THEN
    ALTER TABLE public.deworming
      ADD CONSTRAINT deworming_vaccine_id_fkey
      FOREIGN KEY (vaccine_id) REFERENCES public.vaccinemaster(vaccine_id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deworming_inventory_id_fkey'
  ) THEN
    ALTER TABLE public.deworming
      ADD CONSTRAINT deworming_inventory_id_fkey
      FOREIGN KEY (inventory_id) REFERENCES public.inventory(inventory_id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deworming_vital_id_fkey'
  ) THEN
    ALTER TABLE public.deworming
      ADD CONSTRAINT deworming_vital_id_fkey
      FOREIGN KEY (vital_id) REFERENCES public.vitalsigns(vital_id) NOT VALID;
  END IF;
END$$;

-- Vitamina FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vitamina_patient_id_fkey'
  ) THEN
    ALTER TABLE public.vitamina
      ADD CONSTRAINT vitamina_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vitamina_vaccine_id_fkey'
  ) THEN
    ALTER TABLE public.vitamina
      ADD CONSTRAINT vitamina_vaccine_id_fkey
      FOREIGN KEY (vaccine_id) REFERENCES public.vaccinemaster(vaccine_id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vitamina_inventory_id_fkey'
  ) THEN
    ALTER TABLE public.vitamina
      ADD CONSTRAINT vitamina_inventory_id_fkey
      FOREIGN KEY (inventory_id) REFERENCES public.inventory(inventory_id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vitamina_vital_id_fkey'
  ) THEN
    ALTER TABLE public.vitamina
      ADD CONSTRAINT vitamina_vital_id_fkey
      FOREIGN KEY (vital_id) REFERENCES public.vitalsigns(vital_id) NOT VALID;
  END IF;
END$$;

-- Backfill immunizations to minimize check failures

-- 3.1 patient_id from visit if missing
UPDATE public.immunizations i
SET patient_id = v.patient_id
FROM public.visits v
WHERE i.visit_id = v.visit_id
  AND i.patient_id IS NULL;

-- 3.2 vaccine_id from inventory if missing
UPDATE public.immunizations i
SET vaccine_id = inv.vaccine_id
FROM public.inventory inv
WHERE i.inventory_id = inv.inventory_id
  AND i.vaccine_id IS NULL;

-- 3.3 vital_id from vitalsigns.immunization_id (legacy link), if present
-- Only run if vitalsigns.immunization_id still exists in your schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='vitalsigns' AND column_name='immunization_id'
  ) THEN
    UPDATE public.immunizations i
    SET vital_id = vs.vital_id
    FROM public.vitalsigns vs
    WHERE vs.immunization_id = i.immunization_id
      AND i.vital_id IS NULL;
  END IF;
END$$;

-- 3.4 vital_id from visit’s latest vitals if still NULL and visit present
-- Note: vitalsigns has no recorded_date column; we pick the latest by highest vital_id per visit
WITH latest_vitals AS (
  SELECT DISTINCT ON (vs.visit_id) vs.visit_id, vs.vital_id
  FROM public.vitalsigns vs
  WHERE vs.is_deleted = false
  ORDER BY vs.visit_id, vs.vital_id DESC
)
UPDATE public.immunizations i
SET vital_id = lv.vital_id
FROM latest_vitals lv
WHERE i.visit_id = lv.visit_id
  AND i.vital_id IS NULL;

-- 3.5 administered_by from visit.recorded_by if missing (in-facility help)
UPDATE public.immunizations i
SET administered_by = v.recorded_by
FROM public.visits v
WHERE i.visit_id = v.visit_id
  AND i.administered_by IS NULL
  AND i.outside = false;

-- Add CHECK constraints as NOT VALID (so they don’t fail immediately)

-- Immunizations: outside vs in-facility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'immunizations_outside_inside_chk'
  ) THEN
    ALTER TABLE public.immunizations
      ADD CONSTRAINT immunizations_outside_inside_chk CHECK (
        CASE
          WHEN outside IS TRUE THEN
            -- Outside: patient & vaccine required; vital optional
            patient_id IS NOT NULL
            AND vaccine_id IS NOT NULL
          ELSE
            -- In-facility: visit, inventory, administered_by, and vitals required
            visit_id IS NOT NULL
            AND inventory_id IS NOT NULL
            AND administered_by IS NOT NULL
            AND vital_id IS NOT NULL
        END
      ) NOT VALID;
  END IF;
END$$;

-- Deworming: outside vs in-facility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deworming_outside_inside_chk'
  ) THEN
    ALTER TABLE public.deworming
      ADD CONSTRAINT deworming_outside_inside_chk CHECK (
        CASE
          WHEN outside IS TRUE THEN
            patient_id IS NOT NULL
            AND vaccine_id IS NOT NULL
          ELSE
            visit_id IS NOT NULL
            AND inventory_id IS NOT NULL
            AND administered_by IS NOT NULL
            AND vital_id IS NOT NULL
        END
      ) NOT VALID;
  END IF;
END$$;

-- Vitamina: outside vs in-facility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vitamina_outside_inside_chk'
  ) THEN
    ALTER TABLE public.vitamina
      ADD CONSTRAINT vitamina_outside_inside_chk CHECK (
        CASE
          WHEN outside IS TRUE THEN
            patient_id IS NOT NULL
            AND vaccine_id IS NOT NULL
          ELSE
            visit_id IS NOT NULL
            AND inventory_id IS NOT NULL
            AND administered_by IS NOT NULL
            AND vital_id IS NOT NULL
        END
      ) NOT VALID;
  END IF;
END$$;

-- Audit queries to find remaining violators

-- Immunizations that still violate
SELECT i.immunization_id, i.outside, i.visit_id, i.inventory_id, i.administered_by,
       i.vital_id, i.patient_id, i.vaccine_id
FROM public.immunizations i
WHERE NOT (
  CASE WHEN i.outside IS TRUE
       THEN (i.patient_id IS NOT NULL AND i.vaccine_id IS NOT NULL)
       ELSE (i.visit_id IS NOT NULL AND i.inventory_id IS NOT NULL AND i.administered_by IS NOT NULL AND i.vital_id IS NOT NULL)
  END
);

-- Deworming that violate
SELECT d.deworming_id, d.outside, d.visit_id, d.inventory_id, d.administered_by,
       d.vital_id, d.patient_id, d.vaccine_id
FROM public.deworming d
WHERE NOT (
  CASE WHEN d.outside IS TRUE
       THEN (d.patient_id IS NOT NULL AND d.vaccine_id IS NOT NULL)
       ELSE (d.visit_id IS NOT NULL AND d.inventory_id IS NOT NULL AND d.administered_by IS NOT NULL AND d.vital_id IS NOT NULL)
  END
);

-- Vitamina that violate
SELECT v.vitamina_id, v.outside, v.visit_id, v.inventory_id, v.administered_by,
       v.vital_id, v.patient_id, v.vaccine_id
FROM public.vitamina v
WHERE NOT (
  CASE WHEN v.outside IS TRUE
       THEN (v.patient_id IS NOT NULL AND v.vaccine_id IS NOT NULL)
       ELSE (v.visit_id IS NOT NULL AND v.inventory_id IS NOT NULL AND v.administered_by IS NOT NULL AND v.vital_id IS NOT NULL)
  END
);

-- Optional: validate constraints when clean

-- Run only after the audit queries return zero rows for the table
-- Immunizations:
-- ALTER TABLE public.immunizations VALIDATE CONSTRAINT immunizations_outside_inside_chk;
-- ALTER TABLE public.immunizations VALIDATE CONSTRAINT immunizations_patient_id_fkey;
-- ALTER TABLE public.immunizations VALIDATE CONSTRAINT immunizations_vaccine_id_fkey;
-- ALTER TABLE public.immunizations VALIDATE CONSTRAINT immunizations_vital_id_fkey;

-- Deworming:
-- ALTER TABLE public.deworming VALIDATE CONSTRAINT deworming_outside_inside_chk;
-- ALTER TABLE public.deworming VALIDATE CONSTRAINT deworming_patient_id_fkey;
-- ALTER TABLE public.deworming VALIDATE CONSTRAINT deworming_vaccine_id_fkey;
-- ALTER TABLE public.deworming VALIDATE CONSTRAINT deworming_inventory_id_fkey;
-- ALTER TABLE public.deworming VALIDATE CONSTRAINT deworming_vital_id_fkey;

-- Vitamina:
-- ALTER TABLE public.vitamina VALIDATE CONSTRAINT vitamina_outside_inside_chk;
-- ALTER TABLE public.vitamina VALIDATE CONSTRAINT vitamina_patient_id_fkey;
-- ALTER TABLE public.vitamina VALIDATE CONSTRAINT vitamina_vaccine_id_fkey;
-- ALTER TABLE public.vitamina VALIDATE CONSTRAINT vitamina_inventory_id_fkey;
-- ALTER TABLE public.vitamina VALIDATE CONSTRAINT vitamina_vital_id_fkey;

-- Helpful indexes

-- Immunizations
CREATE INDEX IF NOT EXISTS idx_immunizations_patient_active
  ON public.immunizations (patient_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_immunizations_vaccine_active
  ON public.immunizations (vaccine_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_immunizations_visit_active
  ON public.immunizations (visit_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_immunizations_inventory_active
  ON public.immunizations (inventory_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_immunizations_vital_active
  ON public.immunizations (vital_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_immunizations_outside_flag
  ON public.immunizations (outside) WHERE is_deleted = false;

-- Deworming
CREATE INDEX IF NOT EXISTS idx_deworming_patient_active
  ON public.deworming (patient_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_deworming_vaccine_active
  ON public.deworming (vaccine_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_deworming_visit_active
  ON public.deworming (visit_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_deworming_inventory_active
  ON public.deworming (inventory_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_deworming_vital_active
  ON public.deworming (vital_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_deworming_outside_flag
  ON public.deworming (outside) WHERE is_deleted = false;

-- Vitamina
CREATE INDEX IF NOT EXISTS idx_vitamina_patient_active
  ON public.vitamina (patient_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_vitamina_vaccine_active
  ON public.vitamina (vaccine_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_vitamina_visit_active
  ON public.vitamina (visit_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_vitamina_inventory_active
  ON public.vitamina (inventory_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_vitamina_vital_active
  ON public.vitamina (vital_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_vitamina_outside_flag
  ON public.vitamina (outside) WHERE is_deleted = false;

COMMIT;
