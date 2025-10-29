# Block DFS Activity Logs Migration

This migration removes all existing DFS_VISIT and DFS_ENQUEUE activity logs and prevents future insertions of these action types.

## What This Does

1. **Deletes** all existing `DFS_VISIT` and `DFS_ENQUEUE` entries from the `activitylogs` table
2. **Creates** a trigger function that silently ignores future attempts to log these action types
3. **No changes** to existing application functions are needed - they will continue to work normally

## How It Works

The solution uses a **BEFORE INSERT trigger** on the `activitylogs` table:
- When code tries to insert a DFS_VISIT or DFS_ENQUEUE log, the trigger returns NULL
- This silently prevents the insert without raising any errors
- All other activity log types continue to work normally

## Running the Migration

### Option 1: Using Supabase SQL Editor (Recommended)

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `block_dfs_logs.sql`
4. Click **Run**

### Option 2: Using the Node.js Script

```bash
# From the migrations directory
cd database/migrations
node run_remove_dfs_logs.js
```

### Option 3: Using psql (if you have direct database access)

```bash
psql -h your-host -d your-database -U your-user -f database/migrations/block_dfs_logs.sql
```

## Verification

After running the migration, you can verify it worked:

```sql
-- Should return 0
SELECT COUNT(*) FROM activitylogs 
WHERE action_type IN ('DFS_VISIT', 'DFS_ENQUEUE');

-- Should show the trigger exists
SELECT tgname FROM pg_trigger 
WHERE tgname = 'trg_block_dfs_logs';
```

## Testing the Block

Try inserting a DFS log manually - it should be silently ignored:

```sql
-- This will NOT insert anything (no error shown)
INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id)
VALUES ('DFS_VISIT', NULL, 'TEST', NULL);

-- Verify it was blocked (should return 0)
SELECT COUNT(*) FROM activitylogs WHERE action_type = 'DFS_VISIT';
```

## Rollback (if needed)

To remove the blocking trigger and allow DFS logs again:

```sql
DROP TRIGGER IF EXISTS trg_block_dfs_logs ON activitylogs;
DROP FUNCTION IF EXISTS block_dfs_activity_logs();
```

## Notes

- This approach is **safe** and **non-invasive**
- No application code changes are required
- The blocking happens at the database level
- Performance impact is minimal (just a simple IF check on insert)
