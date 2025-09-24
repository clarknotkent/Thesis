-- Migration 063: Fix inventory transaction activity trigger to handle correct transaction types
-- This fixes the "Unknown action_type INVENTORY_TRANSACTION" error

CREATE OR REPLACE FUNCTION public.trg_inventorytransactions_activity_fn()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_actor bigint; v_target bigint; v_action text; v_old jsonb; v_new jsonb;
    v_type text; v_qty int;
BEGIN
    v_actor := current_setting('app.user_id', true)::bigint;
    IF TG_OP = 'INSERT' THEN
        v_old := NULL; v_new := to_jsonb(NEW); v_target := NEW.inventory_id;
        v_type := NEW.transaction_type;
        v_qty := NEW.quantity;
        -- Map transaction types to inventory action types
        IF v_type IN ('RECEIVE', 'RETURN', 'IN', 'INBOUND') THEN
            v_action := 'INVENTORY_STOCK_ADDED';
        ELSIF v_type IN ('ISSUE', 'OUT', 'OUTBOUND') THEN
            v_action := 'INVENTORY_STOCK_REMOVED';
        ELSIF v_type IN ('ADJUST','ADJUSTMENT') THEN
            v_action := 'INVENTORY_STOCK_ADJUSTED';
        ELSIF v_type IN ('TRANSFER','TRANSFERRED') THEN
            v_action := 'INVENTORY_STOCK_TRANSFERRED';
        ELSIF v_type IN ('EXPIRED','DAMAGED') THEN
            v_action := 'INVENTORY_STOCK_EXPIRED';
        ELSE
            -- Fallback for unknown transaction types
            v_action := 'INVENTORY_STOCK_ADJUSTED';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old := to_jsonb(OLD); v_new := to_jsonb(NEW); v_target := NEW.inventory_id;
        IF jsonb_diff(v_old, v_new) = '{}'::jsonb THEN RETURN NEW; END IF;
        v_type := NEW.transaction_type; v_qty := NEW.quantity;
        IF v_type IN ('RECEIVE', 'RETURN', 'IN','INBOUND') THEN v_action := 'INVENTORY_STOCK_ADDED';
        ELSIF v_type IN ('ISSUE', 'OUT','OUTBOUND') THEN v_action := 'INVENTORY_STOCK_REMOVED';
        ELSIF v_type IN ('ADJUST','ADJUSTMENT') THEN v_action := 'INVENTORY_STOCK_ADJUSTED';
        ELSIF v_type IN ('TRANSFER','TRANSFERRED') THEN v_action := 'INVENTORY_STOCK_TRANSFERRED';
        ELSIF v_type IN ('EXPIRED','DAMAGED') THEN v_action := 'INVENTORY_STOCK_EXPIRED';
        ELSE v_action := 'INVENTORY_STOCK_ADJUSTED'; END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD); v_new := NULL; v_target := OLD.inventory_id; v_action := 'INVENTORY_DELETE';
    END IF;
    INSERT INTO activitylogs(user_id, action_type, entity_type, entity_id, old_value, new_value, timestamp, description)
    VALUES (v_actor, v_action, 'INVENTORY', v_target, v_old, v_new, now(), jsonb_build_object('transaction_type', v_type, 'quantity', v_qty)::text);
    RETURN COALESCE(NEW, OLD);
END; $function$;

-- Then, fix the apply trigger with proper validation and locking
CREATE OR REPLACE FUNCTION public.trg_inventory_transaction_apply()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    delta int := CASE NEW.transaction_type
        WHEN 'RECEIVE' THEN NEW.quantity
        WHEN 'RETURN' THEN NEW.quantity
        WHEN 'ISSUE' THEN - NEW.quantity
        WHEN 'ADJUST' THEN NEW.quantity -- ADJUST can be + or - encoded by sign
        ELSE 0 END;
    new_level int;
BEGIN
    -- Validate quantity is positive
    IF NEW.quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    -- Lock the inventory row to prevent race conditions
    SELECT current_stock_level INTO new_level
    FROM inventory
    WHERE inventory_id = NEW.inventory_id
    FOR UPDATE;

    -- Calculate new stock level
    new_level := new_level + delta;

    -- Prevent negative stock levels
    IF new_level < 0 THEN
        RAISE EXCEPTION 'Stock would become negative (inventory_id %, attempted delta %)', NEW.inventory_id, delta;
    END IF;

    -- Update inventory with new stock level and timestamp
    UPDATE inventory
    SET current_stock_level = new_level, updated_at = now()
    WHERE inventory_id = NEW.inventory_id;

    -- Track balance after transaction
    NEW.balance_after = new_level;

    RETURN NEW;
END; $function$;