/**
 * Composable for managing patient details page logic
 * Handles patient data loading, vaccination history, scheduled vaccinations, and medical history
 * 
 * NEW: Includes offline fallback for Admin/Staff read-only access
 */
import { ref, computed } from 'vue'
import api from '@/services/api'
import { db } from '@/services/offline/db' // StaffOfflineDB (Admin + HealthStaff)
import { useOffline } from '@/composables/useOffline'

export function usePatientDetails(patientId) {
  // State
  const patient = ref(null)
  const vaccinationHistory = ref([])
  const scheduledVaccinations = ref([])
  const medicalHistory = ref([])
  const loading = ref(true)
  const activeTab = ref('patient-info')

  // Sorting state for scheduled vaccinations
  const scheduledVaccinationsSort = ref('due-date') // 'due-date', 'name-asc', 'name-desc'

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

  // Online/offline status
  const { effectiveOnline } = useOffline()

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
   * Format date for display (MM/DD/YYYY format)
   */
  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const year = date.getFullYear()
      return `${month}/${day}/${year}`
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
   * Format a time string to 12-hour format (e.g., 14:05 -> 2:05 PM)
   */
  const formatTime12h = (timeStr) => {
    if (!timeStr) return '—'
    try {
      // Handle ISO or date-time strings
      if (/[a-zA-Z]/.test(timeStr) && timeStr.includes('T')) {
        const d = new Date(timeStr)
        if (!isNaN(d)) {
          let h = d.getHours()
          const m = d.getMinutes()
          const ampm = h >= 12 ? 'PM' : 'AM'
          h = h % 12
          if (h === 0) h = 12
          const mm = String(m).padStart(2, '0')
          return `${h}:${mm} ${ampm}`
        }
      }
      // Expect HH:mm or HH:mm:ss
      const parts = String(timeStr).split(':').map(Number)
      if (parts.length >= 2 && !parts.some(n => isNaN(n))) {
        let h = parts[0]
        const m = parts[1]
        const ampm = h >= 12 ? 'PM' : 'AM'
        h = h % 12
        if (h === 0) h = 12
        const mm = String(m).padStart(2, '0')
        return `${h}:${mm} ${ampm}`
      }
      return timeStr
    } catch (_) {
      return timeStr
    }
  }

  /**
   * Formatted time of birth in 12-hour format
   */
  const formattedTimeOfBirth = computed(() => {
    return formatTime12h(patient.value?.birthHistory?.time_of_birth)
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

    // Canonical order list (aligned with admin view) for consistent display
    const VACCINE_ORDER = [
      'BCG',
      'Hepatitis B', 'Hepa B', 'Hep B',
      'Pentavalent', 'DPT-HepB-Hib', 'DPT-Hep B-HIB',
      'Oral Polio', 'OPV',
      'Inactivated Polio', 'IPV',
      'Pneumococcal', 'PCV',
      'Measles', 'MMR', 'Measles, Mumps, Rubella'
    ]

    const getOrderIndex = (name) => {
      if (!name) return 999
      const upper = String(name).toUpperCase()
      for (let i = 0; i < VACCINE_ORDER.length; i++) {
        if (upper.includes(VACCINE_ORDER[i].toUpperCase())) return i
      }
      return 999
    }

    vaccinationHistory.value.forEach(vaccination => {
      const vaccineName = vaccination.vaccine_antigen_name ||
        vaccination.vaccineName ||
        vaccination.antigen_name ||
        vaccination.antigenName ||
        'Unknown Vaccine'

      if (!groups[vaccineName]) {
        groups[vaccineName] = {
          vaccineName,
          doses: []
        }
      }
      groups[vaccineName].doses.push(vaccination)
    })

    return Object.values(groups)
      .map(group => ({
        ...group,
        doses: group.doses.sort((a, b) => {
          const doseA = a.dose_number || a.doseNumber || a.dose || 0
          const doseB = b.dose_number || b.doseNumber || b.dose || 0
          return doseA - doseB
        })
      }))
      .sort((a, b) => getOrderIndex(a.vaccineName) - getOrderIndex(b.vaccineName))
  })

  /**
   * Sorted scheduled vaccinations based on current sort option
   */
  const sortedScheduledVaccinations = computed(() => {
    const vaccines = [...scheduledVaccinations.value]

    switch (scheduledVaccinationsSort.value) {
      case 'name-asc':
        return vaccines.sort((a, b) => {
          const nameA = (a.vaccine_name || a.antigen_name || a.vaccineName || 'Unknown Vaccine').toLowerCase()
          const nameB = (b.vaccine_name || b.antigen_name || b.vaccineName || 'Unknown Vaccine').toLowerCase()
          return nameA.localeCompare(nameB)
        })
      case 'name-desc':
        return vaccines.sort((a, b) => {
          const nameA = (a.vaccine_name || a.antigen_name || a.vaccineName || 'Unknown Vaccine').toLowerCase()
          const nameB = (b.vaccine_name || b.antigen_name || b.vaccineName || 'Unknown Vaccine').toLowerCase()
          return nameB.localeCompare(nameA)
        })
      case 'due-date':
      default:
        return vaccines.sort((a, b) => {
          const dateA = new Date(a.scheduled_date || '9999-12-31')
          const dateB = new Date(b.scheduled_date || '9999-12-31')
          return dateA - dateB
        })
    }
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

      // OFFLINE-FIRST: if offline, load from cache immediately to avoid Axios network errors
      if (!effectiveOnline.value) {
        await loadFromCache(id)
        return
      }
      
      // ONLINE PATH: Fetch from API
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
      
      console.log('✅ Fetched patient details from API (Online)')
      
    } catch (error) {
      console.warn('⚠️ API fetch failed. Attempting to load from local cache.', error)
      await loadFromCache(id)
    } finally {
      loading.value = false
    }
  }

  // Helper: load patient details and related data from Dexie cache
  const loadFromCache = async (id) => {
    // Ensure database is open before using it
    if (!db.isOpen()) {
      await db.open()
      console.log('✅ StaffOfflineDB opened for patient details fetch')
    }

    const cachedPatient = await db.patients.get(Number(id))
    if (!cachedPatient) {
      console.log(`ℹ️ Patient ${id} not found in cache.`)
      throw new Error('Patient not found in offline cache')
    }

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
        phoneNumber: cachedPatient.guardian_contact_number
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
        id: cachedPatient.guardian_id,
        name: cachedPatient.guardian_firstname ? `${cachedPatient.guardian_firstname} ${cachedPatient.guardian_surname || ''}`.trim() : '—',
        contact_number: cachedPatient.guardian_contact_number,
        family_number: cachedPatient.guardian_family_number,
        relationship: cachedPatient.relationship_to_guardian
      },
      birthHistory: {
        birth_weight: cachedPatient.birth_weight,
        birth_length: cachedPatient.birth_length,
        place_of_birth: cachedPatient.place_of_birth,
        address_at_birth: cachedPatient.address_at_birth,
        time_of_birth: cachedPatient.time_of_birth,
        attendant_at_birth: cachedPatient.attendant_at_birth,
        type_of_delivery: cachedPatient.type_of_delivery,
        ballards_score: cachedPatient.ballards_score,
        hearing_test_date: cachedPatient.hearing_test_date,
        newborn_screening_date: cachedPatient.newborn_screening_date,
        newborn_screening_result: cachedPatient.newborn_screening_result
      },
      health_center: cachedPatient.health_center,
      tags: cachedPatient.tags,
      dateRegistered: cachedPatient.date_registered,
      age_months: cachedPatient.age_months,
      age_days: cachedPatient.age_days
    }

    // Enrich parent details from guardians if missing
    try {
      const rel = (cachedPatient.relationship_to_guardian || '').toLowerCase()
      const gid = cachedPatient.guardian_id ? Number(cachedPatient.guardian_id) : null
      if (gid) {
        const g = await db.guardians.get(gid)
        if (g) {
          if (rel === 'mother') {
            if (!patient.value.motherInfo?.name) {
              const gname = g.full_name || `${g.firstname || ''} ${g.middlename || ''} ${g.surname || ''}`.trim()
              patient.value.motherInfo.name = gname || patient.value.motherInfo.name
            }
            if (!patient.value.motherInfo?.occupation && g.occupation) {
              patient.value.motherInfo.occupation = g.occupation
            }
            if (!patient.value.motherInfo?.phone) {
              patient.value.motherInfo.phone = cachedPatient.guardian_contact_number || g.contact_number || patient.value.motherInfo.phone
            }
          } else if (rel === 'father') {
            if (!patient.value.fatherInfo?.name) {
              const gname = g.full_name || `${g.firstname || ''} ${g.middlename || ''} ${g.surname || ''}`.trim()
              patient.value.fatherInfo.name = gname || patient.value.fatherInfo.name
            }
            if (!patient.value.fatherInfo?.occupation && g.occupation) {
              patient.value.fatherInfo.occupation = g.occupation
            }
            if (!patient.value.fatherInfo?.phone) {
              patient.value.fatherInfo.phone = cachedPatient.guardian_contact_number || g.contact_number || patient.value.fatherInfo.phone
            }
          }
        }
      }

      // Additional enrichment by family number for father's details
      const needFatherOcc = !patient.value.fatherInfo?.occupation
      const needFatherPhone = !patient.value.fatherInfo?.phone
      const needFatherName = !patient.value.fatherInfo?.name
      if ((needFatherOcc || needFatherPhone || needFatherName) && cachedPatient.family_number) {
        try {
          const allGuardians = await db.guardians.toArray()
          const familyGuardians = allGuardians.filter(x => (x.family_number || '') === cachedPatient.family_number)
          if (familyGuardians && familyGuardians.length > 0) {
            const male = familyGuardians.find(x => (x.sex || '').toString().toLowerCase().startsWith('m'))
            const cand = male || familyGuardians[0]
            if (cand) {
              if (needFatherName) {
                const fn = cand.full_name || `${cand.firstname || ''} ${cand.middlename || ''} ${cand.surname || ''}`.trim()
                if (fn) patient.value.fatherInfo.name = fn
              }
              if (needFatherOcc && cand.occupation) {
                patient.value.fatherInfo.occupation = cand.occupation
              }
              if (needFatherPhone && cand.contact_number) {
                patient.value.fatherInfo.phone = cand.contact_number
              }
            }
          }
        } catch (_) { /* non-blocking */ }
      }
    } catch (enrichErr) {
      console.warn('⚠️ Could not enrich parent details from guardians cache:', enrichErr)
    }

    // Load related data from cache
    try {
      vaccinationHistory.value = await db.immunizations
        .where('patient_id').equals(Number(id))
        .sortBy('administered_date')
    } catch (_) { vaccinationHistory.value = [] }

    try {
      scheduledVaccinations.value = await db.patientschedule
        .where('patient_id').equals(Number(id))
        .sortBy('scheduled_date')
    } catch (_) { scheduledVaccinations.value = [] }

    try {
      medicalHistory.value = await db.visits
        .where('patient_id').equals(Number(id))
        .sortBy('visit_date')
    } catch (_) { medicalHistory.value = [] }

    console.log(`✅ Successfully loaded patient ${id} with related data from local cache (Offline)`) 
  }

  /**
   * Fetch medical history (visits) for patient
   */
  const fetchMedicalHistory = async (id = patientId) => {
    try {
      // OFFLINE-FIRST: Check if offline and load from cache
      if (!effectiveOnline.value) {
        if (!db.isOpen()) {
          await db.open()
        }
        const cachedVisits = await db.visits.where('patient_id').equals(Number(id)).toArray()
        
        // Enrich each visit with immunizations from cache
        const enrichedVisits = await Promise.all(cachedVisits.map(async (visit) => {
          if (!visit.visit_id) {
            return { ...visit, immunizations: [] }
          }
          const visitImms = await db.immunizations.where('visit_id').equals(visit.visit_id).toArray()
          return {
            ...visit,
            service_rendered: visit.service_rendered || visit.visit_type || 'General Checkup',
            immunizations: visitImms.map(imm => ({
              id: imm.immunization_id,
              vaccineName: imm.antigen_name || imm.vaccine_antigen_name || 'Unknown',
              antigen_name: imm.antigen_name || imm.vaccine_antigen_name,
              dose_number: imm.dose_number,
              administered_date: imm.administered_date
            }))
          }
        }))
        
        medicalHistory.value = enrichedVisits
        console.log('✅ Loaded medical history from offline cache:', enrichedVisits.length, 'visits')
        console.log('Sample visit:', enrichedVisits[0])
        return
      }

      // ONLINE: Fetch from API
      const response = await api.get(`/visits?patient_id=${id}`)
      const data = response.data
      const visits = data.items || data.data || []
      
      // Fetch immunizations for each visit to populate the immunizations array
      const enrichedVisits = await Promise.all(visits.map(async (visit) => {
        try {
          if (!visit.visit_id) {
            return { ...visit, service_rendered: visit.service_rendered || visit.visit_type || 'General Checkup', immunizations: [] }
          }
          const immResponse = await api.get(`/immunizations?visit_id=${visit.visit_id}`)
          const immunizations = immResponse.data?.data || immResponse.data || []
          return {
            ...visit,
            service_rendered: visit.service_rendered || visit.visit_type || 'General Checkup',
            immunizations: immunizations.map(imm => ({
              id: imm.immunization_id || imm.id,
              vaccineName: imm.antigen_name || imm.vaccine_antigen_name || imm.vaccine_name || 'Unknown',
              antigen_name: imm.antigen_name || imm.vaccine_antigen_name,
              dose_number: imm.dose_number || imm.doseNumber,
              administered_date: imm.administered_date || imm.administeredDate
            }))
          }
        } catch (err) {
          console.warn(`Failed to fetch immunizations for visit ${visit.visit_id}:`, err)
          return { ...visit, service_rendered: visit.service_rendered || visit.visit_type || 'General Checkup', immunizations: [] }
        }
      }))
      
      medicalHistory.value = enrichedVisits
      console.log('✅ Loaded medical history from API:', enrichedVisits.length, 'visits')
      console.log('Sample visit:', enrichedVisits[0])
    } catch (error) {
      console.error('Error fetching medical history:', error)
      medicalHistory.value = []
    }
  }

  /**
   * Reschedule a vaccination
   */
  const rescheduleVaccination = async (scheduleId, newDate, timeSlot = null) => {
    try {
      const payload = {
        p_patient_schedule_id: scheduleId,
        p_new_scheduled_date: newDate,
        cascade: true,
        force_override: true
      }
      
      // Add time_slot if provided
      if (timeSlot) {
        payload.p_time_slot = timeSlot
      }
      
      await api.post('/immunizations/manual-reschedule', payload)
      
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

  /**
   * Set scheduled vaccinations sort option
   */
  const setScheduledVaccinationsSort = (sortOption) => {
    scheduledVaccinationsSort.value = sortOption
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
    
    // Sorting state
    scheduledVaccinationsSort,
    
    // Computed
    age,
    formattedBirthDate,
    formattedRegisteredDate,
    formattedHearingTestDate,
    formattedNewbornScreeningDate,
  formattedTimeOfBirth,
    formattedBirthWeight,
    formattedBirthLength,
    groupedVaccinations,
    sortedScheduledVaccinations,
    
    // Methods
    formatDate,
    isEditable,
    fetchPatientDetails,
    fetchMedicalHistory,
    rescheduleVaccination,
    toggleCard,
    setActiveTab,
    setScheduledVaccinationsSort
  }
}
