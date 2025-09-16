const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
// Prefer service role key for server-side access
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!url) {
  console.error('Missing SUPABASE_URL in environment.');
  process.exit(1);
}

if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_KEY (or SUPABASE_KEY) in environment.');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  console.warn('Warning: Using SUPABASE_KEY instead of SUPABASE_SERVICE_KEY. Set SUPABASE_SERVICE_KEY for server-side operations.');
}

const supabase = createClient(url, serviceKey);

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

module.exports = supabase;