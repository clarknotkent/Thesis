# Documentation Index# Documentation Index



Quick reference for all documentation files in the ImmunizeMe project.This index maps original file locations to their new centralized location under `Thesis/docs/`.



---Note: For `SMS_SYSTEM_COMPLETE.md`, a version already existed in `docs/`. The original root copy has been archived as `docs/archive/SMS_SYSTEM_COMPLETE.ROOT.md` after deduplication.



## 📁 Current Documentation Structure## Importance guide



### Root Documentation (`/docs/`)- Must-read (keepers):

- **[README.md](./README.md)** - Documentation overview and navigation	- docs/README.md (entry point)

- **INDEX.md** (this file) - Complete file index	- docs/INDEX.md (navigation and mapping)

	- docs/HEALTH_WORKER_ARCHITECTURE.md (architecture overview)

### Features (`/docs/features/`)	- docs/HEALTH_WORKER_CHAT_NOTIFICATIONS.md (implementation details)

User-facing features and guides.	- docs/HEALTH_WORKER_FEATURES_QUICK_GUIDE.md (operator-facing quick guide)

	- docs/SMS_SYSTEM_COMPLETE.md (canonical SMS documentation)

- **[health-worker-guide.md](./features/health-worker-guide.md)** - Health worker portal complete guide	- docs/SMS_MANAGEMENT_README.md (admin SMS UI)

- **[for-japeth.md](./features/for-japeth.md)** - Setup instructions and implementation notes	- docs/SMS_TEMPLATE_SPECS.md (official templates/variables)

	- docs/SMS_TESTING_PLAN.md (test coverage and scenarios)

### Architecture (`/docs/architecture/`)	- docs/ForJapeth.md (setup/runbook for SMS backend)

System design and technical architecture.

- Reference (nice to have):

- **[health-worker.md](./architecture/health-worker.md)** - Health worker portal architecture	- docs/IMPLEMENTATION_SUMMARY.md (change summary)

- **[chat-notifications.md](./architecture/chat-notifications.md)** - Chat and notification system design	- docs/HEALTH_WORKER_OVERHAUL_COMPLETE.md (completion report)

	- docs/SMS_QUICK_REFERENCE.md (DB checks and common ops)

### SMS System (`/docs/sms-system/`)	- docs/SMS_RESCHEDULE_FIX.md (deep dive on reschedule logic)

SMS notification system documentation.	- docs/SMS_FIXES_SUMMARY.md (fix log)

	- docs/CHANGELOG_V2.md (version changes)

- **[complete-guide.md](./sms-system/complete-guide.md)** - Comprehensive SMS system guide

- **[management.md](./sms-system/management.md)** - SMS management features- Troubleshooting and fixes (move to archive when stable):

- **[template-specs.md](./sms-system/template-specs.md)** - Template specifications and variables	- docs/CHAT_TROUBLESHOOTING.md

- **[testing-plan.md](./sms-system/testing-plan.md)** - SMS testing procedures	- docs/WHY_SEND_BUTTON_DISABLED.md

	- docs/NEW_CONVERSATION_SEND_BUTTON_FIX.md

### API Specifications (`/docs/api-specs/`)	- docs/RECIPIENT_SELECTION_DEBUG.md

API documentation and specifications (currently empty - future use).

- Archived:

### Archive (`/docs/archive/`)	- (empty) — archive purged on 2025-11-01

Historical documentation preserved for reference.

## Root-level Markdown moved to docs/

#### Refactoring History (`/docs/archive/refactoring-history/`)

- Thesis/CHANGELOG_V2.md → docs/CHANGELOG_V2.md

**2025-11-01 Analysis:**- Thesis/CHAT_TROUBLESHOOTING.md → docs/CHAT_TROUBLESHOOTING.md

- `11-01-2025 API_CATALOG.md` - API endpoint catalog- Thesis/ForJapeth.md → docs/ForJapeth.md

- `11-01-2025 ENTITIES_REFERENCE.md` - Database entities reference- Thesis/HEALTH_WORKER_ARCHITECTURE.md → docs/HEALTH_WORKER_ARCHITECTURE.md

- `11-01-2025 git-change-report-2025-11-01.md` - Change report- Thesis/HEALTH_WORKER_CHAT_NOTIFICATIONS.md → docs/HEALTH_WORKER_CHAT_NOTIFICATIONS.md

- `11-01-2025 INDEX.md` - Index of analysis files- Thesis/HEALTH_WORKER_FEATURES_QUICK_GUIDE.md → docs/HEALTH_WORKER_FEATURES_QUICK_GUIDE.md

- `11-01-2025 SYSTEMS_AND_UI_FLOWS.md` - System flows- Thesis/HEALTH_WORKER_OVERHAUL_COMPLETE.md → docs/HEALTH_WORKER_OVERHAUL_COMPLETE.md

- `11-01-2025 UI_BUTTONS_AND_MODALS.md` - UI components reference- Thesis/IMPLEMENTATION_SUMMARY.md → docs/IMPLEMENTATION_SUMMARY.md

- `11-01-2025 VALIDATIONS.md` - Validation rules- Thesis/NEW_CONVERSATION_SEND_BUTTON_FIX.md → docs/NEW_CONVERSATION_SEND_BUTTON_FIX.md

- `COMPOSABLES_EXTRACTION_SUMMARY.md` - Composables refactoring summary- Thesis/RECIPIENT_SELECTION_DEBUG.md → docs/RECIPIENT_SELECTION_DEBUG.md

- `HEALTHWORKER_FEATURE_EXTRACTION_ANALYSIS.md` - Health worker analysis- Thesis/SMS_FIXES_SUMMARY.md → docs/SMS_FIXES_SUMMARY.md

- `HEALTHWORKER_REORGANIZATION.md` - Reorganization plan- Thesis/SMS_MANAGEMENT_README.md → docs/SMS_MANAGEMENT_README.md

- `PHASE1_EXTRACTION_COMPLETE.md` - Phase 1 completion report- Thesis/SMS_QUICK_REFERENCE.md → docs/SMS_QUICK_REFERENCE.md

- `PHASE1_INTEGRATION_COMPLETE.md` - Phase 1 integration report- Thesis/SMS_RESCHEDULE_FIX.md → docs/SMS_RESCHEDULE_FIX.md

- `UNUSED_VUE_FILES_REPORT.md` - Unused files report- Thesis/SMS_SYSTEM_COMPLETE.md → docs/SMS_SYSTEM_COMPLETE.md (canonical)

	- Original root copy archived at: docs/archive/SMS_SYSTEM_COMPLETE.ROOT.md

**2025-11-02 Refactoring:**- Thesis/SMS_TEMPLATE_SPECS.md → docs/SMS_TEMPLATE_SPECS.md

- `ADDPATIENT_IMMUNIZATION_REFACTOR_PLAN.md` - Patient immunization refactor plan- Thesis/SMS_TESTING_PLAN.md → docs/SMS_TESTING_PLAN.md

- `HEALTHWORKER_VIEWS_REFACTORING_ANALYSIS.md` - Views refactoring analysis- Thesis/WHY_SEND_BUTTON_DISABLED.md → docs/WHY_SEND_BUTTON_DISABLED.md

- `PARENT_REFACTORING_ANALYSIS.md` - Parent portal analysis

- `PARENT_RESTRUCTURE_COMPLETE.md` - Parent restructure completion## Readme relocation

- `PARENT_VIEWS_ANALYSIS.md` - Parent views analysis

- `REFACTORING_SUMMARY.md` - Overall refactoring summary- Thesis/README.md (original) → docs/README.md (content moved)

- Thesis/README.md now points to docs/ with quick links

---

## 📍 Backend Documentation

Backend-specific documentation is located in the `/backend/` folder:

- `backend/API_VACCINE_INVENTORY.md` - Vaccine inventory API
- `backend/CASCADE_UPDATES_QUICKSTART.md` - Cascade updates guide
- `backend/LEDGER_README.md` - Ledger system
- `backend/SMS_BACKEND_README.md` - SMS backend integration
- `backend/SMS_CASCADE_UPDATES.md` - SMS cascade updates
- `backend/SMS_COMBINED_REMINDERS.md` - Combined reminders
- `backend/SYSTEM_LOGGING.md` - Activity logging

---

## 📍 Root Documentation

Main project documentation in the root directory:

- `README.md` - Main project README
- `RAILWAY_DEPLOYMENT_GUIDE.md` - Railway deployment guide (for PWA)
- `DEPLOYMENT.md` - General deployment reference
- `HEALTHWORKER_REFACTORING_COMPLETE.md` - Latest refactoring status
- `CLEANUP_FOR_V3.md` - Cleanup checklist for v3 branch

---

## 🗂️ File Naming Conventions

### Current Naming Scheme
- **kebab-case** - Used for descriptive file names: `health-worker-guide.md`, `chat-notifications.md`
- **lowercase** - All file names are lowercase for consistency

### Legacy Naming (Archived)
- **UPPERCASE_SNAKE_CASE** - Old convention: `SMS_SYSTEM_COMPLETE.md`
- **Date prefix** - Analysis files: `11-01-2025 API_CATALOG.md`

---

## 📊 Documentation Statistics

- **Total docs files:** 32
- **Active documentation:** 12 files
- **Archived documentation:** 20 files
- **Categories:** 5 (features, architecture, sms-system, api-specs, archive)

---

## 🔄 Recent Changes

**November 2, 2025:**
- Reorganized docs folder with proper naming scheme
- Created categorical folders (features, architecture, sms-system, api-specs)
- Renamed files to use kebab-case convention
- Moved historical docs to archive/refactoring-history
- Created new simplified README.md
- Updated INDEX.md with new structure

---

## 🔍 Finding Documentation

### By Topic
- **SMS features** → `sms-system/`
- **Health worker portal** → `features/health-worker-guide.md` or `architecture/health-worker.md`
- **System design** → `architecture/`
- **Historical changes** → `archive/refactoring-history/`

### By Role
- **Developers** → `architecture/` and backend docs
- **Project Managers** → `features/` 
- **New Contributors** → Start with `README.md` and this INDEX
- **SMS Configuration** → `sms-system/`

---

**Last Updated:** November 2, 2025  
**Maintained by:** Development Team
