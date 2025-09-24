-- Migration 065: Update inventory transaction apply trigger to handle RECEIVE instead of INBOUND

CREATE OR REPLACE FUNCTION public.trg_inventory_transaction_apply()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    delta int := CASE NEW.transaction_type
        WHEN 'RECEIVE' THEN NEW.quantity
        WHEN 'INBOUND' THEN NEW.quantity  -- Keep for backward compatibility
        WHEN 'RETURN' THEN NEW.quantity
        WHEN 'ISSUE' THEN - NEW.quantity
        WHEN 'OUTBOUND' THEN - NEW.quantity  -- Keep for backward compatibility
        WHEN 'ADJUST' THEN NEW.quantity -- ADJUST can be + or - encoded by sign
        WHEN 'EXPIRED' THEN - NEW.quantity
        ELSE 0 END;
    new_level int;
BEGIN
    IF NEW.quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    SELECT current_stock_level INTO new_level FROM inventory WHERE inventory_id = NEW.inventory_id FOR UPDATE;

    new_level := new_level + delta;
    IF new_level < 0 THEN
        RAISE EXCEPTION 'Stock would become negative (inventory_id %, attempted delta %)', NEW.inventory_id, delta;
    END IF;

    UPDATE inventory SET current_stock_level = new_level, updated_at = now() WHERE inventory_id = NEW.inventory_id;
    NEW.balance_after = new_level;
    RETURN NEW;
END; $function$;