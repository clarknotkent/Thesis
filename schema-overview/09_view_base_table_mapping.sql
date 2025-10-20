-- Map each view to base relations it depends on
WITH views AS (
  SELECT c.oid AS view_oid, n.nspname AS schema, c.relname AS view_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'v'
    AND n.nspname NOT IN ('pg_catalog','information_schema')
), deps AS (
  SELECT DISTINCT
    v.schema,
    v.view_name,
    n2.nspname AS base_schema,
    c2.relname AS base_table,
    c2.relkind AS base_kind
  FROM views v
  JOIN pg_depend d ON d.refobjid = v.view_oid
  JOIN pg_rewrite r ON r.oid = d.objid
  JOIN pg_class c2 ON c2.oid = r.ev_class
  JOIN pg_namespace n2 ON n2.oid = c2.relnamespace
  WHERE n2.nspname NOT IN ('pg_catalog','information_schema')
)
SELECT schema AS view_schema, view_name, base_schema, base_table,
  CASE base_kind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized view' WHEN 'f' THEN 'foreign table' END AS base_kind
FROM deps
ORDER BY view_schema, view_name, base_schema, base_table;

| view_schema | view_name                | base_schema | base_table               | base_kind |
| ----------- | ------------------------ | ----------- | ------------------------ | --------- |
| extensions  | pg_stat_statements       | extensions  | pg_stat_statements       | view      |
| extensions  | pg_stat_statements_info  | extensions  | pg_stat_statements_info  | view      |
| public      | activitylogs_view        | public      | activitylogs_view        | view      |
| public      | conversations_view       | public      | conversations_view       | view      |
| public      | dashboard_view           | public      | dashboard_view           | view      |
| public      | defaulters_view          | public      | dashboard_view           | view      |
| public      | defaulters_view          | public      | defaulters_view          | view      |
| public      | duesoon_view             | public      | dashboard_view           | view      |
| public      | duesoon_view             | public      | duesoon_view             | view      |
| public      | immunizationhistory_view | public      | immunizationhistory_view | view      |
| public      | inventorylowstock_view   | public      | inventorylowstock_view   | view      |
| public      | monthlyreports_view      | public      | monthlyreports_view      | view      |
| public      | notifications_view       | public      | notifications_view       | view      |
| public      | patients_view            | public      | patients_view            | view      |
| public      | patientschedule_view     | public      | patientschedule_view     | view      |
| public      | tcl_view                 | public      | tcl_view                 | view      |
| public      | users_with_uuid          | public      | users_with_uuid          | view      |
| public      | vaccine_report_view      | public      | vaccine_report_view      | view      |
| public      | visits_view              | public      | visits_view              | view      |
| public      | worker_progress_view     | public      | worker_progress_view     | view      |
| vault       | decrypted_secrets        | vault       | decrypted_secrets        | view      |