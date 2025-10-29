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
  AND n.nspname = 'public' -- Limit to public schema only
ORDER BY schema, table_name;

| schema | table_name                    | est_rows | table_size | indexes_size | total_size |
| ------ | ----------------------------- | -------- | ---------- | ------------ | ---------- |
| public | activity_action_types         | 51       | 8192 bytes | 16 kB        | 32 kB      |
| public | activitylogs                  | 1534     | 1984 kB    | 408 kB       | 2432 kB    |
| public | birthhistory                  | 11       | 16 kB      | 32 kB        | 88 kB      |
| public | conversationparticipants      | 19       | 24 kB      | 32 kB        | 88 kB      |
| public | conversations                 | 9        | 8192 bytes | 16 kB        | 56 kB      |
| public | deworming                     | 0        | 0 bytes    | 56 kB        | 64 kB      |
| public | deworming_history             | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public | faqs                          | 2        | 8192 bytes | 16 kB        | 32 kB      |
| public | guardian_auto_send_settings   | 0        | 0 bytes    | 64 kB        | 64 kB      |
| public | guardians                     | 7        | 16 kB      | 48 kB        | 104 kB     |
| public | health_staff_types            | 3        | 8192 bytes | 16 kB        | 32 kB      |
| public | immunizations                 | 47       | 168 kB     | 144 kB       | 352 kB     |
| public | immunizations_history         | 0        | 0 bytes    | 32 kB        | 40 kB      |
| public | inventory                     | 19       | 24 kB      | 80 kB        | 144 kB     |
| public | inventory_history             | 244      | 520 kB     | 80 kB        | 640 kB     |
| public | inventory_requests            | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public | inventory_requests_history    | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public | inventorytransactions         | 49       | 72 kB      | 16 kB        | 128 kB     |
| public | inventorytransactions_history | 465      | 864 kB     | 144 kB       | 1048 kB    |
| public | message_receipts              | 39       | 16 kB      | 48 kB        | 96 kB      |
| public | messages                      | 34       | 56 kB      | 128 kB       | 224 kB     |
| public | notifications                 | 24       | 40 kB      | 176 kB       | 256 kB     |
| public | patients                      | 11       | 536 kB     | 296 kB       | 872 kB     |
| public | patients_history              | 319      | 1160 kB    | 304 kB       | 1504 kB    |
| public | patientschedule               | 165      | 216 kB     | 424 kB       | 672 kB     |
| public | patientschedule_history       | 2419     | 4168 kB    | 1456 kB      | 5664 kB    |
| public | receiving_report_items        | 29       | 48 kB      | 64 kB        | 152 kB     |
| public | receiving_reports             | 20       | 32 kB      | 80 kB        | 152 kB     |
| public | schedule_doses                | 15       | 24 kB      | 64 kB        | 128 kB     |
| public | schedule_master               | 7        | 16 kB      | 64 kB        | 120 kB     |
| public | sms_logs                      | 1        | 8192 bytes | 192 kB       | 208 kB     |
| public | sms_templates                 | 6        | 8192 bytes | 112 kB       | 128 kB     |
| public | timestamp_normalization_audit | 0        | 0 bytes    | 8192 bytes   | 16 kB      |
| public | user_mapping                  | 17       | 8192 bytes | 32 kB        | 72 kB      |
| public | user_sessions                 | 5        | 8192 bytes | 32 kB        | 72 kB      |
| public | users                         | 17       | 32 kB      | 248 kB       | 320 kB     |
| public | users_history                 | 364      | 1016 kB    | 360 kB       | 1416 kB    |
| public | v_dob                         | 1        | 8192 bytes | 0 bytes      | 8192 bytes |
| public | vaccinemaster                 | 12       | 16 kB      | 64 kB        | 120 kB     |
| public | visits                        | 12       | 56 kB      | 32 kB        | 128 kB     |
| public | visits_history                | 152      | 328 kB     | 48 kB        | 416 kB     |
| public | vitalsigns                    | 12       | 16 kB      | 32 kB        | 80 kB      |
| public | vitamina                      | 0        | 0 bytes    | 56 kB        | 64 kB      |
| public | vitamina_history              | 0        | 0 bytes    | 16 kB        | 24 kB      |