<template>
  <ParentLayout title="Records">
    <!-- Fixed Header Section: Details Header + Tabs (positioned sticky) -->
    <div class="patient-details-header-section">
      <!-- Patient Details Header Bar -->
      <div class="details-header-bar">
        <button
          class="back-button"
          @click="goBack"
        >
          <i class="bi bi-chevron-left" />
        </button>
        <h1 class="page-title">
          My Child's Records
        </h1>
        <div class="header-spacer" />
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Content wrapper -->
    <div class="page-content-wrapper">
      <!-- Show loading state while data is being fetched -->
      <div
        v-if="loading"
        class="loading-state"
      >
        <div class="spinner" />
        <p>Loading patient details...</p>
      </div>

      <!-- Show content only when patient data is available -->
      <template v-else-if="patient">
        <PatientInfoTab
          v-if="activeTab === 'patient-info'"
          v-model:expanded-cards="expandedCards"
          :patient="patient"
        />
        
        <VaccinationHistoryTab
          v-else-if="activeTab === 'vaccination-history'"
          :loading="loading"
          :grouped-vaccinations="groupedVaccinations"
          :patient-id="patient?.id"
        />
        
        <MedicalHistoryTab
          v-else-if="activeTab === 'medical-history'"
          :loading="loading"
          :medical-history="medicalHistory"
          :patient-id="patient?.id"
        />
      </template>


      <!-- Show error state if no patient data -->
      <div
        v-else
        class="error-state"
      >
        <p>Unable to load patient details</p>
        <button
          class="btn btn-primary"
          @click="goBack"
        >
          Go Back
        </button>
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import PatientInfoTab from './PatientInfoTab.vue'
import VaccinationHistoryTab from '../vaccination-history/VaccinationHistoryTab.vue'
import MedicalHistoryTab from '../medical-history/MedicalHistoryTab.vue'
import api from '@/services/api'
import { buildFirstDoseEligibleIndex, compareGroupsByEligible } from '@/utils/vaccineOrder'

const router = useRouter()
const route = useRoute()

const patient = ref(null)
const vaccinationHistory = ref([])
const patientSchedule = ref([])
const medicalHistory = ref([])
const loading = ref(true)
const activeTab = ref('patient-info')

const tabs = [
  { id: 'patient-info', label: 'Child Information' },
  { id: 'vaccination-history', label: 'Vaccination History' },
  { id: 'medical-history', label: 'Medical History' }
]

const expandedCards = ref({
  patientInfo: true,
  guardianInfo: false,
  birthHistory: false
})

// Group vaccinations by vaccine type ordered solely by first-dose eligible_date from patientschedule
const eligibleIndex = computed(() => buildFirstDoseEligibleIndex(patientSchedule.value))

const groupedVaccinations = computed(() => {
  const groups = {}
  for (const vaccination of vaccinationHistory.value) {
    const vaccineName = vaccination.vaccine_antigen_name ||
      vaccination.vaccineName ||
      vaccination.antigen_name ||
      vaccination.antigenName ||
      'Unknown Vaccine'
    if (!groups[vaccineName]) {
      groups[vaccineName] = { vaccineName, doses: [] }
    }
    groups[vaccineName].doses.push(vaccination)
  }
  const arr = Object.values(groups).map(group => ({
    ...group,
    doses: group.doses.sort((a, b) => {
      const doseA = a.dose_number || a.doseNumber || a.dose || 0
      const doseB = b.dose_number || b.doseNumber || b.dose || 0
      return doseA - doseB
    })
  }))
  // Order strictly by first-dose eligible_date from patientschedule
  return arr.sort((a, b) => compareGroupsByEligible(a, b, eligibleIndex.value))
})

const goBack = () => {
  router.push('/parent/records')
}

const fetchPatientDetails = async () => {
  try {
    loading.value = true
    const patientId = route.params.id
    
    // ONLINE ONLY - No offline support
    console.log('🌐 Fetching data from API')
    const response = await api.get(`/patients/${patientId}`)
    
    // Map backend data to frontend format
    const data = response.data.data || response.data
    patient.value = {
      id: data.patient_id,
      patient_id: data.patient_id,
      childInfo: {
        name: data.full_name || `${data.firstname} ${data.surname}`.trim(),
        firstName: data.firstname,
        middleName: data.middlename,
        lastName: data.surname,
        birthDate: data.date_of_birth,
        sex: data.sex,
        address: data.address,
        barangay: data.barangay,
        phoneNumber: data.guardian_contact_number
      },
      motherInfo: {
        name: data.mother_name,
        occupation: data.mother_occupation,
        phone: data.mother_contact_number
      },
      fatherInfo: {
        name: data.father_name,
        occupation: data.father_occupation,
        phone: data.father_contact_number
      },
      guardianInfo: {
        id: data.guardian_id,
        name: `${data.guardian_firstname || ''} ${data.guardian_surname || ''}`.trim(),
        contact_number: data.guardian_contact_number,
        alternative_contact_number: data.guardian_alternative_contact_number,
        occupation: data.guardian_occupation,
        family_number: data.guardian_family_number,
        relationship: data.relationship_to_guardian
      },
      birthHistory: {
        birth_weight: data.medical_history?.birth_weight || data.birth_weight,
        birth_length: data.medical_history?.birth_length || data.birth_length,
        place_of_birth: data.place_of_birth || data.medical_history?.place_of_birth,
        address_at_birth: data.address_at_birth || data.medical_history?.address_at_birth,
        time_of_birth: data.medical_history?.time_of_birth || data.time_of_birth,
        attendant_at_birth: data.medical_history?.attendant_at_birth || data.attendant_at_birth,
        type_of_delivery: data.medical_history?.type_of_delivery || data.type_of_delivery,
        ballards_score: data.medical_history?.ballards_score || data.ballards_score,
        hearing_test_date: data.medical_history?.hearing_test_date || data.hearing_test_date,
        newborn_screening_date: data.medical_history?.newborn_screening_date || data.newborn_screening_date,
        newborn_screening_result: data.medical_history?.newborn_screening_result || data.newborn_screening_result
      },
      health_center: data.health_center,
      tags: data.tags,
      dateRegistered: data.date_registered,
      age_months: data.age_months,
      age_days: data.age_days
    }

    // Store vaccination history
    vaccinationHistory.value = data.vaccinationHistory || []
    
    // Fetch schedule (for eligible_date ordering) and medical history
    try {
      const resSched = await api.get(`/patients/${patientId}/schedule`)
      const schedArr = resSched?.data?.data || resSched?.data?.items || resSched?.data || []
      patientSchedule.value = Array.isArray(schedArr) ? schedArr : []
    } catch (e) {
      patientSchedule.value = []
    }

    // Fetch medical history (visits)
    await fetchMedicalHistory(patientId)
  } catch (error) {
    console.error('Error fetching patient details:', error)
    const status = error?.response?.status
    if (status === 403 || status === 404) {
      router.replace('/not-found')
      return
    }
  } finally {
    loading.value = false
  }
}

const fetchMedicalHistory = async (patientId) => {
  try {
    // ONLINE ONLY - No offline support
    const response = await api.get(`/visits?patient_id=${patientId}`)
    const data = response.data
    medicalHistory.value = data.items || data.data || data || []
  } catch (error) {
    console.error('Error fetching medical history:', error)
    medicalHistory.value = []
  }
}

onMounted(() => {
  fetchPatientDetails()
})
</script>

<style scoped>
/* Fixed Header Section */
.patient-details-header-section {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  flex-shrink: 0;
}

/* Details Header Bar */
.details-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.back-button {
  padding: 8px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: #f3f4f6;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
  text-align: center;
}

.header-spacer {
  width: 40px;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  overflow-x: auto;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-navigation::-webkit-scrollbar {
  display: none;
}

.tab-button {
  flex-shrink: 0;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

/* Responsive styles for small screens (300-400px width) */
@media (max-width: 400px) {
  .page-title {
    font-size: 0.95rem;
  }
  
  .tab-button {
    padding: 10px 12px;
    font-size: 0.75rem;
  }
  
  .details-header-bar {
    padding: 12px;
  }
}

/* Extra small screens (below 350px) */
@media (max-width: 350px) {
  .page-title {
    font-size: 0.875rem;
  }
  
  .tab-button {
    padding: 10px 8px;
    font-size: 0.7rem;
  }
}

.tab-button:hover {
  color: #6366f1;
}

.tab-button.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
}

/* Content Wrapper */
.page-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f9fafb;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-state p {
  color: #dc2626;
  font-size: 1rem;
  margin-bottom: 16px;
}

.error-state .btn {
  padding: 10px 24px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
}

.error-state .btn:hover {
  background: #4f46e5;
}
</style>
