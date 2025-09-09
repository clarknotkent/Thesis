-- RESET ALL TABLES SCRIPT
-- This script will delete all data from tables and reset auto-increment sequences to start from 1

-- Step 1: Disable all triggers temporarily to avoid foreign key constraint issues
SET session_replication_role = replica;

-- Step 2: Truncate all tables in the correct order (child tables first, then parent tables)
-- Note: TRUNCATE CASCADE will handle foreign key dependencies automatically

TRUNCATE TABLE 
    activitylogs,
    notifications,
    messages,
    conversationparticipants,
    conversations,
    inventorytransactions,
    immunizations,
    vitamina,
    deworming,
    vitalsigns,
    visits,
    patientschedule,
    schedulemaster,
    inventory,
    vaccinemaster,
    birthhistory,
    patients,
    guardians,
    users
RESTART IDENTITY CASCADE;

-- Step 3: Create the user_mapping table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_mapping (
    uuid UUID PRIMARY KEY,       -- Supabase auth.uid()
    user_id BIGINT UNIQUE        -- Your BIGINT user_id
);

-- Truncate user_mapping table as well
TRUNCATE TABLE user_mapping RESTART IDENTITY CASCADE;

-- Step 4: Re-enable triggers
SET session_replication_role = DEFAULT;

-- Step 5: Verify all sequences are reset to 1
SELECT 
    schemaname,
    sequencename,
    last_value
FROM pg_sequences 
WHERE schemaname = 'public'
ORDER BY sequencename;

-- Step 6: Verify all tables are empty
SELECT 
    schemaname,
    relname as "Table Name",
    n_tup_ins as "Rows Inserted",
    n_tup_upd as "Rows Updated",
    n_tup_del as "Rows Deleted"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;

-- Optional: Display confirmation message
DO $$
BEGIN
    RAISE NOTICE 'All tables have been successfully reset and sequences restarted from 1';
    RAISE NOTICE 'user_mapping table is ready for UUID implementation';
END $$;
