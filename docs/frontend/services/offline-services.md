# Offline Module - Refactored Architecture# Offline-First Module



Clean, maintainable offline system for the parent portal with auto-caching and seamless online/offline switching.This module contains all offline-first functionality for the Immunization Management System using the Outbox Pattern.



## 🏗️ Architecture## Files



### Core Files### `db.js`

Dexie.js database configuration with schema for:

1. **`db-parent-portal.js`** - IndexedDB schema (9 tables mirroring Supabase)- `patients` - Local copy of patient records

   - Fresh database: `ParentPortalOfflineDB`- `immunizations` - Local copy of immunization records  

   - Exact primary keys from Supabase (patient_id, guardian_id, etc.)- `pending_uploads` - Outbox table for pending syncs

   - Only parent-facing tables (no admin data)

### `syncService.js`

2. **`apiCacheInterceptor.js`** - Auto-caching interceptorBackground sync service that:

   - Automatically caches all successful GET requests- Monitors pending_uploads table

   - Smart URL pattern matching- Syncs to Supabase when online

   - Handles nested data extraction (vaccinationHistory, medical_history)- Detects conflicts using timestamps

   - Non-blocking (won't fail requests if caching fails)- Resolves conflicts with "Reject & Refresh" strategy

- Notifies users via toast messages

3. **`offlineUtils.js`** - Reusable utility functions

   - `getPatientDetails()` - Complete patient with nested data### `index.js`

   - `getVaccinationHistory()` - Immunization recordsMain initialization file with:

   - `getMedicalHistory()` - Visit records- `initializeOffline()` - Sets up Dexie and syncService

   - `getVaccinationSchedule()` - Upcoming vaccines- `syncAfterLogin()` - Triggers sync after user login

   - `getNotifications()` - SMS/push notifications- `clearOfflineDataOnLogout()` - Clears local data on logout

   - All functions auto-detect online/offline

## Usage

4. **`index.js`** - Module exports (legacy compatibility)

### Import in main.js

## 📚 Database Schema```javascript

import { initializeOffline } from '@/services/offline'

### Tables (9 essential tables)

// Initialize on app start

| Table | Primary Key | Purpose |initializeOffline()

|-------|-------------|---------|```

| `patients` | `patient_id` | Child basic info |

| `guardians` | `guardian_id` | Parent/guardian info |### Import in composables

| `birthhistory` | `birthhistory_id` | Birth details |```javascript

| `immunizations` | `immunization_id` | Vaccination records |import db from '@/services/offline/db'

| `visits` | `visit_id` | Medical checkups |

| `vitalsigns` | `vital_id` | Growth monitoring |// Use Dexie database

| `patientschedule` | `patient_schedule_id` | Upcoming vaccines |await db.patients.add(patientData)

| `notifications` | `notification_id` | SMS/push notifications |await db.pending_uploads.add(uploadTask)

| `vaccinemaster` | `vaccine_id` | Vaccine catalog |```



## 🚀 Usage in Components### Manual sync trigger

```javascript

### Simple Patternimport syncService from '@/services/offline/syncService'



```javascript// Trigger sync manually

import { getPatientDetails, getVaccinationHistory, getMedicalHistory } from '@/services/offline/offlineUtils'await syncService.manualSync()



// Fetch patient details (auto-handles online/offline)// Get sync status

const patient = await getPatientDetails(patientId)const status = await syncService.getSyncStatus()

console.log(status)

// Fetch vaccination history// { isOnline: true, isSyncing: false, pendingCount: 0, failedCount: 0 }

const vaccinations = await getVaccinationHistory(patientId)```



// Fetch medical history## Architecture

const visits = await getMedicalHistory(patientId)

``````

Vue Components

### Auto-Caching Flow      ↓

Composables (usePatientForm, etc.)

1. Component calls utility function (e.g., `getPatientDetails()`)      ↓

2. If **online**: Fetch from API → Interceptor auto-caches → Return dataLocal Dexie DB (patients, immunizations, pending_uploads)

3. If **offline**: Read from IndexedDB cache → Return data      ↓

Sync Service (background sync when online)

No manual cache checks needed! 🎉      ↓

Supabase API (remote master database)

## 🧪 Testing```



See `/public/offline-test.html` for interactive testing console.## Conflict Resolution



## 📖 DocumentationThe module uses **"Reject & Refresh"** strategy:



- **Migration Guide**: `/OFFLINE-REFACTOR-GUIDE.md`1. **Detect**: Compare `updated_at` timestamps (local vs server)

- **Complete Summary**: `/OFFLINE-REFACTOR-COMPLETE.md`2. **Reject**: If server is newer, discard local changes

- **Code Example**: `/src/features/parent/records/DependentDetails-REFACTOR-EXAMPLE.js`3. **Refresh**: Overwrite local data with server version

4. **Notify**: Show toast message to user

## ✨ Key Features

This prevents data loss and puts the user in control.

- ✅ **Automatic caching** - No manual IndexedDB queries

- ✅ **Seamless online/offline** - Single code path## Testing

- ✅ **Type-safe primary keys** - Matches Supabase exactly

- ✅ **Detailed logging** - Easy debugging with console logsSee `/TESTING_GUIDE.md` for detailed testing instructions.

- ✅ **Non-blocking** - Cache failures won't break app

- ✅ **Production-ready** - Tested and documented## Documentation



## 🗑️ Deprecated Files (Removed)- `/REFACTOR_SUMMARY.md` - Complete architecture overview

- `/OFFLINE_CHECKLIST.md` - Deployment checklist

- ❌ `db.js` - Old schema with migration issues- `/backend/migrations/001_add_updated_at_columns.sql` - Required SQL migration

- ❌ `db-v5.js` - Failed migration attempt
- ❌ `parentPrefetch.js` - Manual prefetch (replaced by auto-cache)
- ❌ `syncService.js` - Complex sync logic (not needed for read-only cache)
