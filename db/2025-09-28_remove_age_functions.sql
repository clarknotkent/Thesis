-- Remove age-related database functions (age will be handled in backend/UI)
SET search_path = public;

-- Drop helper functions if they exist
DROP FUNCTION IF EXISTS public.patient_age_days(date);
DROP FUNCTION IF EXISTS public.patient_age_months(date);

-- Note: No tables or views should depend on these anymore. Views compute ages inline when needed.
