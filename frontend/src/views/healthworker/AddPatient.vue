<template>
  <HealthWorkerLayout>
    <!-- Mobile Header -->
    <div class="mobile-header d-flex align-items-center mb-3">
      <button class="btn btn-link p-0 me-3" @click="goBack">
        <i class="bi bi-arrow-left" style="font-size: 1.5rem; color: #007bff;"></i>
      </button>
      <h5 class="mb-0 fw-bold">Add New Patient</h5>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Form -->
    <div v-if="!loading" class="add-patient-form">
      <form @submit.prevent="savePatient">
        <!-- Patient Basic Information -->
        <div class="form-section mb-4">
          <h6 class="section-title">Patient Information</h6>
          <div class="form-fields">
            <div class="row g-3">
              <div class="col-12">
                <label for="surname" class="form-label">Surname *</label>
                <input type="text" class="form-control" id="surname" v-model="form.surname" required>
              </div>
              <div class="col-12">
                <label for="firstname" class="form-label">First Name *</label>
                <input type="text" class="form-control" id="firstname" v-model="form.firstname" required>
              </div>
              <div class="col-12">
                <label for="middlename" class="form-label">Middle Name</label>
                <input type="text" class="form-control" id="middlename" v-model="form.middlename">
              </div>
              <div class="col-12">
                <label for="sex" class="form-label">Sex *</label>
                <select class="form-select" id="sex" v-model="form.sex" required>
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
                    v-model="form.date_of_birth"
                    @change="onDatePickerChange"
                    @blur="showDatePicker = false"
                    ref="datePickerRef"
                  >
                </div>
              </div>
              <div class="col-12">
                <label for="address" class="form-label">Address *</label>
                <textarea class="form-control" id="address" rows="3" v-model="form.address" required></textarea>
              </div>
              <div class="col-12">
                <label for="barangay" class="form-label">Barangay *</label>
                <input type="text" class="form-control" id="barangay" v-model="form.barangay" required>
              </div>
              <div class="col-12">
                <label for="health_center" class="form-label">Health Center</label>
                <input type="text" class="form-control" id="health_center" v-model="form.health_center">
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
                <input type="hidden" v-model="form.guardian_id" required>
              </div>
              <div class="col-12">
                <label for="family_number" class="form-label">Family Number</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="family_number" 
                  v-model="form.family_number"
                  :readonly="form.guardian_id && guardians.find(g => g.guardian_id === form.guardian_id)?.family_number"
                >
                <div class="form-text text-success" v-if="form.guardian_id && guardians.find(g => g.guardian_id === form.guardian_id)?.family_number">
                  Auto-populated from selected guardian
                </div>
              </div>
              <div class="col-12">
                <label for="guardian_relationship" class="form-label">Relationship to Guardian</label>
                <select class="form-select" id="guardian_relationship" v-model="form.guardian_relationship">
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
                  v-model="form.mother_name"
                  list="hw-parent-names"
                  placeholder="Type to search existing guardians..."
                  required
                >
              </div>
              <div class="col-12">
                <label for="mother_occupation" class="form-label">Mother's Occupation</label>
                <input type="text" class="form-control" id="mother_occupation" v-model="form.mother_occupation">
              </div>
              <div class="col-12">
                <label for="mother_contact_number" class="form-label">Mother's Contact Number</label>
                <input type="tel" class="form-control" id="mother_contact_number" v-model="form.mother_contact_number">
              </div>
              <div class="col-12">
                <label for="father_name" class="form-label">Father's Name</label>
                <input
                  type="text"
                  class="form-control"
                  id="father_name"
                  v-model="form.father_name"
                  list="hw-parent-names"
                  placeholder="Type to search existing guardians..."
                >
              </div>
              <div class="col-12">
                <label for="father_occupation" class="form-label">Father's Occupation</label>
                <input type="text" class="form-control" id="father_occupation" v-model="form.father_occupation">
              </div>
              <div class="col-12">
                <label for="father_contact_number" class="form-label">Father's Contact Number</label>
                <input type="tel" class="form-control" id="father_contact_number" v-model="form.father_contact_number">
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
                <input type="number" step="0.1" class="form-control" id="birth_weight" v-model="form.birth_weight">
              </div>
              <div class="col-12">
                <label for="birth_height" class="form-label">Birth Height (cm)</label>
                <input type="number" step="0.1" class="form-control" id="birth_height" v-model="form.birth_height">
              </div>
              <div class="col-12">
                <label for="place_of_birth" class="form-label">Place of Birth</label>
                <input type="text" class="form-control" id="place_of_birth" v-model="form.place_of_birth">
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button type="button" class="btn btn-outline-secondary" @click="goBack">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            Add Patient
          </button>
        </div>
      </form>
      <!-- Shared datalist for parent names suggestions (must be inside <template>) -->
      <datalist id="hw-parent-names">
        <option v-for="g in guardians" :key="g.guardian_id" :value="g.full_name"></option>
      </datalist>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import api from '@/services/api'

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const showGuardianDropdown = ref(false)
const showDatePicker = ref(false)
const guardianSearchTerm = ref('')
const displayDate = ref('')
const guardians = ref([])
const datePickerRef = ref(null)

const form = ref({
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

const selectedGuardianName = computed(() => {
  if (form.value.guardian_id) {
    const guardian = guardians.value.find(g => g.guardian_id === form.value.guardian_id)
    return guardian ? guardian.full_name : ''
  }
  return ''
})

const filteredGuardians = computed(() => {
  if (!guardianSearchTerm.value) return guardians.value.slice(0, 10)
  return guardians.value.filter(guardian =>
    guardian.full_name.toLowerCase().includes(guardianSearchTerm.value.toLowerCase()) ||
    guardian.contact_number?.includes(guardianSearchTerm.value)
  ).slice(0, 10)
})

const goBack = () => {
  router.push('/healthworker/patients')
}

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
  
  // Remove any non-digit characters except /
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
  
  // Remove any non-digit characters
  value = value.replace(/\D/g, '')
  
  // Add slashes automatically
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2)
  }
  if (value.length >= 5) {
    value = value.substring(0, 5) + '/' + value.substring(5, 9)
  }
  
  displayDate.value = value
  
  // If we have a complete date, try to parse it
  if (value.length === 10) {
    const isoDate = formatDateToISO(value)
    if (isoDate) {
      form.value.date_of_birth = isoDate
    }
  }
}

const validateAndFormatDate = () => {
  const isoDate = formatDateToISO(displayDate.value)
  if (isoDate) {
    form.value.date_of_birth = isoDate
    displayDate.value = formatDateToDisplay(isoDate)
  } else if (displayDate.value) {
    // Invalid date format, clear it
    displayDate.value = ''
    form.value.date_of_birth = ''
  }
}

const onDatePickerChange = () => {
  displayDate.value = formatDateToDisplay(form.value.date_of_birth)
  showDatePicker.value = false
}

const hideGuardianDropdown = () => {
  setTimeout(() => {
    showGuardianDropdown.value = false
  }, 200)
}

const selectGuardian = (guardian) => {
  form.value.guardian_id = guardian.guardian_id
  form.value.family_number = guardian.family_number || ''
  guardianSearchTerm.value = ''
  showGuardianDropdown.value = false
  
  // Auto-fill parent's information based on relationship
  if (form.value.guardian_relationship === 'Mother') {
    if (!form.value.mother_name) form.value.mother_name = guardian.full_name
    if (!form.value.mother_contact_number) form.value.mother_contact_number = guardian.contact_number || ''
  } else if (form.value.guardian_relationship === 'Father') {
    if (!form.value.father_name) form.value.father_name = guardian.full_name
    if (!form.value.father_contact_number) form.value.father_contact_number = guardian.contact_number || ''
  }
}

const fetchGuardians = async () => {
  try {
    const response = await api.get('/guardians')
    guardians.value = response.data.data || []
  } catch (error) {
    console.error('Error fetching guardians:', error)
  }
}

const savePatient = async () => {
  try {
    saving.value = true
    
    const payload = {
      ...form.value,
      birth_weight: form.value.birth_weight ? parseFloat(form.value.birth_weight) : null,
      birth_height: form.value.birth_height ? parseFloat(form.value.birth_height) : null,
      guardian_id: parseInt(form.value.guardian_id)
    }
    
    await api.post('/patients', payload)
    
    // Success - go back to patient list
    router.push('/healthworker/patients')
  } catch (error) {
    console.error('Error saving patient:', error)
    alert('Error saving patient. Please try again.')
  } finally {
    saving.value = false
  }
}

// Watch for guardian relationship changes
watch(() => form.value.guardian_relationship, (newRelationship) => {
  if (!form.value.guardian_id) return
  const guardian = guardians.value.find(g => g.guardian_id === form.value.guardian_id)
  if (!guardian) return
  if (newRelationship === 'Mother') {
    if (!form.value.mother_name) form.value.mother_name = guardian.full_name
    if (!form.value.mother_contact_number) form.value.mother_contact_number = guardian.contact_number || ''
  } else if (newRelationship === 'Father') {
    if (!form.value.father_name) form.value.father_name = guardian.full_name
    if (!form.value.father_contact_number) form.value.father_contact_number = guardian.contact_number || ''
  }
})

// Watch for date changes to keep display in sync
watch(() => form.value.date_of_birth, (newDate) => {
  if (newDate && !displayDate.value) {
    displayDate.value = formatDateToDisplay(newDate)
  }
})

// Focus date picker when shown
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

onMounted(async () => {
  await fetchGuardians()
  loading.value = false
})
</script>


<style scoped>
/* Prevent horizontal scrolling and improve mobile stability */
* {
  box-sizing: border-box;
}

body {
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.mobile-header {
  background: white;
  padding: 1rem 0 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 56px; /* Below TopNavbar */
  z-index: 100;
}

.add-patient-form {
  padding-bottom: 6rem; /* Space for fixed buttons */
  overflow-x: hidden; /* Prevent horizontal scroll */
  width: 100%;
  max-width: 100vw;
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

.action-buttons {
  position: fixed;
  bottom: 80px; /* Above bottom navbar */
  left: 0;
  right: 0;
  background: white;
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  gap: 0; /* No gap between buttons */
}

.action-buttons .btn {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  border: 1px solid #ced4da;
  transition: all 0.2s ease;
}

.action-buttons .btn:first-child {
  border-radius: 0.5rem 0 0 0.5rem;
  border-right: none;
}

.action-buttons .btn:last-child {
  border-radius: 0 0.5rem 0.5rem 0;
}

.action-buttons .btn-outline-secondary {
  background: white;
  color: #6c757d;
  border-color: #ced4da;
}

.action-buttons .btn-outline-secondary:hover,
.action-buttons .btn-outline-secondary:active {
  background: #f8f9fa;
  color: #495057;
  border-color: #adb5bd;
}

.action-buttons .btn-primary {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.action-buttons .btn-primary:hover,
.action-buttons .btn-primary:active {
  background: #0056b3;
  border-color: #0056b3;
}

.action-buttons .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* Container constraints */
.container, .row, .col-12 {
  max-width: 100%;
  overflow-x: hidden;
}

/* Touch improvements */
input, select, textarea, button {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

input:focus, select:focus, textarea:focus {
  -webkit-user-select: text;
  user-select: text;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .mobile-header {
    margin-left: -1rem;
    margin-right: -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
    width: calc(100% + 2rem);
  }
  
  .add-patient-form {
    margin-left: -0.5rem;
    margin-right: -0.5rem;
    width: calc(100% + 1rem);
    padding-bottom: 7rem;
  }
  
  .form-section {
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    width: 100%;
  }
  
  .form-fields {
    padding: 0.75rem;
  }
  
  .action-buttons {
    left: 0;
    right: 0;
    padding: 0.75rem 1rem;
    gap: 0; /* No gap between buttons on mobile either */
  }
  
  .action-buttons .btn {
    padding: 0.625rem 0.875rem;
    font-size: 0.9rem;
  }
  
  /* Prevent zoom on input focus */
  input[type="text"],
  input[type="tel"],
  input[type="number"],
  input[type="date"],
  select,
  textarea {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}

/* Landscape mobile optimization */
@media (max-width: 768px) and (orientation: landscape) {
  .action-buttons {
    bottom: 60px; /* Adjust for smaller landscape bottom nav */
  }
  
  .add-patient-form {
    padding-bottom: 5rem;
  }
}

/* Prevent overscroll bounce */
@media (max-width: 768px) {
  body {
    position: fixed;
    overflow-x: hidden;
    width: 100%;
  }
}
</style>