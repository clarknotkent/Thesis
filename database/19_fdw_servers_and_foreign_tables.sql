-- Foreign data wrappers, servers, user mappings, and foreign tables
-- Servers
WITH servers AS (
  SELECT s.oid, s.srvname, f.fdwname, s.srvtype, s.srvversion, s.srvoptions
  FROM pg_foreign_server s
  JOIN pg_foreign_data_wrapper f ON f.oid = s.srvfdw
),
-- User mappings
umap AS (
  SELECT COALESCE(pg_get_userbyid(um.umuser), 'PUBLIC') AS role, s.srvname, um.umoptions
  FROM pg_user_mapping um
  JOIN pg_foreign_server s ON s.oid = um.umserver
),
-- Foreign tables
ft AS (
  SELECT n.nspname AS schema, c.relname AS foreign_table, s.srvname, ft.ftoptions
  FROM pg_foreign_table ft
  JOIN pg_class c ON c.oid = ft.ftrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_foreign_server s ON s.oid = ft.ftserver
  WHERE n.nspname NOT IN ('pg_catalog','information_schema')
)
SELECT 'server' AS kind, NULL::text AS schema, srvname AS name, fdwname || COALESCE(' ('||srvversion||')','') AS details, srvoptions::text AS options
FROM servers
UNION ALL
SELECT 'user_mapping', NULL, role || ' -> ' || srvname, NULL, umoptions::text FROM umap
UNION ALL
SELECT 'foreign_table', schema, foreign_table, srvname, ftoptions::text FROM ft
ORDER BY kind, schema NULLS FIRST, name;

Success. No rows returned.