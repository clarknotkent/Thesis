-- Fix for the INSERT mismatch error in create_inventory_from_report function
-- The issue was that the INSERT into inventorytransactions had 9 values but only 8 columns

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

            -- FIXED: Corrected the INSERT statement to have matching columns and values
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