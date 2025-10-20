-- Tables without a primary key
SELECT n.nspname AS schema, c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r','p')
  AND n.nspname NOT IN ('pg_catalog','information_schema')
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    WHERE con.conrelid = c.oid AND con.contype = 'p'
  )
ORDER BY schema, table_name;

| schema | table_name |
| ------ | ---------- |
| public | v_dob      |