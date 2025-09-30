-- RLS refinement using schema overview as reference, removing overlaps and adding missing constraints.
-- This migration is idempotent: drops or adjusts conflicting policies and creates refined ones.

BEGIN;
SET search_path = public;

-- Helper: drop policy if exists
CREATE OR REPLACE FUNCTION public._drop_policy(p_schema text, p_table text, p_policy text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname=p_schema AND tablename=p_table AND policyname=p_policy
  ) THEN
    EXECUTE format('DROP POLICY %I ON %I.%I', p_policy, p_schema, p_table);
  END IF;
END;$$;

-- Helper: drop all policies for a table
CREATE OR REPLACE FUNCTION public._drop_all_policies(p_schema text, p_table text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname=p_schema AND tablename=p_table
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, p_schema, p_table);
  END LOOP;
END;$$;

-- Enable RLS on core tables (safe if already enabled)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename FROM pg_tables 
           WHERE schemaname='public' AND tablename IN (
             'users','user_mapping','guardians','patients','visits','immunizations','vitalsigns',
             'patientschedule','vaccinemaster','inventory','inventorytransactions','inventory_requests',
             'conversations','conversationparticipants','messages','notifications','activitylogs'
           )
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
  END LOOP;
END$$;

-- Core predicates
-- Convenience expressions reused in USING/CHECK
-- Note: inline them to avoid dependency on generated functions inside policy text

-- USERS: admin/service only; self-read optionally via a view, keep table locked down
SELECT public._drop_all_policies('public','users');
CREATE POLICY users_admin_read ON public.users FOR SELECT
USING (public.current_app_role() IN ('Admin','service_role'));

-- USER_MAPPING: admin/service only
SELECT public._drop_all_policies('public','user_mapping');
CREATE POLICY user_mapping_admin_read ON public.user_mapping FOR SELECT
USING (public.current_app_role() IN ('Admin','service_role'));
CREATE POLICY user_mapping_admin_write ON public.user_mapping FOR INSERT TO PUBLIC
WITH CHECK (public.current_app_role() IN ('Admin','service_role'));
CREATE POLICY user_mapping_admin_update ON public.user_mapping FOR UPDATE TO PUBLIC
USING (public.current_app_role() IN ('Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('Admin','service_role'));

-- GUARDIANS: clinicians read; guardian reads own; writes by clinicians/admin/service
SELECT public._drop_all_policies('public','guardians');
CREATE POLICY guardians_read ON public.guardians FOR SELECT
USING (
  (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role') AND NOT is_deleted)
  OR (user_id = public.current_app_user_id())
);
CREATE POLICY guardians_insert ON public.guardians FOR INSERT
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
CREATE POLICY guardians_update ON public.guardians FOR UPDATE
USING (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));

-- PATIENTS: clinicians read; guardian reads dependents; writes by clinicians/admin/service
SELECT public._drop_all_policies('public','patients');
CREATE POLICY patients_read ON public.patients FOR SELECT
USING (
  (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role') AND NOT is_deleted)
  OR (guardian_id IN (SELECT g.guardian_id FROM guardians g WHERE g.user_id = public.current_app_user_id()))
);
CREATE POLICY patients_insert ON public.patients FOR INSERT
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
CREATE POLICY patients_update ON public.patients FOR UPDATE
USING (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));

-- VISITS: similar to patients; guardian sees visits of their dependents
SELECT public._drop_all_policies('public','visits');
CREATE POLICY visits_read ON public.visits FOR SELECT
USING (
  (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role') AND NOT is_deleted)
  OR (patient_id IN (SELECT p.patient_id FROM patients p JOIN guardians g ON g.guardian_id=p.guardian_id WHERE g.user_id = public.current_app_user_id()))
);
CREATE POLICY visits_insert ON public.visits FOR INSERT
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'));
CREATE POLICY visits_update ON public.visits FOR UPDATE
USING (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'));

-- IMMUNIZATIONS: guardian sees immunizations of dependents (via visit -> patient)
SELECT public._drop_all_policies('public','immunizations');
CREATE POLICY immunizations_read ON public.immunizations FOR SELECT
USING (
  (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role') AND NOT is_deleted)
  OR (
      (SELECT v.patient_id FROM visits v WHERE v.visit_id = immunizations.visit_id) IN (
          SELECT p.patient_id FROM patients p JOIN guardians g ON g.guardian_id=p.guardian_id WHERE g.user_id = public.current_app_user_id()
      )
  )
);
CREATE POLICY immunizations_insert ON public.immunizations FOR INSERT
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'));
CREATE POLICY immunizations_update ON public.immunizations FOR UPDATE
USING (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'));

-- VITALSIGNS: guardian sees vitals tied to their dependents (via visit)
SELECT public._drop_all_policies('public','vitalsigns');
CREATE POLICY vitalsigns_read ON public.vitalsigns FOR SELECT
USING (
  (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role') AND NOT is_deleted)
  OR (
    (SELECT v.patient_id FROM visits v WHERE v.visit_id = vitalsigns.visit_id)
    IN (SELECT p.patient_id FROM patients p JOIN guardians g ON g.guardian_id=p.guardian_id WHERE g.user_id = public.current_app_user_id())
  )
);
CREATE POLICY vitalsigns_insert ON public.vitalsigns FOR INSERT
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'));
CREATE POLICY vitalsigns_update ON public.vitalsigns FOR UPDATE
USING (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'));

-- PATIENTSCHEDULE: guardian sees schedules for dependents
SELECT public._drop_all_policies('public','patientschedule');
CREATE POLICY patientschedule_read ON public.patientschedule FOR SELECT
USING (
  (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role') AND NOT is_deleted)
  OR (patient_id IN (SELECT p.patient_id FROM patients p JOIN guardians g ON g.guardian_id=p.guardian_id WHERE g.user_id = public.current_app_user_id()))
);
CREATE POLICY patientschedule_insert ON public.patientschedule FOR INSERT
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'));
CREATE POLICY patientschedule_update ON public.patientschedule FOR UPDATE
USING (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Admin','service_role'));

SELECT public._drop_all_policies('public','vaccinemaster');
CREATE POLICY vaccinemaster_read ON public.vaccinemaster FOR SELECT
USING (public.current_app_role() IN ('Admin','HealthWorker','Nurse','Nutritionist','Guardian','service_role'));
CREATE POLICY vaccinemaster_write ON public.vaccinemaster FOR INSERT TO PUBLIC
WITH CHECK (public.current_app_role() IN ('Admin','service_role'));
CREATE POLICY vaccinemaster_update ON public.vaccinemaster FOR UPDATE TO PUBLIC
USING (public.current_app_role() IN ('Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('Admin','service_role'));

-- INVENTORY: reads for clinicians; write only admin/service
SELECT public._drop_all_policies('public','inventory');
CREATE POLICY inventory_read ON public.inventory FOR SELECT
USING (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
SELECT public._drop_policy('public','inventory','inventory_write_admin');
SELECT public._drop_policy('public','inventory','inventory_update_admin');
CREATE POLICY inventory_insert ON public.inventory FOR INSERT
WITH CHECK (public.current_app_role() IN ('Admin','service_role'));
CREATE POLICY inventory_update ON public.inventory FOR UPDATE
USING (public.current_app_role() IN ('Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('Admin','service_role'));

-- INVENTORY REQUESTS: clinicians insert; admin/service decide
SELECT public._drop_all_policies('public','inventory_requests');
CREATE POLICY inventory_requests_read ON public.inventory_requests FOR SELECT
USING (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
CREATE POLICY inventory_requests_insert ON public.inventory_requests FOR INSERT
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
CREATE POLICY inventory_requests_update ON public.inventory_requests FOR UPDATE
USING (public.current_app_role() IN ('Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('Admin','service_role'));

-- INVENTORYTRANSACTIONS: read for clinicians; insert allowed for clinicians (issue/return) but governed by triggers; admin/service full
SELECT public._drop_all_policies('public','inventorytransactions');
CREATE POLICY inventorytransactions_read ON public.inventorytransactions FOR SELECT
USING (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
CREATE POLICY inventorytransactions_insert ON public.inventorytransactions FOR INSERT
WITH CHECK (public.current_app_role() IN ('HealthWorker','Nurse','Nutritionist','Admin','service_role'));
CREATE POLICY inventorytransactions_update ON public.inventorytransactions FOR UPDATE
USING (public.current_app_role() IN ('Admin','service_role'))
WITH CHECK (public.current_app_role() IN ('Admin','service_role'));

-- CONVERSATIONS/MESSAGES/PARTICIPANTS: participant-scoped visibility
-- A user can see a conversation if they have a row in conversationparticipants
SELECT public._drop_all_policies('public','conversations');
CREATE POLICY conversations_participant_read ON public.conversations FOR SELECT
USING (
  public.current_app_role() IN ('Admin','service_role')
  OR EXISTS (
     SELECT 1 FROM conversationparticipants cp 
     WHERE cp.conversation_id = conversations.conversation_id 
       AND cp.user_id = public.current_app_user_id() AND NOT cp.is_deleted
  )
);
CREATE POLICY conversations_insert ON public.conversations FOR INSERT
WITH CHECK (public.current_app_role() IN ('Admin','service_role','HealthWorker','Nurse','Nutritionist','Guardian'));

SELECT public._drop_all_policies('public','conversationparticipants');
CREATE POLICY conversationparticipants_self_read ON public.conversationparticipants FOR SELECT
USING (user_id = public.current_app_user_id() OR public.current_app_role() IN ('Admin','service_role'));
CREATE POLICY conversationparticipants_insert ON public.conversationparticipants FOR INSERT
WITH CHECK (public.current_app_role() IN ('Admin','service_role'));

SELECT public._drop_all_policies('public','messages');
CREATE POLICY messages_participant_read ON public.messages FOR SELECT
USING (
  public.current_app_role() IN ('Admin','service_role') OR EXISTS (
    SELECT 1 FROM conversationparticipants cp 
    WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = public.current_app_user_id() AND NOT cp.is_deleted
  )
);
CREATE POLICY messages_insert ON public.messages FOR INSERT
WITH CHECK (
  public.current_app_role() IN ('Admin','service_role') OR EXISTS (
    SELECT 1 FROM conversationparticipants cp 
    WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = public.current_app_user_id() AND NOT cp.is_deleted
  )
);

-- If notifications table has a recipient column named user_id, scope it, else keep admin/service
SELECT public._drop_all_policies('public','notifications');
CREATE POLICY notifications_read ON public.notifications FOR SELECT
USING (
  public.current_app_role() IN ('Admin','service_role')
  OR (COALESCE(recipient_user_id, created_by) = public.current_app_user_id())
);
CREATE POLICY notifications_insert ON public.notifications FOR INSERT
WITH CHECK (public.current_app_role() IN ('Admin','service_role'));

-- ACTIVITYLOGS: admin/service only
SELECT public._drop_all_policies('public','activitylogs');
CREATE POLICY activitylogs_admin_read ON public.activitylogs FOR SELECT
USING (public.current_app_role() IN ('Admin','service_role'));
-- Allow all authenticated actions to be recorded by triggers; keep reads restricted
CREATE POLICY activitylogs_insert_any ON public.activitylogs FOR INSERT TO PUBLIC
WITH CHECK (true);

COMMIT;
