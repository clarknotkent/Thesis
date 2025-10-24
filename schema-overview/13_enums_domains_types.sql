-- Enums, domains, and composite types
-- Enums
WITH enums AS (
  SELECT n.nspname AS schema, t.typname AS enum_type, e.enumlabel AS label, e.enumsortorder
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid = t.oid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname NOT IN ('pg_catalog','information_schema')
),
-- Domains
domains AS (
  SELECT n.nspname AS schema, t.typname AS domain, pg_catalog.format_type(t.typbasetype, t.typtypmod) AS base_type, t.typnotnull, t.typdefault
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE t.typtype = 'd'
    AND n.nspname NOT IN ('pg_catalog','information_schema')
),
-- Composite types
composites AS (
  SELECT n.nspname AS schema, t.typname AS composite_type, a.attname AS field, pg_catalog.format_type(a.atttypid, a.atttypmod) AS field_type
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  JOIN pg_class c ON c.oid = t.typrelid
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
  WHERE t.typtype = 'c'
    AND n.nspname NOT IN ('pg_catalog','information_schema')
)
SELECT 'enum' AS kind, schema, enum_type AS name, label AS detail, enumsortorder::text AS extra
FROM enums
UNION ALL
SELECT 'domain', schema, domain, base_type, CASE WHEN typnotnull THEN 'NOT NULL' ELSE '' END || COALESCE(' DEFAULT '||typdefault,'')
FROM domains
UNION ALL
SELECT 'composite', schema, composite_type, field, field_type
FROM composites
ORDER BY kind, schema, name, detail;

| kind      | schema     | name                          | detail                               | extra                           |
| --------- | ---------- | ----------------------------- | ------------------------------------ | ------------------------------- |
| composite | auth       | audit_log_entries             | created_at                           | timestamp with time zone        |
| composite | auth       | audit_log_entries             | id                                   | uuid                            |
| composite | auth       | audit_log_entries             | instance_id                          | uuid                            |
| composite | auth       | audit_log_entries             | ip_address                           | character varying(64)           |
| composite | auth       | audit_log_entries             | payload                              | json                            |
| composite | auth       | flow_state                    | auth_code                            | text                            |
| composite | auth       | flow_state                    | auth_code_issued_at                  | timestamp with time zone        |
| composite | auth       | flow_state                    | authentication_method                | text                            |
| composite | auth       | flow_state                    | code_challenge                       | text                            |
| composite | auth       | flow_state                    | code_challenge_method                | auth.code_challenge_method      |
| composite | auth       | flow_state                    | created_at                           | timestamp with time zone        |
| composite | auth       | flow_state                    | id                                   | uuid                            |
| composite | auth       | flow_state                    | provider_access_token                | text                            |
| composite | auth       | flow_state                    | provider_refresh_token               | text                            |
| composite | auth       | flow_state                    | provider_type                        | text                            |
| composite | auth       | flow_state                    | updated_at                           | timestamp with time zone        |
| composite | auth       | flow_state                    | user_id                              | uuid                            |
| composite | auth       | identities                    | created_at                           | timestamp with time zone        |
| composite | auth       | identities                    | email                                | text                            |
| composite | auth       | identities                    | id                                   | uuid                            |
| composite | auth       | identities                    | identity_data                        | jsonb                           |
| composite | auth       | identities                    | last_sign_in_at                      | timestamp with time zone        |
| composite | auth       | identities                    | provider                             | text                            |
| composite | auth       | identities                    | provider_id                          | text                            |
| composite | auth       | identities                    | updated_at                           | timestamp with time zone        |
| composite | auth       | identities                    | user_id                              | uuid                            |
| composite | auth       | instances                     | created_at                           | timestamp with time zone        |
| composite | auth       | instances                     | id                                   | uuid                            |
| composite | auth       | instances                     | raw_base_config                      | text                            |
| composite | auth       | instances                     | updated_at                           | timestamp with time zone        |
| composite | auth       | instances                     | uuid                                 | uuid                            |
| composite | auth       | mfa_amr_claims                | authentication_method                | text                            |
| composite | auth       | mfa_amr_claims                | created_at                           | timestamp with time zone        |
| composite | auth       | mfa_amr_claims                | id                                   | uuid                            |
| composite | auth       | mfa_amr_claims                | session_id                           | uuid                            |
| composite | auth       | mfa_amr_claims                | updated_at                           | timestamp with time zone        |
| composite | auth       | mfa_challenges                | created_at                           | timestamp with time zone        |
| composite | auth       | mfa_challenges                | factor_id                            | uuid                            |
| composite | auth       | mfa_challenges                | id                                   | uuid                            |
| composite | auth       | mfa_challenges                | ip_address                           | inet                            |
| composite | auth       | mfa_challenges                | otp_code                             | text                            |
| composite | auth       | mfa_challenges                | verified_at                          | timestamp with time zone        |
| composite | auth       | mfa_challenges                | web_authn_session_data               | jsonb                           |
| composite | auth       | mfa_factors                   | created_at                           | timestamp with time zone        |
| composite | auth       | mfa_factors                   | factor_type                          | auth.factor_type                |
| composite | auth       | mfa_factors                   | friendly_name                        | text                            |
| composite | auth       | mfa_factors                   | id                                   | uuid                            |
| composite | auth       | mfa_factors                   | last_challenged_at                   | timestamp with time zone        |
| composite | auth       | mfa_factors                   | phone                                | text                            |
| composite | auth       | mfa_factors                   | secret                               | text                            |
| composite | auth       | mfa_factors                   | status                               | auth.factor_status              |
| composite | auth       | mfa_factors                   | updated_at                           | timestamp with time zone        |
| composite | auth       | mfa_factors                   | user_id                              | uuid                            |
| composite | auth       | mfa_factors                   | web_authn_aaguid                     | uuid                            |
| composite | auth       | mfa_factors                   | web_authn_credential                 | jsonb                           |
| composite | auth       | oauth_authorizations          | approved_at                          | timestamp with time zone        |
| composite | auth       | oauth_authorizations          | authorization_code                   | text                            |
| composite | auth       | oauth_authorizations          | authorization_id                     | text                            |
| composite | auth       | oauth_authorizations          | client_id                            | uuid                            |
| composite | auth       | oauth_authorizations          | code_challenge                       | text                            |
| composite | auth       | oauth_authorizations          | code_challenge_method                | auth.code_challenge_method      |
| composite | auth       | oauth_authorizations          | created_at                           | timestamp with time zone        |
| composite | auth       | oauth_authorizations          | expires_at                           | timestamp with time zone        |
| composite | auth       | oauth_authorizations          | id                                   | uuid                            |
| composite | auth       | oauth_authorizations          | redirect_uri                         | text                            |
| composite | auth       | oauth_authorizations          | resource                             | text                            |
| composite | auth       | oauth_authorizations          | response_type                        | auth.oauth_response_type        |
| composite | auth       | oauth_authorizations          | scope                                | text                            |
| composite | auth       | oauth_authorizations          | state                                | text                            |
| composite | auth       | oauth_authorizations          | status                               | auth.oauth_authorization_status |
| composite | auth       | oauth_authorizations          | user_id                              | uuid                            |
| composite | auth       | oauth_clients                 | client_name                          | text                            |
| composite | auth       | oauth_clients                 | client_secret_hash                   | text                            |
| composite | auth       | oauth_clients                 | client_type                          | auth.oauth_client_type          |
| composite | auth       | oauth_clients                 | client_uri                           | text                            |
| composite | auth       | oauth_clients                 | created_at                           | timestamp with time zone        |
| composite | auth       | oauth_clients                 | deleted_at                           | timestamp with time zone        |
| composite | auth       | oauth_clients                 | grant_types                          | text                            |
| composite | auth       | oauth_clients                 | id                                   | uuid                            |
| composite | auth       | oauth_clients                 | logo_uri                             | text                            |
| composite | auth       | oauth_clients                 | redirect_uris                        | text                            |
| composite | auth       | oauth_clients                 | registration_type                    | auth.oauth_registration_type    |
| composite | auth       | oauth_clients                 | updated_at                           | timestamp with time zone        |
| composite | auth       | oauth_consents                | client_id                            | uuid                            |
| composite | auth       | oauth_consents                | granted_at                           | timestamp with time zone        |
| composite | auth       | oauth_consents                | id                                   | uuid                            |
| composite | auth       | oauth_consents                | revoked_at                           | timestamp with time zone        |
| composite | auth       | oauth_consents                | scopes                               | text                            |
| composite | auth       | oauth_consents                | user_id                              | uuid                            |
| composite | auth       | one_time_tokens               | created_at                           | timestamp without time zone     |
| composite | auth       | one_time_tokens               | id                                   | uuid                            |
| composite | auth       | one_time_tokens               | relates_to                           | text                            |
| composite | auth       | one_time_tokens               | token_hash                           | text                            |
| composite | auth       | one_time_tokens               | token_type                           | auth.one_time_token_type        |
| composite | auth       | one_time_tokens               | updated_at                           | timestamp without time zone     |
| composite | auth       | one_time_tokens               | user_id                              | uuid                            |
| composite | auth       | refresh_tokens                | created_at                           | timestamp with time zone        |
| composite | auth       | refresh_tokens                | id                                   | bigint                          |
| composite | auth       | refresh_tokens                | instance_id                          | uuid                            |
| composite | auth       | refresh_tokens                | parent                               | character varying(255)          |
| composite | auth       | refresh_tokens                | revoked                              | boolean                         |
| composite | auth       | refresh_tokens                | session_id                           | uuid                            |
| composite | auth       | refresh_tokens                | token                                | character varying(255)          |
| composite | auth       | refresh_tokens                | updated_at                           | timestamp with time zone        |
| composite | auth       | refresh_tokens                | user_id                              | character varying(255)          |
| composite | auth       | saml_providers                | attribute_mapping                    | jsonb                           |
| composite | auth       | saml_providers                | created_at                           | timestamp with time zone        |
| composite | auth       | saml_providers                | entity_id                            | text                            |
| composite | auth       | saml_providers                | id                                   | uuid                            |
| composite | auth       | saml_providers                | metadata_url                         | text                            |
| composite | auth       | saml_providers                | metadata_xml                         | text                            |
| composite | auth       | saml_providers                | name_id_format                       | text                            |
| composite | auth       | saml_providers                | sso_provider_id                      | uuid                            |
| composite | auth       | saml_providers                | updated_at                           | timestamp with time zone        |
| composite | auth       | saml_relay_states             | created_at                           | timestamp with time zone        |
| composite | auth       | saml_relay_states             | flow_state_id                        | uuid                            |
| composite | auth       | saml_relay_states             | for_email                            | text                            |
| composite | auth       | saml_relay_states             | id                                   | uuid                            |
| composite | auth       | saml_relay_states             | redirect_to                          | text                            |
| composite | auth       | saml_relay_states             | request_id                           | text                            |
| composite | auth       | saml_relay_states             | sso_provider_id                      | uuid                            |
| composite | auth       | saml_relay_states             | updated_at                           | timestamp with time zone        |
| composite | auth       | schema_migrations             | version                              | character varying(255)          |
| composite | auth       | sessions                      | aal                                  | auth.aal_level                  |
| composite | auth       | sessions                      | created_at                           | timestamp with time zone        |
| composite | auth       | sessions                      | factor_id                            | uuid                            |
| composite | auth       | sessions                      | id                                   | uuid                            |
| composite | auth       | sessions                      | ip                                   | inet                            |
| composite | auth       | sessions                      | not_after                            | timestamp with time zone        |
| composite | auth       | sessions                      | oauth_client_id                      | uuid                            |
| composite | auth       | sessions                      | refreshed_at                         | timestamp without time zone     |
| composite | auth       | sessions                      | tag                                  | text                            |
| composite | auth       | sessions                      | updated_at                           | timestamp with time zone        |
| composite | auth       | sessions                      | user_agent                           | text                            |
| composite | auth       | sessions                      | user_id                              | uuid                            |
| composite | auth       | sso_domains                   | created_at                           | timestamp with time zone        |
| composite | auth       | sso_domains                   | domain                               | text                            |
| composite | auth       | sso_domains                   | id                                   | uuid                            |
| composite | auth       | sso_domains                   | sso_provider_id                      | uuid                            |
| composite | auth       | sso_domains                   | updated_at                           | timestamp with time zone        |
| composite | auth       | sso_providers                 | created_at                           | timestamp with time zone        |
| composite | auth       | sso_providers                 | disabled                             | boolean                         |
| composite | auth       | sso_providers                 | id                                   | uuid                            |
| composite | auth       | sso_providers                 | resource_id                          | text                            |
| composite | auth       | sso_providers                 | updated_at                           | timestamp with time zone        |
| composite | auth       | users                         | aud                                  | character varying(255)          |
| composite | auth       | users                         | banned_until                         | timestamp with time zone        |
| composite | auth       | users                         | confirmation_sent_at                 | timestamp with time zone        |
| composite | auth       | users                         | confirmation_token                   | character varying(255)          |
| composite | auth       | users                         | confirmed_at                         | timestamp with time zone        |
| composite | auth       | users                         | created_at                           | timestamp with time zone        |
| composite | auth       | users                         | deleted_at                           | timestamp with time zone        |
| composite | auth       | users                         | email                                | character varying(255)          |
| composite | auth       | users                         | email_change                         | character varying(255)          |
| composite | auth       | users                         | email_change_confirm_status          | smallint                        |
| composite | auth       | users                         | email_change_sent_at                 | timestamp with time zone        |
| composite | auth       | users                         | email_change_token_current           | character varying(255)          |
| composite | auth       | users                         | email_change_token_new               | character varying(255)          |
| composite | auth       | users                         | email_confirmed_at                   | timestamp with time zone        |
| composite | auth       | users                         | encrypted_password                   | character varying(255)          |
| composite | auth       | users                         | id                                   | uuid                            |
| composite | auth       | users                         | instance_id                          | uuid                            |
| composite | auth       | users                         | invited_at                           | timestamp with time zone        |
| composite | auth       | users                         | is_anonymous                         | boolean                         |
| composite | auth       | users                         | is_sso_user                          | boolean                         |
| composite | auth       | users                         | is_super_admin                       | boolean                         |
| composite | auth       | users                         | last_sign_in_at                      | timestamp with time zone        |
| composite | auth       | users                         | phone                                | text                            |
| composite | auth       | users                         | phone_change                         | text                            |
| composite | auth       | users                         | phone_change_sent_at                 | timestamp with time zone        |
| composite | auth       | users                         | phone_change_token                   | character varying(255)          |
| composite | auth       | users                         | phone_confirmed_at                   | timestamp with time zone        |
| composite | auth       | users                         | raw_app_meta_data                    | jsonb                           |
| composite | auth       | users                         | raw_user_meta_data                   | jsonb                           |
| composite | auth       | users                         | reauthentication_sent_at             | timestamp with time zone        |
| composite | auth       | users                         | reauthentication_token               | character varying(255)          |
| composite | auth       | users                         | recovery_sent_at                     | timestamp with time zone        |
| composite | auth       | users                         | recovery_token                       | character varying(255)          |
| composite | auth       | users                         | role                                 | character varying(255)          |
| composite | auth       | users                         | updated_at                           | timestamp with time zone        |
| composite | cron       | job                           | active                               | boolean                         |
| composite | cron       | job                           | command                              | text                            |
| composite | cron       | job                           | database                             | text                            |
| composite | cron       | job                           | jobid                                | bigint                          |
| composite | cron       | job                           | jobname                              | text                            |
| composite | cron       | job                           | nodename                             | text                            |
| composite | cron       | job                           | nodeport                             | integer                         |
| composite | cron       | job                           | schedule                             | text                            |
| composite | cron       | job                           | username                             | text                            |
| composite | cron       | job_run_details               | command                              | text                            |
| composite | cron       | job_run_details               | database                             | text                            |
| composite | cron       | job_run_details               | end_time                             | timestamp with time zone        |
| composite | cron       | job_run_details               | job_pid                              | integer                         |
| composite | cron       | job_run_details               | jobid                                | bigint                          |
| composite | cron       | job_run_details               | return_message                       | text                            |
| composite | cron       | job_run_details               | runid                                | bigint                          |
| composite | cron       | job_run_details               | start_time                           | timestamp with time zone        |
| composite | cron       | job_run_details               | status                               | text                            |
| composite | cron       | job_run_details               | username                             | text                            |
| composite | extensions | pg_stat_statements            | calls                                | bigint                          |
| composite | extensions | pg_stat_statements            | dbid                                 | oid                             |
| composite | extensions | pg_stat_statements            | jit_deform_count                     | bigint                          |
| composite | extensions | pg_stat_statements            | jit_deform_time                      | double precision                |
| composite | extensions | pg_stat_statements            | jit_emission_count                   | bigint                          |
| composite | extensions | pg_stat_statements            | jit_emission_time                    | double precision                |
| composite | extensions | pg_stat_statements            | jit_functions                        | bigint                          |
| composite | extensions | pg_stat_statements            | jit_generation_time                  | double precision                |
| composite | extensions | pg_stat_statements            | jit_inlining_count                   | bigint                          |
| composite | extensions | pg_stat_statements            | jit_inlining_time                    | double precision                |
| composite | extensions | pg_stat_statements            | jit_optimization_count               | bigint                          |
| composite | extensions | pg_stat_statements            | jit_optimization_time                | double precision                |
| composite | extensions | pg_stat_statements            | local_blk_read_time                  | double precision                |
| composite | extensions | pg_stat_statements            | local_blk_write_time                 | double precision                |
| composite | extensions | pg_stat_statements            | local_blks_dirtied                   | bigint                          |
| composite | extensions | pg_stat_statements            | local_blks_hit                       | bigint                          |
| composite | extensions | pg_stat_statements            | local_blks_read                      | bigint                          |
| composite | extensions | pg_stat_statements            | local_blks_written                   | bigint                          |
| composite | extensions | pg_stat_statements            | max_exec_time                        | double precision                |
| composite | extensions | pg_stat_statements            | max_plan_time                        | double precision                |
| composite | extensions | pg_stat_statements            | mean_exec_time                       | double precision                |
| composite | extensions | pg_stat_statements            | mean_plan_time                       | double precision                |
| composite | extensions | pg_stat_statements            | min_exec_time                        | double precision                |
| composite | extensions | pg_stat_statements            | min_plan_time                        | double precision                |
| composite | extensions | pg_stat_statements            | minmax_stats_since                   | timestamp with time zone        |
| composite | extensions | pg_stat_statements            | plans                                | bigint                          |
| composite | extensions | pg_stat_statements            | query                                | text                            |
| composite | extensions | pg_stat_statements            | queryid                              | bigint                          |
| composite | extensions | pg_stat_statements            | rows                                 | bigint                          |
| composite | extensions | pg_stat_statements            | shared_blk_read_time                 | double precision                |
| composite | extensions | pg_stat_statements            | shared_blk_write_time                | double precision                |
| composite | extensions | pg_stat_statements            | shared_blks_dirtied                  | bigint                          |
| composite | extensions | pg_stat_statements            | shared_blks_hit                      | bigint                          |
| composite | extensions | pg_stat_statements            | shared_blks_read                     | bigint                          |
| composite | extensions | pg_stat_statements            | shared_blks_written                  | bigint                          |
| composite | extensions | pg_stat_statements            | stats_since                          | timestamp with time zone        |
| composite | extensions | pg_stat_statements            | stddev_exec_time                     | double precision                |
| composite | extensions | pg_stat_statements            | stddev_plan_time                     | double precision                |
| composite | extensions | pg_stat_statements            | temp_blk_read_time                   | double precision                |
| composite | extensions | pg_stat_statements            | temp_blk_write_time                  | double precision                |
| composite | extensions | pg_stat_statements            | temp_blks_read                       | bigint                          |
| composite | extensions | pg_stat_statements            | temp_blks_written                    | bigint                          |
| composite | extensions | pg_stat_statements            | toplevel                             | boolean                         |
| composite | extensions | pg_stat_statements            | total_exec_time                      | double precision                |
| composite | extensions | pg_stat_statements            | total_plan_time                      | double precision                |
| composite | extensions | pg_stat_statements            | userid                               | oid                             |
| composite | extensions | pg_stat_statements            | wal_bytes                            | numeric                         |
| composite | extensions | pg_stat_statements            | wal_fpi                              | bigint                          |
| composite | extensions | pg_stat_statements            | wal_records                          | bigint                          |
| composite | extensions | pg_stat_statements_info       | dealloc                              | bigint                          |
| composite | extensions | pg_stat_statements_info       | stats_reset                          | timestamp with time zone        |
| composite | public     | activity_action_types         | action_type                          | text                            |
| composite | public     | activity_action_types         | description                          | text                            |
| composite | public     | activity_action_types         | domain                               | text                            |
| composite | public     | activitylogs                  | action_type                          | character varying               |
| composite | public     | activitylogs                  | description                          | text                            |
| composite | public     | activitylogs                  | entity_id                            | bigint                          |
| composite | public     | activitylogs                  | entity_type                          | character varying               |
| composite | public     | activitylogs                  | log_id                               | bigint                          |
| composite | public     | activitylogs                  | new_value                            | jsonb                           |
| composite | public     | activitylogs                  | old_value                            | jsonb                           |
| composite | public     | activitylogs                  | timestamp                            | timestamp without time zone     |
| composite | public     | activitylogs                  | user_id                              | bigint                          |
| composite | public     | activitylogs_view             | action_type                          | character varying               |
| composite | public     | activitylogs_view             | description                          | text                            |
| composite | public     | activitylogs_view             | entity_id                            | bigint                          |
| composite | public     | activitylogs_view             | entity_type                          | character varying               |
| composite | public     | activitylogs_view             | log_id                               | bigint                          |
| composite | public     | activitylogs_view             | new_value                            | jsonb                           |
| composite | public     | activitylogs_view             | old_value                            | jsonb                           |
| composite | public     | activitylogs_view             | timestamp                            | timestamp without time zone     |
| composite | public     | activitylogs_view             | user_fullname                        | text                            |
| composite | public     | activitylogs_view             | user_id                              | bigint                          |
| composite | public     | activitylogs_view             | user_role                            | character varying(20)           |
| composite | public     | activitylogs_view             | username                             | character varying(50)           |
| composite | public     | birthhistory                  | address_at_birth                     | text                            |
| composite | public     | birthhistory                  | attendant_at_birth                   | character varying(100)          |
| composite | public     | birthhistory                  | ballards_score                       | integer                         |
| composite | public     | birthhistory                  | birth_length                         | numeric(5,2)                    |
| composite | public     | birthhistory                  | birth_weight                         | numeric(5,2)                    |
| composite | public     | birthhistory                  | birthhistory_id                      | bigint                          |
| composite | public     | birthhistory                  | created_at                           | timestamp with time zone        |
| composite | public     | birthhistory                  | created_by                           | bigint                          |
| composite | public     | birthhistory                  | deleted_at                           | timestamp without time zone     |
| composite | public     | birthhistory                  | deleted_by                           | bigint                          |
| composite | public     | birthhistory                  | hearing_test_date                    | date                            |
| composite | public     | birthhistory                  | is_deleted                           | boolean                         |
| composite | public     | birthhistory                  | newborn_screening_date               | date                            |
| composite | public     | birthhistory                  | newborn_screening_result             | character varying(100)          |
| composite | public     | birthhistory                  | patient_id                           | bigint                          |
| composite | public     | birthhistory                  | place_of_birth                       | character varying(100)          |
| composite | public     | birthhistory                  | time_of_birth                        | time without time zone          |
| composite | public     | birthhistory                  | type_of_delivery                     | character varying(50)           |
| composite | public     | birthhistory                  | updated_at                           | timestamp with time zone        |
| composite | public     | birthhistory                  | updated_by                           | bigint                          |
| composite | public     | conversationparticipants      | conversation_id                      | bigint                          |
| composite | public     | conversationparticipants      | conversation_participant_id          | bigint                          |
| composite | public     | conversationparticipants      | created_at                           | timestamp with time zone        |
| composite | public     | conversationparticipants      | created_by                           | bigint                          |
| composite | public     | conversationparticipants      | deleted_at                           | timestamp without time zone     |
| composite | public     | conversationparticipants      | deleted_by                           | bigint                          |
| composite | public     | conversationparticipants      | is_deleted                           | boolean                         |
| composite | public     | conversationparticipants      | joined_at                            | timestamp without time zone     |
| composite | public     | conversationparticipants      | left_at                              | timestamp without time zone     |
| composite | public     | conversationparticipants      | updated_at                           | timestamp with time zone        |
| composite | public     | conversationparticipants      | updated_by                           | bigint                          |
| composite | public     | conversationparticipants      | user_id                              | bigint                          |
| composite | public     | conversations                 | conversation_id                      | bigint                          |
| composite | public     | conversations                 | created_at                           | timestamp without time zone     |
| composite | public     | conversations                 | created_by                           | bigint                          |
| composite | public     | conversations                 | deleted_at                           | timestamp without time zone     |
| composite | public     | conversations                 | deleted_by                           | bigint                          |
| composite | public     | conversations                 | is_deleted                           | boolean                         |
| composite | public     | conversations                 | subject                              | character varying(200)          |
| composite | public     | conversations                 | updated_at                           | timestamp with time zone        |
| composite | public     | conversations                 | updated_by                           | bigint                          |
| composite | public     | conversations_view            | conversation_id                      | bigint                          |
| composite | public     | conversations_view            | last_message                         | text                            |
| composite | public     | conversations_view            | last_message_at                      | timestamp without time zone     |
| composite | public     | conversations_view            | participant_email                    | character varying(100)          |
| composite | public     | conversations_view            | participant_id                       | bigint                          |
| composite | public     | conversations_view            | participant_name                     | text                            |
| composite | public     | conversations_view            | unread_count                         | bigint                          |
| composite | public     | dashboard_view                | stock_by_category                    | jsonb                           |
| composite | public     | dashboard_view                | total_defaulters                     | bigint                          |
| composite | public     | dashboard_view                | total_due_soon                       | bigint                          |
| composite | public     | dashboard_view                | total_guardians                      | bigint                          |
| composite | public     | dashboard_view                | total_healthstaff                    | bigint                          |
| composite | public     | dashboard_view                | total_nurses                         | bigint                          |
| composite | public     | dashboard_view                | total_nutritionists                  | bigint                          |
| composite | public     | dashboard_view                | total_patients                       | bigint                          |
| composite | public     | dashboard_view                | total_vaccine_stock                  | bigint                          |
| composite | public     | defaulters_mv                 | earliest_overdue_date                | date                            |
| composite | public     | defaulters_mv                 | latest_overdue_date                  | date                            |
| composite | public     | defaulters_mv                 | overdue_count                        | bigint                          |
| composite | public     | defaulters_mv                 | patient_id                           | bigint                          |
| composite | public     | defaulters_view               | barangay                             | character varying(100)          |
| composite | public     | defaulters_view               | category                             | vaccine_category                |
| composite | public     | defaulters_view               | contact_number                       | character varying(20)           |
| composite | public     | defaulters_view               | days_overdue                         | integer                         |
| composite | public     | defaulters_view               | dose_number                          | integer                         |
| composite | public     | defaulters_view               | guardian_name                        | text                            |
| composite | public     | defaulters_view               | next_due_antigen                     | character varying(100)          |
| composite | public     | defaulters_view               | patient_id                           | bigint                          |
| composite | public     | defaulters_view               | patient_name                         | text                            |
| composite | public     | defaulters_view               | scheduled_date                       | date                            |
| composite | public     | defaulters_view               | status                               | text                            |
| composite | public     | defaulters_view               | vaccine_id                           | bigint                          |
| composite | public     | deworming                     | administered_by                      | bigint                          |
| composite | public     | deworming                     | age_at_administration                | integer                         |
| composite | public     | deworming                     | created_at                           | timestamp with time zone        |
| composite | public     | deworming                     | created_by                           | bigint                          |
| composite | public     | deworming                     | deleted_at                           | timestamp without time zone     |
| composite | public     | deworming                     | deleted_by                           | bigint                          |
| composite | public     | deworming                     | deworming_id                         | bigint                          |
| composite | public     | deworming                     | facility_name                        | text                            |
| composite | public     | deworming                     | inventory_id                         | bigint                          |
| composite | public     | deworming                     | is_deleted                           | boolean                         |
| composite | public     | deworming                     | outside                              | boolean                         |
| composite | public     | deworming                     | patient_id                           | bigint                          |
| composite | public     | deworming                     | remarks                              | text                            |
| composite | public     | deworming                     | updated_at                           | timestamp with time zone        |
| composite | public     | deworming                     | updated_by                           | bigint                          |
| composite | public     | deworming                     | vaccine_id                           | bigint                          |
| composite | public     | deworming                     | visit_id                             | bigint                          |
| composite | public     | deworming                     | vital_id                             | bigint                          |
| composite | public     | deworming_history             | changed_at                           | timestamp with time zone        |
| composite | public     | deworming_history             | changed_by                           | bigint                          |
| composite | public     | deworming_history             | changed_fields                       | jsonb                           |
| composite | public     | deworming_history             | deworming_id                         | bigint                          |
| composite | public     | deworming_history             | history_id                           | bigint                          |
| composite | public     | deworming_history             | snapshot                             | jsonb                           |
| composite | public     | deworming_history             | version_no                           | integer                         |
| composite | public     | duesoon_view                  | antigen_name                         | character varying(100)          |
| composite | public     | duesoon_view                  | category                             | vaccine_category                |
| composite | public     | duesoon_view                  | days_until_due                       | integer                         |
| composite | public     | duesoon_view                  | dose_number                          | integer                         |
| composite | public     | duesoon_view                  | guardian_contact                     | character varying(20)           |
| composite | public     | duesoon_view                  | patient_id                           | bigint                          |
| composite | public     | duesoon_view                  | patient_name                         | text                            |
| composite | public     | duesoon_view                  | scheduled_date                       | date                            |
| composite | public     | faqs                          | answer                               | text                            |
| composite | public     | faqs                          | created_at                           | timestamp with time zone        |
| composite | public     | faqs                          | created_by                           | bigint                          |
| composite | public     | faqs                          | deleted_at                           | timestamp without time zone     |
| composite | public     | faqs                          | deleted_by                           | bigint                          |
| composite | public     | faqs                          | faq_id                               | bigint                          |
| composite | public     | faqs                          | is_deleted                           | boolean                         |
| composite | public     | faqs                          | question                             | text                            |
| composite | public     | faqs                          | tags                                 | jsonb                           |
| composite | public     | faqs                          | updated_at                           | timestamp with time zone        |
| composite | public     | faqs                          | updated_by                           | bigint                          |
| composite | public     | guardians                     | address                              | text                            |
| composite | public     | guardians                     | alternative_contact_number           | character varying(20)           |
| composite | public     | guardians                     | birthdate                            | date                            |
| composite | public     | guardians                     | contact_number                       | character varying(20)           |
| composite | public     | guardians                     | created_at                           | timestamp with time zone        |
| composite | public     | guardians                     | created_by                           | bigint                          |
| composite | public     | guardians                     | date_registered                      | timestamp without time zone     |
| composite | public     | guardians                     | deleted_at                           | timestamp without time zone     |
| composite | public     | guardians                     | deleted_by                           | bigint                          |
| composite | public     | guardians                     | email                                | character varying(100)          |
| composite | public     | guardians                     | family_number                        | character varying(50)           |
| composite | public     | guardians                     | firstname                            | character varying(100)          |
| composite | public     | guardians                     | guardian_id                          | bigint                          |
| composite | public     | guardians                     | is_deleted                           | boolean                         |
| composite | public     | guardians                     | middlename                           | character varying(100)          |
| composite | public     | guardians                     | occupation                           | character varying(100)          |
| composite | public     | guardians                     | surname                              | character varying(100)          |
| composite | public     | guardians                     | updated_at                           | timestamp with time zone        |
| composite | public     | guardians                     | updated_by                           | bigint                          |
| composite | public     | guardians                     | user_id                              | bigint                          |
| composite | public     | health_staff_types            | code                                 | text                            |
| composite | public     | health_staff_types            | label                                | text                            |
| composite | public     | immunizationhistory_view      | admin_email                          | character varying(100)          |
| composite | public     | immunizationhistory_view      | admin_firstname                      | character varying(100)          |
| composite | public     | immunizationhistory_view      | admin_hs_type                        | text                            |
| composite | public     | immunizationhistory_view      | admin_role                           | character varying(20)           |
| composite | public     | immunizationhistory_view      | admin_surname                        | character varying(100)          |
| composite | public     | immunizationhistory_view      | admin_user_id                        | bigint                          |
| composite | public     | immunizationhistory_view      | admin_username                       | character varying(50)           |
| composite | public     | immunizationhistory_view      | administered_by_id                   | bigint                          |
| composite | public     | immunizationhistory_view      | administered_by_name                 | text                            |
| composite | public     | immunizationhistory_view      | administered_date                    | date                            |
| composite | public     | immunizationhistory_view      | age_at_administration                | text                            |
| composite | public     | immunizationhistory_view      | disease_prevented                    | text                            |
| composite | public     | immunizationhistory_view      | dose_number                          | integer                         |
| composite | public     | immunizationhistory_view      | immunization_created_at              | timestamp with time zone        |
| composite | public     | immunizationhistory_view      | immunization_created_by              | bigint                          |
| composite | public     | immunizationhistory_view      | immunization_deleted_at              | timestamp without time zone     |
| composite | public     | immunizationhistory_view      | immunization_deleted_by              | bigint                          |
| composite | public     | immunizationhistory_view      | immunization_facility_name           | text                            |
| composite | public     | immunizationhistory_view      | immunization_id                      | bigint                          |
| composite | public     | immunizationhistory_view      | immunization_is_deleted              | boolean                         |
| composite | public     | immunizationhistory_view      | immunization_outside                 | boolean                         |
| composite | public     | immunizationhistory_view      | immunization_updated_at              | timestamp with time zone        |
| composite | public     | immunizationhistory_view      | immunization_updated_by              | bigint                          |
| composite | public     | immunizationhistory_view      | inventory_id                         | bigint                          |
| composite | public     | immunizationhistory_view      | patient_actual_date                  | date                            |
| composite | public     | immunizationhistory_view      | patient_address                      | text                            |
| composite | public     | immunizationhistory_view      | patient_barangay                     | character varying(100)          |
| composite | public     | immunizationhistory_view      | patient_date_of_birth                | date                            |
| composite | public     | immunizationhistory_view      | patient_date_registered              | timestamp without time zone     |
| composite | public     | immunizationhistory_view      | patient_eligible_date                | date                            |
| composite | public     | immunizationhistory_view      | patient_family_number                | character varying(50)           |
| composite | public     | immunizationhistory_view      | patient_firstname                    | character varying(100)          |
| composite | public     | immunizationhistory_view      | patient_full_name                    | text                            |
| composite | public     | immunizationhistory_view      | patient_guardian_id                  | bigint                          |
| composite | public     | immunizationhistory_view      | patient_health_center                | character varying(100)          |
| composite | public     | immunizationhistory_view      | patient_id                           | bigint                          |
| composite | public     | immunizationhistory_view      | patient_is_deleted                   | boolean                         |
| composite | public     | immunizationhistory_view      | patient_middlename                   | character varying(100)          |
| composite | public     | immunizationhistory_view      | patient_schedule_created_by          | bigint                          |
| composite | public     | immunizationhistory_view      | patient_schedule_dose_number         | integer                         |
| composite | public     | immunizationhistory_view      | patient_schedule_id                  | bigint                          |
| composite | public     | immunizationhistory_view      | patient_schedule_status              | character varying(20)           |
| composite | public     | immunizationhistory_view      | patient_schedule_updated_by          | bigint                          |
| composite | public     | immunizationhistory_view      | patient_schedule_vaccine_id          | bigint                          |
| composite | public     | immunizationhistory_view      | patient_scheduled_date               | date                            |
| composite | public     | immunizationhistory_view      | patient_sex                          | character varying(10)           |
| composite | public     | immunizationhistory_view      | patient_surname                      | character varying(100)          |
| composite | public     | immunizationhistory_view      | remarks                              | text                            |
| composite | public     | immunizationhistory_view      | schedule_catchup_strategy            | text                            |
| composite | public     | immunizationhistory_view      | schedule_code                        | text                            |
| composite | public     | immunizationhistory_view      | schedule_concurrent_allowed          | boolean                         |
| composite | public     | immunizationhistory_view      | schedule_dose_due_after_days         | integer                         |
| composite | public     | immunizationhistory_view      | schedule_dose_id                     | bigint                          |
| composite | public     | immunizationhistory_view      | schedule_dose_max_interval_days      | integer                         |
| composite | public     | immunizationhistory_view      | schedule_dose_min_interval_days      | integer                         |
| composite | public     | immunizationhistory_view      | schedule_dose_min_interval_other_vax | integer                         |
| composite | public     | immunizationhistory_view      | schedule_dose_notes                  | text                            |
| composite | public     | immunizationhistory_view      | schedule_dose_number                 | integer                         |
| composite | public     | immunizationhistory_view      | schedule_dose_schedule_id            | bigint                          |
| composite | public     | immunizationhistory_view      | schedule_id                          | bigint                          |
| composite | public     | immunizationhistory_view      | schedule_max_age_days                | integer                         |
| composite | public     | immunizationhistory_view      | schedule_min_age_days                | integer                         |
| composite | public     | immunizationhistory_view      | schedule_name                        | text                            |
| composite | public     | immunizationhistory_view      | schedule_notes                       | text                            |
| composite | public     | immunizationhistory_view      | schedule_total_doses                 | integer                         |
| composite | public     | immunizationhistory_view      | schedule_vaccine_id                  | bigint                          |
| composite | public     | immunizationhistory_view      | vaccine_antigen_name                 | character varying(100)          |
| composite | public     | immunizationhistory_view      | vaccine_brand_name                   | character varying(100)          |
| composite | public     | immunizationhistory_view      | vaccine_category                     | vaccine_category                |
| composite | public     | immunizationhistory_view      | vaccine_created_by                   | bigint                          |
| composite | public     | immunizationhistory_view      | vaccine_id                           | bigint                          |
| composite | public     | immunizationhistory_view      | vaccine_is_nip                       | boolean                         |
| composite | public     | immunizationhistory_view      | vaccine_manufacturer                 | character varying(100)          |
| composite | public     | immunizationhistory_view      | vaccine_type                         | character varying(20)           |
| composite | public     | immunizationhistory_view      | vaccine_updated_by                   | bigint                          |
| composite | public     | immunizationhistory_view      | visit_id                             | bigint                          |
| composite | public     | immunizations                 | administered_by                      | bigint                          |
| composite | public     | immunizations                 | administered_date                    | date                            |
| composite | public     | immunizations                 | administered_time                    | time without time zone          |
| composite | public     | immunizations                 | age_at_administration                | text                            |
| composite | public     | immunizations                 | created_at                           | timestamp with time zone        |
| composite | public     | immunizations                 | created_by                           | bigint                          |
| composite | public     | immunizations                 | deleted_at                           | timestamp without time zone     |
| composite | public     | immunizations                 | deleted_by                           | bigint                          |
| composite | public     | immunizations                 | disease_prevented                    | text                            |
| composite | public     | immunizations                 | dose_number                          | integer                         |
| composite | public     | immunizations                 | facility_name                        | text                            |
| composite | public     | immunizations                 | immunization_id                      | bigint                          |
| composite | public     | immunizations                 | inventory_id                         | bigint                          |
| composite | public     | immunizations                 | is_deleted                           | boolean                         |
| composite | public     | immunizations                 | outside                              | boolean                         |
| composite | public     | immunizations                 | patient_id                           | bigint                          |
| composite | public     | immunizations                 | remarks                              | text                            |
| composite | public     | immunizations                 | updated_at                           | timestamp with time zone        |
| composite | public     | immunizations                 | updated_by                           | bigint                          |
| composite | public     | immunizations                 | vaccine_id                           | bigint                          |
| composite | public     | immunizations                 | visit_id                             | bigint                          |
| composite | public     | immunizations                 | vital_id                             | bigint                          |
| composite | public     | immunizations_history         | changed_at                           | timestamp with time zone        |
| composite | public     | immunizations_history         | changed_by                           | bigint                          |
| composite | public     | immunizations_history         | changed_fields                       | jsonb                           |
| composite | public     | immunizations_history         | history_id                           | bigint                          |
| composite | public     | immunizations_history         | immunization_id                      | bigint                          |
| composite | public     | immunizations_history         | snapshot                             | jsonb                           |
| composite | public     | immunizations_history         | version_no                           | integer                         |
| composite | public     | inventory                     | created_at                           | timestamp with time zone        |
| composite | public     | inventory                     | created_by                           | bigint                          |
| composite | public     | inventory                     | current_stock_level                  | integer                         |
| composite | public     | inventory                     | deleted_at                           | timestamp without time zone     |
| composite | public     | inventory                     | deleted_by                           | bigint                          |
| composite | public     | inventory                     | expiration_date                      | date                            |
| composite | public     | inventory                     | initial_quantity                     | integer                         |
| composite | public     | inventory                     | inventory_id                         | bigint                          |
| composite | public     | inventory                     | is_deleted                           | boolean                         |
| composite | public     | inventory                     | lot_number                           | character varying(50)           |
| composite | public     | inventory                     | received_date                        | timestamp with time zone        |
| composite | public     | inventory                     | storage_location                     | text                            |
| composite | public     | inventory                     | updated_at                           | timestamp with time zone        |
| composite | public     | inventory                     | updated_by                           | bigint                          |
| composite | public     | inventory                     | vaccine_id                           | bigint                          |
| composite | public     | inventory_history             | changed_at                           | timestamp with time zone        |
| composite | public     | inventory_history             | changed_by                           | bigint                          |
| composite | public     | inventory_history             | changed_fields                       | jsonb                           |
| composite | public     | inventory_history             | history_id                           | bigint                          |
| composite | public     | inventory_history             | inventory_id                         | bigint                          |
| composite | public     | inventory_history             | snapshot                             | jsonb                           |
| composite | public     | inventory_history             | version_no                           | integer                         |
| composite | public     | inventory_requests            | approved_at                          | timestamp without time zone     |
| composite | public     | inventory_requests            | approved_by                          | bigint                          |
| composite | public     | inventory_requests            | created_at                           | timestamp with time zone        |
| composite | public     | inventory_requests            | created_by                           | bigint                          |
| composite | public     | inventory_requests            | decision_at                          | timestamp with time zone        |
| composite | public     | inventory_requests            | decision_by                          | bigint                          |
| composite | public     | inventory_requests            | decision_remarks                     | text                            |
| composite | public     | inventory_requests            | deleted_at                           | timestamp with time zone        |
| composite | public     | inventory_requests            | deleted_by                           | bigint                          |
| composite | public     | inventory_requests            | inventory_id                         | bigint                          |
| composite | public     | inventory_requests            | is_deleted                           | boolean                         |
| composite | public     | inventory_requests            | quantity                             | integer                         |
| composite | public     | inventory_requests            | remarks                              | text                            |
| composite | public     | inventory_requests            | request_id                           | bigint                          |
| composite | public     | inventory_requests            | request_type                         | character varying(20)           |
| composite | public     | inventory_requests            | requested_at                         | timestamp without time zone     |
| composite | public     | inventory_requests            | requested_by                         | bigint                          |
| composite | public     | inventory_requests            | status                               | character varying(20)           |
| composite | public     | inventory_requests            | updated_at                           | timestamp with time zone        |
| composite | public     | inventory_requests            | updated_by                           | bigint                          |
| composite | public     | inventory_requests_history    | changed_at                           | timestamp with time zone        |
| composite | public     | inventory_requests_history    | changed_by                           | bigint                          |
| composite | public     | inventory_requests_history    | changed_fields                       | jsonb                           |
| composite | public     | inventory_requests_history    | history_id                           | bigint                          |
| composite | public     | inventory_requests_history    | request_id                           | bigint                          |
| composite | public     | inventory_requests_history    | snapshot                             | jsonb                           |
| composite | public     | inventory_requests_history    | version_no                           | integer                         |
| composite | public     | inventorylowstock_view        | antigen_name                         | character varying(100)          |
| composite | public     | inventorylowstock_view        | brand_name                           | character varying(100)          |
| composite | public     | inventorylowstock_view        | category                             | vaccine_category                |
| composite | public     | inventorylowstock_view        | current_stock_level                  | bigint                          |
| composite | public     | inventorylowstock_view        | expiration_soon_count                | bigint                          |
| composite | public     | inventorylowstock_view        | minimum_threshold                    | integer                         |
| composite | public     | inventorylowstock_view        | vaccine_id                           | bigint                          |
| composite | public     | inventorytransactions         | balance_after                        | integer                         |
| composite | public     | inventorytransactions         | created_at                           | timestamp with time zone        |
| composite | public     | inventorytransactions         | created_by                           | bigint                          |
| composite | public     | inventorytransactions         | date                                 | timestamp without time zone     |
| composite | public     | inventorytransactions         | deleted_at                           | timestamp without time zone     |
| composite | public     | inventorytransactions         | deleted_by                           | bigint                          |
| composite | public     | inventorytransactions         | inventory_id                         | bigint                          |
| composite | public     | inventorytransactions         | is_deleted                           | boolean                         |
| composite | public     | inventorytransactions         | performed_by                         | bigint                          |
| composite | public     | inventorytransactions         | quantity                             | integer                         |
| composite | public     | inventorytransactions         | remarks                              | text                            |
| composite | public     | inventorytransactions         | transaction_id                       | bigint                          |
| composite | public     | inventorytransactions         | transaction_type                     | transaction_type_enum           |
| composite | public     | inventorytransactions         | updated_at                           | timestamp with time zone        |
| composite | public     | inventorytransactions         | updated_by                           | bigint                          |
| composite | public     | inventorytransactions_history | changed_at                           | timestamp with time zone        |
| composite | public     | inventorytransactions_history | changed_by                           | bigint                          |
| composite | public     | inventorytransactions_history | changed_fields                       | jsonb                           |
| composite | public     | inventorytransactions_history | history_id                           | bigint                          |
| composite | public     | inventorytransactions_history | snapshot                             | jsonb                           |
| composite | public     | inventorytransactions_history | transaction_id                       | bigint                          |
| composite | public     | inventorytransactions_history | version_no                           | integer                         |
| composite | public     | message_receipts              | created_at                           | timestamp with time zone        |
| composite | public     | message_receipts              | delivered_at                         | timestamp with time zone        |
| composite | public     | message_receipts              | message_id                           | bigint                          |
| composite | public     | message_receipts              | read_at                              | timestamp with time zone        |
| composite | public     | message_receipts              | receipt_id                           | bigint                          |
| composite | public     | message_receipts              | user_id                              | bigint                          |
| composite | public     | messages                      | attachment_url                       | text                            |
| composite | public     | messages                      | conversation_id                      | bigint                          |
| composite | public     | messages                      | created_at                           | timestamp without time zone     |
| composite | public     | messages                      | created_by                           | bigint                          |
| composite | public     | messages                      | deleted_at                           | timestamp without time zone     |
| composite | public     | messages                      | deleted_by                           | bigint                          |
| composite | public     | messages                      | delivered_at                         | timestamp without time zone     |
| composite | public     | messages                      | is_deleted                           | boolean                         |
| composite | public     | messages                      | message_content                      | text                            |
| composite | public     | messages                      | message_id                           | bigint                          |
| composite | public     | messages                      | message_type                         | message_type_enum               |
| composite | public     | messages                      | read_at                              | timestamp without time zone     |
| composite | public     | messages                      | sender_id                            | bigint                          |
| composite | public     | messages                      | updated_at                           | timestamp with time zone        |
| composite | public     | messages                      | updated_by                           | bigint                          |
| composite | public     | monthlyreports_view           | deworming_given                      | bigint                          |
| composite | public     | monthlyreports_view           | female_vaccinated                    | bigint                          |
| composite | public     | monthlyreports_view           | male_vaccinated                      | bigint                          |
| composite | public     | monthlyreports_view           | report_month                         | text                            |
| composite | public     | monthlyreports_view           | total_patients_seen                  | bigint                          |
| composite | public     | monthlyreports_view           | total_vaccinated                     | bigint                          |
| composite | public     | monthlyreports_view           | vaccines_used_by_antigen             | jsonb                           |
| composite | public     | monthlyreports_view           | vaccines_used_by_brand               | jsonb                           |
| composite | public     | monthlyreports_view           | vaccines_used_by_category            | jsonb                           |
| composite | public     | monthlyreports_view           | vitamina_given                       | bigint                          |
| composite | public     | notifications                 | channel                              | character varying(10)           |
| composite | public     | notifications                 | created_at                           | timestamp without time zone     |
| composite | public     | notifications                 | created_by                           | bigint                          |
| composite | public     | notifications                 | deleted_at                           | timestamp without time zone     |
| composite | public     | notifications                 | deleted_by                           | bigint                          |
| composite | public     | notifications                 | error_message                        | text                            |
| composite | public     | notifications                 | is_deleted                           | boolean                         |
| composite | public     | notifications                 | message_body                         | text                            |
| composite | public     | notifications                 | notification_id                      | bigint                          |
| composite | public     | notifications                 | read_at                              | timestamp with time zone        |
| composite | public     | notifications                 | recipient_email                      | character varying(100)          |
| composite | public     | notifications                 | recipient_phone                      | character varying(20)           |
| composite | public     | notifications                 | recipient_user_id                    | bigint                          |
| composite | public     | notifications                 | related_entity_id                    | bigint                          |
| composite | public     | notifications                 | related_entity_type                  | character varying(50)           |
| composite | public     | notifications                 | scheduled_at                         | timestamp without time zone     |
| composite | public     | notifications                 | sent_at                              | timestamp without time zone     |
| composite | public     | notifications                 | status                               | character varying(20)           |
| composite | public     | notifications                 | template_code                        | character varying(50)           |
| composite | public     | notifications                 | updated_at                           | timestamp with time zone        |
| composite | public     | notifications                 | updated_by                           | bigint                          |
| composite | public     | notifications_view            | channel                              | character varying(10)           |
| composite | public     | notifications_view            | created_at                           | timestamp without time zone     |
| composite | public     | notifications_view            | created_by                           | bigint                          |
| composite | public     | notifications_view            | deleted_at                           | timestamp without time zone     |
| composite | public     | notifications_view            | deleted_by                           | bigint                          |
| composite | public     | notifications_view            | error_message                        | text                            |
| composite | public     | notifications_view            | is_deleted                           | boolean                         |
| composite | public     | notifications_view            | message_body                         | text                            |
| composite | public     | notifications_view            | notification_id                      | bigint                          |
| composite | public     | notifications_view            | read_at                              | timestamp with time zone        |
| composite | public     | notifications_view            | recipient_email                      | character varying(100)          |
| composite | public     | notifications_view            | recipient_name                       | text                            |
| composite | public     | notifications_view            | recipient_phone                      | character varying(20)           |
| composite | public     | notifications_view            | recipient_user_id                    | bigint                          |
| composite | public     | notifications_view            | related_entity_id                    | bigint                          |
| composite | public     | notifications_view            | related_entity_type                  | character varying(50)           |
| composite | public     | notifications_view            | scheduled_at                         | timestamp without time zone     |
| composite | public     | notifications_view            | sent_at                              | timestamp without time zone     |
| composite | public     | notifications_view            | status                               | character varying(20)           |
| composite | public     | notifications_view            | template_code                        | character varying(50)           |
| composite | public     | notifications_view            | updated_at                           | timestamp with time zone        |
| composite | public     | notifications_view            | updated_by                           | bigint                          |
| composite | public     | patients                      | address                              | text                            |
| composite | public     | patients                      | barangay                             | character varying(100)          |
| composite | public     | patients                      | created_at                           | timestamp with time zone        |
| composite | public     | patients                      | created_by                           | bigint                          |
| composite | public     | patients                      | date_of_birth                        | date                            |
| composite | public     | patients                      | date_registered                      | timestamp without time zone     |
| composite | public     | patients                      | deleted_at                           | timestamp without time zone     |
| composite | public     | patients                      | deleted_by                           | bigint                          |
| composite | public     | patients                      | family_number                        | character varying(50)           |
| composite | public     | patients                      | father_contact_number                | character varying(20)           |
| composite | public     | patients                      | father_name                          | character varying(100)          |
| composite | public     | patients                      | father_occupation                    | character varying(100)          |
| composite | public     | patients                      | firstname                            | character varying(100)          |
| composite | public     | patients                      | full_name                            | text                            |
| composite | public     | patients                      | guardian_id                          | bigint                          |
| composite | public     | patients                      | health_center                        | character varying(100)          |
| composite | public     | patients                      | is_deleted                           | boolean                         |
| composite | public     | patients                      | middlename                           | character varying(100)          |
| composite | public     | patients                      | mother_contact_number                | character varying(20)           |
| composite | public     | patients                      | mother_name                          | character varying(100)          |
| composite | public     | patients                      | mother_occupation                    | character varying(100)          |
| composite | public     | patients                      | patient_id                           | bigint                          |
| composite | public     | patients                      | qr_nonce                             | uuid                            |
| composite | public     | patients                      | relationship_to_guardian             | text                            |
| composite | public     | patients                      | sex                                  | character varying(10)           |
| composite | public     | patients                      | surname                              | character varying(100)          |
| composite | public     | patients                      | tags                                 | character varying(20)           |
| composite | public     | patients                      | updated_at                           | timestamp with time zone        |
| composite | public     | patients                      | updated_by                           | bigint                          |
| composite | public     | patients_history              | changed_at                           | timestamp with time zone        |
| composite | public     | patients_history              | changed_by                           | bigint                          |
| composite | public     | patients_history              | changed_fields                       | jsonb                           |
| composite | public     | patients_history              | history_id                           | bigint                          |
| composite | public     | patients_history              | patient_id                           | bigint                          |
| composite | public     | patients_history              | snapshot                             | jsonb                           |
| composite | public     | patients_history              | version_no                           | integer                         |
| composite | public     | patients_view                 | address                              | text                            |
| composite | public     | patients_view                 | address_at_birth                     | text                            |
| composite | public     | patients_view                 | attendant_at_birth                   | character varying(100)          |
| composite | public     | patients_view                 | ballards_score                       | integer                         |
| composite | public     | patients_view                 | barangay                             | character varying(100)          |
| composite | public     | patients_view                 | birth_length                         | numeric(5,2)                    |
| composite | public     | patients_view                 | birth_weight                         | numeric(5,2)                    |
| composite | public     | patients_view                 | birthhistory_id                      | bigint                          |
| composite | public     | patients_view                 | created_at                           | timestamp with time zone        |
| composite | public     | patients_view                 | created_by                           | bigint                          |
| composite | public     | patients_view                 | date_of_birth                        | date                            |
| composite | public     | patients_view                 | date_registered                      | timestamp with time zone        |
| composite | public     | patients_view                 | deleted_at                           | timestamp without time zone     |
| composite | public     | patients_view                 | deleted_by                           | bigint                          |
| composite | public     | patients_view                 | father_contact_number                | character varying(20)           |
| composite | public     | patients_view                 | father_name                          | character varying(100)          |
| composite | public     | patients_view                 | father_occupation                    | character varying(100)          |
| composite | public     | patients_view                 | firstname                            | character varying(100)          |
| composite | public     | patients_view                 | full_name                            | text                            |
| composite | public     | patients_view                 | guardian_address                     | text                            |
| composite | public     | patients_view                 | guardian_alternative_contact_number  | character varying(20)           |
| composite | public     | patients_view                 | guardian_birthdate                   | date                            |
| composite | public     | patients_view                 | guardian_contact_number              | character varying(20)           |
| composite | public     | patients_view                 | guardian_date_registered             | timestamp with time zone        |
| composite | public     | patients_view                 | guardian_email                       | character varying(100)          |
| composite | public     | patients_view                 | guardian_family_number               | character varying(50)           |
| composite | public     | patients_view                 | guardian_firstname                   | character varying(100)          |
| composite | public     | patients_view                 | guardian_id                          | bigint                          |
| composite | public     | patients_view                 | guardian_middlename                  | character varying(100)          |
| composite | public     | patients_view                 | guardian_occupation                  | character varying(100)          |
| composite | public     | patients_view                 | guardian_surname                     | character varying(100)          |
| composite | public     | patients_view                 | guardian_user_id                     | bigint                          |
| composite | public     | patients_view                 | health_center                        | character varying(100)          |
| composite | public     | patients_view                 | hearing_test_date                    | date                            |
| composite | public     | patients_view                 | is_deleted                           | boolean                         |
| composite | public     | patients_view                 | last_vaccination_date                | timestamp with time zone        |
| composite | public     | patients_view                 | middlename                           | character varying(100)          |
| composite | public     | patients_view                 | mother_contact_number                | character varying(20)           |
| composite | public     | patients_view                 | mother_name                          | character varying(100)          |
| composite | public     | patients_view                 | mother_occupation                    | character varying(100)          |
| composite | public     | patients_view                 | newborn_screening_date               | date                            |
| composite | public     | patients_view                 | newborn_screening_result             | character varying(100)          |
| composite | public     | patients_view                 | patient_id                           | bigint                          |
| composite | public     | patients_view                 | place_of_birth                       | character varying(100)          |
| composite | public     | patients_view                 | relationship_to_guardian             | text                            |
| composite | public     | patients_view                 | sex                                  | character varying(10)           |
| composite | public     | patients_view                 | surname                              | character varying(100)          |
| composite | public     | patients_view                 | tags                                 | character varying(20)           |
| composite | public     | patients_view                 | time_of_birth                        | time without time zone          |
| composite | public     | patients_view                 | type_of_delivery                     | character varying(50)           |
| composite | public     | patients_view                 | updated_at                           | timestamp with time zone        |
| composite | public     | patients_view                 | updated_by                           | bigint                          |
| composite | public     | patientschedule               | actual_date                          | date                            |
| composite | public     | patientschedule               | created_at                           | timestamp with time zone        |
| composite | public     | patientschedule               | created_by                           | bigint                          |
| composite | public     | patientschedule               | deleted_at                           | timestamp without time zone     |
| composite | public     | patientschedule               | deleted_by                           | bigint                          |
| composite | public     | patientschedule               | dose_number                          | integer                         |
| composite | public     | patientschedule               | eligible_date                        | date                            |
| composite | public     | patientschedule               | is_deleted                           | boolean                         |
| composite | public     | patientschedule               | patient_id                           | bigint                          |
| composite | public     | patientschedule               | patient_schedule_id                  | bigint                          |
| composite | public     | patientschedule               | scheduled_date                       | date                            |
| composite | public     | patientschedule               | status                               | character varying(20)           |
| composite | public     | patientschedule               | updated_at                           | timestamp without time zone     |
| composite | public     | patientschedule               | updated_by                           | bigint                          |
| composite | public     | patientschedule               | vaccine_id                           | bigint                          |
| composite | public     | patientschedule_history       | changed_at                           | timestamp with time zone        |
| composite | public     | patientschedule_history       | changed_by                           | bigint                          |
| composite | public     | patientschedule_history       | changed_fields                       | jsonb                           |
| composite | public     | patientschedule_history       | history_id                           | bigint                          |
| composite | public     | patientschedule_history       | patient_schedule_id                  | bigint                          |
| composite | public     | patientschedule_history       | snapshot                             | jsonb                           |
| composite | public     | patientschedule_history       | version_no                           | integer                         |
| composite | public     | patientschedule_view          | actual_date                          | date                            |
| composite | public     | patientschedule_view          | antigen_name                         | character varying(100)          |
| composite | public     | patientschedule_view          | category                             | vaccine_category                |
| composite | public     | patientschedule_view          | created_at                           | timestamp with time zone        |
| composite | public     | patientschedule_view          | created_by                           | bigint                          |
| composite | public     | patientschedule_view          | days_overdue                         | integer                         |
| composite | public     | patientschedule_view          | dose_number                          | integer                         |
| composite | public     | patientschedule_view          | eligible_date                        | date                            |
| composite | public     | patientschedule_view          | patient_id                           | bigint                          |
| composite | public     | patientschedule_view          | patient_name                         | text                            |
| composite | public     | patientschedule_view          | patient_schedule_id                  | bigint                          |
| composite | public     | patientschedule_view          | scheduled_date                       | date                            |
| composite | public     | patientschedule_view          | status                               | character varying(20)           |
| composite | public     | patientschedule_view          | updated_at                           | timestamp without time zone     |
| composite | public     | patientschedule_view          | updated_by                           | bigint                          |
| composite | public     | patientschedule_view          | vaccine_id                           | bigint                          |
| composite | public     | receiving_report_items        | antigen_name                         | character varying               |
| composite | public     | receiving_report_items        | brand_name                           | character varying               |
| composite | public     | receiving_report_items        | created_at                           | timestamp with time zone        |
| composite | public     | receiving_report_items        | deleted_at                           | timestamp with time zone        |
| composite | public     | receiving_report_items        | deleted_by                           | bigint                          |
| composite | public     | receiving_report_items        | expiration_date                      | date                            |
| composite | public     | receiving_report_items        | inventory_created                    | boolean                         |
| composite | public     | receiving_report_items        | inventory_id                         | bigint                          |
| composite | public     | receiving_report_items        | is_deleted                           | boolean                         |
| composite | public     | receiving_report_items        | item_id                              | bigint                          |
| composite | public     | receiving_report_items        | lot_number                           | character varying               |
| composite | public     | receiving_report_items        | manufacturer                         | character varying               |
| composite | public     | receiving_report_items        | quantity_received                    | integer                         |
| composite | public     | receiving_report_items        | remarks                              | text                            |
| composite | public     | receiving_report_items        | report_id                            | bigint                          |
| composite | public     | receiving_report_items        | storage_location                     | text                            |
| composite | public     | receiving_report_items        | unit_cost                            | numeric(10,2)                   |
| composite | public     | receiving_report_items        | vaccine_id                           | bigint                          |
| composite | public     | receiving_reports             | created_at                           | timestamp with time zone        |
| composite | public     | receiving_reports             | created_by                           | bigint                          |
| composite | public     | receiving_reports             | deleted_at                           | timestamp with time zone        |
| composite | public     | receiving_reports             | deleted_by                           | bigint                          |
| composite | public     | receiving_reports             | delivered_by                         | character varying               |
| composite | public     | receiving_reports             | delivery_date                        | timestamp with time zone        |
| composite | public     | receiving_reports             | is_deleted                           | boolean                         |
| composite | public     | receiving_reports             | received_by                          | bigint                          |
| composite | public     | receiving_reports             | report_id                            | bigint                          |
| composite | public     | receiving_reports             | report_number                        | character varying               |
| composite | public     | receiving_reports             | status                               | character varying               |
| composite | public     | receiving_reports             | supplier_name                        | character varying               |
| composite | public     | receiving_reports             | supplier_notes                       | text                            |
| composite | public     | receiving_reports             | total_items                          | integer                         |
| composite | public     | receiving_reports             | total_quantity                       | integer                         |
| composite | public     | receiving_reports             | updated_at                           | timestamp with time zone        |
| composite | public     | receiving_reports             | updated_by                           | bigint                          |
| composite | public     | schedule_doses                | absolute_latest_days                 | integer                         |
| composite | public     | schedule_doses                | created_at                           | timestamp with time zone        |
| composite | public     | schedule_doses                | created_by                           | bigint                          |
| composite | public     | schedule_doses                | deleted_at                           | timestamp with time zone        |
| composite | public     | schedule_doses                | deleted_by                           | bigint                          |
| composite | public     | schedule_doses                | dose_number                          | integer                         |
| composite | public     | schedule_doses                | due_after_days                       | integer                         |
| composite | public     | schedule_doses                | grace_period_days                    | integer                         |
| composite | public     | schedule_doses                | id                                   | bigint                          |
| composite | public     | schedule_doses                | is_deleted                           | boolean                         |
| composite | public     | schedule_doses                | max_interval_days                    | integer                         |
| composite | public     | schedule_doses                | min_interval_days                    | integer                         |
| composite | public     | schedule_doses                | min_interval_other_vax               | integer                         |
| composite | public     | schedule_doses                | notes                                | text                            |
| composite | public     | schedule_doses                | requires_previous                    | boolean                         |
| composite | public     | schedule_doses                | schedule_id                          | bigint                          |
| composite | public     | schedule_doses                | skippable                            | boolean                         |
| composite | public     | schedule_doses                | updated_at                           | timestamp with time zone        |
| composite | public     | schedule_doses                | updated_by                           | bigint                          |
| composite | public     | schedule_master               | catchup_strategy                     | text                            |
| composite | public     | schedule_master               | code                                 | text                            |
| composite | public     | schedule_master               | concurrent_allowed                   | boolean                         |
| composite | public     | schedule_master               | created_at                           | timestamp with time zone        |
| composite | public     | schedule_master               | created_by                           | bigint                          |
| composite | public     | schedule_master               | deleted_at                           | timestamp with time zone        |
| composite | public     | schedule_master               | deleted_by                           | bigint                          |
| composite | public     | schedule_master               | id                                   | bigint                          |
| composite | public     | schedule_master               | is_deleted                           | boolean                         |
| composite | public     | schedule_master               | max_age_days                         | integer                         |
| composite | public     | schedule_master               | min_age_days                         | integer                         |
| composite | public     | schedule_master               | name                                 | text                            |
| composite | public     | schedule_master               | notes                                | text                            |
| composite | public     | schedule_master               | total_doses                          | integer                         |
| composite | public     | schedule_master               | updated_at                           | timestamp with time zone        |
| composite | public     | schedule_master               | updated_by                           | bigint                          |
| composite | public     | schedule_master               | vaccine_id                           | bigint                          |
| composite | public     | tcl_view                      | age_days                             | double precision                |
| composite | public     | tcl_view                      | age_months                           | double precision                |
| composite | public     | tcl_view                      | barangay                             | character varying(100)          |
| composite | public     | tcl_view                      | date_of_birth                        | date                            |
| composite | public     | tcl_view                      | deworming_status                     | text                            |
| composite | public     | tcl_view                      | guardian_contact                     | character varying(20)           |
| composite | public     | tcl_view                      | guardian_name                        | text                            |
| composite | public     | tcl_view                      | health_center                        | character varying(100)          |
| composite | public     | tcl_view                      | immunization_status                  | jsonb                           |
| composite | public     | tcl_view                      | latest_visit_date                    | date                            |
| composite | public     | tcl_view                      | patient_id                           | bigint                          |
| composite | public     | tcl_view                      | patient_name                         | text                            |
| composite | public     | tcl_view                      | sex                                  | character varying(10)           |
| composite | public     | tcl_view                      | tags                                 | character varying(20)           |
| composite | public     | tcl_view                      | vitamina_status                      | text                            |
| composite | public     | timestamp_normalization_audit | normalized_at                        | timestamp with time zone        |
| composite | public     | timestamp_normalization_audit | notes                                | text                            |
| composite | public     | timestamp_normalization_audit | table_name                           | text                            |
| composite | public     | user_mapping                  | user_id                              | bigint                          |
| composite | public     | user_mapping                  | uuid                                 | uuid                            |
| composite | public     | user_sessions                 | last_activity                        | timestamp with time zone        |
| composite | public     | user_sessions                 | user_id                              | bigint                          |
| composite | public     | users                         | address                              | text                            |
| composite | public     | users                         | birthdate                            | date                            |
| composite | public     | users                         | contact_number                       | character varying(20)           |
| composite | public     | users                         | created_at                           | timestamp with time zone        |
| composite | public     | users                         | created_by                           | bigint                          |
| composite | public     | users                         | date_registered                      | timestamp without time zone     |
| composite | public     | users                         | deleted_at                           | timestamp without time zone     |
| composite | public     | users                         | deleted_by                           | bigint                          |
| composite | public     | users                         | email                                | character varying(100)          |
| composite | public     | users                         | employee_id                          | character varying(50)           |
| composite | public     | users                         | firstname                            | character varying(100)          |
| composite | public     | users                         | full_name                            | text                            |
| composite | public     | users                         | hs_type                              | text                            |
| composite | public     | users                         | is_deleted                           | boolean                         |
| composite | public     | users                         | last_login                           | timestamp without time zone     |
| composite | public     | users                         | middlename                           | character varying(100)          |
| composite | public     | users                         | professional_license_no              | character varying(50)           |
| composite | public     | users                         | role                                 | character varying(20)           |
| composite | public     | users                         | sex                                  | character varying(10)           |
| composite | public     | users                         | surname                              | character varying(100)          |
| composite | public     | users                         | updated_at                           | timestamp with time zone        |
| composite | public     | users                         | updated_by                           | bigint                          |
| composite | public     | users                         | user_id                              | bigint                          |
| composite | public     | users                         | user_status                          | user_status_enum                |
| composite | public     | users                         | username                             | character varying(50)           |
| composite | public     | users_history                 | changed_at                           | timestamp with time zone        |
| composite | public     | users_history                 | changed_by                           | bigint                          |
| composite | public     | users_history                 | changed_fields                       | jsonb                           |
| composite | public     | users_history                 | history_id                           | bigint                          |
| composite | public     | users_history                 | snapshot                             | jsonb                           |
| composite | public     | users_history                 | user_id                              | bigint                          |
| composite | public     | users_history                 | version_no                           | integer                         |
| composite | public     | users_with_uuid               | address                              | text                            |
| composite | public     | users_with_uuid               | birthdate                            | date                            |
| composite | public     | users_with_uuid               | contact_number                       | character varying(20)           |
| composite | public     | users_with_uuid               | created_by                           | bigint                          |
| composite | public     | users_with_uuid               | date_registered                      | timestamp without time zone     |
| composite | public     | users_with_uuid               | email                                | character varying(100)          |
| composite | public     | users_with_uuid               | employee_id                          | character varying(50)           |
| composite | public     | users_with_uuid               | firstname                            | character varying(100)          |
| composite | public     | users_with_uuid               | hs_type                              | text                            |
| composite | public     | users_with_uuid               | is_deleted                           | boolean                         |
| composite | public     | users_with_uuid               | last_login                           | timestamp without time zone     |
| composite | public     | users_with_uuid               | middlename                           | character varying(100)          |
| composite | public     | users_with_uuid               | professional_license_no              | character varying(50)           |
| composite | public     | users_with_uuid               | role                                 | character varying(20)           |
| composite | public     | users_with_uuid               | sex                                  | character varying(10)           |
| composite | public     | users_with_uuid               | supabase_uuid                        | uuid                            |
| composite | public     | users_with_uuid               | surname                              | character varying(100)          |
| composite | public     | users_with_uuid               | updated_by                           | bigint                          |
| composite | public     | users_with_uuid               | user_id                              | bigint                          |
| composite | public     | users_with_uuid               | username                             | character varying(50)           |
| composite | public     | v_dob                         | date_of_birth                        | date                            |
| composite | public     | vaccine_report_view           | after_24h_female                     | bigint                          |
| composite | public     | vaccine_report_view           | after_24h_male                       | bigint                          |
| composite | public     | vaccine_report_view           | after_24h_total                      | bigint                          |
| composite | public     | vaccine_report_view           | antigen_name                         | character varying(100)          |
| composite | public     | vaccine_report_view           | dose_number                          | integer                         |
| composite | public     | vaccine_report_view           | within_24h_female                    | bigint                          |
| composite | public     | vaccine_report_view           | within_24h_male                      | bigint                          |
| composite | public     | vaccine_report_view           | within_24h_total                     | bigint                          |
| composite | public     | vaccinemaster                 | antigen_name                         | character varying(100)          |
| composite | public     | vaccinemaster                 | brand_name                           | character varying(100)          |
| composite | public     | vaccinemaster                 | category                             | vaccine_category                |
| composite | public     | vaccinemaster                 | created_at                           | timestamp with time zone        |
| composite | public     | vaccinemaster                 | created_by                           | bigint                          |
| composite | public     | vaccinemaster                 | deleted_at                           | timestamp without time zone     |
| composite | public     | vaccinemaster                 | deleted_by                           | bigint                          |
| composite | public     | vaccinemaster                 | disease_prevented                    | text                            |
| composite | public     | vaccinemaster                 | is_deleted                           | boolean                         |
| composite | public     | vaccinemaster                 | is_nip                               | boolean                         |
| composite | public     | vaccinemaster                 | manufacturer                         | character varying(100)          |
| composite | public     | vaccinemaster                 | updated_at                           | timestamp with time zone        |
| composite | public     | vaccinemaster                 | updated_by                           | bigint                          |
| composite | public     | vaccinemaster                 | vaccine_id                           | bigint                          |
| composite | public     | vaccinemaster                 | vaccine_type                         | character varying(20)           |
| composite | public     | visits                        | created_at                           | timestamp with time zone        |
| composite | public     | visits                        | created_by                           | bigint                          |
| composite | public     | visits                        | deleted_at                           | timestamp without time zone     |
| composite | public     | visits                        | deleted_by                           | bigint                          |
| composite | public     | visits                        | findings                             | text                            |
| composite | public     | visits                        | is_deleted                           | boolean                         |
| composite | public     | visits                        | patient_id                           | bigint                          |
| composite | public     | visits                        | recorded_by                          | bigint                          |
| composite | public     | visits                        | service_rendered                     | text                            |
| composite | public     | visits                        | updated_at                           | timestamp with time zone        |
| composite | public     | visits                        | updated_by                           | bigint                          |
| composite | public     | visits                        | visit_date                           | date                            |
| composite | public     | visits                        | visit_id                             | bigint                          |
| composite | public     | visits_history                | changed_at                           | timestamp with time zone        |
| composite | public     | visits_history                | changed_by                           | bigint                          |
| composite | public     | visits_history                | changed_fields                       | jsonb                           |
| composite | public     | visits_history                | history_id                           | bigint                          |
| composite | public     | visits_history                | snapshot                             | jsonb                           |
| composite | public     | visits_history                | version_no                           | integer                         |
| composite | public     | visits_history                | visit_id                             | bigint                          |
| composite | public     | visits_view                   | deworming_given                      | boolean                         |
| composite | public     | visits_view                   | findings                             | text                            |
| composite | public     | visits_view                   | immunizations_given                  | json                            |
| composite | public     | visits_view                   | patient_id                           | bigint                          |
| composite | public     | visits_view                   | patient_name                         | text                            |
| composite | public     | visits_view                   | recorded_by                          | text                            |
| composite | public     | visits_view                   | service_rendered                     | text                            |
| composite | public     | visits_view                   | visit_date                           | date                            |
| composite | public     | visits_view                   | visit_id                             | bigint                          |
| composite | public     | visits_view                   | vital_signs                          | json                            |
| composite | public     | visits_view                   | vitamina_given                       | boolean                         |
| composite | public     | vitalsigns                    | created_at                           | timestamp with time zone        |
| composite | public     | vitalsigns                    | created_by                           | bigint                          |
| composite | public     | vitalsigns                    | deleted_at                           | timestamp without time zone     |
| composite | public     | vitalsigns                    | deleted_by                           | bigint                          |
| composite | public     | vitalsigns                    | height_length                        | numeric(5,2)                    |
| composite | public     | vitalsigns                    | is_deleted                           | boolean                         |
| composite | public     | vitalsigns                    | muac                                 | numeric(4,1)                    |
| composite | public     | vitalsigns                    | respiration_rate                     | integer                         |
| composite | public     | vitalsigns                    | temperature                          | numeric(4,1)                    |
| composite | public     | vitalsigns                    | updated_at                           | timestamp with time zone        |
| composite | public     | vitalsigns                    | updated_by                           | bigint                          |
| composite | public     | vitalsigns                    | visit_id                             | bigint                          |
| composite | public     | vitalsigns                    | vital_id                             | bigint                          |
| composite | public     | vitalsigns                    | weight                               | numeric(5,2)                    |
| composite | public     | vitamina                      | administered_by                      | bigint                          |
| composite | public     | vitamina                      | age_at_administration                | integer                         |
| composite | public     | vitamina                      | created_at                           | timestamp with time zone        |
| composite | public     | vitamina                      | created_by                           | bigint                          |
| composite | public     | vitamina                      | deleted_at                           | timestamp without time zone     |
| composite | public     | vitamina                      | deleted_by                           | bigint                          |
| composite | public     | vitamina                      | facility_name                        | text                            |
| composite | public     | vitamina                      | inventory_id                         | bigint                          |
| composite | public     | vitamina                      | is_deleted                           | boolean                         |
| composite | public     | vitamina                      | outside                              | boolean                         |
| composite | public     | vitamina                      | patient_id                           | bigint                          |
| composite | public     | vitamina                      | remarks                              | text                            |
| composite | public     | vitamina                      | updated_at                           | timestamp with time zone        |
| composite | public     | vitamina                      | updated_by                           | bigint                          |
| composite | public     | vitamina                      | vaccine_id                           | bigint                          |
| composite | public     | vitamina                      | visit_id                             | bigint                          |
| composite | public     | vitamina                      | vital_id                             | bigint                          |
| composite | public     | vitamina                      | vitamina_id                          | bigint                          |
| composite | public     | vitamina_history              | changed_at                           | timestamp with time zone        |
| composite | public     | vitamina_history              | changed_by                           | bigint                          |
| composite | public     | vitamina_history              | changed_fields                       | jsonb                           |
| composite | public     | vitamina_history              | history_id                           | bigint                          |
| composite | public     | vitamina_history              | snapshot                             | jsonb                           |
| composite | public     | vitamina_history              | version_no                           | integer                         |
| composite | public     | vitamina_history              | vitamina_id                          | bigint                          |
| composite | public     | worker_progress_view          | deworming_administered               | bigint                          |
| composite | public     | worker_progress_view          | firstname                            | character varying(100)          |
| composite | public     | worker_progress_view          | role                                 | character varying(20)           |
| composite | public     | worker_progress_view          | surname                              | character varying(100)          |
| composite | public     | worker_progress_view          | user_id                              | bigint                          |
| composite | public     | worker_progress_view          | vaccines_administered                | bigint                          |
| composite | public     | worker_progress_view          | vitamina_administered                | bigint                          |
| composite | realtime   | messages                      | event                                | text                            |
| composite | realtime   | messages                      | extension                            | text                            |
| composite | realtime   | messages                      | id                                   | uuid                            |
| composite | realtime   | messages                      | inserted_at                          | timestamp without time zone     |
| composite | realtime   | messages                      | payload                              | jsonb                           |
| composite | realtime   | messages                      | private                              | boolean                         |
| composite | realtime   | messages                      | topic                                | text                            |
| composite | realtime   | messages                      | updated_at                           | timestamp without time zone     |
| composite | realtime   | schema_migrations             | inserted_at                          | timestamp(0) without time zone  |
| composite | realtime   | schema_migrations             | version                              | bigint                          |
| composite | realtime   | subscription                  | claims                               | jsonb                           |
| composite | realtime   | subscription                  | claims_role                          | regrole                         |
| composite | realtime   | subscription                  | created_at                           | timestamp without time zone     |
| composite | realtime   | subscription                  | entity                               | regclass                        |
| composite | realtime   | subscription                  | filters                              | realtime.user_defined_filter[]  |
| composite | realtime   | subscription                  | id                                   | bigint                          |
| composite | realtime   | subscription                  | subscription_id                      | uuid                            |
| composite | realtime   | user_defined_filter           | column_name                          | text                            |
| composite | realtime   | user_defined_filter           | op                                   | realtime.equality_op            |
| composite | realtime   | user_defined_filter           | value                                | text                            |
| composite | realtime   | wal_column                    | is_pkey                              | boolean                         |
| composite | realtime   | wal_column                    | is_selectable                        | boolean                         |
| composite | realtime   | wal_column                    | name                                 | text                            |
| composite | realtime   | wal_column                    | type_name                            | text                            |
| composite | realtime   | wal_column                    | type_oid                             | oid                             |
| composite | realtime   | wal_column                    | value                                | jsonb                           |
| composite | realtime   | wal_rls                       | errors                               | text[]                          |
| composite | realtime   | wal_rls                       | is_rls_enabled                       | boolean                         |
| composite | realtime   | wal_rls                       | subscription_ids                     | uuid[]                          |
| composite | realtime   | wal_rls                       | wal                                  | jsonb                           |
| composite | storage    | buckets                       | allowed_mime_types                   | text[]                          |
| composite | storage    | buckets                       | avif_autodetection                   | boolean                         |
| composite | storage    | buckets                       | created_at                           | timestamp with time zone        |
| composite | storage    | buckets                       | file_size_limit                      | bigint                          |
| composite | storage    | buckets                       | id                                   | text                            |
| composite | storage    | buckets                       | name                                 | text                            |
| composite | storage    | buckets                       | owner                                | uuid                            |
| composite | storage    | buckets                       | owner_id                             | text                            |
| composite | storage    | buckets                       | public                               | boolean                         |
| composite | storage    | buckets                       | type                                 | storage.buckettype              |
| composite | storage    | buckets                       | updated_at                           | timestamp with time zone        |
| composite | storage    | buckets_analytics             | created_at                           | timestamp with time zone        |
| composite | storage    | buckets_analytics             | format                               | text                            |
| composite | storage    | buckets_analytics             | id                                   | text                            |
| composite | storage    | buckets_analytics             | type                                 | storage.buckettype              |
| composite | storage    | buckets_analytics             | updated_at                           | timestamp with time zone        |
| composite | storage    | migrations                    | executed_at                          | timestamp without time zone     |
| composite | storage    | migrations                    | hash                                 | character varying(40)           |
| composite | storage    | migrations                    | id                                   | integer                         |
| composite | storage    | migrations                    | name                                 | character varying(100)          |
| composite | storage    | objects                       | bucket_id                            | text                            |
| composite | storage    | objects                       | created_at                           | timestamp with time zone        |
| composite | storage    | objects                       | id                                   | uuid                            |
| composite | storage    | objects                       | last_accessed_at                     | timestamp with time zone        |
| composite | storage    | objects                       | level                                | integer                         |
| composite | storage    | objects                       | metadata                             | jsonb                           |
| composite | storage    | objects                       | name                                 | text                            |
| composite | storage    | objects                       | owner                                | uuid                            |
| composite | storage    | objects                       | owner_id                             | text                            |
| composite | storage    | objects                       | path_tokens                          | text[]                          |
| composite | storage    | objects                       | updated_at                           | timestamp with time zone        |
| composite | storage    | objects                       | user_metadata                        | jsonb                           |
| composite | storage    | objects                       | version                              | text                            |
| composite | storage    | prefixes                      | bucket_id                            | text                            |
| composite | storage    | prefixes                      | created_at                           | timestamp with time zone        |
| composite | storage    | prefixes                      | level                                | integer                         |
| composite | storage    | prefixes                      | name                                 | text                            |
| composite | storage    | prefixes                      | updated_at                           | timestamp with time zone        |
| composite | storage    | s3_multipart_uploads          | bucket_id                            | text                            |
| composite | storage    | s3_multipart_uploads          | created_at                           | timestamp with time zone        |
| composite | storage    | s3_multipart_uploads          | id                                   | text                            |
| composite | storage    | s3_multipart_uploads          | in_progress_size                     | bigint                          |
| composite | storage    | s3_multipart_uploads          | key                                  | text                            |
| composite | storage    | s3_multipart_uploads          | owner_id                             | text                            |
| composite | storage    | s3_multipart_uploads          | upload_signature                     | text                            |
| composite | storage    | s3_multipart_uploads          | user_metadata                        | jsonb                           |
| composite | storage    | s3_multipart_uploads          | version                              | text                            |
| composite | storage    | s3_multipart_uploads_parts    | bucket_id                            | text                            |
| composite | storage    | s3_multipart_uploads_parts    | created_at                           | timestamp with time zone        |
| composite | storage    | s3_multipart_uploads_parts    | etag                                 | text                            |
| composite | storage    | s3_multipart_uploads_parts    | id                                   | uuid                            |
| composite | storage    | s3_multipart_uploads_parts    | key                                  | text                            |
| composite | storage    | s3_multipart_uploads_parts    | owner_id                             | text                            |
| composite | storage    | s3_multipart_uploads_parts    | part_number                          | integer                         |
| composite | storage    | s3_multipart_uploads_parts    | size                                 | bigint                          |
| composite | storage    | s3_multipart_uploads_parts    | upload_id                            | text                            |
| composite | storage    | s3_multipart_uploads_parts    | version                              | text                            |
| composite | vault      | decrypted_secrets             | created_at                           | timestamp with time zone        |
| composite | vault      | decrypted_secrets             | decrypted_secret                     | text                            |
| composite | vault      | decrypted_secrets             | description                          | text                            |
| composite | vault      | decrypted_secrets             | id                                   | uuid                            |
| composite | vault      | decrypted_secrets             | key_id                               | uuid                            |
| composite | vault      | decrypted_secrets             | name                                 | text                            |
| composite | vault      | decrypted_secrets             | nonce                                | bytea                           |
| composite | vault      | decrypted_secrets             | secret                               | text                            |
| composite | vault      | decrypted_secrets             | updated_at                           | timestamp with time zone        |
| composite | vault      | secrets                       | created_at                           | timestamp with time zone        |
| composite | vault      | secrets                       | description                          | text                            |
| composite | vault      | secrets                       | id                                   | uuid                            |
| composite | vault      | secrets                       | key_id                               | uuid                            |
| composite | vault      | secrets                       | name                                 | text                            |
| composite | vault      | secrets                       | nonce                                | bytea                           |
| composite | vault      | secrets                       | secret                               | text                            |
| composite | vault      | secrets                       | updated_at                           | timestamp with time zone        |
| domain    | public     | email_simple                  | text                                 |                                 |
| domain    | public     | phone_11                      | text                                 |                                 |
| enum      | auth       | aal_level                     | aal1                                 | 1                               |
| enum      | auth       | aal_level                     | aal2                                 | 2                               |
| enum      | auth       | aal_level                     | aal3                                 | 3                               |
| enum      | auth       | code_challenge_method         | plain                                | 2                               |
| enum      | auth       | code_challenge_method         | s256                                 | 1                               |
| enum      | auth       | factor_status                 | unverified                           | 1                               |
| enum      | auth       | factor_status                 | verified                             | 2                               |
| enum      | auth       | factor_type                   | phone                                | 3                               |
| enum      | auth       | factor_type                   | totp                                 | 1                               |
| enum      | auth       | factor_type                   | webauthn                             | 2                               |
| enum      | auth       | oauth_authorization_status    | approved                             | 2                               |
| enum      | auth       | oauth_authorization_status    | denied                               | 3                               |
| enum      | auth       | oauth_authorization_status    | expired                              | 4                               |
| enum      | auth       | oauth_authorization_status    | pending                              | 1                               |
| enum      | auth       | oauth_client_type             | confidential                         | 2                               |
| enum      | auth       | oauth_client_type             | public                               | 1                               |
| enum      | auth       | oauth_registration_type       | dynamic                              | 1                               |
| enum      | auth       | oauth_registration_type       | manual                               | 2                               |
| enum      | auth       | oauth_response_type           | code                                 | 1                               |
| enum      | auth       | one_time_token_type           | confirmation_token                   | 1                               |
| enum      | auth       | one_time_token_type           | email_change_token_current           | 5                               |
| enum      | auth       | one_time_token_type           | email_change_token_new               | 4                               |
| enum      | auth       | one_time_token_type           | phone_change_token                   | 6                               |
| enum      | auth       | one_time_token_type           | reauthentication_token               | 2                               |
| enum      | auth       | one_time_token_type           | recovery_token                       | 3                               |
| enum      | public     | action_type_enum              | AUTO_SCHEDULE_GENERATED              | 31                              |
| enum      | public     | action_type_enum              | DEFAULTER_TAG_ASSIGNED               | 32                              |
| enum      | public     | action_type_enum              | DEFAULTER_TAG_REMOVED                | 33                              |
| enum      | public     | action_type_enum              | DEWORMING_ADMINISTERED               | 19                              |
| enum      | public     | action_type_enum              | INVENTORY_AUTO_DECREMENT             | 26                              |
| enum      | public     | action_type_enum              | INVENTORY_REQUEST_APPROVED           | 21                              |
| enum      | public     | action_type_enum              | INVENTORY_REQUEST_CREATED            | 20                              |
| enum      | public     | action_type_enum              | INVENTORY_REQUEST_PRINTED            | 23                              |
| enum      | public     | action_type_enum              | INVENTORY_REQUEST_REJECTED           | 22                              |
| enum      | public     | action_type_enum              | INVENTORY_STOCK_UPDATED              | 24                              |
| enum      | public     | action_type_enum              | INVENTORY_TRANSACTION_CREATED        | 25                              |
| enum      | public     | action_type_enum              | LOGIN                                | 1                               |
| enum      | public     | action_type_enum              | LOGOUT                               | 2                               |
| enum      | public     | action_type_enum              | MESSAGE_SENT_SYSTEM                  | 28                              |
| enum      | public     | action_type_enum              | MESSAGE_SENT_USER                    | 27                              |
| enum      | public     | action_type_enum              | NOTIFICATION_FAILED                  | 30                              |
| enum      | public     | action_type_enum              | NOTIFICATION_SENT                    | 29                              |
| enum      | public     | action_type_enum              | PATIENT_CREATED                      | 9                               |
| enum      | public     | action_type_enum              | PATIENT_DELETED                      | 11                              |
| enum      | public     | action_type_enum              | PATIENT_RESTORED                     | 12                              |
| enum      | public     | action_type_enum              | PATIENT_UPDATED                      | 10                              |
| enum      | public     | action_type_enum              | PATIENT_VIEWED                       | 13                              |
| enum      | public     | action_type_enum              | ROLE_CHANGED                         | 8                               |
| enum      | public     | action_type_enum              | SCHEDULE_ADJUSTED_USER               | 15                              |
| enum      | public     | action_type_enum              | SCHEDULE_GENERATED_SYSTEM            | 14                              |
| enum      | public     | action_type_enum              | SCHEDULE_STATUS_CHANGED              | 16                              |
| enum      | public     | action_type_enum              | USER_CREATED                         | 3                               |
| enum      | public     | action_type_enum              | USER_DELETED                         | 6                               |
| enum      | public     | action_type_enum              | USER_RESTORED                        | 7                               |
| enum      | public     | action_type_enum              | USER_STATUS_CHANGED                  | 5                               |
| enum      | public     | action_type_enum              | USER_UPDATED                         | 4                               |
| enum      | public     | action_type_enum              | VACCINE_ADMINISTERED                 | 17                              |
| enum      | public     | action_type_enum              | VITAMIN_ADMINISTERED                 | 18                              |
| enum      | public     | inventory_request_status_enum | APPROVED                             | 2                               |
| enum      | public     | inventory_request_status_enum | CANCELLED                            | 4                               |
| enum      | public     | inventory_request_status_enum | PENDING                              | 1                               |
| enum      | public     | inventory_request_status_enum | REJECTED                             | 3                               |
| enum      | public     | message_type_enum             | chat                                 | 5                               |
| enum      | public     | message_type_enum             | file                                 | 3                               |
| enum      | public     | message_type_enum             | image                                | 2                               |
| enum      | public     | message_type_enum             | system                               | 4                               |
| enum      | public     | message_type_enum             | text                                 | 1                               |
| enum      | public     | notification_status_enum      | cancelled                            | 4                               |
| enum      | public     | notification_status_enum      | failed                               | 3                               |
| enum      | public     | notification_status_enum      | pending                              | 1                               |
| enum      | public     | notification_status_enum      | sent                                 | 2                               |
| enum      | public     | request_status_enum           | approved                             | 2                               |
| enum      | public     | request_status_enum           | cancelled                            | 4                               |
| enum      | public     | request_status_enum           | pending                              | 1                               |
| enum      | public     | request_status_enum           | rejected                             | 3                               |
| enum      | public     | schedule_status_enum          | Cancelled                            | 6                               |
| enum      | public     | schedule_status_enum          | Completed                            | 3                               |
| enum      | public     | schedule_status_enum          | Due                                  | 2                               |
| enum      | public     | schedule_status_enum          | Missed                               | 8                               |
| enum      | public     | schedule_status_enum          | Overdue                              | 4                               |
| enum      | public     | schedule_status_enum          | Pending                              | 7                               |
| enum      | public     | schedule_status_enum          | Rescheduled                          | 9                               |
| enum      | public     | schedule_status_enum          | Scheduled                            | 1                               |
| enum      | public     | schedule_status_enum          | Skipped                              | 5                               |
| enum      | public     | transaction_type_enum         | ADJUST                               | 3                               |
| enum      | public     | transaction_type_enum         | EXPIRED                              | 5                               |
| enum      | public     | transaction_type_enum         | ISSUE                                | 2                               |
| enum      | public     | transaction_type_enum         | RECEIVE                              | 1                               |
| enum      | public     | transaction_type_enum         | RETURN                               | 4                               |
| enum      | public     | user_status_enum              | active                               | 1                               |
| enum      | public     | user_status_enum              | archived                             | 5                               |
| enum      | public     | user_status_enum              | inactive                             | 2                               |
| enum      | public     | user_status_enum              | locked                               | 3                               |
| enum      | public     | user_status_enum              | pending                              | 4                               |
| enum      | public     | vaccine_category              | DEWORMING                            | 2                               |
| enum      | public     | vaccine_category              | VACCINE                              | 1                               |
| enum      | public     | vaccine_category              | VITAMIN_A                            | 3                               |
| enum      | realtime   | action                        | DELETE                               | 3                               |
| enum      | realtime   | action                        | ERROR                                | 5                               |
| enum      | realtime   | action                        | INSERT                               | 1                               |
| enum      | realtime   | action                        | TRUNCATE                             | 4                               |
| enum      | realtime   | action                        | UPDATE                               | 2                               |
| enum      | realtime   | equality_op                   | eq                                   | 1                               |
| enum      | realtime   | equality_op                   | gt                                   | 5                               |
| enum      | realtime   | equality_op                   | gte                                  | 6                               |
| enum      | realtime   | equality_op                   | in                                   | 7                               |
| enum      | realtime   | equality_op                   | lt                                   | 3                               |
| enum      | realtime   | equality_op                   | lte                                  | 4                               |
| enum      | realtime   | equality_op                   | neq                                  | 2                               |
| enum      | storage    | buckettype                    | ANALYTICS                            | 2                               |
| enum      | storage    | buckettype                    | STANDARD                             | 1                               |