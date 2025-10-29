# SMS Cascade Updates Implementation

## Summary
Implemented **automatic cascading updates** for SMS logs when related data changes. When guardian contact, patient name, or schedule date is updated, all pending SMS reminders automatically reflect the changes.

---

## What Changed

### 1. New Service Functions (`services/smsReminderService.js`)

Added three cascade functions:

#### `updatePhoneNumberForPatient(patientId, newPhoneNumber, client)`
**Purpose:** Update phone number in all pending SMS logs when guardian contact changes

**Behavior:**
- Finds all pending/scheduled SMS logs for the patient
- Updates `phone_number` field to new value
- Only affects SMS with status `pending` or `scheduled`
- Only affects SMS with type `scheduled` or `manual`

**Usage:**
```javascript
await updatePhoneNumberForPatient(patientId, '+639123456789', supabase);
```

---

#### `handleScheduleReschedule(patientScheduleId, client)`
**Purpose:** Recreate SMS reminders when a schedule is rescheduled

**Behavior:**
1. **Deletes old reminders:**
   - Finds all SMS logs linked to this `patient_schedule_id`
   - Deletes those that are still `pending` or `scheduled`
   - Preserves already-sent messages

2. **Creates new reminders:**
   - Calls `scheduleReminderLogsForPatientSchedule()` to regenerate
   - Uses new `scheduled_date` to compute reminder times
   - Combines with same-day schedules (if any)

**Usage:**
```javascript
await handleScheduleReschedule(patientScheduleId, supabase);
```

---

#### `updateMessagesForPatient(patientId, client)`
**Purpose:** Regenerate message content when patient/guardian/vaccine data changes

**Behavior:**
- Finds all pending SMS logs for the patient
- Fetches current patient data (name, guardian info)
- Fetches linked schedules and vaccines
- Regenerates message using active template
- Replaces all template variables with current data
- Updates `message` field in SMS logs

**Template Variables Updated:**
- `{patient_name}` - Patient's current full name
- `{guardian_title}` - Ms./Mr. based on current relationship
- `{guardian_last_name}` - Guardian's current last name
- `{vaccine_name}` - Current vaccine names (combined if multiple)
- `{dose_number}` - Current dose numbers

**Usage:**
```javascript
await updateMessagesForPatient(patientId, supabase);
```

---

## 2. Guardian Model Integration (`models/guardianModel.js`)

### Updated: `updateGuardian(id, guardianData)`

**CASCADE TRIGGERS:**

1. **When `contact_number` changes:**
   - Fetches all patients under this guardian
   - Calls `updatePhoneNumberForPatient()` for each patient
   - Updates all pending SMS with new phone number

2. **When name changes** (`firstname`, `lastname`, `middlename`):
   - Fetches all patients under this guardian
   - Calls `updateMessagesForPatient()` for each patient
   - Regenerates SMS messages with updated guardian name

**Example Flow:**
```javascript
// Guardian's phone updated from 09123456789 to 09987654321
await guardianModel.updateGuardian(123, { 
  contact_number: '09987654321' 
});

// Result:
// ✓ Guardian record updated
// ✓ All pending SMS for guardian's children updated with new phone
```

---

### Updated: `syncGuardianFromUser(userOrId, actorId)`

**PURPOSE:** Called when a user with role 'guardian' is updated via `PUT /api/users/:id`

**CASCADE TRIGGERS:**

Same as `updateGuardian()` - ensures SMS updates happen whether you:
- Update via `/api/guardians/:id` (direct guardian update)
- Update via `/api/users/:id` (user update that syncs to guardian)

**Flow:**
1. User table updated with new contact_number
2. `syncGuardianFromUser()` syncs changes to guardians table
3. Detects contact_number change
4. **NEW:** Cascades phone update to all pending SMS logs

**Example:**
```javascript
// Update guardian user's phone via user API
PUT /api/users/123
{ "contact_number": "09987654321" }

// Automatic flow:
// 1. users.contact_number updated
// 2. guardians.contact_number synced
// 3. All pending SMS phone_number updated ✅
```

---

## 3. Patient Model Integration (`models/patientModel.js`)

### Updated: `updatePatient(id, patientData, client)`

**CASCADE TRIGGERS:**

**When patient name changes** (`firstname`, `lastname`, `middlename`):
- Calls `updateMessagesForPatient()` for this patient
- Regenerates all pending SMS messages
- Updates `{patient_name}` variable in templates

**Example Flow:**
```javascript
// Patient name updated
await patientModel.updatePatient(456, { 
  firstname: 'Maria',
  lastname: 'Santos'
});

// Result:
// ✓ Patient record updated
// ✓ All pending SMS regenerated with "Maria Santos"
```

---

## 4. Immunization Model Integration (`models/immunizationModel.js`)

### Updated: `updatePatientSchedule(patientScheduleId, updateData, client)`

**CASCADE TRIGGERS:**

**When `scheduled_date` changes:**
1. Calls RPC `smart_reschedule_patientschedule` (existing validation)
2. **NEW:** Calls `handleScheduleReschedule()` to update SMS
3. Deletes old pending reminders for old date
4. Creates new reminders for new date with correct timing

**Example Flow:**
```javascript
// Schedule moved from Nov 15 → Nov 22
await immunizationModel.updatePatientSchedule(789, {
  scheduled_date: '2025-11-22',
  updated_by: userId
});

// Result:
// ✓ Schedule updated in database
// ✓ Old SMS reminders (Nov 8, 12, 14, 15) deleted
// ✓ New SMS reminders (Nov 15, 19, 21, 22) created at 08:00
```

---

### Updated: `reschedulePatientSchedule(patientScheduleId, newDate, userId, client)`

**CASCADE TRIGGERS:**

Same as `updatePatientSchedule` - automatically recreates SMS after reschedule RPC.

---

## Cascade Update Matrix

| **Data Change**               | **SMS Field Updated**        | **Function Called**                      | **Affected SMS**                  |
|-------------------------------|------------------------------|------------------------------------------|-----------------------------------|
| Guardian contact number       | `phone_number`               | `updatePhoneNumberForPatient()`          | All pending for patient           |
| Guardian name                 | `message` (guardian_title)   | `updateMessagesForPatient()`             | All pending for patient           |
| Patient name                  | `message` (patient_name)     | `updateMessagesForPatient()`             | All pending for patient           |
| Schedule date                 | `scheduled_at`, `message`    | `handleScheduleReschedule()`             | All linked to this schedule       |
| Vaccine changed (rare)        | `message` (vaccine_name)     | `updateMessagesForPatient()`             | All pending for patient           |

---

## Examples

### Scenario 1: Guardian Changes Phone Number

**Initial State:**
```
Guardian ID: 100
Contact: 09123456789
Children: Patient 1, Patient 2

SMS Logs:
- ID 50: Patient 1, phone 09123456789, status 'pending', "... Ms. Cruz! ..."
- ID 51: Patient 1, phone 09123456789, status 'pending', "... Ms. Cruz! ..."
- ID 52: Patient 2, phone 09123456789, status 'pending', "... Ms. Cruz! ..."
```

**Action:**
```javascript
await guardianModel.updateGuardian(100, { 
  contact_number: '09987654321' 
});
```

**Result:**
```
SMS Logs (UPDATED):
- ID 50: Patient 1, phone 09987654321, status 'pending', "... Ms. Cruz! ..."
- ID 51: Patient 1, phone 09987654321, status 'pending', "... Ms. Cruz! ..."
- ID 52: Patient 2, phone 09987654321, status 'pending', "... Ms. Cruz! ..."
```

---

### Scenario 2: Patient Name Updated

**Initial State:**
```
Patient ID: 200
Name: "Juan Dela Cruz"

SMS Logs:
- ID 60: "... your child, Juan Dela Cruz has BCG ..."
- ID 61: "... your child, Juan Dela Cruz has BCG ..."
```

**Action:**
```javascript
await patientModel.updatePatient(200, { 
  firstname: 'Maria',
  lastname: 'Santos'
});
```

**Result:**
```
SMS Logs (UPDATED):
- ID 60: "... your child, Maria Santos has BCG ..."
- ID 61: "... your child, Maria Santos has BCG ..."
```

---

### Scenario 3: Schedule Rescheduled

**Initial State:**
```
Patient Schedule ID: 300
Patient ID: 200
Vaccine: BCG, Dose 1
Scheduled Date: 2025-11-15

SMS Logs:
- ID 70: scheduled_at 2025-11-08 08:00, message "... scheduled on 2025-11-15 ..."
- ID 71: scheduled_at 2025-11-12 08:00, message "... scheduled on 2025-11-15 ..."
- ID 72: scheduled_at 2025-11-14 08:00, message "... scheduled on 2025-11-15 ..."
- ID 73: scheduled_at 2025-11-15 08:00, message "... scheduled on 2025-11-15 ..."

sms_log_patientschedule:
- (70, 300)
- (71, 300)
- (72, 300)
- (73, 300)
```

**Action:**
```javascript
await immunizationModel.updatePatientSchedule(300, {
  scheduled_date: '2025-11-22',
  updated_by: userId
});
```

**Process:**
1. RPC updates schedule date to Nov 22
2. `handleScheduleReschedule()` called:
   - Finds sms_log_ids: [70, 71, 72, 73]
   - Deletes SMS logs 70-73 (status pending)
   - Deletes link rows from sms_log_patientschedule
3. `scheduleReminderLogsForPatientSchedule()` called:
   - Creates new SMS logs with new dates

**Result:**
```
Patient Schedule ID: 300
Scheduled Date: 2025-11-22 (UPDATED)

SMS Logs (NEW):
- ID 74: scheduled_at 2025-11-15 08:00, message "... scheduled on 2025-11-22 ..."
- ID 75: scheduled_at 2025-11-19 08:00, message "... scheduled on 2025-11-22 ..."
- ID 76: scheduled_at 2025-11-21 08:00, message "... scheduled on 2025-11-22 ..."
- ID 77: scheduled_at 2025-11-22 08:00, message "... scheduled on 2025-11-22 ..."

sms_log_patientschedule (NEW):
- (74, 300)
- (75, 300)
- (76, 300)
- (77, 300)
```

---

## Edge Cases Handled

### 1. Already Sent SMS
**Scenario:** Guardian changes phone after some SMS already sent

**Behavior:**
- Only updates SMS with status `pending` or `scheduled`
- Already-sent SMS (status `sent`, `failed`) remain unchanged
- Preserves historical record

### 2. Multiple Schedules Same Day
**Scenario:** Patient has 3 vaccines on Nov 15, reschedule ALL to Nov 22

**Behavior:**
- Deletes old combined SMS (single message covering all 3)
- Creates new combined SMS for Nov 22
- Still only 4 SMS total (not 12)

### 3. Partial Reschedule
**Scenario:** Patient has BCG + Hepatitis on Nov 15, reschedule only BCG to Nov 22

**Behavior:**
- Deletes old combined SMS covering both vaccines
- Creates new SMS for BCG alone on Nov 22
- Creates new SMS for Hepatitis alone on Nov 15
- Total: 8 SMS (4 for each schedule)

### 4. Schedule in Past
**Scenario:** Reschedule to a date where some reminders already passed

**Behavior:**
- `scheduleReminderLogsForPatientSchedule()` only creates future reminders
- If new date is Nov 10 and today is Nov 9:
  - No 7-day, 3-day, 1-day reminders created (in past)
  - Only 0-day reminder created for Nov 10 08:00

### 5. Non-blocking Failures
**Scenario:** SMS cascade update fails (network, database error)

**Behavior:**
- Main update (guardian, patient, schedule) **succeeds immediately**
- API returns 200 OK - user sees success toast ✅
- Cascade runs in background
- If cascade fails: Error logged to console (non-fatal)
- If cascade succeeds: Success logged to console
- Admin can check server logs to verify cascade completion
- Admin can manually trigger update if needed

**Example:**
```javascript
PUT /api/users/123 { contact_number: "09111" }
// → 200 OK returned immediately
// → Background: SMS cascade starts
// → Background: Error logged if fails (doesn't affect API response)
// → Background: Success logged if succeeds
```

---

## Performance Considerations

### Non-Blocking Background Processing
**All cascade updates now run in the background** using `setImmediate()`:

- ✅ **API responds immediately** - No timeout errors
- ✅ **Cascade happens asynchronously** - Updates SMS in background
- ✅ **Success logged** - Console shows when cascade completes
- ✅ **Errors logged** - Console shows if cascade fails (non-fatal)

**Example Timeline:**
```
00:00 - User updates guardian phone via API
00:01 - API returns 200 OK (guardian updated)
00:01 - Toast shows "Success!" ✅
00:02 - Background: SMS cascade starts
00:03 - Background: SMS logs updated
00:03 - Console: "Successfully cascaded phone update to 5 patient(s)"
```

### Batch Updates
If updating multiple guardians/patients, cascade updates run serially in background:
```javascript
// Updates guardian 1
await updateGuardian(1, { contact_number: '09111' });
  // Returns immediately ✅
  // → Background: Updates 5 patients × 4 SMS each = 20 SMS updates

// Updates guardian 2  
await updateGuardian(2, { contact_number: '09222' });
  // Returns immediately ✅
  // → Background: Updates 3 patients × 4 SMS each = 12 SMS updates
```

### Database Load
- **Guardian phone update:** ~1-2 queries per patient (background)
- **Name update:** ~5-10 queries per patient (background)
- **Schedule reschedule:** ~5-10 queries total (background)

For systems with **thousands of patients**:
- Current implementation handles moderate load well
- Consider job queue for very large batches (1000+ patients)
- Monitor server logs for cascade completion times

---

## Testing Checklist

- [x] Update guardian phone → verify SMS logs updated
- [x] Update guardian name → verify SMS messages regenerated
- [x] Update patient name → verify SMS messages regenerated
- [x] Reschedule single vaccine → verify SMS recreated with new dates
- [x] Reschedule combined vaccines → verify single SMS per offset
- [x] Reschedule to past date → verify only future SMS created
- [x] Reschedule after some SMS sent → verify only pending updated
- [ ] Manual end-to-end test of all scenarios

---

## Migration Steps

**No database migrations required!** All changes are in application code.

1. **Deploy updated files:**
   - `services/smsReminderService.js`
   - `models/guardianModel.js`
   - `models/patientModel.js`
   - `models/immunizationModel.js`

2. **Restart backend server:**
   ```bash
   npm start
   ```

3. **Test cascade updates:**
   - Update a guardian's phone via API
   - Check `sms_logs` table for updated phone numbers
   - Reschedule a patient schedule
   - Verify old SMS deleted and new SMS created

---

## Future Enhancements

- [ ] Cascade update for vaccine changes (currently rare)
- [ ] Bulk update API with progress tracking
- [ ] Background job queue for large cascades
- [ ] Audit log for cascade update history
- [ ] Admin UI to view affected SMS before/after update
- [ ] Rollback capability for accidental cascades

---

## Notes

- **All cascades are non-blocking** - main operation succeeds even if SMS update fails
- **Only pending SMS affected** - sent/failed messages preserved for audit trail
- **Template system respected** - regenerated messages use current active templates
- **Same-day combination preserved** - reschedules maintain one-SMS-per-day logic

---

## API Impact

No breaking changes! All existing endpoints work as before, with **automatic** cascade updates:

- `PUT /api/guardians/:id` - now updates SMS phone/messages
- `PUT /api/users/:id` - now updates SMS phone/messages (when user is guardian) ✨
- `PUT /api/patients/:id` - now updates SMS messages  
- `PUT /api/immunizations/schedule/:id` - now recreates SMS on reschedule
- `POST /api/immunizations/reschedule` - now recreates SMS on reschedule

**Important:** Whether you update the guardian via the user API or guardian API, the SMS cascade will work! ✅

Zero frontend changes required! 🎉
