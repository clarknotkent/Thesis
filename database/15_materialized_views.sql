-- Materialized views with definitions and sizes
SELECT
  n.nspname AS schema,
  c.relname AS matview_name,
  pg_get_viewdef(c.oid, true) AS definition,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'm'
  AND n.nspname NOT IN ('pg_catalog','information_schema')
  AND n.nspname = 'public' -- Limit to public schema only
ORDER BY schema, matview_name;

| schema | matview_name  | definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | total_size |
| ------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| public | defaulters_mv |  SELECT DISTINCT ps.patient_id,
    count(*) FILTER (WHERE (ps.status::text = ANY (ARRAY['Scheduled'::character varying, 'Due'::character varying, 'Overdue'::character varying]::text[])) AND ps.actual_date IS NULL AND ps.scheduled_date < CURRENT_DATE) AS overdue_count,
    min(ps.scheduled_date) FILTER (WHERE (ps.status::text = ANY (ARRAY['Scheduled'::character varying, 'Due'::character varying, 'Overdue'::character varying]::text[])) AND ps.actual_date IS NULL AND ps.scheduled_date < CURRENT_DATE) AS earliest_overdue_date,
    max(ps.scheduled_date) FILTER (WHERE (ps.status::text = ANY (ARRAY['Scheduled'::character varying, 'Due'::character varying, 'Overdue'::character varying]::text[])) AND ps.actual_date IS NULL AND ps.scheduled_date < CURRENT_DATE) AS latest_overdue_date
   FROM patientschedule ps
     JOIN patients p ON p.patient_id = ps.patient_id
  WHERE p.is_deleted = false
  GROUP BY ps.patient_id
 HAVING count(*) FILTER (WHERE (ps.status::text = ANY (ARRAY['Scheduled'::character varying, 'Due'::character varying, 'Overdue'::character varying]::text[])) AND ps.actual_date IS NULL AND ps.scheduled_date < CURRENT_DATE) > 0; | 8192 bytes |