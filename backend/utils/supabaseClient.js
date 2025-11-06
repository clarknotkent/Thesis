import serviceClient from '../db.js';

// For now, always use the service client. Our app-issued JWTs are not Supabase user tokens;
// forwarding them to PostgREST causes it to attempt SET ROLE to the custom value (e.g., 'Admin'),
// which fails with: role "Admin" does not exist. When/if we adopt real Supabase user tokens,
// we can re-enable per-request RLS by constructing a client with the anon key and the Supabase
// access token in the Authorization header.
function getSupabaseForRequest(_req) {
  return serviceClient;
}

export { getSupabaseForRequest };
