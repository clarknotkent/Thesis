# Inventory Ledger Integration

This project uses the pre-existing `inventorytransactions` table as a stock movement ledger. The backend model function `insertLedgerIfExists` maps:
- `quantity` = change in stock (delta, can be negative)
- `date` = timestamp of transaction
- `remarks` = note (e.g., 'Initial stock', 'Manual adjustment', 'Deletion correction')
- `performed_by` and `created_by` = user ID (if available)
- `balance_after` = resulting stock after transaction

No migration is needed for this table if it already exists. If you see duplicate table errors, remove any new migration files for `inventorytransactions`.

All inventory create/update/delete actions will write to this ledger automatically.
