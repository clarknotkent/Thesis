# SMS System - Quick Reference Guide

## 🚀 Quick Start

### Check if SMS Auto-Creation is Working

```sql
-- 1. Create a patient schedule via the UI/API
-- 2. Run this query:
SELECT 
  sl.id,
  sl.type,
  sl.status,
  sl.scheduled_at,
  sl.message,
  COUNT(slps.patientschedule_id) as linked_schedules
FROM sms_logs sl
LEFT JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
WHERE sl.patient_id = <YOUR_PATIENT_ID>
GROUP BY sl.id
ORDER BY sl.scheduled_at;

-- Expected: 4 rows (1-week, 3-days, 1-day, 0-day)
```

---

## 🔧 Common Operations

### Test Same-Day Combination

```javascript
// Create 2 schedules on the same date via API
POST /api/immunization/schedule
{
  "patientId": 1,
  "vaccineId": 1, // BCG
  "scheduledDate": "2025-02-15",
  "doseNumber": 1
}

POST /api/immunization/schedule
{
  "patientId": 1,
  "vaccineId": 2, // HepB
  "scheduledDate": "2025-02-15",
  "doseNumber": 1
}

// Check database:
SELECT COUNT(*) FROM sms_logs 
WHERE patient_id = 1 
  AND status = 'pending';
-- Expected: 4 (not 8!)

// Check message content:
SELECT message FROM sms_logs 
WHERE patient_id = 1 
LIMIT 1;
-- Expected: Should mention both BCG and HepB
```

---

### Test Guardian Phone Update Cascade

```javascript
// 1. Note current phone in SMS logs
SELECT DISTINCT phone_number 
FROM sms_logs 
WHERE guardian_id = <GUARDIAN_ID> 
  AND status = 'pending';

// 2. Update guardian phone via API
PUT /api/guardians/<GUARDIAN_ID>
{
  "contactNumber": "09189876543"
}

// 3. Wait 2 seconds

// 4. Check console for:
// ✓ Updated X pending SMS logs with new phone number for guardian ID: <ID>

// 5. Verify in database:
SELECT DISTINCT phone_number 
FROM sms_logs 
WHERE guardian_id = <GUARDIAN_ID> 
  AND status = 'pending';
-- Expected: +639189876543
```

---

### Test Name Update Cascade

```javascript
// 1. Update patient name
PUT /api/patients/<PATIENT_ID>
{
  "firstname": "Jane",
  "lastname": "Doe"
}

// 2. Wait 2 seconds

// 3. Check console for:
// ✓ Regenerated X pending SMS messages with updated data for patient ID: <ID>

// 4. Check message:
SELECT message FROM sms_logs 
WHERE patient_id = <PATIENT_ID> 
  AND status = 'pending' 
LIMIT 1;
-- Expected: Message contains "Jane Doe"
```

---

### Test Reschedule Cascade

**Scenario: Move standalone schedule**

```javascript
// Setup: Schedule A on Feb 15
// Has 4 SMS logs

// 1. Reschedule
PUT /api/immunization/schedule/<SCHEDULE_ID>
{
  "scheduledDate": "2025-02-20"
}

// 2. Wait 2 seconds

// 3. Check console for:
// ✓ Recreated X SMS logs for rescheduled patient schedule ID: <ID>

// 4. Verify old SMS deleted:
SELECT COUNT(*) FROM sms_logs sl
JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
WHERE slps.patientschedule_id = <SCHEDULE_ID>;
-- Expected: 4 (new SMS)

// 5. Verify new scheduled_at dates:
SELECT type, scheduled_at FROM sms_logs sl
JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
WHERE slps.patientschedule_id = <SCHEDULE_ID>
ORDER BY scheduled_at;
-- Expected:
-- 1-week  | 2025-02-13 08:00:00
-- 3-days  | 2025-02-17 08:00:00
-- 1-day   | 2025-02-19 08:00:00
-- 0-day   | 2025-02-20 08:00:00
```

**Scenario: Combine 2 schedules**

```javascript
// Setup:
// Schedule A on Feb 15 (BCG) - 4 SMS
// Schedule B on Feb 20 (HepB) - 4 SMS

// 1. Move A to Feb 20
PUT /api/immunization/schedule/<SCHEDULE_A_ID>
{
  "scheduledDate": "2025-02-20"
}

// 2. Wait 2 seconds

// 3. Check database:
SELECT COUNT(*) FROM sms_logs sl
JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
JOIN patientschedule ps ON slps.patientschedule_id = ps.id
WHERE ps.scheduled_date = '2025-02-20'
  AND ps.patient_id = <PATIENT_ID>;
-- Expected: 4 (combined SMS for both schedules)

// 4. Check message includes both vaccines:
SELECT message FROM sms_logs sl
JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
JOIN patientschedule ps ON slps.patientschedule_id = ps.id
WHERE ps.scheduled_date = '2025-02-20'
  AND sl.type = '1-week';
-- Expected: Contains both "BCG" and "HepB"
```

---

### Manual SMS via Frontend

```
1. Navigate to SMS Logs page
2. Click "Manual" button
3. Fill in form:
   - Phone: 09171234567
   - Type: Manual
   - Toggle "Use Template": ON
   - Select template: "Immunization Reminder"
   - Fill variables:
     * Guardian Last Name: Smith
     * Guardian Gender: Female
     * Patient Name: Baby John
     * Vaccine Name: BCG
     * Dose Number: 1
     * Appointment Date: 2025-02-15
4. Click "Preview" → verify message
5. Click "Send Now"
6. Check for success message
7. Verify new log appears in table with type "Manual"
```

---

### Filter & Sort SMS Logs

```
Frontend Filters:
├─ Search: Type "John" → shows all SMS mentioning John
├─ Status: Select "Pending" → shows only pending SMS
├─ Type: Select "1 Week" → shows only 7-day reminders
├─ Date: Pick date → shows SMS scheduled for that date
└─ Sort By:
   ├─ Recent First → newest created_at first
   ├─ Scheduled Date → earliest scheduled_at first
   ├─ Patient Name → alphabetical by patient
   ├─ Guardian Name → alphabetical by guardian
   └─ Status → alphabetical by status

API Query:
GET /api/sms/history?status=pending&type=1-week&search=John&page=1&limit=200
```

---

## 📊 Useful Database Queries

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
ORDER BY 
  CASE type
    WHEN '1-week' THEN 1
    WHEN '3-days' THEN 2
    WHEN '1-day' THEN 3
    WHEN '0-day' THEN 4
    ELSE 5
  END;
```

### Find Combined SMS (Multiple Schedules)

```sql
SELECT 
  sl.id,
  sl.message,
  sl.type,
  sl.scheduled_at,
  COUNT(slps.patientschedule_id) as schedule_count,
  STRING_AGG(ps.scheduled_date::text, ', ') as dates
FROM sms_logs sl
JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
JOIN patientschedule ps ON slps.patientschedule_id = ps.id
GROUP BY sl.id
HAVING COUNT(slps.patientschedule_id) > 1
ORDER BY sl.scheduled_at;
```

### Check SMS for Specific Patient

```sql
SELECT 
  sl.id,
  sl.type,
  sl.status,
  sl.scheduled_at,
  sl.sent_at,
  sl.message,
  g.firstname || ' ' || g.lastname as guardian_name,
  ARRAY_AGG(ps.scheduled_date) as schedule_dates,
  ARRAY_AGG(v.vaccine_name) as vaccines
FROM sms_logs sl
JOIN guardians g ON sl.guardian_id = g.id
LEFT JOIN sms_log_patientschedule slps ON sl.id = slps.sms_log_id
LEFT JOIN patientschedule ps ON slps.patientschedule_id = ps.id
LEFT JOIN vaccine v ON ps.vaccine_id = v.id
WHERE sl.patient_id = <PATIENT_ID>
GROUP BY sl.id, g.firstname, g.lastname
ORDER BY sl.scheduled_at;
```

### Find SMS Scheduled for Today

```sql
SELECT 
  sl.*,
  p.firstname || ' ' || p.lastname as patient_name,
  g.firstname || ' ' || g.lastname as guardian_name
FROM sms_logs sl
JOIN patients p ON sl.patient_id = p.id
JOIN guardians g ON sl.guardian_id = g.id
WHERE DATE(sl.scheduled_at) = CURRENT_DATE
  AND sl.status = 'pending'
ORDER BY sl.scheduled_at;
```

### Check Failed SMS

```sql
SELECT 
  sl.*,
  p.firstname || ' ' || p.lastname as patient_name,
  g.contact_number as guardian_phone
FROM sms_logs sl
JOIN patients p ON sl.patient_id = p.id
JOIN guardians g ON sl.guardian_id = g.id
WHERE sl.status = 'failed'
ORDER BY sl.created_at DESC;
```

---

## 🐛 Debugging Tips

### Issue: No SMS created on schedule creation

```bash
# 1. Check console logs for errors
# 2. Verify function is called:
console.log('Creating schedule SMS...')

# 3. Check database:
SELECT COUNT(*) FROM sms_logs WHERE patient_id = ?
# Should increase by 4 after schedule creation

# 4. Check if guardian has phone:
SELECT contact_number FROM guardians WHERE id = ?
# Must not be NULL

# 5. Check if patient has guardian:
SELECT guardian_id FROM patients WHERE id = ?
# Must not be NULL
```

---

### Issue: Cascade not working

```bash
# 1. Check console for cascade logs:
# ✓ Updated X pending SMS logs...
# ✓ Regenerated X pending SMS messages...
# ✓ Recreated X SMS logs...

# 2. Wait 2 seconds after API call (cascade is async)

# 3. Check if setImmediate() exists:
# guardianModel.js line ~180
# patientModel.js line ~150
# immunizationModel.js line ~200

# 4. Verify cascade function exists:
# smsReminderService.js
# - updatePhoneNumberForPatient()
# - updateMessagesForPatient()
# - handleScheduleReschedule()
```

---

### Issue: Frontend shows "undefined"

```bash
# 1. Check API response:
GET /api/sms/history?limit=1
# Response should have patient_name and guardian_name

# 2. Check frontend field names:
# MessageLogs.vue line ~100
# Should use: log.patient_name, log.guardian_name
# NOT: log.patient?.firstname

# 3. Check database has data:
SELECT p.firstname, p.lastname FROM patients p WHERE id = ?
SELECT g.firstname, g.lastname FROM guardians g WHERE id = ?
```

---

## 🔍 Console Log Patterns

### Successful Cascade Operations

```
✓ Updated 4 pending SMS logs with new phone number for guardian ID: 123
✓ Regenerated 8 pending SMS messages with updated data for patient ID: 456
✓ Recreated 4 SMS logs for rescheduled patient schedule ID: 789
```

### Cascade Errors

```
✗ Error updating phone number for patient: <error message>
✗ Error regenerating messages for patient: <error message>
✗ Error handling schedule reschedule: <error message>
```

### SMS Scheduler (Cron Job)

```
🕐 Running SMS scheduler at 2025-02-01 07:00:00
📤 Sending SMS to +639171234567: Dear Ms. Smith...
✓ SMS sent successfully (ID: 123)
✗ Failed to send SMS (ID: 124): Invalid phone number
📊 SMS Scheduler complete: 15 sent, 2 failed
```

---

## ⚡ Performance Tips

### Reduce Database Queries

```sql
-- ❌ Bad: N+1 queries
FOR EACH sms_log:
  SELECT * FROM patients WHERE id = sms_log.patient_id
  SELECT * FROM guardians WHERE id = sms_log.guardian_id

-- ✅ Good: Single query with joins
SELECT 
  sl.*,
  p.firstname || ' ' || p.lastname as patient_name,
  g.firstname || ' ' || g.lastname as guardian_name
FROM sms_logs sl
LEFT JOIN patients p ON sl.patient_id = p.id
LEFT JOIN guardians g ON sl.guardian_id = g.id
```

### Index Key Columns

```sql
-- Add indexes for common queries
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_scheduled_at ON sms_logs(scheduled_at);
CREATE INDEX idx_sms_logs_guardian_id ON sms_logs(guardian_id);
CREATE INDEX idx_sms_logs_patient_id ON sms_logs(patient_id);
```

### Limit Frontend Data

```javascript
// ❌ Bad: Fetch all SMS logs
GET /api/sms/history?limit=10000

// ✅ Good: Fetch reasonable amount for client-side ops
GET /api/sms/history?limit=200
```

---

## 📈 Monitoring

### Daily Checks

```sql
-- 1. Check pending SMS count
SELECT COUNT(*) FROM sms_logs WHERE status = 'pending';
-- Should have upcoming reminders

-- 2. Check sent SMS today
SELECT COUNT(*) FROM sms_logs 
WHERE status = 'sent' 
  AND DATE(sent_at) = CURRENT_DATE;
-- Should match cron job output

-- 3. Check failed SMS
SELECT COUNT(*) FROM sms_logs WHERE status = 'failed';
-- Should be low (< 5%)

-- 4. Check oldest pending SMS
SELECT MIN(scheduled_at) FROM sms_logs WHERE status = 'pending';
-- Should not be in the past (except during cron job run)
```

### Weekly Checks

```sql
-- 1. SMS delivery rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM sms_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY status;

-- 2. Most common failure reasons
SELECT 
  error_message,
  COUNT(*) as count
FROM sms_logs
WHERE status = 'failed'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY error_message
ORDER BY count DESC;

-- 3. Average SMS per patient
SELECT 
  AVG(sms_count) as avg_sms_per_patient
FROM (
  SELECT patient_id, COUNT(*) as sms_count
  FROM sms_logs
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY patient_id
) t;
```

---

## 🎯 Success Metrics

### SMS Auto-Creation
- ✅ 100% of schedules should have 4 SMS logs
- ✅ Same-day schedules should be combined (1 SMS per offset)
- ✅ SMS created within 1 second of schedule creation

### Cascade Updates
- ✅ API response time < 500ms
- ✅ Cascade completion within 2 seconds
- ✅ 100% of pending SMS updated on source data change

### SMS Delivery
- ✅ Delivery rate > 95%
- ✅ All pending SMS sent within 10 minutes of scheduled time
- ✅ Failed SMS logged with error message

### Frontend
- ✅ Page load < 2 seconds
- ✅ No "undefined" values in table
- ✅ Filters return results in < 100ms
- ✅ Sort operations instant (< 50ms)

---

## 📞 Emergency Procedures

### SMS Not Sending

```bash
# 1. Check cron job is running
ps aux | grep node
# Should show smsScheduler.js process

# 2. Check Semaphore API credentials
echo $SEMAPHORE_API_KEY
# Must not be empty

# 3. Manually trigger SMS send
POST /api/sms/send-pending
# (Create this endpoint for emergency use)

# 4. Check Semaphore balance
# Log in to Semaphore dashboard
```

---

### Cascade Broken

```bash
# 1. Verify setImmediate() exists in models
grep -r "setImmediate" backend/models/

# 2. Check cascade functions exist
grep -r "updatePhoneNumberForPatient" backend/services/

# 3. Temporarily disable cascade (emergency only)
# Comment out setImmediate() calls in models

# 4. Manually fix SMS data
UPDATE sms_logs 
SET phone_number = '+639171234567'
WHERE guardian_id = ? AND status = 'pending';
```

---

### Database Issues

```bash
# 1. Check connection
psql -U <user> -d <database> -c "SELECT 1"

# 2. Verify tables exist
\dt sms_logs
\dt sms_log_patientschedule

# 3. Check indexes
\di sms_logs

# 4. Rebuild indexes if slow
REINDEX TABLE sms_logs;
```

---

## 🎓 Training Quick Start

### For Health Workers

1. **Creating Schedules**
   - Schedule appointments as normal
   - SMS automatically created (no action needed)
   - Check "SMS Logs" page to verify

2. **Updating Guardian Info**
   - Update phone/name in Guardian profile
   - SMS automatically updated
   - No need to manually edit SMS

3. **Rescheduling Appointments**
   - Reschedule as normal
   - Old SMS automatically deleted
   - New SMS automatically created

4. **Sending Manual SMS**
   - Go to "SMS Logs" page
   - Click "Manual" button
   - Fill form and send
   - Use templates for consistency

### For Admins

1. **Monitoring SMS**
   - Check "SMS Logs" page daily
   - Filter by "Failed" status
   - Investigate and resend if needed

2. **Managing Templates**
   - Go to "SMS Templates" page
   - Edit templates carefully (variables in {})
   - Test with "Preview" before saving

3. **Database Maintenance**
   - Run weekly checks (see Monitoring section)
   - Archive old sent SMS (> 6 months)
   - Monitor database size

4. **Troubleshooting**
   - Check console logs for cascade errors
   - Verify phone numbers format (+63...)
   - Contact developer if persistent issues

---

**Last Updated**: February 2025  
**Version**: 2.0  
**Next Review**: After production deployment testing

