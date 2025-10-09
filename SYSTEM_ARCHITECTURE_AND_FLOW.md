# VACCINE MANAGEMENT SYSTEM - COMPLETE SYSTEM FLOW & MODULES

## 📋 SYSTEM OVERVIEW

This is a comprehensive **Vaccine Inventory & Immunization Management System** for health clinics, built with:
- **Backend**: Node.js + Express + Supabase (PostgreSQL)
- **Frontend**: Vue.js 3 + Vite
- **Database**: PostgreSQL with advanced functions and triggers
- **Architecture**: RESTful API with role-based access control

---

## 🔄 COMPLETE SYSTEM FLOW

### **1. USER AUTHENTICATION & AUTHORIZATION**
```
User Login → Role Assignment → Permission-Based Access
     ↓
   ┌─────────────────────────────────────────────────┐
   │                 USER ROLES                      │
   │                                                 │
   │ • ADMIN: Full system access                     │
   │ • HEALTH WORKER: Patient care + read inventory  │
   │ • PARENT: Child vaccination tracking            │
   └─────────────────────────────────────────────────┘
```

### **2. INVENTORY MANAGEMENT FLOW**
```
Receiving Report → Inventory Creation → Stock Tracking → Vaccine Administration
       ↓               ↓                    ↓                ↓
   ┌─────────┐    ┌─────────┐         ┌─────────┐     ┌─────────┐
   │  DRAFT  │ -> │RECEIVED │ ->  │ AVAILABLE │ ->  │  ISSUED  │
   │ REPORT  │    │INVENTORY│         │  STOCK   │     │   DOSE   │
   └─────────┘    └─────────┘         └─────────┘     └─────────┘
```

### **3. PATIENT IMMUNIZATION FLOW**
```
Patient Registration → Schedule Generation → Vaccine Administration → Status Updates
         ↓                    ↓                        ↓               ↓
   ┌─────────────┐    ┌─────────────┐         ┌─────────────┐  ┌─────────────┐
   │   PATIENT   │ -> │  SCHEDULE   │ ->  │ IMMUNIZATION │->│   STATUS     │
   │   PROFILE   │    │   CREATED   │         │  RECORDED   │  │   UPDATED   │
   └─────────────┘    └─────────────┘         └─────────────┘  └─────────────┘
```

---

## 🏗️ SYSTEM MODULES ARCHITECTURE

### **A. BACKEND MODULES (API Layer)**

#### **1. Authentication & Authorization**
- **Controller**: `authController.js`
- **Routes**: `authRoutes.js`
- **Functions**:
  - User login/logout
  - JWT token management
  - Role-based permissions
  - Session management

#### **2. User Management**
- **Controller**: `userController.js`
- **Routes**: `userRoutes.js`
- **Entities**: Users, Roles, User Mapping
- **Functions**:
  - User CRUD operations
  - Role assignments
  - Profile management

#### **3. Patient Management**
- **Controller**: `patientController.js`
- **Routes**: `patientRoutes.js`
- **Entities**: Patients, Guardians, Birth History
- **Functions**:
  - Patient registration
  - Guardian management
  - Patient search/filtering

#### **4. Immunization Management**
- **Controller**: `immunizationController.js`
- **Routes**: `immunizationRoutes.js`
- **Entities**: Immunizations, Patient Schedules
- **Functions**:
  - Vaccine administration recording
  - Schedule status updates
  - Dose tracking

#### **5. Vaccine Inventory Management**
- **Controller**: `vaccineController.js`
- **Routes**: `vaccineRoutes.js`
- **Entities**: Vaccines, Inventory, Inventory Transactions
- **Functions**:
  - Stock level monitoring
  - Expiry tracking
  - Transaction logging

#### **6. Receiving Reports (NEW)**
- **Functions**: `receiving_report_system.sql`
- **Entities**: Receiving Reports, Report Items
- **Functions**:
  - Report creation/management
  - Inventory creation from reports
  - RECEIVE transaction generation

#### **7. Dashboard & Analytics**
- **Controller**: `dashboardController.js`
- **Routes**: `dashboardRoutes.js`
- **Functions**:
  - Statistics aggregation
  - Report generation
  - KPI calculations

#### **8. Activity Logging & Audit**
- **Controller**: `activityController.js`
- **Routes**: `activityRoutes.js`
- **Entities**: Activity Logs, Action Types
- **Functions**:
  - Comprehensive audit trail
  - Change tracking
  - System monitoring

#### **9. Communication Modules**
- **SMS Controller**: `smsController.js`
- **Conversation Controller**: `conversationController.js`
- **Functions**:
  - SMS notifications
  - Parent communication
  - Appointment reminders

#### **10. Specialized Health Modules**
- **Deworming**: `dewormingController.js`
- **Vitamin A**: `vitaminaController.js`
- **Vitals**: `vitalsController.js`
- **Visits**: `visitController.js`

---

### **B. FRONTEND MODULES (UI Layer)**

#### **1. Authentication Views**
- **Location**: `src/views/auth/`
- **Components**: Login, Password Reset
- **Functions**: User authentication flow

#### **2. Admin Dashboard**
- **Location**: `src/views/admin/`
- **Modules**:
  - `Dashboard.vue`: System overview, statistics
  - `UserAccounts.vue`: User management
  - `PatientRecords.vue`: Patient administration
  - `VaccineInventory.vue`: Inventory management
  - `Reports.vue`: Report generation
  - `ActivityLogs.vue`: Audit trail viewing
  - `SMSLogs.vue`: Communication logs
  - `Settings.vue`: System configuration

#### **3. Health Worker Interface**
- **Location**: `src/views/healthworker/`
- **Modules**:
  - `Dashboard.vue`: Daily operations view
  - `PatientRecords.vue`: Patient care interface
  - `VaccineInventoryReadOnly.vue`: Stock monitoring

#### **4. Parent Portal**
- **Location**: `src/views/parent/`
- **Modules**:
  - Child vaccination tracking
  - Appointment viewing
  - Communication with health workers

---

### **C. DATABASE MODULES (Data Layer)**

#### **1. Core Entities**
```
├── Users & Authentication
│   ├── users (user profiles)
│   ├── user_mapping (Supabase auth linkage)
│   └── user_roles (role assignments)
│
├── Patient Management
│   ├── patients (patient profiles)
│   ├── guardians (parent/guardian info)
│   ├── birthhistory (birth records)
│   └── patient_tags (categorization)
│
├── Immunization System
│   ├── vaccinemaster (vaccine catalog)
│   ├── schedule_master (vaccination schedules)
│   ├── schedule_doses (dose definitions)
│   ├── patientschedule (individual schedules)
│   └── immunizations (administration records)
│
├── Inventory Management
│   ├── inventory (stock records)
│   ├── inventorytransactions (stock movements)
│   ├── inventory_history (audit trail)
│   ├── receiving_reports (NEW - delivery docs)
│   └── receiving_report_items (NEW - delivery items)
│
└── System Support
    ├── activitylogs (audit trail)
    ├── conversations (communications)
    ├── sms_logs (SMS tracking)
    └── notifications (system alerts)
```

#### **2. Key Database Functions**
```
├── Patient Schedule Management
│   ├── generate_patient_schedule()
│   ├── recalc_patient_schedule_enhanced()
│   ├── recompute_patient_schedule_statuses()
│   └── update_patient_schedule_statuses()
│
├── Inventory Management
│   ├── check_and_expire_inventory()
│   ├── approve_inventory_request()
│   ├── create_inventory_from_report() [NEW]
│   └── complete_receiving_report() [NEW]
│
├── Utility Functions
│   ├── generate_report_number() [NEW]
│   ├── create_history_trigger()
│   └── authenticate_user()
│
└── Audit & Logging
    ├── Activity logging triggers
    └── History tracking functions
```

---

## 🔄 DETAILED SYSTEM FLOWS

### **Receiving Report to Inventory Flow**
```
1. Create Receiving Report (DRAFT)
   ↓
2. Add Report Items (vaccine, lot, expiry, quantity)
   ↓
3. Complete Report → Triggers complete_receiving_report()
   ↓
4. Function creates inventory records
   ↓
5. Function creates RECEIVE transactions
   ↓
6. Stock levels updated automatically
   ↓
7. Report status → COMPLETED
```

### **Patient Immunization Flow**
```
1. Patient Registration
   ↓
2. generate_patient_schedule() creates schedule
   ↓
3. Health worker administers vaccine
   ↓
4. Record in immunizations table
   ↓
5. recalc_patient_schedule_enhanced() updates schedule
   ↓
6. recompute_patient_schedule_statuses() updates statuses
   ↓
7. Activity logged for audit trail
```

### **Inventory Transaction Flow**
```
1. Stock Movement (RECEIVE/ISSUE/EXPIRED)
   ↓
2. Record in inventorytransactions table
   ↓
3. Trigger updates inventory.current_stock_level
   ↓
4. History trigger creates audit record
   ↓
5. Activity logging for user actions
   ↓
6. Dashboard statistics updated
```

---

## 🔐 SECURITY & PERMISSIONS

### **Role-Based Access Control**
```
ADMIN:
├── Full CRUD on all entities
├── User management
├── System configuration
├── All reports & analytics
└── Audit trail access

HEALTH WORKER:
├── Patient CRUD (assigned patients)
├── Immunization recording
├── Read-only inventory access
├── Basic reporting
└── SMS communication

PARENT:
├── View own children's records
├── Appointment viewing
├── Basic communication
└── Vaccination history
```

### **Data Security Features**
- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure API access
- **Audit Logging**: All changes tracked
- **Soft Deletes**: Data preservation with logical deletion
- **Input Validation**: API and database level validation

---

## 📊 REPORTING & ANALYTICS

### **Dashboard Metrics**
- **Inventory Levels**: Stock status, expiry alerts
- **Patient Statistics**: Coverage rates, defaulters
- **Immunization Progress**: Dose completion rates
- **System Usage**: Activity logs, user engagement

### **Report Types**
- **Inventory Reports**: Stock levels, expiry tracking
- **Patient Reports**: Immunization coverage, schedules
- **Operational Reports**: Activity logs, SMS usage
- **Audit Reports**: System changes, user actions

---

## 🔄 INTEGRATION POINTS

### **External Systems**
- **Supabase Auth**: User authentication
- **SMS Gateway**: Communication system
- **Email System**: Notifications (future)
- **Mobile App**: Parent access (future)

### **Automated Processes**
- **Cron Jobs**: Expiry checks, status updates
- **Triggers**: Automatic calculations, audit logging
- **Background Jobs**: Report generation, notifications

---

## 🚀 DEPLOYMENT & MAINTENANCE

### **Environment Setup**
```
Development → Staging → Production
     ↓           ↓          ↓
   Local     Cloud       Cloud
  Testing   Testing    Production
```

### **Monitoring & Maintenance**
- **Health Checks**: System status monitoring
- **Backup Procedures**: Database backups
- **Performance Tuning**: Query optimization
- **Security Updates**: Regular updates

---

## 🎯 KEY BUSINESS PROCESSES

### **1. Vaccine Stock Management**
- All stock must come through Receiving Reports
- Automatic inventory creation from reports
- Real-time stock level tracking
- Expiry monitoring and alerts

### **2. Patient Immunization Tracking**
- Automated schedule generation
- Real-time status updates
- Comprehensive audit trail
- Parent communication system

### **3. Quality Assurance**
- Double-entry verification
- Audit trail for all changes
- Automated validation rules
- Comprehensive reporting

This system provides a complete, auditable, and scalable solution for vaccine management in health clinics with proper separation of concerns, security, and user experience for all stakeholders.