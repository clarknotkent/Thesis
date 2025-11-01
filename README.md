# 💉 ImmunizeMe - Immunization Management System# 💉 ImmunizeMe - Immunization Management System



A comprehensive web-based system for managing immunization records, vaccine inventory, and patient care workflows for barangay health centers.A comprehensive web-based system for managing immunization records, vaccine inventory, and patient care workflows for barangay health centers.



**Branch:** `system-prototype-v2` | **Status:** Active Development | **Last Updated:** November 2, 2025**Branch:** `system-prototype-v2` | **Status:** Active Development | **Last Updated:** November 2, 2025



------




------



## 📋 Table of Contents## 📋 Table of Contents



- [Overview](#overview)- [Overview](#overview)

- [Quick Start](#quick-start)- [Quick Start](#quick-start)

- [Tech Stack](#tech-stack)- [Tech Stack](#tech-stack)

- [Architecture](#architecture)- [Architecture](#architecture)

- [Project Structure](#project-structure)- [Project Structure](#project-structure)

- [Features](#features)- [Features](#features)

- [User Roles](#user-roles)- [User Roles](#user-roles)

- [Development Guidelines](#development-guidelines)- [Development Guidelines](#development-guidelines)

- [Deployment](#deployment)- [Deployment](#deployment)

- [Documentation](#documentation)- [Documentation](#documentation)



------



## 🎯 Overview## 🎯 Overview



The **ImmunizeMe** system digitizes and streamlines the immunization tracking process for barangay health centers in the Philippines. It provides a centralized platform for:The **ImmunizeMe** system digitizes and streamlines the immunization tracking process for barangay health centers in the Philippines. It provides a centralized platform for:



- **Patient Record Management** - Digital health records for children and guardians- **Patient Record Management** - Digital health records for children and guardians

- **Vaccination Tracking** - Scheduled and completed vaccinations with comprehensive history- **Vaccination Tracking** - Scheduled and completed vaccinations with comprehensive history

- **Inventory Management** - Vaccine stock levels, receiving reports, and expiry tracking- **Inventory Management** - Vaccine stock levels, receiving reports, and expiry tracking

- **SMS Notifications** - Automated reminders and updates via PhilSMS integration- **SMS Notifications** - Automated reminders and updates via PhilSMS integration

- **Reporting & Analytics** - Dashboard insights and activity logs- **Reporting & Analytics** - Dashboard insights and activity logs

- **Multi-Role Access** - Role-based portals for admins, health workers, and parents- **Multi-Role Access** - Role-based portals for admins, health workers, and parents



------



## 🚀 Quick Start## 🚀 Quick Start



### Prerequisites### Prerequisites



- **Node.js** 20+ and npm 9+- **Node.js** 20+ and npm 9+

- **PostgreSQL** database (or Supabase account)- **PostgreSQL** database (or Supabase account)

- **Git** for version control- **Git** for version control



### Installation### Installation



```bash```bash

# Clone the repository# Clone the repository

git clone https://github.com/clarknotkent/Thesis.gitgit clone https://github.com/clarknotkent/Thesis.git

cd Thesiscd Thesis

git checkout system-prototype-v2git checkout system-prototype-v2



# Install dependencies for both frontend and backend# Install dependencies for both frontend and backend

npm installnpm install



# Set up environment variables# Set up environment variables

# Backend: Copy backend/.env.example to backend/.env and configure# Backend: Copy backend/.env.example to backend/.env and configure

# Frontend: Copy frontend/.env.development.example to frontend/.env.development# Frontend: Copy frontend/.env.development.example to frontend/.env.development



# Run development servers (both services)# Run development servers

npm run devnpm run dev

``````



### Access the Application### Access the Application



- **Frontend:** http://localhost:5173- **Frontend:** http://localhost:5173

- **Backend API:** http://localhost:3001- **Backend API:** http://localhost:3001

- **API Health Check:** http://localhost:3001/api/health- **API Health Check:** http://localhost:3001/api/health



### Port Configuration### Default Credentials



| Service | Mode | Port | URL |See your database setup or contact the admin for default login credentials.

|---------|------|------|-----|

| **Backend API** | All | `3001` | http://localhost:3001 |---

| **Frontend** | Development | `5173` | http://localhost:5173 |

| **Frontend** | Production | `5173` | http://localhost:5173 |## 🛠️ Tech Stack



### Development Commands### **Frontend**

- **Framework:** Vue.js 3 (Composition API)

```bash- **Build Tool:** Vite

# Run both services with hot reload- **Routing:** Vue Router 4

npm run dev- **State Management:** Vue Reactivity API (ref, computed, reactive)

- **UI Framework:** Bootstrap 5

# Run services individually- **Icons:** Bootstrap Icons

npm run dev:backend     # Backend only (port 3001)- **HTTP Client:** Axios

npm run dev:frontend    # Frontend only (port 5173)- **Charts:** Chart.js

- **QR Code:** html5-qrcode

# Production build and serve

npm run build           # Build frontend### **Backend**

npm run start           # Run both services in production mode- **Runtime:** Node.js

```- **Framework:** Express.js

- **Database:** PostgreSQL (Supabase)

---- **Authentication:** JWT (JSON Web Tokens)

- **File Upload:** Multer

## 🛠️ Tech Stack- **SMS Integration:** PhilSMS API

- **Security:** bcrypt, CORS, helmet

### Frontend

- **Framework:** Vue.js 3 (Composition API with `<script setup>`)### **Database**

- **Build Tool:** Vite 7.1.12- **DBMS:** PostgreSQL 14+

- **Routing:** Vue Router 4- **Hosting:** Supabase

- **State Management:** Vue Reactivity API (ref, computed, reactive)- **Features:** Row Level Security (RLS), Triggers, Functions, Views

- **UI Framework:** Bootstrap 5- **Migrations:** Version-controlled SQL files in `db/`

- **Icons:** Bootstrap Icons

- **HTTP Client:** Axios---

- **Charts:** Chart.js

- **QR Code:** html5-qrcode## 🏗️ Architecture



### Backend### **Frontend Architecture (Feature-Based)**

- **Runtime:** Node.js 20+

- **Framework:** Express.js```

- **Database:** PostgreSQL (Supabase)frontend/src/

- **Authentication:** JWT (JSON Web Tokens)├── components/

- **File Upload:** Multer│   ├── layout/              # Layout wrappers (AdminLayout, HealthWorkerLayout, ParentLayout)

- **SMS Integration:** PhilSMS API│   └── ui/                  # Global reusable UI components

- **Security:** bcrypt, CORS, helmet│       ├── base/            # Primitive components (buttons, cards, modals, tables)

- **Logging:** Custom activity logger│       ├── form/            # Form inputs (date, time, searchable select)

│       └── feedback/        # User feedback (toasts, confirm dialogs)

### Database│

- **DBMS:** PostgreSQL 14+├── features/                # Business domain modules

- **Hosting:** Supabase│   ├── admin/               # Admin-specific components (SMS, inventory, analytics)

- **Features:** Row Level Security (RLS), Triggers, Functions, Views│   ├── health-worker/       # Health worker components

- **Migrations:** Version-controlled SQL files│   ├── parent/              # Parent portal components

│   └── shared/              # Shared components across roles

---│

├── views/                   # Page components (routes)

## 🏗️ Architecture│   ├── admin/               # Admin portal pages

│   ├── healthworker/        # Health worker portal pages

### Monorepo Structure│   └── parent/              # Parent portal pages

## Documentation moved

This project uses a **monorepo** structure with separate frontend and backend services:

This project's documentation has been centralized under the docs/ folder.

```

system-prototype-v2/- Start here: docs/README.md

├── frontend/                # Vue.js application- Full mapping of moved files: docs/INDEX.md

│   ├── src/

│   │   ├── components/     # UI componentsQuick links:

│   │   │   ├── layout/     # Layout wrappers (AdminLayout, HealthWorkerLayout, ParentLayout)- Changelog: docs/CHANGELOG_V2.md

│   │   │   └── ui/         # Global reusable components- Health Worker features: docs/HEALTH_WORKER_FEATURES_QUICK_GUIDE.md

│   │   │       ├── base/   # Primitives (buttons, cards, modals, tables)- Chat & Notifications: docs/HEALTH_WORKER_CHAT_NOTIFICATIONS.md

│   │   │       ├── form/   # Form inputs (date, time, searchable select)- SMS System (complete): docs/SMS_SYSTEM_COMPLETE.md

│   │   │       └── feedback/ # User feedback (toasts, confirm dialogs)- SMS Quick Reference: docs/SMS_QUICK_REFERENCE.md

│   │   ├── features/       # Feature modules by roleIf you encounter a broken link, check docs/INDEX.md for the original → new path mapping.

│   │   │   ├── admin/      # Admin features (SMS, inventory, analytics)├── services/                # Business logic (SMS, notifications)

│   │   │   ├── health-worker/ # Health worker features

│   │   │   ├── parent/     # Parent portal features## 📦 Large files policy

│   │   │   └── shared/     # Cross-role components

│   │   ├── views/          # Page components (routes)To keep the repository healthy and within GitHub limits, avoid committing large, generated change-report artifacts. These are ignored via `.gitignore`:

│   │   │   ├── admin/

│   │   │   ├── healthworker/- `*git-change-report-*.txt`

│   │   │   └── parent/- `*git-change-report-*.patch`

│   │   ├── composables/    # Reusable composition functions- `*git-change-report-*.diff`

│   │   ├── services/       # API services

│   │   └── router/         # Vue Router configurationIf you generate these reports for local review, keep them untracked. If long-term storage is required, prefer an external storage location or Git LFS in a separate archival repo.

│   ├── package.json
│   └── vite.config.js
│
├── backend/                # Express.js API
│   ├── controllers/        # Request handlers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middlewares/        # Auth, error handling
│   ├── services/           # Business logic (SMS, notifications)
│   ├── utils/              # Utility functions
│   ├── package.json
│   └── server.js
│
├── docs/                   # Comprehensive documentation
├── package.json            # Root package (runs both services)
└── DEPLOYMENT.md           # Deployment guide
```

### Feature-Based Frontend Organization

Components are organized by **feature** and **role** for better maintainability:

```
frontend/src/features/
├── admin/                  # Admin-only features
│   ├── inventory/         # Vaccine inventory management
│   ├── sms/               # SMS management and templates
│   ├── analytics/         # Analytics and reporting
│   └── ...
├── health-worker/          # Health worker features
│   ├── patients/          # Patient management
│   │   ├── components/    # Patient-specific components
│   │   ├── composables/   # Patient-related logic (usePatientForm, etc.)
│   │   └── views/         # Patient pages
│   ├── messages/          # Messaging system
│   │   ├── components/    # Chat components
│   │   ├── composables/   # Messaging logic
│   │   └── views/         # Messages page
│   ├── inventory/         # Inventory viewing
│   ├── notifications/     # Notifications
│   └── tools/             # QR scanner, utilities
├── parent/                # Parent portal features
│   ├── dependents/        # Dependent management
│   ├── notifications/     # Parent notifications
│   ├── messages/          # Parent messaging
│   └── ...
└── shared/                # Cross-role components
```

### Key Design Principles

1. **Separation of Concerns:** UI components, business logic (composables), and API services are separated
2. **Role-Based Access:** Each role has dedicated features and components
3. **Reusability:** Shared components in `features/shared/` and global `components/`
4. **Type Safety:** Consistent data structures across frontend and backend
5. **Scalability:** Feature-based structure allows easy addition of new modules
6. **Composition API:** All components use Vue 3 Composition API with `<script setup>`

---

## 📁 Project Structure

### Root Level Files

| File | Description |
|------|-------------|
| `package.json` | Root package with scripts to run both services |
| `RAILWAY_DEPLOYMENT_GUIDE.md` | Railway deployment guide (for PWA deployment) |
| `DEPLOYMENT.md` | General deployment reference |
| `CLEANUP_FOR_V3.md` | Cleanup checklist for v3 branch preparation |
| `README.md` | This file |

### Frontend Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, styles
│   ├── components/        # Reusable UI components
│   ├── composables/       # Global composition functions
│   ├── features/          # Feature modules (organized by role)
│   ├── router/            # Vue Router setup
│   ├── services/          # API services (api.js, auth service)
│   ├── views/             # Page components
│   ├── App.vue            # Root component
│   └── main.js            # Application entry point
├── .env.development       # Development environment variables
├── .env.production        # Production environment variables
├── package.json           # Frontend dependencies
└── vite.config.js         # Vite configuration
```

### Backend Structure

```
backend/
├── constants/             # Constant values (activity types)
├── controllers/           # Request handlers
├── middlewares/           # Express middlewares
├── models/                # Database models
├── routes/                # API route definitions
├── services/              # Business logic
├── utils/                 # Utility functions
├── .env                   # Environment variables (not committed)
├── db.js                  # Database connection
├── package.json           # Backend dependencies
└── server.js              # Express server entry point
```

---

## ✨ Features

### Admin Portal

- **Dashboard:** Overview of vaccinations, patients, and inventory
- **User Management:** Create and manage health worker and parent accounts
- **Patient Management:** View and manage all patient records
- **Vaccine Inventory:** Stock management, receiving reports, expiry tracking
- **SMS Management:** Send notifications, manage templates, view SMS logs
- **Analytics:** Vaccination coverage, trends, and reports
- **Activity Logs:** System-wide activity tracking

### Health Worker Portal

- **Dashboard:** Daily tasks, upcoming vaccinations, recent activities
- **Patient Management:** 
  - Add/edit patient records
  - Record immunization visits with vitals
  - Manage vaccination records
  - Track patient history
- **Inventory:** View vaccine stock levels and expiry dates
- **Messaging:** Communicate with parents and other health workers
- **Notifications:** Real-time updates and alerts
- **Tools:** QR code scanner for quick patient lookup

### Parent Portal

- **Dashboard:** Upcoming vaccinations, recent updates
- **Dependents:** View and manage child immunization records
- **Vaccination Schedule:** Upcoming and completed vaccines
- **Notifications:** Reminders and important updates
- **Messages:** Direct communication with health workers
- **Profile:** Update contact information

---

## 👥 User Roles

### 1. Admin
- Full system access
- User and data management
- SMS and notification control
- Analytics and reporting

### 2. Health Worker
- Patient care workflows
- Record immunizations
- Manage inventory (view only)
- Communicate with parents

### 3. Parent/Guardian
- View dependent records
- Track vaccination schedules
- Receive notifications
- Communicate with health workers

---

## 💻 Development Guidelines

### Code Style

- **Vue Components:** Use Composition API with `<script setup>`
- **Naming:** PascalCase for components, camelCase for functions/variables
- **File Structure:** Keep components under 600 lines (extract to composables/sub-components)
- **Composables:** Extract reusable logic into composables (prefix with `use`)

### Best Practices

1. **Component Organization:**
   - Keep views simple, delegate to feature components
   - Extract complex logic into composables
   - Use sub-components for reusability

2. **State Management:**
   - Use `ref` for primitive values
   - Use `reactive` for objects
   - Use `computed` for derived state

3. **API Calls:**
   - Use composables for API logic
   - Handle loading and error states
   - Show user feedback (toasts, errors)

4. **Error Handling:**
   - Always catch API errors
   - Show meaningful error messages
   - Log errors for debugging

### Recent Refactoring (November 2025)

- **AddPatientImmunizationRecord.vue:** Reduced from 1,615 → 575 lines
- **Messages.vue:** Reduced from 1,082 → 482 lines
- Created reusable components: VisitSelectorSection, VitalsFormSection, ServicesListSection, etc.
- Extracted composables: usePatientImmunizationForm, useVaccineSelection, useConversations

---

## 🚀 Deployment

### Production Environment Variables

**Backend Required:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - JWT signing secret (32+ characters)
- `NODE_ENV=production`
- `CORS_ORIGIN` - Frontend URL for CORS

**Frontend Required:**
- `VITE_API_BASE_URL` - Backend API URL
- `NODE_ENV=production`

### Future Deployment

This project will be converted to a Progressive Web App (PWA). See **[RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)** for Railway deployment instructions to be used after PWA conversion.

---

## 📚 Documentation

### Main Documentation

- **[RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)** - Railway deployment guide (for use after PWA conversion)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - General deployment reference
- **[CLEANUP_FOR_V3.md](./CLEANUP_FOR_V3.md)** - System cleanup checklist

### Docs Folder

Additional documentation is organized in the `docs/` folder:

- **[docs/README.md](./docs/README.md)** - Documentation index
- **[docs/INDEX.md](./docs/INDEX.md)** - File mapping reference
- **[docs/HEALTH_WORKER_FEATURES_QUICK_GUIDE.md](./docs/HEALTH_WORKER_FEATURES_QUICK_GUIDE.md)** - Health worker feature guide
- **[docs/HEALTH_WORKER_CHAT_NOTIFICATIONS.md](./docs/HEALTH_WORKER_CHAT_NOTIFICATIONS.md)** - Chat and notification system
- **[docs/SMS_SYSTEM_COMPLETE.md](./docs/SMS_SYSTEM_COMPLETE.md)** - SMS system documentation
- **[docs/SMS_MANAGEMENT_README.md](./docs/SMS_MANAGEMENT_README.md)** - SMS management guide

### Backend Documentation

Backend-specific docs are in the `backend/` folder:

- `backend/API_VACCINE_INVENTORY.md` - Vaccine inventory API
- `backend/LEDGER_README.md` - Ledger system
- `backend/SMS_BACKEND_README.md` - SMS backend integration
- `backend/SYSTEM_LOGGING.md` - Activity logging system

### Archived Documentation

Historical refactoring and analysis documents are archived in `docs/archive/refactoring-history/`.

---

## 🔐 Security

- JWT-based authentication
- Bcrypt password hashing
- CORS protection
- Environment variable security
- Row-level security in Supabase
- Input validation and sanitization

---

## 📦 Large Files Policy

To keep the repository healthy and within GitHub limits, avoid committing large, generated artifacts. These are ignored via `.gitignore`:

- `*git-change-report-*.txt`
- `*git-change-report-*.patch`
- `*git-change-report-*.diff`

If you generate these reports for local review, keep them untracked.

---

## 🤝 Contributing

This is an academic thesis project. For contributions or inquiries:

1. Create a feature branch from `system-prototype-v2`
2. Follow the code style guidelines
3. Test thoroughly before committing
4. Submit pull request with clear description

---

## 📞 Support

- **Repository:** https://github.com/clarknotkent/Thesis
- **Branch:** `system-prototype-v2`
- **Documentation:** See `docs/` folder and `DEPLOYMENT.md`

---

**Project:** ImmunizeMe - Immunization Management System  
**Version:** 2.0 (system-prototype-v2)  
**Last Updated:** November 2, 2025  
**Maintained by:** Clark Kent (clarknotkent)
