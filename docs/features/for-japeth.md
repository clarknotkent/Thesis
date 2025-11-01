# For Japeth - SMS Management Backend Setup Instructions

## Overview
Complete SMS Management system has been built with PhilSMS integration. Follow these steps to set it up.

---

## 📋 Step 1: Database Migration

Run the SQL migration to create the required tables:

```bash
psql -U postgres -d immunizeme_db -f db/2025-10-27_sms_management_tables.sql
```

**Or if you're using Supabase:**
1. Go to Supabase Dashboard > SQL Editor
2. Copy the contents of `db/2025-10-27_sms_management_tables.sql`
3. Paste and run it

This creates:
- `sms_logs` - Stores all SMS message history
- `sms_templates` - Reusable message templates
- `guardian_auto_send_settings` - Per-guardian auto-send preferences
- 4 sample templates (1-week, 3-days, 1-day, manual reminders)

---

## 🔧 Step 2: Environment Variables

The PhilSMS credentials are already added to `backend/.env`:

```env
PHILSMS_API_KEY=362|jA3v0uuHjeHXb4LcPvVo4EWutmyLfLstje0WuIsX
PHILSMS_SENDER_ID=Eulap
```

✅ **No action needed** - These are already configured.

---

## 🚀 Step 3: Restart Backend Server

Restart your backend to load the new SMS service:

```bash
cd backend
npm start
```

Or if using nodemon:
```bash
npm run dev
```

---

## � Step 4: Test the API Endpoints

### Test Template Preview
First, preview a template to see how it works:

```bash
POST http://localhost:3000/api/sms/templates/preview
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "templateId": 1,
  "variables": {
    "guardianLastName": "Aspa",
    "guardianGender": "male",
    "patientName": "Clark",
    "vaccineName": "BCG",
    "doseNumber": "1",
    "appointmentDate": "May 24, 2025",
    "currentHour": 10
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "template": "Good {greeting_time}, {guardian_title}. {guardian_last_name}...",
    "preview": "Good Day, Mr. Aspa. Your child, Clark, is scheduled for vaccination on May 24, 2025 for BCG Dose 1.",
    "variables": { ... }
  }
}
```

### Test SMS Sending with Template
```bash
POST http://localhost:3000/api/sms
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "phoneNumber": "09171234567",
  "templateId": 1,
  "variables": {
    "guardianLastName": "Aspa",
    "guardianGender": "male",
    "patientName": "Clark",
    "vaccineName": "BCG",
    "doseNumber": "1",
    "appointmentDate": "May 24, 2025"
  },
  "type": "1-week",
  "guardianId": 1,
  "patientId": 5
}
```

### Test Manual Message (No Template)
```bash
POST http://localhost:3000/api/sms
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "phoneNumber": "09171234567",
  "message": "This is a custom test message from ImmunizeMe",
  "type": "manual",
  "guardianId": 1
}
```

### Test Getting SMS History
```bash
GET http://localhost:3000/api/sms/history?page=1&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

### Test Getting Templates
```bash
GET http://localhost:3000/api/sms/templates
Authorization: Bearer YOUR_JWT_TOKEN
```

### Test Guardian Auto-Send Settings
```bash
GET http://localhost:3000/api/sms/guardians
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📝 Available API Endpoints

All endpoints require authentication. Admin role required unless noted.

### SMS Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sms` | Send SMS (manual or using template) |
| POST | `/api/sms/bulk` | Send bulk SMS |
| GET | `/api/sms/history` | Get SMS logs (supports filtering) |
| GET | `/api/sms/statistics` | Get SMS statistics |
| POST | `/api/sms/templates/preview` | Preview template with variables |

### Template Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sms/templates` | List all templates |
| POST | `/api/sms/templates` | Create new template |
| PUT | `/api/sms/templates/:id` | Update template |
| DELETE | `/api/sms/templates/:id` | Delete template |

### Guardian Auto-Send Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sms/guardians` | List guardian settings |
| PUT | `/api/sms/guardians/:guardianId` | Toggle auto-send for guardian |
| POST | `/api/sms/guardians/bulk-toggle` | Bulk enable/disable auto-send |

---

## 📋 How Templates Work

Templates are **formatters**, not fixed messages. They contain **variables** that get replaced with actual data when sending.

### Template Variables
Available variables you can use in templates:

**Guardian Information:**
- `{greeting_time}` - Auto: "Day" (6am-5:59pm) or "Evening" (6pm-5:59am)
- `{guardian_title}` - Auto: "Mr." (male) or "Ms." (female) based on gender
- `{guardian_name}` - Guardian's full name
- `{guardian_first_name}` - Guardian's first name
- `{guardian_last_name}` - Guardian's last name
- `{guardianGender}` - Pass 'male' or 'female' to determine title

**Patient & Appointment:**
- `{patient_name}` - Patient's full name (first name typically)
- `{vaccine_name}` - Name of the vaccine (e.g., "BCG", "Hepatitis B")
- `{dose_number}` - Dose number: 1, 2, or 3
- `{appointment_date}` - Full date (e.g., "May 24, 2025")
- `{scheduled_date}` - Same as appointment_date
- `{appointment_time}` - Time of appointment
- `{health_center}` - Health center name (default: "Barangay Health Center")
- `{days_until}` - Days until appointment

### Official Template Structure

Based on your specifications:

**1 Week & 3 Days Before Template:**
```
Good {greeting_time}, {guardian_title}. {guardian_last_name}.
Your child, {patient_name}, is scheduled for vaccination on {appointment_date}
for {vaccine_name} Dose {dose_number}.
```

**1 Day Before Template:**
```
Good {greeting_time}, {guardian_title}. {guardian_last_name}.
Your child, {patient_name}, is scheduled for vaccination tomorrow, {appointment_date}
for {vaccine_name} Dose {dose_number}.
```

### Example Template Usage

**Template:**
```
Good {greeting_time}, {guardian_title}. {guardian_last_name}.
Your child, {patient_name}, is scheduled for vaccination on {appointment_date}
for {vaccine_name} Dose {dose_number}.
```

**Variables sent at 10:00 AM:**
```json
{
  "guardianLastName": "Aspa",
  "guardianGender": "male",
  "patientName": "Clark",
  "appointmentDate": "May 24, 2025",
  "vaccineName": "BCG",
  "doseNumber": "1"
}
```

**Result:**
```
Good Day, Mr. Aspa.
Your child, Clark, is scheduled for vaccination on May 24, 2025
for BCG Dose 1.
```

**If sent at 8:00 PM:**
```
Good Evening, Mr. Aspa.
Your child, Clark, is scheduled for vaccination on May 24, 2025
for BCG Dose 1.
```

### Sending SMS with Template

**Method 1: Use Template ID (Recommended)**
```json
POST /api/sms
{
  "phoneNumber": "09171234567",
  "templateId": 1,
  "variables": {
    "guardianLastName": "Aspa",
    "guardianGender": "male",
    "patientName": "Clark",
    "vaccineName": "BCG",
    "doseNumber": "1",
    "appointmentDate": "May 24, 2025"
  },
  "type": "1-week",
  "guardianId": 5,
  "patientId": 12
}
```

**Method 2: Custom Message (No Template)**
```json
POST /api/sms
{
  "phoneNumber": "09171234567",
  "message": "Your appointment is confirmed for tomorrow.",
  "type": "manual",
  "guardianId": 5,
  "patientId": 12
}
```

### Preview Template Before Sending

Test how your template will look:

```json
POST /api/sms/templates/preview
{
  "templateId": 1,
  "variables": {
    "guardianLastName": "Aspa",
    "guardianGender": "male",
    "patientName": "Clark",
    "vaccineName": "BCG",
    "doseNumber": "1",
    "appointmentDate": "May 24, 2025",
    "currentHour": 10
  }
}

Response:
{
  "success": true,
  "data": {
    "template": "Good {greeting_time}, {guardian_title}. {guardian_last_name}...",
    "preview": "Good Day, Mr. Aspa. Your child, Clark...",
    "variables": { ... }
  }
}
```

### Time-Based Greeting Logic

The system automatically determines "Day" or "Evening":
- **6:00 AM - 5:59 PM** → "Good Day"
- **6:00 PM - 5:59 AM** → "Good Evening"

You can override by passing `currentHour` (0-23) in variables for testing.

### Gender-Based Title Logic

The system automatically determines "Mr." or "Ms.":
- Pass `"guardianGender": "male"` → "Mr."
- Pass `"guardianGender": "female"` → "Ms."
- If not provided → defaults to "Mr."

---

## 🎨 Frontend Integration

The frontend components are already built and ready:

### Navigation
- Sidebar link: "SMS Management" (already configured)
- Route: `/admin/sms-management`

### Components Location
```
frontend/src/features/admin/sms/components/
├── MessageLogs.vue       - SMS history table
├── MessageTemplates.vue  - Template management
└── AutoSendSettings.vue  - Guardian auto-send settings
```

### Main Page
```
frontend/src/views/admin/sms/SMSManagement.vue
```

**To test the frontend:**
1. Login as admin
2. Click "SMS Management" in sidebar
3. You'll see 3 tabs: Message Logs, Message Templates, Auto-Send Settings

---

## 🔍 Testing Checklist

### Backend Tests
- [ ] Database migration ran successfully
- [ ] Backend server started without errors
- [ ] Can send SMS to a real Philippine number (09XXXXXXXXX)
- [ ] SMS appears in `sms_logs` table
- [ ] Can create/edit/delete templates
- [ ] Can toggle guardian auto-send settings
- [ ] Phone numbers auto-format to +63 format

### Frontend Tests
- [ ] Navigate to SMS Management page
- [ ] View message logs (should show empty or test messages)
- [ ] View message templates (should show 4 default templates)
- [ ] View auto-send settings (should show guardian list)
- [ ] Test search/filter functionality
- [ ] Test pagination

### Integration Tests
- [ ] Send manual SMS from frontend
- [ ] Create new template from frontend
- [ ] Toggle guardian auto-send from frontend
- [ ] Verify SMS delivery via PhilSMS dashboard

---

## 📱 Phone Number Format

The system automatically handles Philippine phone numbers:

**Accepted formats:**
- `09171234567` → converts to `+639171234567`
- `639171234567` → converts to `+639171234567`
- `+639171234567` → keeps as is

---

## 🔐 Security Notes

- All SMS endpoints require authentication
- Only admins can manage templates and guardian settings
- Health workers can send SMS and view history
- PhilSMS API key is stored in `.env` (never commit to git)

---

## 🐛 Troubleshooting

### "PhilSMS API key not configured"
- Check `backend/.env` has `PHILSMS_API_KEY`
- Restart backend server

### "Failed to send SMS"
- Check PhilSMS account balance
- Verify phone number format
- Check network connectivity
- Review error message in `sms_logs.error_message`

### Database errors
- Ensure migration ran successfully
- Check table exists: `SELECT * FROM sms_logs LIMIT 1;`
- Verify foreign keys (guardians, patients tables must exist)

### Frontend not showing data
- Check browser console for errors
- Verify API endpoints are accessible
- Check authentication token is valid
- Review Network tab for failed requests

---

## 📊 Database Query Examples

**View recent SMS logs:**
```sql
SELECT * FROM sms_logs ORDER BY sent_at DESC LIMIT 10;
```

**Check SMS statistics:**
```sql
SELECT 
  status, 
  type, 
  COUNT(*) as count 
FROM sms_logs 
GROUP BY status, type;
```

**View active templates:**
```sql
SELECT * FROM sms_templates WHERE is_active = true;
```

**Check guardians with auto-send enabled:**
```sql
SELECT 
  g.first_name, 
  g.last_name, 
  g.phone_number,
  gas.auto_send_enabled
FROM guardians g
LEFT JOIN guardian_auto_send_settings gas ON g.id = gas.guardian_id
WHERE gas.auto_send_enabled = true;
```

---

## 🚀 Future Enhancements (Not Yet Implemented)

These are suggestions for future development:

1. **Automated Scheduler**
   - Cron job to send reminders based on vaccination schedules
   - Check 1-week, 3-days, 1-day before appointments
   - Use templates with variable replacement

2. **Message Queue**
   - Use Bull/BullMQ for bulk SMS processing
   - Better handling of large batches

3. **Delivery Status Webhooks**
   - Receive status updates from PhilSMS
   - Update `sms_logs.status` automatically

4. **Cost Tracking**
   - Track SMS costs per guardian/patient
   - Monthly spending reports

5. **SMS Analytics Dashboard**
   - Delivery rate charts
   - Response time metrics
   - Failed message analysis

---

## 📞 Support

If you encounter issues:

1. Check the `backend/SMS_BACKEND_README.md` for detailed API documentation
2. Review error logs in terminal
3. Check database logs
4. Verify PhilSMS account status at https://app.philsms.com

---

## ✅ Quick Verification

**Backend working?**
```bash
curl http://localhost:3000/api/sms/statistics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Frontend working?**
- Navigate to: `http://localhost:5173/admin/sms-management`
- Should see tabs and statistics cards

---

## 🎉 You're Done!

Once all tests pass, the SMS Management system is fully operational and ready to send vaccination reminders!

**Key Features:**
- ✅ Send manual SMS
- ✅ View message history with filters
- ✅ Manage reusable templates
- ✅ Per-guardian auto-send control
- ✅ Bulk operations
- ✅ Statistics dashboard
