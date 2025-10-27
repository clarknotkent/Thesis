-- Sequences not owned by any table column
SELECT n.nspname AS schema, c.relname AS sequence_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'S'
  AND n.nspname NOT IN ('pg_catalog','information_schema')
  AND n.nspname = 'public' -- Limit to public schema only
  AND NOT EXISTS (
    SELECT 1
    FROM pg_depend d
    WHERE d.objid = c.oid AND d.deptype = 'a' -- auto dependency from OWNED BY
  )
ORDER BY schema, sequence_name;

| schema | sequence_name                   |
| ------ | ------------------------------- |
| public | activitylogs_log_id_seq         |
| public | faqs_faq_id_seq                 |
| public | message_receipts_receipt_id_seq |