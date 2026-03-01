# Changelog — Immunization Management System v1

Version 1 technical reference. This file documents all key systems, architectural decisions, and features for Version 1 of the Immunization Management System.

> **Branch:** `master` — This is the deployment-ready branch. It contains the stable, production-intended version of the system.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Authentication & Security](#5-authentication--security)
6. [User Roles & Access Control](#6-user-roles--access-control)
7. [Scheduling System](#7-scheduling-system)
8. [Patient Management](#8-patient-management)
9. [Immunization & Vaccination Records](#9-immunization--vaccination-records)
10. [Vaccine Inventory Management](#10-vaccine-inventory-management)
11. [Reporting & Analytics](#11-reporting--analytics)
12. [Notifications System](#12-notifications-system)
13. [SMS Integration & Password Recovery](#13-sms-integration--password-recovery)
14. [Offline Architecture & PWA](#14-offline-architecture--pwa)
15. [Database & Migrations](#15-database--migrations)
16. [Code Quality & Standards](#16-code-quality--standards)
17. [Known Constraints & Developer Notes](#17-known-constraints--developer-notes)

---

## 1. System Overview

The Immunization Management System is a full-stack web application for barangay health centers (BHS) in the Philippines. It manages patient immunization records, vaccine inventory, scheduling, and communication between health workers and parents/guardians.

**Core capabilities:**
- Multi-role access: Administrator, SuperAdmin, Health Worker, Parent/Guardian
- Online and offline operation (PWA with IndexedDB caching)
- SMS and browser push notifications
- Monthly immunization coverage reporting
- Vaccine inventory and receiving report management
- QR-code-based patient identification

---

## 2. Tech Stack

### Frontend
| Concern | Technology |
|---|---|
| Framework | Vue.js 3 (Composition API, `<script setup>`) |
| Build | Vite 7.x |
| Routing | Vue Router 4 (role-based guards, lazy routes) |
| State | Vue reactivity: `ref`, `computed`, `reactive`; composables |
| UI | Bootstrap 5 + Bootstrap Icons |
| HTTP | Axios (with response interceptor for offline caching) |
| Charts | Chart.js |
| QR Code | html5-qrcode |
| Offline DB | Dexie.js (IndexedDB wrapper) |
| PWA | vite-plugin-pwa with Workbox (`injectManifest` strategy) |
| Linting | ESLint 9.x flat config with eslint-plugin-vue |

### Backend
| Concern | Technology |
|---|---|
| Runtime | Node.js 20+ (ES Modules) |
| Framework | Express.js |
| Database | PostgreSQL 14+ via Supabase |
| Auth | JWT (access + refresh tokens) |
| Password Hashing | bcrypt / Argon2 |
| SMS | PhilSMS API |
| Push Notifications | Web Push (VAPID) |
| Security Headers | Helmet.js |
| Linting | ESLint 9.x flat config (CJS format) |

---

## 3. Backend Architecture

### Module System

The entire backend uses native ES Modules (`import`/`export`). All relative imports include the `.js` extension as required by the Node.js ES module spec. Named exports are used throughout controllers and models for consistency.

### Project Structure

```
backend/
  server.js           — Express app entry point
  db.js               — Supabase client setup
  controllers/        — Route handler functions
  models/             — Database query logic
  routes/             — Express router definitions
  middlewares/        — Auth and validation middleware
  services/           — Background services (SMS scheduler, push)
  utils/              — Shared utilities
  scripts/            — Non-production tooling
  migrations/         — Versioned SQL migration files
  constants/          — Shared constant definitions
```

### API Structure

The REST API is organized by domain. Each domain has its own controller, model, and route file. Route files register handlers and apply the authentication middleware as appropriate. The following domains are covered:

- Authentication (login, refresh, logout, password recovery)
- Patients (CRUD, stats, QR lookup)
- Guardians
- Health Workers & User Accounts
- Immunization Records
- Visits & Vitals
- Vaccine Inventory & Receiving Reports
- Scheduling
- Deworming & Vitamin A
- Reports & Analytics
- Notifications (in-app and push)
- SMS & Auto-Send Settings
- Conversations & Messages
- Dashboard
- Activity Logs
- FAQ Management
- Capacity Settings

All API routes are prefixed with `/api`.

---

## 4. Frontend Architecture

### Project Structure

```
frontend/src/
  main.js             — App bootstrap and offline initialization
  router/             — Vue Router config with role-based guards
  composables/        — Reusable Composition API logic
  views/              — Page-level Vue components (by portal/role)
  features/           — Feature modules (grouped by domain/role)
  components/         — Shared UI components (base, layout, modals)
  services/           — API client and offline services
  utils/              — Utility functions
  assets/             — Styles and static assets
```

### Composable Architecture

Business logic is extracted into named composables (`useFeatureName`). Key composables cover:
- Authentication and session management
- Patient data management and offline reads
- Immunization form handling
- Vaccine inventory operations
- Scheduling and calendar state
- Offline sync status and IndexedDB access
- Push notification subscription management
- Report generation (online and offline modes)
- Medical history and visit data

### Offline Caching Strategy

All Axios GET responses are automatically intercepted and written to IndexedDB. Components do not implement manual caching logic — the interceptor handles persistence transparently. On network failure, components fall back to reading from the local IndexedDB store.

---

## 5. Authentication & Security

### JWT Flow

1. User submits credentials → server validates and issues a short-lived access token and a longer-lived refresh token
2. Access token stored in memory (not localStorage) for XSS protection
3. Refresh token stored in an HTTP-only cookie
4. All protected API routes validated via server-side JWT middleware
5. On expiry, the client uses the refresh token to obtain a new access token silently
6. Logout clears both tokens and removes the local offline database

### Role-Based Access Control (RBAC)

Route protection is applied at two levels:

- **Backend:** All sensitive endpoints require a valid JWT. Role checks are enforced server-side and cannot be bypassed by the client.
- **Frontend:** Vue Router guards redirect unauthenticated or unauthorized users before any component is rendered.

### Environment Variables

The backend requires the following categories of secrets in `.env`:

- Supabase connection credentials
- JWT secret and expiry settings
- PhilSMS API credentials
- VAPID keys for web push (public key, private key, contact subject)
- Node environment and port

---

## 6. User Roles & Access Control

### Role Summary

| Role | Portal | Capabilities |
|---|---|---|
| Admin | Desktop web | Full access: patients, records, inventory, users, reports, settings |
| SuperAdmin | Desktop web | Same as Admin with additional system-wide visibility |
| Health Worker (BHS) | Desktop web | Patient records, immunizations, visits, inventory (read) |
| Parent/Guardian | Mobile web (PWA) | View own children's records, schedules, notifications |

### Admin

- Full CRUD on patients, guardians, health staff accounts, vaccine inventory, and schedules
- Access to monthly reports, activity logs, FAQ management, SMS configuration, and dashboard analytics
- One visit per patient per day enforced; same-day visit auto-adopted if it exists
- Patient date-of-birth changes locked once vaccination records exist

### SuperAdmin

- Elevated visibility: able to view and manage across all accounts
- Filtering and display logic ensures SuperAdmin records are not exposed to standard Admin views
- Separation enforced at both the backend query layer and the frontend rendering layer

### Health Worker (BHS)

- Read and write access to patient records and immunization entries
- Restricted to adding outside-facility vaccination records; in-facility records managed by nursing/nutrition staff
- Write actions (add patient, immunization, visit) disabled when the device is offline

### Parent/Guardian

- Read-only access to their own registered children
- Can view vaccination history, schedules, visit summaries, and notifications
- Messaging and notifications require an active connection (intentionally online-only)

---

## 7. Scheduling System

### AM/PM Scheduling

The scheduling system supports separate morning and afternoon capacity slots per day. Admins configure per-slot maximums; the system enforces them and shows available counts to health workers.

### Calendar Components

- A monthly calendar view displays scheduled days with color-coded indicators for appointment status
- A detail view shows individual dose entries per patient per slot
- Composable logic handles slot availability calculations and prevents overbooking

### Rescheduling Logic

- When a vaccination is rescheduled, existing scheduling links are cleared and a new slot is assigned
- If the new date is already in the past, no SMS reschedule notification is sent, but the record update still proceeds
- Vaccine dropdowns default to showing all vaccines when schedule data is incomplete (fail-open)

---

## 8. Patient Management

### CRUD Rules

- Patients are soft-deleted (flagged, not removed from the database)
- Patient search supports name and QR code lookup
- A unique family number groups siblings under the same guardian household
- Deworming and Vitamin A records are tracked separately from immunizations

### Visit Logic

- Only one visit per patient per day is permitted; the system auto-adopts an existing same-day visit
- Vitals (weight, height, temperature, etc.) are attached to visit records
- When an existing visit is updated, only fields with new values are written to prevent overwriting existing vitals
- Time of birth is stored and displayed in 12-hour format

### Data Integrity

- Integer identifier fields are coerced to numeric types server-side to prevent database type errors
- The `administered_by` field is enforced as `null` for outside-facility immunizations regardless of client payload
- Server stamps audit fields (`updated_by`, `approved_at`) automatically; clients do not send these values

---

## 9. Immunization & Vaccination Records

### Outside vs. In-Facility Records

- Records marked as outside-facility never carry a staff identifier — this policy is enforced server-side
- Inventory linkage is also cleared for outside-facility records
- BHS users can add both outside and in-facility records but can only edit outside-facility entries; in-facility edits require nursing/nutrition staff

### Dose Tracking

- Each patient follows a per-vaccine schedule with individual dose entries
- Date input fields enforce a minimum (based on the vaccine schedule) and a maximum (current date) to prevent invalid entries
- Smart date constraints are calculated from patient date of birth and the configured vaccine schedule

### Approval Workflow

- Immunization records support an approval state with `approved_by` and an automatically stamped `approved_at` timestamp

---

## 10. Vaccine Inventory Management

### Inventory Model

- Each stock entry tracks vaccine name, batch/lot number, quantity, expiry date, and transaction history
- Transactions are typed (e.g., incoming delivery, issue, adjustment, return, expiry write-off)
- A running balance is derived from the transaction history; before/after quantities are available for display

### FIFO and Receiving Reports

- New stock is added via receiving reports; each report supports time-stamped delivery records
- Multiple deliveries on the same day are distinguished by timestamp
- Delivery date validation uses the Philippine timezone (Asia/Manila) for accurate same-day checks

### Offline Inventory Access

- Inventory data is cached during the admin login prefetch
- Transaction history balance computation runs client-side from cached records when offline
- Batch and lot numbers are enriched into cached immunization records so they are available offline

---

## 11. Reporting & Analytics

### Monthly Immunization Report

Reports are generated for a selected month and year and cover:
- Total vaccinations administered per vaccine and dose
- Target population: children born within the past 2 years relative to the report period
- Coverage percentage per vaccine, calculated as (doses administered ÷ target population) × 100
- FIC (Fully Immunized Children) and CIC (Completely Immunized Children) counts

### Filtering

Reports exclude:
- Patients marked as deleted
- Patients with inactive status

Both online and offline report modes apply the same 2-year eligibility window and the same filtering logic to ensure parity.

### Patient Statistics

A summary endpoint returns total patient count, male/female breakdown, and FIC/CIC counts. These are displayed as stat cards in the admin patient records view.

### Last Vaccination Date

The patient list includes the most recent vaccination date per patient, aggregated from immunization records.

---

## 12. Notifications System

### In-App Notifications

Notification records are stored in the database, fetched on login, and cached locally for offline read access. The notification controller creates records and triggers push delivery automatically on new events.

### Web Push Notifications (VAPID)

**Flow:**
1. User opens the app → service worker registers
2. After a short delay, a permission modal appears (shown once per user account)
3. User enables notifications → browser presents its native permission prompt
4. On grant, the client creates a push subscription and sends it to the backend
5. The backend stores the subscription linked to the user account
6. On new notification, the backend delivers a browser push via VAPID

**Multi-user handling:**
- Permission state is tracked per user account (not per browser session)
- On login, if the browser already has notification permission, the subscription is automatically refreshed and linked to the current user
- This ensures push notifications are always routed to the correct logged-in user

**Subscription cleanup:**
- If a push delivery returns a `410 Gone` or `404 Not Found` response, the backend marks the subscription as expired and removes it automatically

---

## 13. SMS Integration & Password Recovery

### SMS Integration

- Provider: PhilSMS API
- Guardians can individually or in bulk have auto-send SMS toggled on/off
- SMS templates support variable replacement (e.g., patient name, schedule date, expiry times)
- A background scheduler sends queued reminder SMS messages on a configured interval
- Rescheduled appointments to past dates do not trigger an SMS notification

### SMS-Based Password Recovery

**Flow:**
1. User submits an identifier (email, username, or phone number)
2. Backend looks up the user, generates a secure 6-digit code, and stores it with a 15-minute expiry
3. Code is sent via SMS; a masked phone hint is returned (e.g., `+639**-***-1234`)
4. User submits the code along with a new password
5. Backend validates the code and expiry, updates the password hash, and clears the token

**Security:**
- Codes are single-use; the token is cleared immediately after a successful reset
- 15-minute expiry is enforced at the database level
- The identifier is stored in session storage between pages (not exposed in URL)
- Rate limiting is applied to recovery endpoints

**Routes added:**
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

**Frontend views added:**
- `/auth/forgot-password` — `ForgotPassword.vue`
- `/reset-password` — `ResetPassword.vue`
- Both are public routes (no authentication required)

---

## 14. Offline Architecture & PWA

### Architecture Overview

```
Login → Bulk Prefetch → Seed IndexedDB
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                        ↓
   Dexie IndexedDB                   Service Worker Cache
 (structured patient data)         (Vue components + assets)
        ↓                                        ↓
 Offline read access               Offline navigation
```

### IndexedDB Databases

Three separate Dexie databases are maintained, one per portal:

- **Admin/Staff database** — stores patients, inventory, immunizations, schedules, and visit data for the admin and health worker portals
- **Staff (BHS) database** — stores a subset of records relevant to health worker read access
- **Parent Portal database** — stores children, guardians, birth history, immunizations, visits, vitals, schedules, notifications, and vaccine catalog data

All databases are recreated cleanly on login and deleted on logout to prevent sensitive data from persisting in the browser.

### Bulk Prefetch on Login

**Parent portal:** On login, all data for the authenticated guardian is fetched in bulk — children profiles, immunization history, visit and vitals records, vaccination schedules, notifications, and the vaccine catalog. Nine or more Vue route components are also dynamically imported to seed the service worker cache, enabling offline navigation.

**Admin portal:** On login, all patient records (up to 1000), vaccine inventory, patient schedules, immunization records, and visit data are fetched. Batch and lot numbers from inventory are enriched into cached immunization records for offline display.

### Offline Data Patterns

- **Enrichment pipeline:** Cached immunization records are enriched with inventory data (batch/lot numbers) before being stored, so the full detail is available offline
- **Chunked bulk writes:** Large datasets are written to IndexedDB in fixed-size chunks to avoid oversized transactions
- **Outbox/sync pattern (Health Worker):** Write operations go to IndexedDB first, then queue in a pending uploads table. A background service processes the queue in FIFO order when the device is online. Conflict detection uses timestamps; the strategy is "reject and refresh" (server wins)
- **String type normalization:** All IndexedDB ID lookups normalize values to strings to prevent type mismatch failures

### Offline UI Behavior

| Action | Online | Offline |
|---|---|---|
| View patient records | ✅ API | ✅ IndexedDB |
| View vaccination history | ✅ API | ✅ IndexedDB + batch enrichment |
| View visit / vitals | ✅ API | ✅ IndexedDB |
| View scheduling calendar | ✅ API | ✅ IndexedDB |
| Add new patient | ✅ | ❌ Toast: "Not available offline" |
| Add immunization | ✅ | ❌ Toast + disabled button |
| Edit visit | ✅ | ❌ Button disabled offline |
| Reschedule vaccination | ✅ | ❌ Toast |
| Notifications (Parent) | ✅ | ❌ Greyed icon + tooltip |
| Messages / Chat (Parent) | ✅ | ❌ Redirect + toast |
| Admin Dashboard | ✅ | ❌ Sidebar icon disabled |

---

## 15. Database & Migrations

### PostgreSQL / Supabase

- Row Level Security (RLS) enabled on all tables
- Triggers maintain `updated_at` columns automatically across main tables
- Database views support denormalized reads (e.g., immunization history with vaccine and staff details)
- Upsert operations use explicit conflict resolution fields to prevent duplicate key errors

### Migration Files

Versioned SQL migration files live in `backend/migrations/`. Each file is numbered sequentially and describes its purpose in the filename. Migrations cover:

- Adding `updated_at` audit columns and triggers to core tables
- Creating the push subscriptions table for web push delivery
- Adding AM/PM capacity fields to the scheduling table

### Non-Production Reset Script

A SQL reset script exists under `backend/scripts/` for use in QA and development environments only. It backs up existing data to a timestamped schema, purges test accounts and dependent records, and resequences primary key sequences to a clean baseline. It is not intended for and must not be run in production.

---

## 16. Code Quality & Standards

### ESLint

- Frontend: ESLint 9.x with `eslint-plugin-vue`, flat config format (`eslint.config.js`)
- Backend: ESLint config uses CommonJS format (`eslint.config.cjs`) — required because the backend package is typed as ES module
- `vite-plugin-eslint` provides real-time linting feedback during development
- Scripts: `npm run lint` and `npm run lint:fix`

### Naming Conventions

| Item | Convention |
|---|---|
| Vue components | PascalCase |
| Composables | `useFeatureName` (camelCase with `use` prefix) |
| Variables / functions | camelCase |
| File names | kebab-case |
| Backend imports | `.js` extension required |

### Component Guidelines

- Vue components kept under 600 lines; logic beyond that is extracted to composables or sub-components
- Use `props` and `emit` for component communication; avoid direct parent mutation
- `ref()` for primitives, `reactive()` for objects, `computed()` for derived state
- Always handle loading states and surface meaningful error messages to the user

### Toast Notification Standard

All toast calls use the object format:

```js
addToast({ message: 'Record saved.', type: 'success' })
addToast({ message: 'Could not connect.', type: 'error' })
addToast({ message: 'Feature unavailable offline.', type: 'warning' })
```

### Commit Message Format

```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Formatting only
refactor: Structural change (no behavior change)
test:     Tests
chore:    Maintenance
```

---

## 17. Known Constraints & Developer Notes

- **Parent offline — notifications and messaging:** These features are intentionally disabled offline. They are real-time-dependent and were excluded from the prefetch to reduce cache size and avoid stale data issues.
- **Admin dashboard offline:** The admin dashboard is disabled offline due to the complexity of its aggregated data. The sidebar icon is disabled with a tooltip when the device is offline.
- **Normalized dose storage:** Individual vaccine dose entries are stored in a separate table rather than as nested data on the schedule record. This enables cleaner offline display and querying.
- **Vaccine dropdown fail-open:** When a patient's schedule data is missing or incomplete, vaccine dropdowns show all available vaccines rather than hiding potentially valid options.
- **SMS past-date guard:** If a vaccination appointment is rescheduled to a date already in the past, no SMS notification is sent. The record update still proceeds normally.
- **Push subscription rotation:** If VAPID keys are rotated in production, all existing push subscriptions become invalid. Users will need to re-enable browser notifications to re-subscribe.
- **IndexedDB schema versioning:** Dexie version numbers must be incremented whenever tables are added or modified. Data in unchanged tables is preserved across version upgrades.

---

**Project:** Immunization Management System  
**Version:** 1  
**Branch:** master  
**Maintained by:** Clark Kent (clarknotkent), JapethDee, RobertBite15
