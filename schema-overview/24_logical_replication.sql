-- Publications
SELECT pubname, puballtables, pubinsert, pubupdate, pubdelete, pubtruncate
FROM pg_publication
ORDER BY pubname;

| pubname           | puballtables | pubinsert | pubupdate | pubdelete | pubtruncate |
| ----------------- | ------------ | --------- | --------- | --------- | ----------- |
| supabase_realtime | false        | true      | true      | true      | true        |


-- Publication tables
SELECT p.pubname, n.nspname AS schemaname, c.relname AS tablename
FROM pg_publication p
JOIN pg_publication_rel pr ON pr.prpubid = p.oid
JOIN pg_class c ON c.oid = pr.prrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
ORDER BY p.pubname, schemaname, tablename;

Success. No rows returned


-- Subscriptions (requires superuser or appropriate privilege)
SELECT subname, subenabled, subslotname, subpublications, subconninfo
FROM pg_subscription
ORDER BY subname;

Success. No rows returned