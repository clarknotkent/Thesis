# HealthWorker Feature Extraction Analysis
**Date**: November 1, 2025  
**Status**: Comprehensive Analysis Complete

## File Complexity Overview

| File | Lines | Refs | Priority | Status |
|------|-------|------|----------|--------|
| AddPatientImmunizationRecord.vue | 1612 | 25 | ✅ DONE | Composables extracted |
| Messages.vue | 1088 | 14 | ✅ DONE | Composables extracted |
| PatientDetails.vue | 966 | 12 | 🔵 HIGH | Needs composables |
| EditVaccinationRecord.vue | 905 | 9 | 🔵 HIGH | Needs composables |
| AddPatient.vue | 885 | 11 | 🔵 HIGH | Needs composables |
| PatientRecords.vue | 686 | 18 | ✅ DONE | Composables extracted |
| VisitSummary.vue | 679 | 4 | 🟢 LOW | Display-focused |
| InventoryDetails.vue | 630 | 3 | 🟢 LOW | Display-focused |
| Notifications.vue | 592 | 3 | 🟡 MEDIUM | Needs composable |
| VaccineStock.vue | 565 | 9 | 🟡 MEDIUM | Filter logic extractable |
| VaccineRecordDetails.vue | 518 | 3 | 🟢 LOW | Display-focused |
| VaccineDetail.vue | 389 | 2 | 🟢 LOW | Display-focused |
| QRScanner.vue | 295 | 11 | 🟡 MEDIUM | QR logic extractable |
| Menu.vue | 265 | 0 | ✅ DONE | No extraction needed |
| Dashboard.vue | 118 | 2 | ✅ DONE | Already uses components |
| Profile.vue | 106 | 2 | 🟢 LOW | Simple API call |
| Settings.vue | 55 | 1 | 🟢 LOW | LocalStorage only |

## Detailed Extraction Recommendations

### 🔵 HIGH PRIORITY (3 files)

#### 1. PatientDetails.vue (966 lines, 12 refs)
**Current State**: Using 5 extracted components already
```javascript
// Already using:
- PatientQRCodeCard
- CollapsibleCard
- VaccinationRecordCard
- ScheduledVaccineCard
- MedicalHistoryCard
```

**Extraction Needed**:
- `usePatientDetails` composable
  - Patient data loading (fetchPatient)
  - Vaccination history enrichment
  - Scheduled vaccinations loading
  - Medical history loading
  - Age calculation logic
  - Date formatting utilities
  - Tab management state

**Benefits**:
- Reduce file from 966 → ~400 lines
- Reusable patient data loading across views
- Testable business logic

---

#### 2. EditVaccinationRecord.vue (905 lines, 9 refs)
**Current State**: Complex form with dose navigation

**Extraction Needed**:
- `useVaccinationRecordEditor` composable
  - Record loading by ID
  - Form state management
  - Dose navigation logic
  - Age calculation on date change
  - Vaccine validation
  - Update API handling
  - Other doses fetching

**Benefits**:
- Reduce file from 905 → ~350 lines
- Reusable edit logic for other record types
- Centralized validation

---

#### 3. AddPatient.vue (885 lines, 11 refs)
**Current State**: Already uses CollapsibleCard component

**Extraction Needed**:
- `usePatientForm` composable
  - Form data state
  - Guardian search & selection
  - Form validation
  - Barangay/health center selection
  - Card expansion state
  - Submit handling
  - Guardian creation modal logic

**Benefits**:
- Reduce file from 885 → ~350 lines
- Reusable patient form for edit mode
- Shared validation with AddPatientImmunizationRecord

---

### 🟡 MEDIUM PRIORITY (3 files)

#### 4. Notifications.vue (592 lines, 3 refs)
**Current State**: Manages notification list with filtering

**Extraction Needed**:
- `useNotifications` composable
  - Notification loading with polling
  - Filter state (all/unread/read)
  - Mark as read/unread
  - Delete notifications
  - Clear all read
  - Notification icon mapping
  - Time formatting

**Benefits**:
- Reduce file from 592 → ~200 lines
- Reusable notification logic for other layouts
- Centralized polling logic

---

#### 5. VaccineStock.vue (565 lines, 9 refs)
**Current State**: Already uses InventoryCard component

**Extraction Needed**:
- `useVaccineInventoryFilters` composable
  - Type filter (NIP/Others)
  - Status filter (In Stock/Low/Out/Expired)
  - Sort options
  - Search filtering
  - Filter sheet state
  - Filter badge logic

**Benefits**:
- Reduce file from 565 → ~250 lines
- Reusable filter logic for other inventory views
- Testable filter combinations

---

#### 6. QRScanner.vue (295 lines, 11 refs)
**Current State**: Camera QR scanning with manual entry

**Extraction Needed**:
- `useQRScanner` composable
  - Device listing (camera selection)
  - Camera start/stop
  - Torch control
  - QR result parsing
  - Patient ID extraction
  - Navigation handling
  - Stream management

**Benefits**:
- Reduce file from 295 → ~150 lines
- Reusable QR scanning for other features
- Camera logic centralized

---

### 🟢 LOW PRIORITY (6 files - No extraction needed)

#### Display-Focused Views
These views are primarily display/template-heavy with minimal business logic:

1. **VisitSummary.vue** (679 lines, 4 refs)
   - Mostly display cards for visit details
   - Minimal state management

2. **InventoryDetails.vue** (630 lines, 3 refs)
   - Display-only vaccine inventory details
   - Already well-structured

3. **VaccineRecordDetails.vue** (518 lines, 3 refs)
   - Display-only vaccination record
   - Read-only view

4. **VaccineDetail.vue** (389 lines, 2 refs)
   - Simple vaccine detail display
   - Computed properties only

5. **Profile.vue** (106 lines, 2 refs)
   - Simple profile fetch and display
   - Minimal logic

6. **Settings.vue** (55 lines, 1 ref)
   - LocalStorage-based settings
   - Already very simple

---

## Extraction Priority Roadmap

### Phase 1: High Priority (Immediate) ⚡
1. Extract `usePatientDetails` from PatientDetails.vue
2. Extract `useVaccinationRecordEditor` from EditVaccinationRecord.vue
3. Extract `usePatientForm` from AddPatient.vue

**Expected Impact**: ~1,500 lines reduced to ~1,100 lines (27% reduction)

### Phase 2: Medium Priority (Next)
4. Extract `useNotifications` from Notifications.vue
5. Extract `useVaccineInventoryFilters` from VaccineStock.vue
6. Extract `useQRScanner` from QRScanner.vue

**Expected Impact**: ~1,450 lines reduced to ~600 lines (59% reduction)

### Phase 3: Optimization (Optional)
- Review low-priority files for shared utilities
- Create shared composables for common patterns:
  - `useDateFormatting` - shared date formatting
  - `useFormValidation` - shared validation rules
  - `useDataFetching` - shared API loading patterns

---

## Component Extraction Status

### ✅ Already Extracted (Pre-existing)
**Patients**: 18 components in `features/health-worker/patients/components/`
- CollapsibleCard, PatientQRCodeCard, VaccinationRecordCard
- ScheduledVaccineCard, MedicalHistoryCard, PatientListCard
- PatientForm, FilterSheet, PatientSearchBar, etc.

**Inventory**: Components in `features/health-worker/inventory/`
- InventoryCard, VaccineStockCard, InventoryFilters

**Dashboard**: Components in `features/health-worker/dashboard/`
- StatsCard

### 📦 No Additional Components Needed
All UI components have been extracted. Remaining work focuses on **business logic composables**.

---

## Composables Extracted So Far

### ✅ Completed (8 composables)

**Patients** (5):
- usePatientImmunizationForm
- useVaccineSelection
- useVisitManagement
- usePatientList
- usePatientSearch

**Messages** (3):
- useConversations
- useMessageThread
- useNewConversation

---

## Recommended Next Actions

### Immediate (Phase 1)
```bash
# Create composables for high-priority files
features/health-worker/patients/composables/
  ├── usePatientDetails.js       # From PatientDetails.vue
  ├── useVaccinationRecordEditor.js  # From EditVaccinationRecord.vue
  └── usePatientForm.js          # From AddPatient.vue
```

### Short-term (Phase 2)
```bash
# Create composables for medium-priority files
features/health-worker/notifications/composables/
  └── useNotifications.js        # From Notifications.vue

features/health-worker/inventory/composables/
  └── useVaccineInventoryFilters.js  # From VaccineStock.vue

features/health-worker/tools/composables/
  └── useQRScanner.js            # From QRScanner.vue
```

### Long-term (Phase 3)
```bash
# Create shared utilities
features/health-worker/shared/composables/
  ├── useDateFormatting.js       # Shared date utilities
  ├── useFormValidation.js       # Shared validation
  └── useDataFetching.js         # Shared API patterns
```

---

## Success Metrics

### Current State
- ✅ 8 composables extracted
- ✅ ~1,490 lines of logic extracted
- ✅ 23 UI components already extracted
- 📊 6 files still need extraction (3 high, 3 medium priority)

### Target State (After Phase 1 & 2)
- 🎯 14 composables total
- 🎯 ~3,500 lines of logic extracted
- 🎯 60-70% complexity reduction in large files
- 🎯 All business logic separated from views

### Benefits Achieved
- ✅ Better code organization
- ✅ Improved testability
- ✅ Enhanced reusability
- ✅ Easier maintenance
- ✅ Clear separation of concerns

---

## Technical Debt Assessment

### Low Debt Files ✅
- Dashboard.vue (118 lines) - Clean
- Profile.vue (106 lines) - Simple
- Settings.vue (55 lines) - Minimal
- Menu.vue (265 lines) - Navigation only

### Medium Debt Files ⚠️
- VisitSummary.vue (679 lines) - Display-heavy but acceptable
- InventoryDetails.vue (630 lines) - Well-structured
- VaccineRecordDetails.vue (518 lines) - Read-only view
- VaccineDetail.vue (389 lines) - Simple display

### High Debt Files ❌ (Need extraction)
- **PatientDetails.vue** (966 lines) - 12 refs, complex state
- **EditVaccinationRecord.vue** (905 lines) - 9 refs, form heavy
- **AddPatient.vue** (885 lines) - 11 refs, validation heavy
- **Notifications.vue** (592 lines) - 3 refs, polling logic
- **VaccineStock.vue** (565 lines) - 9 refs, filter heavy
- **QRScanner.vue** (295 lines) - 11 refs, camera logic

---

## Conclusion

**Total Files Analyzed**: 17 healthworker view files  
**Completed**: 3 files (composables extracted)  
**High Priority**: 3 files (immediate extraction needed)  
**Medium Priority**: 3 files (next phase)  
**Low Priority**: 8 files (no extraction needed)

**Recommendation**: Proceed with Phase 1 extraction for the 3 high-priority files to achieve maximum impact with minimal effort.
