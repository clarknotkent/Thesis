-- ============================================================================
-- Block DFS_VISIT and DFS_ENQUEUE Activity Logs
-- ============================================================================
-- This migration:
-- 1. Deletes all existing DFS_ENQUEUE and DFS_VISIT activity log entries
-- 2. Creates a trigger to silently ignore future DFS logging attempts
--
-- Created: October 29, 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Delete all existing DFS_ENQUEUE and DFS_VISIT activity logs
-- ============================================================================

DELETE FROM activitylogs 
WHERE action_type IN ('DFS_ENQUEUE', 'DFS_VISIT');

-- ============================================================================
-- STEP 2: Create trigger function to silently block DFS logging
-- ============================================================================

CREATE OR REPLACE FUNCTION public.block_dfs_activity_logs()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Silently ignore DFS_VISIT and DFS_ENQUEUE inserts
    IF NEW.action_type IN ('DFS_VISIT', 'DFS_ENQUEUE') THEN
        RETURN NULL;  -- Prevents the INSERT from happening (no error raised)
    END IF;
    
    RETURN NEW;  -- Allow all other inserts
END;
$function$;

-- ============================================================================
-- STEP 3: Create BEFORE INSERT trigger on activitylogs table
-- ============================================================================

DROP TRIGGER IF EXISTS trg_block_dfs_logs ON activitylogs;

CREATE TRIGGER trg_block_dfs_logs
    BEFORE INSERT ON activitylogs
    FOR EACH ROW
    EXECUTE FUNCTION block_dfs_activity_logs();

-- ============================================================================
-- STEP 4: Verify the setup
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER;
    v_trigger_exists BOOLEAN;
BEGIN
    -- Check remaining DFS logs
    SELECT COUNT(*) INTO v_count FROM activitylogs WHERE action_type IN ('DFS_ENQUEUE', 'DFS_VISIT');
    RAISE NOTICE 'Remaining DFS logs after deletion: %', v_count;
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_block_dfs_logs' 
        AND tgrelid = 'activitylogs'::regclass
    ) INTO v_trigger_exists;
    
    IF v_trigger_exists THEN
        RAISE NOTICE 'Trigger trg_block_dfs_logs successfully created';
    ELSE
        RAISE WARNING 'Trigger trg_block_dfs_logs was not created';
    END IF;
    
    IF v_count = 0 AND v_trigger_exists THEN
        RAISE NOTICE 'SUCCESS: All DFS logs deleted and blocking trigger installed';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- Usage Notes:
-- ============================================================================
-- After running this migration:
-- - All existing DFS_VISIT and DFS_ENQUEUE logs are deleted
-- - Any future attempts to INSERT these action types will be silently ignored
-- - No errors will be raised when code tries to log DFS actions
-- - No changes to existing functions are required
-- ============================================================================
