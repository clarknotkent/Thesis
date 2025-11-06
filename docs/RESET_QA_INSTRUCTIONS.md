# QA Reset: Cleanup and Resequence

This script wipes Guardian and Health Staff data (with cascaded dependents), clears vaccine-related domains, purges logs, resequences all IDs, and re-logs remaining Admin users and FAQs.

File: backend/scripts/reset_clean_for_QA.sql

Notes
- Non-production only. A full backup schema named `backup_reset_YYYYMMDD_HHMM` is created first (structure + data).
- Runs inside a single transaction with `SET CONSTRAINTS ALL DEFERRED` to support deep cascades. If anything fails, no changes are applied.
- Requires the helper function `public.resequence_table` to exist (from your resequencing scripts).

What it does
1) Backup all public tables to a new schema.
2) Delete (in safe order):
   - Conversations/messages (optional), notifications, sms_logs, activitylogs
   - Vaccine domain: patientschedule, schedule_doses, schedule_master, immunizations, deworming, vitamina, inventory transactions/history, receiving reports/items, inventory requests, inventory, vaccinemaster
   - Guardian domain: birthhistory, vitalsigns, visits for matching patients; then patients, guardians, and finally users for roles: Guardian/Parent/Guardian-Parent/HealthStaff/Nurse/Nutritionist
3) Resequence IDs across affected tables.
4) Insert fresh activity logs for existing Admin users and FAQs.

How to run (PowerShell, psql)
```powershell
# Using environment variables for connection
# Ensure psql is installed and PATH-ed
$env:PGHOST = "<host>"; $env:PGPORT = "5432"; $env:PGDATABASE = "<db>"; $env:PGUSER = "<user>"; $env:PGPASSWORD = "<password>"
psql -v ON_ERROR_STOP=1 -f "backend/scripts/reset_clean_for_QA.sql"
```

Using Supabase SQL Editor
- Open Project > SQL Editor > paste the entire script contents > Run.

After running
- Verify with simple counts (e.g., `select count(*) from users;` etc.).
- Sign in as an Admin and re-create data manually for QA.
- Activity Log should show entries for Admin users and FAQs.

Rollback
- If you need to restore, you can copy data back from the backup schema, e.g.:
```sql
INSERT INTO public.users SELECT * FROM backup_reset_YYYYMMDD_HHMM.users;
```
(Repeat for other tables as needed)