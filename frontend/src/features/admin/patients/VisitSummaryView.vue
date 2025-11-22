<template>
  <div class="container-fluid py-4">
    <!-- Page Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">
          Visit Summary
        </h1>
        <p class="text-muted mb-0">
          Patient visit record and medical history
        </p>
      </div>
      <div class="d-flex gap-2">
        <button
          type="button"
          class="btn btn-outline-primary"
          :disabled="!isOnline"
          @click="enableEditMode"
        >
          <i class="bi bi-pencil-square me-2" />
          Edit Visit
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary"
          @click="$router.go(-1)"
        >
          <i class="bi bi-arrow-left me-2" />
          Back
        </button>
      </div>
    </div>

    <!-- Visit Summary Card -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-primary text-white">
        <h6 class="card-title mb-0">
          <i class="bi bi-clipboard-data me-2" />
          Visit Information
        </h6>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="d-flex align-items-center">
              <i class="bi bi-person-circle text-primary me-3 fs-4" />
              <div>
                <small class="text-muted d-block">Patient</small>
                <strong class="text-dark">{{ patientDisplayName }}</strong>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex align-items-center">
              <i class="bi bi-calendar-event text-success me-3 fs-4" />
              <div>
                <small class="text-muted d-block">Visit Date</small>
                <strong class="text-dark">{{ formatDate(form.visit_date) }}</strong>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex align-items-center">
              <i class="bi bi-person-badge text-info me-3 fs-4" />
              <div>
                <small class="text-muted d-block">Health Staff</small>
                <strong class="text-dark">{{ healthStaffName }}</strong>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex align-items-center">
              <i
                :class="hasOutsideInVisit ? 'bi bi-house-door text-warning' : 'bi bi-building text-secondary'"
                class="me-3 fs-4"
              />
              <div>
                <small class="text-muted d-block">Service Location</small>
                <span :class="hasOutsideInVisit ? 'badge bg-warning text-dark' : 'badge bg-secondary'">
                  {{ hasOutsideInVisit ? 'Outside Facility' : 'In-Facility' }}
                </span>
              </div>
            </div>
          </div>
          <div
            v-if="form.findings"
            class="col-12"
          >
            <div class="d-flex align-items-start">
              <i class="bi bi-journal-text text-info me-3 fs-4 mt-1" />
              <div class="flex-grow-1">
                <small class="text-muted d-block">Clinical Findings</small>
                <p class="text-dark mb-0">
                  {{ form.findings }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Services Provided Card -->
    <div
      v-if="localCollectedVaccinations && localCollectedVaccinations.length > 0"
      class="card border-0 shadow-sm mb-4"
    >
      <div class="card-header bg-success text-white">
        <h6 class="card-title mb-0">
          <i class="bi bi-check-circle-fill me-2" />
          Services Provided
        </h6>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-12">
            <div
              v-for="(service, index) in localCollectedVaccinations"
              :key="index"
              class="service-item mb-3 p-3 bg-light rounded"
            >
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-shield-check text-success me-3 fs-5" />
                <div class="flex-grow-1">
                  <h6 class="mb-1 text-dark">
                    {{ service.vaccine_name || service.antigen_name || 'Unknown Vaccine' }}
                  </h6>
                  <div class="service-details text-muted small">
                    <span class="badge bg-success me-2">Vaccination</span>
                    <span>Dose {{ service.dose_number || 'N/A' }}</span>
                    <span class="ms-2">• </span>
                    <span>{{ formatDate(service.administered_date) }}</span>
                    <span
                      v-if="service.outside"
                      class="ms-2"
                    >• </span>
                    <span
                      v-if="service.outside"
                      class="badge bg-warning text-dark ms-1"
                    >Outside Facility</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vital Signs Card -->
    <div
      v-if="hasVitalSigns"
      class="card border-0 shadow-sm mb-4"
    >
      <div class="card-header bg-info text-white">
        <h6 class="card-title mb-0">
          <i class="bi bi-heart-pulse me-2" />
          Vital Signs
        </h6>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div
            v-if="form.vitals.temperature"
            class="col-md-6 col-lg-4"
          >
            <div class="vital-sign-item p-3 bg-light rounded">
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-thermometer-half text-danger me-3 fs-4" />
                <div>
                  <small class="text-muted d-block">Temperature</small>
                  <strong class="text-dark fs-5">{{ form.vitals.temperature }}°C</strong>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="form.vitals.muac"
            class="col-md-6 col-lg-4"
          >
            <div class="vital-sign-item p-3 bg-light rounded">
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-rulers text-warning me-3 fs-4" />
                <div>
                  <small class="text-muted d-block">MUAC</small>
                  <strong class="text-dark fs-5">{{ form.vitals.muac }} cm</strong>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="form.vitals.respiration"
            class="col-md-6 col-lg-4"
          >
            <div class="vital-sign-item p-3 bg-light rounded">
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-lungs text-success me-3 fs-4" />
                <div>
                  <small class="text-muted d-block">Respiration</small>
                  <strong class="text-dark fs-5">{{ form.vitals.respiration }} breaths/min</strong>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="form.vitals.weight"
            class="col-md-6 col-lg-4"
          >
            <div class="vital-sign-item p-3 bg-light rounded">
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-speedometer2 text-primary me-3 fs-4" />
                <div>
                  <small class="text-muted d-block">Weight</small>
                  <strong class="text-dark fs-5">{{ form.vitals.weight }} kg</strong>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="form.vitals.height"
            class="col-md-6 col-lg-4"
          >
            <div class="vital-sign-item p-3 bg-light rounded">
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-arrows-vertical text-info me-3 fs-4" />
                <div>
                  <small class="text-muted d-block">Height</small>
                  <strong class="text-dark fs-5">{{ form.vitals.height }} cm</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Services Message -->
    <div
      v-else-if="!localCollectedVaccinations || localCollectedVaccinations.length === 0"
      class="card border-0 shadow-sm mb-4"
    >
      <div class="card-body text-center py-5">
        <i class="bi bi-info-circle text-muted fs-1 mb-3" />
        <h5 class="text-muted">
          No Services Recorded
        </h5>
        <p class="text-muted mb-0">
          This visit has no recorded services or vaccinations.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { utcToPH } from '@/utils/dateUtils'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { adminDB } from '@/services/offline/adminOfflineDB'
import { addToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { isOnline } = useOnlineStatus()

const props = defineProps({
  existingVisitId: { type: [String, Number], required: false, default: null }
})

const patients = ref([])
const loading = ref(false)
const selectedPatientData = ref(null)
const hasOutsideInVisit = ref(false)

const localCollectedVaccinations = ref([])

const form = ref({
  patient_id: '',
  recorded_by: '',
  visit_date: '',
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

// Display name for the selected patient
const patientDisplayName = computed(() => {
  if (selectedPatientData.value) {
    const p = selectedPatientData.value
    const parts = [
      p.firstname || p.first_name || p.firstName,
      p.middlename || p.middle_name || p.middleName,
      p.surname || p.last_name || p.lastName
    ].filter(Boolean)
    const name = parts.join(' ').trim()
    if (name) return name
  }
  try {
    const opt = (patients.value || []).find(o => String(o.id) === String(form.value.patient_id))
    return opt?.childInfo?.name || '—'
  } catch {
    return '—'
  }
})

// Check if any vital signs are recorded
const hasVitalSigns = computed(() => {
  const v = form.value.vitals || {}
  return [v.temperature, v.muac, v.respiration, v.weight, v.height].some(x => x !== '' && x !== null && typeof x !== 'undefined')
})

// Get health staff name from recorded_by (visits_view already returns the name)
const healthStaffName = computed(() => {
  return form.value.recorded_by || '—'
})

const fetchPatients = async () => {
  try {
    if (isOnline.value) {
      const params = { limit: 100 }
      const res = await api.get('/patients', { params })
      const payload = res.data?.data || {}
      const list = payload.patients || payload.items || payload || []
      patients.value = list.map(p => ({ id: p.patient_id || p.id, childInfo: { name: [p.firstname, p.middlename, p.surname].filter(Boolean).join(' ').trim() } }))
    } else {
      // Offline: use cached patients
      if (!adminDB.isOpen()) await adminDB.open()
      const cachedPatients = await adminDB.patients.toArray()
      patients.value = cachedPatients.map(p => ({ 
        id: p.patient_id || p.id, 
        childInfo: { name: p.full_name || [p.firstname, p.middlename, p.surname].filter(Boolean).join(' ').trim() } 
      }))
    }
  } catch (err) {
    console.error('Failed to load patients', err)
    patients.value = []
  }
}

const fetchSelectedPatientData = async (patientId) => {
  if (!patientId) return

  try {
    if (isOnline.value) {
      const response = await api.get(`/patients/${patientId}`)
      selectedPatientData.value = response.data?.data || null
    } else {
      // Offline: use cached patient
      if (!adminDB.isOpen()) await adminDB.open()
      const cachedPatient = await adminDB.patients.get(Number(patientId))
      selectedPatientData.value = cachedPatient || null
    }
  } catch (error) {
    console.error('Error fetching patient details', error)
    // Try offline fallback if online fails
    if (isOnline.value) {
      try {
        if (!adminDB.isOpen()) await adminDB.open()
        const cachedPatient = await adminDB.patients.get(Number(patientId))
        selectedPatientData.value = cachedPatient || null
      } catch {
        selectedPatientData.value = null
      }
    } else {
      selectedPatientData.value = null
    }
  }
}

const fetchExistingVisit = async (visitId) => {
  try {
    loading.value = true
    let data = {}

    if (isOnline.value) {
      const res = await api.get(`/visits/${visitId}`)
      data = res.data?.data || res.data || {}
    } else {
      // Offline: use cached visit
      if (!adminDB.isOpen()) await adminDB.open()
      const cachedVisit = await adminDB.visits.get(Number(visitId))
      if (!cachedVisit) {
        console.warn(`Visit ${visitId} not found in offline cache`)
        loading.value = false
        return
      }
      data = cachedVisit
    }

    form.value.patient_id = String(data.patient_id || '')
    form.value.recorded_by = String(data.recorded_by || '')
    form.value.visit_date = data.visit_date ? utcToPH(data.visit_date).format('YYYY-MM-DD') : ''
    form.value.findings = data.findings || ''
    form.value.service_rendered = data.service_rendered || ''

    // Determine if any immunization was recorded as outside
    try {
      const immunizations = Array.isArray(data.immunizations_given) ? data.immunizations_given : (Array.isArray(data.immunizations) ? data.immunizations : [])
      hasOutsideInVisit.value = immunizations.some(im => im?.outside === true)
    } catch {
      hasOutsideInVisit.value = false
    }

    // Vitals mapping - check multiple possible structures
    // 1. Nested vitals object
    if (data.vitals && typeof data.vitals === 'object') {
      form.value.vitals = {
        temperature: data.vitals.temperature ?? '',
        muac: data.vitals.muac ?? '',
        respiration: data.vitals.respiration ?? data.vitals.respiration_rate ?? '',
        weight: data.vitals.weight ?? '',
        height: data.vitals.height ?? data.vitals.height_length ?? ''
      }
    } 
    // 2. Nested vital_signs object
    else if (data.vital_signs && typeof data.vital_signs === 'object') {
      const vs = data.vital_signs
      form.value.vitals = {
        temperature: vs.temperature ?? '',
        muac: vs.muac ?? '',
        respiration: vs.respiration_rate ?? vs.respiration ?? '',
        weight: vs.weight ?? '',
        height: vs.height_length ?? vs.height ?? ''
      }
    } 
    // 3. Top-level fields (from visits_view or cached visits - this is the offline case!)
    else if (data.temperature !== undefined || data.muac !== undefined || data.respiration_rate !== undefined || data.weight !== undefined || data.height_length !== undefined || data.height !== undefined) {
      form.value.vitals = {
        temperature: data.temperature ?? '',
        muac: data.muac ?? '',
        respiration: data.respiration_rate ?? data.respiratory_rate ?? data.respiration ?? '',
        weight: data.weight ?? '',
        height: data.height_length ?? data.height ?? ''
      }
    } 
    // 4. Last resort: fetch from vitals endpoint (only when online)
    else {
      try {
        if (isOnline.value) {
          const vitalsRes = await api.get(`/vitals/${visitId}`)
          const v = vitalsRes.data?.data || vitalsRes.data || {}
          form.value.vitals = {
            temperature: v.temperature ?? '',
            muac: v.muac ?? '',
            respiration: v.respiration_rate ?? v.respiration ?? '',
            weight: v.weight ?? '',
            height: v.height_length ?? v.height ?? ''
          }
        } else {
          // Offline: try cached vitals
          if (!adminDB.isOpen()) await adminDB.open()
          const cachedVitals = await adminDB.vitalsigns.where('visit_id').equals(Number(visitId)).first()
          if (cachedVitals) {
            form.value.vitals = {
              temperature: cachedVitals.temperature ?? '',
              muac: cachedVitals.muac ?? '',
              respiration: cachedVitals.respiration_rate ?? cachedVitals.respiration ?? '',
              weight: cachedVitals.weight ?? '',
              height: cachedVitals.height_length ?? cachedVitals.height ?? ''
            }
          } else {
            form.value.vitals = { temperature: '', muac: '', respiration: '', weight: '', height: '' }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch vitals:', e)
        form.value.vitals = { temperature: '', muac: '', respiration: '', weight: '', height: '' }
      }
    }

    if (form.value.patient_id) {
      fetchSelectedPatientData(form.value.patient_id)
    }

    // Populate immunizations
    try {
      const immunizations = Array.isArray(data.immunizations_given) ? data.immunizations_given : (Array.isArray(data.immunizations) ? data.immunizations : [])
      if (immunizations.length > 0) {
        localCollectedVaccinations.value = immunizations.map(im => ({
          patient_id: im.patient_id || form.value.patient_id,
          vaccine_id: im.vaccine_id,
          inventory_id: im.inventory_id,
          vaccine_name: im.vaccine_name || im.antigen_name || im.vaccineName,
          disease_prevented: im.disease_prevented,
          dose_number: im.dose_number || im.doseNumber,
          administered_date: im.administered_date,
          age_at_administration: im.age_at_administration,
          administered_by: im.administered_by,
          facility_name: im.facility_name,
          remarks: im.remarks,
          outside: im.outside || false
        }))
      } else {
        localCollectedVaccinations.value = []
      }
    } catch (e) {
      console.warn('Failed to populate immunizations', e)
      localCollectedVaccinations.value = []
    }
  } catch (e) {
    console.warn('Failed to load existing visit details', e)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const enableEditMode = () => {
  if (!isOnline.value) {
    addToast({
      title: 'Offline Mode',
      message: 'Cannot edit visit while offline. Please connect to the internet to edit visit records.',
      type: 'warning',
      timeout: 5000
    })
    return
  }
  const patientId = route.params.patientId
  const visitId = route.params.visitId || props.existingVisitId
  router.push(`/admin/patients/${patientId}/visits/${visitId}/edit`)
}

onMounted(() => {
  fetchPatients()
  const visitId = route.params.visitId || props.existingVisitId
  if (visitId) {
    fetchExistingVisit(String(visitId))
  }
})

watch(() => props.existingVisitId, (newId) => {
  if (newId) {
    fetchExistingVisit(String(newId))
  }
})

watch(() => route.params.visitId, (newId) => {
  if (newId) {
    fetchExistingVisit(String(newId))
  }
})
</script>

<style scoped>
.service-item {
  border-left: 4px solid #198754;
  transition: all 0.2s ease;
}

.service-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.service-details .badge {
  font-size: 0.75em;
}

.vital-sign-item {
  border-left: 4px solid #0dcaf0;
  transition: all 0.2s ease;
}

.vital-sign-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.text-primary { color: #0d6efd !important; }
.text-success { color: #198754 !important; }
.text-info { color: #0dcaf0 !important; }
.text-warning { color: #ffc107 !important; }
.text-secondary { color: #6c757d !important; }
.text-danger { color: #dc3545 !important; }
</style>