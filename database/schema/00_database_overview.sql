SELECT
  d.datname AS database,
  pg_catalog.pg_get_userbyid(d.datdba) AS owner,
  d.encoding,
  pg_encoding_to_char(d.encoding) AS encoding_name,
  d.datcollate AS collation,
  d.datctype AS ctype,
  -- The following fields vary across PostgreSQL versions; use JSON projection to avoid errors when missing
  to_jsonb(d)->>'datlocprovider' AS locale_provider,   -- e.g., 'c' (libc) or 'i' (ICU) on newer versions
  to_jsonb(d)->>'datlocale'       AS locale,           -- general locale when available
  to_jsonb(d)->>'daticulocale'    AS icu_locale,       -- ICU locale when available
  to_jsonb(d)->>'datcollversion'  AS collversion,      -- collation version when available
  t.spcname AS tablespace,
  pg_size_pretty(pg_database_size(d.datname)) AS database_size,
  current_setting('server_version') AS server_version,
  current_setting('TimeZone') AS timezone
FROM pg_database d
LEFT JOIN pg_tablespace t ON t.oid = d.dattablespace
WHERE d.datname = current_database();

| database | owner    | encoding | encoding_name | collation   | ctype       | locale_provider | locale | icu_locale | collversion | tablespace | database_size | server_version | timezone |
| -------- | -------- | -------- | ------------- | ----------- | ----------- | --------------- | ------ | ---------- | ----------- | ---------- | ------------- | -------------- | -------- |
| postgres | postgres | 6        | UTF8          | en_US.UTF-8 | en_US.UTF-8 | i               | en-US  | null       | 153.120     | pg_default | 20 MB         | 17.4           | UTC      |



-- Selected database-level settings that affect behavior
SELECT name, setting, unit, short_desc
FROM pg_settings
WHERE name IN (
  'search_path', 'client_min_messages', 'log_min_duration_statement', 'default_statistics_target',
  'shared_buffers', 'work_mem', 'maintenance_work_mem', 'effective_cache_size'
)
ORDER BY name;

| name                       | setting                      | unit | short_desc                                                                 |
| -------------------------- | ---------------------------- | ---- | -------------------------------------------------------------------------- |
| client_min_messages        | notice                       | null | Sets the message levels that are sent to the client.                       |
| default_statistics_target  | 100                          | null | Sets the default statistics target.                                        |
| effective_cache_size       | 49152                        | 8kB  | Sets the planner's assumption about the total size of the data caches.     |
| log_min_duration_statement | -1                           | ms   | Sets the minimum execution time above which all statements will be logged. |
| maintenance_work_mem       | 32768                        | kB   | Sets the maximum memory to be used for maintenance operations.             |
| search_path                | "\$user", public, extensions | null | Sets the schema search order for names that are not schema-qualified.      |
| shared_buffers             | 28672                        | 8kB  | Sets the number of shared memory buffers used by the server.               |
| work_mem                   | 2184                         | kB   | Sets the maximum memory to be used for query workspaces.                   |