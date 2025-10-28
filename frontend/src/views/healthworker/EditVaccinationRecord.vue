<template>
  <HealthWorkerLayout>
    <div class="edit-record-container">
      <!-- Fixed Header -->
      <div class="edit-record-header-section">
        <div class="header-content">
          <button class="btn-back" @click="handleBack" :disabled="saving">
            <i class="bi bi-arrow-left"></i>
          </button>
          <div class="header-title">
            <h1>{{ form.vaccineName ? `Edit ${form.vaccineName}` : 'Edit Vaccination Record' }}</h1>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-section">
        <div class="spinner"></div>
        <p>Loading vaccination record...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-section">
        <i class="bi bi-exclamation-circle"></i>
        <p>{{ error }}</p>
        <button class="btn-retry" @click="fetchVaccinationRecord">
          <i class="bi bi-arrow-clockwise"></i>
          Retry
        </button>
      </div>

      <!-- Edit Form -->
      <div v-else-if="vaccinationRecord" class="edit-form-content">
        <form @submit.prevent="handleSubmit">
          <!-- Vaccine Name (Read-only) -->
          <div class="form-group">
            <label class="form-label">Vaccine Name *</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="form.vaccineName"
              readonly
              disabled
            >
            <small class="form-hint">Vaccine name cannot be changed</small>
          </div>

          <!-- Dose Number -->
          <div class="form-group">
            <label class="form-label">Dose Number *</label>
            <select 
              class="form-input" 
              v-model="form.doseNumber"
              required
            >
              <option value="">Select dose number</option>
              <option value="1">Dose 1</option>
              <option value="2">Dose 2</option>
              <option value="3">Dose 3</option>
              <option value="4">Booster</option>
            </select>
          </div>

          <!-- Date Administered -->
          <div class="form-group">
            <label class="form-label">Date Administered *</label>
            <input 
              type="date" 
              class="form-input" 
              v-model="form.dateAdministered"
              @change="calculateAge"
              required
              :max="todayDate"
            >
          </div>

          <!-- Age at Administration (Auto-calculated) -->
          <div class="form-group">
            <label class="form-label">Age at Administration</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="form.ageAtAdministration"
              readonly
            >
            <small class="form-hint">Automatically calculated from date administered</small>
          </div>

          <!-- Administered By -->
          <div class="form-group">
            <label class="form-label">Administered By *</label>
            <select 
              class="form-input" 
              v-model="form.administeredBy"
              required
            >
              <option value="">Select health staff</option>
              <option 
                v-for="nurse in nurses" 
                :key="nurse.user_id" 
                :value="nurse.user_id"
              >
                {{ nurse.fullname }} ({{ nurse.hs_type }})
              </option>
              <option v-if="nurses.length === 0" disabled>No nurses/nutritionists available</option>
            </select>
          </div>

          <!-- Site of Administration -->
          <div class="form-group">
            <label class="form-label">Site of Administration</label>
            <select 
              class="form-input" 
              v-model="form.siteOfAdministration"
            >
              <option value="">Select a site</option>
              <option value="Left arm (deltoid)">Left arm (deltoid)</option>
              <option value="Right arm (deltoid)">Right arm (deltoid)</option>
              <option value="Left thigh (anterolateral)">Left thigh (anterolateral)</option>
              <option value="Right thigh (anterolateral)">Right thigh (anterolateral)</option>
              <option value="Oral">Oral</option>
            </select>
          </div>

          <!-- Manufacturer -->
          <div class="form-group">
            <label class="form-label">Manufacturer</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="form.manufacturer"
              placeholder="e.g., Sanofi Pasteur"
            >
          </div>

          <!-- Lot Number -->
          <div class="form-group">
            <label class="form-label">Lot Number</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="form.lotNumber"
              placeholder="e.g., L123456"
            >
          </div>

          <!-- Facility Name -->
          <div class="form-group">
            <label class="form-label">Facility Name</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="form.facilityName"
              placeholder="e.g., Barangay Health Center"
            >
          </div>

          <!-- Remarks -->
          <div class="form-group">
            <label class="form-label">Remarks</label>
            <textarea 
              class="form-input" 
              v-model="form.remarks"
              rows="4"
              placeholder="Additional notes or observations..."
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button 
              type="button" 
              class="btn-cancel"
              @click="handleBack"
              :disabled="saving"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn-save"
              :disabled="saving || !isFormValid"
            >
              <i class="bi bi-check-circle-fill" v-if="!saving"></i>
              <span class="spinner-small" v-else></span>
              {{ saving ? 'Saving...' : 'Save All Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

// Props from route params
const patientId = computed(() => route.params.patientId)
const recordId = computed(() => route.params.recordId)

// State
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const patientData = ref(null)
const vaccinationRecord = ref(null)
const nurses = ref([])

// Form data
const form = ref({
  vaccineName: '',
  doseNumber: '',
  dateAdministered: '',
  ageAtAdministration: '',
  administeredBy: '',
  siteOfAdministration: '',
  manufacturer: '',
  lotNumber: '',
  facilityName: '',
  remarks: ''
})

// Computed
const todayDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const isFormValid = computed(() => {
  return form.value.vaccineName && 
         form.value.doseNumber && 
         form.value.dateAdministered && 
         form.value.administeredBy
})

// Methods
const handleBack = () => {
  if (saving.value) return
  router.push({ 
    name: 'PatientDetail', 
    params: { id: patientId.value }
  })
}

const calculateAge = () => {
  if (!form.value.dateAdministered || !patientData.value?.date_of_birth) {
    return
  }

  const birthDate = new Date(patientData.value.date_of_birth)
  const adminDate = new Date(form.value.dateAdministered)
  
  let years = adminDate.getFullYear() - birthDate.getFullYear()
  let months = adminDate.getMonth() - birthDate.getMonth()
  let days = adminDate.getDate() - birthDate.getDate()

  if (days < 0) {
    months--
    const prevMonth = new Date(adminDate.getFullYear(), adminDate.getMonth(), 0)
    days += prevMonth.getDate()
  }

  if (months < 0) {
    years--
    months += 12
  }

  const parts = []
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`)
  if (days > 0 && years === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)

  form.value.ageAtAdministration = parts.join(', ') || '0 days'
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    return ''
  }
}

const deriveSite = (record) => {
  const remarks = record?.remarks || record?.notes || ''
  if (remarks) {
    const match = remarks.match(/(?:site|injection site)\s*[:\-]\s*([^;,.\n]+)/i)
    if (match && match[1]) return match[1].trim()
  }
  return record?.site || record?.site_of_administration || record?.siteOfAdministration || ''
}

const deriveFacility = (record) => {
  const isOutside = !!(record?.immunization_outside || record?.is_outside || record?.isOutside || record?.outside_immunization)
  if (isOutside) return 'Outside'
  return (
    record?.immunization_facility_name ||
    record?.facility_name ||
    record?.facilityName ||
    record?.health_center ||
    record?.healthCenter ||
    ''
  )
}

const deriveManufacturer = (record) => {
  const remarks = record?.remarks || record?.notes || ''
  if (remarks) {
    const match = remarks.match(/(?:manufacturer)\s*[:\-]\s*([^|;,.\n]+)/i)
    if (match && match[1]) return match[1].trim()
  }
  return record?.manufacturer || record?.vaccine_manufacturer || ''
}

const deriveLotNumber = (record) => {
  const remarks = record?.remarks || record?.notes || ''
  if (remarks) {
    const match = remarks.match(/(?:lot|lot number|batch)\s*[:\-]?\s*([A-Z0-9\-]+)/i)
    if (match && match[1]) return match[1].trim()
  }
  return record?.lot_number || record?.lotNumber || record?.batch_number || ''
}

const fetchPatientData = async () => {
  try {
    const response = await api.get(`/patients/${patientId.value}`)
    patientData.value = response.data.data || response.data
  } catch (err) {
    console.error('Error fetching patient data:', err)
  }
}

const fetchHealthWorkers = async () => {
  try {
    console.log('🔄 [EditVaccination] Fetching health staff...')
    const res = await api.get('/health-staff')
    console.log('✅ [EditVaccination] Health workers API response:', res.data)
    
    // Handle different possible response structures
    let list = []
    if (res.data?.data?.healthWorkers && Array.isArray(res.data.data.healthWorkers)) {
      list = res.data.data.healthWorkers
    } else if (res.data?.data?.healthStaff && Array.isArray(res.data.data.healthStaff)) {
      list = res.data.data.healthStaff
    } else if (Array.isArray(res.data)) {
      list = res.data
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      list = res.data.data
    } else if (res.data?.users && Array.isArray(res.data.users)) {
      list = res.data.users
    } else if (res.data?.healthWorkers && Array.isArray(res.data.healthWorkers)) {
      list = res.data.healthWorkers
    } else if (res.data?.healthStaff && Array.isArray(res.data.healthStaff)) {
      list = res.data.healthStaff
    } else {
      console.warn('Unexpected health workers response structure:', res.data)
      list = []
    }
    
    console.log('👥 [EditVaccination] Health workers list:', list)
    
    // Role helpers
    const rawRole = (hw) => String(hw.hs_type || hw.hw_type || hw.role || hw.type || '').toLowerCase()
    const isNurseOrNutritionistRole = (r) => {
      const s = r.toLowerCase()
      return s.includes('nurse') || s.includes('rn') || s.includes('nutritionist') || s.includes('dietitian') || s.includes('nd')
    }
    const displayRole = (r) => {
      if (isNurseOrNutritionistRole(r)) {
        return r.includes('nutrition') || r.includes('diet') ? 'Nutritionist' : 'Nurse'
      }
      return r || 'Health Staff'
    }
    
    // For vaccination form: show Nurses and Nutritionists only
    nurses.value = list
      .filter(hw => isNurseOrNutritionistRole(rawRole(hw)))
      .map(hw => ({
        user_id: hw.user_id || hw.id || hw.health_worker_id,
        fullname: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
        hs_type: displayRole(rawRole(hw))
      }))
    
    console.log('🎯 [EditVaccination] Processed nurses/nutritionists:', nurses.value)
  } catch (err) {
    console.error('❌ [EditVaccination] Failed to load health workers:', err)
    nurses.value = []
  }
}

const fetchVaccinationRecord = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch patient data and health workers first
    await Promise.all([
      fetchPatientData(),
      fetchHealthWorkers()
    ])

    // Fetch the specific vaccination record
    console.log('🔄 [EditVaccination] Fetching immunization record:', recordId.value)
    const response = await api.get(`/immunizations/${recordId.value}`)
    const record = response.data.data || response.data
    console.log('✅ [EditVaccination] Immunization record:', record)

    vaccinationRecord.value = record

    // Populate form with existing data
    form.value = {
      vaccineName: record.vaccine_antigen_name || record.vaccineName || record.antigen_name || '',
      doseNumber: String(record.dose_number || record.doseNumber || record.dose || ''),
      dateAdministered: formatDateForInput(record.administered_date || record.date_administered || record.dateAdministered),
      ageAtAdministration: record.age_at_administration || record.ageAtAdministration || '',
      administeredBy: record.administered_by || record.administered_by_id || record.healthWorkerId || '',
      siteOfAdministration: deriveSite(record),
      manufacturer: deriveManufacturer(record),
      lotNumber: deriveLotNumber(record),
      facilityName: deriveFacility(record),
      remarks: record.remarks || record.notes || ''
    }

    // Calculate age if not already set
    if (!form.value.ageAtAdministration) {
      calculateAge()
    }

  } catch (err) {
    console.error('❌ [EditVaccination] Error fetching vaccination record:', err)
    error.value = 'Failed to load vaccination record. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    alert('Please fill in all required fields.')
    return
  }

  try {
    saving.value = true

    // Prepare remarks - combine manufacturer, lot number, and remarks
    let fullRemarks = form.value.remarks || ''
    
    if (form.value.manufacturer) {
      fullRemarks = fullRemarks ? `${fullRemarks} | Manufacturer: ${form.value.manufacturer}` : `Manufacturer: ${form.value.manufacturer}`
    }
    
    if (form.value.lotNumber) {
      fullRemarks = fullRemarks ? `${fullRemarks} | Lot: ${form.value.lotNumber}` : `Lot: ${form.value.lotNumber}`
    }

    // Prepare the updated data
    const updateData = {
      administered_date: form.value.dateAdministered,
      dose_number: parseInt(form.value.doseNumber),
      site_of_administration: form.value.siteOfAdministration || null,
      administered_by: form.value.administeredBy,
      facility_name: form.value.facilityName || null,
      remarks: fullRemarks
    }

    console.log('📤 [EditVaccination] Updating immunization:', recordId.value, updateData)

    // Update the vaccination record
    await api.put(`/immunizations/${recordId.value}`, updateData)

    console.log('✅ [EditVaccination] Vaccination record updated successfully')
    alert('Vaccination record updated successfully!')

    // Navigate back to patient details
    handleBack()

  } catch (err) {
    console.error('❌ [EditVaccination] Error saving vaccination record:', err)
    const errorMessage = err.response?.data?.message || 'Failed to update vaccination record. Please try again.'
    alert(errorMessage)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchVaccinationRecord()
})
</script>

<style scoped>
/* Container */
.edit-record-container {
  min-height: 100vh;
  background: #f3f4f6;
  padding-bottom: 100px; /* Extra padding for bottom navbar + buttons */
}

/* Fixed Header Section */
.edit-record-header-section {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 100%;
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-back:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.btn-back:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-title {
  flex: 1;
  min-width: 0;
}

.header-title h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Loading Section */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-section p {
  color: #6b7280;
  margin: 0;
}

/* Error Section */
.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.error-section i {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-section p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  font-size: 0.9375rem;
}

.btn-retry {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Form Content */
.edit-form-content {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 500;
  font-size: 0.9375rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.form-input[readonly] {
  background: #f9fafb;
  color: #6b7280;
}

textarea.form-input {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

select.form-input {
  cursor: pointer;
}

.form-hint {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  position: fixed;
  bottom: 60px; /* Above bottom navbar */
  left: 0;
  right: 0;
  z-index: 50;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 0.875rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-save {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Responsive adjustments */
@media (max-width: 375px) {
  .header-title h1 {
    font-size: 1.125rem;
  }
  
  .form-input {
    font-size: 0.9375rem;
  }
  
  .btn-cancel,
  .btn-save {
    font-size: 0.9375rem;
    padding: 0.75rem;
  }
}
</style>
