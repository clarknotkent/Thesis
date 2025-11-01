# AddPatientImmunizationRecord.vue Refactoring Plan

## Current Status
- **File Size:** 1,615 lines
- **Status:** ❌ NOT using available composables
- **All logic:** Inline in the component

## Available Resources ✅

### Composables (Already Created):
- ✅ `usePatientImmunizationForm.js` - Form state, patient loading, service management
- ✅ `useVaccineSelection.js` - Vaccine selection, inventory/catalog, search
- ✅ `useVisitManagement.js` - Visit CRUD, selection, vitals prefilling

### Components (Already Created):
- ✅ `CollapsibleCard.vue`
- ✅ `PatientInfoCard.vue`
- ✅ `VaccinationHistoryCard.vue`
- ✅ Various other cards and UI components

## Refactoring Strategy

### Step 1: Replace Inline Logic with Composables
**Target: Reduce from 1,615 → ~400 lines**

#### Current Inline Code to Replace:

1. **Lines 441-456:** User context & role logic
   - Replace with: `usePatientImmunizationForm(patientId)`
   
2. **Lines 458-465:** Visit management state
   - Replace with: `useVisitManagement(formData)`
   
3. **Lines 467-512:** Vaccine selection state & computed
   - Replace with: `useVaccineSelection()`

4. **Lines 514-524:** Form data state
   - Already handled by `usePatientImmunizationForm`

5. **Lines 540-580:** Patient fetching functions
   - Already in `usePatientImmunizationForm.fetchPatients()`

6. **Lines 590-620:** Visit loading functions
   - Already in `useVisitManagement.loadVisitsForPatient()`

7. **Lines 650-750:** Vaccine inventory/catalog fetching
   - Already in `useVaccineSelection.fetchVaccineInventory()`

8. **Lines 800-900:** Service add/edit/remove logic
   - Already in `usePatientImmunizationForm.addService()` etc.

9. **Lines 1000-1200:** Smart dose detection
   - Can be added to `useVaccineSelection` or kept in view

10. **Lines 1300-1500:** Form submission logic
    - Can use `usePatientImmunizationForm.prepareSubmissionData()`

### Step 2: Extract Missing UI Components

Components to create:

1. **VitalsFormSection.vue** (~100 lines)
   ```vue
   <template>
     <div class="form-section" v-if="!hideVitals">
       <h3>Vital Signs</h3>
       <!-- Temperature, MUAC, Respiration, Weight, Height inputs -->
     </div>
   </template>
   ```

2. **VisitSelectorSection.vue** (~120 lines)
   ```vue
   <template>
     <div class="form-section" v-if="isNurseOrNutritionist">
       <h3>Visit</h3>
       <!-- New/Existing radio buttons -->
       <!-- Existing visits dropdown -->
     </div>
   </template>
   ```

3. **VaccineServiceFormModal.vue** (~300 lines)
   ```vue
   <template>
     <div v-if="show" class="modal">
       <!-- Vaccine search/selection -->
       <!-- Dose number, date, site, etc. -->
       <!-- Deworming fields -->
       <!-- Vitamin A fields -->
     </div>
   </template>
   ```

4. **ServicesListSection.vue** (~150 lines)
   ```vue
   <template>
     <div class="services-list">
       <!-- Display added services -->
       <!-- Edit/Delete actions -->
     </div>
   </template>
   ```

### Step 3: Refactor Main View File

**New structure (~400 lines):**

```vue
<template>
  <HealthWorkerLayout :show-controls="false">
    <!-- Header -->
    <div class="add-record-header-section">
      <div class="header-bar">
        <button class="back-button" @click="goBack">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h1 class="page-title">Add Immunization Record</h1>
      </div>
    </div>

    <!-- Page Content -->
    <div class="page-content-wrapper">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading form data...</p>
      </div>

      <!-- Form Content -->
      <form v-else @submit.prevent="handleSubmit" class="record-form">
        <!-- Patient Info Display (Read-only) -->
        <PatientInfoCard 
          v-if="currentPatient"
          :patient="currentPatient"
        />

        <!-- Visit Selection (Nurse/Nutritionist only) -->
        <VisitSelectorSection
          v-if="isNurseOrNutritionist"
          v-model:visit-mode="visitMode"
          v-model:existing-visit-id="existingVisitId"
          :available-visits="availableVisits"
          @ensure-visits-loaded="ensureVisitsLoaded"
        />

        <!-- Vital Signs -->
        <VitalsFormSection
          v-if="!hideVitals"
          v-model="formData.vitals"
          :readonly="vitalsReadOnly"
        />

        <!-- Services Section -->
        <div class="form-section">
          <h3>Services</h3>
          <button type="button" @click="showServiceForm = true">
            Add Service
          </button>
          
          <ServicesListSection
            :services="addedServices"
            @edit="editService"
            @remove="removeService"
          />
        </div>

        <!-- Findings & Remarks -->
        <div class="form-section">
          <label>Findings</label>
          <textarea v-model="formData.findings"></textarea>
        </div>

        <!-- Submit Button -->
        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Saving...' : 'Save Record' }}
        </button>
      </form>
    </div>

    <!-- Service Form Modal -->
    <VaccineServiceFormModal
      v-model:show="showServiceForm"
      :editing-index="editingServiceIndex"
      :current-patient="currentPatient"
      @save="addService"
    />
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import PatientInfoCard from '@/features/health-worker/patients/components/PatientInfoCard.vue'
import { usePatientImmunizationForm } from '@/features/health-worker/patients/composables'
import { useVaccineSelection } from '@/features/health-worker/patients/composables'
import { useVisitManagement } from '@/features/health-worker/patients/composables'
import { addToast } from '@/composables/useToast'
import api from '@/services/api'

// Components (to be created)
import VisitSelectorSection from '@/features/health-worker/patients/components/VisitSelectorSection.vue'
import VitalsFormSection from '@/features/health-worker/patients/components/VitalsFormSection.vue'
import ServicesListSection from '@/features/health-worker/patients/components/ServicesListSection.vue'
import VaccineServiceFormModal from '@/features/health-worker/patients/components/VaccineServiceFormModal.vue'

const router = useRouter()
const route = useRoute()

// Use composables
const {
  loading,
  submitting,
  currentPatient,
  formData,
  showServiceForm,
  addedServices,
  editingServiceIndex,
  isBHS,
  isNurseOrNutritionist,
  fetchCurrentPatient,
  addService,
  editService,
  removeService,
  validateForm,
  prepareSubmissionData
} = usePatientImmunizationForm(route.params.patientId)

const {
  visitMode,
  availableVisits,
  existingVisitId,
  vitalsReadOnly,
  hideVitals,
  loadVisitsForPatient,
  ensureVisitsLoaded,
  setupVisitWatcher
} = useVisitManagement(formData)

const {
  fetchVaccineInventory,
  fetchVaccineCatalog
} = useVaccineSelection()

// Initialize
onMounted(async () => {
  await fetchCurrentPatient()
  if (isNurseOrNutritionist.value) {
    await loadVisitsForPatient(route.params.patientId)
    setupVisitWatcher()
  }
  await fetchVaccineInventory()
  await fetchVaccineCatalog()
})

const goBack = () => {
  router.back()
}

const handleSubmit = async () => {
  const errors = validateForm()
  if (errors.length > 0) {
    errors.forEach(err => addToast({ title: 'Validation Error', message: err, type: 'error' }))
    return
  }

  try {
    submitting.value = true
    
    // Create or attach to visit based on mode
    let visitId = null
    if (isNurseOrNutritionist.value && visitMode.value === 'existing') {
      visitId = existingVisitId.value
    } else if (isBHS.value || visitMode.value === 'new') {
      const visitResponse = await api.post('/visits', {
        patient_id: formData.value.patient_id,
        visit_date: new Date().toISOString().split('T')[0],
        vitals: formData.value.vitals,
        findings: formData.value.findings,
        service_rendered: formData.value.service_rendered
      })
      visitId = visitResponse.data.visit_id
    }

    // Submit immunization records
    const submissionData = prepareSubmissionData(visitId)
    await api.post('/immunizations/batch', submissionData)

    addToast({ 
      title: 'Success', 
      message: 'Immunization record saved successfully!', 
      type: 'success' 
    })

    router.back()
  } catch (error) {
    console.error('Error saving immunization record:', error)
    addToast({ 
      title: 'Error', 
      message: 'Failed to save immunization record.', 
      type: 'error' 
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* Styles remain the same */
</style>
```

## Expected Results

### Before:
```
AddPatientImmunizationRecord.vue: 1,615 lines
├── Template: 429 lines
├── Script: 1,180 lines  ← All inline logic
└── Styles: 200 lines
```

### After:
```
AddPatientImmunizationRecord.vue: ~400 lines
├── Template: 150 lines  ← Simplified with components
├── Script: 100 lines    ← Just composable setup & submit logic
└── Styles: 150 lines

+ VisitSelectorSection.vue: ~120 lines
+ VitalsFormSection.vue: ~100 lines
+ ServicesListSection.vue: ~150 lines
+ VaccineServiceFormModal.vue: ~300 lines

Total: ~1,070 lines (but much more maintainable!)
```

## Benefits

1. **Reusable Logic:** Composables can be used in other forms
2. **Testable:** Each composable can be unit tested independently
3. **Maintainable:** Smaller, focused files
4. **Consistent:** Same patterns across all forms
5. **DRY:** No duplicate code

## Implementation Order

1. ✅ **Composables already exist** - No work needed!
2. 🔨 **Create missing UI components** (4 components)
3. 🔨 **Refactor main view file** to use composables + components
4. ✅ **Test thoroughly**
5. ✅ **Apply same pattern** to EditVaccinationRecord.vue

## Next Steps

**Do you want me to:**
1. Create the 4 missing UI components?
2. Refactor the main AddPatientImmunizationRecord.vue file?
3. Both?

This will reduce the file from 1,615 → ~400 lines while improving maintainability!
