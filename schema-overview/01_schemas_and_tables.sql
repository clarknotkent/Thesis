-- List schemas and tables (incl. type, owner, estimates, and sizes)
WITH rels AS (
  SELECT
    n.nspname AS schema,
    c.relname AS name,
    c.relkind,
    c.relpersistence,
    pg_catalog.pg_get_userbyid(c.relowner) AS owner,
    COALESCE(s.n_live_tup, 0) AS est_rows,
    pg_total_relation_size(c.oid) AS total_bytes,
    pg_relation_size(c.oid) AS table_bytes,
    pg_indexes_size(c.oid) AS index_bytes,
    pg_total_relation_size(c.oid) - pg_relation_size(c.oid) - pg_indexes_size(c.oid) AS toast_bytes
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
  WHERE n.nspname NOT IN ('pg_catalog','information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'
    AND n.nspname NOT LIKE 'pg_temp%'
    AND c.relkind IN ('r','p','v','m','f') -- table, partitioned table, view, matview, foreign table
)
SELECT
  schema,
  name,
  CASE relkind
    WHEN 'r' THEN 'table'
    WHEN 'p' THEN 'partitioned table'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized view'
    WHEN 'f' THEN 'foreign table'
  END AS object_type,
  owner,
  est_rows,
  pg_size_pretty(total_bytes) AS total_size,
  pg_size_pretty(table_bytes) AS table_size,
  pg_size_pretty(index_bytes) AS index_size,
  pg_size_pretty(TOAST_bytes) AS toast_size,
  relpersistence AS persistence
FROM rels
ORDER BY schema, object_type, name;

| schema     | name                          | object_type       | owner                   | est_rows | total_size | table_size | index_size | toast_size | persistence |
| ---------- | ----------------------------- | ----------------- | ----------------------- | -------- | ---------- | ---------- | ---------- | ---------- | ----------- |
| auth       | audit_log_entries             | table             | supabase_auth_admin     | 593      | 304 kB     | 216 kB     | 56 kB      | 32 kB      | p           |
| auth       | flow_state                    | table             | supabase_auth_admin     | 0        | 40 kB      | 0 bytes    | 32 kB      | 8192 bytes | p           |
| auth       | identities                    | table             | supabase_auth_admin     | 17       | 112 kB     | 8192 bytes | 64 kB      | 40 kB      | p           |
| auth       | instances                     | table             | supabase_auth_admin     | 0        | 16 kB      | 0 bytes    | 8192 bytes | 8192 bytes | p           |
| auth       | mfa_amr_claims                | table             | supabase_auth_admin     | 369      | 152 kB     | 40 kB      | 80 kB      | 32 kB      | p           |
| auth       | mfa_challenges                | table             | supabase_auth_admin     | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| auth       | mfa_factors                   | table             | supabase_auth_admin     | 0        | 56 kB      | 0 bytes    | 48 kB      | 8192 bytes | p           |
| auth       | oauth_authorizations          | table             | supabase_auth_admin     | 0        | 40 kB      | 0 bytes    | 32 kB      | 8192 bytes | p           |
| auth       | oauth_clients                 | table             | supabase_auth_admin     | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| auth       | oauth_consents                | table             | supabase_auth_admin     | 0        | 48 kB      | 0 bytes    | 40 kB      | 8192 bytes | p           |
| auth       | one_time_tokens               | table             | supabase_auth_admin     | 0        | 88 kB      | 0 bytes    | 80 kB      | 8192 bytes | p           |
| auth       | refresh_tokens                | table             | supabase_auth_admin     | 369      | 248 kB     | 56 kB      | 160 kB     | 32 kB      | p           |
| auth       | saml_providers                | table             | supabase_auth_admin     | 0        | 32 kB      | 0 bytes    | 24 kB      | 8192 bytes | p           |
| auth       | saml_relay_states             | table             | supabase_auth_admin     | 0        | 40 kB      | 0 bytes    | 32 kB      | 8192 bytes | p           |
| auth       | schema_migrations             | table             | supabase_auth_admin     | 67       | 24 kB      | 8192 bytes | 16 kB      | 0 bytes    | p           |
| auth       | sessions                      | table             | supabase_auth_admin     | 369      | 200 kB     | 40 kB      | 128 kB     | 32 kB      | p           |
| auth       | sso_domains                   | table             | supabase_auth_admin     | 0        | 32 kB      | 0 bytes    | 24 kB      | 8192 bytes | p           |
| auth       | sso_providers                 | table             | supabase_auth_admin     | 0        | 32 kB      | 0 bytes    | 24 kB      | 8192 bytes | p           |
| auth       | users                         | table             | supabase_auth_admin     | 17       | 184 kB     | 8192 bytes | 136 kB     | 40 kB      | p           |
| cron       | job                           | table             | supabase_admin          | 3        | 48 kB      | 8192 bytes | 32 kB      | 8192 bytes | p           |
| cron       | job_run_details               | table             | supabase_admin          | 0        | 64 kB      | 16 kB      | 16 kB      | 32 kB      | p           |
| extensions | pg_stat_statements            | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| extensions | pg_stat_statements_info       | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | defaulters_mv                 | materialized view | postgres                | 0        | 8192 bytes | 0 bytes    | 8192 bytes | 0 bytes    | p           |
| public     | activity_action_types         | table             | postgres                | 51       | 32 kB      | 8192 bytes | 16 kB      | 8192 bytes | p           |
| public     | activitylogs                  | table             | postgres                | 704      | 320 kB     | 152 kB     | 136 kB     | 32 kB      | p           |
| public     | birthhistory                  | table             | postgres                | 9        | 48 kB      | 8192 bytes | 32 kB      | 8192 bytes | p           |
| public     | conversationparticipants      | table             | postgres                | 19       | 72 kB      | 8192 bytes | 32 kB      | 32 kB      | p           |
| public     | conversations                 | table             | postgres                | 9        | 24 kB      | 8192 bytes | 16 kB      | 0 bytes    | p           |
| public     | deworming                     | table             | postgres                | 0        | 64 kB      | 0 bytes    | 56 kB      | 8192 bytes | p           |
| public     | deworming_history             | table             | postgres                | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| public     | faqs                          | table             | postgres                | 2        | 32 kB      | 8192 bytes | 16 kB      | 8192 bytes | p           |
| public     | guardians                     | table             | postgres                | 7        | 64 kB      | 8192 bytes | 48 kB      | 8192 bytes | p           |
| public     | health_staff_types            | table             | postgres                | 3        | 32 kB      | 8192 bytes | 16 kB      | 8192 bytes | p           |
| public     | immunizations                 | table             | postgres                | 44       | 192 kB     | 16 kB      | 144 kB     | 32 kB      | p           |
| public     | immunizations_history         | table             | postgres                | 0        | 40 kB      | 0 bytes    | 32 kB      | 8192 bytes | p           |
| public     | inventory                     | table             | postgres                | 17       | 96 kB      | 8192 bytes | 80 kB      | 8192 bytes | p           |
| public     | inventory_history             | table             | postgres                | 63       | 120 kB     | 56 kB      | 32 kB      | 32 kB      | p           |
| public     | inventory_requests            | table             | postgres                | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| public     | inventory_requests_history    | table             | postgres                | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| public     | inventorytransactions         | table             | postgres                | 31       | 32 kB      | 8192 bytes | 16 kB      | 8192 bytes | p           |
| public     | inventorytransactions_history | table             | postgres                | 31       | 88 kB      | 24 kB      | 32 kB      | 32 kB      | p           |
| public     | message_receipts              | table             | postgres                | 38       | 56 kB      | 8192 bytes | 48 kB      | 0 bytes    | p           |
| public     | messages                      | table             | postgres                | 32       | 144 kB     | 8192 bytes | 128 kB     | 8192 bytes | p           |
| public     | notifications                 | table             | postgres                | 21       | 192 kB     | 8192 bytes | 176 kB     | 8192 bytes | p           |
| public     | patients                      | table             | postgres                | 9        | 200 kB     | 32 kB      | 128 kB     | 40 kB      | p           |
| public     | patients_history              | table             | postgres                | 122      | 344 kB     | 200 kB     | 112 kB     | 32 kB      | p           |
| public     | patientschedule               | table             | postgres                | 135      | 200 kB     | 24 kB      | 144 kB     | 32 kB      | p           |
| public     | patientschedule_history       | table             | postgres                | 367      | 520 kB     | 336 kB     | 152 kB     | 32 kB      | p           |
| public     | receiving_report_items        | table             | postgres                | 19       | 80 kB      | 8192 bytes | 64 kB      | 8192 bytes | p           |
| public     | receiving_reports             | table             | postgres                | 9        | 96 kB      | 8192 bytes | 80 kB      | 8192 bytes | p           |
| public     | schedule_doses                | table             | postgres                | 15       | 80 kB      | 8192 bytes | 64 kB      | 8192 bytes | p           |
| public     | schedule_master               | table             | postgres                | 7        | 80 kB      | 8192 bytes | 64 kB      | 8192 bytes | p           |
| public     | timestamp_normalization_audit | table             | postgres                | 0        | 16 kB      | 0 bytes    | 8192 bytes | 8192 bytes | p           |
| public     | user_mapping                  | table             | postgres                | 17       | 72 kB      | 8192 bytes | 32 kB      | 32 kB      | p           |
| public     | user_sessions                 | table             | postgres                | 1        | 72 kB      | 8192 bytes | 32 kB      | 32 kB      | p           |
| public     | users                         | table             | postgres                | 17       | 288 kB     | 16 kB      | 232 kB     | 40 kB      | p           |
| public     | users_history                 | table             | postgres                | 189      | 368 kB     | 200 kB     | 136 kB     | 32 kB      | p           |
| public     | v_dob                         | table             | postgres                | 1        | 8192 bytes | 8192 bytes | 0 bytes    | 0 bytes    | p           |
| public     | vaccinemaster                 | table             | postgres                | 12       | 80 kB      | 8192 bytes | 64 kB      | 8192 bytes | p           |
| public     | visits                        | table             | postgres                | 10       | 80 kB      | 16 kB      | 32 kB      | 32 kB      | p           |
| public     | visits_history                | table             | postgres                | 23       | 88 kB      | 24 kB      | 32 kB      | 32 kB      | p           |
| public     | vitalsigns                    | table             | postgres                | 10       | 40 kB      | 8192 bytes | 32 kB      | 0 bytes    | p           |
| public     | vitamina                      | table             | postgres                | 0        | 64 kB      | 0 bytes    | 56 kB      | 8192 bytes | p           |
| public     | vitamina_history              | table             | postgres                | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| public     | activitylogs_view             | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | conversations_view            | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | dashboard_view                | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | defaulters_view               | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | duesoon_view                  | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | immunizationhistory_view      | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | inventorylowstock_view        | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | monthlyreports_view           | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | notifications_view            | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | patients_view                 | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | patientschedule_view          | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | tcl_view                      | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | users_with_uuid               | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | vaccine_report_view           | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | visits_view                   | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| public     | worker_progress_view          | view              | postgres                | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| realtime   | messages                      | partitioned table | supabase_realtime_admin | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |
| realtime   | schema_migrations             | table             | supabase_admin          | 64       | 24 kB      | 8192 bytes | 16 kB      | 0 bytes    | p           |
| realtime   | subscription                  | table             | supabase_admin          | 0        | 32 kB      | 0 bytes    | 24 kB      | 8192 bytes | p           |
| storage    | buckets                       | table             | supabase_storage_admin  | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| storage    | buckets_analytics             | table             | supabase_storage_admin  | 0        | 16 kB      | 0 bytes    | 8192 bytes | 8192 bytes | p           |
| storage    | migrations                    | table             | supabase_storage_admin  | 44       | 40 kB      | 8192 bytes | 32 kB      | 0 bytes    | p           |
| storage    | objects                       | table             | supabase_storage_admin  | 0        | 64 kB      | 0 bytes    | 56 kB      | 8192 bytes | p           |
| storage    | prefixes                      | table             | supabase_storage_admin  | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| storage    | s3_multipart_uploads          | table             | supabase_storage_admin  | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| storage    | s3_multipart_uploads_parts    | table             | supabase_storage_admin  | 0        | 16 kB      | 0 bytes    | 8192 bytes | 8192 bytes | p           |
| vault      | secrets                       | table             | supabase_admin          | 0        | 24 kB      | 0 bytes    | 16 kB      | 8192 bytes | p           |
| vault      | decrypted_secrets             | view              | supabase_admin          | 0        | 0 bytes    | 0 bytes    | 0 bytes    | 0 bytes    | p           |