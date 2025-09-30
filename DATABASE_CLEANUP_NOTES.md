# Database cleanup notes (based only on two provided files)

This document summarizes functions/triggers, duplicates/overlaps, gaps, and the reasoning and assumptions used to reconstruct/fix the public views in `db/cleaned_views.sql`.

Important: I only referenced these two files:
- `Thesis/triggers & functions.txt` (functions/trigger catalog)
- `Thesis/schema overview.txt` (columns, constraints, RLS and view shapes)

If anything below needs verification against the real DB, please share the actual `CREATE VIEW/FUNCTION/TRIGGER` DDLs or a pg_dump so I can remove assumptions.

## Functions and triggers overview (grouped)

- Identity/JWT helpers (auth.*):
  - `auth.jwt()` – current JWT claims. `auth.email()`, `auth.role()`, `auth.uid()` look deprecated; prefer claims from `auth.jwt()`.
- Supabase/PostgREST/GraphQL support (extensions/graphql/...):
  - Event triggers that grant privileges to `pg_graphql`, `pg_net`, `pg_cron` and PostgREST DDL reload triggers. No schema change needed.
- User mapping/auth (public):
  - `authenticate_user`, `link_supabase_user`, `get_user_id_from_uuid`, `get_uuid_from_user_id`, `resolve_login_identifier`.
  - `set_app_context`, `current_app_user_id`, `current_app_role` to propagate app user/role to triggers.
  - Triggers: create mapping on user insert, create user on guardian insert.
- History/audit:
  - Generic `create_history_trigger` + `trg_generic_history` and per-table history triggers (patients, visits, inventory, immunizations, deworming, vitamina, inventory_requests, inventorytransactions).
  - `jsonb_diff` helper for changed_fields.
- Soft delete/restore:
  - `soft_delete_row(...)` overloads, `restore_row`, `restore_entity`, plus cascade helpers for guardians/patients.
- Scheduling:
  - `generate_patient_schedule`, `recompute_patient_schedule_statuses`, `recompute_schedule_status`, `recalc_patient_schedule` and `recalc_patient_schedule_enhanced` (overlap – see Duplicates).
  - Constraints on `schedule_master`/`schedule_doses` enforce min/max intervals; an `enforce_vaccine_interval` trigger function likely guards schedule changes.
  - `create_patientschedule_on_patient_insert` trigger creates schedule for new patient.
- Immunization ingestion and inventory:
  - `ingest_patient_immunization_history`, triggers: `trg_immunizations_history_fn`, `trg_immunization_issue_inventory`.
  - Inventory safety: `trg_inventory_transaction_apply`, `enforce_inventory_nonnegative`, history triggers, and request approval/rejection helpers.
- Activity logging:
  - `activitylogs` table with partition trigger `trg_activitylogs_partition`; various `*_activity_fn` triggers on domain tables.

## Duplicates/overlaps to clean

- Deprecated helpers:
  - `auth.email()`, `auth.role()`, `auth.uid()` duplicate information in `auth.jwt()`. Recommend marking deprecated and updating callers.
- Schedule recalculation:
  - Both `recalc_patient_schedule` and `recalc_patient_schedule_enhanced` exist; pick one as canonical. If enhanced is a superset, deprecate the other.
- Soft delete helpers:
  - Two overloads of `soft_delete_row(...)` with similar behavior. Keep one signature (record PK + actor + optional cascade) and route others to it.
- History triggers:
  - You have both a generic history trigger factory and table-specific history triggers. Prefer a single generic trigger per table (created by factory) to avoid drift.

## Likely missing or to verify

- View source DDL:
  - `schema overview.txt` lists the column shapes, but not the original `CREATE VIEW` text. I rebuilt views in `db/cleaned_views.sql` using conservative logic. Please validate:
    - `inventorylowstock_view.minimum_threshold`: used constant 10; if you have a config table, we should join it instead.
    - `dashboard_view.stock_by_category`: returned as JSONB map of category -> total stock. If you need different shape, specify.
    - `tcl_view.immunization_status`: summarized from `patientschedule`. If your status should derive from `immunizations`, adjust accordingly.
    - `monthlyreports_view.total_patients_seen`: I used COUNT(visits per month). If the metric is different (unique patients or clinic days), tell me.
- RLS helper functions:
  - RLS policies reference `app.role()` and `app.user_id()`-style helpers. Ensure `set_app_context` is invoked by your API layer and those helper functions exist and are SECURITY DEFINER-safe.
- Constraints noise in `patientschedule` and `schedule_doses`:
  - The constraint list shows many duplicate rows (artifact of information_schema join). Actual unique constraints should be verified once we have DDL.

## Views fixed and how

I recreated all listed views with explicit derivations and soft-delete filtering:
- `activitylogs_view`: joins `users` for `user_fullname`.
- `conversations_view`: aggregates `participants` as JSON array and picks latest message/time.
- `dashboard_view`: counts entities; computes defaulters/due soon; builds `stock_by_category` JSONB.
- `defaulters_view`: filters overdue schedules; computes `days_overdue`.
- `duesoon_view`: upcoming doses within 7 days.
- `immunizationhistory_view`: emits historical administrations with staff name and remarks.
- `inventorylowstock_view`: aggregates stock and expiration-30-days; emits constant `minimum_threshold=10`.
- `monthlyreports_view`: per-month aggregates including jsonb usage by antigen/brand/category.
- `notifications_view`: joins recipient name.
- `patients_view`: denormalizes guardian and birth history.
- `patientschedule_view`: enriches with patient/vaccine info and computed `days_overdue`.
- `tcl_view`: client list with ages, latest visit, immunization/vitamin/deworming summarized.
- `users_with_uuid`: joins `user_mapping`.
- `vaccine_report_view`: 24h timing splits with male/female counts.
- `visits_view`: adds immunizations_given JSON, booleans for vitamina/deworming, and latest vital_signs object.
- `worker_progress_view`: per-staff counts.

All views avoid renaming base table/column identifiers.

## Safety/consistency notes

- Soft-deletes: consistently filter with `COALESCE(is_deleted,false)=false`.
- Dates: used `CURRENT_DATE` where schedules compared to today; used `COALESCE(administered_date, visit_date)` for immunizations.
- JSON vs JSONB: used JSONB where aggregating maps; plain JSON where arrays/objects were required in schema overview.

## Next steps (if you can share more)

- Provide the original `CREATE VIEW` statements or a `pg_dump -s` to remove assumptions and ensure exact matches.
- Confirm whether `inventorylowstock_view.minimum_threshold` should come from a configuration table.
- Decide the canonical schedule recalculation function and soft delete API; I can then mark/deprecate the others in a migration SQL.
- If you want a single SQL with functions/triggers cleanup, share the precise DDL for the functions from your DB or allow me to extract it; the `triggers & functions.txt` appears as a catalog, not executable DDL.
