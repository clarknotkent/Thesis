<template>
  <HealthWorkerLayout :show-controls="false">
    <!-- Fixed Header Section: Details Header + Tabs (positioned sticky) -->
    <div class="patient-details-header-section">
      <!-- Patient Details Header Bar -->
      <div class="details-header-bar">
        <button class="back-button" @click="goBack">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h1 class="page-title">Patient Details</h1>
        <button class="add-button" @click="goToAddImmunization">
          <i class="bi bi-plus-lg"></i>
        </button>
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

    <!-- Content wrapper (same pattern as PatientRecords) -->
    <div class="page-content-wrapper">
      <!-- Patient Information Tab -->
      <div v-if="activeTab === 'patient-info'" class="tab-content">
        <!-- QR Code Card -->
        <PatientQRCodeCard :patient="patient" />

        <!-- Patient Information Card -->
        <CollapsibleCard
          title="Patient Information"
          icon="person-fill"
          :is-expanded="expandedCards.patientInfo"
          @toggle="expandedCards.patientInfo = !expandedCards.patientInfo"
        >
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">First Name</span>
              <span class="info-value">{{ patient?.childInfo?.firstName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Middle Name</span>
              <span class="info-value">{{ patient?.childInfo?.middleName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Surname</span>
              <span class="info-value">{{ patient?.childInfo?.lastName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sex</span>
              <span class="info-value">{{ patient?.childInfo?.sex || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date of Birth</span>
              <span class="info-value">{{ formattedBirthDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Age</span>
              <span class="info-value">{{ age }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Address</span>
              <span class="info-value">{{ patient?.childInfo?.address || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Barangay</span>
              <span class="info-value">{{ patient?.childInfo?.barangay || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Health Center</span>
              <span class="info-value">{{ patient?.health_center || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Phone Number</span>
              <span class="info-value">{{ patient?.childInfo?.phoneNumber || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tags</span>
              <span class="info-value">{{ patient?.tags || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date Registered</span>
              <span class="info-value">{{ formattedRegisteredDate }}</span>
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
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Guardian Name</span>
              <span class="info-value">{{ patient?.guardianInfo?.name || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Relationship</span>
              <span class="info-value">{{ patient?.guardianInfo?.relationship || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Guardian Contact</span>
              <span class="info-value">{{ patient?.guardianInfo?.contact_number || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Family Number</span>
              <span class="info-value">{{ patient?.guardianInfo?.family_number || '—' }}</span>
            </div>
            <div class="info-section-header">
              <i class="bi bi-person-heart"></i>
              <span>Mother's Information</span>
            </div>
            <div class="info-item">
              <span class="info-label">Mother's Name</span>
              <span class="info-value">{{ patient?.motherInfo?.name || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Occupation</span>
              <span class="info-value">{{ patient?.motherInfo?.occupation || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Contact Number</span>
              <span class="info-value">{{ patient?.motherInfo?.phone || '—' }}</span>
            </div>
            <div class="info-section-header">
              <i class="bi bi-person-heart"></i>
              <span>Father's Information</span>
            </div>
            <div class="info-item">
              <span class="info-label">Father's Name</span>
              <span class="info-value">{{ patient?.fatherInfo?.name || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Occupation</span>
              <span class="info-value">{{ patient?.fatherInfo?.occupation || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Contact Number</span>
              <span class="info-value">{{ patient?.fatherInfo?.phone || '—' }}</span>
            </div>
          </div>
        </CollapsibleCard>

        <!-- Birth History Card -->
        <CollapsibleCard
          title="Birth History"
          icon="calendar-heart-fill"
          :is-expanded="expandedCards.birthHistory"
          @toggle="expandedCards.birthHistory = !expandedCards.birthHistory"
        >
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Birth Weight</span>
              <span class="info-value">{{ formattedBirthWeight }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Birth Length</span>
              <span class="info-value">{{ formattedBirthLength }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Place of Birth</span>
              <span class="info-value">{{ patient?.birthHistory?.place_of_birth || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Address at Birth</span>
              <span class="info-value">{{ patient?.birthHistory?.address_at_birth || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Time of Birth</span>
              <span class="info-value">{{ patient?.birthHistory?.time_of_birth || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Attendant at Birth</span>
              <span class="info-value">{{ patient?.birthHistory?.attendant_at_birth || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Type of Delivery</span>
              <span class="info-value">{{ patient?.birthHistory?.type_of_delivery || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Ballard's Score</span>
              <span class="info-value">{{ patient?.birthHistory?.ballards_score || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Hearing Test Date</span>
              <span class="info-value">{{ formattedHearingTestDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Newborn Screening Date</span>
              <span class="info-value">{{ formattedNewbornScreeningDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Newborn Screening Result</span>
              <span class="info-value">{{ patient?.birthHistory?.newborn_screening_result || '—' }}</span>
            </div>
          </div>
        </CollapsibleCard>
      </div>

      <!-- Vaccination History Tab -->
      <div v-else-if="activeTab === 'vaccination-history'" class="tab-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <!-- Vaccination Accordion List -->
        <div v-else-if="groupedVaccinations.length > 0" class="vaccination-accordion-list">
          <VaccinationRecordCard
            v-for="(group, index) in groupedVaccinations"
            :key="group.vaccineName"
            :vaccine-name="group.vaccineName"
            :doses="group.doses"
            :initial-expanded="index === 0"
            @view="viewVaccination"
            @edit="editVaccination"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <i class="bi bi-shield-exclamation empty-icon"></i>
          <h4 class="empty-title">No Vaccination Records</h4>
          <p class="empty-text">This patient has no vaccination history yet.</p>
        </div>
      </div>

      <!-- Scheduled Vaccinations Tab -->
      <div v-else-if="activeTab === 'scheduled-vaccinations'" class="tab-content">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading scheduled vaccinations...</p>
        </div>
        <div v-else-if="scheduledVaccinations.length === 0" class="empty-state">
          <i class="bi bi-calendar-check empty-icon"></i>
          <p class="empty-text">No scheduled vaccinations found</p>
        </div>
        <div v-else class="vaccines-list">
          <ScheduledVaccineCard
            v-for="(vaccine, index) in scheduledVaccinations"
            :key="vaccine.schedule_id || index"
            :vaccine-name="vaccine.vaccine_name || vaccine.antigen_name || vaccine.vaccineName || 'Unknown Vaccine'"
            :dose="vaccine.dose_number || vaccine.dose"
            :scheduled-date="vaccine.scheduled_date"
            :status="vaccine.status"
          />
        </div>
      </div>

      <!-- Medical History Tab -->
      <div v-else-if="activeTab === 'medical-history'" class="tab-content">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading medical history...</p>
        </div>
        <div v-else-if="medicalHistory.length === 0" class="empty-state">
          <i class="bi bi-clipboard2-pulse empty-icon"></i>
          <p class="empty-text">No medical history found</p>
        </div>
        <div v-else class="history-list">
          <MedicalHistoryCard
            v-for="(visit, index) in medicalHistory"
            :key="visit.visit_id || index"
            :visit-id="visit.visit_id"
            :visit-date="visit.visit_date"
            :service-rendered="visit.service_rendered || 'General Checkup'"
            :recorded-by="visit.recorded_by_name || visit.health_worker_name || '—'"
            :vitals="{
              weight: visit.weight,
              height: visit.height,
              temperature: visit.temperature,
              heart_rate: visit.heart_rate,
              respiratory_rate: visit.respiratory_rate,
              blood_pressure: visit.blood_pressure
            }"
            :immunizations="visit.immunizations || []"
            :findings="visit.findings"
            :initial-expanded="index === 0"
            @navigate="navigateToVisitSummary"
          />
        </div>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import PatientQRCodeCard from '@/features/health-worker/patients/components/PatientQRCodeCard.vue'
import CollapsibleCard from '@/features/health-worker/patients/components/CollapsibleCard.vue'
import VaccinationRecordCard from '@/features/health-worker/patients/components/VaccinationRecordCard.vue'
import ScheduledVaccineCard from '@/features/health-worker/patients/components/ScheduledVaccineCard.vue'
import MedicalHistoryCard from '@/features/health-worker/patients/components/MedicalHistoryCard.vue'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

const patient = ref(null)
const vaccinationHistory = ref([])
const scheduledVaccinations = ref([])
const medicalHistory = ref([])
const loading = ref(true)
const activeTab = ref('patient-info')

const tabs = [
  { id: 'patient-info', label: 'Patient Information' },
  { id: 'vaccination-history', label: 'Vaccination History' },
  { id: 'scheduled-vaccinations', label: 'Scheduled Vaccinations' },
  { id: 'medical-history', label: 'Medical History' }
]

const expandedCards = ref({
  patientInfo: true,
  guardianInfo: false,
  birthHistory: false
})

const age = computed(() => {
  if (patient.value?.age_months !== undefined && patient.value?.age_days !== undefined) {
    const months = patient.value.age_months || 0
    const days = patient.value.age_days || 0
    
    if (months >= 36) {
      const years = Math.floor(months / 12)
      return `${years} year${years !== 1 ? 's' : ''}`
    } else {
      return `${months} months ${days} days`
    }
  }
  return '—'
})

const formattedBirthDate = computed(() => {
  if (!patient.value?.childInfo?.birthDate) return '—'
  return new Date(patient.value.childInfo.birthDate).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const formattedRegisteredDate = computed(() => {
  if (!patient.value?.dateRegistered) return '—'
  return new Date(patient.value.dateRegistered).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const formattedHearingTestDate = computed(() => {
  if (!patient.value?.birthHistory?.hearing_test_date) return '—'
  return new Date(patient.value.birthHistory.hearing_test_date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const formattedNewbornScreeningDate = computed(() => {
  if (!patient.value?.birthHistory?.newborn_screening_date) return '—'
  return new Date(patient.value.birthHistory.newborn_screening_date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const formattedBirthWeight = computed(() => {
  const weight = patient.value?.birthHistory?.birth_weight
  if (!weight) return '—'
  return `${weight} kg`
})

const formattedBirthLength = computed(() => {
  const length = patient.value?.birthHistory?.birth_length
  if (!length) return '—'
  return `${length} cm`
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
  router.push('/healthworker/patients')
}

const goToAddImmunization = () => {
  router.push({
    name: 'AddPatientImmunizationRecord',
    params: {
      patientId: route.params.id
    }
  })
}

const viewVaccination = (vaccination) => {
  // Navigate to VaccineRecordDetails page with immunization ID
  const immunizationId = vaccination.immunization_id || vaccination.id
  if (immunizationId) {
    router.push({
      name: 'VaccineRecordDetails',
      params: {
        patientId: route.params.id,
        immunizationId: immunizationId
      }
    })
  } else {
    console.error('No immunization ID found for vaccination:', vaccination)
  }
}

const editVaccination = (vaccination) => {
  // Navigate to edit vaccination record page
  console.log('Edit vaccination:', vaccination)
  const recordId = vaccination.immunization_id || vaccination.id
  if (!recordId) {
    alert('Cannot edit: Record ID not found')
    return
  }
  router.push({
    name: 'EditVaccinationRecord',
    params: {
      patientId: route.params.id,
      recordId: recordId
    }
  })
}

const editScheduledVaccination = (vaccine) => {
  // TODO: Implement edit scheduled vaccination modal
  console.log('Edit scheduled vaccination:', vaccine)
  alert(`Edit scheduled vaccination: ${vaccine.vaccine_name || vaccine.antigen_name || 'Unknown'}`)
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
    
    // Store scheduled vaccinations
    scheduledVaccinations.value = data.nextScheduledVaccinations || []
    
    // Fetch medical history (visits)
    await fetchMedicalHistory(patientId)
  } catch (error) {
    console.error('Error fetching patient details:', error)
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

const navigateToVisitSummary = (visitId) => {
  const patientId = route.params.id
  router.push(`/healthworker/patients/${patientId}/visit/${visitId}`)
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
  padding: 0.875rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  height: 57px;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: #374151;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: #f3f4f6;
}

.back-button i {
  font-size: 1.25rem;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: #374151;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.add-button:hover {
  background: #f3f4f6;
}

.add-button i {
  font-size: 1.25rem;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-navigation::-webkit-scrollbar {
  display: none;
}

.tab-button {
  flex: 1;
  min-width: max-content;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-button:hover {
  color: #374151;
  background: #f9fafb;
}

.tab-button.active {
  color: #007bff;
  border-bottom-color: #007bff;
  background: #f0f7ff;
}

/* Page Content Wrapper (same as PatientRecords) */
.page-content-wrapper {
  padding: 20px;
  padding-bottom: 100px;
  min-height: 100%;
  background: #f3f4f6;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Info Grid Styling */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 120px;
}

.info-value {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
  text-align: right;
  word-break: break-word;
}

.info-section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
  border-top: 2px solid #e5e7eb;
}

.info-section-header i {
  font-size: 1.125rem;
  color: #007bff;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.placeholder-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.placeholder-text {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

/* Vaccination Accordion List */
.vaccination-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Vaccines List (Scheduled Vaccinations) */
.vaccines-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* History List (Medical History) */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Loading Container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.loading-state .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-state p {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: #ffffff;
  border-radius: 1rem;
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-text {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
  max-width: 320px;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .page-content-wrapper {
    padding: 1rem;
    padding-bottom: 100px;
  }
  
  .details-header-bar {
    padding: 0.875rem 1rem;
  }
  
  .page-title {
    font-size: 1rem;
  }
  
  .back-button,
  .add-button {
    width: 32px;
    height: 32px;
    font-size: 1.125rem;
  }
  
  .tab-button {
    font-size: 0.8125rem;
    padding: 0.75rem 0.875rem;
  }
  
  .info-label {
    font-size: 0.8125rem;
    min-width: 100px;
  }
  
  .info-value {
    font-size: 0.8125rem;
  }
}
</style>
