# Offline Testing Guide - Nested Data

## Quick Test Steps

### 1. Online Caching Test
```javascript
// In browser console:

// 1. Login as admin/health staff
// 2. Navigate to a patient (e.g., click on a patient from the list)
// 3. Check console logs - should see:
//    📋 [Admin/Staff] Caching detailed patient data for 123
//    ✅ [Admin/Staff] Cached patient 123
//    ✅ [Admin/Staff] Cached birth history for patient 123

// 4. Test what was cached:
await window.testPatientDetails(123) // Replace 123 with actual patient ID
```

### 2. Offline Retrieval Test
```javascript
// In browser console:

// 1. While online, view a patient (this caches the data)
// 2. Go to DevTools → Network tab → Change to "Offline"
// 3. Refresh the page or navigate away and back to the patient
// 4. Patient details should load from cache
// 5. Check console logs:
//    [Admin/Staff Offline] Found patient 123 with nested data

// 6. Verify all fields are populated:
//    - Mother Name, Occupation, Contact
//    - Father Name, Occupation, Contact
//    - Birth History section (weight, length, place, etc.)
```

### 3. Database Inspection
```javascript
// Open DevTools → Application → Storage → IndexedDB → StaffOfflineDB

// Check tables:
// 1. patients - Look for mother_name, father_name fields
// 2. birthhistory - Should have records for viewed patients
// 3. guardians - Should have guardian records

// Or use helper:
await window.checkCache() // Shows all table counts and samples
```

## Test Scenarios

### Scenario 1: Complete Data
Patient with all information filled in:
- ✅ Mother info (name, occupation, contact)
- ✅ Father info (name, occupation, contact)
- ✅ Birth history (weight, length, place, delivery type)
- ✅ Guardian assigned

**Expected Offline**:
- All fields populated
- Birth history section shows data
- Guardian info available

### Scenario 2: Partial Data
Patient with only some information:
- ✅ Mother info
- ❌ No father info
- ✅ Birth history
- ❌ No guardian

**Expected Offline**:
- Mother fields populated
- Father fields show "N/A" or empty
- Birth history shows
- No guardian info

### Scenario 3: Minimal Data
Patient with basic info only:
- ❌ No parent info
- ❌ No birth history
- ❌ No guardian

**Expected Offline**:
- Patient basic info shows
- Parent sections empty/N/A
- Birth history section empty

### Scenario 4: Never Viewed Online
Try to view patient offline without viewing online first:

**Expected Result**:
- Patient loads from list cache (basic info only)
- Nested data is blank (never cached)
- Console: "No cached data" warnings

**Fix**: View patient online first, then test offline

## Debug Commands

### Check What's Cached
```javascript
await window.checkCache()
// Shows counts for all tables + sample data
```

### Test Specific Patient
```javascript
await window.testPatientDetails(123)
// Shows patient, birth history, guardian status
// Tells you what's missing
```

### Force Clear Cache
```javascript
await window.clearCache()
// Clears all offline data
// Login again to re-cache
```

### Check Backend vs Cache
```javascript
await window.checkBackendGuardians()
// Compares backend guardian count vs cache
// Useful for debugging sync issues
```

### Test Complete Offline Readiness
```javascript
await window.testOffline()
// Checks all tables
// Verifies data relationships
// Shows readiness score
```

## Common Issues

### Issue 1: Fields Still Blank Offline
**Symptoms**: Mother/father/birth history empty offline

**Debug Steps**:
1. Check if data was cached:
   ```javascript
   await window.testPatientDetails(123)
   ```
2. Look for caching logs in console (should see when you viewed online)
3. Check IndexedDB → StaffOfflineDB → patients table

**Causes**:
- Never viewed patient online (no cache yet)
- API response didn't include nested data
- Database schema not migrated

**Fix**:
- View patient online first
- Check API response structure
- Clear cache and re-login

### Issue 2: Birth History Not Showing
**Symptoms**: Parent info works, but birth history blank

**Debug**:
```javascript
const patient = await db.patients.get(123)
console.log('Has parent info:', !!patient.mother_name)

const bh = await db.birthhistory.where('patient_id').equals(123).first()
console.log('Birth history:', bh)
```

**Causes**:
- Patient has no birth history in database
- `medical_history` was null in API response
- Birth history not included in patient endpoint

### Issue 3: Guardian Info Missing
**Symptoms**: guardian_id exists but no guardian details

**Debug**:
```javascript
const patient = await db.patients.get(123)
console.log('Guardian ID:', patient.guardian_id)

const guardian = await db.guardians.get(patient.guardian_id)
console.log('Guardian record:', guardian)
```

**Causes**:
- Guardian not in single patient response
- Guardian not cached during prefetch
- `guardian_id` mismatch

## Expected Console Output

### Successful Online Caching
```
[Admin/Staff] Caching single patient details from /patients/123
📋 [Admin/Staff] Caching detailed patient data for 123
✅ [Admin/Staff] Cached patient 123
✅ [Admin/Staff] Cached birth history for patient 123
✅ [Admin/Staff] Cached guardian 456
```

### Successful Offline Retrieval
```
[Offline Mode] Request to /patients/123 failed, using cache
[Admin/Staff Offline] Found patient 123 with nested data
```

### No Cache Warning
```
[Admin/Staff Offline] Patient 123 not found in cache
[Offline Mode] No cached data for /patients/123
```

## Performance Tips

1. **Lazy Load**: Data is cached when first viewed, not during prefetch
   - Keeps initial load fast
   - Only caches what you actually use

2. **Selective Viewing**: Cache only important patients
   - Don't cache every patient unnecessarily
   - View critical patients while online

3. **Clear Old Cache**: Periodically clear and re-cache
   ```javascript
   await window.clearCache()
   // Then login again to refresh
   ```

## API Response Structure
For reference, the expected API response from `/patients/:id`:

```json
{
  "data": {
    "patient_id": 123,
    "firstname": "Juan",
    "surname": "Dela Cruz",
    "mother_name": "Maria Dela Cruz",
    "mother_occupation": "Teacher",
    "mother_contact_number": "09171234567",
    "father_name": "Jose Dela Cruz",
    "father_occupation": "Engineer",
    "father_contact_number": "09181234567",
    "medical_history": {
      "birthhistory_id": 1,
      "patient_id": 123,
      "birth_weight": 3.2,
      "birth_length": 50,
      "place_of_birth": "ABC Hospital",
      "type_of_delivery": "Normal",
      ...
    },
    "guardian_firstname": "Maria",
    "guardian_surname": "Dela Cruz",
    ...
  }
}
```

## Success Checklist
- [ ] Patient basic info loads offline
- [ ] Mother name, occupation, contact populate
- [ ] Father name, occupation, contact populate
- [ ] Birth history section shows data
- [ ] Guardian info displays if assigned
- [ ] Console shows caching logs online
- [ ] Console shows retrieval logs offline
- [ ] `window.testPatientDetails()` passes
- [ ] IndexedDB contains patient data
- [ ] IndexedDB contains birth history
- [ ] No JavaScript errors in console
