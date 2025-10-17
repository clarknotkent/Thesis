# REMAINING WORK - QUICK REFERENCE

## ✅ COMPLETED (Ready to Use)

1. **Toast System** - Globally available in all layouts
2. **Confirm Dialog System** - Modal-based confirmations
3. **DateInput Component** - MM/DD/YYYY auto-formatting with calendar
4. **SearchableSelect Component** - Searchable dropdowns with custom values
5. **Partial Confirm Dialog Implementation**:
   - VisitEditor.vue
   - VaccinationRecordEditor.vue
   - PatientRecords.vue (both healthworker and admin)

---

## 🚧 TODO - PRIORITY ORDER

### HIGH PRIORITY (User-Facing Issues)

#### 1. Complete Confirm Dialog Replacement
**Remaining Files:**
```
- frontend/src/views/admin/inventory/VaccineInventory.vue (line 1763)
- frontend/src/views/admin/sms/SMSLogs.vue (lines 532, 549)
- frontend/src/views/admin/settings/Settings.vue (line 764)
- frontend/src/views/admin/reports-analytics/Reports.vue (line 1042)
- frontend/src/views/admin/notifications/NotificationsInbox.vue (line 242)
- frontend/src/components/common/ScheduleEditor.vue (line 309)
```

**Pattern to Follow:**
```javascript
// OLD:
if (confirm('Are you sure?')) {
  // do action
}

// NEW:
import { useConfirm } from '@/composables/useConfirm'
const { confirm } = useConfirm()

try {
  await confirm({
    title: 'Confirm Action',
    message: 'Are you sure?',
    variant: 'danger',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  })
  // do action
} catch {
  // cancelled
}
```

#### 2. Fix Visit Edit Immediate Save Issue
**File:** `frontend/src/components/common/VisitEditor.vue`

**Problem:** Clicking "Edit" immediately saves the entire record

**Solution Needed:**
- Add separate `editMode` state
- Disable auto-save on edit button click
- Show explicit "Save Changes" button
- Allow cancel to revert changes

#### 3. Apply DateInput Throughout Application
**Files to Update:**

All forms with date fields, including:
- Patient registration forms (DOB, birth history dates)
- Vaccination record forms (administration date)
- Visit record forms (visit date)
- Inventory forms (expiration date, receipt date)
- Report filters (date range pickers)
- Dashboard filters

**Pattern:**
```vue
<!-- OLD -->
<input type="date" v-model="form.date" />

<!-- NEW -->
<DateInput 
  v-model="form.date" 
  output-format="iso"
  :required="true"
/>
```

#### 4. Apply SearchableSelect to All Dropdowns
**Fields to Update:**

- Disease Prevented (vaccine-related forms)
- Antigen Name (vaccine forms)
- Brand Name (vaccine forms, inventory)
- Manufacturer (inventory forms)
- Storage Location (inventory forms)
- Mother Name (patient forms)
- Father Name (patient forms)
- Occupation (patient forms)
- Barangay (patient forms, filters)
- Health Center (patient forms, filters)
- Vaccine Type (filters)

**Pattern:**
```vue
<!-- OLD -->
<select v-model="form.disease">
  <option v-for="d in diseases" :value="d">{{ d }}</option>
</select>

<!-- NEW -->
<SearchableSelect 
  v-model="form.disease"
  :options="diseases"
  :allow-custom="true"
  @add-custom="handleAddDisease"
/>
```

---

### MEDIUM PRIORITY (Functional Improvements)

#### 5. Implement Smart Dose Dropdown
**Files:** `VaccinationRecordEditor.vue`, `VisitEditor.vue`

**Requirements:**
- Fetch doses from `schedule_doses` table
- Filter by selected vaccine/antigen
- Show "Dose 1", "Dose 2", etc.
- Handle case when no history exists (allow all doses)
- Handle case when history exists (show next expected dose)

**Backend Endpoint Needed:**
```javascript
GET /vaccines/{vaccine_id}/doses
// Returns: [{ dose_number: 1, label: 'Dose 1' }, ...]

GET /patients/{patient_id}/vaccines/{vaccine_id}/next-dose
// Returns: { next_dose_number: 2, label: 'Dose 2' }
```

#### 6. Implement/Fix Deworm & Vitamin A Features
**Status:** Semi-finished, needs completion

**Files to Check:**
- `VisitEditor.vue` - Has buttons for Deworm and Vitamin A
- Backend endpoints for deworming and vitamin A records

**Requirements:**
- Create modal for Deworm record entry
- Create modal for Vitamin A record entry
- Similar to vaccination record flow
- Fields: date, type, dosage, notes

---

### LOW PRIORITY (Enhancement)

#### 7. Field Pre-filling/Auto-population
**Requirement:** "Make sure that all fields are well-mapped (must prefill/occupy/populate necessary fields)"

**Areas to Check:**
- Edit forms should prefill with existing data
- Related fields should auto-populate (e.g., selecting inventory should fill antigen, brand)
- Guardian selection should prefill contact info

#### 8. Dashboard Functionality
**Requirement:** "Make the Dashboard work"

**Check:**
- Admin dashboard statistics
- HealthWorker dashboard
- Parent dashboard
- Ensure all charts and data display correctly

#### 9. Guardian Profile Editing
**Requirement:** "In Guardian UI, Guardians can edit their profile (include occupation and alt phone number)"

**File:** Parent/Guardian profile view
**Add Fields:**
- Occupation
- Alternate phone number

#### 10. View Visit Enhancement
**Requirement:** "View Visit Should Include Whether Transaction was Outside or Not"

**Add to Visit Display:**
- `is_outside` flag/badge
- Show location if outside service

#### 11. Edit Inventory Details Fix
**Requirement:** "Edit Inventory Details should already prefill all fields and the antigen and brand name must be readonly"

**File:** Inventory edit modal
**Changes:**
- Ensure all fields prefill
- Make antigen name readonly
- Make brand name readonly

#### 12. Inventory Restoration Feature
**Requirement:** "Once Inventory Stock is deleted, should I be able to restore it?"

**Decision Needed:** 
- Implement soft delete with restore functionality?
- OR permanently delete without restore?

---

## QUICK WIN CHECKLIST (Do These First)

1. [ ] Replace 6 remaining `confirm()` calls (30 minutes)
2. [ ] Update VaccineInventory.vue with DateInput for expiration dates (15 minutes)
3. [ ] Update patient forms with SearchableSelect for guardian names (20 minutes)
4. [ ] Test all toast notifications work in all layouts (10 minutes)
5. [ ] Test confirm dialogs work in all updated files (15 minutes)

**Total Time Estimate:** ~1.5 hours for quick wins

---

## FILE-BY-FILE TRACKING

### Confirm Dialog Status:
- ✅ `VisitEditor.vue` (removeService)
- ✅ `VaccinationRecordEditor.vue` (deleteVaccinationRecord)
- ✅ `PatientRecords.vue` - HealthWorker (deletePatient)
- ✅ `PatientRecords.vue` - Admin (deletePatient)
- ⏳ `VaccineInventory.vue` - deleteVaccine
- ⏳ `SMSLogs.vue` - resend, delete SMS
- ⏳ `Settings.vue` - reset settings
- ⏳ `Reports.vue` - delete report
- ⏳ `NotificationsInbox.vue` - delete notification
- ⏳ `ScheduleEditor.vue` - schedule action

### DateInput Status:
- ⏳ All patient forms
- ⏳ All vaccination forms
- ⏳ All inventory forms
- ⏳ All report filters
- ⏳ Dashboard filters

### SearchableSelect Status:
- ⏳ Disease Prevented fields
- ⏳ Antigen Name fields
- ⏳ Brand Name fields
- ⏳ Manufacturer fields
- ⏳ Storage Location fields
- ⏳ Guardian name fields (Mother/Father)
- ⏳ Occupation fields
- ⏳ Barangay fields

---

## TESTING NOTES

After implementing each component:
1. Test in Chrome/Edge
2. Test in Firefox
3. Test on mobile viewport
4. Test keyboard navigation
5. Test with screen reader (accessibility)
6. Test error states
7. Test validation
8. Test with existing data
9. Test with empty/new data

---

## DEPLOYMENT CHECKLIST

Before deploying to production:
- [ ] All confirm() replaced with confirm dialog
- [ ] All date inputs use DateInput component
- [ ] Critical dropdowns use SearchableSelect
- [ ] All toasts working
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessibility tested
- [ ] Performance tested
- [ ] Cross-browser tested
