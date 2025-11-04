/**
 * Composable for managing patient details page logic
 * Handles patient data loading, vaccination history, scheduled vaccinations, and medical history
 */
import { ref, computed } from 'vue'
import api from '@/services/api'

export function usePatientDetails(patientId) {
  // State
  const patient = ref(null)
  const vaccinationHistory = ref([])
  const scheduledVaccinations = ref([])
  const medicalHistory = ref([])
  const loading = ref(true)
  const activeTab = ref('patient-info')

  // Tab configuration
  const tabs = [
    { id: 'patient-info', label: 'Patient Information' },
    { id: 'vaccination-history', label: 'Vaccination History' },
    { id: 'scheduled-vaccinations', label: 'Scheduled Vaccinations' },
    { id: 'medical-history', label: 'Medical History' }
  ]

  // Card expansion state
  const expandedCards = ref({
    patientInfo: true,
    guardianInfo: false,
    birthHistory: false
  })

  /**
   * Calculate patient age from birthdate or use server-provided age
   */
  const age = computed(() => {
    const hasServerAge = patient.value?.age_months !== undefined && patient.value?.age_days !== undefined
    let months, days

    if (hasServerAge) {
      months = patient.value.age_months || 0
      days = patient.value.age_days || 0
    } else if (patient.value?.childInfo?.birthDate) {
      const birth = new Date(patient.value.childInfo.birthDate)
      const today = new Date()

      // total month difference
      months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
      if (today.getDate() < birth.getDate()) months--

      // days within current month span
      const refDaysPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate()
      days = (today.getDate() >= birth.getDate())
        ? (today.getDate() - birth.getDate())
        : (refDaysPrevMonth - birth.getDate() + today.getDate())

      months = Math.max(0, months)
      days = Math.max(0, days)
    } else {
      return '—'
    }

    if (months >= 36) {
      const years = Math.floor(months / 12)
      return `${years} year${years !== 1 ? 's' : ''}`
    }
    return `${months} months ${days} days`
  })

  /**
   * Format date for display (Philippine locale)
   */
  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  /**
   * Formatted birth date
   */
  const formattedBirthDate = computed(() => {
    return formatDate(patient.value?.childInfo?.birthDate)
  })

  /**
   * Formatted registration date
   */
  const formattedRegisteredDate = computed(() => {
    return formatDate(patient.value?.dateRegistered)
  })

  /**
   * Formatted hearing test date
   */
  const formattedHearingTestDate = computed(() => {
    return formatDate(patient.value?.birthHistory?.hearing_test_date)
  })

  /**
   * Formatted newborn screening date
   */
  const formattedNewbornScreeningDate = computed(() => {
    return formatDate(patient.value?.birthHistory?.newborn_screening_date)
  })

  /**
   * Formatted birth weight
   */
  const formattedBirthWeight = computed(() => {
    const weight = patient.value?.birthHistory?.birth_weight
    if (!weight) return '—'
    return `${weight} kg`
  })

  /**
   * Formatted birth length
   */
  const formattedBirthLength = computed(() => {
    const length = patient.value?.birthHistory?.birth_length
    if (!length) return '—'
    return `${length} cm`
  })

  /**
   * Group vaccinations by vaccine type and sort doses
   */
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

  /**
   * Determine if a scheduled vaccine is editable
   */
  const isEditable = (vaccine) => {
    if (!vaccine || !vaccine.status) return true
    const s = String(vaccine.status).toLowerCase()
    return !(s === 'completed' || s === 'administered')
  }

  /**
   * Fetch patient details including vaccination and medical history
   */
  const fetchPatientDetails = async (id = patientId) => {
    try {
      loading.value = true
      const response = await api.get(`/patients/${id}`)
      
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
      await fetchMedicalHistory(id)
    } catch (error) {
      console.error('Error fetching patient details:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch medical history (visits) for patient
   */
  const fetchMedicalHistory = async (id = patientId) => {
    try {
      const response = await api.get(`/visits?patient_id=${id}`)
      const data = response.data
      medicalHistory.value = data.items || data.data || []
    } catch (error) {
      console.error('Error fetching medical history:', error)
      medicalHistory.value = []
    }
  }

  /**
   * Reschedule a vaccination
   */
  const rescheduleVaccination = async (scheduleId, newDate) => {
    try {
      await api.post('/immunizations/manual-reschedule', {
        p_patient_schedule_id: scheduleId,
        p_new_scheduled_date: newDate,
        cascade: true,
        force_override: true
      })
      
      // Refresh patient details after rescheduling
      await fetchPatientDetails(patientId)
    } catch (error) {
      console.error('Error rescheduling vaccination:', error)
      throw error
    }
  }

  /**
   * Toggle card expansion
   */
  const toggleCard = (cardName) => {
    if (expandedCards.value[cardName] !== undefined) {
      expandedCards.value[cardName] = !expandedCards.value[cardName]
    }
  }

  /**
   * Set active tab
   */
  const setActiveTab = (tabId) => {
    activeTab.value = tabId
  }

  return {
    // State
    patient,
    vaccinationHistory,
    scheduledVaccinations,
    medicalHistory,
    loading,
    activeTab,
    tabs,
    expandedCards,
    
    // Computed
    age,
    formattedBirthDate,
    formattedRegisteredDate,
    formattedHearingTestDate,
    formattedNewbornScreeningDate,
    formattedBirthWeight,
    formattedBirthLength,
    groupedVaccinations,
    
    // Methods
    formatDate,
    isEditable,
    fetchPatientDetails,
    fetchMedicalHistory,
    rescheduleVaccination,
    toggleCard,
    setActiveTab
  }
}
