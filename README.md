# 💉 ImmunizeMe - Immunization Management System# 💉 ImmunizeMe - Immunization Management System 💉



A comprehensive web-based system for managing immunization records, vaccine inventory, and patient care workflows for barangay health centers.

A comprehensive web-based system for managing immunization records, vaccine inventory, and patient care workflows for barangay health centers.A comprehensive web-based system for managing immunization records, vaccine inventory, and patient care workflows for barangay health centers.

**Branch:** `system-prototype-v3` | **Status:** Active Development | **Last Updated:** November 2, 2025



---

**Branch:** `system-prototype-v2` | **Status:** Active Development | **Last Updated:** November 2, 2025**Branch:** `system-prototype-v2` | **Status:** Active Development | **Last Updated:** November 2, 2025

## 📋 Table of Contents



- [Overview](#overview)

- [Quick Start](#quick-start)------

- [Tech Stack](#tech-stack)

- [Architecture](#architecture)

- [Project Structure](#project-structure)

- [Features](#features)

- [User Roles](#user-roles)------

- [Development Guidelines](#development-guidelines)

- [Deployment](#deployment)

- [Documentation](#documentation)

- [Security](#security)## 📋 Table of Contents## 📋 Table of Contents

- [Contributing](#contributing)

- [Support](#support)



---- [Overview](#overview)- [Overview](#overview)



## 🎯 Overview- [Quick Start](#quick-start)- [Quick Start](#quick-start)



The **ImmunizeMe** system digitizes and streamlines the immunization tracking process for barangay health centers in the Philippines. It provides a centralized platform for:- [Tech Stack](#tech-stack)- [Tech Stack](#tech-stack)



- **Patient Record Management** - Digital health records for children and guardians- [Architecture](#architecture)- [Architecture](#architecture)

- **Vaccination Tracking** - Scheduled and completed vaccinations with comprehensive history

- **Inventory Management** - Vaccine stock levels, receiving reports, and expiry tracking- [Project Structure](#project-structure)- [Project Structure](#project-structure)

- **SMS Notifications** - Automated reminders and updates via PhilSMS integration

- **Reporting & Analytics** - Dashboard insights and activity logs- [Features](#features)- [Features](#features)

- **Multi-Role Access** - Role-based portals for admins, health workers, and parents

- [User Roles](#user-roles)- [User Roles](#user-roles)

---

- [Development Guidelines](#development-guidelines)- [Development Guidelines](#development-guidelines)

## 🚀 Quick Start

- [Deployment](#deployment)- [Deployment](#deployment)

### Prerequisites

- [Documentation](#documentation)- [Documentation](#documentation)

- **Node.js** 20+ and npm 9+

- **PostgreSQL** database (or Supabase account)

- **Git** for version control

------

### Installation



```bash

# Clone the repository## 🎯 Overview## 🎯 Overview

git clone https://github.com/clarknotkent/Thesis.git

cd Thesis

git checkout system-prototype-v3

The **ImmunizeMe** system digitizes and streamlines the immunization tracking process for barangay health centers in the Philippines. It provides a centralized platform for:The **ImmunizeMe** system digitizes and streamlines the immunization tracking process for barangay health centers in the Philippines. It provides a centralized platform for:

# Install dependencies for both frontend and backend

npm install



# Set up environment variables- **Patient Record Management** - Digital health records for children and guardians- **Patient Record Management** - Digital health records for children and guardians

# Backend: Copy backend/.env.example to backend/.env and configure

# Frontend: Copy frontend/.env.development.example to frontend/.env.development- **Vaccination Tracking** - Scheduled and completed vaccinations with comprehensive history- **Vaccination Tracking** - Scheduled and completed vaccinations with comprehensive history



# Run development servers- **Inventory Management** - Vaccine stock levels, receiving reports, and expiry tracking- **Inventory Management** - Vaccine stock levels, receiving reports, and expiry tracking

npm run dev

```- **SMS Notifications** - Automated reminders and updates via PhilSMS integration- **SMS Notifications** - Automated reminders and updates via PhilSMS integration



### Access the Application- **Reporting & Analytics** - Dashboard insights and activity logs- **Reporting & Analytics** - Dashboard insights and activity logs



- **Frontend:** http://localhost:5173- **Multi-Role Access** - Role-based portals for admins, health workers, and parents- **Multi-Role Access** - Role-based portals for admins, health workers, and parents

- **Backend API:** http://localhost:3001

- **API Health Check:** http://localhost:3001/api/health



### Default Credentials------



See your database setup or contact the admin for default login credentials.



---## 🚀 Quick Start## 🚀 Quick Start



## 🛠️ Tech Stack



### **Frontend**### Prerequisites### Prerequisites

- **Framework:** Vue.js 3 (Composition API)

- **Build Tool:** Vite

- **Routing:** Vue Router 4

- **State Management:** Vue Reactivity API (ref, computed, reactive)- **Node.js** 20+ and npm 9+- **Node.js** 20+ and npm 9+

- **UI Framework:** Bootstrap 5

- **Icons:** Bootstrap Icons- **PostgreSQL** database (or Supabase account)- **PostgreSQL** database (or Supabase account)

- **HTTP Client:** Axios

- **Charts:** Chart.js- **Git** for version control- **Git** for version control

- **QR Code:** html5-qrcode



### **Backend**

- **Runtime:** Node.js### Installation### Installation

- **Framework:** Express.js

- **Database:** PostgreSQL (Supabase)

- **Authentication:** JWT (JSON Web Tokens)

- **File Upload:** Multer```bash```bash

- **SMS Integration:** PhilSMS API

- **Security:** bcrypt, CORS, helmet# Clone the repository# Clone the repository



### **Database**git clone https://github.com/clarknotkent/Thesis.gitgit clone https://github.com/clarknotkent/Thesis.git

- **DBMS:** PostgreSQL 14+

- **Hosting:** Supabasecd Thesiscd Thesis

- **Features:** Row Level Security (RLS), Triggers, Functions, Views

- **Migrations:** Version-controlled SQL files in `db/`git checkout system-prototype-v2git checkout system-prototype-v2



---



## 🏗️ Architecture# Install dependencies for both frontend and backend# Install dependencies for both frontend and backend



### **Frontend Architecture (Feature-Based)**npm installnpm install



```

frontend/src/

├── components/# Set up environment variables# Set up environment variables

│   ├── layout/              # Layout wrappers (AdminLayout, HealthWorkerLayout, ParentLayout)

│   └── ui/                  # Global reusable UI components# Backend: Copy backend/.env.example to backend/.env and configure# Backend: Copy backend/.env.example to backend/.env and configure

│       ├── base/            # Primitive components (buttons, cards, modals, tables)

│       ├── form/            # Form inputs (date, time, searchable select)# Frontend: Copy frontend/.env.development.example to frontend/.env.development# Frontend: Copy frontend/.env.development.example to frontend/.env.development

│       └── feedback/        # User feedback (toasts, confirm dialogs)

│

├── features/                # Business domain modules

│   ├── admin/               # Admin-specific components (SMS, inventory, analytics)# Run development servers (both services)# Run development servers

│   ├── health-worker/       # Health worker components

│   ├── parent/              # Parent portal componentsnpm run devnpm run dev

│   └── shared/              # Shared components across roles

│``````

├── views/                   # Page components (routes)

│   ├── admin/               # Admin portal pages

│   ├── healthworker/        # Health worker portal pages

│   └── parent/              # Parent portal pages### Access the Application### Access the Application

│

├── composables/             # Reusable composition functions

├── services/                # API services

└── router/                  # Vue Router configuration- **Frontend:** http://localhost:5173- **Frontend:** http://localhost:5173

```

- **Backend API:** http://localhost:3001- **Backend API:** http://localhost:3001

### Monorepo Structure

- **API Health Check:** http://localhost:3001/api/health- **API Health Check:** http://localhost:3001/api/health

This project uses a **monorepo** structure with separate frontend and backend services:



```

system-prototype-v3/### Port Configuration### Default Credentials

├── frontend/                # Vue.js application

│   ├── src/

│   │   ├── components/     # UI components

│   │   ├── features/       # Feature modules by role| Service | Mode | Port | URL |See your database setup or contact the admin for default login credentials.

│   │   ├── views/          # Page components (routes)

│   │   ├── composables/    # Reusable composition functions|---------|------|------|-----|

│   │   ├── services/       # API services

│   │   └── router/         # Vue Router configuration| **Backend API** | All | `3001` | http://localhost:3001 |---

│   ├── package.json

│   └── vite.config.js| **Frontend** | Development | `5173` | http://localhost:5173 |

│

├── backend/                # Express.js API| **Frontend** | Production | `5173` | http://localhost:5173 |## 🛠️ Tech Stack

│   ├── controllers/        # Request handlers

│   ├── models/             # Database models

│   ├── routes/             # API routes

│   ├── middlewares/        # Auth, error handling### Development Commands### **Frontend**

│   ├── services/           # Business logic (SMS, notifications)

│   ├── utils/              # Utility functions- **Framework:** Vue.js 3 (Composition API)

│   ├── package.json

│   └── server.js```bash- **Build Tool:** Vite

│

├── docs/                   # Comprehensive documentation# Run both services with hot reload- **Routing:** Vue Router 4

├── package.json            # Root package (runs both services)

└── DEPLOYMENT.md           # Deployment guidenpm run dev- **State Management:** Vue Reactivity API (ref, computed, reactive)

```

- **UI Framework:** Bootstrap 5

### Key Design Principles

# Run services individually- **Icons:** Bootstrap Icons

1. **Separation of Concerns:** UI components, business logic (composables), and API services are separated

2. **Role-Based Access:** Each role has dedicated features and componentsnpm run dev:backend     # Backend only (port 3001)- **HTTP Client:** Axios

3. **Reusability:** Shared components in `features/shared/` and global `components/`

4. **Type Safety:** Consistent data-structures across frontend and backendnpm run dev:frontend    # Frontend only (port 5173)- **Charts:** Chart.js

5. **Scalability:** Feature-based structure allows easy addition of new modules

6. **Composition API:** All components use Vue 3 Composition API with `<script setup>`- **QR Code:** html5-qrcode



---# Production build and serve



## 📁 Project Structurenpm run build           # Build frontend### **Backend**



### Root Level Filesnpm run start           # Run both services in production mode- **Runtime:** Node.js



| File | Description |```- **Framework:** Express.js

|------|-------------|

| `package.json` | Root package with scripts to run both services |- **Database:** PostgreSQL (Supabase)

| `CHANGELOG.md` | Version history and changes log |

| `RAILWAY_DEPLOYMENT_GUIDE.md` | Railway deployment guide (for PWA deployment) |---- **Authentication:** JWT (JSON Web Tokens)

| `DEPLOYMENT.md` | General deployment reference |

| `CLEANUP_FOR_V3.md` | Cleanup checklist for v3 branch preparation |- **File Upload:** Multer

| `README.md` | This file |

## 🛠️ Tech Stack- **SMS Integration:** PhilSMS API

### Frontend Structure

- **Security:** bcrypt, CORS, helmet

```

frontend/### Frontend

├── public/                 # Static assets

├── src/- **Framework:** Vue.js 3 (Composition API with `<script setup>`)### **Database**

│   ├── assets/            # Images, styles

│   ├── components/        # Reusable UI components- **Build Tool:** Vite 7.1.12- **DBMS:** PostgreSQL 14+

│   ├── composables/       # Global composition functions

│   ├── features/          # Feature modules (organized by role)- **Routing:** Vue Router 4- **Hosting:** Supabase

│   ├── router/            # Vue Router setup

│   ├── services/          # API services (api.js, auth service)- **State Management:** Vue Reactivity API (ref, computed, reactive)- **Features:** Row Level Security (RLS), Triggers, Functions, Views

│   ├── views/             # Page components

│   ├── App.vue            # Root component- **UI Framework:** Bootstrap 5- **Migrations:** Version-controlled SQL files in `db/`

│   └── main.js            # Application entry point

├── .env.development       # Development environment variables- **Icons:** Bootstrap Icons

├── .env.production        # Production environment variables

├── package.json           # Frontend dependencies- **HTTP Client:** Axios---

└── vite.config.js         # Vite configuration

```- **Charts:** Chart.js



### Backend Structure- **QR Code:** html5-qrcode## 🏗️ Architecture



```

backend/

├── constants/             # Constant values (activity types)### Backend### **Frontend Architecture (Feature-Based)**

├── controllers/           # Request handlers

├── middlewares/           # Express middlewares- **Runtime:** Node.js 20+

├── models/                # Database models

├── routes/                # API route definitions- **Framework:** Express.js```

├── services/              # Business logic

├── utils/                 # Utility functions- **Database:** PostgreSQL (Supabase)frontend/src/

├── .env                   # Environment variables (not committed)

├── db.js                  # Database connection- **Authentication:** JWT (JSON Web Tokens)├── components/

├── package.json           # Backend dependencies

└── server.js              # Express server entry point- **File Upload:** Multer│   ├── layout/              # Layout wrappers (AdminLayout, HealthWorkerLayout, ParentLayout)

```

- **SMS Integration:** PhilSMS API│   └── ui/                  # Global reusable UI components

---

- **Security:** bcrypt, CORS, helmet│       ├── base/            # Primitive components (buttons, cards, modals, tables)

## ✨ Features

- **Logging:** Custom activity logger│       ├── form/            # Form inputs (date, time, searchable select)

### Admin Portal

│       └── feedback/        # User feedback (toasts, confirm dialogs)

- **Dashboard:** Overview of vaccinations, patients, and inventory

- **User Management:** Create and manage health worker and parent accounts### Database│

- **Patient Management:** View and manage all patient records

- **Vaccine Inventory:** Stock management, receiving reports, expiry tracking- **DBMS:** PostgreSQL 14+├── features/                # Business domain modules

- **SMS Management:** Send notifications, manage templates, view SMS logs

- **Analytics:** Vaccination coverage, trends, and reports- **Hosting:** Supabase│   ├── admin/               # Admin-specific components (SMS, inventory, analytics)

- **Activity Logs:** System-wide activity tracking

- **Features:** Row Level Security (RLS), Triggers, Functions, Views│   ├── health-worker/       # Health worker components

### Health Worker Portal

- **Migrations:** Version-controlled SQL files│   ├── parent/              # Parent portal components

- **Dashboard:** Daily tasks, upcoming vaccinations, recent activities

- **Patient Management:** │   └── shared/              # Shared components across roles

  - Add/edit patient records

  - Record immunization visits with vitals---│

  - Manage vaccination records

  - Track patient history├── views/                   # Page components (routes)

- **Inventory:** View vaccine stock levels and expiry dates

- **Messaging:** Communicate with parents and other health workers## 🏗️ Architecture│   ├── admin/               # Admin portal pages

- **Notifications:** Real-time updates and alerts

- **Tools:** QR code scanner for quick patient lookup│   ├── healthworker/        # Health worker portal pages



### Parent Portal### Monorepo Structure│   └── parent/              # Parent portal pages



- **Dashboard:** Upcoming vaccinations, recent updates## Documentation moved

- **Dependents:** View and manage child immunization records

- **Vaccination Schedule:** Upcoming and completed vaccinesThis project uses a **monorepo** structure with separate frontend and backend services:

- **Notifications:** Reminders and important updates

- **Messages:** Direct communication with health workersThis project's documentation has been centralized under the docs/ folder.

- **Profile:** Update contact information

```

---

system-prototype-v2/- Start here: docs/README.md

## 👥 User Roles

├── frontend/                # Vue.js application- Full mapping of moved files: docs/INDEX.md

### 1. Admin

- Full system access│   ├── src/

- User and data management

- SMS and notification control│   │   ├── components/     # UI componentsQuick links:

- Analytics and reporting

│   │   │   ├── layout/     # Layout wrappers (AdminLayout, HealthWorkerLayout, ParentLayout)- Changelog: docs/CHANGELOG_V2.md

### 2. Health Worker

- Patient care workflows│   │   │   └── ui/         # Global reusable components- Health Worker features: docs/HEALTH_WORKER_FEATURES_QUICK_GUIDE.md

- Record immunizations

- Manage inventory (view only)│   │   │       ├── base/   # Primitives (buttons, cards, modals, tables)- Chat & Notifications: docs/HEALTH_WORKER_CHAT_NOTIFICATIONS.md

- Communicate with parents

│   │   │       ├── form/   # Form inputs (date, time, searchable select)- SMS System (complete): docs/SMS_SYSTEM_COMPLETE.md

### 3. Parent/Guardian

- View dependent records│   │   │       └── feedback/ # User feedback (toasts, confirm dialogs)- SMS Quick Reference: docs/SMS_QUICK_REFERENCE.md

- Track vaccination schedules

- Receive notifications│   │   ├── features/       # Feature modules by roleIf you encounter a broken link, check docs/INDEX.md for the original → new path mapping.

- Communicate with health workers

│   │   │   ├── admin/      # Admin features (SMS, inventory, analytics)├── services/                # Business logic (SMS, notifications)

---

│   │   │   ├── health-worker/ # Health worker features

## 💻 Development Guidelines

│   │   │   ├── parent/     # Parent portal features## 📦 Large files policy

### Code Style

│   │   │   └── shared/     # Cross-role components

- **Vue Components:** Use Composition API with `<script setup>`

- **Naming:** PascalCase for components, camelCase for functions/variables│   │   ├── views/          # Page components (routes)To keep the repository healthy and within GitHub limits, avoid committing large, generated change-report artifacts. These are ignored via `.gitignore`:

- **File Structure:** Keep components under 600 lines (extract to composables/sub-components)

- **Composables:** Extract reusable logic into composables (prefix with `use`)│   │   │   ├── admin/



### Best Practices│   │   │   ├── healthworker/- `*git-change-report-*.txt`



1. **Component Organization:**│   │   │   └── parent/- `*git-change-report-*.patch`

   - Keep views simple, delegate to feature components

   - Extract complex logic into composables│   │   ├── composables/    # Reusable composition functions- `*git-change-report-*.diff`

   - Use sub-components for reusability

│   │   ├── services/       # API services

2. **State Management:**

   - Use `ref` for primitive values│   │   └── router/         # Vue Router configurationIf you generate these reports for local review, keep them untracked. If long-term storage is required, prefer an external storage location or Git LFS in a separate archival repo.

   - Use `reactive` for objects

   - Use `computed` for derived state│   ├── package.json

│   └── vite.config.js

3. **API Calls:**│

   - Use composables for API logic├── backend/                # Express.js API

   - Handle loading and error states│   ├── controllers/        # Request handlers

   - Show user feedback (toasts, errors)│   ├── models/             # Database models

│   ├── routes/             # API routes

4. **Error Handling:**│   ├── middlewares/        # Auth, error handling

   - Always catch API errors│   ├── services/           # Business logic (SMS, notifications)

   - Show meaningful error messages│   ├── utils/              # Utility functions

   - Log errors for debugging│   ├── package.json

│   └── server.js

### Recent Refactoring (November 2025)│

├── docs/                   # Comprehensive documentation

- **Modular Architecture:** Migrated to feature-based structure for better maintainability├── package.json            # Root package (runs both services)

- **Component Optimization:** Reduced large components by 50-70% through extraction└── DEPLOYMENT.md           # Deployment guide

- **Composables:** Created 15+ reusable composables for common logic```

- **Documentation:** Reorganized docs with kebab-case naming and categorical structure

### Feature-Based Frontend Organization

---

Components are organized by **feature** and **role** for better maintainability:

## 🚀 Deployment

```

### Production Environment Variablesfrontend/src/features/

├── admin/                  # Admin-only features

**Backend Required:**│   ├── inventory/         # Vaccine inventory management

- `SUPABASE_URL` - Supabase project URL│   ├── sms/               # SMS management and templates

- `SUPABASE_KEY` - Supabase anon key│   ├── analytics/         # Analytics and reporting

- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key│   └── ...

- `JWT_SECRET` - JWT signing secret (32+ characters)├── health-worker/          # Health worker features

- `NODE_ENV=production`│   ├── patients/          # Patient management

- `CORS_ORIGIN` - Frontend URL for CORS│   │   ├── components/    # Patient-specific components

│   │   ├── composables/   # Patient-related logic (usePatientForm, etc.)

**Frontend Required:**│   │   └── views/         # Patient pages

- `VITE_API_BASE_URL` - Backend API URL│   ├── messages/          # Messaging system

- `NODE_ENV=production`│   │   ├── components/    # Chat components

│   │   ├── composables/   # Messaging logic

### Future Deployment│   │   └── views/         # Messages page

│   ├── inventory/         # Inventory viewing

This project will be converted to a Progressive Web App (PWA). See **[RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)** for Railway deployment instructions to be used after PWA conversion.│   ├── notifications/     # Notifications

│   └── tools/             # QR scanner, utilities

---├── parent/                # Parent portal features

│   ├── dependents/        # Dependent management

## 📚 Documentation│   ├── notifications/     # Parent notifications

│   ├── messages/          # Parent messaging

### Main Documentation│   └── ...

└── shared/                # Cross-role components

- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes```

- **[RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)** - Railway deployment guide (for use after PWA conversion)

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - General deployment reference### Key Design Principles

- **[CLEANUP_FOR_V3.md](./CLEANUP_FOR_V3.md)** - System cleanup checklist

1. **Separation of Concerns:** UI components, business logic (composables), and API services are separated

### Docs Folder2. **Role-Based Access:** Each role has dedicated features and components

3. **Reusability:** Shared components in `features/shared/` and global `components/`

Additional documentation is organized in the `docs/` folder with a categorical structure:4. **Type Safety:** Consistent data structures across frontend and backend

5. **Scalability:** Feature-based structure allows easy addition of new modules

- **[docs/README.md](./docs/README.md)** - Documentation overview and navigation6. **Composition API:** All components use Vue 3 Composition API with `<script setup>`

- **[docs/INDEX.md](./docs/INDEX.md)** - Complete file index with 32 documented files

---

#### Features Documentation

- **[docs/features/health-worker-guide.md](./docs/features/health-worker-guide.md)** - Health worker portal complete guide## 📁 Project Structure

- **[docs/features/for-japeth.md](./docs/features/for-japeth.md)** - Setup instructions and implementation notes

### Root Level Files

#### Architecture Documentation

- **[docs/architecture/health-worker.md](./docs/architecture/health-worker.md)** - Health worker portal architecture| File | Description |

- **[docs/architecture/chat-notifications.md](./docs/architecture/chat-notifications.md)** - Chat and notification system design|------|-------------|

| `package.json` | Root package with scripts to run both services |

#### SMS System Documentation| `RAILWAY_DEPLOYMENT_GUIDE.md` | Railway deployment guide (for PWA deployment) |

- **[docs/sms-system/complete-guide.md](./docs/sms-system/complete-guide.md)** - Comprehensive SMS system guide| `DEPLOYMENT.md` | General deployment reference |

- **[docs/sms-system/management.md](./docs/sms-system/management.md)** - SMS management features| `CLEANUP_FOR_V3.md` | Cleanup checklist for v3 branch preparation |

- **[docs/sms-system/template-specs.md](./docs/sms-system/template-specs.md)** - Template specifications and variables| `README.md` | This file |

- **[docs/sms-system/testing-plan.md](./docs/sms-system/testing-plan.md)** - SMS testing procedures

### Frontend Structure

### Backend Documentation

```

Backend-specific docs are in the `backend/` folder:frontend/

├── public/                 # Static assets

- `backend/API_VACCINE_INVENTORY.md` - Vaccine inventory API├── src/

- `backend/LEDGER_README.md` - Ledger system│   ├── assets/            # Images, styles

- `backend/SMS_BACKEND_README.md` - SMS backend integration│   ├── components/        # Reusable UI components

- `backend/SYSTEM_LOGGING.md` - Activity logging system│   ├── composables/       # Global composition functions

│   ├── features/          # Feature modules (organized by role)

### Archived Documentation│   ├── router/            # Vue Router setup

│   ├── services/          # API services (api.js, auth service)

Historical refactoring and analysis documents are archived in `docs/archive/refactoring-history/`:│   ├── views/             # Page components

- **2025-11-01 Analysis** - 13 files including API catalog, entities reference, system flows│   ├── App.vue            # Root component

- **2025-11-02 Refactoring** - 6 files documenting parent and health worker refactoring│   └── main.js            # Application entry point

├── .env.development       # Development environment variables

---├── .env.production        # Production environment variables

├── package.json           # Frontend dependencies

## 🔐 Security└── vite.config.js         # Vite configuration

```

- JWT-based authentication

- Bcrypt password hashing### Backend Structure

- CORS protection

- Environment variable security```

- Row-level security in Supabasebackend/

- Input validation and sanitization├── constants/             # Constant values (activity types)

├── controllers/           # Request handlers

---├── middlewares/           # Express middlewares

├── models/                # Database models

## 🤝 Contributing├── routes/                # API route definitions

├── services/              # Business logic

This is an academic thesis project. For contributions or inquiries:├── utils/                 # Utility functions

├── .env                   # Environment variables (not committed)

1. Create a feature branch from `system-prototype-v3`├── db.js                  # Database connection

2. Follow the code style guidelines├── package.json           # Backend dependencies

3. Test thoroughly before committing└── server.js              # Express server entry point

4. Submit pull request with a clear description```



------



## 📞 Support## ✨ Features



- **Repository:** https://github.com/clarknotkent/Thesis### Admin Portal

- **Branch:** `system-prototype-v3`

- **Documentation:** See `docs/` folder and `CHANGELOG.md`- **Dashboard:** Overview of vaccinations, patients, and inventory

- **User Management:** Create and manage health worker and parent accounts

---- **Patient Management:** View and manage all patient records

- **Vaccine Inventory:** Stock management, receiving reports, expiry tracking

**Project:** ImmunizeMe - Immunization Management System  - **SMS Management:** Send notifications, manage templates, view SMS logs

**Version:** 3.0 (system-prototype-v3)  - **Analytics:** Vaccination coverage, trends, and reports

**Last Updated:** November 2, 2025  - **Activity Logs:** System-wide activity tracking

**Maintained by:** Clark Kent (clarknotkent)

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
