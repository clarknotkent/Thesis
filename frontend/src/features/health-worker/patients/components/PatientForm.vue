<template>
  <div class="patient-form">
    <form @submit.prevent="handleSubmit">
      <!-- Patient Basic Information -->
      <div class="form-section mb-4">
        <h6 class="section-title">Patient Information</h6>
        <div class="form-fields">
          <div class="row g-3">
            <div class="col-12">
              <label for="surname" class="form-label">Surname *</label>
              <input type="text" class="form-control" id="surname" v-model="localForm.surname" required>
            </div>
            <div class="col-12">
              <label for="firstname" class="form-label">First Name *</label>
              <input type="text" class="form-control" id="firstname" v-model="localForm.firstname" required>
            </div>
            <div class="col-12">
              <label for="middlename" class="form-label">Middle Name</label>
              <input type="text" class="form-control" id="middlename" v-model="localForm.middlename">
            </div>
            <div class="col-12">
              <label for="sex" class="form-label">Sex *</label>
              <select class="form-select" id="sex" v-model="localForm.sex" required>
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div class="col-12">
              <label for="date_of_birth" class="form-label">Date of Birth *</label>
              <div class="position-relative date-input-container">
                <input 
                  type="text" 
                  class="form-control" 
                  id="date_of_birth" 
                  v-model="displayDate"
                  @input="handleDateInput"
                  @blur="validateAndFormatDate"
                  placeholder="MM/DD/YYYY"
                  maxlength="10"
                  required
                >
                <button 
                  type="button" 
                  class="btn btn-outline-secondary calendar-btn"
                  @click="showDatePicker = !showDatePicker"
                >
                  <i class="bi bi-calendar3"></i>
                </button>
                <input 
                  v-if="showDatePicker"
                  type="date" 
                  class="form-control date-picker-input"
                  v-model="localForm.date_of_birth"
                  @change="onDatePickerChange"
                  @blur="showDatePicker = false"
                  ref="datePickerRef"
                >
              </div>
            </div>
            <div class="col-12">
              <label for="address" class="form-label">Address *</label>
              <textarea class="form-control" id="address" rows="3" v-model="localForm.address" required></textarea>
            </div>
            <div class="col-12">
              <label for="barangay" class="form-label">Barangay *</label>
              <input type="text" class="form-control" id="barangay" v-model="localForm.barangay" required>
            </div>
            <div class="col-12">
              <label for="health_center" class="form-label">Health Center</label>
              <input type="text" class="form-control" id="health_center" v-model="localForm.health_center">
            </div>
          </div>
        </div>
      </div>

      <!-- Guardian Information -->
      <div class="form-section mb-4">
        <h6 class="section-title">Guardian Information</h6>
        <div class="form-fields">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="guardian_id">Guardian *</label>
              <div class="position-relative">
                <input
                  type="text"
                  class="form-control"
                  v-model="guardianSearchTerm"
                  @focus="showGuardianDropdown = true"
                  @blur="hideGuardianDropdown"
                  :placeholder="selectedGuardianName || 'Search and select guardian...'"
                  autocomplete="off"
                />
                <div
                  v-if="showGuardianDropdown && filteredGuardians.length > 0"
                  class="dropdown-menu show w-100 position-absolute"
                  style="max-height: 200px; overflow-y: auto; z-index: 1000;"
                >
                  <div
                    v-for="guardian in filteredGuardians"
                    :key="guardian.guardian_id"
                    class="dropdown-item cursor-pointer"
                    @mousedown="selectGuardian(guardian)"
                  >
                    <div>
                      <strong>{{ guardian.full_name }}</strong><br>
                      <small class="text-muted">
                        📞 {{ guardian.contact_number || 'No contact' }}
                      </small>
                    </div>
                  </div>
                </div>
                <div
                  v-if="showGuardianDropdown && guardianSearchTerm && filteredGuardians.length === 0"
                  class="dropdown-menu show w-100 position-absolute"
                  style="z-index: 1000;"
                >
                  <div class="dropdown-item-text text-muted text-center py-3">
                    <i class="bi bi-search"></i>
                    No guardians found
                  </div>
                </div>
              </div>
              <input type="hidden" v-model="localForm.guardian_id" required>
            </div>
            <div class="col-12">
              <label for="family_number" class="form-label">Family Number</label>
              <input 
                type="text" 
                class="form-control" 
                id="family_number" 
                v-model="localForm.family_number"
                :readonly="localForm.guardian_id && guardians.find(g => g.guardian_id === localForm.guardian_id)?.family_number"
              >
              <div class="form-text text-success" v-if="localForm.guardian_id && guardians.find(g => g.guardian_id === localForm.guardian_id)?.family_number">
                Auto-populated from selected guardian
              </div>
            </div>
            <div class="col-12">
              <label for="guardian_relationship" class="form-label">Relationship to Guardian</label>
              <select class="form-select" id="guardian_relationship" v-model="localForm.guardian_relationship">
                <option value="">Select relationship</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Aunt/Uncle">Aunt/Uncle</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Parent Information -->
      <div class="form-section mb-4">
        <h6 class="section-title">Parent Information</h6>
        <div class="form-fields">
          <div class="row g-3">
            <div class="col-12">
              <label for="mother_name" class="form-label">Mother's Name *</label>
              <input
                type="text"
                class="form-control"
                id="mother_name"
                v-model="localForm.mother_name"
                list="hw-parent-names"
                placeholder="Type to search existing guardians..."
                required
              >
            </div>
            <div class="col-12">
              <label for="mother_occupation" class="form-label">Mother's Occupation</label>
              <input type="text" class="form-control" id="mother_occupation" v-model="localForm.mother_occupation">
            </div>
            <div class="col-12">
              <label for="mother_contact_number" class="form-label">Mother's Contact Number</label>
              <input type="tel" class="form-control" id="mother_contact_number" v-model="localForm.mother_contact_number">
            </div>
            <div class="col-12">
              <label for="father_name" class="form-label">Father's Name</label>
              <input
                type="text"
                class="form-control"
                id="father_name"
                v-model="localForm.father_name"
                list="hw-parent-names"
                placeholder="Type to search existing guardians..."
              >
            </div>
            <div class="col-12">
              <label for="father_occupation" class="form-label">Father's Occupation</label>
              <input type="text" class="form-control" id="father_occupation" v-model="localForm.father_occupation">
            </div>
            <div class="col-12">
              <label for="father_contact_number" class="form-label">Father's Contact Number</label>
              <input type="tel" class="form-control" id="father_contact_number" v-model="localForm.father_contact_number">
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="form-section mb-4">
        <h6 class="section-title">Additional Information</h6>
        <div class="form-fields">
          <div class="row g-3">
            <div class="col-12">
              <label for="birth_weight" class="form-label">Birth Weight (kg)</label>
              <input type="number" step="0.1" class="form-control" id="birth_weight" v-model="localForm.birth_weight">
            </div>
            <div class="col-12">
              <label for="birth_height" class="form-label">Birth Height (cm)</label>
              <input type="number" step="0.1" class="form-control" id="birth_height" v-model="localForm.birth_height">
            </div>
            <div class="col-12">
              <label for="place_of_birth" class="form-label">Place of Birth</label>
              <input type="text" class="form-control" id="place_of_birth" v-model="localForm.place_of_birth">
            </div>
          </div>
        </div>
      </div>

      <!-- Shared datalist for parent names suggestions -->
      <datalist id="hw-parent-names">
        <option v-for="g in guardians" :key="g.guardian_id" :value="g.full_name"></option>
      </datalist>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  formData: {
    type: Object,
    default: () => ({
      surname: '',
      firstname: '',
      middlename: '',
      sex: '',
      date_of_birth: '',
      address: '',
      barangay: '',
      health_center: '',
      guardian_id: '',
      family_number: '',
      guardian_relationship: '',
      mother_name: '',
      mother_occupation: '',
      mother_contact_number: '',
      father_name: '',
      father_occupation: '',
      father_contact_number: '',
      birth_weight: '',
      birth_height: '',
      place_of_birth: ''
    })
  },
  guardians: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['submit', 'update:formData'])

const localForm = ref({ ...props.formData })
const showGuardianDropdown = ref(false)
const showDatePicker = ref(false)
const guardianSearchTerm = ref('')
const displayDate = ref('')
const datePickerRef = ref(null)

const selectedGuardianName = computed(() => {
  if (localForm.value.guardian_id) {
    const guardian = props.guardians.find(g => g.guardian_id === localForm.value.guardian_id)
    return guardian ? guardian.full_name : ''
  }
  return ''
})

const filteredGuardians = computed(() => {
  if (!guardianSearchTerm.value) return props.guardians.slice(0, 10)
  return props.guardians.filter(guardian =>
    guardian.full_name.toLowerCase().includes(guardianSearchTerm.value.toLowerCase()) ||
    guardian.contact_number?.includes(guardianSearchTerm.value)
  ).slice(0, 10)
})

const formatDateToDisplay = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${month}/${day}/${year}`
}

const formatDateToISO = (mmddyyyy) => {
  if (!mmddyyyy) return ''
  
  const cleaned = mmddyyyy.replace(/[^\d\/]/g, '')
  const parts = cleaned.split('/')
  
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0')
    const day = parts[1].padStart(2, '0')
    const year = parts[2]
    
    if (year.length === 4 && month.length === 2 && day.length === 2) {
      const date = new Date(year, month - 1, day)
      if (date.getFullYear() == year && date.getMonth() == month - 1 && date.getDate() == day) {
        return `${year}-${month}-${day}`
      }
    }
  }
  return ''
}

const handleDateInput = (event) => {
  let value = event.target.value
  
  value = value.replace(/\D/g, '')
  
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2)
  }
  if (value.length >= 5) {
    value = value.substring(0, 5) + '/' + value.substring(5, 9)
  }
  
  displayDate.value = value
  
  if (value.length === 10) {
    const isoDate = formatDateToISO(value)
    if (isoDate) {
      localForm.value.date_of_birth = isoDate
    }
  }
}

const validateAndFormatDate = () => {
  const isoDate = formatDateToISO(displayDate.value)
  if (isoDate) {
    localForm.value.date_of_birth = isoDate
    displayDate.value = formatDateToDisplay(isoDate)
  } else if (displayDate.value) {
    displayDate.value = ''
    localForm.value.date_of_birth = ''
  }
}

const onDatePickerChange = () => {
  displayDate.value = formatDateToDisplay(localForm.value.date_of_birth)
  showDatePicker.value = false
}

const hideGuardianDropdown = () => {
  setTimeout(() => {
    showGuardianDropdown.value = false
  }, 200)
}

const selectGuardian = (guardian) => {
  localForm.value.guardian_id = guardian.guardian_id
  localForm.value.family_number = guardian.family_number || ''
  guardianSearchTerm.value = ''
  showGuardianDropdown.value = false
  
  if (localForm.value.guardian_relationship === 'Mother') {
    if (!localForm.value.mother_name) localForm.value.mother_name = guardian.full_name
    if (!localForm.value.mother_contact_number) localForm.value.mother_contact_number = guardian.contact_number || ''
  } else if (localForm.value.guardian_relationship === 'Father') {
    if (!localForm.value.father_name) localForm.value.father_name = guardian.full_name
    if (!localForm.value.father_contact_number) localForm.value.father_contact_number = guardian.contact_number || ''
  }
}

const handleSubmit = () => {
  emit('submit', localForm.value)
}

// Watch for guardian relationship changes
watch(() => localForm.value.guardian_relationship, (newRelationship) => {
  if (!localForm.value.guardian_id) return
  const guardian = props.guardians.find(g => g.guardian_id === localForm.value.guardian_id)
  if (!guardian) return
  if (newRelationship === 'Mother') {
    if (!localForm.value.mother_name) localForm.value.mother_name = guardian.full_name
    if (!localForm.value.mother_contact_number) localForm.value.mother_contact_number = guardian.contact_number || ''
  } else if (newRelationship === 'Father') {
    if (!localForm.value.father_name) localForm.value.father_name = guardian.full_name
    if (!localForm.value.father_contact_number) localForm.value.father_contact_number = guardian.contact_number || ''
  }
})

// Watch for date changes
watch(() => localForm.value.date_of_birth, (newDate) => {
  if (newDate && !displayDate.value) {
    displayDate.value = formatDateToDisplay(newDate)
  }
})

// Watch for date picker visibility
watch(() => showDatePicker.value, (show) => {
  if (show) {
    nextTick(() => {
      if (datePickerRef.value) {
        datePickerRef.value.focus()
        datePickerRef.value.click()
      }
    })
  }
})

// Watch local form changes and emit
watch(localForm, (newVal) => {
  emit('update:formData', newVal)
}, { deep: true })
</script>

<style scoped>
.patient-form {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.form-section {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e9ecef;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.section-title {
  background: #f8f9fa;
  padding: 1rem;
  margin: 0;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #495057;
  width: 100%;
  box-sizing: border-box;
}

.form-fields {
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
  display: block;
}

.form-control, .form-select {
  border-radius: 0.5rem;
  border: 1px solid #ced4da;
  padding: 0.75rem;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.form-control:focus, .form-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.date-input-container {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
}

.date-input-container .form-control {
  padding-right: 3rem;
  flex: 1;
}

.calendar-btn {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 3rem;
  border-radius: 0 0.5rem 0.5rem 0;
  border-left: none;
  z-index: 10;
  background: white;
  border: 1px solid #ced4da;
  border-left: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-btn:hover {
  background: #f8f9fa;
  border-color: #007bff;
}

.date-picker-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  z-index: 1000;
  pointer-events: none;
}

.date-picker-input::-webkit-calendar-picker-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  pointer-events: auto;
}

.dropdown-menu {
  border-radius: 0.5rem;
  border: 1px solid #ced4da;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  width: 100% !important;
  max-width: 100%;
  left: 0 !important;
  right: 0 !important;
}

.dropdown-item {
  padding: 0.75rem;
  border-bottom: 1px solid #f8f9fa;
  word-wrap: break-word;
  white-space: normal;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover,
.dropdown-item:active {
  background-color: #f8f9fa;
}

.cursor-pointer {
  cursor: pointer;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .form-section {
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    width: 100%;
  }
  
  .form-fields {
    padding: 0.75rem;
  }
  
  input[type="text"],
  input[type="tel"],
  input[type="number"],
  input[type="date"],
  select,
  textarea {
    font-size: 16px;
  }
}
</style>
