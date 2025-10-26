# SMS Management Subsystem - Implementation Summary

**Created:** October 27, 2025  
**Status:** Frontend Complete ✅  
**Location:** `/features/admin/sms/` & `/views/admin/sms/`

---

## Overview

Complete SMS management system for automated vaccination reminder messages with cost-conscious per-guardian control.

## Architecture

### File Structure
```
features/admin/sms/
├── index.js (feature exports)
└── components/
    ├── MessageLogs.vue (320 lines)
    ├── MessageTemplates.vue (400 lines)
    └── AutoSendSettings.vue (470 lines)

views/admin/sms/
├── SMSManagement.vue (main page with tabs)
└── SMSLogs.vue (legacy)
```

### Routing
- **New Route:** `/admin/sms-management` → SMSManagement.vue
- **Legacy Route:** `/admin/sms` → SMSLogs.vue (kept for compatibility)

---

## Components

### 1. MessageLogs.vue
**Purpose:** Display SMS message history with filtering and search

**Features:**
- Search by recipient, patient, phone number, message content
- Filter by status: sent (green), pending (yellow), failed (red)
- Filter by trigger type: 1-week, 3-days, 1-day, manual
- Date range filtering
- Pagination: 10 items per page
- Message details modal (Bootstrap)
- Color-coded status badges with icons
- Color-coded type badges

**Key Methods:**
- `formatDateTime(date)` - Philippine locale formatting
- `truncateMessage(message, 80)` - Message preview
- `getStatusBadgeClass(status)` - Badge color mapping
- `getTypeBadgeClass(type)` - Type badge color mapping
- `viewMessage(message)` - Show full message modal

**Sample Data:** 3 message logs showing different trigger types

---

### 2. MessageTemplates.vue
**Purpose:** Create and manage SMS message templates with variable substitution

**Features:**
- Card-based template display with hover effects
- Template editor modal (Bootstrap)
- Variable substitution system:
  - `{greeting}` → "Good Day" or "Good Evening"
  - `{title}` → "Mr." or "Ms."
  - `{guardian_name}` → Guardian's full name
  - `{patient_name}` → Child's full name
  - `{scheduled_date}` → Vaccination date
  - `{vaccine_name}` → Vaccine type (e.g., BCG)
  - `{dose_number}` → Dose number (1, 2, 3)
- Live preview with real-time variable substitution
- Trigger type selection: 1-week, 3-days, 1-day before vaccination
- Time range configuration:
  - Day: 6:00 AM - 5:59 PM
  - Evening: 6:00 PM - 5:59 AM
- CRUD operations: Create, Edit, Duplicate, Delete
- Active/Inactive toggle per template
- Character counter (160 SMS limit)
- Toast notifications for user feedback

**Key Methods:**
- `createNewTemplate()` - Open blank template modal
- `editTemplate(template)` - Pre-fill modal with existing data
- `duplicateTemplate(template)` - Copy template with "(Copy)" suffix
- `saveTemplate()` - Create or update template
- `deleteTemplate(id)` - Remove template with confirmation
- `toggleTemplateStatus(template)` - Toggle active/inactive
- `previewMessage()` - Real-time variable substitution

**Sample Templates:**
1. **1-Week Reminder:** "Good {greeting}, {title} {guardian_name}. Your child, {patient_name}, is scheduled for vaccination on {scheduled_date} for {vaccine_name} Dose {dose_number}."
2. **3-Days Reminder:** Same format as 1-week
3. **1-Day Reminder:** "Good {greeting}, {title} {guardian_name}. Your child, {patient_name}, is scheduled for vaccination tomorrow, {scheduled_date} for {vaccine_name} Dose {dose_number}."

---

### 3. AutoSendSettings.vue
**Purpose:** Control automated SMS sending on a per-guardian basis (cost management)

**Features:**
- **Global Master Switch:**
  - Large toggle (3em × 1.5em) for easy identification
  - When OFF: All individual guardian toggles are disabled
  - Prevents accidental SMS costs
- **Configuration Settings:**
  - Default send time: Dropdown (8:00 AM - 6:00 PM)
  - Max messages per day: Input (1-100)
- **Statistics Dashboard:** 4 cards showing:
  - Total guardians (156)
  - Enabled guardians (0 initially)
  - Disabled guardians (156 initially)
  - Pending messages (23)
- **Guardian Management Table:**
  - Search by name or phone number
  - Filter by enabled/disabled status
  - Bulk operations: "Enable All" / "Disable All" buttons
  - Individual auto-send toggles per guardian
  - Checkbox selection for future bulk operations
  - Pagination: 10 guardians per page
  - Guardian details: name, relationship, phone, children count, pending vaccines
- **Cost Warning Alerts:**
  - Info alert explaining SMS costs
  - Confirmation dialogs for bulk operations

**Key Methods:**
- `toggleGlobalAutoSend()` - Master switch control
- `toggleGuardianAutoSend(guardian)` - Individual guardian toggle
- `bulkToggle(enable)` - Enable/disable all with confirmation
- `updateStats()` - Recalculate statistics dashboard
- `toggleSelectAll()` - Checkbox management
- `clearFilters()` - Reset search and filters
- `viewGuardianDetails(guardian)` - Show guardian info modal

**Sample Data:** 3 guardians with auto_send_enabled: false by default

**Cost Management Design:**
- Global switch defaults to OFF
- All individual toggles disabled until global is ON
- Bulk operations require confirmation
- Statistics show enabled count for cost awareness

---

## Main Page (SMSManagement.vue)

**Purpose:** Tabbed interface integrating all three SMS components

**Features:**
- **Page Header:**
  - Title with icon (bi-chat-dots-fill)
  - Description text
  - Action buttons: "Export Logs", "Send Manual SMS"

- **Statistics Cards:** 4 cards showing:
  - Total Sent: 1,247 (↑ 12% this month)
  - Pending: 23 scheduled messages
  - Failed: 5 messages needing attention
  - Auto-Send: ON/OFF status with enabled guardians count

- **Tab Navigation:**
  - Message Logs (bi-list-ul)
  - Message Templates (bi-file-text)
  - Auto-Send Settings (bi-gear)

- **Tab Content:**
  - Dynamically renders active tab component
  - Uses v-show for performance (keeps component state)

**State:**
- `activeTab`: Current tab ('logs', 'templates', 'settings')
- `autoSendEnabled`: Global auto-send status
- `enabledGuardiansCount`: Number of guardians with auto-send enabled

---

## Message Format Requirements

### Template Structure

**1 Week & 3 Days Before:**
```
Good {Day/Evening}, {Mr./Ms.} {Guardian Name}.
Your child, {Patient Name}, is scheduled for vaccination on {Date}
for {Vaccine Name} Dose {Number}.
```

**1 Day Before:**
```
Good {Day/Evening}, {Mr./Ms.} {Guardian Name}.
Your child, {Patient Name}, is scheduled for vaccination tomorrow, {Date}
for {Vaccine Name} Dose {Number}.
```

### Example Output
```
Good Day, Mr. Aspa. Your child, Clark, is scheduled for vaccination on May 24, 2025 for BCG Dose 1.
```

### Variable Substitution Rules
- `{greeting}` → "Day" (6AM-5:59PM) or "Evening" (6PM-5:59AM)
- `{title}` → "Mr." (male) or "Ms." (female)
- `{guardian_name}` → Guardian's full name from database
- `{patient_name}` → Child's first name from database
- `{scheduled_date}` → Date formatted as "MMMM D, YYYY" (e.g., May 24, 2025)
- `{vaccine_name}` → Vaccine type from schedule (e.g., BCG, DPT, OPV)
- `{dose_number}` → Dose number from schedule (1, 2, 3, etc.)

---

## Backend Integration (TODO)

### API Endpoints Required

**Message Logs:**
- `GET /api/sms/logs` - Fetch message history with pagination
  - Query params: search, status, type, date_from, date_to, page, limit
  - Response: { data: [], total: number, page: number }

**Message Templates:**
- `GET /api/sms/templates` - Fetch all templates
- `POST /api/sms/templates` - Create new template
  - Body: { name, content, trigger_type, time_range, is_active }
- `PUT /api/sms/templates/:id` - Update template
  - Body: { name, content, trigger_type, time_range, is_active }
- `DELETE /api/sms/templates/:id` - Delete template

**Auto-Send Settings:**
- `GET /api/sms/settings` - Fetch global settings
  - Response: { auto_send_enabled, default_time, max_per_day }
- `PUT /api/sms/settings` - Update global settings
  - Body: { auto_send_enabled, default_time, max_per_day }
- `GET /api/sms/guardians` - Fetch guardian auto-send settings with pagination
  - Query params: search, enabled_filter, page, limit
  - Response: { data: [], total: number, enabled_count: number, disabled_count: number }
- `PUT /api/sms/guardians/:id/auto-send` - Toggle guardian auto-send
  - Body: { auto_send_enabled: boolean }
- `POST /api/sms/guardians/bulk-toggle` - Bulk enable/disable
  - Body: { enable: boolean, guardian_ids?: [] }

**Manual Sending:**
- `POST /api/sms/send` - Send manual SMS message
  - Body: { guardian_id, patient_id, message, schedule_for?: date }

### Database Schema Suggestions

**sms_templates:**
```sql
id, name, content, trigger_type (1-week/3-days/1-day), 
time_range (day/evening), is_active, created_at, updated_at
```

**sms_logs:**
```sql
id, guardian_id, patient_id, phone_number, message, 
status (sent/pending/failed), trigger_type (1-week/3-days/1-day/manual),
sent_at, created_at
```

**guardian_sms_settings:**
```sql
guardian_id (FK), auto_send_enabled (default false), 
created_at, updated_at
```

**system_sms_settings:**
```sql
id, auto_send_enabled (default false), default_time, 
max_per_day, updated_at
```

### Scheduled Jobs Required

**Daily Job (runs every 6 hours):**
1. Check global auto_send_enabled flag
2. If enabled, query upcoming vaccinations:
   - 7 days from now (1-week trigger)
   - 3 days from now (3-days trigger)
   - 1 day from now (1-day trigger)
3. For each upcoming vaccination:
   - Check guardian's auto_send_enabled setting
   - Check if message already sent for this trigger
   - Determine current time range (day/evening)
   - Fetch appropriate template
   - Substitute variables
   - Queue message in sms_logs with status='pending'
4. Process pending messages (respect max_per_day limit)
5. Send via Semaphore API
6. Update sms_logs status to 'sent' or 'failed'

---

## Testing Checklist

### Message Logs Component
- [ ] Search by recipient name
- [ ] Search by patient name
- [ ] Search by phone number
- [ ] Search by message content
- [ ] Filter by status: sent, pending, failed
- [ ] Filter by type: 1-week, 3-days, 1-day, manual
- [ ] Filter by date range
- [ ] Pagination: next/previous buttons
- [ ] View message details modal
- [ ] Status badge colors correct
- [ ] Type badge colors correct
- [ ] Date formatting (Philippine locale)
- [ ] Message truncation (80 characters)

### Message Templates Component
- [ ] View all templates in card layout
- [ ] Create new template
- [ ] Edit existing template
- [ ] Duplicate template (adds "(Copy)" suffix)
- [ ] Delete template (with confirmation)
- [ ] Toggle template active/inactive
- [ ] Variable substitution in preview
- [ ] Live preview updates on content change
- [ ] Greeting variable: "Day" / "Evening"
- [ ] Title variable: "Mr." / "Ms."
- [ ] All 7 variables substitute correctly
- [ ] Character counter updates
- [ ] Character counter warning at 160
- [ ] Trigger type selection works
- [ ] Time range selection works
- [ ] Form validation

### Auto-Send Settings Component
- [ ] Global master switch toggles
- [ ] Individual toggles disabled when global is OFF
- [ ] Individual toggles enabled when global is ON
- [ ] Statistics update on toggle changes
- [ ] Search guardians by name
- [ ] Search guardians by phone
- [ ] Filter by enabled status
- [ ] Filter by disabled status
- [ ] Bulk "Enable All" with confirmation
- [ ] Bulk "Disable All" with confirmation
- [ ] Pagination works correctly
- [ ] Checkbox select all works
- [ ] Individual guardian toggle
- [ ] Default time dropdown saves
- [ ] Max per day input validates (1-100)
- [ ] View guardian details modal

### Main Page (SMSManagement)
- [ ] Statistics cards display correctly
- [ ] Tab navigation works (Logs, Templates, Settings)
- [ ] Active tab highlighted
- [ ] Components render in correct tabs
- [ ] Component state preserved on tab switch
- [ ] Export Logs button (placeholder)
- [ ] Send Manual SMS button (placeholder)
- [ ] Icons display correctly
- [ ] Responsive layout on mobile
- [ ] Statistics update from child components

### Integration Testing
- [ ] Route `/admin/sms-management` accessible
- [ ] Requires authentication
- [ ] Requires admin role
- [ ] Page title correct in browser tab
- [ ] Back button navigation works
- [ ] AdminLayout renders correctly
- [ ] Component imports resolve
- [ ] No console errors
- [ ] No TypeScript/linting errors

---

## User Flow

### Creating a Template
1. Navigate to `/admin/sms-management`
2. Click "Message Templates" tab
3. Click "+ Create New Template" button
4. Fill in template details:
   - Name: "1-Week BCG Reminder"
   - Trigger Type: "1-week"
   - Time Range: "day"
   - Content: Use variables for dynamic content
5. Preview message with sample data
6. Check character count
7. Click "Save Template"
8. Template card appears in grid
9. Toggle "Active" to enable for auto-send

### Enabling Auto-Send for Guardians
1. Navigate to `/admin/sms-management`
2. Click "Auto-Send Settings" tab
3. **Enable global auto-send:**
   - Toggle master switch to ON
   - Set default send time (e.g., 9:00 AM)
   - Set max messages per day (e.g., 50)
4. **Enable specific guardians:**
   - Search for guardian by name
   - Toggle individual auto-send switch to ON
   - OR click "Enable All" for bulk operation
5. Statistics dashboard updates automatically
6. Backend scheduled job will process enabled guardians

### Viewing Message History
1. Navigate to `/admin/sms-management`
2. "Message Logs" tab is default
3. Use search to find specific messages
4. Filter by status to see failed messages
5. Filter by type to see trigger-based vs manual
6. Click "View" to see full message details
7. Use pagination to browse history

---

## Design Patterns & Conventions

### Component Structure
- Vue 3 Composition API with `<script setup>`
- Bootstrap 5 for UI consistency
- Bootstrap Icons for visual elements
- Reactive state with `ref()` and `reactive()`
- Computed properties for derived state

### Naming Conventions
- Components: PascalCase (e.g., MessageLogs.vue)
- Methods: camelCase (e.g., toggleGlobalAutoSend)
- CSS Classes: Bootstrap utility classes + custom kebab-case

### State Management
- Local component state for UI (ref/reactive)
- TODO: Integrate Pinia for global SMS state
- TODO: API service layer for backend calls

### Error Handling
- Toast notifications for user feedback
- Confirmation dialogs for destructive actions
- Input validation on forms
- TODO: API error handling with user-friendly messages

---

## Known Limitations & Future Enhancements

### Current Limitations
- Sample data only (no backend integration)
- Export Logs button is placeholder
- Send Manual SMS button is placeholder
- No actual SMS sending capability yet
- Statistics are hardcoded
- No real-time updates

### Future Enhancements
- [ ] Real-time message status updates via WebSocket
- [ ] SMS cost calculator (preview cost before sending)
- [ ] Message scheduling (send at specific time)
- [ ] Template categories/tags for organization
- [ ] Message analytics dashboard (delivery rates, response times)
- [ ] Retry failed messages automatically
- [ ] SMS balance monitoring (Semaphore API credits)
- [ ] Multi-language support for messages
- [ ] Custom variable creation
- [ ] A/B testing for message templates
- [ ] Guardian communication preferences (SMS vs app notification)
- [ ] Message templates for other events (missed appointments, immunization completion)

---

## Dependencies

### Frontend
- Vue 3.5.18
- Vue Router
- Bootstrap 5.3.7
- Bootstrap Icons 1.13.1
- Vite 7.1.0

### Backend (Required)
- Node.js & Express
- Database (PostgreSQL recommended)
- Semaphore SMS API integration
- Cron job scheduler (node-cron)

---

## Related Documentation
- [CHANGELOG_V2.md](../../CHANGELOG_V2.md) - Version history
- [README.md](../../README.md) - Project overview
- [features/admin/README.md](../features/admin/README.md) - Admin features guide
- Backend API documentation (TODO)

---

## Contact & Support
For questions about this subsystem:
- Frontend implementation: Complete ✅
- Backend integration: Pending (backend developer)
- User feedback: Upload existing demo for comparison

---

**Last Updated:** October 27, 2025  
**Version:** 1.0.0  
**Status:** ✅ Frontend Complete | ⏳ Backend Pending
