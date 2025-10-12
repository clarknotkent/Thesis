-- Clear all data from tables except users table
-- Execute in reverse dependency order to avoid foreign key constraints

-- History/audit tables (no dependencies)
TRUNCATE TABLE users_history CASCADE;
TRUNCATE TABLE patients_history CASCADE;
TRUNCATE TABLE patientschedule_history CASCADE;
TRUNCATE TABLE visits_history CASCADE;
TRUNCATE TABLE immunizations_history CASCADE;
TRUNCATE TABLE vitamina_history CASCADE;
TRUNCATE TABLE deworming_history CASCADE;
TRUNCATE TABLE inventory_history CASCADE;
TRUNCATE TABLE inventorytransactions_history CASCADE;
TRUNCATE TABLE inventory_requests_history CASCADE;

-- Activity logs
TRUNCATE TABLE activitylogs CASCADE;

-- Messages and conversations
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversationparticipants CASCADE;
TRUNCATE TABLE conversations CASCADE;

-- Notifications
TRUNCATE TABLE notifications CASCADE;

-- Inventory system
TRUNCATE TABLE inventorytransactions CASCADE;
TRUNCATE TABLE inventory_requests CASCADE;
TRUNCATE TABLE receiving_report_items CASCADE;
TRUNCATE TABLE receiving_reports CASCADE;
TRUNCATE TABLE inventory CASCADE;

-- Patient schedules
TRUNCATE TABLE patientschedule CASCADE;

-- Visits and related data
TRUNCATE TABLE vitalsigns CASCADE;
TRUNCATE TABLE immunizations CASCADE;
TRUNCATE TABLE vitamina CASCADE;
TRUNCATE TABLE deworming CASCADE;
TRUNCATE TABLE visits CASCADE;

-- Patients and related data
TRUNCATE TABLE birthhistory CASCADE;
TRUNCATE TABLE patients CASCADE;

-- Guardians
TRUNCATE TABLE guardians CASCADE;

-- Vaccine master data
TRUNCATE TABLE schedule_doses CASCADE;
TRUNCATE TABLE schedule_master CASCADE;
TRUNCATE TABLE vaccinemaster CASCADE;

-- User mapping (keep users table)
TRUNCATE TABLE user_mapping CASCADE;

-- Reference/lookup tables
TRUNCATE TABLE activity_action_types CASCADE;
TRUNCATE TABLE health_worker_types CASCADE;

-- Audit table
TRUNCATE TABLE timestamp_normalization_audit CASCADE;

-- Reset sequences to start from 1
-- Note: This will reset auto-increment IDs
ALTER SEQUENCE IF EXISTS activitylogs_log_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS birthhistory_birthhistory_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS conversationparticipants_conversation_participant_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS conversations_conversation_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS deworming_deworming_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS guardians_guardian_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS immunizations_immunization_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS inventory_inventory_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS inventory_requests_request_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS inventorytransactions_transaction_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS messages_message_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notifications_notification_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS patients_patient_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS patientschedule_patient_schedule_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS receiving_reports_report_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS receiving_report_items_item_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS schedule_doses_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS schedule_master_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vaccinemaster_vaccine_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS visits_visit_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vitalsigns_vital_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vitamina_vitamina_id_seq RESTART WITH 1;

-- History table sequences
ALTER SEQUENCE IF EXISTS users_history_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS patients_history_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS patientschedule_history_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS visits_history_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS immunizations_history_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vitamina_history_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS deworming_history_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS inventory_history_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS inventorytransactions_history_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS inventory_requests_history_history_id_seq RESTART WITH 1;