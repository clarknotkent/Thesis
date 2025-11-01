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
  AND n.nspname = 'public' -- Limit to public schema only
ORDER BY schema, table_name;

| schema | table_name                    | rls_enabled | rls_forced |
| ------ | ----------------------------- | ----------- | ---------- |
| public | activity_action_types         | false       | false      |
| public | activitylogs                  | true        | false      |
| public | birthhistory                  | false       | false      |
| public | conversationparticipants      | true        | false      |
| public | conversations                 | true        | false      |
| public | deworming                     | true        | false      |
| public | deworming_history             | false       | false      |
| public | faqs                          | false       | false      |
| public | guardian_auto_send_settings   | false       | false      |
| public | guardians                     | true        | false      |
| public | health_staff_types            | false       | false      |
| public | immunizations                 | true        | false      |
| public | immunizations_history         | false       | false      |
| public | inventory                     | true        | false      |
| public | inventory_history             | false       | false      |
| public | inventory_requests            | true        | false      |
| public | inventory_requests_history    | false       | false      |
| public | inventorytransactions         | true        | false      |
| public | inventorytransactions_history | false       | false      |
| public | message_receipts              | false       | false      |
| public | messages                      | true        | false      |
| public | notifications                 | true        | false      |
| public | patients                      | true        | false      |
| public | patients_history              | false       | false      |
| public | patientschedule               | true        | false      |
| public | patientschedule_history       | false       | false      |
| public | receiving_report_items        | false       | false      |
| public | receiving_reports             | false       | false      |
| public | schedule_doses                | false       | false      |
| public | schedule_master               | false       | false      |
| public | sms_log_patientschedule       | false       | false      |
| public | sms_logs                      | false       | false      |
| public | sms_templates                 | false       | false      |
| public | timestamp_normalization_audit | false       | false      |
| public | user_mapping                  | true        | false      |
| public | user_sessions                 | false       | false      |
| public | users                         | true        | false      |
| public | users_history                 | false       | false      |
| public | v_dob                         | false       | false      |
| public | vaccinemaster                 | true        | false      |
| public | visits                        | true        | false      |
| public | visits_history                | false       | false      |
| public | vitalsigns                    | true        | false      |
| public | vitamina                      | true        | false      |
| public | vitamina_history              | false       | false      |