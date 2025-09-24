-- Migration 064: Fix immunization inventory trigger to use correct transaction type
-- Use 'ISSUE' which is a valid enum value

CREATE OR REPLACE FUNCTION public.trg_immunization_issue_inventory()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.inventory_id IS NOT NULL THEN
        INSERT INTO inventorytransactions(inventory_id, transaction_type, quantity, date, remarks, performed_by, created_by)
        VALUES (NEW.inventory_id, 'ISSUE', 1, now(), 'Auto decrement for immunization '||NEW.immunization_id, NEW.administered_by, NEW.administered_by);
    END IF;
    RETURN NEW;
END; $function$;