-- Sequences and identity columns
WITH seq AS (
  SELECT
    n.nspname AS schema,
    c.relname AS sequence_name,
    s.seqstart,
    s.seqmin,
    s.seqmax,
    s.seqincrement,
    s.seqcache,
    s.seqcycle
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_sequence s ON s.seqrelid = c.oid
  WHERE c.relkind = 'S'
    AND n.nspname NOT IN ('pg_catalog','information_schema')
)
SELECT
  seq.schema,
  seq.sequence_name,
  seq.seqstart,
  seq.seqmin,
  seq.seqmax,
  seq.seqincrement,
  seq.seqcache,
  seq.seqcycle,
  dep.table_schema,
  dep.table_name,
  dep.column_name
FROM seq
LEFT JOIN (
  SELECT
    att.attrelid,
    pn.nspname AS table_schema,
    pc.relname AS table_name,
    att.attname AS column_name,
    pg_get_serial_sequence(format('%I.%I', pn.nspname, pc.relname), att.attname) AS serial_seq
  FROM pg_attribute att
  JOIN pg_class pc ON pc.oid = att.attrelid
  JOIN pg_namespace pn ON pn.oid = pc.relnamespace
  WHERE att.attnum > 0 AND NOT att.attisdropped
    AND pn.nspname NOT IN ('pg_catalog','information_schema')
)
dep ON dep.serial_seq = format('%I.%I', seq.schema, seq.sequence_name)
ORDER BY seq.schema, seq.sequence_name;

| schema   | sequence_name                                            | seqstart | seqmin | seqmax              | seqincrement | seqcache | seqcycle | table_schema | table_name                    | column_name                 |
| -------- | -------------------------------------------------------- | -------- | ------ | ------------------- | ------------ | -------- | -------- | ------------ | ----------------------------- | --------------------------- |
| auth     | refresh_tokens_id_seq                                    | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | auth         | refresh_tokens                | id                          |
| cron     | jobid_seq                                                | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | null         | null                          | null                        |
| cron     | runid_seq                                                | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | null         | null                          | null                        |
| graphql  | seq_schema_version                                       | 1        | 1      | 2147483647          | 1            | 1        | true     | null         | null                          | null                        |
| public   | activitylogs_log_id_seq                                  | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | activitylogs                  | log_id                      |
| public   | birthhistory_birthhistory_id_seq                         | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | birthhistory                  | birthhistory_id             |
| public   | conversationparticipants_conversation_participant_id_seq | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | conversationparticipants      | conversation_participant_id |
| public   | conversations_conversation_id_seq                        | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | conversations                 | conversation_id             |
| public   | deworming_deworming_id_seq                               | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | deworming                     | deworming_id                |
| public   | deworming_history_history_id_seq                         | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | deworming_history             | history_id                  |
| public   | faqs_faq_id_seq                                          | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | faqs                          | faq_id                      |
| public   | guardians_guardian_id_seq                                | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | guardians                     | guardian_id                 |
| public   | immunizations_history_history_id_seq                     | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | immunizations_history         | history_id                  |
| public   | immunizations_immunization_id_seq                        | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | immunizations                 | immunization_id             |
| public   | inventory_history_history_id_seq                         | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | inventory_history             | history_id                  |
| public   | inventory_inventory_id_seq                               | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | inventory                     | inventory_id                |
| public   | inventory_requests_history_history_id_seq                | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | inventory_requests_history    | history_id                  |
| public   | inventory_requests_request_id_seq                        | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | inventory_requests            | request_id                  |
| public   | inventorytransactions_history_history_id_seq             | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | inventorytransactions_history | history_id                  |
| public   | inventorytransactions_transaction_id_seq                 | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | inventorytransactions         | transaction_id              |
| public   | message_receipts_receipt_id_seq                          | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | message_receipts              | receipt_id                  |
| public   | messages_message_id_seq                                  | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | messages                      | message_id                  |
| public   | notifications_notification_id_seq                        | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | notifications                 | notification_id             |
| public   | patients_history_history_id_seq                          | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | patients_history              | history_id                  |
| public   | patients_patient_id_seq                                  | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | patients                      | patient_id                  |
| public   | patientschedule_history_history_id_seq                   | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | patientschedule_history       | history_id                  |
| public   | patientschedule_patient_schedule_id_seq                  | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | patientschedule               | patient_schedule_id         |
| public   | receiving_report_items_item_id_seq                       | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | receiving_report_items        | item_id                     |
| public   | receiving_reports_report_id_seq                          | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | receiving_reports             | report_id                   |
| public   | schedule_doses_id_seq                                    | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | schedule_doses                | id                          |
| public   | schedule_master_id_seq                                   | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | schedule_master               | id                          |
| public   | users_history_history_id_seq                             | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | users_history                 | history_id                  |
| public   | users_user_id_seq                                        | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | users                         | user_id                     |
| public   | vaccinemaster_vaccine_id_seq                             | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | vaccinemaster                 | vaccine_id                  |
| public   | visits_history_history_id_seq                            | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | visits_history                | history_id                  |
| public   | visits_visit_id_seq                                      | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | visits                        | visit_id                    |
| public   | vitalsigns_vital_id_seq                                  | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | vitalsigns                    | vital_id                    |
| public   | vitamina_history_history_id_seq                          | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | vitamina_history              | history_id                  |
| public   | vitamina_vitamina_id_seq                                 | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | public       | vitamina                      | vitamina_id                 |
| realtime | subscription_id_seq                                      | 1        | 1      | 9223372036854775807 | 1            | 1        | false    | realtime     | subscription                  | id                          |