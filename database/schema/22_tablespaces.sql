-- Tablespaces and sizes
SELECT
  spcname AS tablespace,
  pg_size_pretty(pg_tablespace_size(oid)) AS size,
  spcoptions
FROM pg_tablespace
ORDER BY tablespace;

| tablespace | size   | spcoptions |
| ---------- | ------ | ---------- |
| pg_default | 48 MB  | null       |
| pg_global  | 853 kB | null       |