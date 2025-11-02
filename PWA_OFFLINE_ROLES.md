# PWA Offline Features by User Role

## Overview

The PWA offline functionality is designed to support all user roles with appropriate permissions. This document outlines what each role can do offline.

---

## User Roles & Offline Capabilities

### 1. **Admin** (Full Access)
**Permissions:** CREATE, READ, UPDATE, DELETE

**Offline Capabilities:**
- ✅ View all patients, records, and system data
- ✅ Create new patients, immunization records, users
- ✅ Update any record (patients, vaccines, schedules, etc.)
- ✅ Delete records (patients, immunizations, notifications, etc.)
- ✅ Manage inventory, SMS, and system settings
- ✅ View analytics and reports
- ✅ All operations queued and synced when online

**Data Access:**
- All 12 IndexedDB stores fully accessible
- Complete system data cached locally
- No restrictions on operations

**UI Features:**
- Full offline indicator with all controls
- Can manually trigger sync
- Can clear offline data
- See all pending operations

---

### 2. **Health Worker** (No Delete)
**Permissions:** CREATE, READ, UPDATE (DELETE disabled)

**Offline Capabilities:**
- ✅ View all patients and their records
- ✅ Create new patient immunization records
- ✅ Record vaccination visits with vitals
- ✅ Update patient information and immunization records
- ✅ Create and update schedules
- ✅ Send messages to guardians
- ✅ View vaccine inventory (read-only)
- ✅ View and mark notifications as read
- ❌ **Cannot delete** any records (patients, notifications, etc.)

**Data Access:**
- Patients, immunizations, visits, schedules
- Guardians and messages
- Vaccine inventory (read-only)
- Notifications (read-only, can mark as read)
- Health staff accounts
- Limited access to analytics

**UI Features:**
- Full offline indicator with sync controls
- All CREATE/UPDATE operations work offline
- DELETE buttons disabled or show permission warning
- Pending operations tracked and synced

**DELETE Restrictions:**
- Attempting to delete shows warning: "Health workers cannot delete records. Please contact an administrator."
- Delete buttons remain visible but disabled
- Delete operations NOT added to sync queue
- Server validates permissions on all requests

---

### 3. **Parent/Guardian** (Read-Only)
**Permissions:** READ only (CREATE/UPDATE/DELETE disabled)

**Offline Capabilities:**
- ✅ View own children's (dependents) records
- ✅ View immunization history and schedules
- ✅ View upcoming vaccination appointments
- ✅ Read notifications and messages
- ✅ Send messages to health workers (CREATE allowed)
- ✅ View profile information
- ❌ Cannot create new patient records
- ❌ Cannot update any medical records
- ❌ Cannot delete anything

**Data Access:**
- Own dependents' data only (filtered by guardian_id)
- Immunization records for own children
- Schedules for own children
- Messages and notifications
- Read-only access to all data

**UI Features:**
- Simplified offline indicator (read-only mode)
- No pending operations (except messages)
- Automatic background sync
- Data always up-to-date when online

**Security:**
- Row-level security filters data by guardian_id
- Cannot access other families' data
- Server validates all requests
- Local cache filtered on load

---

## Implementation Details

### Permission Enforcement

**Frontend (UI Level):**
```javascript
// Health Worker - Delete disabled
const deletePatient = async (patient) => {
  addToast({ 
    title: 'Permission Denied', 
    message: 'Health workers cannot delete records.', 
    type: 'warning' 
  })
  return
}
```

**Offline Sync (Queue Level):**
```javascript
// Block delete operations for non-admins
if (operation === 'delete') {
  const userRole = localStorage.getItem('userRole');
  if (userRole !== 'admin') {
    throw new Error('Only administrators can delete records');
  }
}
```

**Backend (API Level):**
- Server validates user permissions on every request
- 403 Forbidden returned for unauthorized operations
- JWT token contains role information
- Cannot bypass frontend restrictions

### Data Synchronization

**Admin:**
```javascript
// All operations sync
Pending Queue:
- CREATE: 5 patients
- UPDATE: 3 immunizations  
- DELETE: 2 notifications
→ All processed when online
```

**Health Worker:**
```javascript
// Only CREATE/UPDATE sync
Pending Queue:
- CREATE: 3 visits
- UPDATE: 2 patients
- DELETE: BLOCKED (not added)
→ Only CREATE/UPDATE processed
```

**Parent:**
```javascript
// Only messages sync
Pending Queue:
- CREATE: 1 message to health worker
→ Only message sent when online
```

### Offline Indicator Behavior

**Admin:**
- Shows all pending operations
- All action buttons enabled
- Full control over sync and data

**Health Worker:**
- Shows CREATE/UPDATE pending operations
- Sync button enabled
- Delete count excluded from pending
- Warning shown if attempting delete

**Parent:**
- Shows minimal information
- Auto-sync in background
- No manual controls needed
- Simple online/offline status

---

## Use Cases

### Health Worker Workflow (Offline)

**Scenario:** Health worker conducting home visits without internet

1. **Morning:** Sync all data while at health center (WiFi)
2. **Field Visit:** 
   - Create new vaccination visit (queued)
   - Record vitals and services (queued)
   - Update patient address (queued)
   - Try to delete duplicate record → Warning shown
3. **Return to Center:**
   - Automatic sync when WiFi connects
   - All 3 operations (create, create, update) processed
   - Data now on server
4. **Result:** All changes saved, no delete attempted

### Parent Workflow (Offline)

**Scenario:** Parent checking vaccination schedule while traveling

1. **Before Travel:** App automatically syncs in background
2. **Offline:**
   - View child's immunization history ✓
   - Check upcoming appointments ✓
   - Read notifications ✓
   - View growth charts ✓
   - Send question to health worker (queued)
3. **Back Online:**
   - Message automatically sent
   - Fresh data synced
4. **Result:** Seamless experience, no data entry needed

---

## Testing Offline Functionality

### Test Cases by Role

**Admin:**
```bash
✓ Create patient offline → Syncs
✓ Update vaccine inventory offline → Syncs
✓ Delete old notification offline → Syncs
✓ All operations process successfully
```

**Health Worker:**
```bash
✓ Create visit offline → Syncs
✓ Update patient info offline → Syncs
✓ Try to delete patient → Shows warning, NOT queued
✓ Only CREATE/UPDATE operations sync
```

**Parent:**
```bash
✓ View records offline → Loads from cache
✓ Send message offline → Queues and syncs
✓ Try to edit record → No UI for this (read-only)
✓ All data displays correctly
```

### Testing Steps

1. **Setup:**
   ```bash
   npm run build
   npm run start
   ```

2. **Login as role to test:**
   - Admin: admin@example.com
   - Health Worker: healthworker@example.com  
   - Parent: parent@example.com

3. **Go offline:**
   - DevTools → Network → Offline
   - Or disable WiFi

4. **Perform operations:**
   - Create/Update records
   - Try to delete (if health worker)
   - View data

5. **Go online:**
   - Check console for sync messages
   - Verify data on server
   - Check pending operations cleared

---

## Security Considerations

### Multi-Layer Protection

**Layer 1: UI (Frontend)**
- Delete buttons disabled for health workers
- Warning messages shown
- Smooth UX without errors

**Layer 2: Offline Queue**
- Delete operations blocked before queueing
- Role checked from localStorage
- Prevents bad data in queue

**Layer 3: Backend API**
- JWT validation on every request
- Role-based access control
- Returns 403 for unauthorized ops

**Layer 4: Database**
- Row-level security policies
- User cannot see others' data
- PostgreSQL enforces rules

### Why Multiple Layers?

1. **Defense in Depth:** If one layer fails, others protect
2. **User Experience:** Frontend prevents confusion
3. **Data Integrity:** Backend ensures correctness
4. **Security:** Multiple validations prevent bypass
5. **Audit:** All layers log actions

---

## Troubleshooting

### Health Worker Cannot Perform Action

**Symptom:** "Permission Denied" warning when trying to delete

**Solution:** This is expected behavior. Health workers cannot delete. Contact admin if deletion needed.

**Workaround:** Update record status to "inactive" instead of deleting.

### Parent Cannot Edit Records

**Symptom:** No edit buttons visible

**Solution:** This is expected. Parents have read-only access. Health workers must make updates.

**Workaround:** Send message to health worker requesting change.

### Sync Fails for Some Operations

**Symptom:** Some operations don't sync, stay in pending

**Check:**
1. Is user still authenticated? (Token may have expired)
2. Is operation allowed for role? (Delete blocked for health workers)
3. Is server endpoint correct? (Some endpoints role-specific)
4. Check browser console for errors

**Fix:**
- Re-login to refresh token
- Remove invalid operations from queue
- Sync again

---

## API Endpoints by Role

### Admin Access

```
GET    /patients               ✓
POST   /patients               ✓
PUT    /patients/:id           ✓
DELETE /patients/:id           ✓

GET    /immunizations          ✓
POST   /immunizations          ✓
PUT    /immunizations/:id      ✓
DELETE /immunizations/:id      ✓

... (all endpoints accessible)
```

### Health Worker Access

```
GET    /patients               ✓
POST   /patients               ✓
PUT    /patients/:id           ✓
DELETE /patients/:id           ❌ BLOCKED

GET    /immunizations          ✓
POST   /immunizations          ✓
PUT    /immunizations/:id      ✓
DELETE /immunizations/:id      ❌ BLOCKED

GET    /visits                 ✓
POST   /visits                 ✓
PUT    /visits/:id             ✓

GET    /vaccines               ✓ (read-only)
GET    /inventory              ✓ (read-only)
```

### Parent Access

```
GET    /patients               ✓ (own children only)
POST   /patients               ❌
PUT    /patients/:id           ❌
DELETE /patients/:id           ❌

GET    /immunizations          ✓ (own children only)
GET    /schedules              ✓ (own children only)

GET    /messages               ✓
POST   /messages               ✓ (to health workers)

GET    /notifications          ✓
```

---

## Summary

| Feature | Admin | Health Worker | Parent |
|---------|-------|---------------|--------|
| **View Data** | All | All | Own only |
| **Create Records** | ✅ | ✅ | ❌ |
| **Update Records** | ✅ | ✅ | ❌ |
| **Delete Records** | ✅ | ❌ | ❌ |
| **Offline Mode** | Full | Full | Read-only |
| **Sync Queue** | All ops | CREATE/UPDATE | Messages |
| **Manual Sync** | ✅ | ✅ | Auto only |
| **Clear Data** | ✅ | ✅ | Auto |

**Key Points:**
- ✅ All roles work fully offline
- ✅ Health workers cannot delete (by design)
- ✅ Parents are read-only (except messages)
- ✅ All operations properly queued and synced
- ✅ Multi-layer security enforcement
- ✅ Smooth UX with appropriate warnings

---

**Last Updated:** November 2, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
