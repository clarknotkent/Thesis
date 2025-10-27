-- Installed extensions
SELECT extname AS extension, extversion AS version, pg_get_userbyid(extowner) AS owner, nspname AS schema
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY extension;

| extension          | version | owner          | schema     |
| ------------------ | ------- | -------------- | ---------- |
| pg_cron            | 1.6     | supabase_admin | pg_catalog |
| pg_graphql         | 1.5.11  | supabase_admin | graphql    |
| pg_stat_statements | 1.11    | postgres       | extensions |
| pg_trgm            | 1.6     | supabase_admin | public     |
| pgcrypto           | 1.3     | postgres       | extensions |
| plpgsql            | 1.0     | supabase_admin | pg_catalog |
| supabase_vault     | 0.3.1   | supabase_admin | vault      |
| uuid-ossp          | 1.1     | postgres       | extensions |