Database Schema Overview

This folder contains a complete, query-driven inventory of the PostgreSQL database. Each SQL file produces a specific report when executed against your database, so you can quickly inspect structure, security, and performance-related metadata.

How to use
- Run files with psql or any SQL client connected to your Postgres database.
- All queries exclude system schemas (pg_catalog, information_schema, pg_toast, pg_temp). They work out-of-the-box; add extra WHERE filters for specific schemas as needed.
- Each file returns rows that you can export to CSV for documentation.

Files and purpose
- 00_database_overview.sql: Database-level info (size, owner, encoding) and selected settings.
- 01_schemas_and_tables.sql: List all schemas and tables (incl. type, owner, row estimate, sizes).
- 02_table_columns_and_defaults.sql: Columns, types, nullability, defaults, generated/identity.
- 03_constraints_and_foreign_keys.sql: PK, unique, check, FK constraints with column mapping.
- 04_indexes.sql: Index definitions, uniqueness, methods, predicates, sizes, usage stats.
- 05_sequences_and_identities.sql: Sequences, owners, identity columns and links.
- 06_triggers_and_trigger_functions.sql: Triggers with timing, events, conditions, functions.
- 07_routines_functions_procs.sql: Functions and procedures (signature, return type, attrs), plus full `definition` (CREATE FUNCTION text) and `description` (COMMENT if present).
- 08_views_and_columns.sql: Views with definitions and their columns.
- 09_view_base_table_mapping.sql: Mapping from each view to the base tables it depends on.
- 10_row_level_security_policies.sql: RLS policies per table and roles (using pg_policies).
- 10b_row_level_security_flags.sql: Per-table RLS enabled/forced flags.
- 11_extensions.sql: Installed extensions and their versions.
- 12_roles_and_privileges.sql: Roles, memberships, object privileges, and default privileges.
- 13_enums_domains_types.sql: Enum labels, domains, and composite types.
- 14_partitions_and_inheritance.sql: Partitioned tables, parents/children, inheritance.
- 15_materialized_views.sql: Materialized views with definitions and sizes.
- 16_table_sizes_and_rowcounts.sql: Table and index sizes plus rowcount estimates.
- 17_comments.sql: Table and column comments.
- 18_tables_without_primary_key.sql: Tables missing a primary key.
- 19_fdw_servers_and_foreign_tables.sql: Foreign servers, user mappings, and foreign tables.
- 20_index_health_checks.sql: Invalid, unused, and duplicate-index checks.
- 21_orphan_sequences.sql: Sequences not OWNED BY any column.
- 22_tablespaces.sql: Tablespaces and their sizes/options.
- 23_event_triggers.sql: Event triggers defined at the database level.
- 24_logical_replication.sql: Publications and subscriptions.
- 25_column_statistics_settings.sql: Per-column stats snapshot (from pg_stats).
- 26_autovacuum_table_settings.sql: Per-table autovacuum options.

Notes
- For accurate row counts, analyze tables first or rely on estimates (n_live_tup).
- Index usage stats rely on pg_stat_user_indexes; ensure stats collection is enabled.
- If you use multiple schemas heavily, consider adding an explicit filter like:
  AND n.nspname IN ('public', 'app', 'inventory')
- Function definitions can be large; filter by routine name or schema, or use client-side paging. In psql, consider `\x` (expanded display) when viewing long text columns.

Quick run tips (psql)
- To save a report to CSV:
  \copy (\i 04_indexes.sql) TO 'indexes.csv' CSV HEADER
- Or run inline:
  \o indexes.csv ; \i 04_indexes.sql ; \o

Legacy files notice
- Legacy SQL files remain only as pointers with a DEPRECATED notice. Prefer the numbered files above.
