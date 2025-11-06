/**
 * Composable for managing patient registration form
 * Handles form state, guardian selection, parent autofill, and validation
 * 
 * OFFLINE-FIRST ARCHITECTURE:
 * All patient saves go to local Dexie database first, then sync to Supabase via syncService
 */
import { ref, computed, reactive, watch } from 'vue'
import db from '@/services/offline/db'

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
    const norm = (v) => (v ?? '').toString().trim().replace(/\s+/g, ' ').toLowerCase()
    const target = norm(name)
    const found = opts.find(o => norm(o.full_name) === target)
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
   * OFFLINE-FIRST: Query local Dexie database for co-parent suggestions
   */
  const fetchCoParentAndFill = async (type) => {
    try {
      const isMother = String(type).toLowerCase() === 'mother'
      const normalizeName = (v) => (v ?? '').toString().trim().replace(/\s+/g, ' ')
      const chosenNameRaw = isMother ? formData.value.mother_name : formData.value.father_name
      const chosenName = normalizeName(chosenNameRaw)
      if (!chosenName) return

      // 1) Try backend co-parent inference (admin UI logic)
      try {
        const res = await api.get('/patients/parents/coparent', { params: { type: isMother ? 'mother' : 'father', name: chosenName } })
        const suggestion = res?.data?.data?.name
        const suggestedContact = res?.data?.data?.contact_number
        const suggestedOccupation = res?.data?.data?.occupation
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
          return
        }
      } catch (apiErr) {
        // non-blocking: fall back to offline heuristic
      }

      // 2) Offline fallback: infer from local patients table
      const normalizeLower = (v) => (v ?? '').toString().trim().replace(/\s+/g, ' ').toLowerCase()
      const allPatients = await db.patients.toArray()
      const parentField = isMother ? 'mother_name' : 'father_name'
      const coParentField = isMother ? 'father_name' : 'mother_name'
      const coParentContactField = isMother ? 'father_contact_number' : 'mother_contact_number'
      const coParentOccupationField = isMother ? 'father_occupation' : 'mother_occupation'
      const matchingPatient = allPatients.find(p => normalizeLower(p[parentField]) === normalizeLower(chosenNameRaw))
      const suggestion = matchingPatient?.[coParentField] || null
      const suggestedContact = matchingPatient?.[coParentContactField] || null
      const suggestedOccupation = matchingPatient?.[coParentOccupationField] || null
      const target = isMother ? 'father' : 'mother'
      if (suggestion && !formData.value[`${target}_name`]) {
        formData.value[`${target}_name`] = suggestion
        const fromLocal = suggestedContact || null
        const fromOptions = getContactForName(suggestion, target)
        const finalContact = fromLocal || fromOptions || null
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
   * OFFLINE-FIRST: Query local Dexie database
   */
  const loadGuardianDetails = async (guardianId) => {
    try {
      // 1) Try Dexie first for speed
      let g = null
      try {
        g = await db.guardians.get(guardianId)
      } catch (dexieErr) {
        console.warn('Dexie guardian read failed (non-blocking):', dexieErr?.message || dexieErr)
      }

      // 2) If missing or lacking occupation, fetch from API as authoritative
      if (!g || g.occupation == null) {
        try {
          const res = await api.get(`/guardians/${guardianId}`)
          const fromApi = res?.data?.data || res?.data || null
          if (fromApi) {
            // Upsert into Dexie for future offline use
            try {
              await db.guardians.put({ ...fromApi, guardian_id: fromApi.guardian_id || guardianId })
            } catch (cacheErr) {
              console.warn('Dexie guardian cache put failed (non-blocking):', cacheErr?.message || cacheErr)
            }
            g = fromApi
          }
        } catch (apiErr) {
          console.warn('API guardian fetch failed (non-blocking):', apiErr?.message || apiErr)
        }
      }

      if (g) {
        selectedGuardian.value = {
          ...(selectedGuardian.value || {}),
          occupation: g.occupation || selectedGuardian.value?.occupation,
          contact_number: selectedGuardian.value?.contact_number || g.contact_number
        }
        // Re-apply autofill now that we have richer data
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
   * ONLINE-FIRST when network is available; otherwise fall back to Dexie cache.
   * If cache exists and we're online, show cache immediately then refresh from API in-place.
   */
  const fetchGuardians = async () => {
    try {
      loadingGuardians.value = true

      // 1) Read from local cache to render something fast
      let localCount = 0
      try {
        const localGuardians = await db.guardians.toArray()
        if (Array.isArray(localGuardians) && localGuardians.length > 0) {
          guardians.value = normalizeGuardians(localGuardians)
          localCount = guardians.value.length
          console.log('✅ Loaded guardians from Dexie (warm cache):', localCount)
        }
      } catch (dexieErr) {
        console.warn('Dexie read failed (non-blocking):', dexieErr?.message || dexieErr)
      }

      // 2) Decide online/offline
      const isOnline = (typeof navigator === 'undefined') ? true : !!navigator.onLine

      if (isOnline) {
        // 2a) Online: fetch fresh list from API and overwrite UI + cache
        try {
          const res = await api.get('/guardians')
          const fromApi = res?.data?.data || res?.data || []
          const normalized = normalizeGuardians(Array.isArray(fromApi) ? fromApi : [])
          guardians.value = normalized
          console.log('🌐 Loaded guardians from API:', guardians.value.length)

          // Upsert into Dexie for offline use
          if (normalized.length > 0) {
            try {
              await db.guardians.bulkPut(normalized)
              console.log('💾 Cached guardians to Dexie (refreshed)')
            } catch (cacheErr) {
              console.warn('Failed to cache guardians (non-blocking):', cacheErr?.message || cacheErr)
            }
          }
        } catch (apiErr) {
          console.error('Error fetching guardians from API (falling back to cache):', apiErr?.message || apiErr)
          // If we have no local data at all, ensure array shape
          if (!localCount) guardians.value = []
        }
      } else {
        // 2b) Offline: rely on whatever cache provided
        if (!localCount) {
          guardians.value = []
          console.log('📴 Offline and no guardians in cache')
        } else {
          console.log('📴 Offline - using cached guardians:', localCount)
        }
      }
    } catch (error) {
      console.error('Error fetching guardians:', error)
      throw error
    } finally {
      loadingGuardians.value = false
    }
  }

  // Ensure dropdown gets clean, unique, displayable items
  const normalizeGuardians = (list) => {
    const byId = new Map()
    for (const g of list || []) {
      const id = g?.guardian_id
      if (!id) continue // ignore entries without a valid guardian_id
      // Build a human-friendly name if missing
      const fullName = g.full_name && String(g.full_name).trim()
        ? g.full_name
        : (() => {
            const sname = g.surname || ''
            const fname = g.firstname || ''
            const mname = g.middlename || ''
            const fm = [fname, mname].filter(Boolean).join(' ').trim()
            return [sname, fm].filter(Boolean).join(', ').trim()
          })()
      const normalized = {
        guardian_id: id,
        user_id: g.user_id || null,
        surname: g.surname || null,
        firstname: g.firstname || null,
        middlename: g.middlename || null,
        sex: g.sex || null,
        contact_number: g.contact_number || null,
        email: g.email || null,
        address: g.address || null,
        family_number: g.family_number || g.guardian_family_number || '',
        occupation: g.occupation || null,
        full_name: fullName || '—'
      }
      if (!byId.has(id)) byId.set(id, normalized)
    }
    return Array.from(byId.values()).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
  }

  /**
   * Fetch parent suggestions for autofill
   * OFFLINE-FIRST: Extract unique parent names from local patients table
   */
  const fetchParentSuggestions = async () => {
    try {
      // Read all patients from Dexie
      const allPatients = await db.patients.toArray()
      
      // Extract unique mothers
      const mothersMap = new Map()
      allPatients.forEach(patient => {
        if (patient.mother_name) {
          const key = patient.mother_name.trim().toLowerCase()
          if (!mothersMap.has(key)) {
            mothersMap.set(key, {
              full_name: patient.mother_name,
              contact_number: patient.mother_contact_number || null,
              occupation: patient.mother_occupation || null
            })
          }
        }
      })
      
      // Extract unique fathers
      const fathersMap = new Map()
      allPatients.forEach(patient => {
        if (patient.father_name) {
          const key = patient.father_name.trim().toLowerCase()
          if (!fathersMap.has(key)) {
            fathersMap.set(key, {
              full_name: patient.father_name,
              contact_number: patient.father_contact_number || null,
              occupation: patient.father_occupation || null
            })
          }
        }
      })
      
      motherSuggestions.value = Array.from(mothersMap.values())
      fatherSuggestions.value = Array.from(fathersMap.values())
      
      console.log('✅ Loaded parent suggestions from Dexie:', {
        mothers: motherSuggestions.value.length,
        fathers: fatherSuggestions.value.length
      })
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
   * OFFLINE-FIRST: Writes to Dexie (local IndexedDB) and queues for sync
   */
  const submitPatient = async () => {
    try {
      submitting.value = true

      const errors = validateForm()
      if (errors.length > 0) {
        throw new Error(errors[0])
      }

      const patientData = preparePatientData()
      const isOnline = (typeof navigator === 'undefined') ? true : !!navigator.onLine
      
      // ONLINE-FIRST: if network is available, submit directly to API
      if (isOnline) {
        try {
          // Align payload with admin API contract (expects birthhistory block)
          const serverPayload = {
            surname: patientData.surname,
            firstname: patientData.firstname,
            middlename: patientData.middlename,
            sex: patientData.sex,
            date_of_birth: patientData.date_of_birth,
            address: patientData.address,
            barangay: patientData.barangay,
            health_center: patientData.health_center,
            guardian_id: patientData.guardian_id,
            relationship_to_guardian: patientData.relationship_to_guardian,
            family_number: patientData.family_number,
            mother_name: patientData.mother_name,
            mother_occupation: patientData.mother_occupation,
            mother_contact_number: patientData.mother_contact_number,
            father_name: patientData.father_name,
            father_occupation: patientData.father_occupation,
            father_contact_number: patientData.father_contact_number,
            // Some backends also accept these at top-level; include for compatibility
            birth_weight: patientData.medical_history?.birth_weight ?? null,
            birth_length: patientData.medical_history?.birth_length ?? null,
            place_of_birth: patientData.medical_history?.place_of_birth ?? null,
            birthhistory: {
              birth_weight: patientData.medical_history?.birth_weight ?? null,
              birth_length: patientData.medical_history?.birth_length ?? null,
              place_of_birth: patientData.medical_history?.place_of_birth ?? null,
              time_of_birth: patientData.medical_history?.time_of_birth ?? null,
              attendant_at_birth: patientData.medical_history?.attendant_at_birth ?? null,
              type_of_delivery: patientData.medical_history?.type_of_delivery ?? null,
              ballards_score: patientData.medical_history?.ballards_score ?? null,
              newborn_screening_result: patientData.medical_history?.newborn_screening_result ?? null,
              hearing_test_date: patientData.medical_history?.hearing_test_date ?? null,
              newborn_screening_date: patientData.medical_history?.newborn_screening_date ?? null
            }
          }

          const res = await api.post('/patients', serverPayload)
          const serverRecord = res?.data?.data || res?.data || null

          // Best-effort: cache minimal patient to Dexie for parent portal views
          try {
            const pid = serverRecord?.patient_id || serverRecord?.id
            if (pid) {
              const full_name = [serverRecord?.firstname || patientData.firstname, serverRecord?.middlename || patientData.middlename, serverRecord?.surname || patientData.surname].filter(Boolean).join(' ').trim()
              await db.patients.put({
                patient_id: String(pid),
                surname: serverRecord?.surname || patientData.surname,
                firstname: serverRecord?.firstname || patientData.firstname,
                middlename: serverRecord?.middlename || patientData.middlename,
                full_name,
                date_of_birth: serverRecord?.date_of_birth || patientData.date_of_birth,
                guardian_id: serverRecord?.guardian_id || patientData.guardian_id,
                family_number: serverRecord?.family_number || patientData.family_number
              })
            }
          } catch (cacheErr) {
            // Non-blocking cache write failure
            console.warn('Dexie cache put failed (non-blocking):', cacheErr?.message || cacheErr)
          }

          return serverRecord
        } catch (apiErr) {
          console.warn('Online submit failed, falling back to offline path (will sync later if supported):', apiErr?.message || apiErr)
          // Continue to offline path
        }
      }
      
  // Generate a temporary UUID for the patient (will be replaced by Supabase UUID on sync)
  const tempId = `temp_patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Add metadata for offline-first
      const buildFullName = (p) => {
        const parts = [p.firstname, p.middlename, p.surname].filter(Boolean)
        return parts.join(' ').trim()
      }

      const localPatientRecord = {
        // IMPORTANT: Dexie schema primary key is patient_id
        patient_id: tempId,
        ...patientData,
        full_name: buildFullName(patientData),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _pending: true, // Flag to indicate this hasn't been synced yet
        _temp_id: tempId // Keep track of temp ID for later reference
      }

  // STEP 1: Save to local Dexie database (patients table)
      await db.patients.add(localPatientRecord)
      console.log('✅ Patient saved to local Dexie database:', tempId)

      // STEP 2: Add task to pending_uploads (Outbox Pattern) if available in this build
      try {
        if (db.pending_uploads && typeof db.pending_uploads.add === 'function') {
          await db.pending_uploads.add({
            type: 'patient',
            operation: 'create',
            data: patientData,
            local_id: tempId,
            created_at: new Date().toISOString(),
            status: 'pending'
          })
          console.log('✅ Patient queued for sync in pending_uploads')
        } else {
          console.warn('ℹ️ pending_uploads table not available in current offline DB schema; skipping outbox queue (non-blocking).')
        }
      } catch (outboxErr) {
        console.warn('Failed to queue patient in pending_uploads (non-blocking):', outboxErr?.message || outboxErr)
      }

      // Return the local record so the UI can use it immediately
      return localPatientRecord
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
