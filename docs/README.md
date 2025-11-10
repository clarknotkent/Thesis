# 📚 Immunization Management System - Documentation Index# 📚 Immunization Management System - Documentation Index# 📚 System Prototype v4 - Documentation



**Project**: Immunization Management System  

**Branch**: `system-prototype-v4`  

**Version**: 4.7  **Project**: Immunization Management System  **Branch**: `system-prototype-v4`  

**Last Updated**: November 10, 2025

**Branch**: `system-prototype-v4`  **Focus**: Offline-First PWA Architecture  

---

**Version**: 4.7  **Status**: ✅ Implementation Complete

## 📂 Documentation Structure

**Last Updated**: November 10, 2025

```

docs/---

├── README.md (this file)          # Complete documentation index

│---

├── backend/                       # Backend documentation (7 files)

│   ├── API_VACCINE_INVENTORY.md## 🗂️ Documentation Structure

│   ├── CASCADE_UPDATES_QUICKSTART.md

│   ├── LEDGER_README.md## 📂 Documentation Structure

│   ├── SMS_BACKEND_README.md

│   ├── SMS_CASCADE_UPDATES.md```

│   ├── SMS_COMBINED_REMINDERS.md

│   └── SYSTEM_LOGGING.md```docs/

│

├── frontend/                      # Frontend documentationdocs/└── offline-architecture/          ⭐ NEW - Offline functionality docs

│   ├── components/

│   │   └── DateTimeInputs.md├── README.md (this file)          # Complete documentation index    ├── README.md                  - Documentation index

│   ├── features/                  # Feature documentation (7 files)

│   │   ├── overview.md├── CHANGELOG.md (root)            # Version history with all dated changes    ├── JAPETH.md                  - Developer quick start guide

│   │   ├── admin-features.md

│   │   ├── admin-views.md├── README.md (root)               # Project overview and setup guide    ├── BRANCH_README_V4.md        - Branch overview & purpose

│   │   ├── health-worker-features.md

│   │   ├── parent-features.md│    ├── OFFLINE_ARCHITECTURE.md    - Complete system architecture

│   │   ├── parent-records.md

│   │   └── shared-features.md├── backend/                       # Backend documentation    ├── REFACTOR_SUMMARY.md        - Technical implementation details

│   ├── services/

│   │   └── offline-services.md│   ├── API_VACCINE_INVENTORY.md    ├── PARENT_OFFLINE_SUMMARY.md  - Parent features guide

│   ├── OFFLINE_TROUBLESHOOTING_GUIDE.md

│   ├── OFFLINE-REFACTOR-COMPLETE.md│   ├── CASCADE_UPDATES_QUICKSTART.md    ├── TESTING_GUIDE.md           - Testing procedures

│   └── OFFLINE-REFACTOR-GUIDE.md

││   ├── LEDGER_README.md    └── OFFLINE_CHECKLIST.md       - Deployment checklist

├── reference/                     # Active reference documentation (2 files)

│   ├── README.md                  # Reference documentation index│   ├── SMS_BACKEND_README.md```

│   ├── API-PAYLOADS.md            # API payload specifications

│   └── QA-RESET-INSTRUCTIONS.md   # QA database reset procedures│   ├── SMS_CASCADE_UPDATES.md

│

├── offline-architecture/          # Offline system documentation (9 files)│   ├── SMS_COMBINED_REMINDERS.md---

│   ├── README.md

│   ├── JAPETH.md                  # Developer quick start│   └── SYSTEM_LOGGING.md

│   ├── JAPETH-CHANGELOG.md

│   ├── BRANCH_README_V4.md│## 🚀 Quick Start

│   ├── OFFLINE_ARCHITECTURE.md

│   ├── REFACTOR_SUMMARY.md├── frontend/                      # Frontend documentation

│   ├── PARENT_OFFLINE_SUMMARY.md

│   ├── TESTING_GUIDE.md│   ├── components/### New to this branch?

│   └── OFFLINE_CHECKLIST.md

││   │   └── DateTimeInputs.md👉 **Start here**: [offline-architecture/JAPETH.md](./offline-architecture/JAPETH.md)

├── parent-offline/                # Parent portal offline (8 files)

│   ├── README.md│   ├── features/

│   ├── BULK-CACHE-ON-LOGIN.md

│   ├── CHANGES_SUMMARY.md│   │   ├── overview.md### Want to understand the architecture?

│   ├── LATEST_UPDATES.md

│   ├── OFFLINE_SUPPORT_STATUS.md│   │   ├── admin-features.md👉 **Read this**: [offline-architecture/OFFLINE_ARCHITECTURE.md](./offline-architecture/OFFLINE_ARCHITECTURE.md)

│   ├── OFFLINE_SYSTEM_COMPLETE.md

│   ├── QUICK_REFERENCE.md│   │   ├── admin-views.md

│   └── TOAST_NOTIFICATIONS.md

││   │   ├── health-worker-features.md### Ready to test?

└── archive/                       # Historical documentation (8 files)

    ├── README.md                  # Archive index│   │   ├── parent-features.md👉 **Follow this**: [offline-architecture/TESTING_GUIDE.md](./offline-architecture/TESTING_GUIDE.md)

    ├── COMPREHENSIVE_PATIENT_CACHING.md

    ├── DATABASE_CLOSED_ERROR_FIX.md│   │   ├── parent-records.md

    ├── FIELD_MAPPING_FIX.md

    ├── KENT!__IMPLEMENTATION_SUMMARY_LOCAL_2025-11-05.md│   │   └── shared-features.md---

    ├── KENT!__LOCAL_CHANGE_REPORT_2025-11-05.md

    ├── OFFLINE_NESTED_DATA_UPDATE.md│   ├── services/

    ├── OFFLINE_TESTING_GUIDE.md

    └── README_OLD.md│   │   └── offline-services.md## 📖 Documentation Sections



Root Documentation (located at project root):│   ├── OFFLINE_TROUBLESHOOTING_GUIDE.md

├── README.md                      # Project overview and setup

├── CHANGELOG.md                   # Complete version history│   ├── OFFLINE-REFACTOR-COMPLETE.md### 1. **Offline Architecture** 📴

└── RAILWAY_DEPLOYMENT_GUIDE.md    # Deployment instructions

```│   └── OFFLINE-REFACTOR-GUIDE.mdComplete documentation for the offline-first implementation.



---│



## 🚀 Quick Start├── offline-architecture/          # Offline system documentation**Location**: [`docs/offline-architecture/`](./offline-architecture/)



### New to the Project?│   ├── README.md

1. **Start here**: [Project README](../README.md) - Overview, setup, and getting started

2. **For developers**: [offline-architecture/JAPETH.md](offline-architecture/JAPETH.md) - Developer quick start│   ├── JAPETH.md**Contents**:



### Setting Up│   ├── JAPETH-CHANGELOG.md- Setup & installation guides

1. Clone the repository and checkout `system-prototype-v4` branch

2. Follow setup instructions in [Project README](../README.md)│   ├── BRANCH_README_V4.md- System architecture diagrams

3. Review [CHANGELOG.md](../CHANGELOG.md) for recent changes

│   ├── OFFLINE_ARCHITECTURE.md- Implementation details

---

│   ├── REFACTOR_SUMMARY.md- Testing procedures

## 📖 Documentation by Category

│   ├── PARENT_OFFLINE_SUMMARY.md- Deployment checklists

### 1. 🔧 Backend Documentation

**Location**: [backend/](backend/)│   ├── TESTING_GUIDE.md



Complete backend API, services, and system documentation:│   └── OFFLINE_CHECKLIST.md**Start with**: [offline-architecture/README.md](./offline-architecture/README.md)



- **[API_VACCINE_INVENTORY.md](backend/API_VACCINE_INVENTORY.md)** - Vaccine inventory API endpoints│

- **[SMS_BACKEND_README.md](backend/SMS_BACKEND_README.md)** - SMS integration (PhilSMS API)

- **[SMS_CASCADE_UPDATES.md](backend/SMS_CASCADE_UPDATES.md)** - SMS cascade update system├── parent-offline/                # Parent portal offline features---

- **[SMS_COMBINED_REMINDERS.md](backend/SMS_COMBINED_REMINDERS.md)** - Combined reminder notifications

- **[CASCADE_UPDATES_QUICKSTART.md](backend/CASCADE_UPDATES_QUICKSTART.md)** - Quick start for cascades│   ├── README.md

- **[LEDGER_README.md](backend/LEDGER_README.md)** - Transaction ledger system

- **[SYSTEM_LOGGING.md](backend/SYSTEM_LOGGING.md)** - Activity logging and audit trails│   ├── BULK-CACHE-ON-LOGIN.md## 🎯 What's New in v4



### 2. 🎨 Frontend Documentation│   ├── CHANGES_SUMMARY.md

**Location**: [frontend/](frontend/)

│   ├── LATEST_UPDATES.md### Technology Additions

Frontend components, features, and services:

│   ├── OFFLINE_SUPPORT_STATUS.md- ✅ **Dexie.js v4.x** - IndexedDB wrapper for local storage

**Components**:

- **[DateTimeInputs.md](frontend/components/DateTimeInputs.md)** - Date and time input components│   ├── OFFLINE_SYSTEM_COMPLETE.md- ✅ **Outbox Pattern** - Reliable background sync mechanism



**Features** ([frontend/features/](frontend/features/)):│   ├── QUICK_REFERENCE.md- ✅ **Role-based sync** - Different strategies per user type

- **[overview.md](frontend/features/overview.md)** - Frontend features overview

- **[admin-features.md](frontend/features/admin-features.md)** - Admin portal features│   └── TOAST_NOTIFICATIONS.md

- **[admin-views.md](frontend/features/admin-views.md)** - Admin views documentation

- **[health-worker-features.md](frontend/features/health-worker-features.md)** - Health worker portal│### Features

- **[parent-features.md](frontend/features/parent-features.md)** - Parent portal features

- **[parent-records.md](frontend/features/parent-records.md)** - Parent records functionality└── [Archived Documentation]       # Historical implementation notes- ✅ **Offline patient registration** - Health workers work without internet

- **[shared-features.md](frontend/features/shared-features.md)** - Shared components

    ├── COMPREHENSIVE_PATIENT_CACHING.md- ✅ **Offline immunization recording** - Field data collection

**Services**:

- **[offline-services.md](frontend/services/offline-services.md)** - Offline service implementation    ├── DATABASE_CLOSED_ERROR_FIX.md- ✅ **Parent data caching** - Instant mobile app experience



**Offline Features**:    ├── FIELD_MAPPING_FIX.md- ✅ **Background sync** - Auto-upload when online

- **[OFFLINE_TROUBLESHOOTING_GUIDE.md](frontend/OFFLINE_TROUBLESHOOTING_GUIDE.md)** - Troubleshooting

- **[OFFLINE-REFACTOR-COMPLETE.md](frontend/OFFLINE-REFACTOR-COMPLETE.md)** - Refactor completion    ├── KENT!__IMPLEMENTATION_SUMMARY_LOCAL_2025-11-05.md- ✅ **Conflict detection** - Timestamp-based resolution

- **[OFFLINE-REFACTOR-GUIDE.md](frontend/OFFLINE-REFACTOR-GUIDE.md)** - Refactoring guide

    ├── KENT!__LOCAL_CHANGE_REPORT_2025-11-05.md

### 3. 📋 Reference Documentation

**Location**: [reference/](reference/) | **Status**: ✅ Active    ├── OFFLINE_NESTED_DATA_UPDATE.md### Performance



Actively maintained system reference documentation:    ├── OFFLINE_TESTING_GUIDE.md- 🚀 **20-40x faster** page loads



- **[API-PAYLOADS.md](reference/API-PAYLOADS.md)** - Admin and BHS API request payloads    ├── PAYLOADS__ADMIN_AND_BHS_2025-11-07.md- 📉 **90-95% reduction** in API calls

- **[QA-RESET-INSTRUCTIONS.md](reference/QA-RESET-INSTRUCTIONS.md)** - QA database reset procedures

    └── RESET_QA_INSTRUCTIONS.md- 🔋 **Battery efficient** - Fewer network requests

### 4. 📴 Offline Architecture

**Location**: [offline-architecture/](offline-architecture/)```- 💾 **No data loss** - Reliable offline queue



**⚠️ Note**: Parent offline removed November 8, 2025. Docs preserved for reference.



- **[README.md](offline-architecture/README.md)** - Offline architecture index------

- **[JAPETH.md](offline-architecture/JAPETH.md)** - Developer quick start guide

- **[OFFLINE_ARCHITECTURE.md](offline-architecture/OFFLINE_ARCHITECTURE.md)** - Complete system architecture

- **[TESTING_GUIDE.md](offline-architecture/TESTING_GUIDE.md)** - Testing procedures

- **[OFFLINE_CHECKLIST.md](offline-architecture/OFFLINE_CHECKLIST.md)** - Deployment checklist## 🚀 Quick Start## 📊 Branch Comparison

- Plus 4 more detailed guides



### 5. 👨‍👩‍👧 Parent Portal Offline

**Location**: [parent-offline/](parent-offline/) | **Status**: ⚠️ DEPRECATED### New to the Project?| Aspect | v3 (Online-Only) | v4 (Offline-First) |



**⚠️ Important**: Offline functionality removed November 8, 2025. Preserved for historical reference.1. **Start here**: [Project README](../README.md) - Overview, setup, and getting started|--------|------------------|-------------------|



- **[README.md](parent-offline/README.md)** - Parent offline index2. **For developers**: [offline-architecture/JAPETH.md](./offline-architecture/JAPETH.md) - Developer quick start| **Storage** | Supabase only | Dexie + Supabase |

- **[OFFLINE_SUPPORT_STATUS.md](parent-offline/OFFLINE_SUPPORT_STATUS.md)** - Current status

- Plus 6 implementation guides| **Offline** | ❌ Not supported | ✅ Full support |



### 6. 🗄️ Archive### Setting Up| **Speed** | 2-4 seconds | <100ms |

**Location**: [archive/](archive/) | **Status**: 🗄️ Archived

1. Clone the repository and checkout `system-prototype-v4` branch| **API Calls** | High frequency | 90-95% reduced |

Historical documentation and implementation notes:

2. Follow setup instructions in [Project README](../README.md)| **Sync** | N/A | Background auto-sync |

- **[README.md](archive/README.md)** - Archive index

- Bug fixes and patches (November 2025)3. Review [CHANGELOG.md](../CHANGELOG.md) for recent changes| **Conflicts** | N/A | Timestamp detection |

- Implementation summaries

- Historical testing guides



---------



## 🎯 Common Tasks



### I want to...## 📖 Documentation by Topic## 🛠️ Developer Guide



**...understand the project**  

→ [Project README](../README.md)

### 1. Backend Development### Setup

**...see recent changes**  

→ [CHANGELOG.md](../CHANGELOG.md)```bash



**...set up development**  #### API Documentation# 1. Switch to v4 branch

→ [Getting Started](../README.md#getting-started)

- **[API_VACCINE_INVENTORY.md](backend/API_VACCINE_INVENTORY.md)** - Vaccine inventory API endpointsgit checkout system-prototype-v4

**...understand backend APIs**  

→ [backend/API_VACCINE_INVENTORY.md](backend/API_VACCINE_INVENTORY.md)- **Root README**: [Project README](../README.md) - General API documentation



**...work on frontend features**  # 2. Install dependencies

→ [frontend/features/](frontend/features/)

#### SMS Systemcd frontend

**...integrate SMS**  

→ [backend/SMS_BACKEND_README.md](backend/SMS_BACKEND_README.md)- **[SMS_BACKEND_README.md](backend/SMS_BACKEND_README.md)** - SMS integration and PhilSMS APInpm install



**...reset QA database**  - **[SMS_CASCADE_UPDATES.md](backend/SMS_CASCADE_UPDATES.md)** - SMS cascade updates

→ [reference/QA-RESET-INSTRUCTIONS.md](reference/QA-RESET-INSTRUCTIONS.md)

- **[SMS_COMBINED_REMINDERS.md](backend/SMS_COMBINED_REMINDERS.md)** - Combined reminders# 3. Start dev server

**...check API payloads**  

→ [reference/API-PAYLOADS.md](reference/API-PAYLOADS.md)- **[CASCADE_UPDATES_QUICKSTART.md](backend/CASCADE_UPDATES_QUICKSTART.md)** - Quick start guidenpm run dev



**...deploy to production**  

→ [RAILWAY_DEPLOYMENT_GUIDE.md](../RAILWAY_DEPLOYMENT_GUIDE.md)

#### System Features# 4. Check console for:

---

- **[LEDGER_README.md](backend/LEDGER_README.md)** - Transaction ledger system# ✅ Dexie database initialized

## 📊 Documentation Status Legend

- **[SYSTEM_LOGGING.md](backend/SYSTEM_LOGGING.md)** - Activity logging and audits# ✅ Sync service initialized

- ✅ **Active** - Current and maintained

- ⚠️ **Deprecated** - No longer active, preserved for reference```

- 🗄️ **Archived** - Historical documentation

- 📝 **Work in Progress** - Under development### 2. Frontend Development



---### Key Files



## 📁 Folder Summary#### Components```



| Folder | Files | Status | Description |- **[DateTimeInputs.md](frontend/components/DateTimeInputs.md)** - Date/time input componentsfrontend/src/

|--------|-------|--------|-------------|

| **backend/** | 7 | ✅ Active | Backend API and services |├── services/offline/              ⭐ NEW

| **frontend/** | 10+ | ✅ Active | Frontend components and features |

| **reference/** | 2 | ✅ Active | System reference documentation |#### Features│   ├── db.js                      # Dexie schema

| **offline-architecture/** | 9 | ⚠️ Deprecated | Offline system (parent removed) |

| **parent-offline/** | 8 | ⚠️ Deprecated | Parent offline (removed Nov 8) |- **[overview.md](frontend/features/overview.md)** - Features overview│   ├── syncService.js             # Sync engine

| **archive/** | 8 | 🗄️ Archived | Historical documentation |

- **[admin-features.md](frontend/features/admin-features.md)** - Admin portal│   ├── index.js                   # Initialization

**Total Documentation Files**: 44+ markdown files organized across 6 folders

- **[admin-views.md](frontend/features/admin-views.md)** - Admin views│   └── README.md                  # Module docs

---

- **[health-worker-features.md](frontend/features/health-worker-features.md)** - Health worker portal│

## 🔗 External Resources

- **[parent-features.md](frontend/features/parent-features.md)** - Parent portal└── (modified files...)            # See REFACTOR_SUMMARY.md

- **Repository**: https://github.com/clarknotkent/Thesis

- **Branch**: system-prototype-v4- **[parent-records.md](frontend/features/parent-records.md)** - Parent records

- **Vue.js Documentation**: https://vuejs.org/

- **Node.js Documentation**: https://nodejs.org/- **[shared-features.md](frontend/features/shared-features.md)** - Shared componentsbackend/

- **Supabase Documentation**: https://supabase.com/docs

└── migrations/                    ⭐ NEW

---

#### Services    └── 001_add_updated_at_columns.sql

## 📝 Contributing to Documentation

- **[offline-services.md](frontend/services/offline-services.md)** - Offline services```

When adding or updating documentation:



1. **Place files in appropriate folders**:

   - Backend docs → `docs/backend/`#### Offline Features---

   - Frontend docs → `docs/frontend/`

   - Reference docs → `docs/reference/`- **[OFFLINE_TROUBLESHOOTING_GUIDE.md](frontend/OFFLINE_TROUBLESHOOTING_GUIDE.md)** - Troubleshooting

   - Historical docs → `docs/archive/`

- **[OFFLINE-REFACTOR-COMPLETE.md](frontend/OFFLINE-REFACTOR-COMPLETE.md)** - Refactor notes## 🧪 Testing

2. **Update this index** when adding new documents

- **[OFFLINE-REFACTOR-GUIDE.md](frontend/OFFLINE-REFACTOR-GUIDE.md)** - Refactor guide

3. **Use clear, descriptive titles** for markdown files

### Quick Test

4. **Include dates in changelogs** - All dated changes go to [CHANGELOG.md](../CHANGELOG.md)

### 3. System Administration```bash

5. **Cross-reference related docs** for easy navigation

# Enable offline mode

6. **Keep main [README.md](../README.md) timeless** - No dated updates

- **[RESET_QA_INSTRUCTIONS.md](RESET_QA_INSTRUCTIONS.md)** - QA database reset1. Open DevTools → Network tab

---

- **[PAYLOADS__ADMIN_AND_BHS_2025-11-07.md](PAYLOADS__ADMIN_AND_BHS_2025-11-07.md)** - Request payloads2. Check "Offline" checkbox

## ✅ Documentation Standards

3. Try to register a patient

- ✅ **Markdown format** - All documentation in `.md` files

- ✅ **Clear headings** - Use semantic heading levels (H1-H6)### 4. Deployment4. ✅ Should succeed with "Saved locally"

- ✅ **Code examples** - Include when relevant with proper syntax highlighting

- ✅ **Tables of contents** - For longer documents (>500 lines)5. Uncheck "Offline"

- ✅ **Cross-links** - Reference related documentation

- ✅ **Status indicators** - Mark deprecated or archived docs- **[RAILWAY_DEPLOYMENT_GUIDE.md](../RAILWAY_DEPLOYMENT_GUIDE.md)** - Railway deployment6. ✅ Should auto-sync within seconds

- ✅ **Last updated dates** - Include in document headers

- ✅ **Organized folders** - Keep related docs together```



------



**Need help?** Contact the maintainers or open an issue on GitHub.### Comprehensive Tests



**Last Updated**: November 10, 2025  ## 🎯 Common TasksFollow [offline-architecture/TESTING_GUIDE.md](./offline-architecture/TESTING_GUIDE.md) for 8 detailed test scenarios.

**Maintained by**: Clark Kent, JapethDee, RobertBite15



### I want to...---



**...understand the project** → [Project README](../README.md)## 📞 Support & Resources



**...see what changed** → [CHANGELOG.md](../CHANGELOG.md)### Documentation

- **Complete Guide**: [offline-architecture/README.md](./offline-architecture/README.md)

**...set up development** → [Getting Started](../README.md#getting-started)- **Quick Start**: [offline-architecture/JAPETH.md](./offline-architecture/JAPETH.md)

- **Architecture**: [offline-architecture/OFFLINE_ARCHITECTURE.md](./offline-architecture/OFFLINE_ARCHITECTURE.md)

**...work on backend** → [backend/](backend/) docs

### Code

**...work on frontend** → [frontend/](frontend/) docs- **Offline Module**: `frontend/src/services/offline/`

- **Refactored Forms**: `frontend/src/features/health-worker/patients/`

**...deploy to production** → [RAILWAY_DEPLOYMENT_GUIDE.md](../RAILWAY_DEPLOYMENT_GUIDE.md)- **Parent Views**: `frontend/src/views/parent/`



**...integrate SMS** → [SMS_BACKEND_README.md](backend/SMS_BACKEND_README.md)### External Resources

- Dexie.js: https://dexie.org/

**...reset QA database** → [RESET_QA_INSTRUCTIONS.md](RESET_QA_INSTRUCTIONS.md)- Outbox Pattern: https://microservices.io/patterns/data/transactional-outbox.html



------



**Last Updated**: November 10, 2025  ## ✅ Implementation Status

**Maintained by**: Clark Kent, JapethDee, RobertBite15

**Core System**: ✅ Complete
- [x] Dexie.js integration
- [x] Sync service implementation
- [x] Health worker forms refactored
- [x] Parent views refactored
- [x] Conflict detection added
- [x] Role-based sync strategies

**Documentation**: ✅ Complete
- [x] Developer guides (7 files)
- [x] Architecture diagrams
- [x] Testing procedures
- [x] Deployment checklists

**Next Steps**: 🚧 Testing & Deployment
- [ ] Run comprehensive tests
- [ ] Execute Supabase migrations
- [ ] Deploy to staging
- [ ] Production deployment

---

## 🎓 For Thesis Documentation

### Key Points to Highlight
1. **Problem**: Rural health workers lack reliable internet
2. **Solution**: Offline-first architecture with Dexie.js
3. **Pattern**: Outbox Pattern for reliable sync
4. **Results**: 20-40x performance improvement, 90-95% API reduction

### Technical Depth
- See [offline-architecture/OFFLINE_ARCHITECTURE.md](./offline-architecture/OFFLINE_ARCHITECTURE.md)
- See [offline-architecture/REFACTOR_SUMMARY.md](./offline-architecture/REFACTOR_SUMMARY.md)

### Performance Metrics
- See [offline-architecture/PARENT_OFFLINE_SUMMARY.md](./offline-architecture/PARENT_OFFLINE_SUMMARY.md)

---

## 📌 Summary

**Branch**: `system-prototype-v4`  
**Major Achievement**: Complete offline-first transformation  
**Technology**: Dexie.js + Outbox Pattern  
**Documentation**: 8 comprehensive guides  
**Performance**: 20-40x improvement  
**Status**: ✅ Ready for testing & deployment  

---

**👉 Start exploring**: [offline-architecture/README.md](./offline-architecture/README.md)
