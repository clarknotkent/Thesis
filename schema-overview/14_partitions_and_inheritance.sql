-- Partitioned tables and inheritance relationships
WITH parents AS (
  SELECT n.nspname AS schema, c.relname AS parent_table, c.oid AS parent_oid
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('p','r')
    AND n.nspname NOT IN ('pg_catalog','information_schema')
), children AS (
  SELECT
    pn.nspname AS schema,
    pc.relname AS child_table,
    inh.inhparent AS parent_oid,
    pc.oid AS child_oid
  FROM pg_inherits inh
  JOIN pg_class pc ON pc.oid = inh.inhrelid
  JOIN pg_namespace pn ON pn.oid = pc.relnamespace
)
SELECT p.schema AS parent_schema, p.parent_table, c.schema AS child_schema, c.child_table
FROM parents p
JOIN children c ON c.parent_oid = p.parent_oid
ORDER BY parent_schema, parent_table, child_schema, child_table;

Success. No rows returned.