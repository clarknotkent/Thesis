# SMS Management Backend Implementation

## Overview
Complete SMS management backend integrated with PhilSMS API for the ImmunizeMe vaccination system.

## Files Created/Modified

### 1. Services
- **`backend/services/smsService.js`** - PhilSMS integration service
  - Phone number formatting (+63 format)
  - Single SMS sending
  - Bulk SMS sending with rate limiting
  - Template variable replacement

### 2. Controllers
- **`backend/controllers/smsController.js`** - Updated with full functionality
  - Send SMS notifications (manual/auto)
  - Get SMS history with filtering/pagination
  - SMS template CRUD operations
  - Guardian auto-send settings management
  - Bulk operations
  - Statistics endpoint

### 3. Routes
- **`backend/routes/smsRoutes.js`** - Complete API endpoints
  ```
  POST   /api/sms                          - Send SMS
  POST   /api/sms/bulk                     - Send bulk SMS
  GET    /api/sms/history                  - Get SMS logs
  GET    /api/sms/statistics               - Get statistics
  
  GET    /api/sms/templates                - List templates
  POST   /api/sms/templates                - Create template
  PUT    /api/sms/templates/:id            - Update template
  DELETE /api/sms/templates/:id            - Delete template
  
  GET    /api/sms/guardians                - List guardian settings
  PUT    /api/sms/guardians/:guardianId    - Toggle auto-send
  POST   /api/sms/guardians/bulk-toggle    - Bulk toggle auto-send
  ```

### 4. Database Migration
- **`db/2025-10-27_sms_management_tables.sql`**
  - `sms_logs` - Message history logging
  - `sms_templates` - Reusable message templates
  - `guardian_auto_send_settings` - Per-guardian auto-send preferences
  - Sample templates (1-week, 3-days, 1-day, manual)

### 5. Configuration
- **`backend/.env`** - Added PhilSMS credentials
  ```
  PHILSMS_API_KEY=362|jA3v0uuHjeHXb4LcPvVo4EWutmyLfLstje0WuIsX
  PHILSMS_SENDER_ID=Eulap
  ```

## Database Schema

### sms_logs
```sql
- id: SERIAL PRIMARY KEY
- guardian_id: INTEGER (FK to guardians)
- patient_id: INTEGER (FK to patients)
- phone_number: VARCHAR(20)
- message: TEXT
- type: VARCHAR(20) ('manual', 'auto', '1-week', '3-days', '1-day')
- status: VARCHAR(20) ('pending', 'sent', 'failed')
- error_message: TEXT
- sent_at: TIMESTAMP
- created_at: TIMESTAMP
```

### sms_templates
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100)
- template: TEXT
- trigger_type: VARCHAR(20) ('1-week', '3-days', '1-day', 'manual')
- time_range: VARCHAR(50)
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### guardian_auto_send_settings
```sql
- id: SERIAL PRIMARY KEY
- guardian_id: INTEGER (UNIQUE, FK to guardians)
- auto_send_enabled: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Template Variables

Messages support the following variables:
- `{guardian_name}` - Guardian's full name
- `{patient_name}` - Patient's full name
- `{vaccine_name}` - Name of the vaccine
- `{appointment_date}` - Appointment date
- `{appointment_time}` - Appointment time
- `{health_center}` - Health center name
- `{days_until}` - Days until appointment

## API Usage Examples

### Send Manual SMS
```javascript
POST /api/sms
{
  "phoneNumber": "09171234567",
  "message": "Your appointment is scheduled.",
  "type": "manual",
  "guardianId": 1,
  "patientId": 5
}
```

### Get SMS History
```javascript
GET /api/sms/history?status=sent&type=auto&page=1&limit=10&search=Juan
```

### Create Template
```javascript
POST /api/sms/templates
{
  "name": "1 Week Reminder",
  "template": "Hi {guardian_name}, {patient_name} has vaccination in 1 week.",
  "trigger_type": "1-week",
  "time_range": "08:00-10:00",
  "is_active": true
}
```

### Toggle Guardian Auto-Send
```javascript
PUT /api/sms/guardians/123
{
  "auto_send_enabled": true
}
```

### Bulk Toggle
```javascript
POST /api/sms/guardians/bulk-toggle
{
  "guardianIds": [1, 2, 3, 4],
  "auto_send_enabled": false
}
```

## Next Steps

### 1. Run Database Migration
```bash
psql -U your_user -d your_database -f db/2025-10-27_sms_management_tables.sql
```

### 2. Install Dependencies
PhilSMS integration uses `axios` which should already be in your backend dependencies.

### 3. Test Endpoints
- Use Postman/Thunder Client to test endpoints
- Verify PhilSMS API connectivity
- Test template variable replacement

### 4. Future Enhancements
- **Scheduler**: Cron job to send auto reminders based on vaccination schedules
- **Rate Limiting**: Add Redis for SMS rate limiting
- **Message Queue**: Bull/BullMQ for handling large SMS batches
- **Analytics Dashboard**: Message delivery rates, cost tracking
- **Webhook Handler**: Receive delivery status updates from PhilSMS
- **Cost Tracking**: Track SMS costs per guardian/patient

## PhilSMS Integration Details

- **API Endpoint**: `https://app.philsms.com/api/v3/sms/send`
- **Authentication**: Bearer token
- **Phone Format**: +63XXXXXXXXXX
- **Rate Limiting**: 500ms delay between messages in bulk operations
- **Timeout**: 30 seconds per request

## Security Notes

- All SMS routes require authentication (`authenticateRequest`)
- Admin-only operations: templates CRUD, guardian settings, bulk operations
- Health workers can send SMS and view history
- API key stored in environment variables (never commit to git)
- User mapping checked before SMS operations

## Testing Checklist

- [ ] Send manual SMS to valid Philippine number
- [ ] Test phone number formatting (with/without +63, starting with 0)
- [ ] Create/update/delete templates
- [ ] Toggle individual guardian auto-send
- [ ] Bulk toggle guardian settings
- [ ] View SMS history with filters
- [ ] Check statistics endpoint
- [ ] Verify database logging of sent/failed messages
- [ ] Test template variable replacement

## Frontend Integration

The frontend components are ready:
- **MessageLogs.vue** - Display SMS history
- **MessageTemplates.vue** - Manage templates
- **AutoSendSettings.vue** - Guardian auto-send configuration

Connect to backend using axios calls to the endpoints listed above.
