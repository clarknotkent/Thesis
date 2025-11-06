-- Reset database for QA: remove guardian and health staff users (and cascaded data),
-- purge vaccine-related domains, clear logs, resequence IDs, and re-log admins/FAQ
-- IMPORTANT: Run on NON-PRODUCTION only. Creates a full backup schema first.

-- Safety net: full backup of all base tables into a timestamped schema
DO $$
DECLARE
  v_backup_schema text := format('backup_reset_%s', to_char(now(), 'YYYYMMDD_HH24MI'));
  r record;
  v_cols text;
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_backup_schema);

  FOR r IN (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ) LOOP
    EXECUTE format('CREATE TABLE %I.%I (LIKE public.%I INCLUDING ALL)', v_backup_schema, r.table_name, r.table_name);

    SELECT string_agg(quote_ident(c.column_name), ', ' ORDER BY c.ordinal_position)
      INTO v_cols
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = r.table_name
      AND (c.is_generated IS NULL OR c.is_generated = 'NEVER');

    EXECUTE format('INSERT INTO %1$I.%2$I (%4$s) OVERRIDING SYSTEM VALUE SELECT %4$s FROM public.%2$I',
                   v_backup_schema, r.table_name, v_backup_schema, v_cols);
  END LOOP;
  RAISE NOTICE 'Backup completed to schema %', v_backup_schema;
END$$;

BEGIN;
-- Make FK checks happen at commit so cascading chains don't fail mid-way
SET CONSTRAINTS ALL DEFERRED;

-- Use TEMP tables so we can reference them across multiple statements
CREATE TEMP TABLE tmp_to_purge ON COMMIT DROP AS
SELECT u.user_id
FROM public.users u
WHERE lower(coalesce(u.role,'')) IN (
  'guardian','parent','guardian-parent','healthstaff','nurse','nutritionist'
);

CREATE TEMP TABLE tmp_purge_guardians ON COMMIT DROP AS
SELECT g.guardian_id
FROM public.guardians g
JOIN tmp_to_purge p ON p.user_id = g.user_id;

-- 2) Clear activity and SMS logs first (requested)
-- If you’d like to preserve SMS templates/schedules, comment these out
DELETE FROM public.message_receipts; -- safe to clear receipts early
DELETE FROM public.messages;          -- optional: keep if you want historic messages
DELETE FROM public.conversationparticipants; -- optional
DELETE FROM public.conversations;          -- optional

DELETE FROM public.notifications;
DELETE FROM public.sms_logs;
DELETE FROM public.activitylogs;

-- 3) Purge vaccine-related domains (and anything that depends on vaccines)
-- Order is child -> parent to avoid FK issues where CASCADE isn't defined
-- Schedules (per-patient and master)
DELETE FROM public.patientschedule;
DELETE FROM public.schedule_doses;
DELETE FROM public.schedule_master;

-- Clinical administrations
DELETE FROM public.immunizations;
DELETE FROM public.deworming;
DELETE FROM public.vitamina;

-- Inventory domain (transactions, history, items, reports, requests, stock)
-- History tables may or may not exist; if they don't, ignore errors by commenting
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='inventorytransactions_history') THEN
    EXECUTE 'DELETE FROM public.inventorytransactions_history';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='inventory_history') THEN
    EXECUTE 'DELETE FROM public.inventory_history';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='inventory_requests_history') THEN
    EXECUTE 'DELETE FROM public.inventory_requests_history';
  END IF;
END $$;

DELETE FROM public.inventorytransactions;
DELETE FROM public.receiving_report_items;
DELETE FROM public.receiving_reports;
DELETE FROM public.inventory_requests;
DELETE FROM public.inventory;

-- Finally remove vaccine master rows (includes Vaccines, Deworming, Vitamin A catalogs)
DELETE FROM public.vaccinemaster;  

-- 4) Purge Guardians and their Patients (and all records linked to those patients)
-- Delete patient-dependent records that may remain (birth history, vitals, visits)
DELETE FROM public.birthhistory
WHERE patient_id IN (
  SELECT patient_id FROM public.patients
  WHERE guardian_id IN (SELECT guardian_id FROM tmp_purge_guardians)
);

-- vitalsigns is linked via visit_id -> visits(patient_id); remove vitals for visits of target patients
DELETE FROM public.vitalsigns vs
USING public.visits v
WHERE vs.visit_id = v.visit_id
  AND v.patient_id IN (
    SELECT patient_id FROM public.patients
    WHERE guardian_id IN (SELECT guardian_id FROM tmp_purge_guardians)
  );

DELETE FROM public.visits
WHERE patient_id IN (
  SELECT patient_id FROM public.patients
  WHERE guardian_id IN (SELECT guardian_id FROM tmp_purge_guardians)
);

-- Remove patients then guardians
DELETE FROM public.patients
WHERE guardian_id IN (SELECT guardian_id FROM tmp_purge_guardians);

DELETE FROM public.guardians g
USING tmp_purge_guardians pg
WHERE g.guardian_id = pg.guardian_id;

-- Remove the user accounts (Guardians + Health workers)
DELETE FROM public.users u
USING tmp_to_purge p
WHERE u.user_id = p.user_id;

-- 4.5) Purge history/audit tables if present (patients_history, visits_history, users_history, patientschedule_history)
DO $$
DECLARE
  tbl text;
  pk_col text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['patients_history','visits_history','users_history','patientschedule_history'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('DELETE FROM public.%I', tbl);
      -- Attempt to resequence primary key if present
      SELECT kcu.column_name INTO pk_col
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = tc.constraint_name
       AND kcu.table_schema = tc.table_schema
       AND kcu.table_name = tc.table_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = tbl
      LIMIT 1;
      IF pk_col IS NOT NULL THEN
        EXECUTE format('SELECT public.resequence_table(%L,%L,%L,NULL)', 'public', tbl, pk_col);
      END IF;
    END IF;
  END LOOP;
END $$;

-- 4.6) Rebuild users_history as a clean baseline (start IDs at 1, no NULL columns)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users_history'
  ) THEN
    -- Restart identity so history_id begins at 1
    EXECUTE 'TRUNCATE TABLE public.users_history RESTART IDENTITY';

    -- Insert a single baseline version per remaining user
    -- Ensure no NULLs in required columns
    EXECUTE $uh$
      INSERT INTO public.users_history (
        user_id,
        version_no,
        changed_at,
        changed_by,
        changed_fields,
        snapshot
      )
      SELECT
        u.user_id,
        1 AS version_no,
        now() AS changed_at,
        u.user_id AS changed_by,        -- use the user as the actor to avoid NULLs
        '{}'::jsonb AS changed_fields,  -- empty object (no changed fields)
        to_jsonb(u) AS snapshot         -- base form of the user row
      FROM public.users u
      ORDER BY u.user_id
    $uh$;
  END IF;
END $$;

-- 5) Resequence integer PKs and their children to close gaps after deletes
-- Requires public.resequence_table function to exist
-- Defer constraints for self-referential/cascade chains
SET CONSTRAINTS ALL DEFERRED;

-- People domain
SELECT public.resequence_table('public','users','user_id','users_user_id_seq');
SELECT public.resequence_table('public','guardians','guardian_id','guardians_guardian_id_seq');
SELECT public.resequence_table('public','patients','patient_id','patients_patient_id_seq');

-- Encounters and measurements
SELECT public.resequence_table('public','visits','visit_id','visits_visit_id_seq');
SELECT public.resequence_table('public','vitalsigns','vital_id','vitalsigns_vital_id_seq');
SELECT public.resequence_table('public','birthhistory','birthhistory_id','birthhistory_birthhistory_id_seq');

-- Conversations/messages (optional resequence if you kept them)
SELECT public.resequence_table('public','conversations','conversation_id','conversations_conversation_id_seq');
SELECT public.resequence_table('public','conversationparticipants','conversation_participant_id','conversationparticipants_conversation_participant_id_seq');
SELECT public.resequence_table('public','messages','message_id','messages_message_id_seq');
SELECT public.resequence_table('public','message_receipts','receipt_id', NULL);

-- Notifications/logs
SELECT public.resequence_table('public','notifications','notification_id','notifications_notification_id_seq');
SELECT public.resequence_table('public','sms_logs','id', NULL);
SELECT public.resequence_table('public','activitylogs','log_id','activitylogs_log_id_seq');

-- Vaccines & scheduling & inventory
SELECT public.resequence_table('public','vaccinemaster','vaccine_id','vaccinemaster_vaccine_id_seq');
SELECT public.resequence_table('public','schedule_master','id','schedule_master_id_seq');
SELECT public.resequence_table('public','schedule_doses','id','schedule_doses_id_seq');
SELECT public.resequence_table('public','patientschedule','patient_schedule_id','patientschedule_patient_schedule_id_seq');

SELECT public.resequence_table('public','immunizations','immunization_id','immunizations_immunization_id_seq');
SELECT public.resequence_table('public','deworming','deworming_id','deworming_deworming_id_seq');
SELECT public.resequence_table('public','vitamina','vitamina_id','vitamina_vitamina_id_seq');

SELECT public.resequence_table('public','inventory','inventory_id','inventory_inventory_id_seq');
SELECT public.resequence_table('public','inventorytransactions','transaction_id','inventorytransactions_transaction_id_seq');
SELECT public.resequence_table('public','receiving_reports','report_id','receiving_reports_report_id_seq');
SELECT public.resequence_table('public','receiving_report_items','item_id','receiving_report_items_item_id_seq');
SELECT public.resequence_table('public','inventory_requests','request_id','inventory_requests_request_id_seq');

-- 6) Re-log remaining entities into activity logs: Admin users and FAQs
-- Use NULL user_id to mark as system re-log; set a description and new_value snapshot
INSERT INTO public.activitylogs (user_id, action_type, entity_type, entity_id, description, new_value)
SELECT NULL::bigint, 'USER_CREATE', 'user', u.user_id,
       'System re-log after cleanup: existing admin user',
       jsonb_build_object('username', u.username, 'email', u.email, 'role', u.role)
FROM public.users u
WHERE lower(coalesce(u.role,'')) IN ('admin','superadmin','administrator');

INSERT INTO public.activitylogs (user_id, action_type, entity_type, entity_id, description, new_value)
SELECT NULL::bigint, 'FAQ_CREATE', 'faq', f.faq_id,
       'System re-log after cleanup: existing FAQ',
       jsonb_build_object('question', f.question, 'tags', f.tags)
FROM public.faqs f
WHERE coalesce(f.is_deleted,false) = false;

-- Also re-log existing SMS templates (avoid nested $$ by using direct INSERT)
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sms_templates') THEN
    INSERT INTO public.activitylogs (user_id, action_type, entity_type, entity_id, description, new_value)
    SELECT NULL::bigint, 'SMS_TEMPLATE_CREATE', 'sms_template', t.id,
           'System re-log after cleanup: existing SMS template',
           jsonb_build_object('name', t.name, 'trigger_type', t.trigger_type)
    FROM public.sms_templates t
    WHERE coalesce(t.is_deleted,false) = false;
  END IF;
END
$do$;

-- Ensure activitylogs’ sequence is at max after inserts
SELECT public.resequence_table('public','activitylogs','log_id','activitylogs_log_id_seq');

COMMIT;

-- End of reset_clean_for_QA.sql
