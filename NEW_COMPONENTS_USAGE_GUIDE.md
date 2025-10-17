# New Components Usage Guide
**ImmunizeMe Healthcare Management System**

This guide provides examples for implementing the newly created components throughout the application.

---

## 1. SearchableSelect Component

### Basic Usage - Simple String Array

```vue
<template>
  <div class="mb-3">
    <label class="form-label">Disease Prevented *</label>
    <SearchableSelect
      v-model="form.disease_prevented"
      :options="diseaseList"
      placeholder="Search or select disease..."
      :allow-custom="true"
      :required="true"
      @add-custom="handleAddDisease"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'

const diseaseList = ref([
  'Poliomyelitis',
  'Tuberculosis',
  'Hepatitis B',
  'Diphtheria',
  'Tetanus',
  'Pertussis',
  'Measles',
  'Mumps',
  'Rubella',
  'Japanese Encephalitis',
  'Pneumococcal Disease'
])

const form = ref({
  disease_prevented: ''
})

const handleAddDisease = (newDisease) => {
  diseaseList.value.push(newDisease)
  // Optionally save to backend
}
</script>
```

### Advanced Usage - Object Array

```vue
<template>
  <div class="mb-3">
    <label class="form-label">Brand Name *</label>
    <SearchableSelect
      v-model="form.brand_id"
      :options="brands"
      label-key="name"
      value-key="id"
      placeholder="Search brand..."
      :required="true"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'

const brands = ref([
  { id: 1, name: 'Pentaxim', manufacturer: 'Sanofi' },
  { id: 2, name: 'Infanrix', manufacturer: 'GSK' },
  { id: 3, name: 'Engerix-B', manufacturer: 'GSK' }
])

const form = ref({
  brand_id: null
})
</script>
```

### Usage with Guardian Names (Parent Selection)

```vue
<template>
  <div class="mb-3">
    <label class="form-label">Mother's Full Name *</label>
    <SearchableSelect
      v-model="form.mother_name"
      :options="guardianNames"
      placeholder="Search or type mother's name..."
      :allow-custom="true"
      :required="true"
    />
  </div>
  
  <div class="mb-3">
    <label class="form-label">Father's Full Name</label>
    <SearchableSelect
      v-model="form.father_name"
      :options="guardianNames"
      placeholder="Search or type father's name..."
      :allow-custom="true"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'
import api from '@/services/api'

const guardianNames = ref([])

const form = ref({
  mother_name: '',
  father_name: ''
})

onMounted(async () => {
  // Fetch existing guardian names for suggestions
  const response = await api.get('/guardians')
  guardianNames.value = response.data.data.map(g => g.full_name)
})
</script>
```

---

## 2. DateInput Component

### Basic Usage

```vue
<template>
  <div class="mb-3">
    <label class="form-label">Date of Birth *</label>
    <DateInput
      v-model="form.date_of_birth"
      placeholder="MM/DD/YYYY"
      :required="true"
      output-format="iso"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DateInput from '@/components/common/DateInput.vue'

const form = ref({
  date_of_birth: '' // Will receive YYYY-MM-DD format
})
</script>
```

### Usage in Forms with Display Format

```vue
<template>
  <div class="row">
    <div class="col-md-6 mb-3">
      <label class="form-label">Visit Date *</label>
      <DateInput
        v-model="form.visit_date"
        placeholder="MM/DD/YYYY"
        :required="true"
        output-format="display"
      />
    </div>
    
    <div class="col-md-6 mb-3">
      <label class="form-label">Follow-up Date</label>
      <DateInput
        v-model="form.followup_date"
        placeholder="MM/DD/YYYY"
        :required="false"
        output-format="iso"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DateInput from '@/components/common/DateInput.vue'

const form = ref({
  visit_date: '', // Will receive MM/DD/YYYY format
  followup_date: '' // Will receive YYYY-MM-DD format
})
</script>
```

### Usage with Default to Today

```vue
<template>
  <div class="mb-3">
    <label class="form-label">Administration Date *</label>
    <DateInput
      v-model="form.administered_date"
      placeholder="MM/DD/YYYY"
      :required="true"
      :default-today="true"
      output-format="iso"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DateInput from '@/components/common/DateInput.vue'

const form = ref({
  administered_date: '' // Will auto-fill with today's date
})
</script>
```

### Disabled State

```vue
<template>
  <div class="mb-3">
    <label class="form-label">Scheduled Date</label>
    <DateInput
      v-model="schedule.date"
      placeholder="MM/DD/YYYY"
      :disabled="true"
      output-format="iso"
    />
  </div>
</template>
```

---

## 3. Using Confirm Dialog in Components

### Delete Confirmation

```vue
<script setup>
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const { confirm } = useConfirm()
const { addToast } = useToast()

const deleteItem = async (item) => {
  try {
    await confirm({
      title: 'Delete Item',
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })
    
    // User confirmed
    await api.delete(`/items/${item.id}`)
    addToast({ 
      title: 'Deleted', 
      message: 'Item deleted successfully', 
      type: 'success' 
    })
    
    // Refresh list
    await fetchItems()
    
  } catch {
    // User cancelled - no action needed
  }
}
</script>
```

### Warning Confirmation

```vue
<script setup>
import { useConfirm } from '@/composables/useConfirm'

const { confirm } = useConfirm()

const archiveRecord = async (record) => {
  try {
    await confirm({
      title: 'Archive Record',
      message: 'This will move the record to archives. You can restore it later if needed.',
      variant: 'warning',
      confirmText: 'Archive',
      cancelText: 'Cancel'
    })
    
    // Proceed with archiving
    await api.post(`/records/${record.id}/archive`)
    
  } catch {
    // Cancelled
  }
}
</script>
```

### Primary Action Confirmation

```vue
<script setup>
import { useConfirm } from '@/composables/useConfirm'

const { confirm } = useConfirm()

const sendNotification = async () => {
  try {
    await confirm({
      title: 'Send Notifications',
      message: 'This will send SMS notifications to all selected patients. Continue?',
      variant: 'primary',
      confirmText: 'Send',
      cancelText: 'Cancel'
    })
    
    // Proceed with sending
    await api.post('/notifications/send-bulk', { patient_ids: selectedIds.value })
    
  } catch {
    // Cancelled
  }
}
</script>
```

---

## 4. Toast Notifications

Toasts are now globally available through layouts. No need to add ToastContainer to individual pages.

### Basic Toast Usage

```vue
<script setup>
import { useToast } from '@/composables/useToast'

const { addToast } = useToast()

// Success toast
const onSaveSuccess = () => {
  addToast({
    title: 'Success',
    message: 'Record saved successfully',
    type: 'success',
    timeout: 4000 // Optional, defaults to 4000ms
  })
}

// Error toast
const onError = (error) => {
  addToast({
    title: 'Error',
    message: error.message || 'An error occurred',
    type: 'error',
    timeout: 5000
  })
}

// Warning toast
const onValidationWarning = () => {
  addToast({
    title: 'Validation Warning',
    message: 'Please fill in all required fields',
    type: 'warning'
  })
}

// Info toast
const onInfo = () => {
  addToast({
    title: 'Info',
    message: 'Processing your request...',
    type: 'info'
  })
}
</script>
```

---

## 5. Combining Components in Real Forms

### Complete Patient Registration Form Example

```vue
<template>
  <div class="modal fade show" style="display: block;" v-if="showModal">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Add New Patient</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="savePatient">
            
            <!-- Child Information -->
            <h6 class="mb-3">Child Information</h6>
            
            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">First Name *</label>
                <input type="text" class="form-control" v-model="form.firstname" required />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Middle Name</label>
                <input type="text" class="form-control" v-model="form.middlename" />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Surname *</label>
                <input type="text" class="form-control" v-model="form.surname" required />
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Date of Birth *</label>
                <DateInput
                  v-model="form.date_of_birth"
                  placeholder="MM/DD/YYYY"
                  :required="true"
                  output-format="iso"
                />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Sex *</label>
                <select class="form-select" v-model="form.sex" required>
                  <option value="">Select sex</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
            </div>
            
            <!-- Guardian Information -->
            <h6 class="mb-3 mt-4">Guardian Information</h6>
            
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Mother's Full Name *</label>
                <SearchableSelect
                  v-model="form.mother_name"
                  :options="guardianNames"
                  placeholder="Search or type name..."
                  :allow-custom="true"
                  :required="true"
                />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Mother's Occupation</label>
                <SearchableSelect
                  v-model="form.mother_occupation"
                  :options="commonOccupations"
                  placeholder="Search or type occupation..."
                  :allow-custom="true"
                />
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Father's Full Name</label>
                <SearchableSelect
                  v-model="form.father_name"
                  :options="guardianNames"
                  placeholder="Search or type name..."
                  :allow-custom="true"
                />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Father's Occupation</label>
                <SearchableSelect
                  v-model="form.father_occupation"
                  :options="commonOccupations"
                  placeholder="Search or type occupation..."
                  :allow-custom="true"
                />
              </div>
            </div>
            
            <!-- Address -->
            <h6 class="mb-3 mt-4">Address Information</h6>
            
            <div class="mb-3">
              <label class="form-label">Complete Address *</label>
              <textarea class="form-control" v-model="form.address" rows="2" required></textarea>
            </div>
            
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Barangay *</label>
                <SearchableSelect
                  v-model="form.barangay"
                  :options="barangayList"
                  placeholder="Select barangay..."
                  :required="true"
                />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Health Center</label>
                <SearchableSelect
                  v-model="form.health_center"
                  :options="healthCenters"
                  placeholder="Select health center..."
                />
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span v-if="saving">Saving...</span>
                <span v-else>Save Patient</span>
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'
import DateInput from '@/components/common/DateInput.vue'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const { addToast } = useToast()

const showModal = ref(false)
const saving = ref(false)

const form = ref({
  firstname: '',
  middlename: '',
  surname: '',
  date_of_birth: '',
  sex: '',
  mother_name: '',
  mother_occupation: '',
  father_name: '',
  father_occupation: '',
  address: '',
  barangay: '',
  health_center: ''
})

const guardianNames = ref([])
const commonOccupations = ref([
  'Housewife',
  'Farmer',
  'Driver',
  'Teacher',
  'Nurse',
  'Vendor',
  'OFW',
  'Business Owner',
  'Government Employee',
  'Private Employee'
])

const barangayList = ref([
  'Barangay 1',
  'Barangay 2',
  // ... more barangays
])

const healthCenters = ref([
  'Main Health Center',
  'Rural Health Unit 1',
  // ... more centers
])

onMounted(async () => {
  // Load guardian names for suggestions
  const response = await api.get('/guardians')
  guardianNames.value = response.data.data.map(g => g.full_name)
})

const savePatient = async () => {
  try {
    saving.value = true
    await api.post('/patients', form.value)
    
    addToast({
      title: 'Success',
      message: 'Patient record created successfully',
      type: 'success'
    })
    
    closeModal()
    // Refresh patient list
    
  } catch (error) {
    addToast({
      title: 'Error',
      message: error.response?.data?.message || 'Failed to save patient',
      type: 'error'
    })
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  // Reset form
  Object.keys(form.value).forEach(key => {
    form.value[key] = ''
  })
}
</script>
```

---

## 6. Migration Checklist

### For Each Form That Needs Update:

#### Date Fields
- [ ] Replace `<input type="date">` with `<DateInput>`
- [ ] Add `output-format="iso"` if backend expects YYYY-MM-DD
- [ ] Add `output-format="display"` if storing MM/DD/YYYY
- [ ] Update `v-model` bindings
- [ ] Test date formatting and validation

#### Dropdown Fields
- [ ] Replace `<select>` with `<SearchableSelect>` for:
  - Disease Prevented
  - Antigen Names
  - Brand Names
  - Manufacturers
  - Storage Locations
  - Guardian Names (Mother/Father)
  - Occupations
  - Barangays
  - Any other dropdown that would benefit from search
- [ ] Add `:allow-custom="true"` where users should add new values
- [ ] Add `@add-custom` handler to save new values
- [ ] Update `v-model` bindings
- [ ] Test search and selection

#### Confirmation Dialogs
- [ ] Replace `if (confirm(...))` with `await confirm({...})`
- [ ] Import `useConfirm` composable
- [ ] Wrap in try-catch block
- [ ] Add appropriate `variant` (danger, warning, primary)
- [ ] Test cancellation and confirmation

#### Toast Notifications
- [ ] Ensure `useToast` is imported
- [ ] Replace `alert()` with `addToast()`
- [ ] Add appropriate toast `type` (success, error, warning, info)
- [ ] Test toast appearance and dismissal

---

## Notes

- All components are fully responsive
- All components follow Bootstrap 5 styling
- All components support disabled and required states
- SearchableSelect limits to 50 visible options for performance
- DateInput validates dates (no invalid dates like Feb 30)
- Confirm dialogs are promise-based for clean async/await usage
- Toast notifications auto-dismiss after timeout (default 4 seconds)
