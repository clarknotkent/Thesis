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
  AND n.nspname IN ('public')
ORDER BY schema, table_name;

| schema | table_name                    | reloptions | toast_reloptions |
| ------ | ----------------------------- | ---------- | ---------------- |
| public | activity_action_types         | null       | null             |
| public | activitylogs                  | null       | null             |
| public | birthhistory                  | null       | null             |
| public | conversationparticipants      | null       | null             |
| public | conversations                 | null       | null             |
| public | deworming                     | null       | null             |
| public | deworming_history             | null       | null             |
| public | faqs                          | null       | null             |
| public | guardian_auto_send_settings   | null       | null             |
| public | guardians                     | null       | null             |
| public | health_staff_types            | null       | null             |
| public | immunizations                 | null       | null             |
| public | immunizations_history         | null       | null             |
| public | inventory                     | null       | null             |
| public | inventory_history             | null       | null             |
| public | inventory_requests            | null       | null             |
| public | inventory_requests_history    | null       | null             |
| public | inventorytransactions         | null       | null             |
| public | inventorytransactions_history | null       | null             |
| public | message_receipts              | null       | null             |
| public | messages                      | null       | null             |
| public | notifications                 | null       | null             |
| public | patients                      | null       | null             |
| public | patients_history              | null       | null             |
| public | patientschedule               | null       | null             |
| public | patientschedule_history       | null       | null             |
| public | receiving_report_items        | null       | null             |
| public | receiving_reports             | null       | null             |
| public | schedule_doses                | null       | null             |
| public | schedule_master               | null       | null             |
| public | sms_log_patientschedule       | null       | null             |
| public | sms_logs                      | null       | null             |
| public | sms_templates                 | null       | null             |
| public | timestamp_normalization_audit | null       | null             |
| public | user_mapping                  | null       | null             |
| public | user_sessions                 | null       | null             |
| public | users                         | null       | null             |
| public | users_history                 | null       | null             |
| public | v_dob                         | null       | null             |
| public | vaccinemaster                 | null       | null             |
| public | visits                        | null       | null             |
| public | visits_history                | null       | null             |
| public | vitalsigns                    | null       | null             |
| public | vitamina                      | null       | null             |
| public | vitamina_history              | null       | null             |