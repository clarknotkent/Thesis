# Cascading Update System - Quick Reference

## What Is It?

When you update data that's used in SMS messages (guardian phone, patient name, schedule date), **all related pending SMS automatically update** to reflect the changes.

---

## What Updates Cascade?

| **You Update**                | **SMS Updates Automatically**                     |
|-------------------------------|---------------------------------------------------|
| Guardian contact number       | Phone number in all pending SMS                   |
| Guardian name                 | Message content (guardian title/last name)        |
| Patient name                  | Message content (patient name)                    |
| Schedule date (reschedule)    | Delete old SMS, create new SMS with correct dates |

---

## How It Works

### 1. Guardian Phone Change
```
You: Update guardian contact_number
     ↓
System: Updates phone_number in all pending SMS for guardian's children
        (Runs in BACKGROUND - API returns immediately!)
        (Only affects status='pending' or 'scheduled')
```

### 2. Name Changes (Guardian or Patient)
```
You: Update guardian or patient name
     ↓
System: Regenerates all pending SMS messages
        Uses current template + updated name data
        Replaces {patient_name}, {guardian_title}, {guardian_last_name}
        (Runs in BACKGROUND - API returns immediately!)
```

### 3. Schedule Reschedule
```
You: Change schedule date (Nov 15 → Nov 22)
     ↓
System: 1) Delete old pending SMS (Nov 8, 12, 14, 15 reminders)
        2) Create new SMS (Nov 15, 19, 21, 22 reminders)
        3) Use new date in {scheduled_date} variable
        (Runs in BACKGROUND - API returns immediately!)
```

---

## Safety Features

✅ **Non-blocking** - API responds immediately, cascade happens in background  
✅ **No timeouts** - User sees success toast right away ✨  
✅ **Preserves history** - Only updates `pending` SMS, not `sent` ones  
✅ **Same-day logic** - Reschedules maintain combined messages  
✅ **No duplicates** - Smart de-duplication prevents double SMS  
✅ **Logged** - Server logs show cascade success/failure  

---

## Example

**Before:**
- Guardian phone: 09123456789
- SMS log: "Good Day, Ms. Cruz! ... (phone: 09123456789, status: pending)"

**After updating guardian phone to 09987654321:**
- SMS log: "Good Day, Ms. Cruz! ... (phone: 09987654321, status: pending)"

**Result:** SMS will be sent to NEW number when scheduler runs! ✅

---

## When Does It Happen?

Automatically on these API calls:

- `PUT /api/guardians/:id` 
- `PUT /api/patients/:id`
- `PUT /api/immunizations/schedule/:id` (if scheduled_date changes)
- `POST /api/immunizations/reschedule`

**No extra code needed in frontend!** Backend handles it all.

---

## Read More

- **Full docs:** `backend/SMS_CASCADE_UPDATES.md`
- **Combined reminders:** `backend/SMS_COMBINED_REMINDERS.md`
- **SMS backend:** `backend/SMS_BACKEND_README.md`
