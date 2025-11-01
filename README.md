# Immunization Management System

A comprehensive web-based system for managing immunization records, vaccine inventory, and patient care workflows for barangay health centers in the Philippines.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features](#features)
- [User Roles](#user-roles)
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

- Patient Record Management: Digital health records for children and guardians
- Vaccination Tracking: Complete immunization history with scheduled and completed vaccines
- Inventory Management: Real-time vaccine stock levels, receiving reports, and expiry tracking
- SMS Notifications: Automated reminders and updates via PhilSMS integration
- Reporting and Analytics: Dashboard insights, coverage reports, and activity logs
- Multi-User Access: Role-based portals for administrators, health workers, and parents

### Project Status

- Repository: https://github.com/clarknotkent/Thesis
- Current Branch: system-prototype-v3
- Version: 3.0
- Last Updated: November 2, 2025
- Status: Active Development

---

## Tech Stack

### Frontend

- Framework: Vue.js 3 with Composition API
- Build Tool: Vite 4.x
- Routing: Vue Router 4
- State Management: Vue Reactivity API (ref, computed, reactive)
- UI Framework: Bootstrap 5
- Icons: Bootstrap Icons
- HTTP Client: Axios
- Charts: Chart.js
- QR Code: html5-qrcode

### Backend

- Runtime: Node.js 20+
- Framework: Express.js
- Database: PostgreSQL 14+ (hosted on Supabase)
- Authentication: JWT (JSON Web Tokens)
- File Upload: Multer
- SMS Integration: PhilSMS API
- Security: bcrypt, CORS, helmet
- Logging: Custom activity logger

### Database

- DBMS: PostgreSQL 14+
- Hosting: Supabase
- Features: Row Level Security (RLS), Triggers, Functions, Views
- Migrations: Version-controlled SQL files

---

## Architecture

### Frontend Architecture

The frontend follows a feature-based architecture organized by user roles and business domains:

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
├── composables/             # Reusable composition functions
├── services/                # API services
└── router/                  # Vue Router configuration
```

### Backend Architecture

The backend follows a standard MVC pattern with additional service layers:

```
backend/
├── constants/               # Constant values (activity types, status codes)
├── controllers/             # Request handlers for each resource
├── middlewares/             # Authentication, error handling, validation
├── models/                  # Database models and queries
├── routes/                  # API route definitions
├── services/                # Business logic (SMS, notifications, reports)
├── utils/                   # Utility functions and helpers
├── db.js                    # Database connection configuration
└── server.js                # Express server entry point
```

### Design Principles

1. Separation of Concerns: UI components, business logic, and API services are separated
2. Role-Based Access: Each user role has dedicated features and components
3. Reusability: Shared components and composables for common functionality
4. Type Safety: Consistent data structures across frontend and backend
5. Scalability: Feature-based structure allows easy addition of new modules
6. Composition API: All Vue components use Composition API with script setup syntax

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm 9+
- PostgreSQL database or Supabase account
- Git for version control
- PhilSMS API credentials (for SMS features)

### Installation

1. Clone the repository

```bash
git clone https://github.com/clarknotkent/Thesis.git
cd Thesis
git checkout system-prototype-v3
```

2. Install dependencies for both frontend and backend

```bash
npm install
```

3. Set up environment variables

Backend (.env file in backend/ directory):
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

Frontend (.env.development file in frontend/ directory):
```
VITE_API_BASE_URL=http://localhost:3001
NODE_ENV=development
```

4. Run development servers

```bash
npm run dev
```

This will start both the backend API server and frontend development server concurrently.

### Access Points

- Frontend Application: http://localhost:5173
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/api/health

### Default Credentials

Contact your system administrator for default login credentials or refer to your database setup documentation.

---

## Project Structure

### Root Level Files

| File | Description |
|------|-------------|
| package.json | Root package with scripts to run both services |
| RAILWAY_DEPLOYMENT_GUIDE.md | Railway deployment guide for PWA conversion |
| DEPLOYMENT.md | General deployment reference |
| CLEANUP_FOR_V3.md | System cleanup checklist |
| CHANGELOG.md | Version history and changes log |
| README.md | This file |

### Frontend Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── assets/             # Images, styles, fonts
│   ├── components/         # Reusable UI components
│   ├── composables/        # Global composition functions
│   ├── features/           # Feature modules organized by role
│   ├── router/             # Vue Router setup and route definitions
│   ├── services/           # API services and HTTP client
│   ├── views/              # Page components
│   ├── App.vue             # Root component
│   └── main.js             # Application entry point
├── .env.development        # Development environment variables
├── .env.production         # Production environment variables
├── package.json            # Frontend dependencies
└── vite.config.js          # Vite configuration
```

### Backend Structure

```
backend/
├── constants/              # Constant values
├── controllers/            # Request handlers
├── middlewares/            # Express middlewares
├── models/                 # Database models
├── routes/                 # API route definitions
├── services/               # Business logic
├── utils/                  # Utility functions
├── .env                    # Environment variables (not committed)
├── db.js                   # Database connection
├── package.json            # Backend dependencies
└── server.js               # Express server entry point
```

---

## Features

### Admin Portal

The admin portal provides complete system oversight and management capabilities:

- Dashboard: Overview of vaccinations, patients, inventory levels, and system activity
- User Management: Create and manage health worker and parent accounts
- Patient Management: View and manage all patient records across the system
- Vaccine Inventory: 
  - Stock management with real-time levels
  - Receiving reports for incoming shipments
  - Expiry tracking and alerts
  - Vaccine distribution history
- SMS Management:
  - Send bulk and individual notifications
  - Manage SMS templates
  - View SMS logs and delivery status
  - Configure automated reminders
- Analytics and Reporting:
  - Vaccination coverage statistics
  - Trends and insights
  - Custom report generation
  - Export capabilities
- Activity Logs: System-wide activity tracking and audit trails

### Health Worker Portal

Health workers use this portal for day-to-day patient care operations:

- Dashboard: Daily tasks, upcoming vaccinations, recent activities
- Patient Management:
  - Add and edit patient records
  - Record immunization visits with vitals
  - Manage vaccination records
  - Track complete patient history
  - Schedule upcoming vaccinations
- Inventory: 
  - View vaccine stock levels
  - Check expiry dates
  - Request vaccine restocking
- Messaging System:
  - Communicate with parents and guardians
  - Send appointment reminders
  - Answer queries about vaccinations
- Notifications: Real-time updates and alerts for important events
- Tools:
  - QR code scanner for quick patient lookup
  - Print vaccination cards
  - Generate reports

### Parent Portal

Parents and guardians can access their children's immunization information:

- Dashboard: 
  - Upcoming vaccination schedules
  - Recent updates and notifications
  - Health reminders
- Dependents: 
  - View all children's immunization records
  - Manage dependent information
  - Track growth and development milestones
- Vaccination Schedule:
  - See upcoming required vaccines
  - View completed vaccination history
  - Receive schedule reminders
- Notifications: 
  - SMS and in-app reminders
  - Important health alerts
  - Appointment confirmations
- Messaging: Direct communication channel with health workers
- Profile: Update contact information and preferences

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

## Development Guidelines

### Code Style Standards

- Vue Components: Use Composition API with script setup syntax
- Naming Conventions:
  - PascalCase for component names
  - camelCase for functions and variables
  - kebab-case for file names
- File Organization: Keep components under 600 lines (extract to composables or sub-components)
- Composables: Extract reusable logic into composables with "use" prefix

### Best Practices

#### Component Organization

- Keep view components simple and focused on layout
- Delegate business logic to feature components
- Extract complex logic into composables
- Create sub-components for reusability
- Use props and events for component communication

#### State Management

- Use ref() for primitive values
- Use reactive() for objects and arrays
- Use computed() for derived state
- Avoid deeply nested reactive objects
- Keep state as local as possible

#### API Integration

- Use composables for API logic
- Handle loading states consistently
- Show appropriate user feedback (toasts, errors)
- Implement proper error handling
- Cache responses when appropriate

#### Error Handling

- Always catch API errors
- Show meaningful error messages to users
- Log errors for debugging
- Implement retry logic for transient failures
- Validate data before submission

### Recent Refactoring (November 2025)

Major improvements to code maintainability:
- AddPatientImmunizationRecord.vue: Reduced from 1,615 to 575 lines
- Messages.vue: Reduced from 1,082 to 482 lines
- Created reusable components: VisitSelectorSection, VitalsFormSection, ServicesListSection
- Extracted composables: usePatientImmunizationForm, useVaccineSelection, useConversations
- Improved code organization with feature-based structure

---

## API Documentation

### Base URL

Development: http://localhost:3001/api
Production: (To be configured)

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Main API Endpoints

#### Authentication
- POST /api/auth/login - User login
- POST /api/auth/register - User registration
- POST /api/auth/logout - User logout
- GET /api/auth/me - Get current user

#### Patients
- GET /api/patients - Get all patients
- GET /api/patients/:id - Get patient by ID
- POST /api/patients - Create new patient
- PUT /api/patients/:id - Update patient
- DELETE /api/patients/:id - Delete patient

#### Immunizations
- GET /api/immunizations - Get all immunizations
- GET /api/immunizations/patient/:id - Get patient immunizations
- POST /api/immunizations - Record immunization
- PUT /api/immunizations/:id - Update immunization record

#### Inventory
- GET /api/vaccines - Get vaccine inventory
- POST /api/vaccines/receive - Record vaccine receipt
- PUT /api/vaccines/:id - Update vaccine stock

#### SMS
- POST /api/sms/send - Send SMS notification
- GET /api/sms/logs - Get SMS logs
- GET /api/sms/templates - Get SMS templates

For complete API documentation, see backend/API_DOCUMENTATION.md

---

## Deployment

### Production Environment Variables

#### Backend Required Variables

```
SUPABASE_URL=your_production_supabase_url
SUPABASE_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
JWT_SECRET=your_strong_jwt_secret_minimum_32_characters
NODE_ENV=production
CORS_ORIGIN=your_frontend_production_url
```

#### Frontend Required Variables

```
VITE_API_BASE_URL=your_backend_api_url
NODE_ENV=production
```

### Deployment Options

#### Railway Deployment

This project is configured for Railway deployment. See RAILWAY_DEPLOYMENT_GUIDE.md for detailed instructions.

#### Manual Deployment

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy backend to your Node.js hosting service
3. Deploy frontend build to static hosting (Netlify, Vercel, etc.)
4. Configure environment variables on hosting platforms
5. Set up database on Supabase or PostgreSQL hosting

### Future Plans

This project will be converted to a Progressive Web App (PWA) for offline capabilities and mobile installation.

---

## Documentation

### Main Documentation Files

- RAILWAY_DEPLOYMENT_GUIDE.md - Railway deployment instructions
- DEPLOYMENT.md - General deployment reference and best practices
- CLEANUP_FOR_V3.md - System cleanup checklist for v3 branch
- CHANGELOG.md - Version history and notable changes

### Documentation Folder

Comprehensive documentation is organized in the docs/ folder:

#### Getting Started
- docs/README.md - Documentation index and navigation
- docs/INDEX.md - Complete file mapping reference

#### Feature Guides
- docs/HEALTH_WORKER_FEATURES_QUICK_GUIDE.md - Health worker portal guide
- docs/HEALTH_WORKER_CHAT_NOTIFICATIONS.md - Chat and notification system

#### SMS System
- docs/SMS_SYSTEM_COMPLETE.md - Complete SMS system documentation
- docs/SMS_MANAGEMENT_README.md - SMS management features
- docs/SMS_QUICK_REFERENCE.md - Quick reference for SMS operations

#### Architecture
- docs/HEALTH_WORKER_ARCHITECTURE.md - Health worker portal architecture
- docs/ForJapeth.md - Setup instructions and implementation notes

### Backend Documentation

Backend-specific documentation in the backend/ folder:

- backend/API_VACCINE_INVENTORY.md - Vaccine inventory API specifications
- backend/LEDGER_README.md - Ledger system documentation
- backend/SMS_BACKEND_README.md - SMS backend integration guide
- backend/SYSTEM_LOGGING.md - Activity logging system reference

### Archived Documentation

Historical refactoring and analysis documents are archived in:
- docs/archive/refactoring-history/ - Contains analysis from November 2025 refactoring

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

1. Create a feature branch from system-prototype-v3
```bash
git checkout system-prototype-v3
git pull origin system-prototype-v3
git checkout -b feature/your-feature-name
```

2. Follow the code style guidelines outlined above

3. Test thoroughly before committing
```bash
npm run test
npm run lint
```

4. Commit with clear, descriptive messages
```bash
git commit -m "feat: Add new feature description"
```

5. Submit pull request with detailed description of changes

### Commit Message Guidelines

- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting)
- refactor: Code refactoring
- test: Test additions or changes
- chore: Maintenance tasks

---

## Support

### Contact Information

- Repository: https://github.com/clarknotkent/Thesis
- Branch: system-prototype-v3
- Issues: Use GitHub Issues for bug reports and feature requests

### Documentation Resources

- Complete documentation: docs/ folder
- Deployment guides: RAILWAY_DEPLOYMENT_GUIDE.md, DEPLOYMENT.md
- API documentation: backend/API_DOCUMENTATION.md
- Changelog: CHANGELOG.md

### Getting Help

1. Check the docs/ folder for comprehensive guides
2. Review closed issues on GitHub for similar problems
3. Open a new issue with detailed description and steps to reproduce
4. Contact the maintainer for urgent matters

---

Project: Immunization Management System
Version: 3.0 (system-prototype-v3)
Last Updated: November 2, 2025
Maintained by: Clark Kent (clarknotkent), JapethDee and RobertBite15
License: Academic Thesis Project
