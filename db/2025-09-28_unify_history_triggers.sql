-- Unify history triggers using public.trg_generic_history and activity_action_types taxonomy
-- Assumes public.trg_generic_history(jsonb_diff-based) and public.create_history_trigger exist from prior scripts.
-- If not, wire them first or paste their definitions above.

BEGIN;

-- 0) Seed/ensure activity_action_types taxonomy
INSERT INTO public.activity_action_types(action_type, domain, description)
VALUES
  ('CHILD_CREATE','CHILD','Child record created'),
  ('CHILD_UPDATE','CHILD','Child record updated'),
  ('GUARDIAN_CREATE','GUARDIAN','Guardian record created'),
  ('GUARDIAN_UPDATE','GUARDIAN','Guardian record updated'),
  ('IMMUNIZATION_CREATE','IMMUNIZATION','Immunization record created'),
  ('IMMUNIZATION_UPDATE','IMMUNIZATION','Immunization record updated'),
  ('INVENTORY_CREATE','INVENTORY','Inventory item created'),
  ('INVENTORY_DELETE','INVENTORY','Inventory item deleted'),
  ('INVENTORY_STOCK_ADDED','INVENTORY','Stock added to inventory'),
  ('INVENTORY_STOCK_ADJUSTED','INVENTORY','Inventory stock manually adjusted'),
  ('INVENTORY_STOCK_EXPIRED','INVENTORY','Inventory stock expired'),
  ('INVENTORY_STOCK_REMOVED','INVENTORY','Stock removed from inventory'),
  ('INVENTORY_STOCK_TRANSFERRED','INVENTORY','Inventory stock transferred'),
  ('INVENTORY_UPDATE','INVENTORY','Inventory item updated'),
  ('MESSAGE_FAIL','MESSAGE','Message failed'),
  ('MESSAGE_SEND','MESSAGE','Message sent'),
  ('NOTIFICATION_FAIL','NOTIFICATION','Notification failed'),
  ('NOTIFICATION_SEND','NOTIFICATION','Notification sent'),
  ('SCHEDULE_CREATE','SCHEDULE','Schedule created'),
  ('SCHEDULE_UPDATE','SCHEDULE','Schedule updated'),
  ('SECURITY_LOCKOUT','SECURITY','User account locked out after failed attempts'),
  ('SECURITY_LOGIN_SUSPICIOUS','SECURITY','Suspicious login detected'),
  ('SYSTEM_SHUTDOWN','SYSTEM','System shutdown event'),
  ('SYSTEM_START','SYSTEM','System start event'),
  ('TASK_FAILURE','TASK','Background task/job failed'),
  ('TASK_RUN','TASK','Background task/job started'),
  ('TASK_SUCCESS','TASK','Background task/job succeeded'),
  ('USER_CREATE','USER','User created (unified)'),
  ('USER_DEACTIVATE','USER','User deactivated'),
  ('USER_LOGIN','USER','User successful login'),
  ('USER_LOGIN_FAILED','USER','User failed login attempt'),
  ('USER_LOGOUT','USER','User logout'),
  ('USER_PASSWORD_RESET','USER','User password reset'),
  ('USER_RESTORE','USER','User restored'),
  ('USER_ROLE_UPDATE','USER','User role updated'),
  ('USER_SOFT_DELETE','USER','User soft deleted'),
  ('USER_UPDATE','USER','User updated (unified)'),
  ('VACCINE_CREATE','VACCINE','Vaccine created'),
  ('VACCINE_DELETE','VACCINE','Vaccine soft/deleted'),
  ('VACCINE_UPDATE','VACCINE','Vaccine updated')
ON CONFLICT (action_type) DO UPDATE SET domain = EXCLUDED.domain, description = EXCLUDED.description;

-- 1) Drop table-specific history triggers and functions in favor of generic factory
-- Note: If some triggers have business-specific extras, migrate those pieces into trg_generic_history first.
DO $$
DECLARE
  r record;
BEGIN
  -- tables and their PK/history table mapping
  FOR r IN SELECT * FROM (
    VALUES
      ('patients','patient_id','patients_history'),
      ('visits','visit_id','visits_history'),
      ('immunizations','immunization_id','immunizations_history'),
      ('inventory','inventory_id','inventory_history'),
      ('inventorytransactions','transaction_id','inventorytransactions_history'),
      ('inventory_requests','request_id','inventory_requests_history'),
      ('deworming','deworming_id','deworming_history'),
      ('vitamina','vitamina_id','vitamina_history'),
      ('patientschedule','patient_schedule_id','patientschedule_history')
  ) AS t(tab, pk, hist)
  LOOP
    -- Drop any existing history trigger named conventionally
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_'||r.tab||'_history', r.tab);
    EXCEPTION WHEN others THEN NULL; END;

    -- Create or replace generic trigger via factory
    PERFORM public.create_history_trigger(r.tab, r.pk, r.hist);
  END LOOP;
END$$;

COMMIT;

-- After this, ensure RLS permits inserting into history tables by the trigger function or mark triggers SECURITY DEFINER if needed.
