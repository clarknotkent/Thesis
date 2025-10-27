-- Sizes and estimated row counts per table
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  COALESCE(s.n_live_tup, 0) AS est_rows,
  pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
  pg_size_pretty(pg_indexes_size(c.oid)) AS indexes_size,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE c.relkind IN ('r','p')
  AND n.nspname NOT IN ('pg_catalog','information_schema')
  AND n.nspname = 'public' -- Limit to public schema only
ORDER BY schema, table_name;

| schema | table_name                    | est_rows | table_size | indexes_size | total_size |
| ------ | ----------------------------- | -------- | ---------- | ------------ | ---------- |
| public | activity_action_types         | 51       | 8192 bytes | 16 kB        | 32 kB      |
| public | activitylogs                  | 1086     | 224 kB     | 160 kB       | 416 kB     |
| public | birthhistory                  | 11       | 8192 bytes | 32 kB        | 48 kB      |
| public | conversationparticipants      | 19       | 8192 bytes | 32 kB        | 72 kB      |
| public | conversations                 | 9        | 8192 bytes | 16 kB        | 24 kB      |
| public | deworming                     | 0        | 0 bytes    | 56 kB        | 64 kB      |
| public | deworming_history             | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public | faqs                          | 2        | 8192 bytes | 16 kB        | 32 kB      |
| public | guardian_auto_send_settings   | 0        | 0 bytes    | 64 kB        | 64 kB      |
| public | guardians                     | 7        | 8192 bytes | 48 kB        | 64 kB      |
| public | health_staff_types            | 3        | 8192 bytes | 16 kB        | 32 kB      |
| public | immunizations                 | 47       | 16 kB      | 144 kB       | 192 kB     |
| public | immunizations_history         | 0        | 0 bytes    | 32 kB        | 40 kB      |
| public | inventory                     | 19       | 8192 bytes | 80 kB        | 96 kB      |
| public | inventory_history             | 84       | 88 kB      | 32 kB        | 152 kB     |
| public | inventory_requests            | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public | inventory_requests_history    | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public | inventorytransactions         | 49       | 8192 bytes | 16 kB        | 32 kB      |
| public | inventorytransactions_history | 49       | 32 kB      | 32 kB        | 96 kB      |
| public | message_receipts              | 39       | 8192 bytes | 48 kB        | 56 kB      |
| public | messages                      | 34       | 8192 bytes | 128 kB       | 144 kB     |
| public | notifications                 | 24       | 8192 bytes | 176 kB       | 192 kB     |
| public | patients                      | 11       | 32 kB      | 128 kB       | 200 kB     |
| public | patients_history              | 209      | 328 kB     | 128 kB       | 488 kB     |
| public | patientschedule               | 165      | 24 kB      | 144 kB       | 200 kB     |
| public | patientschedule_history       | 545      | 504 kB     | 184 kB       | 720 kB     |
| public | receiving_report_items        | 29       | 8192 bytes | 64 kB        | 80 kB      |
| public | receiving_reports             | 20       | 8192 bytes | 80 kB        | 96 kB      |
| public | schedule_doses                | 15       | 8192 bytes | 64 kB        | 80 kB      |
| public | schedule_master               | 7        | 8192 bytes | 64 kB        | 80 kB      |
| public | sms_logs                      | 0        | 0 bytes    | 88 kB        | 96 kB      |
| public | sms_templates                 | 4        | 8192 bytes | 112 kB       | 128 kB     |
| public | timestamp_normalization_audit | 0        | 0 bytes    | 8192 bytes   | 16 kB      |
| public | user_mapping                  | 17       | 8192 bytes | 32 kB        | 72 kB      |
| public | user_sessions                 | 4        | 8192 bytes | 32 kB        | 72 kB      |
| public | users                         | 17       | 16 kB      | 232 kB       | 288 kB     |
| public | users_history                 | 236      | 248 kB     | 144 kB       | 424 kB     |
| public | v_dob                         | 1        | 8192 bytes | 0 bytes      | 8192 bytes |
| public | vaccinemaster                 | 12       | 8192 bytes | 64 kB        | 80 kB      |
| public | visits                        | 12       | 16 kB      | 32 kB        | 80 kB      |
| public | visits_history                | 27       | 24 kB      | 32 kB        | 88 kB      |
| public | vitalsigns                    | 12       | 8192 bytes | 32 kB        | 40 kB      |
| public | vitamina                      | 0        | 0 bytes    | 56 kB        | 64 kB      |
| public | vitamina_history              | 0        | 0 bytes    | 16 kB        | 24 kB      |