# Changelog

All notable changes to the ImmunizeMe project will be documented in this file.

---

## [system-prototype-v3] - 2025-11-02

### 🎯 Major Refactoring & Documentation Cleanup

This release focuses on comprehensive codebase cleanup, documentation reorganization, and preparation for future PWA deployment.

### ✨ Added

**New Documentation Structure:**
- Created categorical docs folder structure (`features/`, `architecture/`, `sms-system/`, `api-specs/`, `archive/`)
- Added `docs/README.md` - Navigation-focused documentation overview (2.4 KB)
- Added `docs/INDEX.md` - Comprehensive file index with 32 documented files
- Added `RAILWAY_DEPLOYMENT_GUIDE.md` - Standalone Railway deployment guide for future PWA (10.6 KB)
- Added `DEPLOYMENT.md` - Consolidated deployment reference (15.4 KB)
- Added `HEALTHWORKER_REFACTORING_COMPLETE.md` - Latest refactoring status
- Added `CLEANUP_FOR_V3.md` - Cleanup checklist documentation
- Added `.railwayignore` - Railway deployment exclusions

**New Features & Composables:**
- Added `frontend/src/composables/useChildrenList.js` - Children data management
- Added `frontend/src/composables/useDateFormat.js` - Date formatting utilities
- Added `frontend/src/composables/useParentData.js` - Parent data composable
- Added health worker inventory composables
- Added parent portal feature modules (home, messaging, profile, records, schedule)
- Added admin reports feature module

**New Components:**
- Added health worker patient components (DoseNavigator, ServicesListSection, VaccinationFormFields, etc.)
- Added health worker modules (dashboard, inventory, messages, notifications, patients, tools)

### 🔄 Changed

**Documentation Reorganization:**
- Renamed all docs to kebab-case convention (e.g., `HEALTH_WORKER_FEATURES_QUICK_GUIDE.md` → `health-worker-guide.md`)
- Moved 8 documentation files to categorical folders:
  - `features/health-worker-guide.md`
  - `features/for-japeth.md`
  - `architecture/health-worker.md`
  - `architecture/chat-notifications.md`
  - `sms-system/complete-guide.md`
  - `sms-system/management.md`
  - `sms-system/template-specs.md`
  - `sms-system/testing-plan.md`
- Archived 20 historical documentation files to `docs/archive/refactoring-history/`
- Updated `README.md` - Removed Railway-specific deployment content
- Updated `README.md` - Branch changed from v2 to v3

**Code Refactoring:**
- Modified 30+ Vue component files (admin, health worker, parent views)
- Updated routing in `frontend/src/router/index.js`
- Refactored API services (`api.js`, `offlineDB.js`, `offlineStorage.js`)
- Updated composables (`useVaccinationRecords.js`)
- Modified SMS settings component (`AutoSendSettings.vue`)
- Updated inventory views (AddStock, AddVaccine, ViewInventory, ViewSchedule)
- Refactored patient management views (EditVaccinationRecord, ViewPatient, VisitEditorPage)
- Updated admin activity logs, profile, reports, and SMS management views

**Build & Configuration:**
- Updated `frontend/package.json` and `package-lock.json` - Dependency updates
- Updated `frontend/vite.config.js` - Build configuration changes
- Updated `backend/package.json` - Backend dependencies
- Modified `backend/.env` - Environment configuration

### 🗑️ Removed

**Empty Files Cleanup (10 files):**
- `docker-compose.prod.yml`
- `backend/scripts/notification-scheduler.js`
- `backend/scripts/notification_worker.js`
- `backend/utils/scheduleDebug.js`
- `frontend/src/assets/styles/README.md`
- `frontend/src/assets/styles/healthworker/CLEANUP_SUMMARY.md`
- `frontend/src/assets/styles/healthworker/STYLE_AUDIT.md`
- `frontend/src/components/ui/base/AppAdminModal.vue`
- `frontend/src/components/ui/base/QrReader.vue`
- `frontend/src/utils/phTime.js`

**Legacy Documentation (Archived):**
- Root analysis docs (7 files with `11-01-2025` prefix)
- Phase 1 & 2 extraction documentation
- Refactoring analysis documents
- Unused files reports

**Obsolete Code Files:**
- Removed 19 health worker view files (replaced with modular structure)
- Removed 8 parent view files (replaced with feature-based structure)
- Removed duplicate/backup files (`.backup` suffix)
- Removed unused admin components (CreateNotification, EditStock, EditVaccine, VaccineSchedule)
- Removed old report views (ImmunizationMonitoringChart, MonthlyImmunizationReport)
- Removed FAQ manager views (FaqManager, PublicFAQs)

**Database Files Cleanup:**
- Removed 68 database schema files from root (moved to archive)
- Removed 14 migration files (consolidated)
- Removed barangay reference images (15 files)

### 📚 Documentation

**Naming Convention Update:**
- Standardized on **kebab-case** for all new documentation
- Legacy files use UPPERCASE_SNAKE_CASE (archived)
- Date-prefixed analysis files archived with original naming

**Documentation Statistics:**
- Total docs: 32 files
- Active documentation: 12 files
- Archived documentation: 20 files
- Categories: 5 (features, architecture, sms-system, api-specs, archive)

### 🎯 Preparation for PWA

- Separated Railway deployment guide for future PWA conversion
- Added note in README: "This project will be converted to a Progressive Web App (PWA)"
- Railway configuration preserved in dedicated guide

### 🏗️ Architecture Improvements

- Migrated to feature-based folder structure for Vue components
- Separated concerns: features, composables, services
- Improved modularity for health worker and parent portals
- Consolidated inventory management views

---

## [system-prototype-v2] - 2025-11-01

### Initial Development Phase

- Core immunization management system
- Admin, health worker, and parent portals
- SMS notification system
- Vaccine inventory management
- Activity logging system
- Offline support with IndexedDB

---

**Note:** This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.
