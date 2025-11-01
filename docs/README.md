# 💉 Immunization Management System

A comprehensive web-based system for managing immunization records, vaccine inventory, and patient care workflows for barangay health centers.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features](#features)
- [User Roles](#user-roles)
- [Development Guidelines](#development-guidelines)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Overview

The Immunization Management System is designed to digitize and streamline the immunization tracking process for barangay health centers in the Philippines. It provides a centralized platform for:

- **Patient Record Management** - Digital health records for children and guardians
- **Vaccination Tracking** - Scheduled and completed vaccinations with history
- **Inventory Management** - Vaccine stock levels, receiving reports, and expiry tracking
- **SMS Management** - Comprehensive SMS notification system with PhilSMS integration
- **Reporting & Analytics** - Dashboard insights and activity logs
- **Multi-User Access** - Role-based access for admins, health workers, and parents

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Vue.js 3 (Composition API)
- **Build Tool:** Vite
- **Routing:** Vue Router 4
- **State Management:** Vue Reactivity API (ref, computed, reactive)
- **UI Framework:** Bootstrap 5
- **Icons:** Bootstrap Icons
- **HTTP Client:** Axios
- **Charts:** Chart.js
- **QR Code:** html5-qrcode

### **Backend**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **SMS Integration:** PhilSMS API
- **Security:** bcrypt, CORS, helmet

### **Database**
- **DBMS:** PostgreSQL 14+
- **Hosting:** Supabase
- **Features:** Row Level Security (RLS), Triggers, Functions, Views
- **Migrations:** Version-controlled SQL files in `db/`

---

## 🏗️ Architecture

### **Frontend Architecture (Feature-Based)**

```
frontend/src/
├── components/
│   ├── layout/              # Layout wrappers (AdminLayout, HealthWorkerLayout, ParentLayout)
│   └── ui/                  # Global reusable UI components
│       ├── base/            # Primitive components (buttons, cards, modals, tables)
│       ├── form/            # Form inputs (date, time, searchable select)
│       └── feedback/        # User feedback (toasts, confirm dialogs)
│
├── features/                # Business domain modules
│   ├── admin/               # Admin-specific components (SMS, inventory, analytics)
│   ├── health-worker/       # Health worker components
│   ├── parent/              # Parent portal components
│   └── shared/              # Shared components across roles
│
├── views/                   # Page components (routes)
│   ├── admin/               # Admin portal pages
│   ├── healthworker/        # Health worker portal pages
│   └── parent/              # Parent portal pages
│
├── services/                # API services and utilities
├── composables/             # Vue composables (reusable logic)
├── router/                  # Vue Router configuration
└── assets/                  # Static assets (images, styles)
```

### **Backend Architecture**

```
backend/
├── controllers/             # Request handlers
├── middleware/              # Authentication, validation, error handling
├── routes/                  # API route definitions
├── services/                # Business logic (SMS, notifications)
├── utils/                   # Helper functions
├── config/                  # Configuration files
└── uploads/                 # File storage (QR codes, exports)
```

### **Database Architecture**

```
db/                          # Database migrations (version control)
├── 2025-09-28_*.sql         # Table schema, RLS, triggers
├── 2025-09-29_*.sql         # Constraints, views
├── 2025-10-13_*.sql         # Notifications, reminders
├── 2025-10-24_*.sql         # Latest updates
└── 2025-10-27_*.sql         # SMS management tables
```

---

## 🚀 Getting Started

### **Prerequisites**

- **Node.js** v16+ and npm
- **PostgreSQL** 14+ (or Supabase account)
- **Git** for version control

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/clarknotkent/Thesis.git
   cd Thesis
   git checkout system-prototype-v2
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   
   Create `backend/.env` file:
   ```env
   PORT=3000
   NODE_ENV=development
   
   # Database
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/[database]
   
   # JWT
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   
   # SMS API (PhilSMS)
   PHILSMS_API_KEY=your_philsms_api_key
   PHILSMS_SENDER_ID=YourSenderID
   
   # Frontend URL (CORS)
   FRONTEND_URL=http://localhost:5173
   ```

4. **Setup Database**
   
   Run migrations in order:
   ```bash
   # Connect to your PostgreSQL database and execute:
   psql -U postgres -d your_database -f db/2025-09-28_refactor_tables.sql
   psql -U postgres -d your_database -f db/2025-09-28_rls_refinement.sql
   # ... continue with remaining migration files
   ```

5. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

6. **Run Development Servers**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

---

## 📁 Project Structure

### **Frontend - Feature Modules**

#### **SMS Management** (`features/admin/sms/`)
**Purpose:** Complete SMS notification system with PhilSMS integration

**Components:**
- `MessageLogs.vue` - SMS history table with filtering and search
- `MessageTemplates.vue` - Manage SMS templates with variables
- `AutoSendSettings.vue` - Per-guardian auto-send toggle settings

**Features:**
- Send manual SMS to guardians
- Template-based messages with variable replacement
- Auto-calculated greeting time (Day: 6am-6pm, Evening: 6pm-6am)
- Auto-calculated guardian title (Mr./Ms. based on gender)
- Template variables: `{greeting_time}`, `{guardian_title}`, `{guardian_last_name}`, `{patient_name}`, `{vaccine_name}`, `{dose_number}`, `{appointment_date}`
- Three trigger types: 1-week, 3-days, 1-day before vaccination
- SMS delivery tracking and logs
- Template preview before sending
- Guardian-level auto-send preferences

**Backend Integration:**
- PhilSMS API integration (`services/smsService.js`)
- 14 API endpoints for SMS operations
- Database tables: `sms_logs`, `sms_templates`, `guardian_auto_send_settings`

**Documentation:**
- `ForJapeth.md` - Complete setup instructions
- `SMS_BACKEND_README.md` - API documentation
- `SMS_TEMPLATE_SPECS.md` - Template specifications

**Pages Using Module:**
- SMS Management (tabbed interface with Message Logs, Templates, Auto-Send Settings)

---

#### **1. Patient Management** (`features/patient-management/`)
**Purpose:** Complete patient care workflow

**Components:**
- `VisitEditor.vue` (1,505 lines) - Record patient visits, vital signs, services
- `VaccinationRecordEditor.vue` (1,913 lines) - Administer and edit vaccinations
- `PatientForm.vue` - Add/edit patient demographic information
- `GuardianSelector.vue` - Link guardians to patients
- `ScheduledVaccinations.vue` - Display upcoming vaccine schedule
- `VaccinationHistory.vue` - Past vaccination records table
- `VisitHistory.vue` - Past visit records
- `VisitHistoryModal.vue` - Visit history in modal view
- `VisitSummaryView.vue` - Summarized visit details
- `AdminAddRecordModal.vue` - Quick record addition

**Pages Using Module:**
- Patient Records List
- View Patient Details
- Add/Edit Patient
- Visit Editor Page
- Vaccination Editor Page
- Visit History Page

---

#### **2. Inventory Management** (`features/inventory-management/`)
**Purpose:** Vaccine stock and inventory control

**Components:**
- `VaccineStockSection.vue` - Stock levels by vaccine type
- `ReceivingReportsSection.vue` - Incoming stock reports
- `StockForm.vue` - Add/edit stock entries
- `VaccineForm.vue` - Manage vaccine types
- `VaccineScheduleSection.vue` - Vaccine schedule management

**Pages Using Module:**
- Inventory Overview
- Vaccine Inventory
- Add/Edit Stock
- Add/Edit Vaccine Type
- Receiving Reports

---

#### **3. Chat** (`features/chat/`)
**Purpose:** Admin-to-user messaging system

**Components:**
- `ChatHeader.vue` - Conversation header with participant info
- `ConversationsList.vue` - Sidebar with conversation threads
- `MessageComposer.vue` - Message input with send button
- `MessagesList.vue` - Message thread display
- `NewConversationModal.vue` - Create new conversation

**Composables:**
- `useChatService.js` - Chat business logic and API calls

**Pages Using Module:**
- Admin Chat Page

---

#### **4. User Management** (`features/user-management/`)
**Purpose:** User account management

**Components:**
- `UserForm.vue` - Reusable form for add/edit/view user

**Pages Using Module:**
- User Accounts List
- Add User
- Edit User
- View User

---

#### **5. Analytics** (`features/analytics/`)
**Purpose:** Data visualization

**Components:**
- `BarChart.vue` - Chart.js bar chart wrapper

**Pages Using Module:**
- Admin Dashboard
- Reports & Analytics

---

### **Backend - API Structure**

#### **Authentication Routes** (`/api/auth`)
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login user
POST   /api/auth/logout            # Logout user
GET    /api/auth/me                # Get current user
PUT    /api/auth/change-password   # Change password
```

Note: Login identifier accepts username, email, or phone number. For Philippine mobiles, both 09XXXXXXXXX and +639XXXXXXXXX formats are accepted.

#### **Patient Routes** (`/api/patients`)
```
GET    /api/patients               # Get all patients (paginated)
GET    /api/patients/:id           # Get patient by ID
POST   /api/patients               # Create new patient
PUT    /api/patients/:id           # Update patient
DELETE /api/patients/:id           # Delete patient
GET    /api/patients/:id/visits    # Get patient visits
GET    /api/patients/:id/vaccinations # Get patient vaccinations
```

#### **Vaccination Routes** (`/api/vaccinations`)
```
GET    /api/vaccinations           # Get all vaccinations
GET    /api/vaccinations/:id       # Get vaccination by ID
POST   /api/vaccinations           # Record vaccination
PUT    /api/vaccinations/:id       # Update vaccination
DELETE /api/vaccinations/:id       # Delete vaccination
GET    /api/vaccinations/scheduled # Get scheduled vaccinations
```

#### **Inventory Routes** (`/api/inventory`)
```
GET    /api/inventory/vaccines     # Get vaccine types
POST   /api/inventory/vaccines     # Add vaccine type
PUT    /api/inventory/vaccines/:id # Update vaccine type
DELETE /api/inventory/vaccines/:id # Delete vaccine type
GET    /api/inventory/stock        # Get stock levels
POST   /api/inventory/stock        # Add stock
PUT    /api/inventory/stock/:id    # Update stock
GET    /api/inventory/receiving    # Get receiving reports
POST   /api/inventory/receiving    # Create receiving report
```

#### **User Routes** (`/api/users`)
```
GET    /api/users                  # Get all users
GET    /api/users/:id              # Get user by ID
POST   /api/users                  # Create user (admin only)
PUT    /api/users/:id              # Update user
DELETE /api/users/:id              # Delete user
```

#### **SMS Routes** (`/api/sms`)
```
POST   /api/sms                       # Send SMS (manual or template-based)
POST   /api/sms/bulk                  # Send bulk SMS
GET    /api/sms/history               # Get SMS logs (with filters)
GET    /api/sms/statistics            # Get SMS statistics
POST   /api/sms/templates/preview     # Preview template with variables
GET    /api/sms/templates             # Get all templates
POST   /api/sms/templates             # Create new template
PUT    /api/sms/templates/:id         # Update template
DELETE /api/sms/templates/:id         # Delete template
GET    /api/sms/guardians             # Get guardian auto-send settings
PUT    /api/sms/guardians/:guardianId # Toggle guardian auto-send
POST   /api/sms/guardians/bulk-toggle # Bulk toggle auto-send
```

#### **Report Routes** (`/api/reports`)
```
GET    /api/reports/dashboard      # Dashboard statistics
GET    /api/reports/vaccinations   # Vaccination reports
GET    /api/reports/inventory      # Inventory reports
GET    /api/reports/activity-logs  # Activity logs
```

---

## 🎯 Features

### **Admin Portal**

#### **Dashboard**
- Vaccination statistics (completed, pending, overdue)
- Patient demographics (age groups, gender distribution)
- Inventory status (stock levels, expiring soon)
- Recent activity feed

#### **Patient Records Management**
- Search and filter patients
- Add new patient with guardian information
- View complete patient profile
- Edit patient demographics
- Record patient visits with vital signs
- Administer vaccinations
- View vaccination history and schedule
- Print patient records and QR codes

#### **Vaccination Management**
- Schedule vaccinations based on patient age
- Record administered vaccinations
- Track vaccine doses (1st, 2nd, 3rd, boosters)
- Mark missed vaccinations
- Reschedule overdue vaccinations
- View vaccination calendar

#### **Inventory Management**
- Vaccine stock overview
- Add/edit vaccine types (brand, manufacturer, storage)
- Track stock levels and lot numbers
- Record receiving reports
- Monitor expiry dates
- Generate low stock alerts
- Vaccine usage reports

#### **User Account Management**
- Create user accounts (Admin, Health Worker, Parent)
- Assign roles and permissions
- Edit user profiles
- Deactivate/activate accounts
- View user activity logs

#### **SMS Notifications**
- Send vaccination reminders
- Notify parents of upcoming appointments
- View SMS logs and delivery status
- Configure SMS templates

#### **SMS Management**
- Comprehensive SMS notification system
- Template-based messaging with variable replacement
- Auto-calculated greeting time (Day/Evening based on 6am-6pm schedule)
- Auto-calculated guardian title (Mr./Ms. based on gender)
- Template variables: greeting, title, names, vaccine, dose, appointment date
- Three trigger types: 1-week, 3-days, 1-day before vaccination
- Manual SMS sending to individual guardians
- Bulk SMS operations
- SMS delivery tracking and history logs
- Template preview before sending
- Guardian-level auto-send preferences (enable/disable per guardian)
- SMS statistics dashboard (total sent, delivered, failed)
- PhilSMS API integration for reliable delivery

#### **Messaging System**
- Internal chat between admins and users
- Create new conversations
- Real-time message updates
- Conversation history

#### **Reports & Analytics**
- Monthly immunization reports (currently placeholder - awaiting backend fix)
- Vaccination coverage reports with sample data
- Color-coded coverage indicators (Green/Blue/Yellow/Red)
- Gender-based statistics (Male/Female breakdown)
- Defaulter lists
- Inventory consumption reports
- Activity logs (user actions, timestamps)
- Export reports (PDF, Excel)

> **Note:** Monthly Immunization Report page currently displays sample placeholder data while backend logic errors are being resolved. See `Reports.vue.backup` for original implementation.

#### **Settings**
- Barangay information
- System configurations
- Notification settings
- Backup and restore

---

### **Health Worker Portal**

- View-only access to patient records
- Search patients by name, ID, guardian
- View vaccination schedules
- View inventory levels
- Generate basic reports
- Update own profile

---

### **Parent Portal**

- View own children's records
- View vaccination schedule
- View vaccination history
- Receive SMS reminders
- Update contact information
- Chat with admin
- View appointment reminders

---

## 👥 User Roles

### **Admin**
- Full system access
- Manage all records (patients, vaccinations, inventory)
- Manage user accounts
- Configure system settings
- View all reports and analytics
- Send SMS notifications

### **Health Worker**
- Read-only access to patient records
- View vaccination schedules
- View inventory levels
- Generate basic reports
- Cannot modify data

### **Parent/Guardian**
- View own children's records only
- View vaccination schedules
- Receive notifications
- Update own profile
- Message admin

---

## 💻 Development Guidelines

### **Code Style**

#### **Vue Component Structure**
```vue
<template>
  <!-- Template code -->
</template>

<script setup>
// Imports
import { ref, computed, onMounted } from 'vue'

// Props (if any)
const props = defineProps({
  // ...
})

// Emits (if any)
const emit = defineEmits(['event-name'])

// Reactive state
const data = ref(null)

// Computed properties
const computedValue = computed(() => {
  // ...
})

// Methods
const methodName = () => {
  // ...
}

// Lifecycle hooks
onMounted(() => {
  // ...
})
</script>

<style scoped>
/* Component-specific styles */
</style>
```

#### **Naming Conventions**

**Components:**
- PascalCase: `PatientForm.vue`, `AppButton.vue`
- Prefix with "App" for global UI components

**Composables:**
- camelCase with "use" prefix: `useToast.js`, `usePagination.js`

**Feature Modules:**
- kebab-case: `patient-management/`, `inventory-management/`

**Variables:**
- camelCase: `patientData`, `isLoading`

**Constants:**
- UPPER_SNAKE_CASE: `API_BASE_URL`, `MAX_FILE_SIZE`

---

### **Import Guidelines**

#### **Use Absolute Paths**
```javascript
// ✅ Good - Absolute paths with @ alias
import { PatientForm } from '@/features/patient-management'
import AppButton from '@/components/ui/base/AppButton.vue'
import { useToast } from '@/composables/useToast'

// ❌ Bad - Relative paths
import PatientForm from '../../features/patient-management/PatientForm.vue'
import AppButton from '../../../components/ui/base/AppButton.vue'
```

#### **Use Feature Module Exports**
```javascript
// ✅ Good - Clean imports from feature modules
import { VisitEditor, PatientForm, GuardianSelector } from '@/features/patient-management'

// ❌ Bad - Individual component imports
import VisitEditor from '@/features/patient-management/VisitEditor.vue'
import PatientForm from '@/features/patient-management/PatientForm.vue'
```

---

### **Component Placement Rules**

#### **When to use `components/ui/`**
✅ Truly global, reusable components used across multiple features
- Buttons, cards, modals, tables
- Form inputs (date pickers, dropdowns)
- Feedback components (toasts, dialogs)

❌ NOT for feature-specific components

#### **When to use `features/`**
✅ Business domain-specific components
- Patient forms, vaccination editors
- Inventory management sections
- Chat components
- Feature-specific composables

❌ NOT for generic UI components

#### **When to use `views/`**
✅ Only for routable page components
- Pages that correspond to routes
- Top-level page containers

❌ NOT for reusable components or sub-components

---

### **State Management**

#### **Local State**
```javascript
// Use ref for primitive values
const count = ref(0)
const name = ref('')

// Use reactive for objects
const user = reactive({
  name: '',
  email: ''
})
```

#### **Computed Properties**
```javascript
// Derived state
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})

// Filtered lists
const activePatients = computed(() => {
  return patients.value.filter(p => p.status === 'active')
})
```

#### **Composables for Shared Logic**
```javascript
// composables/useToast.js
export function useToast() {
  const toasts = ref([])
  
  const addToast = (message, type = 'info') => {
    // ...
  }
  
  return { toasts, addToast }
}
```

---

### **API Service Pattern**

```javascript
// services/patientService.js
import api from './api'

export const patientService = {
  async getAll(params) {
    const response = await api.get('/patients', { params })
    return response.data
  },
  
  async getById(id) {
    const response = await api.get(`/patients/${id}`)
    return response.data
  },
  
  async create(data) {
    const response = await api.post('/patients', data)
    return response.data
  },
  
  async update(id, data) {
    const response = await api.put(`/patients/${id}`, data)
    return response.data
  },
  
  async delete(id) {
    const response = await api.delete(`/patients/${id}`)
    return response.data
  }
}
```

---

### **Error Handling**

#### **Frontend**
```javascript
try {
  const data = await patientService.create(patientData)
  addToast('Patient created successfully', 'success')
  router.push('/admin/patients')
} catch (error) {
  console.error('Error creating patient:', error)
  addToast(error.response?.data?.message || 'Failed to create patient', 'error')
}
```

#### **Backend**
```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack)
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}
```

---

## 🗄️ Database Schema

### **Key Tables**

#### **users**
- User authentication and profiles
- Columns: user_id, username, email, password_hash, role, first_name, last_name

#### **patients**
- Patient demographic information
- Columns: patient_id, first_name, last_name, date_of_birth, sex, address

#### **guardians**
- Parent/guardian information
- Columns: guardian_id, first_name, last_name, phone_number, relationship

#### **patient_guardians**
- Links patients to their guardians
- Columns: patient_id, guardian_id, is_primary

#### **visits**
- Patient visit records
- Columns: visit_id, patient_id, visit_date, weight, height, temperature, notes

#### **vaccinations**
- Administered vaccinations
- Columns: vaccination_id, patient_id, vaccine_id, dose_number, date_administered, administered_by

#### **scheduled_vaccinations**
- Upcoming scheduled vaccinations
- Columns: schedule_id, patient_id, vaccine_id, scheduled_date, status

#### **vaccine_types**
- Vaccine information
- Columns: vaccine_id, vaccine_name, brand_name, manufacturer, doses_required

#### **vaccine_stock**
- Vaccine inventory
- Columns: stock_id, vaccine_id, lot_number, quantity, expiry_date

#### **receiving_reports**
- Stock receiving records
- Columns: report_id, received_date, received_by, supplier

#### **activity_logs**
- System activity tracking
- Columns: log_id, user_id, action, table_name, timestamp

#### **sms_logs**
- SMS message history and delivery tracking
- Columns: id, guardian_id, patient_id, phone_number, message, type, status, template_id, error_message, sent_at

#### **sms_templates**
- Reusable SMS templates with variable support
- Columns: id, name, template, trigger_type, time_range, is_active

#### **guardian_auto_send_settings**
- Per-guardian SMS auto-send preferences
- Columns: id, guardian_id, auto_send_enabled

---

### **Database Features**

#### **Row Level Security (RLS)**
- Patients can only view their own records
- Health workers have read-only access
- Admins have full access

#### **Triggers**
- Auto-update `updated_at` timestamps
- Activity log triggers on INSERT/UPDATE/DELETE
- Vaccination schedule automation

#### **Views**
- `vw_patient_details` - Comprehensive patient info with guardians
- `vw_vaccination_schedule` - Upcoming vaccinations by patient
- `vw_inventory_summary` - Current stock levels
- `vw_activity_logs` - Formatted activity logs with user info

#### **Functions**
- `calculate_age(date_of_birth)` - Calculate patient age
- `check_vaccine_eligibility(patient_id, vaccine_id)` - Check if patient can receive vaccine
- `get_next_dose_date(last_dose_date, interval_days)` - Calculate next dose date

---

## 🚢 Deployment

### **Frontend Deployment (Vercel/Netlify)**

1. **Build for production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy dist folder**
   - Upload `dist/` folder to hosting platform
   - Configure environment variables
   - Set up custom domain

### **Backend Deployment (Heroku/Railway/Render)**

1. **Prepare for deployment**
   ```bash
   cd backend
   npm run build  # if using TypeScript
   ```

2. **Set environment variables** on hosting platform

3. **Deploy**
   ```bash
   git push heroku main
   # or use platform CLI
   ```

### **Database (Supabase)**
- Supabase handles hosting and scaling
- Apply migrations via Supabase dashboard or CLI
- Configure RLS policies
- Enable realtime subscriptions (if needed)

---

## 🤝 Contributing

### **Branching Strategy**

- `main` - Production-ready code
- `system-prototype-v1` - Legacy version
- `system-prototype-v2` - Current refactored version (Feature-Based Architecture)
- `feature/*` - New feature branches
- `bugfix/*` - Bug fix branches

### **Commit Message Format**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `style` - Formatting changes
- `docs` - Documentation
- `test` - Adding tests
- `chore` - Maintenance tasks

**Example:**
```
feat(patient-management): add bulk import patients feature

- Added CSV upload functionality
- Validates data before import
- Shows progress bar during import

Closes #123
```

---

## 📞 Support

- **Documentation:** See `CHANGELOG_V2.md` for recent changes


**Last Updated:** October 26, 2025  
**Version:** 2.0.0  
**Branch:** system-prototype-v2
