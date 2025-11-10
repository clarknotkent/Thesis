# Vaccine & Inventory API Contract

## Vaccines

POST /api/vaccines
Body: { antigen_name, brand_name, manufacturer, vaccine_type, category, description? }
201: { success, data: VaccineDTO }
409: duplicate triple

GET /api/vaccines
200: { success, data: Vaccine[] }

GET /api/vaccines/:id
404 if not found

PUT /api/vaccines/:id
Body: partial fields above

DELETE /api/vaccines/:id
400 if inventory exists (Cannot delete vaccine with existing inventory)

VaccineDTO fields: vaccine_id, antigen_name, brand_name, manufacturer, vaccine_type, category, description, is_deleted, created_at, updated_at?

## Inventory

GET /api/vaccines/inventory
200: { success, data: InventoryDTO[] }

POST /api/vaccines/inventory
Body: { vaccine_id, lot_number, expiration_date, current_stock_level, storage_location? }

GET /api/vaccines/inventory/:id

PUT /api/vaccines/inventory/:id
Body: same as POST

DELETE /api/vaccines/inventory/:id
Soft delete; correction ledger if stock >0

InventoryDTO: inventory_id, vaccine_id, lot_number, expiration_date, current_stock_level, storage_location, status, vaccinemaster { vaccine_id, antigen_name, brand_name, manufacturer, vaccine_type, category }

Status derivation (model): based on expiration & stock (Available, Low Stock, Out of Stock, Expiring Soon, Expired) – frontend may further style.

## Activity Logging
Action types used: VACCINE_CREATE/UPDATE/DELETE, INVENTORY_CREATE/UPDATE/DELETE. Ensure migration `20250922_add_vaccine_inventory_delete_action_types.sql` applied.

## Inventory Transactions (Ledger)
Table: inventorytransactions (created via `20250922_create_inventorytransactions_table.sql`).
Auto entries on inventory create/update/delete.

GET /api/vaccines/transactions?inventory_id=&vaccine_id=&transaction_type=&date_from=&date_to=&page=&limit=
Returns: { success, transactions: [], totalCount, currentPage, totalPages }

Manual POST blocked (adjust inventory instead).

transaction_type values: INITIAL_ADD, INBOUND, OUTBOUND, CORRECTION.

## Error Codes
400: validation/business rule
404: not found
409: duplicate vaccine

## Future Extension
- Deworming/Vitamin A extra fields (placeholder)
- Pagination for vaccines/inventory (currently not implemented in controller layer)

