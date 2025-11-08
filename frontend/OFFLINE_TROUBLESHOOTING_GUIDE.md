# Offline Cache Troubleshooting Guide

## Problem: "No cached data for /guardians" when offline

### Root Cause Analysis

Based on the database schema, **every patient MUST have a guardian** (foreign key constraint):
```sql
CONSTRAINT patients_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(guardian_id)
```

This means:
- ✅ You cannot have patients without guardians in the database
- ✅ If patients cached successfully, guardians MUST exist in backend
- ❌ If guardians cache is empty, it's either:
  1. Prefetch never ran (went offline before login completed)
  2. Backend `/guardians` endpoint is returning unexpected data
  3. Backend has no guardians in database (critical DB issue)

---

## Diagnostic Steps (Run in Order)

### Step 1: Check Current Cache State

**While ONLINE, open browser console and run:**

```javascript
await window.checkCache()
```

**Expected Output:**
```
📊 Cache Statistics:
   Patients: 50
   Guardians: 25
   Inventory: 100
   Users: 0
   Total: 175
```

**If Guardians = 0:**
- Proceed to Step 2

**If ALL = 0:**
- You went offline before login/prefetch completed
- Proceed to Step 5 (Fresh Start)

---

### Step 2: Check Backend Guardians Endpoint

**While ONLINE, run:**

```javascript
await window.checkBackendGuardians()
```

**Expected Output:**
```
🔍 Checking backend /guardians endpoint...
📡 Backend Response: { status: 200, hasData: true, ... }
📊 Backend has 25 guardians
📋 Sample guardian: { guardian_id: 1, surname: "Dela Cruz", ... }

🔄 Cache vs Backend:
  - Backend: 25 guardians
  - Cache: 0 guardians
  ⚠️ Cache is empty but backend has data
  💡 Run window.cacheGuardians() to fix this
```

**If Backend returns 0 guardians:**
- ❌ **CRITICAL DATABASE ISSUE**
- Check Supabase/PostgreSQL - guardians table is empty
- This violates foreign key constraints (patients need guardians)
- Contact database admin

**If Backend returns guardians but cache is empty:**
- Proceed to Step 3

---

### Step 3: Manually Populate Cache

**While ONLINE, run:**

```javascript
await window.cacheGuardians()
```

**Expected Output:**
```
📥 Fetching guardians from API...
✅ Cached 25 guardians
📊 Sample: { guardian_id: 1, surname: "Dela Cruz", ... }
```

**Then verify:**
```javascript
await window.checkCache()
```

**If guardians now show up:**
- ✅ Problem solved! Proceed to Step 4
- The prefetch likely failed silently during login

**If still 0:**
- Check browser console for errors
- Check network tab for `/guardians` request
- Verify authentication token is valid

---

### Step 4: Test Offline Readiness

```javascript
await window.testOffline()
```

**Expected Output:**
```
🧪 Testing offline readiness...
📊 Cache Contents:
  - Patients: 50
  - Guardians: 25
  - Inventory: 100
  - Users: 0

🔍 Relationship Check:
  - 50 patients reference 25 unique guardians
  ✅ All patient guardians are cached

🎯 Offline Readiness:
  ✅ Cache looks good - offline should work!
  💡 Go offline and try viewing a patient
```

**If all checks pass:**
- Go offline (DevTools Network tab > Throttling > Offline)
- Navigate to ViewPatient page
- Should work without errors

**If relationship check fails:**
- Some guardian IDs are missing
- Run `window.cacheGuardians()` again

---

### Step 5: Fresh Start (Nuclear Option)

**If everything fails, start fresh:**

1. **Clear everything:**
   ```javascript
   await window.clearCache()
   localStorage.clear()
   ```

2. **Close all tabs and browser DevTools**

3. **Reopen browser and login while ONLINE**

4. **Watch console for prefetch logs:**
   ```
   📥 Prefetching staff data for offline access...
   ✅ StaffOfflineDB opened for prefetch
   📥 Fetching all patients...
   ✅ Cached 50 patients for offline access
   📥 Fetching all guardians...
   ✅ Cached 25 guardians for offline access
   📥 Fetching vaccine inventory...
   ✅ Cached 100 inventory items for offline access
   📊 Final cache statistics: {patients: 50, guardians: 25, inventory: 100, total: 175}
   ```

5. **If you DON'T see these logs:**
   - Check if you're logged in as Admin or HealthStaff
   - Guardian/Parent users have different offline system
   - Check `useAuth.js` - prefetch only runs for admin/healthstaff

6. **Verify cache populated:**
   ```javascript
   await window.checkCache()
   ```

7. **Go offline and test**

---

## Common Pitfalls

### ❌ Going Offline Before Login
**Symptom:** All cache counts are 0

**Solution:** 
- Cache only populates DURING login (prefetch) or when visiting pages while ONLINE
- You MUST be online for initial data fetch
- Offline mode requires prior online session

### ❌ Backend Has No Guardians
**Symptom:** `window.checkBackendGuardians()` returns 0

**Solution:**
- This is a database integrity issue
- Patients table has foreign key to guardians
- Cannot have patients without guardians
- Check Supabase for data integrity

### ❌ Prefetch Silently Failed
**Symptom:** Patients cached but guardians = 0

**Solution:**
- Check browser console during login for errors
- Network tab may show 401/403 on `/guardians`
- Backend route requires authentication
- Check token expiry

### ❌ Wrong User Role
**Symptom:** No prefetch logs at all

**Solution:**
- Prefetch only runs for Admin and HealthStaff roles
- Guardian/Parent users use different offline system (ParentPortalOfflineDB)
- Check your role: `getRole()` in console

---

## Debug Helper Reference

All functions available in browser console:

```javascript
// Check cache contents with samples
await window.checkCache()

// Test if offline will work
await window.testOffline()

// Check backend vs cache
await window.checkBackendGuardians()

// Manually fetch and cache guardians
await window.cacheGuardians()

// Nuclear option - clear everything
await window.clearCache()
```

---

## Still Broken?

If none of these work, collect the following and share:

1. **Output of all debug commands:**
   ```javascript
   await window.checkCache()
   await window.checkBackendGuardians()
   await window.testOffline()
   ```

2. **Complete console log from login** (showing prefetch logs)

3. **Network tab screenshot** showing `/guardians` request/response

4. **Your user role:** Check in localStorage:
   ```javascript
   JSON.parse(localStorage.getItem('userInfo'))
   ```

5. **IndexedDB contents:**
   - Open DevTools > Application > Storage > IndexedDB
   - Expand StaffOfflineDB
   - Screenshot all table counts

---

## Prevention for Future

### ✅ Always Login While ONLINE First
- Prefetch happens during login
- Cache needs online connection initially
- Subsequent offline use will work

### ✅ Monitor Prefetch Logs
- After login, check console for:
  ```
  ✅ Cached X patients for offline access
  ✅ Cached X guardians for offline access
  ```
- If missing, run `window.cacheGuardians()` manually

### ✅ Periodic Cache Refresh
- Visit pages while online periodically
- Response interceptor auto-updates cache
- Keeps data fresh

### ✅ Test Before Going Offline
- Run `window.testOffline()` before going offline
- Confirms readiness
- Catches missing data early
