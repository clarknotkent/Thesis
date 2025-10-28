-- CRON Jobs Schema Definition
SELECT jobid, schedule, command, nodename, nodeport, database, username, active, jobname
FROM cron.job
ORDER BY jobid;

| jobid | schedule   | command                                             | nodename  | nodeport | database | username | active | jobname                      |
| ----- | ---------- | --------------------------------------------------- | --------- | -------- | -------- | -------- | ------ | ---------------------------- |
| 21    | 0 18 * * * | SELECT public.check_expired_inventory_scheduled();  | localhost | 5432     | postgres | postgres | true   | check-expired-inventory      |
| 22    | 0 23 * * * | SELECT public.update_schedule_statuses_scheduled(); | localhost | 5432     | postgres | postgres | true   | update-schedule-statuses-7am |
| 23    | 0 9 * * *  | SELECT public.update_schedule_statuses_scheduled(); | localhost | 5432     | postgres | postgres | true   | update-schedule-statuses-5pm |