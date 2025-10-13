<template>
  <HealthWorkerLayout>
    <!-- Mobile Header -->
    <div class="mobile-header d-flex align-items-center justify-content-between mb-3">
      <div class="d-flex align-items-center">
        <button class="btn btn-link p-0 me-3" @click="goBack">
          <i class="bi bi-arrow-left" style="font-size: 1.5rem; color: #007bff;"></i>
        </button>
        <h5 class="mb-0 fw-bold">Patient Details</h5>
      </div>
      <button 
        v-if="!loading && patient"
        class="btn btn-outline-secondary btn-sm collapse-toggle-btn" 
        @click="toggleAllSections"
        :title="allSectionsExpanded ? 'Collapse All Sections' : 'Expand All Sections'"
      >
        <i :class="allSectionsExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Patient Details -->
    <div v-if="!loading && patient" class="patient-detail">
      <!-- Main Info Card -->
      <div class="detail-card mb-3">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="patient-title mb-0">{{ patient.childInfo.name }}</h6>
            <span class="badge status-badge" :class="getStatusBadgeClass(getPatientStatus(patient))">
              {{ getPatientStatus(patient) }}
            </span>
          </div>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Patient ID</span>
              <span class="info-value">{{ patient.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Age</span>
              <span class="info-value">{{ calculateAge(patient.childInfo.birthDate, patient) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sex</span>
              <span class="info-value">{{ patient.childInfo.sex }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Birth Date</span>
              <span class="info-value">{{ formatDate(patient.childInfo.birthDate) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Information Card -->
      <div class="detail-card mb-3">
        <div class="card-header dropdown-header" @click="showContactInfo = !showContactInfo">
          <h6 class="mb-0 d-flex justify-content-between align-items-center">
            <span>Contact Information</span>
            <i :class="showContactInfo ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </h6>
        </div>
        <div v-show="showContactInfo" class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Guardian</span>
              <span class="info-value">{{ patient.guardianInfo.name || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Relationship</span>
              <span class="info-value">{{ patient.guardianInfo.relationship || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Contact Number</span>
              <span class="info-value">{{ getContact(patient) }}</span>
            </div>
            <div class="info-item full-width">
              <span class="info-label">Address</span>
              <span class="info-value">{{ patient.childInfo.address || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Barangay</span>
              <span class="info-value">{{ patient.childInfo.barangay || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Family Number</span>
              <span class="info-value">{{ patient.guardianInfo.family_number || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Parent Information Card -->
      <div class="detail-card mb-3">
        <div class="card-header dropdown-header" @click="showParentInfo = !showParentInfo">
          <h6 class="mb-0 d-flex justify-content-between align-items-center">
            <span>Parent Information</span>
            <i :class="showParentInfo ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </h6>
        </div>
        <div v-show="showParentInfo" class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Mother's Name</span>
              <span class="info-value">{{ patient.motherInfo.name || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Mother's Occupation</span>
              <span class="info-value">{{ patient.motherInfo.occupation || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Mother's Contact</span>
              <span class="info-value">{{ patient.motherInfo.phone || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Father's Name</span>
              <span class="info-value">{{ patient.fatherInfo.name || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Father's Occupation</span>
              <span class="info-value">{{ patient.fatherInfo.occupation || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Father's Contact</span>
              <span class="info-value">{{ patient.fatherInfo.phone || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Vaccination History Card -->
      <div class="detail-card mb-3" v-if="patient.vaccinationHistory && patient.vaccinationHistory.length > 0">
        <div class="card-header dropdown-header" @click="showVaccinationHistory = !showVaccinationHistory">
          <h6 class="mb-0 d-flex justify-content-between align-items-center">
            <span>Vaccination History</span>
            <i :class="showVaccinationHistory ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </h6>
        </div>
        <div v-show="showVaccinationHistory" class="card-body">
          <div class="vaccination-history">
            <div 
              v-for="vaccination in patient.vaccinationHistory" 
              :key="vaccination.id"
              class="vaccination-item"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="fw-semibold">{{ vaccination.vaccineName }}</div>
                  <div class="text-muted small">{{ formatDate(vaccination.dateAdministered) }}</div>
                </div>
                <span class="badge bg-success">Administered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Vaccination History -->
      <div class="detail-card mb-3" v-else>
        <div class="card-header dropdown-header" @click="showVaccinationHistory = !showVaccinationHistory">
          <h6 class="mb-0 d-flex justify-content-between align-items-center">
            <span>Vaccination History</span>
            <i :class="showVaccinationHistory ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </h6>
        </div>
        <div v-show="showVaccinationHistory" class="card-body text-center py-4">
          <i class="bi bi-clipboard-x text-muted mb-2" style="font-size: 2rem;"></i>
          <p class="text-muted mb-0">No vaccination records found</p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="!loading && !patient" class="text-center py-5">
      <i class="bi bi-exclamation-triangle text-muted mb-3" style="font-size: 3rem;"></i>
      <h6 class="text-muted">Patient not found</h6>
      <p class="text-muted small">The requested patient could not be found or may have been removed.</p>
      <button class="btn btn-primary" @click="goBack">
        <i class="bi bi-arrow-left me-2"></i>Back to Patients
      </button>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const patient = ref(null)

// Dropdown states
const showContactInfo = ref(false)
const showParentInfo = ref(false)
const showVaccinationHistory = ref(false)

// Collapse/uncollapse all function
const toggleAllSections = () => {
  const allExpanded = showContactInfo.value && showParentInfo.value && showVaccinationHistory.value
  const newState = !allExpanded
  
  showContactInfo.value = newState
  showParentInfo.value = newState
  showVaccinationHistory.value = newState
}

// Computed property to determine if all sections are expanded
const allSectionsExpanded = computed(() => {
  return showContactInfo.value && showParentInfo.value && showVaccinationHistory.value
})

const goBack = () => {
  router.push('/healthworker/patients')
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not specified'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const calculateAge = (birthDate, patient = null) => {
  // If patient object has pre-computed age from backend, use that
  if (patient && patient.age_months !== undefined && patient.age_days !== undefined) {
    const months = patient.age_months || 0
    const days = patient.age_days || 0
    
    if (months >= 36) {
      const years = Math.floor(months / 12)
      return `${years} year${years !== 1 ? 's' : ''}`
    } else {
      return `${months}m ${days}d`
    }
  }
  
  // Fallback to client-side calculation
  if (!birthDate) return '—'
  const birth = new Date(birthDate)
  const today = new Date()
  if (isNaN(birth.getTime())) return '—'

  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  let days = today.getDate() - birth.getDate()

  if (days < 0) {
    months -= 1
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += prevMonth.getDate()
  }

  if (months < 0) months = 0
  if (days < 0) days = 0

  if (months >= 36) {
    const years = Math.floor(months / 12)
    return `${years} year${years !== 1 ? 's' : ''}`
  } else {
    return `${months}m ${days}d`
  }
}

const getPatientStatus = (patient) => {
  if (!patient.vaccinationHistory || patient.vaccinationHistory.length === 0) {
    return 'pending'
  }
  
  const lastVaccination = patient.vaccinationHistory[patient.vaccinationHistory.length - 1]
  const lastVaccinationDate = new Date(lastVaccination.dateAdministered)
  const now = new Date()
  const daysSinceLastVaccination = (now - lastVaccinationDate) / (1000 * 60 * 60 * 24)
  
  if (daysSinceLastVaccination <= 30) {
    return 'active'
  } else if (daysSinceLastVaccination <= 90) {
    return 'completed'
  }
  
  return 'pending'
}

const getContact = (patient) => {
  if (patient.guardianInfo && patient.guardianInfo.contact_number) return patient.guardianInfo.contact_number
  if (patient.motherInfo && patient.motherInfo.phone) return patient.motherInfo.phone
  if (patient.fatherInfo && patient.fatherInfo.phone) return patient.fatherInfo.phone
  return patient.childInfo?.phoneNumber || 'N/A'
}

const getStatusBadgeClass = (status) => {
  const classes = {
    active: 'bg-success',
    pending: 'bg-warning text-dark',
    completed: 'bg-secondary'
  }
  return classes[status] || 'bg-secondary'
}

const fetchPatientDetail = async (id) => {
  try {
    loading.value = true
    const response = await api.get(`/patients/${id}`)
    const rawData = response.data?.data || response.data
    
    if (rawData) {
      // Map the patient data structure similar to PatientRecords.vue
      patient.value = {
        id: rawData.patient_id,
        patient_id: rawData.patient_id,
        childInfo: {
          name: rawData.full_name || `${rawData.firstname} ${rawData.surname}`.trim(),
          firstName: rawData.firstname,
          middleName: rawData.middlename,
          lastName: rawData.surname,
          birthDate: rawData.date_of_birth,
          sex: rawData.sex,
          address: rawData.address,
          barangay: rawData.barangay,
          phoneNumber: rawData.guardian_contact_number
        },
        motherInfo: {
          name: rawData.mother_name,
          occupation: rawData.mother_occupation,
          phone: rawData.mother_contact_number
        },
        fatherInfo: {
          name: rawData.father_name,
          occupation: rawData.father_occupation,
          phone: rawData.father_contact_number
        },
        guardianInfo: {
          id: rawData.guardian_id,
          name: `${rawData.guardian_firstname || ''} ${rawData.guardian_surname || ''}`.trim(),
          contact_number: rawData.guardian_contact_number,
          family_number: rawData.guardian_family_number,
          relationship: rawData.relationship_to_guardian
        },
        vaccinationHistory: rawData.vaccinationHistory || [],
        tags: rawData.tags,
        dateRegistered: rawData.date_registered,
        age_months: rawData.age_months,
        age_days: rawData.age_days
      }
    } else {
      patient.value = null
    }
  } catch (error) {
    console.error('Error fetching patient details:', error)
    patient.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const patientId = route.params.id
  if (patientId) {
    fetchPatientDetail(patientId)
  } else {
    loading.value = false
  }
})
</script>

<style scoped>
.mobile-header {
  background: white;
  padding: 1rem 0 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 56px;
  z-index: 100;
}

.patient-detail {
  padding-bottom: 2rem;
}

.detail-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e9ecef;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.dropdown-header {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-header:hover {
  background: #e9ecef;
}

.dropdown-header i {
  color: #6c757d;
  transition: transform 0.2s ease;
}

.card-body {
  padding: 1rem;
}

.patient-title {
  font-weight: 600;
  color: #2c3e50;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

.vaccination-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vaccination-item {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .mobile-header {
    margin-left: -1rem;
    margin-right: -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .patient-detail {
    margin-left: -0.5rem;
    margin-right: -0.5rem;
  }
  
  .detail-card {
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .card-body, .card-header {
    padding: 0.75rem;
  }
  
  .info-value {
    font-size: 0.95rem;
  }
  
  .patient-title {
    font-size: 1rem;
  }
}

@media (min-width: 576px) {
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>