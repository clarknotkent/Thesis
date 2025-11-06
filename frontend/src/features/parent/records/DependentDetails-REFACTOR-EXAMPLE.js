/**
 * Example: DependentDetails.vue refactored with new offline utilities
 * 
 * BEFORE: Inline IndexedDB queries, complex cache logic
 * AFTER: Simple utility function calls
 */

// ========================================
// OLD CODE (Complex, hard to maintain)
// ========================================
/*
const fetchPatientDetails = async (patientId) => {
  loading.value = true
  try {
    if (navigator.onLine) {
      console.log('🌐 Fetching fresh data from API (online)')
      const response = await api.get(`/patients/${patientId}`)
      const data = response.data.data || response.data
      
      // Map 50+ fields manually...
      patient.value = {
        id: data.patient_id,
        patient_id: data.patient_id,
        childInfo: {
          name: data.full_name || `${data.firstname} ${data.surname}`.trim(),
          // ... 20 more fields
        },
        motherInfo: {
          // ... 10 more fields
        },
        // ... 100+ lines of mapping
      }
      
      vaccinationHistory.value = data.vaccinationHistory || []
    } else {
      // OFFLINE: Complex cache queries
      const cachedPatient = await db.patients.get(Number(patientId))
      const birthHistoryRecord = await db.birthhistory.where('patient_id').equals(Number(patientId)).first()
      const guardianRecord = await db.guardians.get(cachedPatient.guardian_id)
      const cachedImmunizations = await db.immunizations.where('patient_id').equals(Number(patientId)).toArray()
      
      // Map all over again with different structure...
      patient.value = {
        // ... another 100 lines
      }
      
      vaccinationHistory.value = cachedImmunizations.map(i => ({
        // ... map again
      }))
    }
    
    await fetchMedicalHistory(patientId)
  } finally {
    loading.value = false
  }
}
*/

// ========================================
// NEW CODE (Clean, simple, maintainable)
// ========================================

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPatientDetails, getMedicalHistory } from '@/services/offline/offlineUtils'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const patient = ref(null)
const vaccinationHistory = ref([])
const medicalHistory = ref([])

const fetchPatientDetails = async (patientId) => {
  loading.value = true
  try {
    // Single utility call - handles online/offline automatically
    const data = await getPatientDetails(patientId)
    
    // Map once (utility already normalized the structure)
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
        occupation: data.guardian_occupation
      },
      medicalHistory: {
        birth_weight: data.medical_history?.birth_weight,
        birth_length: data.medical_history?.birth_length,
        place_of_birth: data.medical_history?.place_of_birth,
        // ... other birth history fields
      }
    }
    
    // Vaccination history already in response from utility
    vaccinationHistory.value = data.vaccinationHistory || []
    
    // Fetch medical history (visits)
    medicalHistory.value = await getMedicalHistory(patientId)
    
  } catch (error) {
    console.error('Error fetching patient details:', error)
    const status = error?.response?.status
    if (status === 403 || status === 404) {
      router.replace('/not-found')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const patientId = route.params.id
  if (patientId) {
    fetchPatientDetails(patientId)
  }
})

// ========================================
// KEY IMPROVEMENTS:
// ========================================
// 1. No more navigator.onLine checks - utility handles it
// 2. No more direct IndexedDB queries - utility abstracts it
// 3. No more duplicate mapping logic for online vs offline
// 4. 200+ lines reduced to ~50 lines
// 5. Easy to test and maintain
// 6. Consistent pattern across all components
