-- 075_receiving_report_system.sql
-- Receiving Reports schema, functions, and triggers

-- Create receiving reports header table
CREATE TABLE IF NOT EXISTS receiving_reports (
  report_id BIGSERIAL PRIMARY KEY,
  report_number VARCHAR UNIQUE NOT NULL,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  delivered_by VARCHAR NOT NULL,
  received_by BIGINT REFERENCES users(user_id),
  supplier_name VARCHAR DEFAULT 'Main Office',
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
    -- If vaccine_id is not provided, use these to upsert into vaccinemaster
    antigen_name VARCHAR,
    brand_name VARCHAR,
  manufacturer VARCHAR,
  lot_number VARCHAR NOT NULL,
  expiration_date DATE NOT NULL,
  quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),
  storage_location TEXT,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  remarks TEXT,
  inventory_id BIGINT REFERENCES inventory(inventory_id),
  inventory_created BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by BIGINT REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_receiving_reports_status ON receiving_reports(status);
CREATE INDEX IF NOT EXISTS idx_receiving_reports_created_at ON receiving_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_receiving_reports_report_number ON receiving_reports(report_number);
CREATE INDEX IF NOT EXISTS idx_receiving_report_items_report_id ON receiving_report_items(report_id);
CREATE INDEX IF NOT EXISTS idx_receiving_report_items_vaccine_id ON receiving_report_items(vaccine_id);
CREATE INDEX IF NOT EXISTS idx_receiving_report_items_inventory_id ON receiving_report_items(inventory_id);

-- Ensure vaccinemaster has a uniqueness constraint on antigen+brand+manufacturer (case-insensitive)
DO $$ BEGIN
    PERFORM 1 FROM pg_indexes WHERE indexname = 'uniq_vaccinemaster_antigen_brand_mfr';
    IF NOT FOUND THEN
        EXECUTE 'CREATE UNIQUE INDEX uniq_vaccinemaster_antigen_brand_mfr ON vaccinemaster (lower(antigen_name), lower(brand_name), lower(COALESCE(manufacturer, '''')))';
    END IF;
END $$;

-- Function: generate_report_number
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS VARCHAR AS $$
DECLARE
    current_year VARCHAR(4);
    next_number INTEGER;
    report_number VARCHAR(20);
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    SELECT COALESCE(MAX(CAST(SUBSTRING(report_number FROM 'RR-\d{4}-(\d+)$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM receiving_reports
    WHERE report_number LIKE 'RR-' || current_year || '-%';
    report_number := 'RR-' || current_year || '-' || LPAD(next_number::VARCHAR, 4, '0');
    RETURN report_number;
END;
$$ LANGUAGE plpgsql;

-- Function: populate_item_manufacturer
CREATE OR REPLACE FUNCTION populate_item_manufacturer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.vaccine_id IS NOT NULL THEN
        -- Backfill manufacturer, antigen, and brand from master if missing
        IF NEW.manufacturer IS NULL THEN
            SELECT manufacturer INTO NEW.manufacturer
            FROM vaccinemaster WHERE vaccine_id = NEW.vaccine_id;
        END IF;
        IF NEW.antigen_name IS NULL OR NEW.brand_name IS NULL THEN
            SELECT antigen_name, brand_name INTO NEW.antigen_name, NEW.brand_name
            FROM vaccinemaster WHERE vaccine_id = NEW.vaccine_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: create_inventory_from_report
CREATE OR REPLACE FUNCTION create_inventory_from_report(p_report_id BIGINT, p_user_id BIGINT)
RETURNS VOID AS $$
DECLARE item_record RECORD; new_inventory_id BIGINT; reused_is_deleted BOOLEAN; BEGIN
    FOR item_record IN
        SELECT * FROM receiving_report_items
        WHERE report_id = p_report_id AND inventory_created = FALSE AND is_deleted = FALSE
    LOOP
        -- Ensure vaccinemaster has the product; if vaccine_id is null, upsert using antigen+brand
        IF item_record.vaccine_id IS NULL THEN
            -- Try to find existing by antigen+brand(+manufacturer when provided)
            IF item_record.antigen_name IS NOT NULL AND item_record.brand_name IS NOT NULL THEN
                IF item_record.manufacturer IS NOT NULL THEN
                    SELECT vm.vaccine_id INTO item_record.vaccine_id
                    FROM vaccinemaster vm
                    WHERE lower(vm.antigen_name) = lower(item_record.antigen_name)
                      AND lower(vm.brand_name) = lower(item_record.brand_name)
                      AND lower(COALESCE(vm.manufacturer, '')) = lower(COALESCE(item_record.manufacturer, ''))
                    LIMIT 1;
                ELSE
                    SELECT vm.vaccine_id INTO item_record.vaccine_id
                    FROM vaccinemaster vm
                    WHERE lower(vm.antigen_name) = lower(item_record.antigen_name)
                      AND lower(vm.brand_name) = lower(item_record.brand_name)
                    LIMIT 1;
                END IF;

                -- If still null, insert a new vaccinemaster entry with upsert on unique constraint
                IF item_record.vaccine_id IS NULL THEN
                    BEGIN
                        INSERT INTO vaccinemaster (antigen_name, brand_name, manufacturer, vaccine_type, category, disease_prevented)
                        VALUES (item_record.antigen_name, item_record.brand_name, item_record.manufacturer, 'inactivated', 'VACCINE', item_record.antigen_name)
                        RETURNING vaccine_id INTO item_record.vaccine_id;
                    EXCEPTION WHEN unique_violation THEN
                        -- Another session inserted concurrently; fetch the id
                        SELECT vm.vaccine_id INTO item_record.vaccine_id
                        FROM vaccinemaster vm
                        WHERE lower(vm.antigen_name) = lower(item_record.antigen_name)
                          AND lower(vm.brand_name) = lower(item_record.brand_name)
                          AND lower(COALESCE(vm.manufacturer, '')) = lower(COALESCE(item_record.manufacturer, ''))
                        LIMIT 1;
                    END;
                END IF;
            END IF;

            -- Persist resolved vaccine_id back to the item row
            IF item_record.vaccine_id IS NOT NULL THEN
              UPDATE receiving_report_items SET vaccine_id = item_record.vaccine_id WHERE item_id = item_record.item_id;
            END IF;
        END IF;

        -- Guard: vaccine_id must be resolved at this point
        IF item_record.vaccine_id IS NULL THEN
            RAISE EXCEPTION 'Receiving Report item % is missing vaccine identity (antigen/brand/manufacturer)', item_record.item_id;
        END IF;

        -- Try to reuse a soft-deleted or existing matching inventory (same vaccine_id + lot + expiry + storage)
    SELECT inventory_id, is_deleted INTO new_inventory_id, reused_is_deleted
        FROM inventory
        WHERE vaccine_id = item_record.vaccine_id
          AND lot_number = item_record.lot_number
          AND expiration_date = item_record.expiration_date
          AND COALESCE(storage_location, '') = COALESCE(item_record.storage_location, '')
        LIMIT 1;

        IF new_inventory_id IS NOT NULL THEN
            -- If previously deleted, revive it
            IF reused_is_deleted IS TRUE THEN
                UPDATE inventory
                SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, updated_by = p_user_id, updated_at = NOW()
                WHERE inventory_id = new_inventory_id;
            END IF;

            -- Insert a RECEIVE transaction into the existing inventory; trigger will update stock/balance_after
            INSERT INTO inventorytransactions (
                inventory_id, transaction_type, quantity, performed_by, created_by, remarks, date
            ) VALUES (
                new_inventory_id, 'RECEIVE', item_record.quantity_received,
                p_user_id, NULL,
                'Received via Receiving Report #' || (SELECT report_number FROM receiving_reports WHERE report_id = p_report_id),
                NOW()
            );

            -- Link item to reused inventory
            UPDATE receiving_report_items
            SET inventory_id = new_inventory_id, inventory_created = TRUE
            WHERE item_id = item_record.item_id;
        ELSE
            -- No match: create a new inventory row then insert the RECEIVE transaction
            INSERT INTO inventory (
                vaccine_id, lot_number, expiration_date, initial_quantity, current_stock_level,
                received_date, storage_location, created_by, updated_by
            ) VALUES (
                item_record.vaccine_id,
                item_record.lot_number,
                item_record.expiration_date,
                item_record.quantity_received,
                item_record.quantity_received,
                (SELECT delivery_date FROM receiving_reports WHERE report_id = p_report_id),
                COALESCE(item_record.storage_location, ''),
                p_user_id, p_user_id
            ) RETURNING inventory_id INTO new_inventory_id;

            INSERT INTO inventorytransactions (
                inventory_id, transaction_type, quantity, balance_after, performed_by, created_by, remarks, date
            ) VALUES (
                new_inventory_id, 'RECEIVE', item_record.quantity_received, item_record.quantity_received,
                p_user_id, NULL,
                'Received via Receiving Report #' || (SELECT report_number FROM receiving_reports WHERE report_id = p_report_id),
                CURRENT_TIMESTAMP
            );

            UPDATE receiving_report_items
            SET inventory_id = new_inventory_id, inventory_created = TRUE
            WHERE item_id = item_record.item_id;
        END IF;
    END LOOP;

    UPDATE receiving_reports
    SET total_items = (SELECT COUNT(*) FROM receiving_report_items WHERE report_id = p_report_id AND is_deleted = FALSE),
        total_quantity = (SELECT COALESCE(SUM(quantity_received), 0) FROM receiving_report_items WHERE report_id = p_report_id AND is_deleted = FALSE)
    WHERE report_id = p_report_id;
END; $$ LANGUAGE plpgsql;

-- Function: complete_receiving_report
CREATE OR REPLACE FUNCTION complete_receiving_report(p_report_id BIGINT, p_user_id BIGINT)
RETURNS VOID AS $$
BEGIN
    PERFORM create_inventory_from_report(p_report_id, p_user_id);
    UPDATE receiving_reports SET status = 'COMPLETED', updated_at = NOW(), updated_by = p_user_id
    WHERE report_id = p_report_id;
END; $$ LANGUAGE plpgsql;

-- Function: cancel_receiving_report
CREATE OR REPLACE FUNCTION cancel_receiving_report(p_report_id BIGINT, p_user_id BIGINT, p_reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE report_status VARCHAR; BEGIN
    SELECT status INTO report_status FROM receiving_reports WHERE report_id = p_report_id;
    IF report_status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Cannot cancel a completed receiving report';
    END IF;
    UPDATE receiving_reports
    SET status = 'CANCELLED',
        supplier_notes = COALESCE(supplier_notes, '') || CASE WHEN p_reason IS NOT NULL THEN E'\nCancellation reason: ' || p_reason ELSE '' END, updated_at = NOW(),
        updated_by = p_user_id
    WHERE report_id = p_report_id;
END; $$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trg_populate_item_manufacturer ON receiving_report_items;
CREATE TRIGGER trg_populate_item_manufacturer
    BEFORE INSERT OR UPDATE ON receiving_report_items
    FOR EACH ROW EXECUTE FUNCTION populate_item_manufacturer();

-- Timestamp triggers removed to avoid conflicts
