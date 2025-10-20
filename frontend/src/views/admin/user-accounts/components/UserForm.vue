<template>
  <form @submit.prevent="handleSubmit">
    <!-- Personal Information -->
    <div class="mb-4">
      <h6 class="text-primary fw-bold mb-3">
        <i class="bi bi-person-fill me-2"></i>Personal Information
      </h6>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">First Name <span class="text-danger">*</span></label>
          <input 
            type="text" 
            class="form-control" 
            v-model="localForm.firstName" 
            :readonly="readOnly"
            required
          >
        </div>
        <div class="col-md-4">
          <label class="form-label">Middle Name</label>
          <input 
            type="text" 
            class="form-control" 
            v-model="localForm.middleName"
            :readonly="readOnly"
          >
        </div>
        <div class="col-md-4">
          <label class="form-label">Last Name <span class="text-danger">*</span></label>
          <input 
            type="text" 
            class="form-control" 
            v-model="localForm.lastName"
            :readonly="readOnly"
            required
          >
        </div>
      </div>
      
      <div class="row g-3 mt-1">
        <div class="col-md-3">
          <label class="form-label">Sex <span class="text-danger">*</span></label>
          <select 
            class="form-select" 
            v-model="localForm.sex"
            :disabled="readOnly"
            required
          >
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
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
            type="text" 
            class="form-control" 
            v-model="localForm.address"
            :readonly="readOnly"
            placeholder="House/Street, Barangay, City/Municipality, Province"
          >
        </div>
      </div>
    </div>

    <!-- Account Information -->
    <div class="mb-4">
      <h6 class="text-primary fw-bold mb-3">
        <i class="bi bi-envelope me-2"></i>Account Information
      </h6>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Email Address <span class="text-danger">*</span></label>
          <input 
            type="email" 
            class="form-control" 
            v-model="localForm.email"
            :readonly="readOnly"
            required
          >
        </div>
        <div class="col-md-3" v-if="!isEditing && !readOnly">
          <label class="form-label">Password <span class="text-danger">*</span></label>
          <input 
            type="password" 
            class="form-control" 
            v-model="localForm.password"
            required
          >
        </div>
        <div class="col-md-3">
          <label class="form-label">Status</label>
          <select 
            class="form-select" 
            v-model="localForm.status"
            :disabled="readOnly"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Role & Professional Information -->
    <div class="mb-4">
      <h6 class="text-primary fw-bold mb-3">
        <i class="bi bi-briefcase me-2"></i>Role & Professional Information
      </h6>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Role <span class="text-danger">*</span></label>
          <select 
            class="form-select" 
            v-model="localForm.role"
            :disabled="readOnly"
            required
          >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="health_staff">Health Staff</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        <div class="col-md-4" v-if="localForm.role === 'health_staff'">
          <label class="form-label">Health Staff Type <span class="text-danger">*</span></label>
          <select 
            class="form-select" 
            v-model="localForm.hsType"
            :disabled="readOnly"
            required
          >
            <option value="">Select Type</option>
            <option value="nurse">Nurse</option>
            <option value="nutritionist">Nutritionist</option>
            <option value="bhs">Barangay Health Staff</option>
          </select>
        </div>
        <div class="col-md-4" v-if="localForm.role === 'health_staff' || localForm.role === 'admin'">
          <label class="form-label">Employee ID</label>
          <input 
            type="text" 
            class="form-control" 
            v-model="localForm.employeeId"
            :readonly="readOnly"
          >
        </div>
      </div>
      
      <div class="row g-3 mt-1">
  <div class="col-md-6" v-if="(localForm.role === 'health_staff' && ['nurse','nutritionist'].includes(localForm.hsType)) || localForm.role === 'admin'">
          <label class="form-label">PRC License Number</label>
          <input 
            type="text" 
            class="form-control" 
            v-model="localForm.licenseNumber"
            :readonly="readOnly"
          >
        </div>
        <div class="col-md-6">
          <label class="form-label">Contact Number</label>
          <input 
            type="tel" 
            class="form-control" 
            v-model="localForm.contactNumber"
            :readonly="readOnly"
            placeholder="+63 XXX XXX XXXX"
          >
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="d-flex justify-content-end gap-2" v-if="!readOnly">
      <button type="button" class="btn btn-secondary" @click="handleCancel">
        <i class="bi bi-x-circle me-2"></i>Cancel
      </button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        <span v-if="submitting">
          <span class="spinner-border spinner-border-sm me-2"></span>
          {{ submitLabel || (isEditing ? 'Updating...' : 'Creating...') }}
        </span>
        <span v-else>
          <i class="bi bi-check-circle me-2"></i>
          {{ submitLabel || (isEditing ? 'Update User' : 'Create User') }}
        </span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'
import DateInput from '@/components/common/DateInput.vue'

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
</script>

<style scoped>
.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.text-danger {
  color: #dc3545 !important;
}
</style>
