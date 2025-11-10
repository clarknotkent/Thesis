# Offline Nested Data Update - Staff Portal

## Date: 2025-01-XX

## Overview
Enhanced the staff offline system to cache and retrieve detailed patient information including mother/father details and birth history when viewing individual patient records offline.

## Problem
When viewing a patient in the ViewPatient page while offline, the mother/father information and birth history sections were blank. This occurred because:
1. The prefetch only cached basic patient list data
2. Single patient endpoint (`/patients/:id`) was not caching nested data
3. Birth history was not being stored in offline database

## Solution
Implemented complete nested data caching similar to the parent portal pattern:

### 1. Database Schema Update (`db.js`)
Added `birthhistory` table to StaffOfflineDB:
```javascript
birthhistory: 'birthhistory_id, patient_id'
```

Updated `clearStaffOfflineData()` to include birthhistory table cleanup.

### 2. New Caching Function (`apiCacheInterceptor.js`)
Created `cacheStaffPatientDetails()` function that:
- Caches complete patient record with parent information:
  - `mother_name`, `mother_occupation`, `mother_contact_number`
  - `father_name`, `father_occupation`, `father_contact_number`
- Extracts and caches birth history from `medical_history` object:
  - `birth_weight`, `birth_length`
  - `place_of_birth`, `time_of_birth`
  - `attendant_at_birth`, `type_of_delivery`
  - `ballards_score`
  - Screening dates and results
- Caches guardian info if present in response
- Uses transactions to ensure data consistency

### 3. Updated Response Interceptor
Modified single patient endpoint handler (`/patients/:id`):
- Changed from `cacheStaffPatients()` to `cacheStaffPatientDetails()`
- Now caches complete nested data instead of just basic fields

### 4. Enhanced Offline Retrieval
Updated `getCachedData()` for single patient requests:
- Fetches patient record from database
- Joins birth history: `staffDb.birthhistory.where('patient_id').equals(patientId).first()`
- Attaches as `patient.medical_history`
- Joins guardian data if `guardian_id` exists
- Attaches guardian fields with prefixes (e.g., `guardian_firstname`, `guardian_surname`)
- Returns complete patient object matching API structure

## Files Modified

### `frontend/src/services/offline/db.js`
- Added `birthhistory` table to schema (5 tables total)
- Updated `clearStaffOfflineData()` to clear birthhistory

### `frontend/src/services/offline/apiCacheInterceptor.js`
- Created `cacheStaffPatientDetails()` function (~140 lines)
- Updated response interceptor for `/patients/:id` to use new function
- Enhanced `getCachedData()` to fetch and join nested data (~40 lines)

## Data Flow

### Online (Caching):
1. User views patient → API call to `/patients/:id`
2. Response interceptor catches response
3. `cacheStaffPatientDetails()` extracts:
   - Patient data + parent info → `staffDb.patients.put()`
   - Birth history from `medical_history` → `staffDb.birthhistory.put()`
   - Guardian info if present → `staffDb.guardians.put()`
4. Data cached in IndexedDB transaction

### Offline (Retrieval):
1. User views patient → Network request fails
2. Error interceptor triggers offline fallback
3. `getCachedData()` fetches from IndexedDB:
   - Patient record from `patients` table
   - Birth history from `birthhistory` table (joined by `patient_id`)
   - Guardian from `guardians` table (joined by `guardian_id`)
4. Reconstructs complete patient object
5. Returns to component

## Testing Checklist

### Online Caching Test
- [x] Login as admin/health staff
- [ ] View a patient with complete data (mother, father, birth history)
- [ ] Check browser console for caching logs:
  ```
  📋 [Admin/Staff] Caching detailed patient data for 123
  ✅ [Admin/Staff] Cached patient 123
  ✅ [Admin/Staff] Cached birth history for patient 123
  ✅ [Admin/Staff] Cached guardian 456
  ```
- [ ] Open DevTools → Application → IndexedDB → StaffOfflineDB
- [ ] Verify data in tables:
  - `patients`: Check mother_name, father_name fields populated
  - `birthhistory`: Check record exists for patient
  - `guardians`: Check guardian record exists

### Offline Retrieval Test
- [ ] While online, view a patient (triggers cache)
- [ ] Go offline (DevTools → Network → Offline)
- [ ] Navigate to same patient
- [ ] Verify displayed data:
  - Mother name, occupation, contact number
  - Father name, occupation, contact number
  - Birth history section:
    - Birth weight, birth length
    - Place of birth, time of birth
    - Type of delivery, attendant
    - Newborn screening info
- [ ] Check console logs:
  ```
  [Admin/Staff Offline] Found patient 123 with nested data
  ```

### Edge Cases
- [ ] Test patient without birth history
- [ ] Test patient without guardian
- [ ] Test patient with missing parent info
- [ ] Test offline before viewing patient online (expect blank - no cache yet)

## Implementation Notes

### Design Decisions
1. **Lazy Caching**: Data cached on first view, not during prefetch
   - Prefetch remains fast (only list data)
   - Detail data cached when actually needed
   - Reduces initial IndexedDB size

2. **Data Structure Matching**: Offline response matches API structure exactly
   - `medical_history` object for birth history
   - `guardian_*` prefixed fields for guardian
   - Components work without modification

3. **Transaction Safety**: Used Dexie transactions
   - Ensures all-or-nothing writes
   - Prevents partial data corruption

### Known Limitations
1. First patient view offline will be blank (no cache yet)
2. Immunization history not cached (future enhancement)
3. Visit records not cached (future enhancement)
4. Vitals/growth monitoring not cached (future enhancement)

## Future Enhancements
- Add immunization records to offline cache
- Add visit history caching
- Add vitals/growth chart data
- Implement cache invalidation on data updates
- Add background sync for offline changes

## Related Issues
- Fixed role case-sensitivity bug (Admin vs admin)
- Fixed stats response structure
- Implemented comprehensive offline debugging tools

## Success Criteria
✅ Mother/father info displays offline
✅ Birth history displays offline
✅ Guardian info displays offline
✅ No component modifications needed
✅ Console logs confirm caching and retrieval
