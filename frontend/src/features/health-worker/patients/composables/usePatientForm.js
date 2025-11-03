/**
 * Composable for managing patient registration form
 * Handles form state, guardian selection, parent autofill, and validation
 */
import { ref, computed, reactive, watch } from 'vue'
import api from '@/services/offlineAPI'

export function usePatientForm() {
  // State
  const loadingGuardians = ref(true)
  const submitting = ref(false)
  const guardians = ref([])
  const motherSuggestions = ref([])
  const fatherSuggestions = ref([])
  const selectedGuardian = ref(null)
  const showMotherDropdown = ref(false)
  const showFatherDropdown = ref(false)
  const filteredMotherOptions = ref([])
  const filteredFatherOptions = ref([])

  // Card expansion state
  const expandedCards = reactive({
    patientInfo: true,
    guardianInfo: false,
    birthHistory: false
  })

  // Form data
  const formData = ref({
    firstname: '',
    middlename: '',
    surname: '',
    sex: '',
    date_of_birth: '',
    barangay: '',
    health_center: '',
    address: '',
    guardian_id: '',
    relationship_to_guardian: '',
    family_number: '',
    mother_name: '',
    mother_occupation: '',
    mother_contact_number: '',
    father_name: '',
    father_occupation: '',
    father_contact_number: '',
    time_of_birth: '',
    attendant_at_birth: '',
    type_of_delivery: '',
    birth_weight: '',
    birth_length: '',
    place_of_birth: '',
    ballards_score: '',
    newborn_screening_result: '',
    newborn_screening_date: '',
    hearing_test_date: ''
  })

  /**
   * Computed mother options (deduplicated and sorted)
   */
  const motherOptions = computed(() => {
    const recorded = Array.isArray(motherSuggestions.value) ? motherSuggestions.value : []
    const map = new Map()
    recorded.forEach(item => {
      const key = (item.full_name || '').trim().toLowerCase()
      if (key && !map.has(key)) map.set(key, item)
    })
    const arr = Array.from(map.values())
    return arr.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
  })

  /**
   * Computed father options (deduplicated and sorted)
   */
  const fatherOptions = computed(() => {
    const recorded = Array.isArray(fatherSuggestions.value) ? fatherSuggestions.value : []
    const map = new Map()
    recorded.forEach(item => {
      const key = (item.full_name || '').trim().toLowerCase()
      if (key && !map.has(key)) map.set(key, item)
    })
    const arr = Array.from(map.values())
    return arr.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
  })

  /**
   * Format guardian name as First Middle Last
   */
  const formatGuardianNameFirstMiddleLast = (guardian) => {
    const parts = []
    if (guardian?.firstname) parts.push(guardian.firstname)
    if (guardian?.middlename) parts.push(guardian.middlename)
    if (guardian?.surname) parts.push(guardian.surname)
    if (parts.length) return parts.join(' ').trim()
    return guardian?.full_name || ''
  }

  /**
   * Get contact number for a given parent name
   */
  const getContactForName = (name, type) => {
    const opts = type === 'mother' ? motherOptions.value : fatherOptions.value
    const found = opts.find(o => ((o.full_name || '').trim()) === String(name).trim())
    return found?.contact_number || null
  }

  /**
   * Apply parent autofill based on guardian selection
   * force=true will override existing values to avoid stale data when guardian/relationship changes
   */
  const applyParentAutofill = (guardian, relationship, force = false) => {
    if (!guardian || !relationship) return
    const rel = String(relationship).toLowerCase()

    if (rel === 'mother') {
      if (force || !formData.value.mother_name) {
        formData.value.mother_name = formatGuardianNameFirstMiddleLast(guardian)
      }
      if (force || !formData.value.mother_contact_number) {
        formData.value.mother_contact_number = guardian.contact_number || ''
      }
      if (force || !formData.value.mother_occupation) {
        formData.value.mother_occupation = guardian.occupation || ''
      }
    } else if (rel === 'father') {
      if (force || !formData.value.father_name) {
        formData.value.father_name = formatGuardianNameFirstMiddleLast(guardian)
      }
      if (force || !formData.value.father_contact_number) {
        formData.value.father_contact_number = guardian.contact_number || ''
      }
      if (force || !formData.value.father_occupation) {
        formData.value.father_occupation = guardian.occupation || ''
      }
    }

    fetchCoParentAndFill(rel)
  }

  // Clear both parents fields to avoid stale values when guardian/relationship changes
  const resetParentFields = () => {
    formData.value.mother_name = ''
    formData.value.mother_contact_number = ''
    formData.value.mother_occupation = ''
    formData.value.father_name = ''
    formData.value.father_contact_number = ''
    formData.value.father_occupation = ''
  }

  /**
   * Fetch and autofill co-parent information
   */
  const fetchCoParentAndFill = async (type) => {
    try {
      const isMother = String(type).toLowerCase() === 'mother'
      const normalizeName = (v) => (v ?? '').toString().trim().replace(/\s+/g, ' ')
      const chosenNameRaw = isMother ? formData.value.mother_name : formData.value.father_name
      const chosenName = normalizeName(chosenNameRaw)
      if (!chosenName) return

      const res = await api.get('/patients/parents/coparent', {
        params: {
          type: isMother ? 'mother' : 'father',
          name: chosenName
        }
      })

      const suggestion = res.data?.data?.name
      const suggestedContact = res.data?.data?.contact_number
      const suggestedOccupation = res.data?.data?.occupation
      const target = isMother ? 'father' : 'mother'

      if (suggestion && !formData.value[`${target}_name`]) {
        formData.value[`${target}_name`] = suggestion
        
        const fromApi = suggestedContact || null
        const fromOptions = getContactForName(suggestion, target)
        const finalContact = fromApi || fromOptions || null
        
        if (finalContact && !formData.value[`${target}_contact_number`]) {
          formData.value[`${target}_contact_number`] = finalContact
        }
        if (suggestedOccupation && !formData.value[`${target}_occupation`]) {
          formData.value[`${target}_occupation`] = suggestedOccupation
        }
      }

      // If no suggestion or still missing data, open suggestions for the co-parent
      const missingContact = !formData.value[`${target}_contact_number`]
      const missingOcc = !formData.value[`${target}_occupation`]
      const targetNameEmpty = !formData.value[`${target}_name`]
      if (!suggestion || targetNameEmpty || missingContact || missingOcc) {
        if (target === 'father') {
          // Prepare and show father suggestions
          filterFatherOptions()
          showFatherDropdown.value = true
        } else {
          filterMotherOptions()
          showMotherDropdown.value = true
        }
      }
    } catch (e) {
      console.warn('Co-parent suggestion error:', e?.message || e)
    }
  }

  /**
   * Handle guardian selection
   */
  const onGuardianSelected = async () => {
    const selected = guardians.value.find(g => g.guardian_id === formData.value.guardian_id)
    selectedGuardian.value = selected || null
    
    if (selected) {
      formData.value.family_number = selected.family_number || ''
    }
    
  // Ensure parents always reflect the current guardian + relationship
  resetParentFields()
  applyParentAutofill(selectedGuardian.value, formData.value.relationship_to_guardian, true)

    // If after guardian-based autofill occupation is still missing for the selected role, show suggestions for that parent
    const rel = (formData.value.relationship_to_guardian || '').toString().toLowerCase()
    if (rel === 'mother') {
      if (!formData.value.mother_occupation) {
        filterMotherOptions()
        showMotherDropdown.value = true
      }
    } else if (rel === 'father') {
      if (!formData.value.father_occupation) {
        filterFatherOptions()
        showFatherDropdown.value = true
      }
    }

    // Load richer guardian details (occupation) if missing, then re-apply
    if (selected && selected.guardian_id && (selected.occupation == null || selected.occupation === undefined)) {
      await loadGuardianDetails(selected.guardian_id)
    }
  }

  /**
   * Handle mother selection from dropdown
   */
  const onMotherSelected = (opt) => {
    if (!formData.value.mother_contact_number && opt?.contact_number) {
      formData.value.mother_contact_number = opt.contact_number
    }
    if (!formData.value.mother_occupation && opt?.occupation) {
      formData.value.mother_occupation = opt.occupation
    }
    fetchCoParentAndFill('mother')
  }

  /**
   * Handle father selection from dropdown
   */
  const onFatherSelected = (opt) => {
    if (!formData.value.father_contact_number && opt?.contact_number) {
      formData.value.father_contact_number = opt.contact_number
    }
    if (!formData.value.father_occupation && opt?.occupation) {
      formData.value.father_occupation = opt.occupation
    }
    fetchCoParentAndFill('father')
  }

  /**
   * Fetch guardian details to get occupation/contact if not present in the dropdown payload
   */
  const loadGuardianDetails = async (guardianId) => {
    try {
      const res = await api.get(`/guardians/${guardianId}`)
      const g = res.data?.data || res.data || null
      if (g) {
        selectedGuardian.value = {
          ...(selectedGuardian.value || {}),
          occupation: g.occupation || selectedGuardian.value?.occupation,
          contact_number: selectedGuardian.value?.contact_number || g.contact_number
        }
  // Re-apply autofill now that we have occupation
  applyParentAutofill(selectedGuardian.value, formData.value.relationship_to_guardian, true)
      }
    } catch (e) {
      console.warn('Failed to load guardian details (non-blocking):', e?.message || e)
    }
  }

  // React when relationship changes to apply autofill for the selected guardian
  watch(() => formData.value.relationship_to_guardian, (newRel) => {
    if (!newRel) return
    resetParentFields()
    applyParentAutofill(selectedGuardian.value, newRel, true)
    // If occupation is still missing for the selected role, open suggestions
    const rel = (newRel || '').toString().toLowerCase()
    if (rel === 'mother' && !formData.value.mother_occupation) {
      filterMotherOptions()
      showMotherDropdown.value = true
    } else if (rel === 'father' && !formData.value.father_occupation) {
      filterFatherOptions()
      showFatherDropdown.value = true
    }
  })

  // Ensure guardian id changes trigger selection handler
  watch(() => formData.value.guardian_id, () => {
    onGuardianSelected()
  })

  /**
   * Filter mother options based on search query
   */
  const filterMotherOptions = () => {
    const query = (formData.value.mother_name || '').toLowerCase()
    filteredMotherOptions.value = motherOptions.value.filter(opt =>
      (opt.full_name || '').toLowerCase().includes(query)
    ).slice(0, 10)
  }

  /**
   * Filter father options based on search query
   */
  const filterFatherOptions = () => {
    const query = (formData.value.father_name || '').toLowerCase()
    filteredFatherOptions.value = fatherOptions.value.filter(opt =>
      (opt.full_name || '').toLowerCase().includes(query)
    ).slice(0, 10)
  }

  /**
   * Select mother from dropdown
   */
  const selectMother = (opt) => {
    formData.value.mother_name = opt.full_name
    showMotherDropdown.value = false
    onMotherSelected(opt)
  }

  /**
   * Select father from dropdown
   */
  const selectFather = (opt) => {
    formData.value.father_name = opt.full_name
    showFatherDropdown.value = false
    onFatherSelected(opt)
  }

  /**
   * Hide mother dropdown with delay
   */
  const hideMotherDropdown = () => {
    setTimeout(() => showMotherDropdown.value = false, 150)
  }

  /**
   * Hide father dropdown with delay
   */
  const hideFatherDropdown = () => {
    setTimeout(() => showFatherDropdown.value = false, 150)
  }

  /**
   * Fetch guardians list
   */
  const fetchGuardians = async () => {
    try {
      loadingGuardians.value = true
      const response = await api.get('/guardians')
      guardians.value = response.data.data || response.data || []
    } catch (error) {
      console.error('Error fetching guardians:', error)
      throw error
    } finally {
      loadingGuardians.value = false
    }
  }

  /**
   * Fetch parent suggestions for autofill
   */
  const fetchParentSuggestions = async () => {
    try {
      const [momsRes, dadsRes] = await Promise.all([
        api.get('/patients/parents/suggestions', { params: { type: 'mother' } }),
        api.get('/patients/parents/suggestions', { params: { type: 'father' } })
      ])
      motherSuggestions.value = momsRes.data?.data || []
      fatherSuggestions.value = dadsRes.data?.data || []
    } catch (error) {
      console.warn('Failed to fetch parent suggestions (non-blocking):', error?.message || error)
    }
  }

  /**
   * Convert date to ISO format
   */
  const convertToISODate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = []

    // Required patient fields
    if (!formData.value.surname) errors.push('Surname is required')
    if (!formData.value.firstname) errors.push('First name is required')
    if (!formData.value.sex) errors.push('Sex is required')
    if (!formData.value.date_of_birth) errors.push('Date of birth is required')
    if (!formData.value.mother_name) errors.push('Mother name is required')
    if (!formData.value.guardian_id) errors.push('Guardian is required')
    if (!formData.value.relationship_to_guardian) errors.push('Relationship to guardian is required')

    // Required birth history fields
    if (!formData.value.time_of_birth) errors.push('Time of birth is required')
    if (!formData.value.attendant_at_birth) errors.push('Attendant at birth is required')
    if (!formData.value.type_of_delivery) errors.push('Type of delivery is required')

    return errors
  }

  /**
   * Prepare patient data for submission
   */
  const preparePatientData = () => {
    return {
      surname: formData.value.surname,
      firstname: formData.value.firstname,
      middlename: formData.value.middlename,
      sex: formData.value.sex,
      date_of_birth: convertToISODate(formData.value.date_of_birth) || formData.value.date_of_birth,
      address: formData.value.address,
      barangay: formData.value.barangay,
      health_center: formData.value.health_center,
      guardian_id: formData.value.guardian_id,
      relationship_to_guardian: formData.value.relationship_to_guardian,
      family_number: formData.value.family_number,
      mother_name: formData.value.mother_name,
      mother_occupation: formData.value.mother_occupation,
      mother_contact_number: formData.value.mother_contact_number,
      father_name: formData.value.father_name,
      father_occupation: formData.value.father_occupation,
      father_contact_number: formData.value.father_contact_number,
      medical_history: {
        time_of_birth: formData.value.time_of_birth,
        attendant_at_birth: formData.value.attendant_at_birth,
        type_of_delivery: formData.value.type_of_delivery,
        birth_weight: formData.value.birth_weight ? parseFloat(formData.value.birth_weight) : null,
        birth_length: formData.value.birth_length ? parseFloat(formData.value.birth_length) : null,
        place_of_birth: formData.value.place_of_birth,
        ballards_score: formData.value.ballards_score ? parseInt(formData.value.ballards_score) : null,
        newborn_screening_result: formData.value.newborn_screening_result,
        newborn_screening_date: convertToISODate(formData.value.newborn_screening_date),
        hearing_test_date: convertToISODate(formData.value.hearing_test_date)
      }
    }
  }

  /**
   * Submit patient form
   */
  const submitPatient = async () => {
    try {
      submitting.value = true

      const errors = validateForm()
      if (errors.length > 0) {
        throw new Error(errors[0])
      }

      const patientData = preparePatientData()
      const response = await api.post('/patients', patientData)
      
      return response.data?.data || response.data
    } catch (error) {
      console.error('Error submitting patient:', error)
      throw error
    } finally {
      submitting.value = false
    }
  }

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    formData.value = {
      firstname: '',
      middlename: '',
      surname: '',
      sex: '',
      date_of_birth: '',
      barangay: '',
      health_center: '',
      address: '',
      guardian_id: '',
      relationship_to_guardian: '',
      family_number: '',
      mother_name: '',
      mother_occupation: '',
      mother_contact_number: '',
      father_name: '',
      father_occupation: '',
      father_contact_number: '',
      time_of_birth: '',
      attendant_at_birth: '',
      type_of_delivery: '',
      birth_weight: '',
      birth_length: '',
      place_of_birth: '',
      ballards_score: '',
      newborn_screening_result: '',
      newborn_screening_date: '',
      hearing_test_date: ''
    }
    selectedGuardian.value = null
  }

  return {
    // State
    loadingGuardians,
    submitting,
    guardians,
    motherSuggestions,
    fatherSuggestions,
    selectedGuardian,
    showMotherDropdown,
    showFatherDropdown,
    filteredMotherOptions,
    filteredFatherOptions,
    expandedCards,
    formData,
    
    // Computed
    motherOptions,
    fatherOptions,
    
    // Methods
    formatGuardianNameFirstMiddleLast,
    applyParentAutofill,
    fetchCoParentAndFill,
    onGuardianSelected,
    onMotherSelected,
    onFatherSelected,
    filterMotherOptions,
    filterFatherOptions,
    selectMother,
    selectFather,
    hideMotherDropdown,
    hideFatherDropdown,
    fetchGuardians,
    fetchParentSuggestions,
    validateForm,
    preparePatientData,
    submitPatient,
    resetForm
  }
}
