-- Consolidated Migration 037-044
-- 037 Schedule Master Redesign
-- 038 Constraints & Validation
-- 039 Status Enums & Normalization
-- 040 Guardian & Recipient RLS Policies
-- 041 Timestamp Normalization Framework (deferred operations placeholders)
-- 042 Activity Log Taxonomy Enforcement
-- 043 Index Strategy Phase 1
-- 044 Inventory Safety & Activitylogs Partitioning

BEGIN; -- Wrap entire batch; individual blocks are idempotent.

/**************************************************************************************************
 * 037 SCHEDULE MASTER REDESIGN
 *************************************************************************************************/
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Add new descriptive/code columns to schedule_master if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='schedule_master' AND column_name='code'
    ) THEN
        ALTER TABLE schedule_master ADD COLUMN code text;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='schedule_master' AND column_name='name'
    ) THEN
        ALTER TABLE schedule_master ADD COLUMN name text;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='schedule_master' AND column_name='min_age_days'
    ) THEN
        ALTER TABLE schedule_master ADD COLUMN min_age_days integer;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='schedule_master' AND column_name='max_age_days'
    ) THEN
        ALTER TABLE schedule_master ADD COLUMN max_age_days integer;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='schedule_master' AND column_name='catchup_strategy'
    ) THEN
        ALTER TABLE schedule_master ADD COLUMN catchup_strategy text; -- will enum in later phase
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='schedule_master' AND column_name='notes'
    ) THEN
        ALTER TABLE schedule_master ADD COLUMN notes text;
    END IF;

    -- New dose level columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='schedule_doses' AND column_name='requires_previous'
    ) THEN
        ALTER TABLE schedule_doses ADD COLUMN requires_previous boolean;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='schedule_doses' AND column_name='skippable'
    ) THEN
        ALTER TABLE schedule_doses ADD COLUMN skippable boolean;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='schedule_doses' AND column_name='grace_period_days'
    ) THEN
        ALTER TABLE schedule_doses ADD COLUMN grace_period_days integer;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='schedule_doses' AND column_name='absolute_latest_days'
    ) THEN
        ALTER TABLE schedule_doses ADD COLUMN absolute_latest_days integer;
    END IF;
END $$;

/**************************************************************************************************
 * 038 CONSTRAINTS & VALIDATION
 *************************************************************************************************/
-- Uniqueness constraints (use IF NOT EXISTS pattern with catalog checks)
DO $$
BEGIN
    -- Helper local procedure to safely add a UNIQUE constraint only if no constraint or index of same name exists
    -- Birthhistory unique(patient_id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='birthhistory') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_birthhistory_patient')
           AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='uq_birthhistory_patient' AND relkind='i') THEN
            BEGIN
                ALTER TABLE birthhistory ADD CONSTRAINT uq_birthhistory_patient UNIQUE (patient_id);
            EXCEPTION WHEN duplicate_table THEN
                -- Name collision (index or constraint appeared concurrently); ignore
            END;
        END IF;
    END IF;

    -- vaccinemaster unique (antigen_name, brand_name)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_vaccinemaster_antigen_brand')
       AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='uq_vaccinemaster_antigen_brand' AND relkind='i') THEN
        BEGIN
            ALTER TABLE vaccinemaster ADD CONSTRAINT uq_vaccinemaster_antigen_brand UNIQUE (antigen_name, brand_name);
        EXCEPTION WHEN duplicate_table THEN
        END;
    END IF;

    -- schedule_doses unique (schedule_id, dose_number)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_schedule_doses_schedule_dose')
       AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='uq_schedule_doses_schedule_dose' AND relkind='i') THEN
        BEGIN
            ALTER TABLE schedule_doses ADD CONSTRAINT uq_schedule_doses_schedule_dose UNIQUE (schedule_id, dose_number);
        EXCEPTION WHEN duplicate_table THEN
        END;
    END IF;

    -- patientschedule unique (patient_id, vaccine_id, dose_number)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_patientschedule_patient_vax_dose')
       AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='uq_patientschedule_patient_vax_dose' AND relkind='i') THEN
        BEGIN
            ALTER TABLE patientschedule ADD CONSTRAINT uq_patientschedule_patient_vax_dose UNIQUE (patient_id, vaccine_id, dose_number);
        EXCEPTION WHEN duplicate_table THEN
        END;
    END IF;
END $$;

-- CHECK constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname='chk_inventory_stock_nonneg'
    ) THEN
        ALTER TABLE inventory ADD CONSTRAINT chk_inventory_stock_nonneg CHECK (current_stock_level >= 0);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname='chk_inventory_initial_qty_nonneg'
    ) THEN
        ALTER TABLE inventory ADD CONSTRAINT chk_inventory_initial_qty_nonneg CHECK (initial_quantity IS NULL OR initial_quantity >= 0);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname='chk_schedule_doses_positive_intervals'
    ) THEN
        ALTER TABLE schedule_doses ADD CONSTRAINT chk_schedule_doses_positive_intervals CHECK (
            (due_after_days IS NULL OR due_after_days >= 0) AND
            (min_interval_days IS NULL OR min_interval_days >= 0) AND
            (max_interval_days IS NULL OR max_interval_days >= 0) AND
            (min_interval_other_vax IS NULL OR min_interval_other_vax >= 0)
        );
    END IF;
END $$;

/**************************************************************************************************
 * 039 STATUS ENUMS & NORMALIZATION (placeholder - convert later safely if views depend)
 *************************************************************************************************/
-- Example: create enums if not exist; casting deferred to avoid view dependency break.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='schedule_status_enum') THEN
        CREATE TYPE schedule_status_enum AS ENUM ('PENDING','DUE','OVERDUE','COMPLETED','CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='notification_status_enum') THEN
        CREATE TYPE notification_status_enum AS ENUM ('PENDING','SCHEDULED','SENT','FAILED','READ');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='inventory_request_status_enum') THEN
        CREATE TYPE inventory_request_status_enum AS ENUM ('PENDING','APPROVED','REJECTED','CANCELLED');
    END IF;
END $$;

-- Casting template (commented for manual activation after verifying no blocking views)
-- ALTER TABLE patientschedule ALTER COLUMN status TYPE schedule_status_enum USING status::schedule_status_enum;
-- ALTER TABLE notifications ALTER COLUMN status TYPE notification_status_enum USING status::notification_status_enum;
-- ALTER TABLE inventory_requests ALTER COLUMN status TYPE inventory_request_status_enum USING status::inventory_request_status_enum;

/**************************************************************************************************
 * 040 GUARDIAN & RECIPIENT RLS POLICIES (add if not already present)
 *************************************************************************************************/
-- Ensure RLS enabled (idempotent)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patientschedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversationparticipants ENABLE ROW LEVEL SECURITY;

-- Patients: guardian can select/update only their patient rows (limited columns for update not enforced here)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname='patients_guardian_select'
    ) THEN
        CREATE POLICY patients_guardian_select ON patients FOR SELECT USING (
            (current_setting('app.role', true) = 'GUARDIAN' AND guardian_id = current_setting('app.user_id')::bigint)
            OR current_setting('app.role', true) IN ('ADMIN','NURSE','NUTRITIONIST','HEALTHWORKER')
        );
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname='patients_guardian_update'
    ) THEN
        CREATE POLICY patients_guardian_update ON patients FOR UPDATE USING (
            (current_setting('app.role', true) = 'GUARDIAN' AND guardian_id = current_setting('app.user_id')::bigint)
            OR current_setting('app.role', true) IN ('ADMIN','NURSE','NUTRITIONIST','HEALTHWORKER')
        ) WITH CHECK (
            (current_setting('app.role', true) = 'GUARDIAN' AND guardian_id = current_setting('app.user_id')::bigint)
            OR current_setting('app.role', true) IN ('ADMIN','NURSE','NUTRITIONIST','HEALTHWORKER')
        );
    END IF;
END $$;

-- Patientschedule: guardian read-only for their patient schedules
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname='patientschedule_guardian_select'
    ) THEN
        CREATE POLICY patientschedule_guardian_select ON patientschedule FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM patients p 
                WHERE p.patient_id = patientschedule.patient_id 
                  AND (
                    (current_setting('app.role', true) = 'GUARDIAN' AND p.guardian_id = current_setting('app.user_id')::bigint)
                    OR current_setting('app.role', true) IN ('ADMIN','NURSE','NUTRITIONIST','HEALTHWORKER')
                  )
            )
        );
    END IF;
END $$;

-- Notifications: recipient only
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname='notifications_recipient_select'
    ) THEN
        CREATE POLICY notifications_recipient_select ON notifications FOR SELECT USING (
            (recipient_user_id = current_setting('app.user_id')::bigint)
            OR current_setting('app.role', true) IN ('ADMIN')
        );
    END IF;
END $$;

-- Messages/Conversations: participant-only access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname='conversations_participant_select'
    ) THEN
        CREATE POLICY conversations_participant_select ON conversations FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM conversationparticipants cp
                WHERE cp.conversation_id = conversations.conversation_id
                  AND cp.user_id = current_setting('app.user_id')::bigint
                  AND cp.is_deleted = false
            ) OR current_setting('app.role', true) IN ('ADMIN')
        );
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname='messages_participant_select'
    ) THEN
        CREATE POLICY messages_participant_select ON messages FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM conversationparticipants cp
                WHERE cp.conversation_id = messages.conversation_id
                  AND cp.user_id = current_setting('app.user_id')::bigint
                  AND cp.is_deleted = false
            ) OR current_setting('app.role', true) IN ('ADMIN')
        );
    END IF;
END $$;

/**************************************************************************************************
 * 041 TIMESTAMP NORMALIZATION (framework only; actual conversions require downtime planning)
 *************************************************************************************************/
-- Placeholder: create a table to track normalization status.
CREATE TABLE IF NOT EXISTS timestamp_normalization_audit (
    table_name text PRIMARY KEY,
    normalized_at timestamptz DEFAULT now(),
    notes text
);

/**************************************************************************************************
 * 042 ACTIVITY LOG TAXONOMY ENFORCEMENT
 *************************************************************************************************/
-- Create lookup table for action types if not exists
CREATE TABLE IF NOT EXISTS activity_action_types (
    action_type text PRIMARY KEY,
    domain text,
    description text
);

-- Seed minimal core set (ignore conflicts)
INSERT INTO activity_action_types(action_type, domain, description) VALUES
 ('USER_CREATED','USER','User created'),
 ('USER_UPDATED','USER','User updated'),
 ('PATIENT_CREATED','PATIENT','Patient created'),
 ('PATIENT_UPDATED','PATIENT','Patient updated'),
 ('SCHEDULE_GENERATED_SYSTEM','SCHEDULE','System generated schedule'),
 ('SCHEDULE_ADJUSTED_USER','SCHEDULE','User adjusted schedule'),
 ('INVENTORY_REQUEST_SUBMITTED','INVENTORY','Request submitted'),
 ('INVENTORY_REQUEST_APPROVED','INVENTORY','Request approved'),
 ('INVENTORY_REQUEST_REJECTED','INVENTORY','Request rejected'),
 ('NOTIFICATION_SENT','NOTIFICATION','Notification sent'),
 ('MESSAGE_SENT','MESSAGE','Message sent')
ON CONFLICT DO NOTHING;

-- Add FK-like enforcement via trigger (cannot directly FK because existing rows may have unknown types)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname='trg_activitylogs_action_type_check'
    ) THEN
        CREATE OR REPLACE FUNCTION ensure_activity_action_type() RETURNS trigger AS $func$
        BEGIN
            IF NEW.action_type IS NOT NULL AND NOT EXISTS (
                SELECT 1 FROM activity_action_types WHERE action_type = NEW.action_type
            ) THEN
                RAISE EXCEPTION 'Unknown action_type %', NEW.action_type;
            END IF;
            RETURN NEW;
        END;$func$ LANGUAGE plpgsql;
        CREATE TRIGGER trg_activitylogs_action_type_check
            BEFORE INSERT OR UPDATE ON activitylogs
            FOR EACH ROW EXECUTE FUNCTION ensure_activity_action_type();
    END IF;
END $$;

/**************************************************************************************************
 * 043 INDEX STRATEGY PHASE 1
 *************************************************************************************************/
-- Patients: guardian + active filter index
CREATE INDEX IF NOT EXISTS idx_patients_guardian_active ON patients(guardian_id) WHERE is_deleted=false;
-- Patients full name trigram (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm ON patients USING gin(full_name gin_trgm_ops);

-- Patientschedule: overdue partial
CREATE INDEX IF NOT EXISTS idx_patientschedule_overdue ON patientschedule(scheduled_date) WHERE status='OVERDUE' AND is_deleted=false;
CREATE INDEX IF NOT EXISTS idx_patientschedule_patient_status ON patientschedule(patient_id, status);

-- Notifications: unread partial
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_user_id) WHERE read_at IS NULL AND is_deleted=false;

-- Messages: conversation ordering + unread
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread ON messages(conversation_id) WHERE read_at IS NULL AND is_deleted=false;

-- Activitylogs: action_type + timestamp desc
CREATE INDEX IF NOT EXISTS idx_activitylogs_action_time ON activitylogs(action_type, timestamp DESC);

-- Inventory: vaccine + expiration
CREATE INDEX IF NOT EXISTS idx_inventory_vaccine_expiration ON inventory(vaccine_id, expiration_date);

/**************************************************************************************************
 * 044 INVENTORY SAFETY & ACTIVITYLOGS PARTITIONING (framework)
 *************************************************************************************************/
-- Inventory negative stock guard function (raises before commit if negative)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname='enforce_inventory_nonnegative'
    ) THEN
        CREATE OR REPLACE FUNCTION enforce_inventory_nonnegative() RETURNS trigger AS $func$
        BEGIN
            IF NEW.current_stock_level < 0 THEN
                RAISE EXCEPTION 'Inventory % would become negative (%).', NEW.inventory_id, NEW.current_stock_level;
            END IF;
            RETURN NEW;
        END;$func$ LANGUAGE plpgsql;
        CREATE TRIGGER trg_inventory_nonnegative
            BEFORE INSERT OR UPDATE ON inventory
            FOR EACH ROW EXECUTE FUNCTION enforce_inventory_nonnegative();
    END IF;
END $$;

-- Partitioning framework for activitylogs (does not migrate existing rows)
DO $$
DECLARE
    has_partition boolean;
    has_view boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_partitioned_table pt
        JOIN pg_class c ON c.oid = pt.partrelid
        WHERE c.relname='activitylogs'
    ) INTO has_partition;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.views WHERE table_name='activitylogs_view'
    ) INTO has_view;

    IF has_partition THEN
        RAISE NOTICE 'activitylogs already partitioned; skipping.';
        RETURN;
    END IF;

    IF has_view THEN
        RAISE NOTICE 'activitylogs_view exists; skipping partitioning framework to avoid dependency issues. Run manual partition migration later.';
        RETURN;
    END IF;

    -- (Deferred) Full partition conversion skipped by design when view absent
    RAISE NOTICE 'Partition conversion skipped (framework placeholder).';
END $$;

COMMIT;

-- END CONSOLIDATED MIGRATION 037-044
