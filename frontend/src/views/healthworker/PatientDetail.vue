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
      <PatientInfoCard :patient="patient" />

      <!-- Contact Information Card -->
      <ContactInfoSection 
        :patient="patient" 
        :initial-expanded="showContactInfo"
        ref="contactInfoRef"
        @toggle="showContactInfo = $event"
      />

      <!-- Parent Information Card -->
      <ParentInfoSection 
        :patient="patient" 
        :initial-expanded="showParentInfo"
        ref="parentInfoRef"
        @toggle="showParentInfo = $event"
      />

      <!-- Vaccination History Card -->
      <VaccinationHistorySection 
        :vaccination-history="patient.vaccinationHistory"
        :initial-expanded="showVaccinationHistory"
        ref="vaccinationHistoryRef"
        @toggle="showVaccinationHistory = $event"
      />
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
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import { 
  PatientInfoCard, 
  ContactInfoSection, 
  ParentInfoSection, 
  VaccinationHistorySection 
} from '@/features/health-worker/patients'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const patient = ref(null)

// Dropdown states
const showContactInfo = ref(false)
const showParentInfo = ref(false)
const showVaccinationHistory = ref(false)

// Component refs
const contactInfoRef = ref(null)
const parentInfoRef = ref(null)
const vaccinationHistoryRef = ref(null)

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

const fetchPatientDetail = async (id) => {
  try {
    loading.value = true
    const response = await api.get(`/patients/${id}`)
    const rawData = response.data?.data || response.data
    
    if (rawData) {
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
}
</style>