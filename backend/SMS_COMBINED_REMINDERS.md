# SMS Combined Reminders Implementation

## Summary
Implemented automatic SMS reminder creation that **combines same-day schedules into a single SMS** per reminder offset (7,3,1,0 days before scheduled date).

---

## What Changed

### 1. Database Schema
Added join table for many-to-many relationship between SMS logs and patient schedules:

```sql
create table if not exists sms_log_patientschedule (
  sms_log_id           bigint not null,
  patient_schedule_id  bigint not null,
  created_at           timestamptz not null default now(),
  primary key (sms_log_id, patient_schedule_id),
  constraint fk_slps_sms foreign key (sms_log_id) references sms_logs(id) on delete cascade,
  constraint fk_slps_ps  foreign key (patient_schedule_id) references patientschedule(patient_schedule_id) on delete cascade
);

create index if not exists ix_slps_ps  on sms_log_patientschedule (patient_schedule_id);
create index if not exists ix_slps_log on sms_log_patientschedule (sms_log_id);
```

**Purpose:**
- One SMS can reference multiple patient schedules (same-day combined message)
- One patient schedule can be referenced by multiple SMS (different reminder offsets: 7,3,1,0 days)
- Traceability: know exactly which schedules each SMS covers
- Clean cascade deletes

---

### 2. Backend Service (`services/smsReminderService.js`)

**Key Logic:**
When a `patientschedule` is created, the service:

1. **Finds all same-day schedules** for that patient on the same `scheduled_date`
2. **Combines vaccine names** (e.g., "BCG, Hepatitis B, Polio")
3. **Creates ONE SMS per reminder offset** (7, 3, 1, 0 days before):
   - At 08:00 Asia/Manila on the reminder day
   - Uses active SMS template for that trigger_type (1-week, 3-days, 1-day, 0-day)
   - Replaces template variables with patient/vaccine/schedule data
4. **Links the SMS to ALL patient_schedule_ids** via `sms_log_patientschedule`
5. **De-duplicates**: if a log already exists for that patient/phone/time, reuses it and adds missing links

**Environment Variable:**
```bash
SMS_REMINDER_DAYS=7,3,1,0  # default; customize reminder offsets
```

---

### 3. Auto-Creation Hook (`models/immunizationModel.js`)

Added to `scheduleImmunization()`:
```javascript
// Auto-create scheduled SMS reminder logs for this patientschedule (non-blocking)
try {
  if (data && data.patient_schedule_id) {
    await scheduleReminderLogsForPatientSchedule(data.patient_schedule_id, supabase);
  }
} catch (remErr) {
  console.error('[scheduleImmunization] Failed to create SMS reminder logs:', remErr?.message || remErr);
}
```

**Result:** Creating a `patientschedule` automatically queues 4 scheduled SMS reminders (or fewer if some are in the past).

---

### 4. Backfill SQL (for existing schedules)

Reset and backfill in one transaction:
```sql
begin;

-- Clear link table
delete from sms_log_patientschedule;

-- Keep id=1, delete the rest
delete from sms_logs where id <> 1;

-- Reset sequence to 2
do $$
declare
  seq_name text;
begin
  select pg_get_serial_sequence('sms_logs', 'id') into seq_name;
  if seq_name is not null then
    perform setval(seq_name, 1, true);
  end if;
end$$;

-- Create combined SMS logs per patient per date per offset
with base as (
  select
    ps.patient_id,
    ps.scheduled_date::date as sched_date,
    array_agg(ps.patient_schedule_id order by ps.patient_schedule_id) as ps_ids,
    pv.full_name as patient_name,
    pv.guardian_contact_number as phone,
    string_agg(distinct v.antigen_name, ', ' order by v.antigen_name) as vaccine_names,
    case when count(*) > 1
         then 'multiple'
         else min(ps.dose_number)::text
    end as dose_numbers
  from patientschedule ps
  join patients_view pv on pv.patient_id = ps.patient_id
  left join vaccines v on v.vaccine_id = ps.vaccine_id
  where ps.is_deleted = false
    and ps.scheduled_date >= current_date
    and pv.guardian_contact_number is not null
  group by ps.patient_id, ps.scheduled_date::date, pv.full_name, pv.guardian_contact_number
),
d as (
  select unnest(array[7,3,1,0]) as days
),
rows as (
  select
    b.patient_id,
    b.sched_date,
    b.ps_ids,
    b.patient_name,
    b.phone,
    b.vaccine_names,
    b.dose_numbers,
    d.days as days_until,
    ((b.sched_date - d.days) + time '08:00') at time zone 'Asia/Manila' as run_at
  from base b
  cross join d
  where (((b.sched_date - d.days) + time '08:00') at time zone 'Asia/Manila') >= now()
),
with_trigger as (
  select
    r.*,
    case r.days_until
      when 7 then '1-week'
      when 3 then '3-days'
      when 1 then '1-day'
      when 0 then '0-day'
      else null
    end as trigger_type
  from rows r
),
tpl_pick as (
  select
    w.*,
    t.id as template_id,
    t.template as template_text
  from with_trigger w
  left join lateral (
    select t2.id, t2.template, t2.updated_at, t2.created_at
    from sms_templates t2
    where lower(t2.trigger_type) = lower(w.trigger_type)
      and coalesce(t2.is_active, true) = true
      and coalesce(t2.is_deleted, false) = false
    order by t2.updated_at desc nulls last,
             t2.created_at desc nulls last,
             t2.id desc
    limit 1
  ) t on true
),
render as (
  select
    p.patient_id,
    p.sched_date,
    p.ps_ids,
    p.phone,
    p.days_until,
    p.run_at,
    p.template_id,
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            coalesce(
                              p.template_text,
                              format(
                                'Reminder: %s scheduled for %s (%s)',
                                coalesce(p.vaccine_names, 'vaccines'),
                                to_char(p.sched_date, 'YYYY-MM-DD'),
                                coalesce(p.patient_name, 'patient')
                              )
                            ),
                            '{patient_name}', coalesce(p.patient_name, '')
                          ),
                          '{patient_first_name}', split_part(coalesce(p.patient_name,''), ' ', 1)
                        ),
                        '{vaccine_name}', coalesce(p.vaccine_names, '')
                      ),
                      '{dose_number}', coalesce(p.dose_numbers, '')
                    ),
                    '{scheduled_date}', to_char(p.sched_date, 'YYYY-MM-DD')
                  ),
                  '{appointment_date}', to_char(p.sched_date, 'YYYY-MM-DD')
                ),
                '{appointment_time}', '08:00 AM'
              ),
              '{days_until}', p.days_until::text
            ),
            '{guardian_name}', ''
          ),
          '{guardian_first_name}', ''
        ),
        '{guardian_last_name}', ''
      ),
      '{health_center}', 'Barangay Health Center'
    ) as message_text
  from tpl_pick p
),
ins as (
  insert into sms_logs (
    guardian_id, patient_id, phone_number, message, type, status, scheduled_at, template_id, created_at, updated_at
  )
  select
    null::bigint, r.patient_id, r.phone, r.message_text, 'scheduled', 'pending', r.run_at, r.template_id, now(), now()
  from render r
  returning id, patient_id, scheduled_at
),
link as (
  insert into sms_log_patientschedule (sms_log_id, patient_schedule_id)
  select i.id, ps_id
  from ins i
  join rows rw on rw.patient_id = i.patient_id and rw.run_at = i.scheduled_at
  cross join lateral unnest(rw.ps_ids) as ps_id
  returning 1
)
select
  (select count(*) from ins)  as sms_created,
  (select count(*) from link) as links_created;

commit;
```

---

## Example Scenarios

### Scenario 1: Single vaccine on 2025-11-15
**Creating schedule:**
- Creates 4 SMS logs (if all in future):
  - 2025-11-08 08:00 (7 days before) → "1-week" template
  - 2025-11-12 08:00 (3 days before) → "3-days" template
  - 2025-11-14 08:00 (1 day before)  → "1-day" template
  - 2025-11-15 08:00 (same day)      → "0-day" template
- Each SMS linked to that single `patient_schedule_id`

### Scenario 2: Three vaccines on same day (2025-11-15)
**Creating any one of the schedules:**
- Service finds all 3 schedules for that patient on 2025-11-15
- Creates 4 **combined** SMS logs:
  - Message includes all 3 vaccine names: "BCG, Hepatitis B, Polio"
  - `dose_number` = "multiple"
- Each SMS linked to all 3 `patient_schedule_id`s via join table

**Result:** Parent receives **ONE** SMS per reminder offset, not three.

---

## SMS Scheduler Behavior

The existing daily scheduler (`services/smsScheduler.js`) runs at configured time (default 07:00 Asia/Manila):
- Picks `sms_logs` where `type='scheduled'`, `status='pending'`, `scheduled_at <= now()`
- Sends via PhilSMS
- Updates status to `sent` or keeps as `pending` with error message for retry

**No changes needed** to scheduler—it automatically processes these combined reminders.

---

## Template Variables Supported

```
{patient_name}
{patient_first_name}
{vaccine_name}          ← combined if multiple (e.g., "BCG, Hepatitis B")
{dose_number}           ← "multiple" if > 1 schedule
{scheduled_date}
{appointment_date}
{appointment_time}
{days_until}
{guardian_name}
{guardian_first_name}
{guardian_last_name}
{health_center}
{greeting_time}
{guardian_title}
```

---

## Manual Trigger (Admin Only)

Force immediate processing of due scheduled SMS:
```bash
POST /api/sms/cron/run-now
Authorization: Bearer <admin-token>
```

---

## Environment Configuration

```bash
# Enable/disable SMS scheduler
SMS_CRON_ENABLED=true

# Daily run time (Asia/Manila)
SMS_CRON_TZ=Asia/Manila
SMS_CRON_HOUR=7
SMS_CRON_MINUTE=0

# Batch limit per run
SMS_CRON_BATCH_LIMIT=200

# Reminder offsets (days before scheduled_date)
SMS_REMINDER_DAYS=7,3,1,0
```

---

## Testing Checklist

- [x] Create single patient schedule → verify 4 SMS logs created (or fewer if past due)
- [x] Create multiple schedules on same day → verify single combined SMS per offset
- [x] Check `sms_log_patientschedule` links all schedules to each SMS
- [x] Verify templates are used and variables replaced
- [x] Run backfill SQL → confirm existing schedules get combined reminders
- [x] Manually trigger scheduler → confirm SMS sends successfully
- [ ] Test scheduler at configured daily time

---

## Migration Steps

1. **Create join table:**
   ```sql
   -- Run in Supabase SQL editor or psql
   create table if not exists sms_log_patientschedule (
     sms_log_id           bigint not null,
     patient_schedule_id  bigint not null,
     created_at           timestamptz not null default now(),
     primary key (sms_log_id, patient_schedule_id),
     constraint fk_slps_sms foreign key (sms_log_id) references sms_logs(id) on delete cascade,
     constraint fk_slps_ps  foreign key (patient_schedule_id) references patientschedule(patient_schedule_id) on delete cascade
   );
   create index if not exists ix_slps_ps  on sms_log_patientschedule (patient_schedule_id);
   create index if not exists ix_slps_log on sms_log_patientschedule (sms_log_id);
   ```

2. **Backfill existing schedules:**
   - Run the backfill SQL (see above) to create combined reminders for all upcoming schedules

3. **Deploy backend changes:**
   - `services/smsReminderService.js` (new)
   - `models/immunizationModel.js` (updated)

4. **Restart server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

5. **Verify:**
   - Create a new patient schedule
   - Check `sms_logs` table for 4 new rows
   - Check `sms_log_patientschedule` for links
   - Wait for scheduler run or manually trigger via `/api/sms/cron/run-now`

---

## Notes

- **Non-blocking:** SMS creation failures don't block schedule creation
- **De-duplication:** Service checks for existing SMS at same time before creating new ones
- **Reuse logic:** If an SMS already exists for patient/phone/time, service just adds missing links
- **Past reminders skipped:** Only creates SMS with `scheduled_at >= now()` to avoid immediate backlog
- **Template fallback:** If no active template found, uses generic message format

---

## Future Enhancements

- [ ] Guardian preferences: allow opt-out per guardian
- [ ] Custom reminder offsets per vaccine type
- [ ] SMS delivery status tracking (webhook from PhilSMS)
- [ ] Cost tracking per SMS batch
- [ ] Frontend UI to view/edit scheduled reminders
