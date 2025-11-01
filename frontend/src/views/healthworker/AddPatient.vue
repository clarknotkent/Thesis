<template>
  <HealthWorkerLayout :show-controls="false">
    <!-- Fixed Header Section -->
    <div class="add-patient-header-section">
      <div class="header-bar">
        <button class="back-button" @click="goBack">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h1 class="page-title">Add New Patient</h1>
        <button class="menu-button" style="visibility: hidden;">
          <i class="bi bi-three-dots-vertical"></i>
        </button>
      </div>
    </div>

    <!-- Page Content -->
    <div class="page-content-wrapper">
      <!-- Loading State -->
      <div v-if="loadingGuardians" class="loading-state">
        <div class="spinner"></div>
        <p>Loading guardians...</p>
      </div>

      <!-- Form Content -->
      <form v-else @submit.prevent="handleSubmit" class="patient-form">
        <!-- Patient Information Card -->
        <CollapsibleCard
          title="Patient Information"
          icon="person-fill"
          :is-expanded="expandedCards.patientInfo"
          @toggle="expandedCards.patientInfo = !expandedCards.patientInfo"
        >
          <div class="form-fields">
            <div class="form-group">
              <label class="form-label">First Name <span class="required">*</span></label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.firstname" 
                required
                placeholder="Enter first name"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Middle Name</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.middlename"
                placeholder="Enter middle name"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Surname <span class="required">*</span></label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.surname" 
                required
                placeholder="Enter surname"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Sex <span class="required">*</span></label>
              <select class="form-input" v-model="formData.sex" required>
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Date of Birth <span class="required">*</span></label>
              <input 
                type="date" 
                class="form-input" 
                v-model="formData.date_of_birth" 
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Barangay <span class="required">*</span></label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.barangay"
                required
                placeholder="Enter barangay"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Health Center <span class="required">*</span></label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.health_center"
                required
                placeholder="Enter health center"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Address <span class="required">*</span></label>
              <textarea 
                class="form-input" 
                rows="3" 
                v-model="formData.address"
                required
                placeholder="Enter complete address"
              ></textarea>
            </div>
          </div>
        </CollapsibleCard>

        <!-- Guardian & Family Information Card -->
        <CollapsibleCard
          title="Guardian & Family Information"
          icon="people-fill"
          :is-expanded="expandedCards.guardianInfo"
          @toggle="expandedCards.guardianInfo = !expandedCards.guardianInfo"
        >
          <div class="form-fields">
            <div class="form-group">
              <label class="form-label">Guardian <span class="required">*</span></label>
              <select 
                class="form-input" 
                v-model="formData.guardian_id" 
                @change="onGuardianSelected"
                required
              >
                <option value="">Select Guardian</option>
                <option 
                  v-for="guardian in guardians" 
                  :key="guardian.guardian_id" 
                  :value="guardian.guardian_id"
                >
                  {{ guardian.full_name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Relationship to Guardian <span class="required">*</span></label>
              <select class="form-input" v-model="formData.relationship_to_guardian" required>
                <option value="">Select relationship</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Family Number</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.family_number" 
                readonly
                placeholder="Auto-generated from guardian"
              />
              <div class="form-hint">Auto-populated from selected guardian</div>
            </div>

            <div class="section-divider">Mother's Information</div>

            <div class="form-group">
              <label class="form-label">Mother's Name <span class="required">*</span></label>
              <div class="parent-selector">
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="formData.mother_name" 
                  required
                  placeholder="Search or enter mother's name"
                  @input="filterMotherOptions"
                  @focus="showMotherDropdown = true"
                  @blur="hideMotherDropdown"
                />
                <div v-if="showMotherDropdown && filteredMotherOptions.length" class="dropdown-menu">
                  <div 
                    v-for="opt in filteredMotherOptions" 
                    :key="opt.full_name" 
                    class="dropdown-item"
                    @mousedown="selectMother(opt)"
                  >
                    <div class="dropdown-name">{{ opt.full_name }}</div>
                    <div class="dropdown-contact" v-if="opt.contact_number">{{ opt.contact_number }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Mother's Occupation</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.mother_occupation"
                placeholder="Enter occupation"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Mother's Contact Number</label>
              <input 
                type="tel" 
                class="form-input" 
                v-model="formData.mother_contact_number"
                placeholder="Enter contact number"
              />
            </div>

            <div class="section-divider">Father's Information</div>

            <div class="form-group">
              <label class="form-label">Father's Name</label>
              <div class="parent-selector">
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="formData.father_name" 
                  placeholder="Search or enter father's name"
                  @input="filterFatherOptions"
                  @focus="showFatherDropdown = true"
                  @blur="hideFatherDropdown"
                />
                <div v-if="showFatherDropdown && filteredFatherOptions.length" class="dropdown-menu">
                  <div 
                    v-for="opt in filteredFatherOptions" 
                    :key="opt.full_name" 
                    class="dropdown-item"
                    @mousedown="selectFather(opt)"
                  >
                    <div class="dropdown-name">{{ opt.full_name }}</div>
                    <div class="dropdown-contact" v-if="opt.contact_number">{{ opt.contact_number }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Father's Occupation</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.father_occupation"
                placeholder="Enter occupation"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Father's Contact Number</label>
              <input 
                type="tel" 
                class="form-input" 
                v-model="formData.father_contact_number"
                placeholder="Enter contact number"
              />
            </div>
          </div>
        </CollapsibleCard>

        <!-- Birth History Card -->
        <CollapsibleCard
          title="Birth History"
          icon="heart-pulse"
          :is-expanded="expandedCards.birthHistory"
          @toggle="expandedCards.birthHistory = !expandedCards.birthHistory"
        >
          <div class="form-fields">
            <div class="form-group">
              <label class="form-label">Time of Birth <span class="required">*</span></label>
              <input 
                type="time" 
                class="form-input" 
                v-model="formData.time_of_birth"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Attendant at Birth <span class="required">*</span></label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.attendant_at_birth"
                required
                placeholder="e.g., Doctor, Midwife"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Type of Delivery <span class="required">*</span></label>
              <select class="form-input" v-model="formData.type_of_delivery" required>
                <option value="">Select delivery type</option>
                <option value="Normal">Normal</option>
                <option value="Cesarean">Cesarean</option>
                <option value="Assisted">Assisted</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Birth Weight (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                class="form-input" 
                v-model="formData.birth_weight"
                placeholder="e.g., 3.2"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Birth Length (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                class="form-input" 
                v-model="formData.birth_length"
                placeholder="e.g., 50.5"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Place of Birth</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.place_of_birth"
                placeholder="Enter place of birth"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Ballard's Score</label>
              <input 
                type="number" 
                class="form-input" 
                v-model="formData.ballards_score"
                placeholder="Enter score"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Newborn Screening Result</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.newborn_screening_result"
                placeholder="Enter result"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Newborn Screening Date</label>
              <input 
                type="date" 
                class="form-input" 
                v-model="formData.newborn_screening_date"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Hearing Test Date</label>
              <input 
                type="date" 
                class="form-input" 
                v-model="formData.hearing_test_date"
              />
            </div>
          </div>
        </CollapsibleCard>

        <!-- Save Button -->
        <div class="save-button-container">
          <button 
            type="submit" 
            class="save-button" 
            :disabled="submitting"
          >
            <i class="bi bi-check-circle-fill" v-if="!submitting"></i>
            <span class="spinner-small" v-else></span>
            {{ submitting ? 'Saving...' : 'Save Record' }}
          </button>
        </div>
      </form>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import CollapsibleCard from '@/features/health-worker/patients/components/CollapsibleCard.vue'
import api from '@/services/api'

const router = useRouter()

const loadingGuardians = ref(true)
const submitting = ref(false)
const guardians = ref([])
const motherSuggestions = ref([])
const fatherSuggestions = ref([])
const selectedGuardian = ref(null)
const showMotherDropdown = ref(false)
const showFatherDropdown = ref(false)
const filteredMotherOptions = ref([])
const filteredFatherOptions = ref([])

const expandedCards = reactive({
  patientInfo: true,
  guardianInfo: false,
  birthHistory: false
})

const formData = ref({
  firstname: '',
  middlename: '',
  surname: '',
  sex: '',
  date_of_birth: '',
  barangay: '',
  health_center: '',
  address: '',
  guardian_id: '',
  relationship_to_guardian: '',
  family_number: '',
  mother_name: '',
  mother_occupation: '',
  mother_contact_number: '',
  father_name: '',
  father_occupation: '',
  father_contact_number: '',
  time_of_birth: '',
  attendant_at_birth: '',
  type_of_delivery: '',
  birth_weight: '',
  birth_length: '',
  place_of_birth: '',
  ballards_score: '',
  newborn_screening_result: '',
  newborn_screening_date: '',
  hearing_test_date: ''
})

const motherOptions = computed(() => {
  const recorded = Array.isArray(motherSuggestions.value) ? motherSuggestions.value : []
  const map = new Map()
  recorded.forEach(item => {
    const key = (item.full_name || '').trim().toLowerCase()
    if (key && !map.has(key)) map.set(key, item)
  })
  const arr = Array.from(map.values())
  return arr.sort((a,b) => (a.full_name || '').localeCompare(b.full_name || ''))
})

const fatherOptions = computed(() => {
  const recorded = Array.isArray(fatherSuggestions.value) ? fatherSuggestions.value : []
  const map = new Map()
  recorded.forEach(item => {
    const key = (item.full_name || '').trim().toLowerCase()
    if (key && !map.has(key)) map.set(key, item)
  })
  const arr = Array.from(map.values())
  return arr.sort((a,b) => (a.full_name || '').localeCompare(b.full_name || ''))
})

const applyParentAutofill = (guardian, relationship) => {
  if (!guardian || !relationship) return
  const rel = String(relationship).toLowerCase()
  if (rel === 'mother') {
    if (!formData.value.mother_name) formData.value.mother_name = formatGuardianNameFirstMiddleLast(guardian)
    if (!formData.value.mother_contact_number) formData.value.mother_contact_number = guardian.contact_number || ''
  } else if (rel === 'father') {
    if (!formData.value.father_name) formData.value.father_name = formatGuardianNameFirstMiddleLast(guardian)
    if (!formData.value.father_contact_number) formData.value.father_contact_number = guardian.contact_number || ''
  }
  fetchCoParentAndFill(rel)
}

const formatGuardianNameFirstMiddleLast = (guardian) => {
  const parts = []
  if (guardian?.firstname) parts.push(guardian.firstname)
  if (guardian?.middlename) parts.push(guardian.middlename)
  if (guardian?.surname) parts.push(guardian.surname)
  if (parts.length) return parts.join(' ').trim()
  return guardian?.full_name || ''
}

const getContactForName = (name, type) => {
  const opts = type === 'mother' ? motherOptions.value : fatherOptions.value
  const found = opts.find(o => ((o.full_name || '').trim()) === String(name).trim())
  return found?.contact_number || null
}

const fetchCoParentAndFill = async (type) => {
  try {
    const isMother = String(type).toLowerCase() === 'mother'
    const chosenName = isMother ? formData.value.mother_name : formData.value.father_name
    if (!chosenName) return
    const res = await api.get('/patients/parents/coparent', { params: { type: isMother ? 'mother' : 'father', name: chosenName } })
    const suggestion = res.data?.data?.name
    const suggestedContact = res.data?.data?.contact_number
    const target = isMother ? 'father' : 'mother'
    if (suggestion && !formData.value[`${target}_name`]) {
      formData.value[`${target}_name`] = suggestion
      const fromApi = suggestedContact || null
      const fromOptions = getContactForName(suggestion, target)
      const finalContact = fromApi || fromOptions || null
      if (finalContact && !formData.value[`${target}_contact_number`]) {
        formData.value[`${target}_contact_number`] = finalContact
      }
    }
  } catch (e) {
    console.warn('Co-parent suggestion error:', e?.message || e)
  }
}

const onGuardianSelected = () => {
  const selected = guardians.value.find(g => g.guardian_id === formData.value.guardian_id)
  selectedGuardian.value = selected || null
  if (selected) {
    formData.value.family_number = selected.family_number || ''
  }
  applyParentAutofill(selectedGuardian.value, formData.value.relationship_to_guardian)
}

const onMotherSelected = (opt) => {
  if (!formData.value.mother_contact_number && opt?.contact_number) {
    formData.value.mother_contact_number = opt.contact_number
  }
  if (!formData.value.mother_occupation && opt?.occupation) {
    formData.value.mother_occupation = opt.occupation
  }
  fetchCoParentAndFill('mother')
}

const onFatherSelected = (opt) => {
  if (!formData.value.father_contact_number && opt?.contact_number) {
    formData.value.father_contact_number = opt.contact_number
  }
  if (!formData.value.father_occupation && opt?.occupation) {
    formData.value.father_occupation = opt.occupation
  }
  fetchCoParentAndFill('father')
}

const filterMotherOptions = () => {
  const query = (formData.value.mother_name || '').toLowerCase()
  filteredMotherOptions.value = motherOptions.value.filter(opt => 
    (opt.full_name || '').toLowerCase().includes(query)
  ).slice(0, 10)
}

const filterFatherOptions = () => {
  const query = (formData.value.father_name || '').toLowerCase()
  filteredFatherOptions.value = fatherOptions.value.filter(opt => 
    (opt.full_name || '').toLowerCase().includes(query)
  ).slice(0, 10)
}

const selectMother = (opt) => {
  formData.value.mother_name = opt.full_name
  showMotherDropdown.value = false
  onMotherSelected(opt)
}

const selectFather = (opt) => {
  formData.value.father_name = opt.full_name
  showFatherDropdown.value = false
  onFatherSelected(opt)
}

const hideMotherDropdown = () => {
  setTimeout(() => showMotherDropdown.value = false, 150)
}

const hideFatherDropdown = () => {
  setTimeout(() => showFatherDropdown.value = false, 150)
}

const goBack = () => {
  if (confirm('Are you sure you want to cancel? Unsaved data will be lost.')) {
    router.back()
  }
}

const fetchGuardians = async () => {
  try {
    loadingGuardians.value = true
    const response = await api.get('/guardians')
    guardians.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error fetching guardians:', error)
    alert('Failed to load guardians. Please refresh the page.')
  } finally {
    loadingGuardians.value = false
  }
}

const fetchParentSuggestions = async () => {
  try {
    const [momsRes, dadsRes] = await Promise.all([
      api.get('/patients/parents/suggestions', { params: { type: 'mother' } }),
      api.get('/patients/parents/suggestions', { params: { type: 'father' } })
    ])
    motherSuggestions.value = momsRes.data?.data || []
    fatherSuggestions.value = dadsRes.data?.data || []
  } catch (error) {
    console.warn('Failed to fetch parent suggestions (non-blocking):', error?.message || error)
  }
}

const convertToISODate = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

const handleSubmit = async () => {
  try {
    submitting.value = true

    if (!formData.value.surname || !formData.value.firstname || !formData.value.sex || 
        !formData.value.date_of_birth || !formData.value.mother_name || 
        !formData.value.guardian_id || !formData.value.relationship_to_guardian) {
      alert('Please fill in all required fields marked with *')
      return
    }

    if (!formData.value.time_of_birth || !formData.value.attendant_at_birth || !formData.value.type_of_delivery) {
      alert('Please provide required birth history: Time of Birth, Attendant at Birth, and Type of Delivery')
      return
    }

    const patientData = {
      surname: formData.value.surname,
      firstname: formData.value.firstname,
      middlename: formData.value.middlename,
      sex: formData.value.sex,
      date_of_birth: convertToISODate(formData.value.date_of_birth) || formData.value.date_of_birth,
      address: formData.value.address,
      barangay: formData.value.barangay,
      health_center: formData.value.health_center,
      mother_name: formData.value.mother_name,
      mother_occupation: formData.value.mother_occupation,
      mother_contact_number: formData.value.mother_contact_number,
      father_name: formData.value.father_name,
      father_occupation: formData.value.father_occupation,
      father_contact_number: formData.value.father_contact_number,
      guardian_id: formData.value.guardian_id,
      family_number: formData.value.family_number,
      relationship_to_guardian: formData.value.relationship_to_guardian,
      birth_weight: formData.value.birth_weight,
      birth_length: formData.value.birth_length,
      place_of_birth: formData.value.place_of_birth,
      birthhistory: {
        birth_weight: formData.value.birth_weight,
        birth_length: formData.value.birth_length,
        place_of_birth: formData.value.place_of_birth,
        time_of_birth: formData.value.time_of_birth,
        attendant_at_birth: formData.value.attendant_at_birth,
        type_of_delivery: formData.value.type_of_delivery,
        ballards_score: formData.value.ballards_score,
        newborn_screening_result: formData.value.newborn_screening_result,
        hearing_test_date: convertToISODate(formData.value.hearing_test_date) || formData.value.hearing_test_date,
        newborn_screening_date: convertToISODate(formData.value.newborn_screening_date) || formData.value.newborn_screening_date
      }
    }

    const response = await api.post('/patients', patientData)
    
    if (response.data.success) {
      alert('New patient added successfully!')
      router.push('/healthworker/patients')
    }
  } catch (error) {
    console.error('Error creating patient:', error)
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred'
    alert(`Failed to add patient: ${errorMessage}`)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchGuardians()
  fetchParentSuggestions()
})

watch(() => formData.value.relationship_to_guardian, (newRel) => {
  applyParentAutofill(selectedGuardian.value, newRel)
})
</script>

<style scoped>
.add-patient-header-section {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  flex-shrink: 0;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  height: 57px;
}

.back-button,
.menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #374151;
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.back-button:hover,
.menu-button:hover {
  background: #f3f4f6;
}

.back-button:active,
.menu-button:active {
  background: #e5e7eb;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
  text-align: center;
  padding: 0 0.5rem;
}

.page-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  padding-bottom: 120px;
}

.patient-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #111827;
  background: #ffffff;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

select.form-input {
  cursor: pointer;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.form-input:read-only {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.parent-selector {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-name {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.dropdown-contact {
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.125rem;
}

.form-hint {
  font-size: 0.8125rem;
  color: #6b7280;
  font-style: italic;
}

.section-divider {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #007bff;
  padding: 0.75rem 0;
  border-bottom: 2px solid #007bff;
  margin: 0.5rem 0;
}

.save-button-container {
  padding: 1.5rem 0;
}

.save-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.0625rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
}

.save-button:active:not(:disabled) {
  transform: translateY(0);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-button i {
  font-size: 1.25rem;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  margin-top: 1rem;
  font-size: 0.9375rem;
  color: #6b7280;
}

@media (max-width: 576px) {
  .page-content-wrapper {
    padding: 1rem;
  }

  .form-fields {
    padding: 1rem;
    gap: 1rem;
  }

  .form-input {
    padding: 0.625rem;
    font-size: 0.875rem;
  }

  .save-button {
    padding: 0.875rem;
    font-size: 1rem;
  }
}
</style>
