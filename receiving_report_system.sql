-- =====================================================
-- RECEIVING REPORT SYSTEM - COMPLETE IMPLEMENTATION
-- =====================================================

-- This file contains the complete Receiving Report system that integrates
-- with the existing inventory management system.

-- =====================================================
-- SCHEMA DEFINITION
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
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by BIGINT REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_receiving_reports_status ON receiving_reports(status);
CREATE INDEX IF NOT EXISTS idx_receiving_reports_created_at ON receiving_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_receiving_reports_report_number ON receiving_reports(report_number);
CREATE INDEX IF NOT EXISTS idx_receiving_report_items_report_id ON receiving_report_items(report_id);
CREATE INDEX IF NOT EXISTS idx_receiving_report_items_vaccine_id ON receiving_report_items(vaccine_id);
CREATE INDEX IF NOT EXISTS idx_receiving_report_items_inventory_id ON receiving_report_items(inventory_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

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

-- Function to cancel receiving report
CREATE OR REPLACE FUNCTION cancel_receiving_report(p_report_id BIGINT, p_user_id BIGINT, p_reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    report_status VARCHAR;
BEGIN
    -- Get current status
    SELECT status INTO report_status FROM receiving_reports WHERE report_id = p_report_id;

    -- Only allow cancellation if not completed
    IF report_status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Cannot cancel a completed receiving report';
    END IF;

    -- Update report status
    UPDATE receiving_reports
    SET status = 'CANCELLED',
        supplier_notes = COALESCE(supplier_notes, '') || CASE WHEN p_reason IS NOT NULL THEN E'\nCancellation reason: ' || p_reason ELSE '' END,
        updated_at = NOW(),
        updated_by = p_user_id
    WHERE report_id = p_report_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

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
-- USAGE EXAMPLES AND API FUNCTIONS
-- =====================================================

/*
USAGE WORKFLOW:

1. Create a new receiving report (DRAFT status):
INSERT INTO receiving_reports (report_number, delivery_date, delivered_by, received_by, created_by)
VALUES (generate_report_number(), '2025-10-07 09:00:00+00', 'John Doe', 1, 1);

2. Add items to the report:
INSERT INTO receiving_report_items (report_id, vaccine_id, lot_number, expiration_date, quantity_received, storage_location)
VALUES (1, 1, 'LOT001', '2026-10-07', 100, 'Refrigerator A');

3. Complete the report (creates inventory and RECEIVE transactions):
SELECT complete_receiving_report(1, 1);

4. Cancel a report if needed:
SELECT cancel_receiving_report(1, 1, 'Wrong delivery');

QUERIES:

-- Get all receiving reports with summary
SELECT r.report_id, r.report_number, r.delivery_date, r.delivered_by,
       u.surname || ' ' || u.firstname as received_by_name,
       r.total_items, r.total_quantity, r.status, r.created_at
FROM receiving_reports r
LEFT JOIN users u ON r.received_by = u.user_id
WHERE r.is_deleted = FALSE
ORDER BY r.created_at DESC;

-- Get report details with items
SELECT r.report_number, r.delivery_date, r.delivered_by, r.supplier_notes,
       ri.vaccine_id, vm.antigen_name, vm.brand_name, ri.manufacturer,
       ri.lot_number, ri.expiration_date, ri.quantity_received,
       ri.storage_location, ri.inventory_created, i.inventory_id
FROM receiving_reports r
JOIN receiving_report_items ri ON r.report_id = ri.report_id
LEFT JOIN vaccinemaster vm ON ri.vaccine_id = vm.vaccine_id
LEFT JOIN inventory i ON ri.inventory_id = i.inventory_id
WHERE r.report_id = 1 AND r.is_deleted = FALSE AND ri.is_deleted = FALSE;

-- Check inventory created from reports
SELECT i.inventory_id, i.vaccine_id, vm.antigen_name, i.lot_number,
       i.expiration_date, i.current_stock_level, i.received_date,
       r.report_number, r.delivery_date
FROM inventory i
JOIN receiving_report_items ri ON i.inventory_id = ri.inventory_id
JOIN receiving_reports r ON ri.report_id = r.report_id
LEFT JOIN vaccinemaster vm ON i.vaccine_id = vm.vaccine_id
WHERE i.is_deleted = FALSE;
*/

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('receiving_reports', 'receiving_report_items') AND table_schema = 'public';

-- Verify functions were created
SELECT proname FROM pg_proc WHERE proname IN ('generate_report_number', 'create_inventory_from_report', 'complete_receiving_report', 'cancel_receiving_report');

-- Verify triggers were created
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('receiving_reports', 'receiving_report_items')
ORDER BY event_object_table, trigger_name;