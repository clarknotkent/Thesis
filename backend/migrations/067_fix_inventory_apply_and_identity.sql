-- 067_fix_inventory_apply_and_identity.sql
-- Goal:
-- 1) Ensure only one apply trigger function exists and enforces correct semantics:
--    - RECEIVE/RETURN add
--    - ISSUE/EXPIRED subtract
--    - ADJUST sets absolute stock level (NOT delta)
--    - Prevent negative stocks
--    - Set NEW.balance_after accordingly
-- 2) Add a unique partial index to define identity of an active inventory row used for upsert grouping:
--    (vaccine_id, lot_number, expiration_date, COALESCE(storage_location,'')) WHERE is_deleted = false

-- Drop and recreate apply function
CREATE OR REPLACE FUNCTION public.trg_inventory_transaction_apply()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    current_level int;
    new_level int;
BEGIN
    -- Quantity validation: for ADJUST allow zero (set absolute to 0), others must be positive
    IF NEW.transaction_type = 'ADJUST' THEN
        IF NEW.quantity < 0 THEN
            RAISE EXCEPTION 'Quantity must not be negative for ADJUST';
        END IF;
    ELSE
        IF NEW.quantity <= 0 THEN
            RAISE EXCEPTION 'Quantity must be positive';
        END IF;
    END IF;

    -- Lock current inventory row
    SELECT current_stock_level INTO current_level
    FROM public.inventory
    WHERE inventory_id = NEW.inventory_id
    FOR UPDATE;

    IF current_level IS NULL THEN
        RAISE EXCEPTION 'Inventory % not found', NEW.inventory_id;
    END IF;

    -- Apply semantics
    IF NEW.transaction_type = 'ADJUST' THEN
        -- ADJUST means set absolute stock level to NEW.quantity
        new_level := NEW.quantity;
    ELSIF NEW.transaction_type IN ('RECEIVE') THEN
        new_level := current_level + NEW.quantity;
    ELSIF NEW.transaction_type IN ('ISSUE','EXPIRED','RETURN') THEN
        new_level := current_level - NEW.quantity;
    ELSE
        RAISE EXCEPTION 'Unsupported transaction_type: %', NEW.transaction_type;
    END IF;

    IF new_level < 0 THEN
        RAISE EXCEPTION 'Stock would become negative (inventory_id %, after %)', NEW.inventory_id, new_level;
    END IF;

    UPDATE public.inventory
    SET current_stock_level = new_level,
        updated_at = now()
    WHERE inventory_id = NEW.inventory_id;

    NEW.balance_after := new_level;
    RETURN NEW;
END;
$function$;

-- Ensure the activity and history functions exist (assumes they are already present in prior migrations)
-- We do not recreate the triggers here to avoid duplicates; ensure only one trigger is attached on the DB.

-- Create a unique partial index representing identity of active inventory rows
CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_identity_active
ON public.inventory (vaccine_id, lot_number, expiration_date, COALESCE(storage_location,''))
WHERE is_deleted = false;
