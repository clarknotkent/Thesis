-- Run this after the audit queries in 2025-09-29_service_vitals_outside_constraints.sql return zero rows
BEGIN;
SET search_path TO public;

-- Immunizations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='immunizations_outside_inside_chk') THEN
    ALTER TABLE public.immunizations VALIDATE CONSTRAINT immunizations_outside_inside_chk;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='immunizations_patient_id_fkey') THEN
    ALTER TABLE public.immunizations VALIDATE CONSTRAINT immunizations_patient_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='immunizations_vaccine_id_fkey') THEN
    ALTER TABLE public.immunizations VALIDATE CONSTRAINT immunizations_vaccine_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='immunizations_vital_id_fkey') THEN
    ALTER TABLE public.immunizations VALIDATE CONSTRAINT immunizations_vital_id_fkey;
  END IF;
END $$;

-- Deworming
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='deworming_outside_inside_chk') THEN
    ALTER TABLE public.deworming VALIDATE CONSTRAINT deworming_outside_inside_chk;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='deworming_patient_id_fkey') THEN
    ALTER TABLE public.deworming VALIDATE CONSTRAINT deworming_patient_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='deworming_vaccine_id_fkey') THEN
    ALTER TABLE public.deworming VALIDATE CONSTRAINT deworming_vaccine_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='deworming_inventory_id_fkey') THEN
    ALTER TABLE public.deworming VALIDATE CONSTRAINT deworming_inventory_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='deworming_vital_id_fkey') THEN
    ALTER TABLE public.deworming VALIDATE CONSTRAINT deworming_vital_id_fkey;
  END IF;
END $$;

-- Vitamina
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='vitamina_outside_inside_chk') THEN
    ALTER TABLE public.vitamina VALIDATE CONSTRAINT vitamina_outside_inside_chk;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='vitamina_patient_id_fkey') THEN
    ALTER TABLE public.vitamina VALIDATE CONSTRAINT vitamina_patient_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='vitamina_vaccine_id_fkey') THEN
    ALTER TABLE public.vitamina VALIDATE CONSTRAINT vitamina_vaccine_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='vitamina_inventory_id_fkey') THEN
    ALTER TABLE public.vitamina VALIDATE CONSTRAINT vitamina_inventory_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='vitamina_vital_id_fkey') THEN
    ALTER TABLE public.vitamina VALIDATE CONSTRAINT vitamina_vital_id_fkey;
  END IF;
END $$;

COMMIT;
