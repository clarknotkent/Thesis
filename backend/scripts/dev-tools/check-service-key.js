/*
 Diagnostic: Verifies SUPABASE_SERVICE_KEY is loaded and is a service_role key.
 - Decodes JWT payload locally to inspect the `role` claim (expects 'service_role').
 - Calls auth.admin.listUsers() which only works with service_role.
 - Prints only a short prefix of the key for safety.
*/

import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

function decodeJwtPayload(token) {
  try {
    const parts = (token || '').split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = payload.length % 4 === 2 ? '==' : payload.length % 4 === 3 ? '=' : '';
    const json = Buffer.from(payload + pad, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

(async () => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

  if (!url) {
    console.error('Missing SUPABASE_URL');
    process.exit(1);
  }

  if (!serviceKey) {
    console.error('Missing SUPABASE_SERVICE_KEY (or SUPABASE_KEY)');
    process.exit(1);
  }

  const payload = decodeJwtPayload(serviceKey);
  const prefix = serviceKey.slice(0, 8);
  console.log('Env loaded:');
  console.log(' - SUPABASE_URL:', url);
  console.log(' - Key prefix:', prefix + '...');
  if (payload) {
    console.log(' - Key role:', payload.role || '(none)');
    if (payload.exp) {
      const exp = new Date(payload.exp * 1000).toISOString();
      console.log(' - Key expires:', exp);
    }
    if (payload.iss) console.log(' - Issuer:', payload.iss);
  } else {
    console.log(' - Could not decode JWT payload');
  }

  try {
    const client = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
      console.error('Admin API check FAILED:', error.message || error);
      process.exit(2);
    }
    const count = Array.isArray(data?.users) ? data.users.length : 0;
    console.log('Admin API check OK. Users fetched:', count);
    console.log('Conclusion: Using a valid service_role key.');
  } catch (e) {
    console.error('Admin API check exception:', e.message || e);
    process.exit(3);
  }
})();
