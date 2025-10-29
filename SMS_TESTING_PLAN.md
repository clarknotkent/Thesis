# SMS System Testing Plan

## Overview
This document outlines the complete testing plan for the SMS scheduling system, including auto-creation, cascading updates, and frontend display.

---

## ✅ Completed Features

### 1. SMS Auto-Creation
- **Feature**: Automatically creates 4 SMS reminder logs when a patient schedule is created
- **Offsets**: 7 days, 3 days, 1 day, 0 days (same day)
- **Time**: 08:00 Asia/Manila timezone
- **Same-Day Combination**: Multiple schedules on the same day are combined into single SMS per offset

### 2. SMS Templates
- **Variables Supported**:
  - `{patient_name}` - Patient's full name
  - `{guardian_title}` - Ms./Mr. based on guardian gender
  - `{guardian_last_name}` - Guardian's last name
  - `{vaccine_name}` - Vaccine name
  - `{dose_number}` - Dose number (1st, 2nd, 3rd, etc.)
  - `{scheduled_date}` - Appointment date

### 3. Cascade Updates (Non-Blocking)
All cascade operations run in background using `setImmediate()` to prevent API timeouts.

#### 3.1 Guardian Phone Number Update
- **Trigger**: Guardian's `contact_number` is updated
- **Effect**: Updates `phone_number` in all pending SMS logs for that guardian's patients
- **Location**: `guardianModel.updateGuardian()`, `guardianModel.syncGuardianFromUser()`

#### 3.2 Name Changes
- **Trigger**: Guardian or patient name is updated
- **Effect**: Regenerates SMS messages with new names for all pending SMS logs
- **Location**: `guardianModel.updateGuardian()`, `guardianModel.syncGuardianFromUser()`, `patientModel.updatePatient()`

#### 3.3 Schedule Reschedule (Smart Logic)
- **Trigger**: Patient schedule date is changed
- **Effect**: Deletes ALL existing SMS for affected schedules, recreates with correct combinations
- **Location**: `immunizationModel.updatePatientSchedule()`, `immunizationModel.reschedulePatientSchedule()`
- **Smart Handling**:
  - Standalone → Standalone: Deletes 4 old SMS, creates 4 new SMS
  - Combined → Separate: Deletes 4 combined SMS, creates 4 for moved schedule + 4 combined for remaining
  - Separate → Combined: Deletes 4 separate SMS, creates 4 combined SMS (or updates existing)
  - Combined → Combined: Deletes all old, recreates combined SMS for all schedules on new date

### 4. Frontend Enhancements
- **Display**: Shows guardian name, patient name, phone, message, type, status
- **Filters**:
  - Search bar (searches across all fields)
  - Status filter (sent, pending, scheduled, failed)
  - Type filter (scheduled, 1-week, 3-days, 1-day, 0-day, manual)
  - Date filter (scheduled date)
  - Sort by (Recent, Scheduled Date, Patient Name, Guardian Name, Status)
- **Pagination**: 15 items per page
- **Details Modal**: View full message details

---

## 🧪 Testing Scenarios

### Test 1: Initial Schedule Creation
**Steps**:
1. Create a new patient schedule for tomorrow
2. Check database: `SELECT * FROM sms_logs WHERE guardian_id = ?`

**Expected**:
- 4 SMS logs created (7-day, 3-day, 1-day, 0-day)
- All have status 'pending'
- Scheduled times: tomorrow at 08:00, tomorrow - 1 day at 08:00, etc.
- Message includes correct patient name, guardian title, vaccine name, dose number

**SQL Verification**:
```sql
SELECT sl.*, 
       ARRAY_AGG(ps.scheduled_date) as schedules
FROM sms_logs sl
LEFT JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
LEFT JOIN patientschedule ps ON slps.patientschedule_id = ps.id
WHERE sl.guardian_id = <guardian_id>
  AND sl.status = 'pending'
GROUP BY sl.id
ORDER BY sl.scheduled_at;
```

---

### Test 2: Same-Day Combination
**Steps**:
1. Create 3 patient schedules for the same patient on the same date
   - Schedule 1: BCG dose 1
   - Schedule 2: HepB dose 1
   - Schedule 3: OPV dose 1
2. Check database

**Expected**:
- Only 4 SMS logs created (not 12)
- Each SMS message includes all 3 vaccines
- Example: "Dear Ms. Smith, this is a reminder for the vaccination appointment for Baby John tomorrow at the health center. Vaccines: BCG (1st dose), HepB (1st dose), OPV (1st dose)."

**SQL Verification**:
```sql
SELECT sl.*, 
       COUNT(slps.patientschedule_id) as schedule_count,
       ARRAY_AGG(ps.scheduled_date) as dates
FROM sms_logs sl
LEFT JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
LEFT JOIN patientschedule ps ON slps.patientschedule_id = ps.id
WHERE sl.guardian_id = <guardian_id>
GROUP BY sl.id
HAVING COUNT(slps.patientschedule_id) > 1;
```

---

### Test 3: Guardian Phone Number Update
**Steps**:
1. Create a schedule with pending SMS logs
2. Update guardian's phone number: `09171234567` → `09189876543`
3. Wait 1-2 seconds for cascade to complete
4. Check database

**Expected**:
- All pending SMS logs for that guardian's patients updated to new phone number
- API returns immediately (no timeout)
- Console log shows: "✓ Updated X pending SMS logs with new phone number"

**SQL Verification**:
```sql
SELECT * FROM sms_logs 
WHERE guardian_id = <guardian_id> 
  AND status = 'pending'
  AND phone_number = '+639189876543';
```

---

### Test 4: Name Change Cascade
**Steps**:
1. Create a schedule with pending SMS logs
2. Update patient name: "Baby John" → "Baby Jane"
3. Wait 1-2 seconds
4. Check database

**Expected**:
- All pending SMS messages regenerated with new patient name
- Message now reads: "...appointment for Baby Jane..."
- API returns immediately
- Console log shows: "✓ Regenerated X pending SMS messages with updated data"

**SQL Verification**:
```sql
SELECT message FROM sms_logs 
WHERE guardian_id = <guardian_id> 
  AND status = 'pending'
  AND message LIKE '%Baby Jane%';
```

---

### Test 5: Reschedule - Standalone to Standalone
**Setup**: Patient has 1 schedule on Feb 15

**Steps**:
1. Reschedule from Feb 15 → Feb 20
2. Wait 1-2 seconds
3. Check database

**Expected**:
- 4 old SMS logs deleted (for Feb 15)
- 4 new SMS logs created (for Feb 20)
- New scheduled times calculated from Feb 20
- Console log shows: "✓ Recreated X SMS logs for rescheduled patient schedule"

---

### Test 6: Reschedule - Separate to Combined
**Setup**:
- Schedule A: Feb 15 (BCG) - has 4 SMS
- Schedule B: Feb 20 (HepB) - has 4 SMS

**Steps**:
1. Reschedule A from Feb 15 → Feb 20 (same as B)
2. Wait 1-2 seconds
3. Check database

**Expected**:
- All 8 old SMS deleted (4 for A, 4 for B)
- 4 new combined SMS created for Feb 20
- Combined messages include both BCG and HepB

**SQL Verification**:
```sql
SELECT sl.*, 
       COUNT(slps.patientschedule_id) as schedule_count,
       sl.message
FROM sms_logs sl
LEFT JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
LEFT JOIN patientschedule ps ON slps.patientschedule_id = ps.id
WHERE ps.scheduled_date = '2025-02-20'
  AND sl.status = 'pending'
GROUP BY sl.id;
```

---

### Test 7: Reschedule - Combined to Separate
**Setup**:
- Schedule A, B, C: all on Feb 15 (combined into 4 SMS)

**Steps**:
1. Reschedule A from Feb 15 → Feb 20
2. Wait 1-2 seconds
3. Check database

**Expected**:
- 4 combined SMS for Feb 15 deleted
- 4 new SMS created for schedule A on Feb 20 (standalone)
- 4 new combined SMS created for schedules B & C on Feb 15

**SQL Verification**:
```sql
-- Should show 4 SMS for A on Feb 20
SELECT COUNT(*) FROM sms_logs sl
JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
JOIN patientschedule ps ON slps.patientschedule_id = ps.id
WHERE ps.id = <schedule_A_id>;

-- Should show 4 combined SMS for B & C on Feb 15
SELECT COUNT(*) FROM sms_logs sl
JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
JOIN patientschedule ps ON slps.patientschedule_id = ps.id
WHERE ps.scheduled_date = '2025-02-15'
  AND ps.patient_id = <patient_id>;
```

---

### Test 8: Frontend Display
**Steps**:
1. Navigate to SMS Logs page
2. Verify all columns display correctly:
   - Date & Time: Shows sent/scheduled time
   - Guardian: Full name (not undefined)
   - Patient: Full name (not undefined)
   - Phone Number: Formatted number
   - Message: Truncated with CSS (hover shows full)
   - Type: Badge with correct color
   - Status: Badge with correct color

**Expected**:
- No "undefined" values
- Names display properly
- Badges have correct colors:
  - Scheduled: Blue (bg-primary)
  - 1-Week: Cyan (bg-info)
  - 3-Days: Yellow (bg-warning)
  - 1-Day: Red (bg-danger)
  - 0-Day: Red (bg-danger)
  - Manual: Gray (bg-secondary)

---

### Test 9: Frontend Filters
**Steps**:
1. Use status filter: Select "Pending"
2. Use type filter: Select "1 Week"
3. Use date filter: Select tomorrow's date
4. Use search: Type patient name
5. Use sort: Select "Sort: Patient Name"

**Expected**:
- Each filter narrows down results correctly
- Combining filters works (AND logic)
- Sort options change order:
  - Recent First: Newest first
  - Scheduled Date: Earliest first
  - Patient Name: Alphabetical
  - Guardian Name: Alphabetical
  - Status: Alphabetical
- Pagination resets to page 1 on filter/sort change

---

### Test 10: Frontend Pagination
**Steps**:
1. Create 20+ SMS logs
2. Verify pagination shows 15 per page
3. Navigate to page 2
4. Change filter → verify it resets to page 1

**Expected**:
- Shows "Showing 1 to 15 of X entries"
- Page 2 shows items 16-30
- Previous/Next buttons work
- Filter change resets to page 1

---

### Test 11: Message Details Modal
**Steps**:
1. Click "View" button on any SMS log
2. Verify modal displays:
   - Guardian name
   - Patient name
   - Phone number
   - Date sent/scheduled
   - Message type (with badge)
   - Status (with badge)
   - Full message content
   - Character count

**Expected**:
- All fields populated
- Full message visible (not truncated)
- Badges match table display

---

### Test 12: Manual SMS
**Steps**:
1. Click "Manual" button
2. Fill in phone number: 09171234567
3. Select template: "Immunization Reminder"
4. Fill in variables
5. Click "Preview"
6. Click "Send Now"

**Expected**:
- Preview shows message with variables replaced
- SMS sent successfully
- New log appears in table with type "Manual"
- Modal auto-closes after success

---

## 🔍 Database Verification Queries

### Check SMS Logs for a Patient
```sql
SELECT 
  sl.id,
  sl.phone_number,
  sl.message,
  sl.type,
  sl.status,
  sl.scheduled_at,
  sl.sent_at,
  p.firstname || ' ' || p.lastname as patient_name,
  g.firstname || ' ' || g.lastname as guardian_name,
  ARRAY_AGG(ps.scheduled_date) as schedules
FROM sms_logs sl
JOIN guardians g ON sl.guardian_id = g.id
LEFT JOIN patients p ON sl.patient_id = p.id
LEFT JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
LEFT JOIN patientschedule ps ON slps.patientschedule_id = ps.id
WHERE p.id = <patient_id>
GROUP BY sl.id, p.firstname, p.lastname, g.firstname, g.lastname
ORDER BY sl.scheduled_at;
```

### Check Combined SMS Logs
```sql
SELECT 
  sl.id,
  sl.message,
  COUNT(slps.patientschedule_id) as schedule_count,
  ARRAY_AGG(ps.scheduled_date) as schedules
FROM sms_logs sl
JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
JOIN patientschedule ps ON slps.patientschedule_id = ps.id
GROUP BY sl.id
HAVING COUNT(slps.patientschedule_id) > 1
ORDER BY sl.scheduled_at;
```

### Check Pending SMS Count by Type
```sql
SELECT 
  type,
  COUNT(*) as count,
  MIN(scheduled_at) as earliest,
  MAX(scheduled_at) as latest
FROM sms_logs
WHERE status = 'pending'
GROUP BY type
ORDER BY type;
```

---

## 🚨 Known Issues / Edge Cases

### Issue 1: Timezone Handling
- SMS scheduled times use Asia/Manila timezone
- Ensure server timezone is configured correctly
- Verify `scheduled_at` timestamps in database

### Issue 2: Message Length
- Combined messages can exceed 160 characters
- System allows multi-part SMS
- Monitor character count in manual SMS

### Issue 3: Cascade Timing
- Cascades run in background (setImmediate)
- May take 1-2 seconds to complete
- Don't immediately query database after update
- Check console logs for cascade completion

### Issue 4: Deleted Schedules
- If a schedule is deleted, associated SMS should be deleted
- Verify cascade delete rules in database schema
- Test: Delete schedule → check SMS logs deleted

---

## 📊 Performance Monitoring

### Metrics to Track
1. **Cascade Execution Time**: Should complete in < 2 seconds
2. **API Response Time**: Should return in < 500ms (cascade runs in background)
3. **SMS Creation Count**: 4 per schedule, N per same-day combination
4. **Database Queries**: Minimize N+1 queries in cascade operations

### Logging
All cascade functions log to console:
- `✓ Updated X pending SMS logs with new phone number`
- `✓ Regenerated X pending SMS messages with updated data`
- `✓ Recreated X SMS logs for rescheduled patient schedule`
- `✗ Error in cascade operation: <error>`

---

## ✅ Acceptance Criteria

### SMS Auto-Creation
- [ ] 4 SMS logs created per schedule
- [ ] Same-day schedules combined
- [ ] Correct scheduled times (7, 3, 1, 0 days before at 08:00)
- [ ] Messages include all template variables

### Cascade Updates
- [ ] Phone updates reflect in pending SMS (< 2s)
- [ ] Name updates regenerate messages (< 2s)
- [ ] Reschedules recreate SMS with correct combinations (< 2s)
- [ ] API returns immediately (no timeout)
- [ ] Console logs show cascade success/failure

### Frontend Display
- [ ] Guardian name displays (not undefined)
- [ ] Patient name displays (not undefined)
- [ ] All filters work correctly
- [ ] Sort options change order
- [ ] Pagination works (15 per page)
- [ ] Message details modal shows all fields

### Overall System
- [ ] No timeout errors on updates
- [ ] SMS sent on schedule (daily cron at 07:00)
- [ ] Failed SMS retried automatically
- [ ] Manual SMS sends immediately
- [ ] Template preview works

---

## 🎯 Next Steps

1. **Run all test scenarios** in development environment
2. **Verify database** using SQL queries after each test
3. **Check console logs** for cascade completion messages
4. **Test frontend** display and filters
5. **Monitor performance** during high-volume operations
6. **Document any issues** found during testing
7. **Create production deployment plan** once all tests pass

---

## 📝 Notes

- All cascade operations are **non-blocking** using `setImmediate()`
- SMS scheduler runs **daily at 07:00 Asia/Manila**
- Frontend fetches **200 records** for client-side sorting
- Database uses **join table** `sms_log_patientschedule` for many-to-many relationship
- **Smart reschedule logic** handles all combination scenarios automatically

