-- Indexes to optimize common RLS predicates and joins for guardian visibility and outside flows
-- Safe to run anytime; existing indexes are mostly present but these are additional helpful ones.

BEGIN;
SET search_path = public;

-- Patients guardian filtering (already present as idx_patients_guardian_active, ensure partial index by is_deleted)
-- CREATE INDEX IF NOT EXISTS idx_patients_guardian_active ON public.patients (guardian_id) WHERE is_deleted = false;

-- Visits by patient (ensure fast guardian visibility via visits)
CREATE INDEX IF NOT EXISTS idx_visits_patient_active ON public.visits (patient_id) WHERE is_deleted = false;

-- Immunizations by patient_id (outside path)
CREATE INDEX IF NOT EXISTS idx_immunizations_patient_active ON public.immunizations (patient_id) WHERE is_deleted = false;

-- Vitalsigns by visit and immunization (outside chain)
CREATE INDEX IF NOT EXISTS idx_vitalsigns_visit_active ON public.vitalsigns (visit_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_vitalsigns_immunization_active ON public.vitalsigns (immunization_id) WHERE is_deleted = false;

-- Conversationparticipants by user (participant lookups)
CREATE INDEX IF NOT EXISTS idx_conversationparticipants_user_active ON public.conversationparticipants (user_id) WHERE is_deleted = false;

COMMIT;
