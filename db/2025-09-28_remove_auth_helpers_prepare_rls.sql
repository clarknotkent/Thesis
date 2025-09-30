-- Standardize on public helpers for RLS context
-- Note: We DO NOT modify or drop objects in the "auth" schema to avoid ownership issues.

BEGIN;

-- 0) Do not attempt to drop or change functions in the auth schema.
--    We will provide public.* helpers and update RLS to use them.

-- 1) Provide canonical helpers under public schema to read from app context or jwt
-- These are SECURITY DEFINER so RLS can call them safely.
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid text;
  v_id bigint;
BEGIN
  -- Prefer explicit app context if set by API
  v_id := NULLIF(current_setting('app.user_id', true),'')::bigint;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  -- Fallback to Supabase JWT 'sub' mapped via users table
  v_uid := COALESCE(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  );
  IF v_uid IS NOT NULL THEN
    -- Map JWT subject to our internal user_id via user_mapping
    SELECT um.user_id INTO v_id
    FROM public.user_mapping um
    WHERE um.uuid = v_uid::uuid
    LIMIT 1;
  END IF;
  RETURN v_id;
END$$;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_role text;
BEGIN
  v_role := NULLIF(current_setting('app.role', true),'');
  IF v_role IS NOT NULL THEN RETURN v_role; END IF;
  RETURN COALESCE(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  );
END$$;

COMMIT;

-- Next: Update RLS policies to reference public.current_app_user_id() and public.current_app_role().
