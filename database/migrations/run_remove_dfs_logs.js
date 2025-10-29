const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

// Supabase configuration
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!url || !serviceKey) {
  console.error('✗ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function runMigration() {
  try {
    console.log('Starting DFS logs blocking migration...\n');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'block_dfs_logs.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing migration SQL...');
    
    // Execute the migration using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('Trying alternative execution method...');
      
      // Split SQL into individual statements and execute them
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.toLowerCase().includes('delete from activitylogs')) {
          console.log('Deleting existing DFS logs...');
        } else if (statement.toLowerCase().includes('create or replace function')) {
          console.log('Creating block function...');
        } else if (statement.toLowerCase().includes('create trigger')) {
          console.log('Creating trigger...');
        }
        
        // Use the Supabase client to execute raw SQL
        const { error: stmtError } = await supabase.rpc('exec_sql', { query: statement });
        if (stmtError && stmtError.code !== '42P07') { // Ignore "already exists" errors
          throw stmtError;
        }
      }
    }
    
    console.log('\n✓ Migration completed successfully!');
    console.log('✓ All DFS_VISIT and DFS_ENQUEUE logs have been deleted');
    console.log('✓ Trigger installed to silently block future DFS logging attempts');
    console.log('\nNote: No changes to existing functions were needed.');
    
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message || error);
    console.error('\nPlease run the SQL migration manually using:');
    console.error('  psql -d your_database -f database/migrations/block_dfs_logs.sql');
    console.error('\nOr execute it through Supabase SQL Editor.');
    process.exit(1);
  }
}

// Run the migration
runMigration();
