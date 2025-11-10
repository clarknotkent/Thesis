# Database Closed Error Fix - November 8, 2025

## Issue
```
❌ Failed to prefetch inventory: Database has been closed
DexieError2 {name: 'DatabaseClosedError', message: 'Database has been closed'}
```

## Root Cause
The error occurred because:
1. **Static import** of `db` from `./db` at module load time
2. Database might not be properly initialized or could be closed by the time prefetch runs
3. **Race condition** between database initialization and usage
4. Logout function was clearing the wrong database for admin/staff users

## Solution

### 1. Lazy Load Database with Explicit Open Check
**Before** (staffLoginPrefetch.js):
```javascript
import { db } from './db' // ❌ Static import - may not be ready

export async function prefetchStaffData() {
  await db.patients.bulkPut(patients) // ❌ May fail if db closed
}
```

**After**:
```javascript
// ✅ No static import

export async function prefetchStaffData() {
  // Lazy load database to avoid initialization issues
  let db
  try {
    db = (await import('./db')).db
    
    // Ensure database is open before using it
    if (!db.isOpen()) {
      await db.open()
      console.log('✅ StaffOfflineDB opened for prefetch')
    }
  } catch (dbError) {
    console.error('❌ Failed to open StaffOfflineDB:', dbError)
    return // Early exit if database can't be opened
  }
  
  // Now safe to use db
  await db.patients.bulkPut(patients)
}
```

### 2. Added Database Clear Functions
**db.js** - Added functions for proper cleanup:
```javascript
/**
 * Clear all staff offline data (for logout/security)
 */
export async function clearStaffOfflineData() {
  try {
    console.log('🗑️ Clearing StaffOfflineDB...')
    await db.patients.clear()
    await db.guardians.clear()
    await db.inventory.clear()
    console.log('✅ StaffOfflineDB cleared')
  } catch (error) {
    console.error('❌ Failed to clear StaffOfflineDB:', error)
  }
}

/**
 * Get StaffOfflineDB statistics (for debugging)
 */
export async function getStaffDatabaseInfo() {
  try {
    const patientCount = await db.patients.count()
    const guardianCount = await db.guardians.count()
    const inventoryCount = await db.inventory.count()
    
    return {
      name: db.name,
      version: db.verno,
      isOpen: db.isOpen(),
      tables: { patients: patientCount, guardians: guardianCount, inventory: inventoryCount },
      total: patientCount + guardianCount + inventoryCount
    }
  } catch (error) {
    console.error('❌ Failed to get StaffOfflineDB info:', error)
    return null
  }
}
```

### 3. Fixed Logout to Clear Correct Database
**Before** (useAuth.js):
```javascript
const logout = async () => {
  // Clear auth data first
  authToken.value = null
  
  // Always clear ParentPortalOfflineDB (wrong for admin/staff!)
  const { clearOfflineDataOnLogout } = await import('@/services/offline')
  await clearOfflineDataOnLogout()
}
```

**After**:
```javascript
const logout = async () => {
  // Clear offline data based on role BEFORE clearing auth data
  const currentRole = (userRole.value || '').toLowerCase()
  
  if (currentRole === 'guardian' || currentRole === 'parent') {
    // Clear ParentPortalOfflineDB
    const { clearOfflineDataOnLogout } = await import('@/services/offline')
    await clearOfflineDataOnLogout()
    
    const { resetCacheFlag } = await import('@/services/offline/parentLoginPrefetch')
    resetCacheFlag()
  } else if (currentRole === 'admin' || currentRole === 'healthstaff') {
    // Clear StaffOfflineDB
    const { clearStaffOfflineData } = await import('@/services/offline/db')
    await clearStaffOfflineData()
    console.log('✅ Staff offline data cleared on logout')
  }
  
  // Then clear auth data
  authToken.value = null
}
```

### 4. Updated getStaffCacheStats with Same Pattern
```javascript
export async function getStaffCacheStats() {
  try {
    // Lazy load database
    const { db } = await import('./db')
    
    // Ensure database is open
    if (!db.isOpen()) {
      await db.open()
    }
    
    const patientCount = await db.patients.count()
    const guardianCount = await db.guardians.count()
    const inventoryCount = await db.inventory.count()
    
    return {
      patients: patientCount,
      guardians: guardianCount,
      inventory: inventoryCount,
      total: patientCount + guardianCount + inventoryCount
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return { patients: 0, guardians: 0, inventory: 0, total: 0 }
  }
}
```

## Benefits

✅ **No More Race Conditions**: Database is explicitly opened before use
✅ **Proper Error Handling**: Early exit if database can't be opened
✅ **Role-Based Cleanup**: Correct database cleared based on user role
✅ **Lazy Loading**: Database imported only when needed
✅ **Better Logging**: Clear console messages for debugging

## Testing Instructions

1. **Clear browser data** completely
2. **Login as Admin**
3. **Check console** for these logs:
   ```
   ✅ StaffOfflineDB opened for prefetch
   📥 Fetching all patients...
   📊 Sample patient item: {...}
   ✅ Cached X patients for offline access
   📥 Fetching all guardians...
   📊 Sample guardian item: {...}
   ✅ Cached X guardians for offline access
   📥 Fetching vaccine inventory...
   📊 Sample inventory item: {...}
   ✅ Cached X inventory items for offline access
   ✅ Staff data prefetch complete
   ```
4. **Verify IndexedDB**: DevTools → Application → IndexedDB → StaffOfflineDB should have data
5. **Logout**: Console should show:
   ```
   🗑️ Clearing StaffOfflineDB...
   ✅ StaffOfflineDB cleared
   ```
6. **Verify cleanup**: StaffOfflineDB should be empty after logout

## Key Changes Summary

| File | Change | Reason |
|------|--------|--------|
| `staffLoginPrefetch.js` | Lazy load db + explicit open check | Fix "Database has been closed" error |
| `staffLoginPrefetch.js` | Remove static import | Avoid initialization race condition |
| `db.js` | Add `clearStaffOfflineData()` | Proper cleanup on logout |
| `db.js` | Add `getStaffDatabaseInfo()` | Debugging support |
| `useAuth.js` | Role-based database clearing | Clear correct DB based on user role |

## Related Issues Fixed

1. ❌ **Database closed error** during prefetch → ✅ Fixed with lazy load + open check
2. ❌ **Wrong database cleared** on admin logout → ✅ Fixed with role-based cleanup
3. ❌ **Race condition** on database init → ✅ Fixed with explicit open check
4. ❌ **No cleanup function** for staff DB → ✅ Added `clearStaffOfflineData()`

## Architecture Notes

**Two Separate Databases**:
- `StaffOfflineDB` - Admin/HealthStaff (patients, guardians, inventory)
- `ParentPortalOfflineDB` - Guardian/Parent (9+ tables)

**Why Separate?**:
- Different data scopes
- Different security requirements
- Different lifecycle (staff data wiped on logout)
- Prevent parent DB from loading for admin users

**Lazy Loading Pattern**:
```javascript
// ✅ Good - Lazy load when needed
const { db } = await import('./db')
if (!db.isOpen()) await db.open()

// ❌ Bad - Static import at module load
import { db } from './db'
```

## Next Steps

1. Test the fix with admin login/logout cycle
2. Verify data persists between page refreshes (while logged in)
3. Verify data is cleared on logout
4. Test offline functionality after successful prefetch
5. Monitor console for any new database-related errors
