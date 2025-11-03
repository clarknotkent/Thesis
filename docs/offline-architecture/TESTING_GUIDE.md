# Quick Testing Guide - Offline-First Architecture

## Prerequisites
```bash
cd frontend
npm install  # Make sure dexie is installed
npm run dev  # Start development server
```

---

## Test 1: Basic Offline Save (Patient)

### Steps:
1. Open Chrome DevTools → Network tab
2. Set throttling to **"Offline"**
3. Navigate to: `/healthworker/patients/add`
4. Fill out patient form:
   - First Name: John
   - Surname: Doe
   - Sex: Male
   - Date of Birth: 2020-01-01
   - Guardian: (select any)
   - Relationship: Mother
   - Mother's Name: Jane Doe
   - Fill required birth history fields
5. Click **"Save Record"**

### Expected Results:
- ✅ Success toast appears instantly
- ✅ Redirected to patients list
- ✅ Console shows: `✅ Patient saved to local Dexie database: temp_patient_...`
- ✅ Console shows: `✅ Patient queued for sync in pending_uploads`

### Verify in Dexie:
1. Open DevTools → Application tab → IndexedDB → ImmunizationDB
2. Check `patients` table:
   - Should have new record with `_pending: true`
   - ID starts with `temp_patient_`
3. Check `pending_uploads` table:
   - Should have 1 entry with `type: 'patient'`, `status: 'pending'`

---

## Test 2: Basic Offline Save (Immunization)

### Steps:
1. Stay **offline** (Network → Offline)
2. Navigate to a patient detail page
3. Click "Add Immunization Record"
4. Add a vaccine service (e.g., BCG)
5. Click **"Save Record"**

### Expected Results:
- ✅ Success toast appears
- ✅ Console shows: `✅ Immunizations saved to Dexie: 1`
- ✅ Console shows: `✅ Immunizations queued for sync in pending_uploads`

### Verify in Dexie:
1. Check `immunizations` table:
   - New record with `_pending: true`
   - ID starts with `temp_immunization_`
2. Check `pending_uploads` table:
   - Should now have 2 entries (patient + immunization)

---

## Test 3: Online Sync

### Steps:
1. Open DevTools console (watch for sync logs)
2. Set Network throttling back to **"Online"** or **"No throttling"**
3. Wait 5-10 seconds

### Expected Results:
- ✅ Console shows:
  ```
  🌐 Device is ONLINE
  🔄 Starting sync...
  📤 Found 2 pending uploads
  📤 Processing patient (create): 1
  ✅ Patient synced: temp_patient_xxx → [real-uuid]
  📤 Processing immunization (create): 2
  ✅ Immunization synced: temp_immunization_xxx → [real-uuid]
  ✅ Sync completed successfully
  ```
- ✅ Success toasts appear: "Patient record synced to server"
- ✅ Success toasts appear: "Immunization record synced to server"

### Verify in Dexie:
1. Check `patients` table:
   - Old `temp_patient_xxx` record is **gone**
   - New record with real Supabase UUID exists
   - `_pending: false`
2. Check `immunizations` table:
   - Same transformation (temp ID → real UUID)
   - `_pending: false`
3. Check `pending_uploads` table:
   - Should be **empty** (all processed)

### Verify in Supabase:
1. Open Supabase dashboard
2. Check `patients` table → New patient should exist
3. Check `immunizations` table → New immunization should exist

---

## Test 4: Manual Sync Trigger

### Setup:
1. Go offline
2. Add a patient
3. Stay offline (don't reconnect yet)

### Steps:
1. Open browser console
2. Type: `syncService.manualSync()`
3. Press Enter

### Expected Results:
- ✅ Console shows: `📴 Device is offline, skipping sync`
- ✅ No errors

### Now go online:
1. Set Network to Online
2. Type: `syncService.manualSync()` again
3. Press Enter

### Expected Results:
- ✅ Sync starts immediately
- ✅ Patient syncs to Supabase
- ✅ Toast notification appears

---

## Test 5: Multiple Offline Saves (FIFO Queue)

### Steps:
1. Go **offline**
2. Add 3 patients in a row
3. Add 2 immunization records
4. Check `pending_uploads` table → Should have 5 entries
5. Go **online**
6. Watch console logs

### Expected Results:
- ✅ All 5 uploads process **in order** (FIFO)
- ✅ Console shows:
  ```
  📤 Found 5 pending uploads
  📤 Processing patient (create): 1
  ✅ Patient synced: ...
  📤 Processing patient (create): 2
  ✅ Patient synced: ...
  ... (continues for all 5)
  ```
- ✅ All records appear in Supabase
- ✅ `pending_uploads` table is empty

---

## Test 6: Conflict Detection (Reject & Refresh)

**Note**: This test requires Step 1b (Supabase migrations) to be completed first.

### Setup:
You need **two browser windows** (or one browser + Supabase dashboard):
- **Window A**: Health worker (will go offline)
- **Window B**: Admin (stays online)

### Steps:

#### Window A (Health Worker):
1. Navigate to patient list
2. Open a patient detail page
3. Note the patient's name and current address
4. Go **offline** (Network → Offline)
5. Edit the patient (if edit page exists) or prepare to update via API:
   - Change address to "Mandaue City"
   - Click "Save" (saves to Dexie only)
6. Verify in Dexie:
   - `pending_uploads` has one entry for patient update
   - Patient record shows new address
7. **Stay offline** for now

#### Window B (Admin):
1. Open Supabase dashboard
2. Go to `patients` table
3. Find the same patient
4. Manually edit a different field (e.g., contact number: "123" → "999")
5. Save (this updates `updated_at` timestamp on server)

#### Window A (Health Worker) - Reconnect:
1. Set Network back to **Online**
2. Wait for sync to trigger (or manually trigger)
3. Watch console and toast notifications

### Expected Results:
- ✅ Console shows:
  ```
  ⚠️ CONFLICT DETECTED for patient: [patient-id]
  ✅ Conflict resolved: Local data refreshed from server
  ```
- ✅ Toast appears:
  ```
  Sync Conflict
  Your changes for patient "John Doe" could not be saved because 
  the record was updated by someone else. The record has been 
  refreshed. Please make your changes again.
  ```
- ✅ Local patient record is **overwritten** with server data:
  - Address is back to original (NOT "Mandaue City")
  - Contact number is "999" (Admin's change)
- ✅ `pending_uploads` entry is **deleted** (rejected)

#### Window A (Health Worker) - Re-apply Changes:
1. Edit patient again
2. Change address to "Mandaue City" (based on refreshed data)
3. Save
4. This time sync should succeed (no conflict)

---

## Test 7: Sync Status Debugging

### Steps:
1. Open browser console
2. Type: `await syncService.getSyncStatus()`
3. Press Enter

### Expected Output:
```javascript
{
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0
}
```

### Interpretation:
- `isOnline`: Browser connection status
- `isSyncing`: Whether sync is currently running
- `pendingCount`: Number of items in queue
- `failedCount`: Number of failed syncs (should be 0)

---

## Test 8: App Restart (Persistence)

### Steps:
1. Go **offline**
2. Add a patient
3. Verify it's in Dexie (`_pending: true`)
4. **Close the browser tab**
5. **Reopen** the app
6. Check Dexie → Patient should still be there
7. Go **online**
8. Sync should trigger automatically on next interval

### Expected Results:
- ✅ Data persists across sessions
- ✅ Pending uploads resume when online
- ✅ No data is lost

---

## Common Issues & Solutions

### Issue: "Cannot read property 'add' of undefined"
**Cause**: Dexie database not initialized  
**Solution**: Check console for Dexie init errors. Make sure `db.js` is imported correctly.

### Issue: Sync never triggers when online
**Cause**: Online event listener not working  
**Solution**: 
1. Check console for "🌐 Device is ONLINE" message
2. Manually trigger: `syncService.manualSync()`
3. Check if `syncInterval` is set (should log every 30 seconds)

### Issue: "pending_uploads table is full, but nothing syncs"
**Cause**: API endpoint errors or authentication issues  
**Solution**:
1. Check console for error messages
2. Verify Supabase credentials in `.env`
3. Check Network tab for failed API calls
4. Query `pending_uploads` table:
   ```javascript
   await db.pending_uploads.where('status').equals('failed').toArray()
   ```

### Issue: Duplicate records in Supabase
**Cause**: Sync ran twice before temp record was deleted  
**Solution**: This shouldn't happen with our implementation. If it does:
1. Check for race conditions in `syncService.js`
2. Verify `isSyncing` flag is working
3. Add transaction locks if needed

---

## Dexie DevTools Commands

### View all patients:
```javascript
await db.patients.toArray()
```

### View pending uploads:
```javascript
await db.pending_uploads.toArray()
```

### View patients that haven't synced:
```javascript
await db.patients.where('_pending').equals(true).toArray()
```

### Clear all data (reset):
```javascript
await db.patients.clear()
await db.immunizations.clear()
await db.pending_uploads.clear()
```

### Count records:
```javascript
await db.patients.count()  // Total patients
await db.pending_uploads.count()  // Pending syncs
```

---

## Success Criteria

After running all tests, you should observe:

✅ **Offline Capability**: All forms work without internet  
✅ **Instant Performance**: Saves take <100ms locally  
✅ **Data Persistence**: Data survives browser restarts  
✅ **Automatic Sync**: Syncs when online without user action  
✅ **Conflict Detection**: Stale updates are rejected  
✅ **User Notification**: Toasts show sync status and conflicts  
✅ **Data Integrity**: No data loss, no silent overwrites  
✅ **Queue Processing**: FIFO order maintained  

---

## Next Steps

1. ✅ Complete Step 1b: Add `updated_at` columns in Supabase
2. ✅ Test conflict resolution with real timestamps
3. ✅ Add more entity types (guardians, visits, etc.)
4. ✅ Implement UPDATE operations for patients/immunizations
5. ✅ Add bulk sync for initial data download
6. ✅ Optimize sync interval based on user activity
7. ✅ Add sync status indicator in UI
8. ✅ Implement retry logic for failed syncs

---

Happy Testing! 🎉
