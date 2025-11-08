# Field Mapping Fix - November 8, 2025

## Summary
Updated `staffLoginPrefetch.js` and `db.js` to use **exact field names from the SQL schema** instead of guessing variations. This fixes the IDBObjectStore key path error that occurred when caching data.

## Problem
The previous field mapping was trying multiple field name variations (e.g., `stock_id || id || inventory_id`) because we didn't know the exact backend response structure. This caused:
- **IDBObjectStore Error**: "Evaluating the object store's key path did not yield a value"
- Incomplete data caching due to field name mismatches

## Solution
After analyzing the PostgreSQL schema and backend models, we now map **exact field names** returned by the API:

### 1. Patients (from `/patients` endpoint)
**SQL Table**: `patients`
**Backend Model**: `patientModel.getAllPatients()` using `patients_view`

**Mapped Fields**:
```javascript
{
  patient_id: patient.patient_id,           // Primary key (bigint)
  surname: patient.surname,                 // varchar
  firstname: patient.firstname,             // varchar
  middlename: patient.middlename,           // varchar (nullable)
  full_name: patient.full_name,             // computed field
  sex: patient.sex,                         // varchar (Male/Female/Other)
  date_of_birth: patient.date_of_birth,    // date
  address: patient.address,                 // text
  barangay: patient.barangay,              // varchar
  health_center: patient.health_center,    // varchar
  guardian_id: patient.guardian_id,        // bigint (FK)
  family_number: patient.family_number,    // varchar
  tags: patient.tags,                      // varchar (None/Defaulter/FIC/CIC)
  status: patient.status,                  // varchar (Active/Inactive)
  age: patient.age,                        // computed (if from view)
  _raw: patient                            // original response
}
```

### 2. Guardians (from `/guardians` endpoint)
**SQL Table**: `guardians` joined with `users`
**Backend Model**: `guardianModel.getAllGuardians()`

**Mapped Fields**:
```javascript
{
  guardian_id: guardian.guardian_id,        // Primary key (bigint)
  user_id: guardian.user_id,               // bigint (FK to users)
  surname: guardian.surname,               // varchar
  firstname: guardian.firstname,           // varchar
  middlename: guardian.middlename,         // varchar (nullable)
  full_name: guardian.full_name,           // "surname, firstname middlename"
  sex: guardian.sex,                       // varchar
  contact_number: guardian.contact_number, // varchar (unique)
  email: guardian.email,                   // varchar
  address: guardian.address,               // text
  family_number: guardian.family_number,   // varchar
  occupation: guardian.occupation,         // varchar
  _raw: guardian                           // original response
}
```

### 3. Inventory (from `/vaccines/inventory` endpoint)
**SQL Table**: `inventory` joined with `vaccinemaster`
**Backend Model**: `vaccineModel.getAllInventory()`

**Mapped Fields**:
```javascript
{
  id: item.inventory_id,                           // Primary key (Dexie uses "id")
  inventory_id: item.inventory_id,                 // bigint
  vaccine_id: item.vaccine_id,                     // bigint (FK)
  lot_number: item.lot_number,                     // varchar
  expiration_date: item.expiration_date,           // date
  current_stock_level: item.current_stock_level,   // integer
  received_date: item.received_date,               // timestamp
  initial_quantity: item.initial_quantity,         // integer
  storage_location: item.storage_location,         // text
  // Flattened from vaccinemaster join:
  antigen_name: item.vaccinemaster?.antigen_name,
  brand_name: item.vaccinemaster?.brand_name,
  manufacturer: item.vaccinemaster?.manufacturer,
  vaccine_type: item.vaccinemaster?.vaccine_type,
  category: item.vaccinemaster?.category,
  disease_prevented: item.vaccinemaster?.disease_prevented,
  is_nip: item.vaccinemaster?.is_nip,
  _raw: item                                       // original response
}
```

## Database Schema Updates

### Updated `db.js` Schema
```javascript
db.version(1).stores({
  // Patients - primary key: patient_id
  patients: 'patient_id, full_name, surname, firstname, date_of_birth',
  
  // Guardians - primary key: guardian_id
  guardians: 'guardian_id, full_name, contact_number',
  
  // Inventory - primary key: id (mapped from inventory_id)
  inventory: 'id, inventory_id, vaccine_id, lot_number, expiration_date'
})
```

**Note**: IndexedDB requires the primary key to be named `id` for auto-increment tables, so we map `inventory_id` to `id`.

## Testing Instructions

1. **Clear Browser Data**:
   - Open DevTools → Application → IndexedDB → Delete `StaffOfflineDB`
   - Clear localStorage and caches
   - Hard refresh: Ctrl+Shift+R

2. **Login as Admin**:
   Watch console for these logs:
   ```
   📥 Prefetching staff data for offline access...
   📥 Fetching all patients...
   📊 Sample patient item: {patient_id: 1, surname: "Smith", ...}
   ✅ Cached X patients for offline access
   📥 Fetching all guardians...
   📊 Sample guardian item: {guardian_id: 1, surname: "Doe", ...}
   ✅ Cached X guardians for offline access
   📥 Fetching vaccine inventory...
   📊 Sample inventory item: {inventory_id: 1, lot_number: "ABC123", ...}
   ✅ Cached X inventory items for offline access
   ✅ Staff data prefetch complete
   ```

3. **Verify IndexedDB**:
   - Open DevTools → Application → IndexedDB → StaffOfflineDB
   - Should see 3 tables: `patients`, `guardians`, `inventory`
   - Each should have data with correct field names

4. **Test Offline**:
   - Disconnect network or stop backend
   - Navigate to:
     - Patient Records list (should load)
     - ViewPatient detail page (should load with guardian info)
     - Inventory list (should load)
   - Check console for:
     ```
     🔌 Offline detected for /patients - checking cache...
     [Admin/Staff Offline] Found X cached patients
     ✅ Serving from offline cache: /patients
     ```

## Key Changes Made

1. **staffLoginPrefetch.js**:
   - Removed field name guessing (no more `|| fallbacks`)
   - Added all SQL schema fields to mapping
   - Added comprehensive comments referencing SQL schema
   - Kept `_raw` field for debugging

2. **db.js**:
   - Updated inventory schema: `lot_no` → `lot_number`, `expiry_date` → `expiration_date`
   - Added `inventory_id` as indexed field
   - Updated comments to reflect exact SQL schema

## Benefits

✅ **No More Guessing**: Field names match SQL schema exactly
✅ **Better Debugging**: `_raw` field preserves original response
✅ **Type Safety**: All fields explicitly mapped (easier to maintain)
✅ **Complete Data**: All relevant fields cached for offline use
✅ **Clear Documentation**: Comments reference SQL schema

## Related Files

- `frontend/src/services/offline/staffLoginPrefetch.js` - Data prefetch with field mapping
- `frontend/src/services/offline/db.js` - StaffOfflineDB schema definition
- `frontend/src/services/offline/apiCacheInterceptor.js` - Offline cache handler
- `backend/models/patientModel.js` - Patient data source
- `backend/models/guardianModel.js` - Guardian data source
- `backend/models/vaccineModel.js` - Inventory data source

## Next Steps

1. Test the prefetch with real data
2. Verify offline functionality works end-to-end
3. Add `/patients/stats` endpoint caching
4. Implement cache refresh UI
5. Add cache size monitoring
