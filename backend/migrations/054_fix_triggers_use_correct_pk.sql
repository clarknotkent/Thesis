-- hope/Thesis backend migration
-- 054_fix_triggers_use_correct_pk.sql
-- Update activity and history triggers/functions to use actual schema column names
-- Uses column names from `schema overview.txt` in hope/Thesis

BEGIN;

-- Drop existing activity triggers/functions (if any)
DROP TRIGGER IF EXISTS trg_users_activity ON users;
DROP TRIGGER IF EXISTS trg_patients_activity ON patients;
DROP TRIGGER IF EXISTS trg_inventory_activity ON inventory;
DROP TRIGGER IF EXISTS trg_patientschedule_activity ON patientschedule;
DROP TRIGGER IF EXISTS trg_immunizations_activity ON immunizations;

DROP FUNCTION IF EXISTS trg_users_activity_fn();
DROP FUNCTION IF EXISTS trg_patients_activity_fn();
DROP FUNCTION IF EXISTS trg_inventory_activity_fn();
DROP FUNCTION IF EXISTS trg_patientschedule_activity_fn();
DROP FUNCTION IF EXISTS trg_immunizations_activity_fn();
DROP FUNCTION IF EXISTS insert_patient_bypass_trigger() CASCADE;

-- Drop existing history triggers/functions (if any)
DROP TRIGGER IF EXISTS trg_patients_history ON patients;
DROP TRIGGER IF EXISTS trg_inventory_history ON inventory;
DROP TRIGGER IF EXISTS trg_patientschedule_history ON patientschedule;
DROP TRIGGER IF EXISTS trg_immunizations_history ON immunizations;

DROP FUNCTION IF EXISTS trg_patients_history_fn();
DROP FUNCTION IF EXISTS trg_inventory_history_fn();
DROP FUNCTION IF EXISTS trg_patientschedule_history_fn();
DROP FUNCTION IF EXISTS trg_immunizations_history_fn();

-- PATIENTS history
CREATE OR REPLACE FUNCTION trg_patients_history_fn() RETURNS trigger AS $$
DECLARE
    v_changed jsonb; v_version int; v_id bigint; v_snapshot jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN v_changed := to_jsonb(NEW); v_snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN v_changed := jsonb_diff(to_jsonb(OLD), to_jsonb(NEW)); IF v_changed = '{}'::jsonb THEN RETURN NEW; END IF; v_snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN v_changed := jsonb_build_object('deleted', true); v_snapshot := to_jsonb(OLD);
    END IF;
    v_id := COALESCE(NEW.patient_id, OLD.patient_id);
    SELECT COALESCE(MAX(version_no),0)+1 INTO v_version FROM patients_history WHERE patient_id = v_id;
    INSERT INTO patients_history(patient_id, version_no, changed_at, changed_by, changed_fields, snapshot)
    VALUES (v_id, v_version, now(), current_setting('app.user_id', true)::bigint, v_changed, v_snapshot);
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patients_history AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW EXECUTE FUNCTION trg_patients_history_fn();

-- INVENTORY history
CREATE OR REPLACE FUNCTION trg_inventory_history_fn() RETURNS trigger AS $$
DECLARE
    v_changed jsonb; v_version int; v_id bigint; v_snapshot jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN v_changed := to_jsonb(NEW); v_snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN v_changed := jsonb_diff(to_jsonb(OLD), to_jsonb(NEW)); IF v_changed = '{}'::jsonb THEN RETURN NEW; END IF; v_snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN v_changed := jsonb_build_object('deleted', true); v_snapshot := to_jsonb(OLD);
    END IF;
    v_id := COALESCE(NEW.inventory_id, OLD.inventory_id);
    SELECT COALESCE(MAX(version_no),0)+1 INTO v_version FROM inventory_history WHERE inventory_id = v_id;
    INSERT INTO inventory_history(inventory_id, version_no, changed_at, changed_by, changed_fields, snapshot)
    VALUES (v_id, v_version, now(), current_setting('app.user_id', true)::bigint, v_changed, v_snapshot);
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_history AFTER INSERT OR UPDATE OR DELETE ON inventory
FOR EACH ROW EXECUTE FUNCTION trg_inventory_history_fn();

-- PATIENTSCHEDULE history
CREATE OR REPLACE FUNCTION trg_patientschedule_history_fn() RETURNS trigger AS $$
DECLARE
    v_changed jsonb; v_version int; v_id bigint; v_snapshot jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN v_changed := to_jsonb(NEW); v_snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN v_changed := jsonb_diff(to_jsonb(OLD), to_jsonb(NEW)); IF v_changed = '{}'::jsonb THEN RETURN NEW; END IF; v_snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN v_changed := jsonb_build_object('deleted', true); v_snapshot := to_jsonb(OLD);
    END IF;
    v_id := COALESCE(NEW.patient_schedule_id, OLD.patient_schedule_id);
    SELECT COALESCE(MAX(version_no),0)+1 INTO v_version FROM patientschedule_history WHERE patient_schedule_id = v_id;
    INSERT INTO patientschedule_history(patient_schedule_id, version_no, changed_at, changed_by, changed_fields, snapshot)
    VALUES (v_id, v_version, now(), current_setting('app.user_id', true)::bigint, v_changed, v_snapshot);
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patientschedule_history AFTER INSERT OR UPDATE OR DELETE ON patientschedule
FOR EACH ROW EXECUTE FUNCTION trg_patientschedule_history_fn();

-- IMMUNIZATIONS history
CREATE OR REPLACE FUNCTION trg_immunizations_history_fn() RETURNS trigger AS $$
DECLARE
    v_changed jsonb; v_version int; v_id bigint; v_snapshot jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN v_changed := to_jsonb(NEW); v_snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN v_changed := jsonb_diff(to_jsonb(OLD), to_jsonb(NEW)); IF v_changed = '{}'::jsonb THEN RETURN NEW; END IF; v_snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN v_changed := jsonb_build_object('deleted', true); v_snapshot := to_jsonb(OLD);
    END IF;
    v_id := COALESCE(NEW.immunization_id, OLD.immunization_id);
    SELECT COALESCE(MAX(version_no),0)+1 INTO v_version FROM immunizations_history WHERE immunization_id = v_id;
    INSERT INTO immunizations_history(immunization_id, version_no, changed_at, changed_by, changed_fields, snapshot)
    VALUES (v_id, v_version, now(), current_setting('app.user_id', true)::bigint, v_changed, v_snapshot);
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immunizations_history AFTER INSERT OR UPDATE OR DELETE ON immunizations
FOR EACH ROW EXECUTE FUNCTION trg_immunizations_history_fn();

COMMIT;

-- End migration
