<template>
  <ParentLayout title="Child's Records">
    <!-- Fixed Header Section: Details Header + Tabs (positioned sticky) -->
    <div class="patient-details-header-section">
      <!-- Patient Details Header Bar -->
      <div class="details-header-bar">
        <button class="back-button" @click="goBack">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h1 class="page-title">Health Records</h1>
        <div class="header-spacer"></div>
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
      <PatientInfoTab
        v-if="activeTab === 'patient-info'"
        :patient="patient"
        :expanded-cards="expandedCards"
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
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import PatientInfoTab from './components/PatientInfoTab.vue'
import VaccinationHistoryTab from './components/VaccinationHistoryTab.vue'
import MedicalHistoryTab from './components/MedicalHistoryTab.vue'
import api from '@/services/offlineAPI'

const router = useRouter()
const route = useRoute()

const patient = ref(null)
const vaccinationHistory = ref([])
const medicalHistory = ref([])
const loading = ref(true)
const activeTab = ref('patient-info')

const tabs = [
  { id: 'patient-info', label: 'Patient Information' },
  { id: 'vaccination-history', label: 'Vaccination History' },
  { id: 'medical-history', label: 'Medical History' }
]

const expandedCards = ref({
  patientInfo: true,
  guardianInfo: false,
  birthHistory: false
})

// Group vaccinations by vaccine type
const groupedVaccinations = computed(() => {
  const groups = {}
  
  vaccinationHistory.value.forEach(vaccination => {
    const vaccineName = vaccination.vaccine_antigen_name || 
                       vaccination.vaccineName || 
                       vaccination.antigen_name || 
                       vaccination.antigenName || 
                       'Unknown Vaccine'
    
    if (!groups[vaccineName]) {
      groups[vaccineName] = {
        vaccineName: vaccineName,
        doses: []
      }
    }
    
    groups[vaccineName].doses.push(vaccination)
  })
  
  // Convert to array and sort doses by dose number within each group
  return Object.values(groups).map(group => ({
    ...group,
    doses: group.doses.sort((a, b) => {
      const doseA = a.dose_number || a.doseNumber || a.dose || 0
      const doseB = b.dose_number || b.doseNumber || b.dose || 0
      return doseA - doseB
    })
  }))
})

const goBack = () => {
  router.push('/parent/records')
}

const fetchPatientDetails = async () => {
  try {
    loading.value = true
    const patientId = route.params.id
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
      birthHistory: data.medical_history || data.birthHistory || {},
      health_center: data.health_center,
      tags: data.tags,
      dateRegistered: data.date_registered,
      age_months: data.age_months,
      age_days: data.age_days
    }

    // Store vaccination history
    vaccinationHistory.value = data.vaccinationHistory || []
    
    // Fetch medical history (visits)
    await fetchMedicalHistory(patientId)
  } catch (error) {
    console.error('Error fetching patient details:', error)
    const status = error?.response?.status
    if (status === 403 || status === 404) {
      // Not owned or missing -> show Not Found page
      router.replace('/not-found')
      return
    }
  } finally {
    loading.value = false
  }
}

const fetchMedicalHistory = async (patientId) => {
  try {
    const response = await api.get(`/visits?patient_id=${patientId}`)
    const data = response.data
    medicalHistory.value = data.items || data.data || []
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
  background: #f9fafb;
}
</style>
