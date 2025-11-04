<template>
  <ParentLayout title="Records">
    <!-- Fixed Header Section: Details Header + Tabs (positioned sticky) -->
    <div class="patient-details-header-section">
      <!-- Patient Details Header Bar -->
      <div class="details-header-bar">
        <button class="back-button" @click="goBack">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h1 class="page-title">My Child's Records</h1>
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
      <!-- Show loading state while data is being fetched -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading patient details...</p>
      </div>

      <!-- Show content only when patient data is available -->
      <template v-else-if="patient">
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
      </template>

      <!-- Show error state if no patient data -->
      <div v-else class="error-state">
        <p>Unable to load patient details</p>
        <button @click="goBack" class="btn btn-primary">Go Back</button>
      </div>
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
import api from '@/services/api'
import db from '@/services/offline/db-parent-portal'

const router = useRouter()
const route = useRoute()

const patient = ref(null)
const vaccinationHistory = ref([])
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
    
    // NETWORK-FIRST: If online, fetch from API directly (fast)
    if (navigator.onLine) {
      console.log('🌐 Fetching fresh data from API (online)')
      const response = await api.get(`/patients/${patientId}`)
      
      // Map backend data to frontend format
      const data = response.data.data || response.data
      console.log('🔍 BACKEND RESPONSE:', data)
      console.log('🔍 medical_history:', data.medical_history)
      console.log('🔍 place_of_birth:', data.place_of_birth)
      console.log('🔍 birth_weight:', data.birth_weight)
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
      
      // IMPORTANT: API interceptor already saves to patients, guardians, birthhistory tables
      // No need to manually save here - the interceptor handles it automatically
      console.log('✅ Patient data already cached by API interceptor')
    } else {
      // OFFLINE: Try to use cached data from IndexedDB
      console.log('📴 Offline - loading from IndexedDB cache')
      try {
        // Fetch patient basic info
        const cachedPatient = await db.patients.get(Number(patientId))
        
        if (!cachedPatient) {
          throw new Error('Patient not found in cache')
        }
        
        console.log('📦 Found patient in IndexedDB:', cachedPatient)
        
        // Fetch birth history from SEPARATE birthhistory table (mirrors Supabase structure!)
        const birthHistoryRecord = await db.birthhistory.where('patient_id').equals(Number(patientId)).first()
        console.log('📦 Found birth history in separate table:', birthHistoryRecord)
        
        // Fetch guardian info from SEPARATE guardians table
        let guardianRecord = null
        if (cachedPatient.guardian_id) {
          guardianRecord = await db.guardians.get(cachedPatient.guardian_id)
          console.log('📦 Found guardian in separate table:', guardianRecord)
        }
        
        // Map cached data to frontend format (JOIN the separate tables manually)
        patient.value = {
          id: cachedPatient.patient_id,
          patient_id: cachedPatient.patient_id,
          childInfo: {
            name: cachedPatient.full_name || `${cachedPatient.firstname} ${cachedPatient.surname}`.trim(),
            firstName: cachedPatient.firstname,
            middleName: cachedPatient.middlename,
            lastName: cachedPatient.surname,
            birthDate: cachedPatient.date_of_birth,
            sex: cachedPatient.sex,
            address: cachedPatient.address,
            barangay: cachedPatient.barangay,
            phoneNumber: guardianRecord?.contact_number || cachedPatient.guardian_contact_number
          },
          motherInfo: {
            name: cachedPatient.mother_name,
            occupation: cachedPatient.mother_occupation,
            phone: cachedPatient.mother_contact_number
          },
          fatherInfo: {
            name: cachedPatient.father_name,
            occupation: cachedPatient.father_occupation,
            phone: cachedPatient.father_contact_number
          },
          guardianInfo: {
            id: guardianRecord?.guardian_id || cachedPatient.guardian_id,
            name: guardianRecord ? `${guardianRecord.firstname || ''} ${guardianRecord.middlename || ''} ${guardianRecord.surname || ''}`.trim() : 'Unknown',
            contact_number: guardianRecord?.contact_number,
            alternative_contact_number: guardianRecord?.alternative_contact_number,
            occupation: guardianRecord?.occupation,
            family_number: guardianRecord?.family_number || cachedPatient.family_number,
            relationship: cachedPatient.relationship_to_guardian
          },
          // READ FROM SEPARATE BIRTHHISTORY TABLE (just like Supabase!)
          birthHistory: birthHistoryRecord ? {
            birth_weight: birthHistoryRecord.birth_weight,
            birth_length: birthHistoryRecord.birth_length,
            place_of_birth: birthHistoryRecord.place_of_birth,
            address_at_birth: birthHistoryRecord.address_at_birth,
            time_of_birth: birthHistoryRecord.time_of_birth,
            attendant_at_birth: birthHistoryRecord.attendant_at_birth,
            type_of_delivery: birthHistoryRecord.type_of_delivery,
            ballards_score: birthHistoryRecord.ballards_score,
            hearing_test_date: birthHistoryRecord.hearing_test_date,
            newborn_screening_date: birthHistoryRecord.newborn_screening_date,
            newborn_screening_result: birthHistoryRecord.newborn_screening_result
          } : {},
          health_center: cachedPatient.health_center,
          tags: cachedPatient.tags || [],
          dateRegistered: cachedPatient.date_registered || cachedPatient.created_at,
          age_months: cachedPatient.age_months,
          age_days: cachedPatient.age_days
        }
        
        // Fetch vaccination history from IMMUNIZATIONS TABLE (separate!)
        const cachedImmunizations = await db.immunizations
          .where('patient_id')
          .equals(Number(patientId))
          .toArray()
        
        console.log(`📦 Found ${cachedImmunizations.length} immunizations in cache`)
        
        // Map to match the format expected by VaccinationHistoryTab
        vaccinationHistory.value = cachedImmunizations.map(i => ({
          immunization_id: i.immunization_id,
          vaccine_antigen_name: i.vaccine_name || i.disease_prevented,
          vaccineName: i.vaccine_name || i.disease_prevented,
          antigen_name: i.vaccine_name || i.disease_prevented,
          antigenName: i.vaccine_name || i.disease_prevented,
          dose_number: i.dose_number,
          administered_date: i.administered_date,
          administered_time: i.administered_time,
          administered_by: i.administered_by,
          age_at_administration: i.age_at_administration,
          facility_name: i.facility_name,
          outside: i.outside,
          remarks: i.remarks,
          disease_prevented: i.disease_prevented
        }))
      } catch (dbError) {
        console.error('Failed to load from IndexedDB:', dbError)
        error.value = 'Unable to load patient data offline. Please connect to the internet.'
      }
    }
    
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
    // STEP 1: Try reading from IndexedDB first (offline-first)
    let cachedVisits = []
    try {
      cachedVisits = await db.visits.where('patient_id').equals(Number(patientId)).toArray()
      if (cachedVisits.length > 0) {
        console.log('📦 Found medical history in IndexedDB cache')
        medicalHistory.value = cachedVisits
        
        // If offline, stop here and use cached data
        if (!navigator.onLine) {
          console.log('📴 Using cached medical history (offline)')
          return
        }
      }
    } catch (dbError) {
      console.warn('Failed to read medical history from IndexedDB:', dbError)
    }
    
    // STEP 2: If online (or no cache), fetch fresh data from API
    if (navigator.onLine) {
      console.log('🌐 Fetching fresh medical history from API')
      const response = await api.get(`/visits?patient_id=${patientId}`)
      const data = response.data
      medicalHistory.value = data.items || data.data || []
      
      // Save medical history (visits) to IndexedDB
      if (medicalHistory.value.length > 0) {
        try {
          // Sanitize data by creating plain objects (removes circular references and non-serializable data)
          const sanitizedVisits = medicalHistory.value.map(visit => {
            // Extract only the necessary fields as plain values
            return {
              id: visit.visit_id || visit.id,
              visit_id: visit.visit_id || visit.id,
              patient_id: patientId,
              visit_date: visit.visit_date || visit.date || visit.created_at,
              visit_type: visit.visit_type || visit.type,
              notes: visit.notes || visit.description || '',
              health_worker_id: visit.health_worker_id,
              health_worker_name: visit.health_worker_name,
              weight: visit.weight,
              height: visit.height,
              temperature: visit.temperature,
              blood_pressure: visit.blood_pressure,
              heart_rate: visit.heart_rate,
              respiratory_rate: visit.respiratory_rate,
              diagnosis: visit.diagnosis,
              treatment: visit.treatment,
              prescriptions: visit.prescriptions,
              follow_up_date: visit.follow_up_date,
              created_at: visit.created_at,
              updated_at: new Date().toISOString()
            }
          })
          
          await db.visits.bulkPut(sanitizedVisits)
          console.log('✅ Medical history (visits) saved to IndexedDB')
        } catch (dbError) {
          console.error('Failed to save visits to IndexedDB:', dbError)
        }
      }
    }
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
