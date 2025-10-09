-- Database Schema and Function Fixes Implementation
-- This file contains fixes for identified issues in the vaccine inventory system

-- =====================================================
-- ISSUE 1: Add administered_time field to immunizations table
-- =====================================================

-- Add administered_time column to track exact time of vaccine administration
ALTER TABLE immunizations
ADD COLUMN IF NOT EXISTS administered_time TIME;

-- Create a trigger to automatically set administered_time based on administered_date
CREATE OR REPLACE FUNCTION set_administered_time()
RETURNS TRIGGER AS $$
BEGIN
    -- If administered_time is not set, set appropriate default based on date
    IF NEW.administered_time IS NULL THEN
        IF NEW.administered_date = CURRENT_DATE THEN
            -- For today's date, use current time
            NEW.administered_time = CURRENT_TIME;
        ELSE
            -- For past/future dates, default to 8:00 AM (normal business hours)
            NEW.administered_time = '08:00:00'::TIME;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on immunizations table
DROP TRIGGER IF EXISTS trg_set_administered_time ON immunizations;
CREATE TRIGGER trg_set_administered_time
    BEFORE INSERT OR UPDATE ON immunizations
    FOR EACH ROW
    EXECUTE FUNCTION set_administered_time();

-- =====================================================
-- ISSUE 2: Set up cron jobs for automated expiry checks
-- =====================================================

-- Wrapper function for scheduled execution of patient schedule status updates
CREATE OR REPLACE FUNCTION public.update_schedule_statuses_scheduled()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Call the canonical status update function if present; ignore if missing
  PERFORM 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE p.proname = 'update_patient_schedule_statuses' AND n.nspname = 'public';
  IF FOUND THEN
    PERFORM public.update_patient_schedule_statuses();
  END IF;
END;$$;

-- Check if pg_cron extension is available and install if needed
DO $$
BEGIN
    -- Try to create the pg_cron extension if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- For Supabase, pg_cron might need to be enabled differently
        -- Try to create it, but don't fail if it doesn't work
        BEGIN
            CREATE EXTENSION IF NOT EXISTS pg_cron;
            RAISE NOTICE 'pg_cron extension created successfully';
        EXCEPTION
            WHEN insufficient_privilege THEN
                RAISE NOTICE 'Cannot create pg_cron extension due to insufficient privileges. This is normal in managed databases like Supabase.';
            WHEN undefined_file THEN
                RAISE NOTICE 'pg_cron extension is not available in this PostgreSQL installation.';
        END;
    END IF;
END $$;

-- Only schedule cron jobs if pg_cron is available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Schedule daily expiry check at 7:00 AM
        PERFORM cron.schedule(
            'daily-expiry-check-7am',
            '0 7 * * *',  -- 7:00 AM daily
            'SELECT public.check_and_expire_inventory();'
        );

        -- Schedule patient schedule status updates at 7:00 AM
        PERFORM cron.schedule(
            'daily-schedule-update-7am',
            '0 7 * * *',  -- 7:00 AM daily
            'SELECT public.update_schedule_statuses_scheduled();'
        );

        -- Schedule daily expiry check at 5:00 PM
        PERFORM cron.schedule(
            'daily-expiry-check-5pm',
            '0 17 * * *',  -- 5:00 PM daily
            'SELECT public.check_and_expire_inventory();'
        );

        -- Schedule patient schedule status updates at 5:00 PM
        PERFORM cron.schedule(
            'daily-schedule-update-5pm',
            '0 17 * * *',  -- 5:00 PM daily
            'SELECT public.update_schedule_statuses_scheduled();'
        );

        RAISE NOTICE 'Cron jobs scheduled successfully';
    ELSE
        RAISE NOTICE 'pg_cron extension not available. Cron jobs will not be scheduled automatically. Consider setting up external scheduling or manual expiry checks.';
    END IF;
END $$;

-- =====================================================
-- ISSUE 3: Add inventory history trigger
-- =====================================================

-- Use the existing create_history_trigger function to add history tracking to inventory table
SELECT create_history_trigger('inventory', 'inventory_id', 'inventory_history');


-- Verify history trigger was created
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'inventory' AND trigger_name LIKE '%history%';

-- Verify the history trigger function was created
SELECT proname FROM pg_proc WHERE proname LIKE 'trg_inventory_history_fn';

-- Check if inventory_history table exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'inventory_history' AND table_schema = 'public';

-- =====================================================
-- RECEIVING REPORT SYSTEM IMPLEMENTATION
-- =====================================================

-- Create receiving reports header table
CREATE TABLE IF NOT EXISTS receiving_reports (
  report_id BIGSERIAL PRIMARY KEY,
  report_number VARCHAR UNIQUE NOT NULL, -- Auto-generated: RR-YYYY-NNNN
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  delivered_by VARCHAR NOT NULL, -- Person/representative who delivered
  received_by BIGINT REFERENCES users(user_id),
  supplier_name VARCHAR DEFAULT 'Main Office', -- Since supplier is main office
  supplier_notes TEXT,
  total_items INTEGER DEFAULT 0,
  total_quantity INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'RECEIVED', 'COMPLETED', 'CANCELLED')),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by BIGINT REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by BIGINT REFERENCES users(user_id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by BIGINT REFERENCES users(user_id)
);

-- Create receiving report items table
CREATE TABLE IF NOT EXISTS receiving_report_items (
  item_id BIGSERIAL PRIMARY KEY,
  report_id BIGINT REFERENCES receiving_reports(report_id),
  vaccine_id BIGINT REFERENCES vaccinemaster(vaccine_id),
  -- Manufacturer comes from vaccinemaster, but allow override if different batch
  manufacturer VARCHAR, -- Will be populated from vaccinemaster but editable
  lot_number VARCHAR NOT NULL,
  expiration_date DATE NOT NULL,
  quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),
  storage_location TEXT,
  unit_cost DECIMAL(10,2) DEFAULT 0, -- For future use
  remarks TEXT,
  -- Link to created inventory record
  inventory_id BIGINT REFERENCES inventory(inventory_id),
  -- Track if inventory was successfully created
  inventory_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add soft delete columns to existing tables if not present
ALTER TABLE receiving_reports ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE receiving_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE receiving_reports ADD COLUMN IF NOT EXISTS deleted_by BIGINT REFERENCES users(user_id);

ALTER TABLE receiving_report_items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE receiving_report_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE receiving_report_items ADD COLUMN IF NOT EXISTS deleted_by BIGINT REFERENCES users(user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_receiving_reports_status ON receiving_reports(status);
CREATE INDEX IF NOT EXISTS idx_receiving_reports_created_at ON receiving_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_receiving_report_items_report_id ON receiving_report_items(report_id);
CREATE INDEX IF NOT EXISTS idx_receiving_report_items_vaccine_id ON receiving_report_items(vaccine_id);
CREATE INDEX IF NOT EXISTS idx_receiving_report_items_inventory_id ON receiving_report_items(inventory_id);

-- Function to generate report number
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS VARCHAR AS $$
DECLARE
    current_year VARCHAR(4);
    next_number INTEGER;
    report_number VARCHAR(20);
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;

    -- Get next number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(report_number FROM 'RR-\d{4}-(\d+)$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM receiving_reports
    WHERE report_number LIKE 'RR-' || current_year || '-%';

    -- Format as RR-YYYY-NNNN
    report_number := 'RR-' || current_year || '-' || LPAD(next_number::VARCHAR, 4, '0');

    RETURN report_number;
END;
$$ LANGUAGE plpgsql;

-- Function to populate manufacturer from vaccinemaster
CREATE OR REPLACE FUNCTION populate_item_manufacturer()
RETURNS TRIGGER AS $$
BEGIN
    -- If manufacturer is not set, populate from vaccinemaster
    IF NEW.manufacturer IS NULL AND NEW.vaccine_id IS NOT NULL THEN
        SELECT manufacturer INTO NEW.manufacturer
        FROM vaccinemaster
        WHERE vaccine_id = NEW.vaccine_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create inventory from receiving report items
CREATE OR REPLACE FUNCTION create_inventory_from_report(p_report_id BIGINT, p_user_id BIGINT)
RETURNS VOID AS $$
DECLARE
    item_record RECORD;
    new_inventory_id BIGINT;
BEGIN
    -- Only process items that don't have inventory created yet
    FOR item_record IN
        SELECT * FROM receiving_report_items
        WHERE report_id = p_report_id
            AND inventory_created = FALSE
            AND is_deleted = FALSE
    LOOP
        -- Create inventory record
        INSERT INTO inventory (
            vaccine_id,
            lot_number,
            expiration_date,
            initial_quantity,
            current_stock_level,
            received_date,
            storage_location,
            created_by,
            updated_by
        ) VALUES (
            item_record.vaccine_id,
            item_record.lot_number,
            item_record.expiration_date,
            item_record.quantity_received,
            item_record.quantity_received,
            (SELECT delivery_date FROM receiving_reports WHERE report_id = p_report_id),
            COALESCE(item_record.storage_location, ''),
            p_user_id,
            p_user_id
        ) RETURNING inventory_id INTO new_inventory_id;

        -- Create RECEIVE transaction
        INSERT INTO inventorytransactions (
            inventory_id,
            transaction_type,
            quantity,
            balance_after,
            performed_by,
            created_by,
            remarks,
            date
        ) VALUES (
            new_inventory_id,
            'RECEIVE',
            item_record.quantity_received,
            item_record.quantity_received,
            p_user_id,
            p_user_id,
            'Received via Receiving Report #' || (SELECT report_number FROM receiving_reports WHERE report_id = p_report_id),
            CURRENT_TIMESTAMP
        );

        -- Update the receiving report item to link to created inventory
        UPDATE receiving_report_items
        SET inventory_id = new_inventory_id,
            inventory_created = TRUE
        WHERE item_id = item_record.item_id;
    END LOOP;

    -- Update report totals
    UPDATE receiving_reports
    SET total_items = (SELECT COUNT(*) FROM receiving_report_items WHERE report_id = p_report_id AND is_deleted = FALSE),
        total_quantity = (SELECT COALESCE(SUM(quantity_received), 0) FROM receiving_report_items WHERE report_id = p_report_id AND is_deleted = FALSE)
    WHERE report_id = p_report_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete receiving report
CREATE OR REPLACE FUNCTION complete_receiving_report(p_report_id BIGINT, p_user_id BIGINT)
RETURNS VOID AS $$
BEGIN
    -- Create inventory records for all items
    PERFORM create_inventory_from_report(p_report_id, p_user_id);

    -- Update report status
    UPDATE receiving_reports
    SET status = 'COMPLETED',
        updated_at = NOW(),
        updated_by = p_user_id
    WHERE report_id = p_report_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trg_populate_item_manufacturer
    BEFORE INSERT OR UPDATE ON receiving_report_items
    FOR EACH ROW
    EXECUTE FUNCTION populate_item_manufacturer();

CREATE TRIGGER trg_receiving_reports_timestamp
    BEFORE UPDATE ON receiving_reports
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_timestamp_generic();

CREATE TRIGGER trg_receiving_report_items_timestamp
    BEFORE UPDATE ON receiving_report_items
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_timestamp_generic();

-- =====================================================
-- VERIFICATION AND USAGE EXAMPLES
-- =====================================================

/*
USAGE EXAMPLES:

1. Create a new receiving report:
INSERT INTO receiving_reports (report_number, delivery_date, delivered_by, received_by, created_by)
VALUES (generate_report_number(), '2025-10-07 09:00:00+00', 'John Doe', 1, 1);

2. Add items to the report:
INSERT INTO receiving_report_items (report_id, vaccine_id, lot_number, expiration_date, quantity_received, storage_location)
VALUES (1, 1, 'LOT001', '2026-10-07', 100, 'Refrigerator A');

3. Complete the report (creates inventory and transactions):
SELECT complete_receiving_report(1, 1);

4. Check report status:
SELECT r.report_number, r.status, r.total_items, r.total_quantity,
       ri.vaccine_id, vm.antigen_name, ri.quantity_received, ri.inventory_created
FROM receiving_reports r
LEFT JOIN receiving_report_items ri ON r.report_id = ri.report_id
LEFT JOIN vaccinemaster vm ON ri.vaccine_id = vm.vaccine_id
WHERE r.report_id = 1;
*/

-- Verify the history trigger function was created
-- SELECT proname FROM pg_proc WHERE proname LIKE 'trg_inventory_history_fn';

-- Check if inventory_history table exists
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name = 'inventory_history' AND table_schema = 'public';

-- =====================================================
-- ALTERNATIVE SCHEDULING OPTIONS (if pg_cron not available)
-- =====================================================
/*
If pg_cron extension is not available (common in managed databases like Supabase),
consider these alternatives for automated expiry checks:

1. External Scheduler (Recommended):
   - Use a cron job on your application server
   - Set up a scheduled task in your deployment platform (Heroku, Vercel, etc.)
   - Use a job queue system like Bull, Agenda, or similar

2. Application-Level Scheduling:
   - Use node-cron in your Node.js application
   - Example: https://www.npmjs.com/package/node-cron

3. Manual Checks:
   - Call check_and_expire_inventory() periodically from your application
   - Add it to a maintenance endpoint or admin interface

4. Database Triggers:
   - Create triggers that check expiry on inventory operations
   - Less efficient but doesn't require external scheduling
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify administered_time column was added
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'immunizations' AND column_name = 'administered_time';

-- Verify cron jobs were scheduled (only if pg_cron is available)
-- SELECT * FROM cron.job WHERE jobname LIKE '%expiry-check%';

-- Verify history trigger was created
-- SELECT trigger_name, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE event_object_table = 'inventory' AND trigger_name LIKE '%history%';

-- Verify receiving report tables were created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('receiving_reports', 'receiving_report_items') AND table_schema = 'public';

-- Verify receiving report functions were created
-- SELECT proname FROM pg_proc WHERE proname IN ('generate_report_number', 'create_inventory_from_report', 'complete_receiving_report');

-- =====================================================
-- FUNCTION OVERLAP ANALYSIS SUMMARY
-- =====================================================
/*
The following functions were analyzed for overlaps and redundancy:

PATIENT SCHEDULE STATUS FUNCTIONS:
1. get_schedule_status(p_schedule_id) - Simple status reader, returns text status
2. recompute_schedule_status(p_id) - Updates single schedule status in database
3. recompute_patient_schedule_statuses(p_patient_id) - Updates all schedules for one patient
4. recalc_patient_schedule_enhanced(...) - Reschedules future doses + calls recompute_patient_schedule_statuses
5. update_patient_schedule_statuses() - Updates ALL active schedules for ALL patients (batch operation)
6. update_schedule_statuses_scheduled() - Wrapper for scheduled execution of update_patient_schedule_statuses

CONCLUSION: These functions serve complementary purposes:
- get_schedule_status: Read-only status retrieval
- recompute_*: Targeted updates for specific patients/schedules
- update_patient_schedule_statuses: Global batch updates (used by triggers)
- recalc_patient_schedule_enhanced: Business logic for dose administration + rescheduling

No redundancy found - they have different scopes and triggers.

INVENTORY EXPIRY FUNCTIONS:
1. check_and_expire_inventory() - Core expiry logic
2. check_expired_inventory_scheduled() - Wrapper for scheduled execution

CONCLUSION: No overlap - wrapper pattern for scheduled execution.

TRIGGERS:
- trigger_schedule_update_on_activity: Calls update_patient_schedule_statuses on login
- trigger_update_schedule_statuses: Calls update_patient_schedule_statuses on immunization inserts
- patientschedule_status_update_trigger: Trigger on immunizations table

CONCLUSION: Triggers serve different events but call the same global update function.
This is appropriate for ensuring status consistency across different operations.
*/