const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
// Prefer service role key for server-side access; fall back to anon key if needed (dev only)
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!url || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_KEY in environment.');
}

if (!process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_KEY) {
  console.warn('[Supabase] Using SUPABASE_KEY (anon) instead of SUPABASE_SERVICE_KEY. Set SUPABASE_SERVICE_KEY for server-side operations.');
}

const supabase = createClient(url, serviceKey);

// Add timezone logging
console.log('Backend local timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Current date in local timezone:', new Date().toString());
console.log('Current date in UTC:', new Date().toISOString());

// Test database connectivity with a lightweight call
supabase
  .from('users')
  .select('user_id')
  .limit(1)
  .then(({ error }) => {
    if (error) {
      // Postgres error code 42704: undefined_object (e.g., missing GUC like app.current_user_id)
      if (error.code === '42704') {
        console.warn('Database connected, but session GUC not set: app.current_user_id. It will be treated as empty for anonymous.');
      } else {
        console.error('Database connection error:', error);
      }
    } else {
      console.log('Database connected successfully');
    }
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });

// Query database timezone and current time
supabase
  .from('users')
  .select('NOW() as db_time')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('Error querying database time:', error);
    } else {
      console.log('Database current time (in DB timezone):', data[0]?.db_time);
    }
  })
  .catch((err) => {
    console.error('Error querying database time:', err);
  });

module.exports = supabase;