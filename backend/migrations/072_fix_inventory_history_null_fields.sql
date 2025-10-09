-- Migration 072: Fix inventory_history trigger to avoid NULL JSONB values
-- Addresses NOT NULL violation on inventory_history.changed_fields (error 23502)

BEGIN;

-- Replace only the inventory history trigger function to be defensive
DROP FUNCTION IF EXISTS trg_inventory_history_fn();

CREATE OR REPLACE FUNCTION trg_inventory_history_fn() RETURNS trigger AS $$
DECLARE
    v_changed jsonb := '{}'::jsonb;
    v_version int;
    v_id bigint;
    v_snapshot jsonb := '{}'::jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_changed := COALESCE(to_jsonb(NEW), '{}'::jsonb);
        v_snapshot := COALESCE(to_jsonb(NEW), '{}'::jsonb);
    ELSIF TG_OP = 'UPDATE' THEN
        v_changed := COALESCE(jsonb_diff(COALESCE(to_jsonb(OLD), '{}'::jsonb), COALESCE(to_jsonb(NEW), '{}'::jsonb)), '{}'::jsonb);
        -- If no effective changes, skip history row
        IF v_changed = '{}'::jsonb THEN
            RETURN NEW;
        END IF;
        v_snapshot := COALESCE(to_jsonb(NEW), '{}'::jsonb);
    ELSIF TG_OP = 'DELETE' THEN
        v_changed := jsonb_build_object('deleted', true);
        v_snapshot := COALESCE(to_jsonb(OLD), '{}'::jsonb);
    END IF;

    v_id := COALESCE(NEW.inventory_id, OLD.inventory_id);
    SELECT COALESCE(MAX(version_no), 0) + 1 INTO v_version FROM inventory_history WHERE inventory_id = v_id;

    INSERT INTO inventory_history (inventory_id, version_no, changed_at, changed_by, changed_fields, snapshot)
    VALUES (
        v_id,
        v_version,
        now(),
        current_setting('app.user_id', true)::bigint,
        COALESCE(v_changed, '{}'::jsonb),
        COALESCE(v_snapshot, '{}'::jsonb)
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it's attached (idempotent if already exists)
DROP TRIGGER IF EXISTS trg_inventory_history ON inventory;
CREATE TRIGGER trg_inventory_history AFTER INSERT OR UPDATE OR DELETE ON inventory
FOR EACH ROW EXECUTE FUNCTION trg_inventory_history_fn();

COMMIT;

-- End migration 072
-- Ensure inventory_history trigger never inserts NULL changed_fields/snapshot
-- This replaces trg_inventory_history_fn to coalesce JSONB values safely.

BEGIN;

CREATE OR REPLACE FUNCTION trg_inventory_history_fn() RETURNS trigger AS $$
DECLARE
    v_changed jsonb; v_version int; v_id bigint; v_snapshot jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_changed := to_jsonb(NEW);
        v_snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        -- jsonb_diff may return NULL in some environments; coalesce to empty object
        v_changed := COALESCE(jsonb_diff(to_jsonb(OLD), to_jsonb(NEW)), '{}'::jsonb);
        IF v_changed = '{}'::jsonb THEN RETURN NEW; END IF;
        v_snapshot := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_changed := jsonb_build_object('deleted', true);
        v_snapshot := to_jsonb(OLD);
    END IF;

    v_changed := COALESCE(v_changed, '{}'::jsonb);
    v_snapshot := COALESCE(v_snapshot, CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END);

    v_id := COALESCE(NEW.inventory_id, OLD.inventory_id);
    SELECT COALESCE(MAX(version_no),0)+1 INTO v_version FROM inventory_history WHERE inventory_id = v_id;
    INSERT INTO inventory_history(inventory_id, version_no, changed_at, changed_by, changed_fields, snapshot)
    VALUES (v_id, v_version, now(), current_setting('app.user_id', true)::bigint, v_changed, v_snapshot);

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$ LANGUAGE plpgsql;

COMMIT;
