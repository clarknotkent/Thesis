-- List schemas and tables (incl. type, owner, estimates, and sizes)
WITH rels AS (
  SELECT
    n.nspname AS schema,
    c.relname AS name,
    c.relkind,
    c.relpersistence,
    pg_catalog.pg_get_userbyid(c.relowner) AS owner,
    COALESCE(s.n_live_tup, 0) AS est_rows,
    pg_total_relation_size(c.oid) AS total_bytes,
    pg_relation_size(c.oid) AS table_bytes,
    pg_indexes_size(c.oid) AS index_bytes,
    pg_total_relation_size(c.oid) - pg_relation_size(c.oid) - pg_indexes_size(c.oid) AS toast_bytes
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
  WHERE n.nspname NOT IN ('pg_catalog','information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'
    AND n.nspname NOT LIKE 'pg_temp%'
    AND n.nspname = 'public' -- Limit to public schema only
    AND c.relkind IN ('r','p','v','m','f') -- table, partitioned table, view, matview, foreign table
)
SELECT
  schema,
  name,
  CASE relkind
    WHEN 'r' THEN 'table'
    WHEN 'p' THEN 'partitioned table'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized view'
    WHEN 'f' THEN 'foreign table'
  END AS object_type,
  owner,
  est_rows,
  pg_size_pretty(total_bytes) AS total_size,
  pg_size_pretty(table_bytes) AS table_size,
  pg_size_pretty(index_bytes) AS index_size,
  pg_size_pretty(TOAST_bytes) AS toast_size,
  relpersistence AS persistence
FROM rels
ORDER BY schema, object_type, name;

| schema | name                          | object_type       | owner    | est_rows | total_size | table_size | index_size | toast_size | persistence |
| ------ | ----------------------------- | ----------------- | -------- | -------- | ---------- | ---------- | ---------- | ---------- | ----------- |
| public | defaulters_mv                 | materialized view | postgres | 0        | 8192 bytes | 0 bytes    | 8192 bytes | 0 bytes    | p           |
| public | activity_action_types         | table             | postgres | 51       | 32 kB      | 8192 bytes | 16 kB      | 8192 bytes | p           |
| public | activitylogs                  | table             | postgres | 1104     | 728 kB     | 424 kB     | 224 kB     | 80 kB      | p           |
| public | birthhistory                  | table             | postgres | 21       | 88 kB      | 16 kB      | 32 kB      | 40 kB      | p           |
| public | conversationparticipants      | table             | postgres | 25       | 88 kB      | 24 kB      | 32 kB      | 32 kB      | p           |
| public | conversations                 | table             | postgres | 12       | 56 kB      | 8192 bytes | 16 kB      | 32 kB      | p           |
| public | deworming                     | table             | postgres | 0        | 64 kB      | 0 bytes    | 56 kB      | 8192 bytes | p           |
| public | deworming_history             | table             | postgres | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| public | faqs                          | table             | postgres | 2        | 32 kB      | 8192 bytes | 16 kB      | 8192 bytes | p           |
| public | guardian_auto_send_settings   | table             | postgres | 4        | 136 kB     | 8192 bytes | 128 kB     | 0 bytes    | p           |
| public | guardians                     | table             | postgres | 8        | 104 kB     | 16 kB      | 48 kB      | 40 kB      | p           |
| public | health_staff_types            | table             | postgres | 3        | 32 kB      | 8192 bytes | 16 kB      | 8192 bytes | p           |
| public | immunizations                 | table             | postgres | 51       | 368 kB     | 168 kB     | 160 kB     | 40 kB      | p           |
| public | immunizations_history         | table             | postgres | 0        | 40 kB      | 0 bytes    | 32 kB      | 8192 bytes | p           |
| public | inventory                     | table             | postgres | 20       | 144 kB     | 24 kB      | 80 kB      | 40 kB      | p           |
| public | inventory_history             | table             | postgres | 250      | 640 kB     | 520 kB     | 80 kB      | 40 kB      | p           |
| public | inventory_requests            | table             | postgres | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| public | inventory_requests_history    | table             | postgres | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| public | inventorytransactions         | table             | postgres | 55       | 128 kB     | 72 kB      | 16 kB      | 40 kB      | p           |
| public | inventorytransactions_history | table             | postgres | 471      | 1048 kB    | 864 kB     | 144 kB     | 40 kB      | p           |
| public | message_receipts              | table             | postgres | 43       | 96 kB      | 16 kB      | 48 kB      | 32 kB      | p           |
| public | messages                      | table             | postgres | 39       | 224 kB     | 56 kB      | 128 kB     | 40 kB      | p           |
| public | notifications                 | table             | postgres | 42       | 256 kB     | 40 kB      | 176 kB     | 40 kB      | p           |
| public | patients                      | table             | postgres | 21       | 848 kB     | 512 kB     | 296 kB     | 40 kB      | p           |
| public | patients_history              | table             | postgres | 763      | 1528 kB    | 1160 kB    | 328 kB     | 40 kB      | p           |
| public | patientschedule               | table             | postgres | 315      | 672 kB     | 216 kB     | 424 kB     | 32 kB      | p           |
| public | patientschedule_history       | table             | postgres | 3523     | 5776 kB    | 4168 kB    | 1568 kB    | 40 kB      | p           |
| public | receiving_report_items        | table             | postgres | 31       | 152 kB     | 48 kB      | 64 kB      | 40 kB      | p           |
| public | receiving_reports             | table             | postgres | 22       | 152 kB     | 32 kB      | 80 kB      | 40 kB      | p           |
| public | schedule_doses                | table             | postgres | 15       | 128 kB     | 24 kB      | 64 kB      | 40 kB      | p           |
| public | schedule_master               | table             | postgres | 7        | 120 kB     | 16 kB      | 64 kB      | 40 kB      | p           |
| public | sms_log_patientschedule       | table             | postgres | 520      | 120 kB     | 32 kB      | 64 kB      | 24 kB      | p           |
| public | sms_logs                      | table             | postgres | 217      | 384 kB     | 136 kB     | 208 kB     | 40 kB      | p           |
| public | sms_templates                 | table             | postgres | 6        | 128 kB     | 8192 bytes | 112 kB     | 8192 bytes | p           |
| public | timestamp_normalization_audit | table             | postgres | 0        | 16 kB      | 0 bytes    | 8192 bytes | 8192 bytes | p           |
| public | user_mapping                  | table             | postgres | 18       | 72 kB      | 8192 bytes | 32 kB      | 32 kB      | p           |
| public | user_sessions                 | table             | postgres | 7        | 72 kB      | 8192 bytes | 32 kB      | 32 kB      | p           |
| public | users                         | table             | postgres | 18       | 320 kB     | 32 kB      | 248 kB     | 40 kB      | p           |
| public | users_history                 | table             | postgres | 481      | 1416 kB    | 1016 kB    | 360 kB     | 40 kB      | p           |
| public | v_dob                         | table             | postgres | 1        | 8192 bytes | 8192 bytes | 0 bytes    | 0 bytes    | p           |
| public | vaccinemaster                 | table             | postgres | 12       | 120 kB     | 16 kB      | 64 kB      | 40 kB      | p           |
| public | visits                        | table             | postgres | 14       | 128 kB     | 56 kB      | 32 kB      | 40 kB      | p           |
| public | visits_history                | table             | postgres | 178      | 416 kB     | 328 kB     | 48 kB      | 40 kB      | p           |
| public | vitalsigns                    | table             | postgres | 14       | 80 kB      | 16 kB      | 32 kB      | 32 kB      | p           |
| public | vitamina                      | table             | postgres | 0        | 64 kB      | 0 bytes    | 56 kB      | 8192 bytes | p           |
| public | vitamina_history              | table             | postgres | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| public | activitylogs_view             | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | conversations_view            | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | dashboard_view                | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | defaulters_view               | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | duesoon_view                  | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | immunizationhistory_view      | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | inventorylowstock_view        | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | monthlyreports_view           | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | notifications_view            | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | patients_view                 | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | patientschedule_view          | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | tcl_view                      | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | users_with_uuid               | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | vaccine_report_view           | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | visits_view                   | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public | worker_progress_view          | view              | postgres | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |