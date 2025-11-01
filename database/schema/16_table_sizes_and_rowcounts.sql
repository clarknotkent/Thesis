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
| public | activitylogs                  | 1104     | 424 kB     | 224 kB       | 728 kB     |
| public | birthhistory                  | 21       | 16 kB      | 32 kB        | 88 kB      |
| public | conversationparticipants      | 25       | 24 kB      | 32 kB        | 88 kB      |
| public | conversations                 | 12       | 8192 bytes | 16 kB        | 56 kB      |
| public | deworming                     | 0        | 0 bytes    | 56 kB        | 64 kB      |
| public | deworming_history             | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public | faqs                          | 2        | 8192 bytes | 16 kB        | 32 kB      |
| public | guardian_auto_send_settings   | 4        | 8192 bytes | 128 kB       | 136 kB     |
| public | guardians                     | 8        | 16 kB      | 48 kB        | 104 kB     |
| public | health_staff_types            | 3        | 8192 bytes | 16 kB        | 32 kB      |
| public | immunizations                 | 51       | 168 kB     | 160 kB       | 368 kB     |
| public | immunizations_history         | 0        | 0 bytes    | 32 kB        | 40 kB      |
| public | inventory                     | 20       | 24 kB      | 80 kB        | 144 kB     |
| public | inventory_history             | 250      | 520 kB     | 80 kB        | 640 kB     |
| public | inventory_requests            | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public | inventory_requests_history    | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public | inventorytransactions         | 55       | 72 kB      | 16 kB        | 128 kB     |
| public | inventorytransactions_history | 471      | 864 kB     | 144 kB       | 1048 kB    |
| public | message_receipts              | 43       | 16 kB      | 48 kB        | 96 kB      |
| public | messages                      | 39       | 56 kB      | 128 kB       | 224 kB     |
| public | notifications                 | 42       | 40 kB      | 176 kB       | 256 kB     |
| public | patients                      | 21       | 512 kB     | 296 kB       | 848 kB     |
| public | patients_history              | 763      | 1160 kB    | 328 kB       | 1528 kB    |
| public | patientschedule               | 315      | 216 kB     | 424 kB       | 672 kB     |
| public | patientschedule_history       | 3523     | 4168 kB    | 1568 kB      | 5776 kB    |
| public | receiving_report_items        | 31       | 48 kB      | 64 kB        | 152 kB     |
| public | receiving_reports             | 22       | 32 kB      | 80 kB        | 152 kB     |
| public | schedule_doses                | 15       | 24 kB      | 64 kB        | 128 kB     |
| public | schedule_master               | 7        | 16 kB      | 64 kB        | 120 kB     |
| public | sms_log_patientschedule       | 520      | 32 kB      | 64 kB        | 120 kB     |
| public | sms_logs                      | 217      | 136 kB     | 208 kB       | 384 kB     |
| public | sms_templates                 | 6        | 8192 bytes | 112 kB       | 128 kB     |
| public | timestamp_normalization_audit | 0        | 0 bytes    | 8192 bytes   | 16 kB      |
| public | user_mapping                  | 18       | 8192 bytes | 32 kB        | 72 kB      |
| public | user_sessions                 | 7        | 8192 bytes | 32 kB        | 72 kB      |
| public | users                         | 18       | 32 kB      | 248 kB       | 320 kB     |
| public | users_history                 | 481      | 1016 kB    | 360 kB       | 1416 kB    |
| public | v_dob                         | 1        | 8192 bytes | 0 bytes      | 8192 bytes |
| public | vaccinemaster                 | 12       | 16 kB      | 64 kB        | 120 kB     |
| public | visits                        | 14       | 56 kB      | 32 kB        | 128 kB     |
| public | visits_history                | 178      | 328 kB     | 48 kB        | 416 kB     |
| public | vitalsigns                    | 14       | 16 kB      | 32 kB        | 80 kB      |
| public | vitamina                      | 0        | 0 bytes    | 56 kB        | 64 kB      |
| public | vitamina_history              | 0        | 0 bytes    | 16 kB        | 24 kB      |