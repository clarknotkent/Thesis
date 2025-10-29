# SMS Reschedule Logic - Fixed

## 🐛 Problem Identified

**Issue**: When rescheduling a schedule that was combined with others, the system was deleting ALL SMS for ALL schedules on the date, including the ones that weren't moved.

**Example Scenario**:
- Schedule A and B are on Feb 15 (combined into 4 SMS logs)
- User moves Schedule A to Feb 23 (8 days later)
- **Old behavior**: Deleted ALL SMS for both A and B, then only created new SMS for A
- **Result**: Schedule B (which wasn't moved) lost its SMS reminders ❌

---

## ✅ Solution Implemented

### New Smart Reschedule Logic

The `handleScheduleReschedule()` function now uses a **3-step approach**:

#### **STEP 1: Delete Only SMS Linked to the Moved Schedule**
```javascript
// Find and delete ONLY the SMS logs linked to the moved schedule
const { data: linksToDelete } = await supabase
  .from('sms_log_patientschedule')
  .select('sms_log_id')
  .eq('patient_schedule_id', patientScheduleId); // ← Only the moved schedule

const smsLogIds = [...new Set(linksToDelete.map(l => l.sms_log_id))];

// Delete only these specific SMS logs
await supabase
  .from('sms_logs')
  .delete()
  .in('id', smsLogIds)
  .in('status', ['pending', 'scheduled']);
```

**Why**: This ensures we only remove SMS related to the schedule that was actually moved.

---

#### **STEP 2: Recreate SMS for Remaining Schedules on Old Date**
```javascript
// Check if other schedules remain on the old date
const { data: remainingOnOldDate } = await supabase
  .from('patientschedule')
  .select('patient_schedule_id')
  .eq('patient_id', patientId)
  .gte('scheduled_date', `${oldDate}T00:00:00`)
  .lte('scheduled_date', `${oldDate}T23:59:59`)
  .eq('is_deleted', false);

// If schedules remain, recreate combined SMS for them
if (remainingOnOldDate && remainingOnOldDate.length > 0) {
  await scheduleReminderLogsForPatientSchedule(
    remainingOnOldDate[0].patient_schedule_id, 
    supabase
  );
}
```

**Why**: If other schedules were left behind on the old date, they need their SMS reminders recreated (combined if multiple, or standalone if just one).

---

#### **STEP 3: Create SMS for All Schedules on New Date**
```javascript
// Create combined SMS for the new date (including the moved schedule)
await scheduleReminderLogsForPatientSchedule(patientScheduleId, supabase);
```

**Why**: The moved schedule needs new SMS on its new date. If there are other schedules already on that date, they'll be combined automatically by `scheduleReminderLogsForPatientSchedule()`.

---

## 📊 Scenario Coverage

### Scenario 1: Standalone → Standalone
**Before**: 1 schedule on Feb 15  
**Action**: Move to Feb 20  
**Result**:
- ✅ Deletes 4 SMS for Feb 15
- ✅ No schedules remain on Feb 15 (skip step 2)
- ✅ Creates 4 new SMS for Feb 20

---

### Scenario 2: Combined → Separate (The Fix!)
**Before**: Schedule A & B on Feb 15 (4 combined SMS)  
**Action**: Move A to Feb 23  
**Result**:
- ✅ Deletes 4 combined SMS that link to A
- ✅ Finds B remaining on Feb 15
- ✅ Creates 4 new standalone SMS for B on Feb 15
- ✅ Creates 4 new standalone SMS for A on Feb 23

**Before Fix**: B would lose its SMS ❌  
**After Fix**: B keeps its SMS ✅

---

### Scenario 3: Separate → Combined
**Before**: 
- Schedule A on Feb 15 (4 SMS)
- Schedule B on Feb 20 (4 SMS)

**Action**: Move A to Feb 20  
**Result**:
- ✅ Deletes 4 SMS for A
- ✅ No schedules remain on Feb 15 (skip step 2)
- ✅ Finds B already on Feb 20
- ✅ Creates 4 combined SMS for A & B on Feb 20

**Note**: B's old SMS are NOT deleted because `scheduleReminderLogsForPatientSchedule()` checks for existing SMS first and skips creation if they exist for that date.

Wait, this is a problem! Let me check...

Actually, we need to handle this case too. When moving TO a date that already has schedules with SMS, we need to delete those old SMS and recreate combined ones.

---

## 🔧 Additional Fix Needed

Let me update the logic to handle Scenario 3 properly...
