-- Per-table autovacuum and toast autovacuum options
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  c.reloptions AS reloptions,
  t.reloptions AS toast_reloptions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_class t ON t.oid = c.reltoastrelid
WHERE c.relkind IN ('r','p')
  AND n.nspname NOT IN ('pg_catalog','information_schema')
ORDER BY schema, table_name;

| schema   | table_name                    | reloptions | toast_reloptions |
| -------- | ----------------------------- | ---------- | ---------------- |
| auth     | audit_log_entries             | null       | null             |
| auth     | flow_state                    | null       | null             |
| auth     | identities                    | null       | null             |
| auth     | instances                     | null       | null             |
| auth     | mfa_amr_claims                | null       | null             |
| auth     | mfa_challenges                | null       | null             |
| auth     | mfa_factors                   | null       | null             |
| auth     | oauth_authorizations          | null       | null             |
| auth     | oauth_clients                 | null       | null             |
| auth     | oauth_consents                | null       | null             |
| auth     | one_time_tokens               | null       | null             |
| auth     | refresh_tokens                | null       | null             |
| auth     | saml_providers                | null       | null             |
| auth     | saml_relay_states             | null       | null             |
| auth     | schema_migrations             | null       | null             |
| auth     | sessions                      | null       | null             |
| auth     | sso_domains                   | null       | null             |
| auth     | sso_providers                 | null       | null             |
| auth     | users                         | null       | null             |
| cron     | job                           | null       | null             |
| cron     | job_run_details               | null       | null             |
| public   | activity_action_types         | null       | null             |
| public   | activitylogs                  | null       | null             |
| public   | birthhistory                  | null       | null             |
| public   | conversationparticipants      | null       | null             |
| public   | conversations                 | null       | null             |
| public   | deworming                     | null       | null             |
| public   | deworming_history             | null       | null             |
| public   | faqs                          | null       | null             |
| public   | guardians                     | null       | null             |
| public   | health_staff_types            | null       | null             |
| public   | immunizations                 | null       | null             |
| public   | immunizations_history         | null       | null             |
| public   | inventory                     | null       | null             |
| public   | inventory_history             | null       | null             |
| public   | inventory_requests            | null       | null             |
| public   | inventory_requests_history    | null       | null             |
| public   | inventorytransactions         | null       | null             |
| public   | inventorytransactions_history | null       | null             |
| public   | message_receipts              | null       | null             |
| public   | messages                      | null       | null             |
| public   | notifications                 | null       | null             |
| public   | patients                      | null       | null             |
| public   | patients_history              | null       | null             |
| public   | patientschedule               | null       | null             |
| public   | patientschedule_history       | null       | null             |
| public   | receiving_report_items        | null       | null             |
| public   | receiving_reports             | null       | null             |
| public   | schedule_doses                | null       | null             |
| public   | schedule_master               | null       | null             |
| public   | timestamp_normalization_audit | null       | null             |
| public   | user_mapping                  | null       | null             |
| public   | user_sessions                 | null       | null             |
| public   | users                         | null       | null             |
| public   | users_history                 | null       | null             |
| public   | v_dob                         | null       | null             |
| public   | vaccinemaster                 | null       | null             |
| public   | visits                        | null       | null             |
| public   | visits_history                | null       | null             |
| public   | vitalsigns                    | null       | null             |
| public   | vitamina                      | null       | null             |
| public   | vitamina_history              | null       | null             |
| realtime | messages                      | null       | null             |
| realtime | schema_migrations             | null       | null             |
| realtime | subscription                  | null       | null             |
| storage  | buckets                       | null       | null             |
| storage  | buckets_analytics             | null       | null             |
| storage  | migrations                    | null       | null             |
| storage  | objects                       | null       | null             |
| storage  | prefixes                      | null       | null             |
| storage  | s3_multipart_uploads          | null       | null             |
| storage  | s3_multipart_uploads_parts    | null       | null             |
| vault    | secrets                       | null       | null             |