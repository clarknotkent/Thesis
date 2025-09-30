-- Fix user_mapping UUID stability
-- Goals:
-- 1) Stop auto-creating placeholder random UUIDs on users insert
-- 2) Make user_mapping.uuid effectively immutable once set, except via privileged path
-- 3) Provide safe link and force-link functions for Supabase UUID association

BEGIN;

-- 1) Remove auto-create trigger and function (placeholders cause churn on restore)
DROP TRIGGER IF EXISTS trg_create_user_mapping_on_user_insert ON users;
DROP FUNCTION IF EXISTS public.create_user_mapping_on_user_insert();

-- 2) Enforce immutability of user_mapping.uuid for non-privileged updates
CREATE OR REPLACE FUNCTION public.trg_user_mapping_lock_uuid()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.uuid IS DISTINCT FROM OLD.uuid THEN
        -- Allow change only if the old value is NULL OR the session has elevated role
        IF OLD.uuid IS NOT NULL AND COALESCE(public.current_app_role(), current_setting('app.role', true)) NOT IN ('service','Admin','admin') THEN
            RAISE EXCEPTION 'user_mapping.uuid is immutable once set (user_id %). Use force_link_supabase_user() for overrides.', NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_mapping_lock_uuid ON user_mapping;
CREATE TRIGGER trg_user_mapping_lock_uuid
BEFORE UPDATE OF uuid ON user_mapping
FOR EACH ROW
EXECUTE FUNCTION public.trg_user_mapping_lock_uuid();

-- 3a) Safe linking: set mapping only if not already set; never override existing non-null mapping
CREATE OR REPLACE FUNCTION public.link_supabase_user(p_supabase_uuid uuid, p_user_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists boolean;
    v_has_uuid boolean;
BEGIN
    -- Ensure a row exists for the user_id, but do not override if a different uuid is present
    INSERT INTO user_mapping (uuid, user_id)
    VALUES (p_supabase_uuid, p_user_id)
    ON CONFLICT (user_id)
    DO NOTHING;

    -- If a row exists with NULL uuid, set it to the provided value
    UPDATE user_mapping
       SET uuid = p_supabase_uuid
     WHERE user_id = p_user_id AND uuid IS NULL;

    -- Check if mapping now matches
    SELECT EXISTS(SELECT 1 FROM user_mapping WHERE user_id = p_user_id) INTO v_exists;
    IF NOT v_exists THEN RETURN FALSE; END IF;

    SELECT (uuid IS NOT NULL) INTO v_has_uuid FROM user_mapping WHERE user_id = p_user_id;
    RETURN v_has_uuid;
END;
$$;

-- 3b) Privileged override: allow Admin/service to forcefully set/replace the uuid mapping with audit log
CREATE OR REPLACE FUNCTION public.force_link_supabase_user(p_supabase_uuid uuid, p_user_id bigint, p_reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_actor bigint := NULLIF(current_setting('app.user_id', true),'')::bigint;
    v_role  text   := COALESCE(public.current_app_role(), current_setting('app.role', true));
    v_old   uuid;
BEGIN
    -- Only allow privileged roles
    IF v_role NOT IN ('service','Admin','admin') THEN
        RAISE EXCEPTION 'Not authorized to override user mapping (role: %)', v_role;
    END IF;

    SELECT uuid INTO v_old FROM user_mapping WHERE user_id = p_user_id;

    INSERT INTO user_mapping (uuid, user_id)
    VALUES (p_supabase_uuid, p_user_id)
    ON CONFLICT (user_id)
    DO UPDATE SET uuid = EXCLUDED.uuid;

    -- Audit the override
    INSERT INTO activitylogs(action_type, actor_user_id, target_table, target_id, details)
    VALUES (
        'USER_LINK_UPDATED',
        v_actor,
        'user_mapping',
        p_user_id,
        jsonb_build_object('old_uuid', v_old::text, 'new_uuid', p_supabase_uuid::text, 'reason', p_reason)
    );
    RETURN TRUE;
END;
$$;

COMMIT;
