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
ORDER BY schema, table_name;

| schema   | table_name                    | est_rows | table_size | indexes_size | total_size |
| -------- | ----------------------------- | -------- | ---------- | ------------ | ---------- |
| auth     | audit_log_entries             | 593      | 216 kB     | 56 kB        | 304 kB     |
| auth     | flow_state                    | 0        | 0 bytes    | 32 kB        | 40 kB      |
| auth     | identities                    | 17       | 8192 bytes | 64 kB        | 112 kB     |
| auth     | instances                     | 0        | 0 bytes    | 8192 bytes   | 16 kB      |
| auth     | mfa_amr_claims                | 369      | 40 kB      | 80 kB        | 152 kB     |
| auth     | mfa_challenges                | 0        | 0 bytes    | 16 kB        | 24 kB      |
| auth     | mfa_factors                   | 0        | 0 bytes    | 48 kB        | 56 kB      |
| auth     | oauth_authorizations          | 0        | 0 bytes    | 32 kB        | 40 kB      |
| auth     | oauth_clients                 | 0        | 0 bytes    | 16 kB        | 24 kB      |
| auth     | oauth_consents                | 0        | 0 bytes    | 40 kB        | 48 kB      |
| auth     | one_time_tokens               | 0        | 0 bytes    | 80 kB        | 88 kB      |
| auth     | refresh_tokens                | 369      | 56 kB      | 160 kB       | 248 kB     |
| auth     | saml_providers                | 0        | 0 bytes    | 24 kB        | 32 kB      |
| auth     | saml_relay_states             | 0        | 0 bytes    | 32 kB        | 40 kB      |
| auth     | schema_migrations             | 67       | 8192 bytes | 16 kB        | 24 kB      |
| auth     | sessions                      | 369      | 40 kB      | 128 kB       | 200 kB     |
| auth     | sso_domains                   | 0        | 0 bytes    | 24 kB        | 32 kB      |
| auth     | sso_providers                 | 0        | 0 bytes    | 24 kB        | 32 kB      |
| auth     | users                         | 17       | 8192 bytes | 136 kB       | 184 kB     |
| cron     | job                           | 3        | 8192 bytes | 32 kB        | 48 kB      |
| cron     | job_run_details               | 0        | 16 kB      | 16 kB        | 64 kB      |
| public   | activity_action_types         | 51       | 8192 bytes | 16 kB        | 32 kB      |
| public   | activitylogs                  | 704      | 152 kB     | 136 kB       | 320 kB     |
| public   | birthhistory                  | 9        | 8192 bytes | 32 kB        | 48 kB      |
| public   | conversationparticipants      | 19       | 8192 bytes | 32 kB        | 72 kB      |
| public   | conversations                 | 9        | 8192 bytes | 16 kB        | 24 kB      |
| public   | deworming                     | 0        | 0 bytes    | 56 kB        | 64 kB      |
| public   | deworming_history             | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public   | faqs                          | 2        | 8192 bytes | 16 kB        | 32 kB      |
| public   | guardians                     | 7        | 8192 bytes | 48 kB        | 64 kB      |
| public   | health_staff_types            | 3        | 8192 bytes | 16 kB        | 32 kB      |
| public   | immunizations                 | 44       | 16 kB      | 144 kB       | 192 kB     |
| public   | immunizations_history         | 0        | 0 bytes    | 32 kB        | 40 kB      |
| public   | inventory                     | 17       | 8192 bytes | 80 kB        | 96 kB      |
| public   | inventory_history             | 63       | 56 kB      | 32 kB        | 120 kB     |
| public   | inventory_requests            | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public   | inventory_requests_history    | 0        | 0 bytes    | 16 kB        | 24 kB      |
| public   | inventorytransactions         | 31       | 8192 bytes | 16 kB        | 32 kB      |
| public   | inventorytransactions_history | 31       | 24 kB      | 32 kB        | 88 kB      |
| public   | message_receipts              | 38       | 8192 bytes | 48 kB        | 56 kB      |
| public   | messages                      | 32       | 8192 bytes | 128 kB       | 144 kB     |
| public   | notifications                 | 21       | 8192 bytes | 176 kB       | 192 kB     |
| public   | patients                      | 9        | 32 kB      | 128 kB       | 200 kB     |
| public   | patients_history              | 122      | 200 kB     | 112 kB       | 344 kB     |
| public   | patientschedule               | 135      | 24 kB      | 144 kB       | 200 kB     |
| public   | patientschedule_history       | 367      | 336 kB     | 152 kB       | 520 kB     |
| public   | receiving_report_items        | 19       | 8192 bytes | 64 kB        | 80 kB      |
| public   | receiving_reports             | 9        | 8192 bytes | 80 kB        | 96 kB      |
| public   | schedule_doses                | 15       | 8192 bytes | 64 kB        | 80 kB      |
| public   | schedule_master               | 7        | 8192 bytes | 64 kB        | 80 kB      |
| public   | timestamp_normalization_audit | 0        | 0 bytes    | 8192 bytes   | 16 kB      |
| public   | user_mapping                  | 17       | 8192 bytes | 32 kB        | 72 kB      |
| public   | user_sessions                 | 1        | 8192 bytes | 32 kB        | 72 kB      |
| public   | users                         | 17       | 16 kB      | 232 kB       | 288 kB     |
| public   | users_history                 | 189      | 200 kB     | 136 kB       | 368 kB     |
| public   | v_dob                         | 1        | 8192 bytes | 0 bytes      | 8192 bytes |
| public   | vaccinemaster                 | 12       | 8192 bytes | 64 kB        | 80 kB      |
| public   | visits                        | 10       | 16 kB      | 32 kB        | 80 kB      |
| public   | visits_history                | 23       | 24 kB      | 32 kB        | 88 kB      |
| public   | vitalsigns                    | 10       | 8192 bytes | 32 kB        | 40 kB      |
| public   | vitamina                      | 0        | 0 bytes    | 56 kB        | 64 kB      |
| public   | vitamina_history              | 0        | 0 bytes    | 16 kB        | 24 kB      |
| realtime | messages                      | 0        | 0 bytes    | 0 bytes      | 0 bytes    |
| realtime | schema_migrations             | 64       | 8192 bytes | 16 kB        | 24 kB      |
| realtime | subscription                  | 0        | 0 bytes    | 24 kB        | 32 kB      |
| storage  | buckets                       | 0        | 0 bytes    | 16 kB        | 24 kB      |
| storage  | buckets_analytics             | 0        | 0 bytes    | 8192 bytes   | 16 kB      |
| storage  | migrations                    | 44       | 8192 bytes | 32 kB        | 40 kB      |
| storage  | objects                       | 0        | 0 bytes    | 56 kB        | 64 kB      |
| storage  | prefixes                      | 0        | 0 bytes    | 16 kB        | 24 kB      |
| storage  | s3_multipart_uploads          | 0        | 0 bytes    | 16 kB        | 24 kB      |
| storage  | s3_multipart_uploads_parts    | 0        | 0 bytes    | 8192 bytes   | 16 kB      |
| vault    | secrets                       | 0        | 0 bytes    | 16 kB        | 24 kB      |