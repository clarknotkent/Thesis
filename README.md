# Immunization Management System

A comprehensive web-based system for managing immunization records, vaccine inventory, and patient care workflows for barangay health centers in the Philippines.

> **📌 Current Status:** Active Development - Version 4.10  
> **Last Updated:** November 13, 2025  
> **Branch:** system-prototype-v4  
>
> **Latest Updates:** See [CHANGELOG.md](CHANGELOG.md) for complete update history with all dated changes and improvements.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features](#features)
- [User Roles](#user-roles)
- [Architecture](#architecture)
- [Development Guidelines](#development-guidelines)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Security](#security)
- [Contributing](#contributing)
- [Support](#support)

---

## Overview

The Immunization Management System is designed to digitize and streamline the immunization tracking process for barangay health centers in the Philippines. It provides a centralized platform for managing patient records, tracking vaccinations, monitoring vaccine inventory, and communicating with guardians through automated SMS notifications.

### Key Features

- **Patient Record Management**: Digital health records for children and guardians
- **Vaccination Tracking**: Complete immunization history with scheduled and completed vaccines
- **Inventory Management**: Real-time vaccine stock levels, receiving reports, and expiry tracking
- **SMS Notifications**: Automated reminders and updates via PhilSMS integration
- **Reporting and Analytics**: Dashboard insights, coverage reports, and activity logs
- **Multi-User Access**: Role-based portals for administrators, health workers, and parents
- **Progressive Web App**: Service worker enabled for enhanced user experience

### Project Status

- Repository: https://github.com/clarknotkent/Thesis
- Current Branch: **system-prototype-v4**
- Version: 4.9 (November 13, 2025)
- Status: Active Development

---

## What’s New (November 13, 2025)

This release completes the vaccine inventory offline functionality with comprehensive offline support, Vue component fixes, and enhanced user experience.

- Offline‑first data loading:
  - Patient Details now loads from IndexedDB when offline; suppresses network error popups
  - Visit Summary (HW) loads from IndexedDB when offline and caches API responses when online for future offline use
- Offline guards with toasts and visual states:
  - Add New Patient and Add Immunization: disabled offline with informative toast
  - Edit Visit: disabled offline on Visit Summary; shows toast and disabled style
  - Reschedule vaccination: disabled offline on Patient Details; toast shown and edit UI blocked
- Data correctness & formatting:
  - Father's contact and occupation enriched offline via guardians cache (including same family_number fallbacks)
  - Time of Birth shows in 12‑hour format on Patient Details
- Prefetch robustness:
  - Fixed visits prefetch to handle paginated responses ({ items })

### Vaccine Inventory Offline System
- **Complete Offline Viewing**: Vaccine schedule viewing works fully offline after online sync
- **Offline Tab Management**: Receiving Reports tab disabled offline with informative toast notifications
- **Vue Component Fixes**: Resolved all missing Vue Composition API imports across inventory components
- **Reactivity Error Fixes**: Eliminated "_withMods" Vue reactivity errors by replacing problematic router-link elements
- **Router Error Resolution**: Fixed ViewInventory.vue and ViewSchedule.vue offline loading issues
- **Enhanced Data Prefetching**: Improved schedule data caching with additional denormalized fields
- **Defensive Programming**: Added conditional rendering and null-safe property access throughout

### Technical Improvements
- **Database Schema Updates**: Enhanced schedules table (version 4) for better offline compatibility
- **Toast Notification System**: Comprehensive offline feedback for all disabled features
- **Zero Compilation Errors**: All Vue components now compile without errors
- **Offline User Experience**: Consistent toast messages and visual states for offline restrictions

See the full entry in CHANGELOG.md dated 2025‑11‑13 for details and files changed.

---

## Tech Stack

### Frontend

- **Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite 7.x
- **Routing**: Vue Router 4
- **State Management**: Vue Reactivity API (ref, computed, reactive)
- **Code Quality**: ESLint 9.39.1 with Vue plugin and flat config format
- **UI Framework**: Bootstrap 5
- **Icons**: Bootstrap Icons
- **HTTP Client**: Axios
- **Charts**: Chart.js
- **QR Code**: html5-qrcode
- **PWA**: vite-plugin-pwa with Workbox

### Backend

- **Runtime**: Node.js 20+ with ES Modules
- **Framework**: Express.js
- **Module System**: Native ES6 `import`/`export`
- **Database**: PostgreSQL 14+ (hosted on Supabase)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **SMS Integration**: PhilSMS API
- **Security**: bcrypt, CORS, helmet
- **Logging**: Custom activity logger

### Database

- **DBMS**: PostgreSQL 14+
- **Hosting**: Supabase
- **Features**: Row Level Security (RLS), Triggers, Functions, Views
- **Migrations**: Version-controlled SQL files

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm 9+
- PostgreSQL database or Supabase account
- Git for version control
- PhilSMS API credentials (for SMS features)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/clarknotkent/Thesis.git
cd Thesis
git checkout system-prototype-v4
```

2. **Install dependencies**

```bash
npm install
```

This will install dependencies for both frontend and backend workspaces.

3. **Set up environment variables**

**Backend** (.env file in backend/ directory):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (.env.development file in frontend/ directory):
```env
VITE_API_BASE_URL=http://localhost:3001
NODE_ENV=development
```

4. **Run the application**

**Development Mode** (with hot-reload):
```bash
npm run dev
```

**Production Mode** (serves the built frontend):
```bash
npm run build
npm run start
```

### Access Points

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

### Offline Usage (Health Worker)

- What works offline (read‑only):
  - Patient details, vaccination history, scheduled vaccinations list, and visit/medical history after an online sync
  - Visit details (Visit Summary) for visits you’ve opened online at least once or that were included in prefetch
- Actions blocked offline (with toasts):
  - Add New Patient, Add Immunization, Edit Visit, Reschedule vaccination
- Seeding the offline cache:
  1. Go online and sign in
  2. Stay on the Health Worker portal to allow the prefetch to complete (runs automatically)
  3. Open a patient and their Visit Summary once (optional but speeds up offline readiness for those records)
- Refresh the cache anytime:
  - Use the Health Worker offline menu’s “Force Sync” if available, or
  - Clear site data in the browser, then repeat the online steps above
- Troubleshooting:
  - If Visit Summary is empty offline, ensure you’ve been online recently and the prefetch completed; the visits prefetch now supports paginated responses ({ items })

### Default Credentials

Contact your system administrator for default login credentials or refer to your database setup documentation.

---

## Project Structure

### Root Level Files

| File | Description |
|------|-------------|
| package.json | Root package with scripts to run both services |
| CHANGELOG.md | Complete version history with all dated changes |
| README.md | This file - project overview and documentation |
| RAILWAY_DEPLOYMENT_GUIDE.md | Railway deployment instructions |

### Frontend Structure

```
frontend/
├── public/                  # Static assets
│   ├── icons/              # PWA icons
│   └── manifest.json       # PWA manifest
├── src/
│   ├── assets/             # Images, styles, fonts
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # Layout wrappers
│   │   └── ui/             # Global UI components
│   ├── composables/        # Composition functions
│   ├── features/           # Feature modules by role
│   │   ├── admin/          # Admin-specific
│   │   ├── health-worker/  # Health worker-specific
│   │   ├── parent/         # Parent portal
│   │   └── shared/         # Shared across roles
│   ├── router/             # Vue Router config
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── views/              # Page components
│   ├── App.vue             # Root component
│   └── main.js             # Application entry
├── eslint.config.js        # ESLint configuration
├── package.json            # Frontend dependencies
└── vite.config.js          # Vite configuration
```

### Backend Structure

```
backend/
├── constants/              # Constant values
├── controllers/            # Request handlers (ES6 modules)
├── middlewares/            # Express middlewares
├── models/                 # Database models (ES6 modules)
├── routes/                 # API route definitions
├── services/               # Business logic services
├── utils/                  # Utility functions
├── scripts/                # Background workers and utilities
├── migrations/             # Database migrations
├── .env                    # Environment variables
├── db.js                   # Database connection
├── eslint.config.cjs       # ESLint configuration
├── package.json            # Backend dependencies
└── server.js               # Express server entry
```

---

## Features

### Admin Portal

- **Dashboard**: Overview of vaccinations, patients, inventory levels, and system activity
- **User Management**: Create and manage health worker and parent accounts
- **Patient Management**: View and manage all patient records across the system
- **Vaccine Inventory**: 
  - Stock management with real-time levels
  - Receiving reports for incoming shipments
  - Expiry tracking and alerts
  - Distribution history
- **SMS Management**:
  - Send bulk and individual notifications
  - Manage SMS templates
  - View SMS logs and delivery status
  - Configure automated reminders
- **Analytics and Reporting**: Coverage statistics, trends, custom reports
- **Activity Logs**: System-wide activity tracking and audit trails

### Health Worker Portal

- **Dashboard**: Daily tasks, upcoming vaccinations, recent activities
- **Patient Management**:
  - Add and edit patient records
  - Record immunization visits with vitals
  - Manage vaccination records
  - Track complete patient history
  - Schedule upcoming vaccinations
- **Inventory**: View vaccine stock levels and expiry dates
- **Messaging System**: Communicate with parents and guardians
- **Notifications**: Real-time updates and alerts
- **Tools**: QR code scanner, print vaccination cards, generate reports

### Parent Portal

- **Dashboard**: Upcoming vaccination schedules, recent updates, health reminders
- **Dependents**: View all children's immunization records and track growth
- **Vaccination Schedule**: See upcoming required vaccines and completed history
- **Notifications**: SMS and in-app reminders, appointment confirmations
- **Messaging**: Direct communication channel with health workers
- **Profile**: Update contact information and preferences

---

## User Roles

### 1. Administrator

Full system access with the following capabilities:
- Complete user management across all roles
- System configuration and settings
- SMS and notification control
- Inventory oversight and management
- Analytics and comprehensive reporting
- Activity monitoring and audit logs

### 2. Health Worker

Patient care and operational management:
- Patient registration and record management
- Immunization record keeping
- Vaccination administration and documentation
- Inventory viewing (read-only)
- Parent communication
- Basic reporting capabilities

### 3. Parent/Guardian

Limited access focused on their dependents:
- View dependent immunization records
- Track vaccination schedules
- Receive notifications and reminders
- Communicate with health workers
- Update contact information
- No access to other patients' data

---

## Architecture

### Frontend Architecture

The frontend follows a feature-based architecture organized by user roles and business domains:

**Key Principles:**
1. **Separation of Concerns**: UI components, business logic, and API services are separated
2. **Role-Based Access**: Each user role has dedicated features and components
3. **Reusability**: Shared components and composables for common functionality
4. **Composition API**: All Vue components use Composition API with script setup syntax
5. **Modern JavaScript**: ES6 modules throughout with proper imports

### Backend Architecture

The backend follows a standard MVC pattern with additional service layers, fully modernized with ES modules:

**Modern JavaScript Standards:**
- **Native ES6 Modules**: All 86 backend files use `import`/`export`
- **Named Exports Pattern**: Controllers and models use `export { functionA, functionB }`
- **File Extensions Required**: `import x from './file.js'` (`.js` mandatory)
- **Top-Level Await**: Supported throughout codebase
- **Zero CommonJS**: No `require()` or `module.exports`

**Import Pattern Examples:**
```javascript
// Controllers (named exports)
import * as patientController from './controllers/patientController.js';

// Models (named exports)
import * as patientModel from './models/patientModel.js';

// Database (default export)
import supabase from './db.js';

// Middleware (named exports)
import { authenticate, authorize } from './middlewares/authMiddleware.js';
```

### Design Principles

1. **Modern JavaScript**: ES6 modules throughout for better maintainability
2. **Type Safety**: Consistent data structures across frontend and backend
3. **Scalability**: Feature-based structure allows easy addition of new modules
4. **Security First**: Authentication, authorization, and data protection at every level
5. **Performance**: Optimized queries, caching strategies, efficient data structures

---

## Development Guidelines

### Code Style Standards

- **Vue Components**: Use Composition API with script setup syntax
- **Naming Conventions**:
  - PascalCase for component names
  - camelCase for functions and variables
  - kebab-case for file names
- **File Organization**: Keep components under 600 lines (extract to composables or sub-components)
- **Composables**: Extract reusable logic into composables with "use" prefix
- **ESLint**: Run `npm run lint` before committing

### Best Practices

#### Component Organization

- Keep view components simple and focused on layout
- Delegate business logic to feature components
- Extract complex logic into composables
- Create sub-components for reusability
- Use props and events for component communication

#### State Management

- Use `ref()` for primitive values
- Use `reactive()` for objects and arrays
- Use `computed()` for derived state
- Avoid deeply nested reactive objects
- Keep state as local as possible

#### API Integration

- Use composables for API logic
- Handle loading states consistently
- Show appropriate user feedback (toasts, errors)
- Implement proper error handling
- Validate data before submission

#### Error Handling

- Always catch API errors
- Show meaningful error messages to users
- Log errors for debugging
- Implement retry logic for transient failures
- Validate data before submission

---

## API Documentation

### Base URL

- Development: http://localhost:3001/api
- Production: (To be configured)

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Main API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `GET /api/patients/stats` - Get patient statistics
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

#### Immunizations
- `GET /api/immunizations` - Get all immunizations
- `GET /api/immunizations/patient/:id` - Get patient immunizations
- `POST /api/immunizations` - Record immunization
- `PUT /api/immunizations/:id` - Update immunization record

#### Inventory
- `GET /api/vaccines` - Get vaccine inventory
- `GET /api/vaccines/inventory/:id` - Get vaccine details
- `POST /api/vaccines/receive` - Record vaccine receipt
- `PUT /api/vaccines/:id` - Update vaccine stock

#### SMS
- `POST /api/sms/send` - Send SMS notification
- `GET /api/sms/logs` - Get SMS logs
- `GET /api/sms/templates` - Get SMS templates
- `POST /api/sms/guardians/bulk-toggle` - Bulk toggle auto-send
- `PUT /api/sms/guardians/:guardianId` - Toggle individual guardian

For complete API documentation, see backend/API_DOCUMENTATION.md

---

## Deployment

### Production Environment Variables

#### Backend Required Variables

```env
SUPABASE_URL=your_production_supabase_url
SUPABASE_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
JWT_SECRET=your_strong_jwt_secret_minimum_32_characters
NODE_ENV=production
CORS_ORIGIN=your_frontend_production_url
```

#### Frontend Required Variables

```env
VITE_API_BASE_URL=your_backend_api_url
NODE_ENV=production
```

### Deployment Options

#### Railway Deployment

This project is configured for Railway deployment. See [RAILWAY_DEPLOYMENT_GUIDE.md](RAILWAY_DEPLOYMENT_GUIDE.md) for detailed instructions.

#### Manual Deployment

1. **Build the frontend**:
```bash
cd frontend
npm run build
```

2. Deploy backend to your Node.js hosting service
3. Deploy frontend build to static hosting (Netlify, Vercel, etc.)
4. Configure environment variables on hosting platforms
5. Set up database on Supabase or PostgreSQL hosting

### PWA Deployment Notes

The application is production-ready as a Progressive Web App:
- Service worker automatically registers on deployment
- All PWA assets generated during build process
- Installable on all major platforms (Android, iOS, Desktop)
- Lighthouse PWA score: Ready for audit

---

## Documentation

### Main Documentation Files

- **[CHANGELOG.md](CHANGELOG.md)** - Complete version history with all dated changes
- **[RAILWAY_DEPLOYMENT_GUIDE.md](RAILWAY_DEPLOYMENT_GUIDE.md)** - Railway deployment instructions
- **[docs/README.md](docs/README.md)** - Complete documentation index (start here!)

### Documentation Structure

All documentation is organized in the `docs/` folder with a clean structure:

```
docs/
├── README.md                    # Complete documentation index
├── backend/                     # Backend documentation (7 files)
├── frontend/                    # Frontend documentation (organized)
│   ├── components/              # Component docs
│   ├── features/                # Feature docs by portal
│   └── services/                # Service documentation
├── reference/                   # Active reference docs (✅ Current)
├── offline-architecture/        # Offline system (⚠️ Deprecated)
├── parent-offline/              # Parent offline (⚠️ Deprecated)
└── archive/                     # Historical docs (🗄️ Archived)
```

### Quick Links by Topic

**Backend Development:**
- [API Documentation](docs/backend/API_VACCINE_INVENTORY.md) - Vaccine inventory API
- [SMS Integration](docs/backend/SMS_BACKEND_README.md) - SMS system
- [System Logging](docs/backend/SYSTEM_LOGGING.md) - Activity logs
- [Ledger System](docs/backend/LEDGER_README.md) - Transaction ledger

**Frontend Development:**
- [Features Overview](docs/frontend/features/overview.md) - All features
- [Admin Portal](docs/frontend/features/admin-features.md) - Admin features
- [Health Worker Portal](docs/frontend/features/health-worker-features.md) - Health worker features
- [Parent Portal](docs/frontend/features/parent-features.md) - Parent features

**System Administration:**
- [QA Reset Instructions](docs/reference/QA-RESET-INSTRUCTIONS.md) - Database reset
- [API Payloads](docs/reference/API-PAYLOADS.md) - Request payload documentation

**Complete Index:** See [docs/README.md](docs/README.md) for the full documentation index with 44+ organized files

---

## Security

### Authentication and Authorization

- JWT-based authentication for all API requests
- Role-based access control (RBAC) for different user types
- Secure password hashing using bcrypt
- Token expiration and refresh mechanisms

### Data Protection

- Row-level security in Supabase database
- Input validation and sanitization on all endpoints
- SQL injection prevention through parameterized queries
- XSS protection through output encoding

### Network Security

- CORS configuration for allowed origins
- Helmet.js for security headers
- HTTPS enforcement in production
- Rate limiting on API endpoints

### Best Practices

- Environment variables for sensitive data
- No credentials in version control
- Regular security audits
- Dependency vulnerability scanning
- Secure session management

---

## Contributing

This is an academic thesis project. Contributions and inquiries are welcome:

### How to Contribute

1. **Create a feature branch from system-prototype-v4**
```bash
git checkout system-prototype-v4
git pull origin system-prototype-v4
git checkout -b feature/your-feature-name
```

2. **Follow the code style guidelines outlined above**

3. **Test thoroughly before committing**
```bash
npm run lint
npm run test
```

4. **Commit with clear, descriptive messages**
```bash
git commit -m "feat: Add new feature description"
```

5. **Submit pull request with detailed description of changes**

### Commit Message Guidelines

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks

---

## Support

### Contact Information

- **Repository**: https://github.com/clarknotkent/Thesis
- **Branch**: system-prototype-v4
- **Issues**: Use GitHub Issues for bug reports and feature requests

### Documentation Resources

- Complete documentation: docs/ folder
- Deployment guides: RAILWAY_DEPLOYMENT_GUIDE.md
- API documentation: backend/API_DOCUMENTATION.md
- **Version history**: CHANGELOG.md (with all dated changes)

### Getting Help

1. Check the docs/ folder for comprehensive guides
2. Review CHANGELOG.md for recent changes and fixes
3. Review closed issues on GitHub for similar problems
4. Open a new issue with detailed description and steps to reproduce
5. Contact the maintainer for urgent matters

---

**Project**: Immunization Management System  
**Version**: 4.10  
**Last Updated**: November 13, 2025  
**Maintained by**: Clark Kent (clarknotkent), JapethDee and RobertBite15  
**License**: Academic Thesis Project

**For complete update history with all dates and changes, see [CHANGELOG.md](CHANGELOG.md)**
