<template>
  <div class="modal fade" :class="{ show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Add Patient Visit / Record</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveVisit">
            <div class="mb-3">
              <label class="form-label">Patient *</label>
              <select class="form-select" v-model="form.patient_id" required>
                <option value="">Select patient</option>
                <option v-for="p in patients" :key="p.id" :value="p.id">{{ p.childInfo.name }}</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Health Worker (BHW) *</label>
              <select class="form-select" v-model="form.recorded_by" required>
                <option value="">Select health worker</option>
                <option v-for="hw in healthWorkers" :key="hw.user_id" :value="hw.user_id">{{ hw.fullname || hw.name }}</option>
              </select>
            </div>

            <h6 class="mb-2">Vital Signs</h6>
            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <label class="form-label">Temperature (°C)</label>
                <input type="number" step="0.1" class="form-control" v-model="form.vitals.temperature">
              </div>
              <div class="col-md-4">
                <label class="form-label">MUAC (cm)</label>
                <input type="number" step="0.1" class="form-control" v-model="form.vitals.muac">
              </div>
              <div class="col-md-4">
                <label class="form-label">Respiration (breaths/min)</label>
                <input type="number" class="form-control" v-model="form.vitals.respiration">
              </div>
              <div class="col-md-4">
                <label class="form-label">Weight (kg)</label>
                <input type="number" step="0.01" class="form-control" v-model="form.vitals.weight">
              </div>
              <div class="col-md-4">
                <label class="form-label">Height (cm)</label>
                <input type="number" step="0.1" class="form-control" v-model="form.vitals.height">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Service Options</label>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-primary" @click="openVaccinationModal">Add Vaccine</button>
                <button type="button" class="btn btn-outline-secondary" @click="openDewormModal">Deworm</button>
                <button type="button" class="btn btn-outline-info" @click="openVitAModal">Vitamin A</button>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Findings (auto-filled after interventions)</label>
              <textarea class="form-control" rows="3" v-model="form.findings" readonly></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label">Service Rendered (auto-filled)</label>
              <textarea class="form-control" rows="3" v-model="form.service_rendered" readonly></textarea>
            </div>

            <!-- Collected Vaccinations Display -->
            <div v-if="collectedVaccinations && collectedVaccinations.length > 0" class="mb-3">
              <label class="form-label">Vaccines to be Administered During Visit</label>
              <div class="border rounded p-2 bg-light">
                <div v-for="(vacc, index) in collectedVaccinations" :key="index" class="d-flex justify-content-between align-items-center mb-1">
                  <span><strong>{{ vacc.vaccine_name || 'Unknown Vaccine' }}</strong> - {{ formatDate(vacc.administered_date) }}</span>
                  <span class="badge bg-info">Will be saved with visit</span>
                </div>
              </div>
              <small class="text-muted">These vaccines will be administered and recorded when you save the visit.</small>
            </div>

            <div class="text-end">
              <button type="button" class="btn btn-secondary me-2" @click="$emit('close')">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Visit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Vaccination Modal -->
  <div class="modal fade" :class="{ show: showVaccinationModal }" :style="{ display: showVaccinationModal ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-plus-circle me-2"></i>
            Add Vaccine to Visit
          </h5>
          <button type="button" class="btn-close" @click="closeVaccinationModal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveVaccination">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Vaccine *</label>
                <select class="form-select" v-model="vaccinationForm.inventoryId" @change="onVaccineSelect" required>
                  <option value="">Select a vaccine stock</option>
                  <option v-for="v in vaccineOptions" :key="v.inventory_id" :value="v.inventory_id">
                    {{ v.display_name }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Disease Prevented</label>
                <input type="text" class="form-control" v-model="vaccinationForm.diseasePrevented" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Dose Number *</label>
                <select class="form-select" v-model="vaccinationForm.doseNumber" required>
                  <option value="">Select dose</option>
                  <option v-for="dose in availableDoses" :key="dose" :value="dose">
                    Dose {{ dose }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Date Administered *</label>
                <input type="date" class="form-control" v-model="vaccinationForm.dateAdministered" required @change="updateAgeCalculation">
              </div>
              <div class="col-md-6">
                <label class="form-label">Age at Administration</label>
                <input type="text" class="form-control" v-model="vaccinationForm.ageAtAdministration" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Manufacturer</label>
                <input type="text" class="form-control" v-model="vaccinationForm.vaccineManufacturer" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Lot Number</label>
                <input type="text" class="form-control" v-model="vaccinationForm.lotNumber" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Site of Administration</label>
                <select class="form-select" v-model="vaccinationForm.siteOfAdministration">
                  <option value="">Select a site</option>
                  <option value="Left arm (deltoid)">Left arm (deltoid)</option>
                  <option value="Right arm (deltoid)">Right arm (deltoid)</option>
                  <option value="Left thigh (anterolateral)">Left thigh (anterolateral)</option>
                  <option value="Right thigh (anterolateral)">Right thigh (anterolateral)</option>
                  <option value="Oral">Oral</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Health Worker *</label>
                <select class="form-select" v-model="vaccinationForm.healthWorkerId" required>
                  <option value="">Select health worker</option>
                  <option v-for="nurse in nurses" :key="nurse.user_id || nurse.id" :value="nurse.user_id || nurse.id">
                    {{ nurse.fullname }} ({{ nurse.hw_type }})
                  </option>
                  <option v-if="nurses.length === 0" disabled>No nurses/nutritionists available</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Facility Name</label>
                <input type="text" class="form-control" v-model="vaccinationForm.facilityName">
              </div>
              <div class="col-md-6">
                <label class="form-label">Remarks</label>
                <input type="text" class="form-control" v-model="vaccinationForm.remarks">
              </div>
            </div>
            <div class="text-end mt-3">
              <button type="button" class="btn btn-secondary me-2" @click="closeVaccinationModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="savingVaccination">
                <span v-if="savingVaccination" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ savingVaccination ? 'Adding...' : 'Add to Visit' }}
              </button>
            </div>
            
            <!-- Debug info -->
            <div v-if="false" class="mt-3 p-2 bg-light border rounded">
              <small class="text-muted">Debug: {{ nurses.length }} nurses/nutritionists available</small>
              <pre class="small">{{ JSON.stringify(nurses, null, 2) }}</pre>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Backdrop -->
  <div v-if="showVaccinationModal" class="modal-backdrop fade show" @click="closeVaccinationModal"></div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
const { addToast } = useToast()

const props = defineProps({
  show: { type: Boolean, default: false },
  collectedVaccinations: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'saved', 'open-vaccination', 'open-deworm', 'open-vita', 'update-collected-vaccinations'])

const patients = ref([])
const healthWorkers = ref([]) // BHW for visit recording
const nurses = ref([]) // Nurses for vaccination administration
const loading = ref(false)
const selectedPatientData = ref(null)
const showVaccinationModal = ref(false)
const savingVaccination = ref(false)
const vaccineOptions = ref([])
const availableDoses = ref([1, 2, 3, 4, 5]) // Default doses, can be made dynamic later

// Use computed to get collected vaccinations from props
const collectedVaccinations = computed(() => props.collectedVaccinations || [])

const form = ref({
  patient_id: '',
  recorded_by: '',
  visit_date: new Date().toISOString().split('T')[0],
  vitals: {
    temperature: '',
    muac: '',
    respiration: '',
    weight: '',
    height: ''
  },
  findings: '',
  service_rendered: ''
})

const vaccinationForm = ref({
  inventoryId: '',
  vaccineName: '',
  diseasePrevented: '',
  doseNumber: '',
  dateAdministered: new Date().toISOString().split('T')[0],
  ageAtAdministration: '',
  vaccineManufacturer: '',
  lotNumber: '',
  siteOfAdministration: '',
  healthWorkerId: '',
  facilityName: '',
  remarks: ''
})

const fetchPatients = async () => {
  try {
    const res = await api.get('/patients')
    const payload = res.data?.data || {}
    const list = payload.patients || payload.items || payload || []
    patients.value = list.map(p => ({ id: p.patient_id || p.id, childInfo: { name: [p.firstname, p.middlename, p.surname].filter(Boolean).join(' ').trim() } }))
  } catch (err) {
    console.error('Failed to load patients for visit editor', err)
    patients.value = []
  }
}

const fetchHealthWorkers = async () => {
  try {
    console.log('🔄 [VisitEditor] Fetching health workers...')
    const res = await api.get('/health-workers')
    console.log('✅ [VisitEditor] Health workers API response:', res.data)
    
    // Handle different possible response structures - prioritize new backend structure
    let list = []
    if (res.data?.data?.healthWorkers && Array.isArray(res.data.data.healthWorkers)) {
      list = res.data.data.healthWorkers
    } else if (Array.isArray(res.data)) {
      list = res.data
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      list = res.data.data
    } else if (res.data?.users && Array.isArray(res.data.users)) {
      list = res.data.users
    } else if (res.data?.healthWorkers && Array.isArray(res.data.healthWorkers)) {
      list = res.data.healthWorkers
    } else {
      console.warn('Unexpected health workers response structure:', res.data)
      list = []
    }
    
    console.log('👥 [VisitEditor] Health workers list:', list)
    
    // For visit form (recorded_by): only show BHW
    healthWorkers.value = list
      .filter(hw => {
        const hwType = hw.hw_type || hw.role || hw.type || ''
        return hwType.toLowerCase().includes('bhw')
      })
      .map(hw => ({
        user_id: hw.user_id || hw.id || hw.health_worker_id,
        fullname: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
        hw_type: hw.hw_type || hw.role || hw.type
      }))
    
    // For vaccination form (administered_by): show nurses and nutritionists
    nurses.value = list
      .filter(hw => {
        const hwType = hw.hw_type || hw.role || hw.type || ''
        return hwType.toLowerCase().includes('nurse') || hwType.toLowerCase().includes('nutritionist')
      })
      .map(hw => ({
        user_id: hw.user_id || hw.id || hw.health_worker_id,
        fullname: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
        hw_type: hw.hw_type || hw.role || hw.type
      }))
    
    console.log('🎯 [VisitEditor] Processed BHW for visit recording:', healthWorkers.value)
    console.log('🎯 [VisitEditor] Processed nurses and nutritionists for vaccination:', nurses.value)
    console.log('🔍 [VisitEditor] Available HW types in data:', [...new Set(list.map(hw => hw.hw_type || hw.role || hw.type))])
  } catch (err) {
    console.error('❌ [VisitEditor] Failed to load health workers:', err)
    healthWorkers.value = []
    nurses.value = []
  }
}

const fetchVaccineOptions = async () => {
  try {
    console.log('🔄 [VisitEditor] Fetching vaccine options...')
    const res = await api.get('/vaccines/inventory')
    console.log('✅ [VisitEditor] Vaccine inventory API response:', res.data)
    const payload = res.data?.data || []
    console.log('💉 [VisitEditor] Vaccine inventory list:', payload)
    vaccineOptions.value = payload.map(v => ({
      inventory_id: v.inventory_id || v.id,
      display_name: `${v.vaccinemaster?.antigen_name || v.vaccine_name || 'Unknown'} (${v.vaccinemaster?.disease_prevented || v.disease_prevented || 'Unknown'}) - Lot: ${v.lot_number || 'N/A'} - Exp: ${v.expiration_date ? formatDate(v.expiration_date) : 'N/A'}`,
      vaccine_name: v.vaccinemaster?.antigen_name || v.vaccine_name,
      disease_prevented: v.vaccinemaster?.disease_prevented || v.disease_prevented,
      manufacturer: v.vaccinemaster?.manufacturer || v.manufacturer,
      lot_number: v.lot_number,
      expiration_date: v.expiration_date
    }))
    console.log('🎯 [VisitEditor] Processed vaccine options:', vaccineOptions.value)
  } catch (err) {
    console.error('❌ [VisitEditor] Failed to load vaccine options:', err)
    vaccineOptions.value = []
  }
}

const fetchSelectedPatientData = async (patientId) => {
  if (!patientId) {
    selectedPatientData.value = null
    return
  }
  
  try {
    const response = await api.get(`/patients/${patientId}`)
    selectedPatientData.value = response.data?.data || null
    console.log('Fetched patient data for VisitEditor:', selectedPatientData.value)
  } catch (error) {
    console.error('Error fetching patient details for VisitEditor:', error)
    selectedPatientData.value = null
  }
}

const openVaccinationModal = (patientId = null) => {
  const selectedPatientId = patientId || form.value.patient_id
  if (!selectedPatientId || selectedPatientId === '') {
    addToast({ title: 'Error', message: 'Please select a patient first', type: 'error' })
    return
  }
  
  // Reset vaccination form
  vaccinationForm.value = {
    inventoryId: '',
    vaccineName: '',
    diseasePrevented: '',
    doseNumber: '',
    dateAdministered: new Date().toISOString().split('T')[0],
    ageAtAdministration: '',
    vaccineManufacturer: '',
    lotNumber: '',
    siteOfAdministration: '',
    healthWorkerId: '',
    facilityName: '',
    remarks: ''
  }
  
  // Calculate age immediately with default date
  updateAgeCalculation()
  
  showVaccinationModal.value = true
}
const openDewormModal = (patientId = null) => {
  const selectedPatientId = patientId || form.value.patient_id
  if (!selectedPatientId || selectedPatientId === '') {
    addToast({ title: 'Error', message: 'Please select a patient first', type: 'error' })
    return
  }
  emit('open-deworm', selectedPatientId, selectedPatientData.value)
}
const openVitAModal = (patientId = null) => {
  const selectedPatientId = patientId || form.value.patient_id
  if (!selectedPatientId || selectedPatientId === '') {
    addToast({ title: 'Error', message: 'Please select a patient first', type: 'error' })
    return
  }
  emit('open-vita', selectedPatientId, selectedPatientData.value)
}

const onVaccineSelect = () => {
  if (!vaccinationForm.value.inventoryId) {
    vaccinationForm.value.diseasePrevented = ''
    vaccinationForm.value.doseNumber = ''
    vaccinationForm.value.vaccineManufacturer = ''
    vaccinationForm.value.lotNumber = ''
    vaccinationForm.value.vaccineName = ''
    return
  }

  // Get vaccine data from already loaded vaccineOptions
  const selectedVaccine = vaccineOptions.value.find(v => v.inventory_id === vaccinationForm.value.inventoryId)
  if (selectedVaccine) {
    vaccinationForm.value.vaccineName = selectedVaccine.vaccine_name || ''
    vaccinationForm.value.diseasePrevented = selectedVaccine.disease_prevented || ''
    vaccinationForm.value.vaccineManufacturer = selectedVaccine.manufacturer || ''
    vaccinationForm.value.lotNumber = selectedVaccine.lot_number || ''
    console.log('Auto-filled vaccine data:', {
      vaccineName: vaccinationForm.value.vaccineName,
      diseasePrevented: vaccinationForm.value.diseasePrevented,
      manufacturer: vaccinationForm.value.vaccineManufacturer,
      lotNumber: vaccinationForm.value.lotNumber
    })
  } else {
    console.warn('Selected vaccine not found in options')
  }
}

const saveVaccination = async () => {
  try {
    savingVaccination.value = true

    // Concatenate site of administration into remarks
    const remarksWithSite = vaccinationForm.value.siteOfAdministration 
      ? `${vaccinationForm.value.remarks || ''} (Site: ${vaccinationForm.value.siteOfAdministration})`.trim()
      : vaccinationForm.value.remarks || ''

    const vaccinationData = {
      patient_id: form.value.patient_id,
      inventory_id: vaccinationForm.value.inventoryId,
      disease_prevented: vaccinationForm.value.diseasePrevented,
      dose_number: vaccinationForm.value.doseNumber,
      administered_date: vaccinationForm.value.dateAdministered,
      age_at_administration: vaccinationForm.value.ageAtAdministration,
      administered_by: vaccinationForm.value.healthWorkerId,
      facility_name: vaccinationForm.value.facilityName,
      remarks: remarksWithSite
    }

    console.log('🔄 [VISIT_VACCINATION] Adding vaccination to visit collection:', vaccinationData)

    // Add to collected vaccinations (will be saved with visit)
    const collectedVaccinationsArray = [...collectedVaccinations.value]
    collectedVaccinationsArray.push(vaccinationData)

    // Emit the updated collected vaccinations to parent
    emit('update-collected-vaccinations', collectedVaccinationsArray)

    addToast({ title: 'Success', message: 'Vaccine added to visit. Will be administered when you save the visit.', type: 'success' })
    closeVaccinationModal()
  } catch (err) {
    console.error('❌ [VISIT_VACCINATION] Error saving vaccination', err)
    addToast({ title: 'Error', message: 'Failed to administer vaccine', type: 'error' })
  } finally {
    savingVaccination.value = false
  }
}

const updateAgeCalculation = () => {
  if (selectedPatientData.value?.date_of_birth && vaccinationForm.value.dateAdministered) {
    vaccinationForm.value.ageAtAdministration = calculateAgeAtDate(
      selectedPatientData.value.date_of_birth, 
      vaccinationForm.value.dateAdministered
    )
  }
}

const closeVaccinationModal = () => {
  showVaccinationModal.value = false
  // Reset form when closing
  vaccinationForm.value = {
    inventoryId: '',
    vaccineName: '',
    diseasePrevented: '',
    doseNumber: '',
    dateAdministered: new Date().toISOString().split('T')[0],
    ageAtAdministration: '',
    vaccineManufacturer: '',
    lotNumber: '',
    siteOfAdministration: '',
    healthWorkerId: '',
    facilityName: '',
    remarks: ''
  }
}

const saveVisit = async () => {
  try {
    loading.value = true

    // Prepare the visit payload with collected vaccinations and services
    const visitPayload = {
      ...form.value,
      collectedVaccinations: props.collectedVaccinations || [],
      services: [] // Add services array for future use (deworming, etc.)
    }

    console.log('🔄 [VISIT_SAVE_FRONTEND] Preparing to save visit with payload:', visitPayload)

    // Save the visit (this will handle all related data atomically)
    const visitResponse = await api.post('/visits', visitPayload)
    const visitData = visitResponse.data
    console.log('✅ [VISIT_SAVE_FRONTEND] Visit created successfully:', visitData)

    addToast({ title: 'Saved', message: 'Visit record created successfully', type: 'success' })
    emit('saved')
    emit('close')
  } catch (err) {
    console.error('❌ [VISIT_SAVE_FRONTEND] Error saving visit', err)
    addToast({ title: 'Error', message: 'Failed to save visit', type: 'error' })
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const calculateAgeAtDate = (birthDate, targetDate) => {
  if (!birthDate || !targetDate) return ''
  
  const birth = new Date(birthDate)
  const target = new Date(targetDate)
  
  let years = target.getFullYear() - birth.getFullYear()
  let months = target.getMonth() - birth.getMonth()
  let days = target.getDate() - birth.getDate()
  
  if (days < 0) {
    months--
    const lastMonth = new Date(target.getFullYear(), target.getMonth() - 1, birth.getDate())
    days += Math.round((target - lastMonth) / (1000 * 60 * 60 * 24))
  }
  
  if (months < 0) {
    years--
    months += 12
  }
  
  // Return in months and days format
  if (years === 0) {
    if (months === 0) {
      return `${days} day${days !== 1 ? 's' : ''} old`
    } else {
      return `${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} old`
    }
  } else {
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} old`
  }
}

onMounted(() => {
  fetchPatients()
  fetchHealthWorkers()
  fetchVaccineOptions()
})

// Watch for patient selection changes to fetch patient details
watch(() => form.value.patient_id, (newPatientId) => {
  if (newPatientId) {
    fetchSelectedPatientData(newPatientId)
  } else {
    selectedPatientData.value = null
  }
})

// Watch for vaccination date changes to recalculate age
watch(() => vaccinationForm.value.dateAdministered, (newDate) => {
  if (newDate && selectedPatientData.value?.date_of_birth && vaccinationForm.value.inventoryId) {
    vaccinationForm.value.ageAtAdministration = calculateAgeAtDate(
      selectedPatientData.value.date_of_birth, 
      newDate
    )
  }
})
</script>

<style scoped>
.modal.show { background-color: rgba(0,0,0,0.5); }
</style>
