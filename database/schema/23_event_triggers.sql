-- Event triggers on DDL/commands
SELECT
	e.evtname AS trigger_name,
	e.evtevent AS event,
	e.evtenabled AS enabled_state, -- 'O' enabled, 'D' disabled, 'R' replica, 'A' always
	n.nspname AS function_schema,
	p.proname AS function_name,
	pg_catalog.pg_get_function_identity_arguments(p.oid) AS function_args,
	obj_description(e.oid,'pg_event_trigger') AS description
FROM pg_event_trigger e
JOIN pg_proc p ON p.oid = e.evtfoid
JOIN pg_namespace n ON n.oid = p.pronamespace
ORDER BY trigger_name;

| trigger_name              | event           | enabled_state | function_schema | function_name            | function_args | description |
| ------------------------- | --------------- | ------------- | --------------- | ------------------------ | ------------- | ----------- |
| graphql_watch_ddl         | ddl_command_end | O             | graphql         | increment_schema_version |               | null        |
| graphql_watch_drop        | sql_drop        | O             | graphql         | increment_schema_version |               | null        |
| issue_graphql_placeholder | sql_drop        | O             | extensions      | set_graphql_placeholder  |               | null        |
| issue_pg_cron_access      | ddl_command_end | O             | extensions      | grant_pg_cron_access     |               | null        |
| issue_pg_graphql_access   | ddl_command_end | O             | extensions      | grant_pg_graphql_access  |               | null        |
| issue_pg_net_access       | ddl_command_end | O             | extensions      | grant_pg_net_access      |               | null        |
| pgrst_ddl_watch           | ddl_command_end | O             | extensions      | pgrst_ddl_watch          |               | null        |
| pgrst_drop_watch          | sql_drop        | O             | extensions      | pgrst_drop_watch         |               | null        |