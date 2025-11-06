<template>
  <form @submit.prevent="handleSubmit">
    <!-- Personal Information -->
    <div class="mb-4">
      <h6 class="text-primary fw-bold mb-3">
        <i class="bi bi-person-fill me-2" />Personal Information
      </h6>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">First Name <span class="text-danger">*</span></label>
          <input 
            v-model="localForm.firstName" 
            type="text" 
            class="form-control" 
            :readonly="readOnly"
            required
          >
        </div>
        <div class="col-md-4">
          <label class="form-label">Middle Name</label>
          <input 
            v-model="localForm.middleName" 
            type="text" 
            class="form-control"
            :readonly="readOnly"
          >
        </div>
        <div class="col-md-4">
          <label class="form-label">Last Name <span class="text-danger">*</span></label>
          <input 
            v-model="localForm.lastName" 
            type="text" 
            class="form-control"
            :readonly="readOnly"
            required
          >
        </div>
      </div>
      
      <div class="row g-3 mt-1">
        <div class="col-md-3">
          <label class="form-label">Sex <span class="text-danger">*</span></label>
          <select 
            v-model="localForm.sex" 
            class="form-select"
            :disabled="readOnly"
            required
          >
            <option value="">
              Select Sex
            </option>
            <option value="Male">
              Male
            </option>
            <option value="Female">
              Female
            </option>
            <option value="Other">
              Other
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Birthdate</label>
          <DateInput 
            v-model="localForm.birthdate"
            :readonly="readOnly"
          />
        </div>
        <div class="col-md-6">
          <label class="form-label">Address</label>
          <input 
            v-model="localForm.address" 
            type="text" 
            class="form-control"
            :readonly="readOnly"
            :class="{
              'placeholder-address': readOnly && (localForm.address || '').toLowerCase() === 'address not given'
            }"
            placeholder="House/Street, Barangay, City/Municipality, Province"
          >
        </div>
      </div>
    </div>

    <!-- Account Information -->
    <div class="mb-4">
      <h6 class="text-primary fw-bold mb-3">
        <i class="bi bi-envelope me-2" />Account Information
      </h6>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Email Address <span class="text-danger">*</span></label>
          <input 
            v-model="localForm.email" 
            type="email" 
            class="form-control"
            :readonly="readOnly"
            required
          >
        </div>
        <div
          v-if="!isEditing && !readOnly"
          class="col-md-3"
        >
          <label class="form-label">Password <span class="text-danger">*</span></label>
          <input 
            v-model="localForm.password" 
            type="password" 
            class="form-control"
            required
          >
        </div>
        <div class="col-md-3">
          <label class="form-label">Status</label>
          <select 
            v-model="localForm.status" 
            class="form-select"
            :disabled="readOnly"
          >
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Role & Professional Information -->
    <div class="mb-4">
      <h6 class="text-primary fw-bold mb-3">
        <i class="bi bi-briefcase me-2" />Role & Professional Information
      </h6>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Role <span class="text-danger">*</span></label>
          <select 
            v-model="localForm.role" 
            class="form-select"
            :disabled="readOnly"
            required
          >
            <option value="">
              Select Role
            </option>
            <option value="admin">
              Admin
            </option>
            <option value="health_staff">
              Health Staff
            </option>
            <option value="parent">
              Parent
            </option>
          </select>
        </div>
        <div
          v-if="localForm.role === 'health_staff'"
          class="col-md-4"
        >
          <label class="form-label">Health Staff Type <span class="text-danger">*</span></label>
          <select 
            v-model="localForm.hsType" 
            class="form-select"
            :disabled="readOnly"
            required
          >
            <option value="">
              Select Type
            </option>
            <option value="nurse">
              Nurse
            </option>
            <option value="nutritionist">
              Nutritionist
            </option>
            <option value="bhs">
              Barangay Health Staff
            </option>
          </select>
        </div>
        <div
          v-if="localForm.role === 'health_staff' || localForm.role === 'admin'"
          class="col-md-4"
        >
          <label class="form-label">Employee ID</label>
          <input 
            v-model="localForm.employeeId" 
            type="text" 
            class="form-control"
            :readonly="readOnly"
          >
        </div>
      </div>
      
      <div class="row g-3 mt-1">
        <div
          v-if="(localForm.role === 'health_staff' && ['nurse','nutritionist'].includes(localForm.hsType)) || localForm.role === 'admin'"
          class="col-md-6"
        >
          <label class="form-label">PRC License Number</label>
          <input 
            v-model="localForm.licenseNumber" 
            type="text" 
            class="form-control"
            :readonly="readOnly"
          >
        </div>
        <div class="col-md-6">
          <label class="form-label">Contact Number</label>
          <input 
            v-model="localForm.contactNumber" 
            type="tel" 
            class="form-control"
            :readonly="readOnly"
            placeholder="+639**-***-****"
            @focus="ensureContactPrefix"
            @input="onContactInput"
          >
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div
      v-if="!readOnly"
      class="d-flex justify-content-end gap-2"
    >
      <button
        type="button"
        class="btn btn-secondary"
        @click="handleCancel"
      >
        <i class="bi bi-x-circle me-2" />Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="submitting"
      >
        <span v-if="submitting">
          <span class="spinner-border spinner-border-sm me-2" />
          {{ submitLabel || (isEditing ? 'Updating...' : 'Creating...') }}
        </span>
        <span v-else>
          <i class="bi bi-check-circle me-2" />
          {{ submitLabel || (isEditing ? 'Update User' : 'Create User') }}
        </span>
      </button>
    </div>
    <QueuedHint class="mt-2" />
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'
import DateInput from '@/components/ui/form/DateInput.vue'
import QueuedHint from '@/components/ui/feedback/QueuedHint.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  submitting: {
    type: Boolean,
    default: false
  },
  submitLabel: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit', 'cancel'])

const localForm = ref({
  id: '',
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  role: '',
  hsType: '',
  status: 'active',
  password: '',
  licenseNumber: '',
  employeeId: '',
  contactNumber: '',
  sex: '',
  birthdate: '',
  address: ''
})

// Watch for initial data changes (when editing)
// Normalize incoming role tokens to the form's option values
const normalizeRole = (r) => {
  if (!r) return ''
  const s = String(r).toLowerCase().trim()
  if (s === 'admin' || s === 'administrator') return 'admin'
  if (s === 'parent' || s === 'guardian') return 'parent'
  if (s === 'health_worker' || s === 'healthworker' || s === 'health staff' || s === 'healthstaff' || s === 'health-staff') return 'health_staff'
  return r
}

watch(() => props.initialData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    const merged = { ...localForm.value, ...newData }
    // normalize role value so select options prefill correctly
    merged.role = normalizeRole(merged.role)
    // also normalize hsType keys to lower-case tokens
    if (merged.hsType) merged.hsType = String(merged.hsType).toLowerCase()
    localForm.value = merged
  }
}, { immediate: true, deep: true })

const handleSubmit = () => {
  emit('submit', localForm.value)
}

const handleCancel = () => {
  emit('cancel')
}

// Contact number formatting: enforce +639**-***-****
const ensureContactPrefix = () => {
  if (!localForm.value.contactNumber || localForm.value.contactNumber.trim() === '') {
    localForm.value.contactNumber = '+639'
  }
}

const formatMaskedContact = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  // Force base prefix '639'
  let rest = digits
  if (rest.startsWith('639')) {
    rest = rest.slice(3)
  } else {
    // Strip potential leading 63/09/9 and normalize
    if (rest.startsWith('63')) rest = rest.slice(2)
    if (rest.startsWith('0')) rest = rest.slice(1)
    if (rest.startsWith('9')) rest = rest.slice(1)
  }
  // Limit to 9 digits
  rest = rest.slice(0, 9)
  const p1 = rest.slice(0, 2)
  const p2 = rest.slice(2, 5)
  const p3 = rest.slice(5, 9)
  let out = '+639'
  if (p1) out += p1
  if (p2) out += '-' + p2
  if (p3) out += '-' + p3
  return out
}

const onContactInput = (e) => {
  const formatted = formatMaskedContact(e.target.value)
  localForm.value.contactNumber = formatted
}

// Normalize incoming contact number on initial load
watch(() => localForm.value.contactNumber, (val, _oldVal) => {
  // If readOnly, don't reformat to avoid flicker; otherwise keep mask
  if (!props.readOnly) {
    const formatted = formatMaskedContact(val)
    if (formatted !== val) {
      localForm.value.contactNumber = formatted
    }
  }
}, { immediate: true })
</script>

<style scoped>
.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.text-danger {
  color: #dc3545 !important;
}

.placeholder-address {
  font-style: italic;
  color: #6c757d !important; /* Bootstrap secondary text */
}
</style>
