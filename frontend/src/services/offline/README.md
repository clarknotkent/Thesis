# Offline-First Module

This module contains all offline-first functionality for the Immunization Management System using the Outbox Pattern.

## Files

### `db.js`
Dexie.js database configuration with schema for:
- `patients` - Local copy of patient records
- `immunizations` - Local copy of immunization records  
- `pending_uploads` - Outbox table for pending syncs

### `syncService.js`
Background sync service that:
- Monitors pending_uploads table
- Syncs to Supabase when online
- Detects conflicts using timestamps
- Resolves conflicts with "Reject & Refresh" strategy
- Notifies users via toast messages

### `index.js`
Main initialization file with:
- `initializeOffline()` - Sets up Dexie and syncService
- `syncAfterLogin()` - Triggers sync after user login
- `clearOfflineDataOnLogout()` - Clears local data on logout

## Usage

### Import in main.js
```javascript
import { initializeOffline } from '@/services/offline'

// Initialize on app start
initializeOffline()
```

### Import in composables
```javascript
import db from '@/services/offline/db'

// Use Dexie database
await db.patients.add(patientData)
await db.pending_uploads.add(uploadTask)
```

### Manual sync trigger
```javascript
import syncService from '@/services/offline/syncService'

// Trigger sync manually
await syncService.manualSync()

// Get sync status
const status = await syncService.getSyncStatus()
console.log(status)
// { isOnline: true, isSyncing: false, pendingCount: 0, failedCount: 0 }
```

## Architecture

```
Vue Components
      ↓
Composables (usePatientForm, etc.)
      ↓
Local Dexie DB (patients, immunizations, pending_uploads)
      ↓
Sync Service (background sync when online)
      ↓
Supabase API (remote master database)
```

## Conflict Resolution

The module uses **"Reject & Refresh"** strategy:

1. **Detect**: Compare `updated_at` timestamps (local vs server)
2. **Reject**: If server is newer, discard local changes
3. **Refresh**: Overwrite local data with server version
4. **Notify**: Show toast message to user

This prevents data loss and puts the user in control.

## Testing

See `/TESTING_GUIDE.md` for detailed testing instructions.

## Documentation

- `/REFACTOR_SUMMARY.md` - Complete architecture overview
- `/OFFLINE_CHECKLIST.md` - Deployment checklist
- `/backend/migrations/001_add_updated_at_columns.sql` - Required SQL migration
