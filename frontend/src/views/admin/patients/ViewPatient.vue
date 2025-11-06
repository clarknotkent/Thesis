<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav
        aria-label="breadcrumb"
        class="mb-3"
      >
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">
              Dashboard
            </router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/admin/patients">
              Patient Records
            </router-link>
          </li>
          <li
            class="breadcrumb-item active"
            aria-current="page"
          >
            View Details
          </li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">
            <i class="bi bi-person-circle me-2" />Patient Details
          </h2>
          <p class="text-muted mb-0">
            View patient information and vaccination history
          </p>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-secondary"
            @click="goBack"
          >
            <i class="bi bi-arrow-left me-2" />Back
          </button>
          <router-link
            to="/admin/dashboard"
            class="btn btn-outline-primary"
          >
            <i class="bi bi-house me-2" />Home
          </router-link>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading patient data...</span>
        </div>
        <p class="text-muted mt-2">
          Loading patient information...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="alert alert-danger"
      >
        <i class="bi bi-exclamation-circle me-2" />
        {{ error }} <router-link to="/admin/patients">
          Go back to patient list
        </router-link>
      </div>

      <!-- Patient Details -->
      <div
        v-else
        class="row"
      >
        <!-- Patient Information with Tabs -->
        <div class="col-lg-8 mb-4">
          <div class="card shadow">
            <div class="card-header py-3">
              <!-- Tabs Navigation -->
              <ul class="nav nav-tabs card-header-tabs">
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'info' }"
                    @click="activeTab = 'info'"
                  >
                    <i class="bi bi-person-circle me-2" />Patient Information
                  </button>
                </li>
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'vaccinations' }"
                    @click="activeTab = 'vaccinations'"
                  >
                    <i class="bi bi-shield-check me-2" />Vaccination History
                  </button>
                </li>
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'scheduled' }"
                    @click="activeTab = 'scheduled'"
                  >
                    <i class="bi bi-calendar-check me-2" />Scheduled Vaccinations
                  </button>
                </li>
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'visits' }"
                    @click="activeTab = 'visits'"
                  >
                    <i class="bi bi-clipboard-pulse me-2" />Medical History
                  </button>
                </li>
              </ul>
            </div>
            <div class="card-body p-4">
              <!-- Patient Information Tab -->
              <div v-if="activeTab === 'info'">
                <PatientForm
                  :initial-data="patientData"
                  :guardians="guardians"
                  :is-editing="true"
                  :read-only="true"
                  submit-label="Update Patient"
                />
                <div class="d-flex justify-content-end mt-3">
                  <router-link 
                    :to="{ name: 'EditPatient', params: { id: patientId } }"
                    class="btn btn-primary btn-sm"
                  >
                    <i class="bi bi-pencil-square me-2" />Edit Patient Information
                  </router-link>
                </div>
              </div>

              <!-- Vaccination History Tab -->
              <div v-if="activeTab === 'vaccinations'">
                <VaccinationHistory :patient-id="patientId" />
              </div>

              <!-- Scheduled Vaccinations Tab -->
              <div v-if="activeTab === 'scheduled'">
                <ScheduledVaccinations :patient-id="patientId" />
              </div>

              <!-- Medical History Tab -->
              <div v-if="activeTab === 'visits'">
                <MedicalHistory
                  :patient-id="patientId"
                  :embedded-page="true"
                />
                <div class="d-flex justify-content-end mt-3" />
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar with Stats and Actions -->
        <div class="col-lg-4 d-flex flex-column">
          <!-- Patient Stats Card -->
          <div class="card shadow mb-4 flex-grow-1">
            <div class="card-header py-3">
              <h6 class="m-0 fw-bold text-primary">
                Patient Summary
              </h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <small class="text-muted d-block mb-1">Patient ID</small>
                <strong class="text-primary">{{ patientData.id }}</strong>
              </div>
              <div class="mb-3">
                <small class="text-muted d-block mb-1">Full Name</small>
                <strong>{{ fullName }}</strong>
              </div>
              <div class="mb-3">
                <small class="text-muted d-block mb-1">Age</small>
                <strong>{{ calculateAge(patientData.date_of_birth) }}</strong>
              </div>
              <div class="mb-3">
                <small class="text-muted d-block mb-1">Sex</small>
                <span
                  class="badge"
                  :class="patientData.sex === 'Male' ? 'bg-primary' : 'bg-danger'"
                >
                  {{ patientData.sex }}
                </span>
              </div>
              <div
                v-if="patientData.family_number"
                class="mb-3"
              >
                <small class="text-muted d-block mb-1">Family Number</small>
                <strong>{{ patientData.family_number }}</strong>
              </div>
              <div
                v-if="lastVaccination"
                class="mb-3"
              >
                <small class="text-muted d-block mb-1">Last Vaccination</small>
                <strong>{{ formatDate(lastVaccination) }}</strong>
              </div>
              <div
                v-else
                class="mb-3"
              >
                <small class="text-muted d-block mb-1">Last Vaccination</small>
                <span class="text-warning">No vaccination records</span>
              </div>
            </div>
          </div>
          <!-- QR Code (reuse shared component for parity with BHS/Parent) -->
          <PatientQRCodeCard :patient="patientData" :allow-refresh="true" />
        </div>
      </div>
    </div>

    <!-- Vaccination editor now opens as a dedicated page -->
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import PatientForm from '@/features/admin/patients/PatientForm.vue'
import VaccinationHistory from '@/features/admin/patients/VaccinationHistory.vue'
import ScheduledVaccinations from '@/features/admin/patients/ScheduledVaccinations.vue'
import MedicalHistory from '@/features/admin/patients/MedicalHistory.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import PatientQRCodeCard from '@/features/health-worker/patients/components/PatientQRCodeCard.vue'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const patientData = ref({})
const guardians = ref([])
const loading = ref(true)
const error = ref(null)
const lastVaccination = ref(null)
const activeTab = ref('info')

const patientId = computed(() => route.params.id)

const fullName = computed(() => {
  const parts = [
    patientData.value.firstname,
    patientData.value.middlename,
    patientData.value.surname
  ].filter(Boolean)
  return parts.join(' ')
})

const goBack = () => {
  router.back()
}

const formatForInput = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  } catch (e) {
    return ''
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const calculateAge = (birthDate) => {
  if (!birthDate) return 'Unknown'
  const today = new Date()
  const birth = new Date(birthDate)
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  if (months < 0) {
    years--
    months += 12
  }
  if (years > 0) {
    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`
  } else {
    return `${months} month${months !== 1 ? 's' : ''}`
  }
}

const fetchPatientData = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch guardians first
    const guardianResponse = await api.get('/guardians')
    guardians.value = guardianResponse.data.data || guardianResponse.data || []

    // Fetch patient data
    const response = await api.get(`/patients/${patientId.value}`)
    const p = response.data.data || response.data

    // Map backend fields to form structure
    patientData.value = {
      id: p.id || p.patient_id,
      surname: p.surname || p.lastName || '',
      firstname: p.firstname || p.firstName || '',
      middlename: p.middlename || p.middleName || '',
      sex: p.sex || '',
      date_of_birth: formatForInput(p.date_of_birth || p.dateOfBirth),
      address: p.address || '',
      barangay: p.barangay || '',
      health_center: p.health_center || p.healthCenter || '',
      mother_name: p.mother_name || p.motherName || '',
      mother_occupation: p.mother_occupation || p.motherOccupation || '',
      mother_contact_number: p.mother_contact_number || p.motherContactNumber || '',
      father_name: p.father_name || p.fatherName || '',
      father_occupation: p.father_occupation || p.fatherOccupation || '',
      father_contact_number: p.father_contact_number || p.fatherContactNumber || '',
      guardian_id: p.guardian_id || p.guardianId || null,
      family_number: p.family_number || p.familyNumber || '',
      relationship_to_guardian: p.relationship_to_guardian || p.relationshipToGuardian || '',
      birth_weight: p.birth_weight || p.birthWeight || '',
      birth_length: p.birth_length || p.birthLength || '',
      place_of_birth: p.place_of_birth || p.placeOfBirth || '',
      time_of_birth: (p.medical_history && (p.medical_history.time_of_birth || p.medical_history.timeOfBirth)) || p.time_of_birth || '',
      attendant_at_birth: (p.medical_history && (p.medical_history.attendant_at_birth || p.medical_history.attendantAtBirth)) || p.attendant_at_birth || '',
      type_of_delivery: (p.medical_history && (p.medical_history.type_of_delivery || p.medical_history.typeOfDelivery)) || p.type_of_delivery || '',
      ballards_score: (p.medical_history && (p.medical_history.ballards_score || p.medical_history.ballardsScore)) || p.ballards_score || '',
      newborn_screening_result: (p.medical_history && (p.medical_history.newborn_screening_result || p.medical_history.newbornScreeningResult)) || p.newborn_screening_result || '',
      hearing_test_date: formatForInput((p.medical_history && (p.medical_history.hearing_test_date || p.medical_history.hearingTestDate)) || p.hearing_test_date),
      newborn_screening_date: formatForInput((p.medical_history && (p.medical_history.newborn_screening_date || p.medical_history.newbornScreeningDate)) || p.newborn_screening_date),
      qr: p.qr // Include the QR data from backend
    }

    // Resolve family number from guardian if missing
    if (!patientData.value.family_number && patientData.value.guardian_id && Array.isArray(guardians.value)) {
      const g = guardians.value.find(x => x.guardian_id === patientData.value.guardian_id)
      if (g && g.family_number) {
        patientData.value.family_number = g.family_number
      }
    }

    // Get last vaccination: if not in patient payload, fetch by patient id
    if (p.lastVaccination || p.last_vaccination_date) {
      lastVaccination.value = p.lastVaccination || p.last_vaccination_date
    } else {
      try {
        const vaccRes = await api.get(`/immunizations`, { params: { patient_id: patientId.value, limit: 1, sort: 'administered_date:desc' } })
        const items = vaccRes.data?.data || vaccRes.data?.items || vaccRes.data || []
        const mostRecent = Array.isArray(items) && items.length > 0 ? (items[0].administered_date || items[0].date_administered) : null
        if (mostRecent) lastVaccination.value = mostRecent
      } catch (e) {
        // non-fatal; keep null if fetch fails
      }
    }

    // Vaccination editor is now a separate page; no local modal data prep needed

  } catch (err) {
    console.error('Error fetching patient data:', err)
    error.value = 'Failed to load patient data. Please try again.'
    addToast({
      title: 'Error',
      message: error.value,
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

 

onMounted(async () => {
  fetchPatientData()
  
  // Check for hash navigation (e.g., #vaccinations)
  if (route.hash) {
    const tab = route.hash.replace('#', '')
    if (['info', 'vaccinations', 'scheduled', 'visits'].includes(tab)) {
      activeTab.value = tab
    }
  }
})

// QR rendering is handled by PatientQRCodeCard
</script>

<style scoped>
.nav-tabs .nav-link {
  border: none;
  border-bottom: 3px solid transparent;
  color: #6c757d;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  transition: all 0.3s;
}

.nav-tabs .nav-link:hover {
  border-color: transparent;
  background-color: rgba(13, 110, 253, 0.05);
  color: #0d6efd;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  background: transparent;
}

.card-header-tabs {
  margin-bottom: -1rem;
  border-bottom: none;
}
</style>
