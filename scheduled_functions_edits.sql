-- Analysis and Suggested Edits for Scheduled Functions
-- Date: October 7, 2025
-- File: scheduled_functions_edits.sql

-- =====================================================
-- ISSUES IDENTIFIED AND CORRECTIONS NEEDED
-- =====================================================

-- 1. check_expired_inventory_scheduled
-- STATUS: MINOR ISSUE - Unnecessary complexity
-- The pg_proc check is redundant since we call the function anyway.
-- If the function doesn't exist, PERFORM will raise an error.

-- 2. check_and_expire_inventory
-- STATUS: MAJOR ISSUES - Logic errors in stock calculation

-- PROBLEM: The query calculates total_issued but doesn't use it correctly
-- PROBLEM: current_balance should be current_stock_level (remaining stock), but the 30-day limit on issues is wrong
-- PROBLEM: For expiry, we should expire ALL remaining stock, not just recent issues

-- CORRECTED VERSION NEEDED:
-- Remove the 30-day limit on issues since expiry affects all remaining stock
-- The total_issued calculation is unnecessary since current_stock_level already represents remaining stock

-- 3. update_schedule_statuses_scheduled
-- STATUS: MINOR ISSUE - Same as #1, unnecessary pg_proc check

-- 4. update_patient_schedule_statuses
-- STATUS: MINOR ISSUE - Grace period handling

-- PROBLEM: COALESCE(grace_period_days, 0) means NULL grace period = 0 days
-- This might be intended, but consider if NULL should mean infinite grace or a default value

-- =====================================================
-- CORRECTED FUNCTIONS
-- =====================================================

-- CORRECTED: check_expired_inventory_scheduled
CREATE OR REPLACE FUNCTION check_expired_inventory_scheduled()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Call the expiry check function directly
  -- Let it error if the function doesn't exist (which it should)
  PERFORM public.check_and_expire_inventory();
END;
$$;

-- CORRECTED: check_and_expire_inventory
CREATE OR REPLACE FUNCTION check_and_expire_inventory()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    inv_record RECORD;
    current_balance INTEGER;
BEGIN
    -- Find all inventory items that have expired and are not already marked as expired
    -- FIXED: Removed unnecessary 30-day limit and total_issued calculation
    FOR inv_record IN
        SELECT i.inventory_id, i.vaccine_id, i.current_stock_level, i.expiration_date
        FROM inventory i
        WHERE i.is_deleted = FALSE
            AND i.expiration_date < CURRENT_DATE
            AND i.current_stock_level > 0
            AND NOT EXISTS (
                SELECT 1 FROM inventorytransactions it2
                WHERE it2.inventory_id = i.inventory_id
                    AND it2.transaction_type = 'EXPIRED'
            )
    LOOP
        -- FIXED: Use current_stock_level directly as remaining balance
        current_balance := inv_record.current_stock_level;

        -- Create EXPIRED transaction for the entire remaining stock
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
            inv_record.inventory_id,
            'EXPIRED',
            -current_balance,  -- Negative quantity for expiry
            0,  -- Balance becomes 0
            NULL,  -- System operation
            NULL,  -- System operation
            'Automatic expiry check - vaccine expired on ' || inv_record.expiration_date,
            CURRENT_TIMESTAMP
        );

        -- Update inventory stock level to 0
        UPDATE inventory
        SET current_stock_level = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE inventory_id = inv_record.inventory_id;
    END LOOP;
END;
$$;

-- CORRECTED: update_schedule_statuses_scheduled
CREATE OR REPLACE FUNCTION update_schedule_statuses_scheduled()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Call the status update function directly
  PERFORM public.update_patient_schedule_statuses();
END;
$$;

-- CORRECTED: update_patient_schedule_statuses
CREATE OR REPLACE FUNCTION update_patient_schedule_statuses()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    schedule_record RECORD;
    new_status TEXT;
    grace_days INTEGER;
    today DATE := CURRENT_DATE;
BEGIN
    -- Update statuses for all active schedules
    FOR schedule_record IN
        SELECT ps.patient_schedule_id, ps.patient_id, ps.vaccine_id, ps.dose_number,
               ps.scheduled_date, ps.actual_date, ps.status,
               sd.grace_period_days
        FROM patientschedule ps
        JOIN schedule_master sm ON sm.vaccine_id = ps.vaccine_id
        JOIN schedule_doses sd ON sd.schedule_id = sm.id AND sd.dose_number = ps.dose_number
        WHERE ps.is_deleted = FALSE
            AND ps.status NOT IN ('Completed', 'Cancelled')
    LOOP
        -- Determine new status based on dates and grace period
        IF schedule_record.actual_date IS NOT NULL THEN
            new_status := 'Completed';
        ELSIF schedule_record.scheduled_date < today THEN
            -- FIXED: Consider if NULL grace_period_days should be handled differently
            -- Currently defaults to 0, meaning no grace period
            grace_days := COALESCE(schedule_record.grace_period_days, 0);
            IF schedule_record.scheduled_date + grace_days >= today THEN
                new_status := 'Overdue';
            ELSE
                new_status := 'Missed';
            END IF;
        ELSE
            new_status := 'Scheduled';
        END IF;

        -- Update status if changed
        IF schedule_record.status != new_status THEN
            UPDATE patientschedule
            SET status = new_status,
                updated_at = CURRENT_TIMESTAMP
            WHERE patient_schedule_id = schedule_record.patient_schedule_id;
        END IF;
    END LOOP;

    -- Update patient tags based on defaulter status
    PERFORM refresh_defaulters();
END;
$$;

-- =====================================================
-- EDIT INSTRUCTIONS
-- =====================================================

-- 1. Replace the check_and_expire_inventory function with the corrected version above
--    - Remove the LEFT JOIN and total_issued calculation
--    - Remove the 30-day date filter
--    - Use current_stock_level directly

-- 2. Simplify the wrapper functions (optional)
--    - Remove the pg_proc existence checks
--    - Call functions directly since they should exist

-- 3. Consider grace period handling
--    - Decide if NULL grace_period_days should default to 0 or a different value
--    - Document the business logic for grace periods

-- 4. Test the corrected functions thoroughly
--    - Test expiry logic with various stock levels
--    - Test schedule status updates with different date scenarios
--    - Verify transactions are created correctly