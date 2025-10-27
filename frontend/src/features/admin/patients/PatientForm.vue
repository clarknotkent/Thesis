<template>
  <form @submit.prevent="handleSubmit">
    <!-- Patient Basic Information -->
    <div class="row mb-4">
      <div class="col-12">
        <h6 class="text-primary fw-bold mb-3">
          <i class="bi bi-person-fill me-2"></i>Patient Information
        </h6>
        <div class="row g-4">
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">First Name: <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              v-model="formData.firstname" 
              :disabled="readOnly"
              required
            >
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Middle Name:</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="formData.middlename"
              :disabled="readOnly"
            >
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Surname: <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              v-model="formData.surname" 
              :disabled="readOnly"
              required
            >
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Sex: <span class="text-danger">*</span></label>
            <select 
              class="form-select" 
              v-model="formData.sex" 
              :disabled="readOnly"
              required
            >
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Date of Birth: <span class="text-danger">*</span></label>
            <DateInput 
              v-model="formData.date_of_birth"
              :disabled="readOnly"
              :required="true"
              output-format="iso"
            />
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Barangay: <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              v-model="formData.barangay"
              :disabled="readOnly"
              required
            >
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Health Center: <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              v-model="formData.health_center"
              :disabled="readOnly"
              required
            >
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Address: <span class="text-danger">*</span></label>
            <textarea 
              class="form-control" 
              rows="2" 
              v-model="formData.address"
              :disabled="readOnly"
              required
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- Guardian & Family Information -->
    <div class="row mb-4">
      <div class="col-12">
        <h6 class="text-primary fw-bold mb-3">
          <i class="bi bi-people-fill me-2"></i>Guardian & Family Information
        </h6>
        <div class="row g-4">
          <div class="col-xl-4 col-lg-6 col-md-6">
            <label class="form-label">Guardian: <span class="text-danger">*</span></label>
            <GuardianSelector
              v-model="formData.guardian_id"
              :guardians="guardians"
              :disabled="readOnly"
              :required="true"
              @guardian-selected="onGuardianSelected"
            />
          </div>
          <div class="col-xl-4 col-lg-6 col-md-6">
            <label class="form-label">Relationship to Guardian: <span class="text-danger">*</span></label>
            <select 
              class="form-select" 
              v-model="formData.relationship_to_guardian"
              :disabled="readOnly"
              required
            >
              <option value="">Select relationship</option>
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Guardian</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="col-xl-4 col-lg-6 col-md-6">
            <label class="form-label">Family Number:</label>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                v-model="formData.family_number" 
                readonly 
                placeholder="Auto-generated from selected guardian"
              />
              <span 
                v-if="formData.family_number" 
                class="input-group-text bg-success text-white" 
                title="Auto-populated from guardian"
              >
                <i class="bi bi-check-circle"></i>
              </span>
            </div>
            <div class="form-text text-muted">Auto-generated from selected guardian.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Parent Information -->
    <div class="row g-4 mb-4">
      <div class="col-xl-6 col-lg-6 col-md-6">
        <div class="p-3 border-start border-primary border-3 h-100">
          <h6 class="text-primary fw-bold mb-3">Mother's Information</h6>
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label">Name: <span class="text-danger">*</span></label>
              <input 
                type="text" 
                class="form-control" 
                v-model="formData.mother_name" 
                list="parentNames"
                placeholder="Type to search existing guardians..."
                :disabled="readOnly"
                required
              >
            </div>
            <div class="col-12">
              <label class="form-label">Occupation:</label>
              <input 
                type="text" 
                class="form-control" 
                v-model="formData.mother_occupation"
                :disabled="readOnly"
              >
            </div>
            <div class="col-12">
              <label class="form-label">Contact Number:</label>
              <input 
                type="tel" 
                class="form-control" 
                v-model="formData.mother_contact_number"
                :disabled="readOnly"
              >
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-6 col-lg-6 col-md-6">
        <div class="p-3 border-start border-info border-3 h-100">
          <h6 class="text-info fw-bold mb-3">Father's Information</h6>
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label">Name:</label>
              <input 
                type="text" 
                class="form-control" 
                v-model="formData.father_name" 
                list="parentNames"
                placeholder="Type to search existing guardians..."
                :disabled="readOnly"
              >
            </div>
            <div class="col-12">
              <label class="form-label">Occupation:</label>
              <input 
                type="text" 
                class="form-control" 
                v-model="formData.father_occupation"
                :disabled="readOnly"
              >
            </div>
            <div class="col-12">
              <label class="form-label">Contact Number:</label>
              <input 
                type="tel" 
                class="form-control" 
                v-model="formData.father_contact_number"
                :disabled="readOnly"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Shared datalist for parent names -->
    <datalist id="parentNames">
      <option v-for="g in guardians" :key="g.guardian_id" :value="g.full_name"></option>
    </datalist>

    <!-- Birth History -->
    <div class="row mb-4">
      <div class="col-12">
        <h6 class="text-primary fw-bold mb-3">
          <i class="bi bi-heart-pulse me-2"></i>Birth History
        </h6>
        <div class="row g-4">
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Time of Birth: <span class="text-danger" v-if="!isEditing">*</span></label>
            <TimeInput 
              v-model="formData.time_of_birth"
              :disabled="readOnly"
              :required="!isEditing"
            />
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Attendant at Birth: <span class="text-danger" v-if="!isEditing">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              v-model="formData.attendant_at_birth"
              :disabled="readOnly"
              :required="!isEditing"
            >
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Type of Delivery: <span class="text-danger" v-if="!isEditing">*</span></label>
            <select 
              class="form-select" 
              v-model="formData.type_of_delivery"
              :disabled="readOnly"
              :required="!isEditing"
            >
              <option value="">Select delivery type</option>
              <option value="Normal">Normal</option>
              <option value="Cesarean">Cesarean</option>
              <option value="Assisted">Assisted</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Birth Weight (kg):</label>
            <input 
              type="number" 
              step="0.1" 
              class="form-control" 
              v-model="formData.birth_weight"
              :disabled="readOnly"
            >
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Birth Length (cm):</label>
            <input 
              type="number" 
              step="0.1" 
              class="form-control" 
              v-model="formData.birth_length"
              :disabled="readOnly"
            >
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Place of Birth:</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="formData.place_of_birth"
              :disabled="readOnly"
            >
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Ballard's Score:</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="formData.ballards_score"
              :disabled="readOnly"
            >
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Newborn Screening Result:</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="formData.newborn_screening_result"
              :disabled="readOnly"
            >
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Hearing Test Date:</label>
            <DateInput
              v-model="formData.hearing_test_date"
              :disabled="readOnly"
              output-format="iso"
            />
          </div>
          <div class="col-xl-3 col-lg-4 col-md-6">
            <label class="form-label">Newborn Screening Date:</label>
            <DateInput
              v-model="formData.newborn_screening_date"
              :disabled="readOnly"
              output-format="iso"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="d-flex justify-content-end gap-2" v-if="!readOnly">
      <button 
        type="button" 
        class="btn btn-secondary" 
        @click="$emit('cancel')"
        :disabled="submitting"
      >
        <i class="bi bi-x-circle me-2"></i>Cancel
      </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="submitting"
        >
          <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-check-circle me-2"></i>
          Save Record
        </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import GuardianSelector from './GuardianSelector.vue'
import DateInput from '@/components/ui/form/DateInput.vue'
import TimeInput from '@/components/ui/form/TimeInput.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  guardians: {
    type: Array,
    default: () => []
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
    default: 'Submit'
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  id: null,
  surname: '',
  firstname: '',
  middlename: '',
  sex: '',
  date_of_birth: '',
  address: '',
  barangay: '',
  health_center: '',
  mother_name: '',
  mother_occupation: '',
  mother_contact_number: '',
  father_name: '',
  father_occupation: '',
  father_contact_number: '',
  guardian_id: null,
  family_number: '',
  relationship_to_guardian: '',
  birth_weight: '',
  birth_length: '',
  place_of_birth: '',
  time_of_birth: '',
  attendant_at_birth: '',
  type_of_delivery: '',
  ballards_score: '',
  newborn_screening_result: '',
  hearing_test_date: '',
  newborn_screening_date: ''
})

// Keep the last selected guardian object for autofill purposes
const selectedGuardian = ref(null)

// Initialize form with initial data
watch(() => props.initialData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    Object.keys(formData.value).forEach(key => {
      if (newData[key] !== undefined) {
        formData.value[key] = newData[key]
      }
    })
  }
}, { immediate: true, deep: true })

const applyParentAutofill = (guardian, relationship) => {
  if (!guardian || !relationship) return
  const rel = String(relationship).toLowerCase()
  if (rel === 'mother') {
    // Only set or overwrite if empty to allow manual edits later
    if (!formData.value.mother_name) formData.value.mother_name = guardian.full_name || ''
    // Do not override if user already typed a different contact unless empty
    if (!formData.value.mother_contact_number) formData.value.mother_contact_number = guardian.contact_number || ''
  } else if (rel === 'father') {
    if (!formData.value.father_name) formData.value.father_name = guardian.full_name || ''
    if (!formData.value.father_contact_number) formData.value.father_contact_number = guardian.contact_number || ''
  }
}

const onGuardianSelected = (guardian) => {
  selectedGuardian.value = guardian || null
  if (guardian && guardian.family_number) {
    formData.value.family_number = guardian.family_number
  }
  // Apply autofill if the current relationship is Mother or Father
  applyParentAutofill(selectedGuardian.value, formData.value.relationship_to_guardian)
}

const handleSubmit = () => {
  emit('submit', formData.value)
}

// React when relationship changes to apply autofill for the selected guardian
watch(() => formData.value.relationship_to_guardian, (newRel) => {
  if (!newRel) return
  applyParentAutofill(selectedGuardian.value, newRel)
})
</script>
