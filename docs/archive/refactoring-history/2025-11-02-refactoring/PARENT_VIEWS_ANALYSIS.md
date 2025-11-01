# Parent Views Analysis & Restructuring Plan

## Current State: All Files in `src/views/parent/`

### 📄 Files Identified (13 files)

1. **ParentHome.vue** (565 lines)
2. **ParentRecords.vue** (189 lines)
3. **ParentProfile.vue** (575 lines)
4. **ParentNotifications.vue** (253 lines)
5. **ParentMessages.vue** (573 lines)
6. **ParentSchedule.vue** (241 lines)
7. **ParentChat.vue** (132 lines)
8. **ParentDependentDetails.vue** (781 lines)
9. **ParentVaccineRecordDetails.vue** (647 lines)
10. **ParentVisitSummary.vue** (741 lines)
11. **ChildInfo.vue** (579 lines)
12. **DependentScheduleDetails.vue** (413 lines)
13. **VaccinationSchedule.vue** (549 lines)

---

## 🎯 Classification: Pages vs Features

### ✅ **PAGES** (Top-Level Routes - Keep in `views/parent/`)

These are standalone pages with their own routes, typically accessed from navigation:

#### **1. Dashboard/Home**
- `ParentHome.vue` - `/parent/home`
  - **Purpose**: Main dashboard with summary stats and children list
  - **Route**: Primary landing page after login
  - **Features**: Welcome header, stats cards, children cards
  - **Status**: PAGE ✓

#### **2. Records Hub**
- `ParentRecords.vue` - `/parent/records`
  - **Purpose**: List view of all dependents to access records
  - **Route**: Main records landing page
  - **Features**: Dependent selection with DependentCard components
  - **Status**: PAGE ✓

#### **3. Schedule Hub**
- `ParentSchedule.vue` - `/parent/schedule`
  - **Purpose**: List view of all children to access their schedules
  - **Route**: Main schedule landing page
  - **Features**: Child selection with DependentCard components
  - **Status**: PAGE ✓

#### **4. Profile**
- `ParentProfile.vue` - `/parent/profile`
  - **Purpose**: User profile and account settings
  - **Route**: Accessed from navigation menu
  - **Features**: Profile info, settings menu, logout
  - **Status**: PAGE ✓

#### **5. Notifications**
- `ParentNotifications.vue` - `/parent/notifications`
  - **Purpose**: List all notifications
  - **Route**: Accessed from navigation/header
  - **Features**: Notification list with filters
  - **Status**: PAGE ✓

#### **6. Messages Hub**
- `ParentMessages.vue` - `/parent/messages`
  - **Purpose**: Message conversations list
  - **Route**: Main messages landing page
  - **Features**: Conversation list, FAQ floating button
  - **Status**: PAGE ✓

---

### 🔧 **FEATURES** (Detail/Child Components - Move to `features/parent/`)

These are detail views, sub-pages, or feature-specific components accessed via parameters:

#### **Records Feature** (`features/parent/records/`)
1. `ParentDependentDetails.vue` - `/parent/records/:id`
   - **Purpose**: Detailed view of a child's health records
   - **Route**: Nested under records with `:id` parameter
   - **Features**: Tabbed interface (patient info, immunization, vitals, visits)
   - **Complexity**: 781 lines - should be split into feature components
   - **Status**: FEATURE - Move to `features/parent/records/DependentDetails.vue`

2. `ParentVaccineRecordDetails.vue` - `/parent/records/:patientId/vaccine-details`
   - **Purpose**: Detailed view of specific vaccine doses
   - **Route**: Nested under records with parameters
   - **Features**: Vaccine information, dose history
   - **Status**: FEATURE - Move to `features/parent/records/VaccineRecordDetails.vue`

3. `ParentVisitSummary.vue` - `/parent/records/:patientId/visit/:visitId`
   - **Purpose**: Detailed view of a specific health visit
   - **Route**: Nested under records with parameters
   - **Features**: Visit info, vitals, immunizations, services
   - **Status**: FEATURE - Move to `features/parent/records/VisitSummary.vue`

#### **Schedule Feature** (`features/parent/schedule/`)
1. `DependentScheduleDetails.vue` - `/parent/schedule/:id`
   - **Purpose**: Vaccination schedule for a specific child
   - **Route**: Nested under schedule with `:id` parameter
   - **Features**: Child info, schedule list, status badges
   - **Status**: FEATURE - Move to `features/parent/schedule/ScheduleDetails.vue`

2. `VaccinationSchedule.vue` - `/parent/dependent/:id` (seems duplicate?)
   - **Purpose**: Another schedule view with progress tracking
   - **Route**: `/parent/dependent/:id`
   - **Features**: Schedule timeline, quick actions
   - **Status**: FEATURE - Move to `features/parent/schedule/VaccinationSchedule.vue`
   - **Note**: May be redundant with DependentScheduleDetails

3. `ChildInfo.vue` - Used by VaccinationSchedule
   - **Purpose**: Child profile with vaccination summary
   - **Route**: Not directly routed (component)
   - **Features**: Child profile, quick actions, vaccination progress
   - **Status**: FEATURE - Move to `features/parent/schedule/ChildInfo.vue`

#### **Messaging Feature** (`features/parent/messaging/`)
1. `ParentChat.vue` - `/parent/chat/:conversationId`
   - **Purpose**: Individual chat conversation view
   - **Route**: Nested under messages with `:conversationId` parameter
   - **Features**: Message thread, composer
   - **Uses**: Shared chat components from `features/shared/chat/`
   - **Status**: FEATURE - Move to `features/parent/messaging/Chat.vue`

---

## 📁 Proposed Folder Structure

### **New Structure**

```
frontend/src/
├── views/
│   └── parent/                      # PAGE-LEVEL ROUTES ONLY
│       ├── ParentHome.vue           # Dashboard - /parent/home
│       ├── ParentRecords.vue        # Records hub - /parent/records
│       ├── ParentSchedule.vue       # Schedule hub - /parent/schedule
│       ├── ParentProfile.vue        # Profile - /parent/profile
│       ├── ParentNotifications.vue  # Notifications - /parent/notifications
│       └── ParentMessages.vue       # Messages hub - /parent/messages
│
├── features/
│   └── parent/                      # FEATURE COMPONENTS & SUB-PAGES
│       ├── records/                 # Records feature module
│       │   ├── DependentDetails.vue         # /parent/records/:id
│       │   ├── VaccineRecordDetails.vue     # /parent/records/:patientId/vaccine-details
│       │   ├── VisitSummary.vue             # /parent/records/:patientId/visit/:visitId
│       │   └── components/                   # Reusable components
│       │       ├── PatientInfoTab.vue
│       │       ├── ImmunizationTab.vue
│       │       ├── VitalsTab.vue
│       │       └── VisitsTab.vue
│       │
│       ├── schedule/                # Schedule feature module
│       │   ├── ScheduleDetails.vue          # /parent/schedule/:id
│       │   ├── VaccinationSchedule.vue      # Alternative schedule view
│       │   ├── ChildInfo.vue                # Child profile component
│       │   └── components/                   # Reusable components
│       │       ├── ScheduleCard.vue
│       │       ├── VaccineTimeline.vue
│       │       └── ProgressTracker.vue
│       │
│       ├── messaging/               # Messaging feature module
│       │   ├── Chat.vue                     # /parent/chat/:conversationId
│       │   └── components/                   # Feature-specific components
│       │       └── FaqChatHead.vue
│       │
│       └── dashboard/               # Dashboard feature module (optional)
│           └── components/
│               ├── WelcomeHeader.vue
│               ├── SummaryCards.vue
│               └── ChildCard.vue
```

---

## 🎨 Rationale: Pages vs Features

### **Pages** should be:
- ✅ Top-level navigation destinations
- ✅ Standalone routes without parameters (or only simple filters)
- ✅ Entry points to feature areas
- ✅ Listed in main navigation menus
- ✅ Simple "hub" or "list" views

### **Features** should be:
- ✅ Detail views accessed via route parameters (`:id`, `:patientId`, etc.)
- ✅ Sub-pages that drill into specific data
- ✅ Complex components with multiple sub-components
- ✅ Feature-specific business logic
- ✅ Reusable feature modules

---

## 📊 Summary

| Category | Count | Location |
|----------|-------|----------|
| **Pages** | 6 | `views/parent/` |
| **Features** | 7 | `features/parent/` |
| **Total Files** | 13 | - |

### Pages (Stay in `views/parent/`)
1. ParentHome.vue
2. ParentRecords.vue
3. ParentSchedule.vue
4. ParentProfile.vue
5. ParentNotifications.vue
6. ParentMessages.vue

### Features (Move to `features/parent/`)
1. records/DependentDetails.vue
2. records/VaccineRecordDetails.vue
3. records/VisitSummary.vue
4. schedule/ScheduleDetails.vue
5. schedule/VaccinationSchedule.vue
6. schedule/ChildInfo.vue
7. messaging/Chat.vue

---

## 🚀 Next Steps

1. **Create folder structure** in `features/parent/`
2. **Move feature files** from `views/parent/` to appropriate feature folders
3. **Update import paths** in router configuration
4. **Extract reusable components** from large files (e.g., DependentDetails.vue tabs)
5. **Update documentation** with new structure

---

## 🔍 Potential Issues to Review

1. **VaccinationSchedule.vue vs DependentScheduleDetails.vue**
   - Both seem to show vaccination schedules
   - Routes: `/parent/dependent/:id` vs `/parent/schedule/:id`
   - **Action**: Review if they're duplicates or serve different purposes

2. **Large files to refactor**
   - `ParentDependentDetails.vue` (781 lines) - Split tabs into separate components
   - `ParentVisitSummary.vue` (741 lines) - Extract card components
   - `ParentVaccineRecordDetails.vue` (647 lines) - Extract dose cards

3. **Component extraction opportunities**
   - Summary cards in ParentHome
   - Notification items in ParentNotifications
   - Message items in ParentMessages
   - Schedule cards in both schedule views
