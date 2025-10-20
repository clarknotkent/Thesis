-- Table-level RLS enablement flags
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r','p')
  AND n.nspname NOT IN ('pg_catalog','information_schema')
ORDER BY schema, table_name;

| schema   | table_name                    | rls_enabled | rls_forced |
| -------- | ----------------------------- | ----------- | ---------- |
| auth     | audit_log_entries             | true        | false      |
| auth     | flow_state                    | true        | false      |
| auth     | identities                    | true        | false      |
| auth     | instances                     | true        | false      |
| auth     | mfa_amr_claims                | true        | false      |
| auth     | mfa_challenges                | true        | false      |
| auth     | mfa_factors                   | true        | false      |
| auth     | oauth_authorizations          | false       | false      |
| auth     | oauth_clients                 | false       | false      |
| auth     | oauth_consents                | false       | false      |
| auth     | one_time_tokens               | true        | false      |
| auth     | refresh_tokens                | true        | false      |
| auth     | saml_providers                | true        | false      |
| auth     | saml_relay_states             | true        | false      |
| auth     | schema_migrations             | true        | false      |
| auth     | sessions                      | true        | false      |
| auth     | sso_domains                   | true        | false      |
| auth     | sso_providers                 | true        | false      |
| auth     | users                         | true        | false      |
| cron     | job                           | true        | false      |
| cron     | job_run_details               | true        | false      |
| public   | activity_action_types         | false       | false      |
| public   | activitylogs                  | true        | false      |
| public   | birthhistory                  | false       | false      |
| public   | conversationparticipants      | true        | false      |
| public   | conversations                 | true        | false      |
| public   | deworming                     | true        | false      |
| public   | deworming_history             | false       | false      |
| public   | faqs                          | false       | false      |
| public   | guardians                     | true        | false      |
| public   | health_staff_types            | false       | false      |
| public   | immunizations                 | true        | false      |
| public   | immunizations_history         | false       | false      |
| public   | inventory                     | true        | false      |
| public   | inventory_history             | false       | false      |
| public   | inventory_requests            | true        | false      |
| public   | inventory_requests_history    | false       | false      |
| public   | inventorytransactions         | true        | false      |
| public   | inventorytransactions_history | false       | false      |
| public   | message_receipts              | false       | false      |
| public   | messages                      | true        | false      |
| public   | notifications                 | true        | false      |
| public   | patients                      | true        | false      |
| public   | patients_history              | false       | false      |
| public   | patientschedule               | true        | false      |
| public   | patientschedule_history       | false       | false      |
| public   | receiving_report_items        | false       | false      |
| public   | receiving_reports             | false       | false      |
| public   | schedule_doses                | false       | false      |
| public   | schedule_master               | false       | false      |
| public   | timestamp_normalization_audit | false       | false      |
| public   | user_mapping                  | true        | false      |
| public   | users                         | true        | false      |
| public   | users_history                 | false       | false      |
| public   | v_dob                         | false       | false      |
| public   | vaccinemaster                 | true        | false      |
| public   | visits                        | true        | false      |
| public   | visits_history                | false       | false      |
| public   | vitalsigns                    | true        | false      |
| public   | vitamina                      | true        | false      |
| public   | vitamina_history              | false       | false      |
| realtime | messages                      | true        | false      |
| realtime | schema_migrations             | false       | false      |
| realtime | subscription                  | false       | false      |
| storage  | buckets                       | true        | false      |
| storage  | buckets_analytics             | true        | false      |
| storage  | migrations                    | true        | false      |
| storage  | objects                       | true        | false      |
| storage  | prefixes                      | true        | false      |
| storage  | s3_multipart_uploads          | true        | false      |
| storage  | s3_multipart_uploads_parts    | true        | false      |
| vault    | secrets                       | false       | false      |