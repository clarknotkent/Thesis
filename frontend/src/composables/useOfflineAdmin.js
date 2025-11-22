import { ref, computed } from 'vue'
import api from '@/services/api'
import { adminDB } from '@/services/offline/adminOfflineDB'
import { useToast } from '@/composables/useToast'

export function useOfflineAdmin() {
  const { addToast } = useToast()
  const isOffline = ref(false)
  const isConnectivityTested = ref(false)
  const isCaching = ref(false)

  // Test actual connectivity by making a lightweight request
  const testConnectivity = async () => {
    try {
      // Try to fetch a small, lightweight endpoint or make a HEAD request to root
      const response = await fetch('/', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      return response.ok
    } catch (error) {
      console.log('Connectivity test failed:', error.message)
      return false
    }
  }

  // Update offline status with actual connectivity test
  const updateOnlineStatus = async () => {
    const wasOffline = isOffline.value

    // First check navigator.onLine for quick detection
    if (!navigator.onLine) {
      isOffline.value = true
      isConnectivityTested.value = true
      if (!wasOffline) {
        console.log('📴 Browser reports offline')
      }
      return
    }

    // If browser says online, test actual connectivity
    try {
      const isConnected = await testConnectivity()
      isOffline.value = !isConnected
      isConnectivityTested.value = true

      if (wasOffline && isConnected) {
        console.log('🌐 Connection restored (confirmed by connectivity test)')
      } else if (!wasOffline && !isConnected) {
        console.log('📴 Connection lost (detected by connectivity test)')
      }
    } catch (error) {
      // If connectivity test fails, assume offline
      isOffline.value = true
      isConnectivityTested.value = true
      console.log('📴 Connectivity test failed, assuming offline')
    }
  }

  // Initial connectivity check
  const initConnectivityCheck = async () => {
    await updateOnlineStatus()

    // Set up periodic connectivity checks (every 30 seconds)
    setInterval(updateOnlineStatus, 30000)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Initial connectivity check
    initConnectivityCheck()
  }

  /**
   * Generic fetch function that tries online first, falls back to cache
   */
  const fetchWithOfflineFallback = async (apiCall, cacheQuery, _cacheKey = null) => {
    try {
      // Try online first
      if (!isOffline.value) {
        const response = await apiCall()
        return { data: response.data, fromCache: false }
      }
    } catch (error) {
      console.warn('Online request failed, trying cache:', error.message)
    }

    // Fallback to cache
    try {
      const cachedData = await cacheQuery()
      if (cachedData) {
        console.log('✅ Using cached data for offline mode')
        return { data: cachedData, fromCache: true }
      }
    } catch (cacheError) {
      console.error('Cache query failed:', cacheError)
    }

    // If both fail, return empty
    console.warn('Both online and cache failed')
    return { data: [], fromCache: false }
  }

  /**
   * Fetch patients with offline support
   */
  const fetchPatients = async (params = {}) => {
    const apiCall = () => api.get('/patients', { params })
    const cacheQuery = async () => {
      try {
        // Get all patients and filter in memory to avoid index issues
        const allPatients = await adminDB.patients.toArray()
        
        // Get all guardians for joining
        const allGuardians = await adminDB.guardians.toArray()
        const guardianMap = new Map(allGuardians.map(g => [g.guardian_id, g]))
        
        // Get all immunizations to calculate last vaccination date
        const allImmunizations = await adminDB.immunizations.toArray()
        
        // Create a map of patient_id -> most recent vaccination date
        const lastVaccinationMap = new Map()
        allImmunizations.forEach(imm => {
          const patientId = Number(imm.patient_id)
          const adminDate = imm.administered_date
          
          if (adminDate) {
            const currentDate = lastVaccinationMap.get(patientId)
            if (!currentDate || new Date(adminDate) > new Date(currentDate)) {
              lastVaccinationMap.set(patientId, adminDate)
            }
          }
        })
        
        // Filter out deleted patients (handle various representations of false)
        let activePatients = allPatients.filter(p => {
          const isDeleted = p.is_deleted
          // Consider not deleted if field doesn't exist, is false, 0, 'false', null, etc.
          return isDeleted === false || isDeleted === 0 || isDeleted === 'false' || 
                 isDeleted === null || isDeleted === undefined || isDeleted === ''
        })

        // Join patients with guardians and transform to expected format
        activePatients = activePatients.map(patient => {
          const guardian = patient.guardian_id ? guardianMap.get(patient.guardian_id) : null
          const lastVaccinationDate = lastVaccinationMap.get(Number(patient.patient_id))
          
          return {
            ...patient,
            // Add guardian information in the format expected by the component
            guardian_firstname: guardian?.firstname || '',
            guardian_middlename: guardian?.middlename || '',
            guardian_surname: guardian?.surname || '',
            guardian_contact_number: guardian?.contact_number || patient.mother_contact_number || patient.father_contact_number || '',
            guardian: guardian ? {
              full_name: guardian.full_name,
              contact_number: guardian.contact_number
            } : null,
            // Add last vaccination date
            last_vaccination_date: lastVaccinationDate || null
          }
        })

        // Apply filters
        if (params.search) {
          activePatients = activePatients.filter(p =>
            p.full_name?.toLowerCase().includes(params.search.toLowerCase()) ||
            p.firstname?.toLowerCase().includes(params.search.toLowerCase()) ||
            p.surname?.toLowerCase().includes(params.search.toLowerCase())
          )
        }

        if (params.sex) {
          activePatients = activePatients.filter(p => p.sex === params.sex)
        }

        if (params.status === 'active') {
          activePatients = activePatients.filter(p => !p.status || p.status === 'active')
        } else if (params.status === 'inactive') {
          activePatients = activePatients.filter(p => p.status === 'inactive')
        }

        return activePatients
      } catch (error) {
        console.error('Cache query failed for patients:', error)
        return []
      }
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)

    // Transform cached data to match API format with proper pagination
    if (result.fromCache) {
      const allFilteredPatients = result.data
      const page = params.page || 1
      const limit = params.limit || 10
      const offset = (page - 1) * limit

      // Apply pagination to filtered results
      const paginatedPatients = allFilteredPatients.slice(offset, offset + limit)
      const totalCount = allFilteredPatients.length
      const totalPages = Math.ceil(totalCount / limit)

      result.data = {
        data: {
          patients: paginatedPatients,
          totalCount,
          page,
          limit,
          totalPages
        }
      }
    }

    return result
  }

  /**
   * Fetch patient by ID with offline support
   */
  const fetchPatientById = async (patientId) => {
    const apiCall = async () => {
      const response = await api.get(`/patients/${patientId}`)
      
      // Cache the patient data for offline use
      try {
        const patient = response.data.data || response.data
        if (patient && patient.patient_id) {
          const transformedPatient = {
            patient_id: patient.patient_id,
            full_name: [patient.firstname, patient.middlename, patient.surname].filter(Boolean).join(' ').trim(),
            surname: patient.surname || '',
            firstname: patient.firstname || '',
            middlename: patient.middlename || '',
            date_of_birth: patient.date_of_birth,
            sex: patient.sex,
            address: patient.address,
            barangay: patient.barangay,
            health_center: patient.health_center,
            guardian_id: patient.guardian_id,
            relationship_to_guardian: patient.relationship_to_guardian,
            mother_name: patient.mother_name,
            mother_occupation: patient.mother_occupation,
            mother_contact_number: patient.mother_contact_number,
            father_name: patient.father_name,
            father_occupation: patient.father_occupation,
            father_contact_number: patient.father_contact_number,
            family_number: patient.family_number,
            tags: patient.tags,
            status: patient.status,
            is_deleted: Boolean(patient.is_deleted),
            // Preserve birth history fields that might be on the patient object
            birth_weight: patient.birth_weight || patient.birthWeight || '',
            birth_length: patient.birth_length || patient.birthLength || '',
            place_of_birth: patient.place_of_birth || patient.placeOfBirth || '',
            address_at_birth: patient.address_at_birth || patient.addressAtBirth || '',
            time_of_birth: patient.time_of_birth || patient.timeOfBirth || '',
            attendant_at_birth: patient.attendant_at_birth || patient.attendantAtBirth || '',
            type_of_delivery: patient.type_of_delivery || patient.typeOfDelivery || '',
            ballards_score: patient.ballards_score || patient.ballardsScore || '',
            hearing_test_date: patient.hearing_test_date || patient.hearingTestDate || '',
            newborn_screening_date: patient.newborn_screening_date || patient.newbornScreeningDate || '',
            newborn_screening_result: patient.newborn_screening_result || patient.newbornScreeningResult || '',
            created_at: patient.created_at,
            updated_at: patient.updated_at
          }
          await adminDB.patients.put(transformedPatient)
          console.log('💾 Cached patient data for offline use:', patient.patient_id)
        }
      } catch (cacheError) {
        console.warn('⚠️ Failed to cache patient data:', cacheError.message)
      }
      
      return response
    }
    const cacheQuery = async () => {
      console.log('🔍 Looking for patient with ID:', patientId, 'type:', typeof patientId)
      
      // Try to get patient by ID, handling both string and number types
      let patient = await adminDB.patients.get(patientId)
      
      // If not found and patientId is string, try parsing as number
      if (!patient && typeof patientId === 'string') {
        const numericId = parseInt(patientId, 10)
        if (!isNaN(numericId)) {
          console.log('🔍 Trying numeric patient ID:', numericId)
          patient = await adminDB.patients.get(numericId)
        }
      }
      
      // If not found and patientId is number, try as string
      if (!patient && typeof patientId === 'number') {
        console.log('🔍 Trying string patient ID:', patientId.toString())
        patient = await adminDB.patients.get(patientId.toString())
      }
      
      if (!patient) {
        console.log('❌ Patient not found in cache for ID:', patientId)
        // Let's check what patients are actually in the cache
        const allPatients = await adminDB.patients.toArray()
        console.log('📊 Patients in cache:', allPatients.map(p => ({ id: p.patient_id, name: p.full_name })))
        return null
      }

      // Check if patient is deleted
      const isDeleted = patient.is_deleted
      const isActive = isDeleted === false || isDeleted === 0 || isDeleted === 'false' || 
                      isDeleted === null || isDeleted === undefined || isDeleted === ''
      
      if (!isActive) {
        console.log('❌ Patient found but marked as deleted:', patientId)
        return null
      }

      console.log('✅ Found active patient in cache:', patient.patient_id || patient.id, patient.firstname, patient.surname)

      // Get guardian information if available
      let guardian = null
      if (patient.guardian_id) {
        guardian = await adminDB.guardians.get(patient.guardian_id)
        if (!guardian) {
          console.log('⚠️ Guardian not found for guardian_id:', patient.guardian_id)
        }
      }

      // Get additional data from cache - filter in memory to avoid index issues
      const allBirthHistory = await adminDB.birthhistory.toArray()
      // Match by normalized string to avoid type mismatch (string route param vs numeric PK)
      let birthHistory = allBirthHistory.find(b => String(b.patient_id) === String(patientId))

      // If birth history not in cache, try to fetch it from API and cache it
      if (!birthHistory && !isOffline.value) {
        try {
          console.log('📥 Fetching birth history for patient:', patientId)
          const birthResponse = await api.get(`/patients/${patientId}/birth-history`)
          const birthData = birthResponse.data?.data || birthResponse.data
          if (birthData && birthData.birthhistory_id) {
            birthHistory = {
              birthhistory_id: birthData.birthhistory_id,
              patient_id: patientId,
              birth_weight: birthData.birth_weight,
              birth_length: birthData.birth_length,
              place_of_birth: birthData.place_of_birth,
              address_at_birth: birthData.address_at_birth,
              time_of_birth: birthData.time_of_birth,
              attendant_at_birth: birthData.attendant_at_birth,
              type_of_delivery: birthData.type_of_delivery,
              ballards_score: birthData.ballards_score,
              hearing_test_date: birthData.hearing_test_date,
              newborn_screening_date: birthData.newborn_screening_date,
              newborn_screening_result: birthData.newborn_screening_result,
              created_at: birthData.created_at,
              updated_at: birthData.updated_at
            }
            await adminDB.birthhistory.put(birthHistory)
            console.log('💾 Cached birth history for patient:', patientId)
          }
        } catch (birthError) {
          console.warn('⚠️ Failed to fetch birth history for patient:', patientId, birthError.message)
        }
      }

      const allImmunizations = await adminDB.immunizations.toArray()
      let immunizations = allImmunizations.filter(i => 
        String(i.patient_id) === String(patientId) && i.is_deleted !== true
      )

      // If no immunizations in cache, try to fetch them from API and cache them
      if (immunizations.length === 0 && !isOffline.value) {
        try {
          console.log('📥 Fetching immunizations for patient:', patientId)
          const immunizationResponse = await api.get('/immunizations', { 
            params: { patient_id: patientId, limit: 200 } 
          })
          const immunizationData = immunizationResponse.data?.data || immunizationResponse.data?.items || immunizationResponse.data || []
          if (Array.isArray(immunizationData) && immunizationData.length > 0) {
            const transformedImmunizations = immunizationData.map(immunization => ({
              immunization_id: immunization.immunization_id,
              patient_id: immunization.patient_id,
              visit_id: immunization.visit_id,
              vaccine_id: immunization.vaccine_id,
              dose_number: immunization.dose_number,
              administered_date: immunization.administered_date,
              administered_by: immunization.administered_by,
              remarks: immunization.remarks,
              is_deleted: Boolean(immunization.is_deleted),
              created_at: immunization.created_at,
              updated_at: immunization.updated_at
            }))
            await adminDB.immunizations.bulkPut(transformedImmunizations)
            immunizations = transformedImmunizations.filter(i => !i.is_deleted)
            console.log('💾 Cached immunizations for patient:', patientId, immunizations.length, 'records')
          }
        } catch (immunizationError) {
          console.warn('⚠️ Failed to fetch immunizations for patient:', patientId, immunizationError.message)
        }
      }

      const allSchedules = await adminDB.patientschedule.toArray()
      let schedules = allSchedules.filter(s => 
        String(s.patient_id) === String(patientId) && s.is_deleted !== true
      )

      // If no schedules in cache, try to fetch them from API and cache them
      if (schedules.length === 0 && !isOffline.value) {
        try {
          console.log('📥 Fetching patient schedules for patient:', patientId)
          const scheduleResponse = await api.get(`/patients/${patientId}/schedule`)
          const scheduleData = scheduleResponse.data?.data || scheduleResponse.data || []
          if (Array.isArray(scheduleData) && scheduleData.length > 0) {
            const transformedSchedules = scheduleData.map(schedule => ({
              patient_schedule_id: schedule.patient_schedule_id || schedule.id,
              patient_id: patientId,
              vaccine_id: schedule.vaccine_id,
              scheduled_date: schedule.scheduled_date || schedule.scheduledDate,
              status: schedule.status,
              dose_number: schedule.dose_number || schedule.doseNumber,
              notes: schedule.notes,
              is_deleted: Boolean(schedule.is_deleted),
              created_at: schedule.created_at,
              updated_at: schedule.updated_at
            }))
            await adminDB.patientschedule.bulkPut(transformedSchedules)
            schedules = transformedSchedules.filter(s => !s.is_deleted)
            console.log('💾 Cached patient schedules for patient:', patientId, schedules.length, 'schedules')
          }
        } catch (scheduleError) {
          console.warn('⚠️ Failed to fetch patient schedules for patient:', patientId, scheduleError.message)
        }
      }

      // Transform patient data to include guardian information and merge birth history
      const transformedPatient = {
        ...patient,
        middlename: patient.middlename || patient.middle_name || '',
        // Family number derivation from guardian if missing
        family_number: patient.family_number || (guardian?.family_number) || patient.familyNumber || '',
        guardian_firstname: guardian?.firstname || '',
        guardian_middlename: guardian?.middlename || '',
        guardian_surname: guardian?.surname || '',
        guardian_contact_number: guardian?.contact_number || patient.mother_contact_number || patient.father_contact_number || '',
        guardian: guardian ? {
          full_name: guardian.full_name,
          contact_number: guardian.contact_number,
          family_number: guardian.family_number || guardian.familyNumber || ''
        } : null
      }

      // Merge birth history data into patient object for components that expect it there
      if (birthHistory) {
        transformedPatient.birth_weight = birthHistory.birth_weight || transformedPatient.birth_weight || ''
        transformedPatient.birth_length = birthHistory.birth_length || transformedPatient.birth_length || ''
        transformedPatient.place_of_birth = birthHistory.place_of_birth || transformedPatient.place_of_birth || ''
        transformedPatient.address_at_birth = birthHistory.address_at_birth || transformedPatient.address_at_birth || ''
        transformedPatient.time_of_birth = birthHistory.time_of_birth || transformedPatient.time_of_birth || ''
        transformedPatient.attendant_at_birth = birthHistory.attendant_at_birth || transformedPatient.attendant_at_birth || ''
        transformedPatient.type_of_delivery = birthHistory.type_of_delivery || transformedPatient.type_of_delivery || ''
        transformedPatient.ballards_score = birthHistory.ballards_score || transformedPatient.ballards_score || ''
        transformedPatient.hearing_test_date = birthHistory.hearing_test_date || transformedPatient.hearing_test_date || ''
        transformedPatient.newborn_screening_date = birthHistory.newborn_screening_date || transformedPatient.newborn_screening_date || ''
        transformedPatient.newborn_screening_result = birthHistory.newborn_screening_result || transformedPatient.newborn_screening_result || ''
      }

      return {
        data: {
          ...transformedPatient,
          medical_history: birthHistory,
          vaccinationHistory: immunizations,
          nextScheduledVaccinations: schedules
        }
      }
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)
    return result.data
  }

  /**
   * Fetch user by ID with offline support
   */
  const fetchUserById = async (userId) => {
    const apiCall = () => api.get(`/users/${userId}`)
    const cacheQuery = async () => {
      // Try to get user by ID, handling both string and number types
      console.log('🔍 Looking for user with ID:', userId, 'type:', typeof userId)
      let user = await adminDB.users.get(userId)
      
      // If not found and userId is string, try parsing as number
      if (!user && typeof userId === 'string') {
        const numericId = parseInt(userId, 10)
        if (!isNaN(numericId)) {
          console.log('🔍 Trying numeric ID:', numericId)
          user = await adminDB.users.get(numericId)
        }
      }
      
      // If not found and userId is number, try as string
      if (!user && typeof userId === 'number') {
        console.log('🔍 Trying string ID:', userId.toString())
        user = await adminDB.users.get(userId.toString())
      }
      
      if (!user) {
        console.log('❌ User not found in cache for ID:', userId)
        return null
      }
      console.log('✅ Found user in cache:', user.user_id, user.username)
      return user
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)
    return result.fromCache ? result.data : result.data
  }

  /**
   * Fetch patient stats with offline support
   */
  const fetchPatientStats = async () => {
    const apiCall = () => api.get('/patients/stats')
    const cacheQuery = async () => {
      try {
        // Get all patients and filter in memory
        const allPatients = await adminDB.patients.toArray()
        
        // Filter out deleted patients
        const activePatients = allPatients.filter(p => {
          const isDeleted = p.is_deleted
          return isDeleted === false || isDeleted === 0 || isDeleted === 'false' || 
                 isDeleted === null || isDeleted === undefined || isDeleted === ''
        })

        const totalPatients = activePatients.length
        const male = activePatients.filter(p => p.sex?.toLowerCase() === 'male').length
        const female = activePatients.filter(p => p.sex?.toLowerCase() === 'female').length

        // Calculate FIC/CIC from tags (simplified)
        const fic = activePatients.filter(p => p.tags && p.tags.includes('FIC')).length
        const cic = activePatients.filter(p => p.tags && p.tags.includes('CIC')).length

        return {
          success: true,
          stats: { totalPatients, male, female, fic, cic }
        }
      } catch (error) {
        console.error('Cache query failed for patient stats:', error)
        return { success: false, stats: { totalPatients: 0, male: 0, female: 0, fic: 0, cic: 0 } }
      }
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)
    return result.fromCache ? result.data : result.data
  }

  /**
   * Fetch vaccine inventory by ID with offline support
   */
  const fetchInventoryById = async (inventoryId) => {
    const apiCall = () => api.get(`/vaccines/inventory/${inventoryId}`)
    const cacheQuery = async () => {
      // Try direct primary key lookup (id)
      let inventory = await adminDB.inventory.get(inventoryId)

      // If not found and inventoryId is string, try numeric conversion
      if (!inventory && typeof inventoryId === 'string') {
        const numericId = parseInt(inventoryId, 10)
        if (!isNaN(numericId)) {
          inventory = await adminDB.inventory.get(numericId)
        }
      }

      // If still not found and inventoryId is number, try string form
      if (!inventory && typeof inventoryId === 'number') {
        inventory = await adminDB.inventory.get(inventoryId.toString())
      }

      // If still not found, try secondary index inventory_id
      if (!inventory) {
        inventory = await adminDB.inventory.where('inventory_id').equals(inventoryId).first()
      }
      if (!inventory && typeof inventoryId === 'string') {
        const numericId = parseInt(inventoryId, 10)
        if (!isNaN(numericId)) {
          inventory = await adminDB.inventory.where('inventory_id').equals(numericId).first()
        }
      }

      if (!inventory) return null

      const vaccine = inventory.vaccine_id ? await adminDB.vaccines.get(inventory.vaccine_id) : null
      return { data: { ...inventory, vaccine: vaccine || null } }
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)
    // Normalize empty array fallback to null
    if (Array.isArray(result.data) && result.data.length === 0) {
      return { data: null }
    }
    return result.data
  }

  /**
   * Fetch vaccine schedule by ID with offline support
   */
  const fetchScheduleById = async (scheduleId) => {
    const apiCall = () => api.get(`/vaccines/schedules/${scheduleId}`)
    const cacheQuery = async () => {
      try {
        // Locate master schedule
        let schedule = await adminDB.schedules.get(scheduleId)
        if (!schedule && typeof scheduleId === 'string') {
          const numericId = parseInt(scheduleId, 10)
          if (!isNaN(numericId)) schedule = await adminDB.schedules.get(numericId)
        }
        if (!schedule) {
          // Try by master id
          schedule = await adminDB.schedules.where('schedule_master_id').equals(scheduleId).first()
        }
        if (!schedule) {
          console.warn('[Offline] Schedule not found for id:', scheduleId)
          return null
        }

        const masterId = schedule.schedule_master_id || schedule.schedule_id || scheduleId
        // Fetch doses from dedicated table
        let doseRows = await adminDB.schedule_doses.where('schedule_master_id').equals(masterId).toArray()
        doseRows = doseRows.sort((a,b)=> (a.dose_number||0)-(b.dose_number||0))

        const schedule_doses = doseRows.map(d => ({
          dose_number: d.dose_number,
          due_after_days: d.due_after_days ?? '-',
          min_interval_days: d.min_interval_days ?? '-',
          max_interval_days: d.max_interval_days ?? '-',
          min_interval_other_vax: d.min_interval_other_vax ?? '-',
          requires_previous: d.requires_previous ?? false,
          skippable: d.skippable ?? false,
          grace_period_days: d.grace_period_days ?? '-',
          absolute_latest_days: d.absolute_latest_days ?? '-',
          notes: d.notes || ''
        }))

        const vaccine = schedule.vaccine_id ? await adminDB.vaccines.get(schedule.vaccine_id) : null

        return {
          data: {
            ...schedule,
            vaccine: vaccine || null,
            schedule_doses
          }
        }
      } catch (err) {
        console.warn('[Offline] cacheQuery for schedule failed:', err)
        return null
      }
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)
    return result.data
  }

  /**
   * Fetch vaccine schedules with offline support
   */
  const fetchSchedules = async (params = {}) => {
    const apiCall = () => api.get('/vaccines/schedules', { params })
    const cacheQuery = async () => {
      // Get all schedules and filter in memory to avoid index issues
      const allSchedules = await adminDB.schedules.toArray()
      let filtered = allSchedules.filter(s => s.is_deleted !== true)

      if (params.vaccine_id) {
        filtered = filtered.filter(s => s.vaccine_id === params.vaccine_id)
      }

      if (params.dose_number) {
        filtered = filtered.filter(s => s.dose_number === params.dose_number)
      }

      // Join with vaccine data
      const schedulesWithVaccines = await Promise.all(
        filtered.map(async (schedule) => {
          const vaccine = await adminDB.vaccines.get(schedule.vaccine_id)
          return {
            ...schedule,
            vaccine: vaccine || null
          }
        })
      )

      return schedulesWithVaccines
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)

    if (result.fromCache) {
      result.data = {
        success: true,
        data: result.data
      }
    }

    return result
  }

  /**
   * Fetch inventory transactions with offline support
   */
  const fetchInventoryTransactions = async (params = {}) => {
    const apiCall = () => api.get('/vaccines/transactions', { params })
    const cacheQuery = async () => {
      // Load all ordered by created_at then filter
      let all = await adminDB.transactions.orderBy('created_at').reverse().toArray()
      if (params.inventory_id) {
        const invIdStr = String(params.inventory_id)
        all = all.filter(t => String(t.inventory_id) === invIdStr)
      }
      if (params.transaction_type) {
        all = all.filter(t => t.transaction_type === params.transaction_type)
      }
      const limit = params.limit || 20
      const offset = ((params.page || 1) - 1) * limit
      return all.slice(offset, offset + limit)
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)

    if (result.fromCache) {
      result.data = {
        success: true,
        data: result.data,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          totalCount: result.data.length
        }
      }
    }

    return result
  }

  /**
   * Fetch receiving reports with offline support
   */
  const fetchReceivingReports = async (params = {}) => {
    const apiCall = () => api.get('/receiving-reports', { params })
    const cacheQuery = async () => {
      let query = adminDB.receiving_reports.orderBy('delivery_date').reverse()

      if (params.status) {
        query = query.and(r => r.status === params.status)
      }

      return await query.toArray()
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)

    if (result.fromCache) {
      result.data = {
        success: true,
        data: result.data
      }
    }

    return result
  }

  /**
   * Fetch receiving report by ID with offline support
   */
  const fetchReceivingReportById = async (reportId) => {
    const apiCall = () => api.get(`/receiving-reports/${reportId}`)
    const cacheQuery = async () => {
      const report = await adminDB.receiving_reports.get(reportId)
      if (!report) return null

      // Get report items from cache - filter in memory
      const allItems = await adminDB.receiving_report_items.toArray()
      const items = allItems.filter(item => item.report_id === reportId)

      return {
        data: {
          header: report,
          items: items
        }
      }
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)
    return result.data
  }

  /**
   * Fetch users with offline support
   */
  const fetchUsers = async (params = {}) => {
    const apiCall = () => api.get('/users', { params })
  const cacheQuery = async () => {
    // Note: Deleted users are already filtered out during prefetching
    // This is a safety check in case data gets corrupted
    const allUsers = await adminDB.users.toArray()

    // Safety filter for deleted users (should not be needed if prefetch works correctly)
    let query = allUsers.filter(u => {
      // Include only if explicitly not deleted or null/undefined/empty
      if (u.is_deleted === false || u.is_deleted === 0 || u.is_deleted === 'false' || u.is_deleted == null || u.is_deleted === '') return true
      return false
    })

    if (params.role) {
      query = query.filter(u => u.role === params.role)
    }

    if (params.search) {
      query = query.filter(u =>
        u.username?.toLowerCase().includes(params.search.toLowerCase()) ||
        u.firstname?.toLowerCase().includes(params.search.toLowerCase()) ||
        u.surname?.toLowerCase().includes(params.search.toLowerCase())
      )
    }

    return query
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)

    if (result.fromCache) {
      result.data = {
        users: result.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: result.data.length,
          limit: result.data.length
        }
      }
    }

    return result
  }

  /**
   * Fetch dashboard metrics with offline support
   */
  const fetchDashboardMetrics = async () => {
    const apiCall = () => api.get('/dashboard/metrics')
    const cacheQuery = async () => {
      // Compute basic stats from cached data
      const allPatients = await adminDB.patients.toArray()
      const patients = allPatients.filter(p => p.is_deleted !== true)

      const allUsers = await adminDB.users.toArray()
      const users = allUsers.filter(u => u.is_deleted !== true)

      const immunizations = await adminDB.immunizations.toArray()

      const totalPatients = patients.length
      const activeHealthWorkers = users.filter(u => u.role === 'health_worker' && u.is_active).length
      const vaccinationsToday = immunizations.filter(i =>
        i.administered_date?.startsWith(new Date().toISOString().split('T')[0])
      ).length

      // Simplified pending appointments (schedules without actual_date)
      const allSchedules = await adminDB.patientschedule.toArray()
      const schedules = allSchedules.filter(s => s.is_deleted !== true)
      const pendingAppointments = schedules.filter(s => !s.actual_date).length

      return {
        vaccinationsToday,
        totalPatients,
        activeHealthWorkers,
        pendingAppointments
      }
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)
    return result.fromCache ? result.data : result.data
  }

  /**
   * Generate monthly immunization report from cached data
   */
  const generateMonthlyReport = async (month, year) => {
    try {
      console.log(`📊 Generating monthly report from AdminOfflineDB for ${month}/${year}`)
      
      // Get data from cache - filter in memory to avoid index issues
      const allImmunizations = await adminDB.immunizations.toArray()
      const immunizations = allImmunizations.filter(i => 
        i.is_deleted !== true && i.is_deleted !== 1 && i.is_deleted !== 'true'
      ).filter(i => {
        const date = new Date(i.administered_date)
        return date.getMonth() + 1 === month && date.getFullYear() === year
      })

      console.log(`📊 Found ${immunizations.length} immunizations in cache for ${month}/${year}`)

      const allPatients = await adminDB.patients.toArray()
      // Filter out deleted and inactive patients
      const patients = allPatients.filter(p => 
        p.is_deleted !== true && 
        p.is_deleted !== 1 && 
        p.is_deleted !== 'true' &&
        p.status !== 'Inactive' &&
        p.status !== 'inactive'
      )
      
      const vaccines = await adminDB.vaccines.toArray()

      console.log(`📊 Found ${patients.length} active patients and ${vaccines.length} vaccines in cache`)

      // Initialize vaccine structure matching backend API format
      const vaccineData = {
        BCG: { male: 0, female: 0, total: 0, coverage: 0 },
        HepB: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 3, male: 0, female: 0, total: 0, coverage: 0 }
        ],
        Pentavalent: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 3, male: 0, female: 0, total: 0, coverage: 0 }
        ],
        OPV: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 3, male: 0, female: 0, total: 0, coverage: 0 }
        ],
        IPV: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 3, male: 0, female: 0, total: 0, coverage: 0 }
        ],
        PCV: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 3, male: 0, female: 0, total: 0, coverage: 0 }
        ],
        MMR: [
          { dose: 1, male: 0, female: 0, total: 0, coverage: 0 },
          { dose: 2, male: 0, female: 0, total: 0, coverage: 0 }
        ]
      }

      // Process immunizations
      immunizations.forEach(imm => {
        // Convert to numbers for comparison (handle both string and number IDs)
        const patientIdNum = Number(imm.patient_id)
        const vaccineIdNum = Number(imm.vaccine_id)
        
        const patient = patients.find(p => Number(p.patient_id) === patientIdNum)
        const vaccine = vaccines.find(v => Number(v.vaccine_id) === vaccineIdNum)

        if (!patient || !vaccine) {
          return // Skip if patient or vaccine not found
        }

        const isMale = patient.sex?.toLowerCase() === 'male' || patient.sex?.toLowerCase() === 'm'
        const isFemale = patient.sex?.toLowerCase() === 'female' || patient.sex?.toLowerCase() === 'f'
        
        const antigenName = vaccine.antigen_name || vaccine.vaccine_name || ''
        const NAME = antigenName.toUpperCase()
        const NORMAL = NAME.replace(/[^A-Z0-9]/g, '')
        
        // Parse dose number
        const rawDose = imm.dose_number ?? imm.dose_ordinal ?? imm.dose ?? 1
        const parsed = typeof rawDose === 'string' ? parseInt(rawDose.replace(/[^0-9]/g, ''), 10) : Number(rawDose)
        const dose = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
        
        // Helper to clamp dose to valid array index
        const clampDoseIndex = (d, len) => {
          const n = Number.isFinite(d) ? d : 1
          const clampedDose = Math.min(Math.max(n, 1), len)
          return clampedDose - 1 // convert to 0-based index
        }

        // Map to standardized vaccine keys (matching backend logic)
        if (NAME.includes('BCG')) {
          vaccineData.BCG.total++
          if (isMale) vaccineData.BCG.male++
          else if (isFemale) vaccineData.BCG.female++
        } else if (NAME.includes('HEPATITIS B') || NAME.includes('HEPB')) {
          const idx = clampDoseIndex(dose, vaccineData.HepB.length)
          if (vaccineData.HepB[idx]) {
            vaccineData.HepB[idx].total++
            if (isMale) vaccineData.HepB[idx].male++
            else if (isFemale) vaccineData.HepB[idx].female++
          }
        } else if (
          NAME.includes('PENTA') ||
          NAME.includes('PENTAVALENT') ||
          NAME.includes('DPT-HEPB-HIB') ||
          NAME.includes('DPT-HIB-HEPB') ||
          NAME.includes('DTP') ||
          NAME.includes('DTAP') ||
          NORMAL.includes('DPTHEPBHIB') ||
          NORMAL.includes('DPTHIBHEPB') ||
          NORMAL.includes('5IN1') ||
          ((/DPT|DTP|DTAP|DTWP|DTPW/).test(NORMAL) && NORMAL.includes('HEPB') && NORMAL.includes('HIB'))
        ) {
          const idx = clampDoseIndex(dose, vaccineData.Pentavalent.length)
          if (vaccineData.Pentavalent[idx]) {
            vaccineData.Pentavalent[idx].total++
            if (isMale) vaccineData.Pentavalent[idx].male++
            else if (isFemale) vaccineData.Pentavalent[idx].female++
          }
        } else if (NAME.includes('OPV') || NAME.includes('ORAL POLIO')) {
          const idx = clampDoseIndex(dose, vaccineData.OPV.length)
          if (vaccineData.OPV[idx]) {
            vaccineData.OPV[idx].total++
            if (isMale) vaccineData.OPV[idx].male++
            else if (isFemale) vaccineData.OPV[idx].female++
          }
        } else if (NAME.includes('IPV') || NAME.includes('INACTIVATED POLIO')) {
          const idx = clampDoseIndex(dose, vaccineData.IPV.length)
          if (vaccineData.IPV[idx]) {
            vaccineData.IPV[idx].total++
            if (isMale) vaccineData.IPV[idx].male++
            else if (isFemale) vaccineData.IPV[idx].female++
          }
        } else if (NAME.includes('PCV') || NAME.includes('PNEUMOCOCCAL')) {
          const idx = clampDoseIndex(dose, vaccineData.PCV.length)
          if (vaccineData.PCV[idx]) {
            vaccineData.PCV[idx].total++
            if (isMale) vaccineData.PCV[idx].male++
            else if (isFemale) vaccineData.PCV[idx].female++
          }
        } else if (
          NAME.includes('MMR') ||
          NAME.includes('MEASLES') ||
          NAME.includes('MCV') ||
          NAME.includes(' MR') || NAME.startsWith('MR')
        ) {
          const idx = clampDoseIndex(dose, vaccineData.MMR.length)
          if (vaccineData.MMR[idx]) {
            vaccineData.MMR[idx].total++
            if (isMale) vaccineData.MMR[idx].male++
            else if (isFemale) vaccineData.MMR[idx].female++
          }
        }
      })

      console.log('📊 Vaccine data structure:', vaccineData)

      // Calculate target population and coverage
      // Target: children born in last 2 years who are eligible for vaccination
      const endDate = new Date(year, month, 0) // Last day of the month
      const targetStartDate = new Date(year - 2, 0, 1) // 2 years before
      
      const targetPopulation = patients.filter(p => {
        if (!p.date_of_birth) return false
        const dob = new Date(p.date_of_birth)
        return dob >= targetStartDate && dob <= endDate
      })

      const targetCount = targetPopulation.length || 0
      console.log(`📊 Target population: ${targetCount} children born between ${targetStartDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}`)

      // Calculate coverage percentages
      if (targetCount > 0) {
        vaccineData.BCG.coverage = Math.round((vaccineData.BCG.total / targetCount) * 100)
        
        Object.keys(vaccineData).forEach(vn => {
          if (Array.isArray(vaccineData[vn])) {
            vaccineData[vn].forEach(d => {
              d.coverage = Math.round((d.total / targetCount) * 100)
            })
          }
        })
      }

      console.log('📊 Coverage calculated for target population:', targetCount)

      return {
        success: true,
        data: {
          month,
          year,
          vaccines: vaccineData,
          targetCount,
          totalVaccinated: immunizations.length,
          report: Object.entries(vaccineData).map(([vaccine, counts]) => ({
            vaccine,
            ...counts
          }))
        }
      }
    } catch (error) {
      console.error('Failed to generate monthly report from cache:', error)
      return { success: false, message: 'Failed to generate report' }
    }
  }

  /**
   * Check if data is available offline
   */
  const isDataAvailableOffline = async () => {
    try {
      const patientCount = await adminDB.patients.count()
      return patientCount > 0
    } catch (error) {
      return false
    }
  }

  /**
   * Get cache info
   */
  const getCacheInfo = async () => {
    try {
      const metadata = await adminDB.metadata.get('cacheStatus')
      const timestamp = await adminDB.metadata.get('lastPrefetch')

      return {
        isCached: metadata?.value === 'complete',
        lastUpdated: timestamp?.value,
        status: metadata?.value || 'not_cached'
      }
    } catch (error) {
      return { isCached: false, status: 'error' }
    }
  }

  /**
   * Fetch vaccine types with offline support
   */
  const fetchVaccines = async (params = {}) => {
    const apiCall = () => api.get('/vaccines', { params })
    const cacheQuery = async () => {
      // Get all vaccines and filter in memory to avoid index issues
      const allVaccines = await adminDB.vaccines.toArray()
      let filtered = allVaccines.filter(v => v.is_deleted !== true)

      if (params.vaccine_type) {
        filtered = filtered.filter(v => v.vaccine_type === params.vaccine_type)
      }

      if (params.category) {
        filtered = filtered.filter(v => v.category === params.category)
      }

      return filtered
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)

    if (result.fromCache) {
      result.data = {
        success: true,
        data: result.data
      }
    }

    return result
  }

  /**
   * Fetch vaccine inventory with offline support
   */
  const fetchVaccineInventory = async (params = {}) => {
    const apiCall = () => api.get('/vaccines/inventory', { params })
    const cacheQuery = async () => {
      // Get all inventory items and filter in memory to avoid index issues
      const allInventory = await adminDB.inventory.toArray()
      let filtered = allInventory.filter(i => i.is_deleted !== true)

      if (params.is_nip === 'true') {
        filtered = filtered.filter(i => i.is_nip === true)
      } else if (params.is_nip === 'false') {
        filtered = filtered.filter(i => i.is_nip === false)
      }

      // Join inventory with vaccine details
      const vaccineIds = [...new Set(filtered.map(i => i.vaccine_id).filter(id => id))]
      const vaccines = await adminDB.vaccines.where('vaccine_id').anyOf(vaccineIds).toArray()
      const vaccineMap = new Map(vaccines.map(v => [v.vaccine_id, v]))

      // Transform inventory items to include vaccine details
      const joinedInventory = filtered.map(inventory => {
        const vaccine = vaccineMap.get(inventory.vaccine_id)
        return {
          ...inventory,
          vaccine: vaccine ? {
            vaccine_id: vaccine.vaccine_id,
            antigen_name: vaccine.antigen_name,
            brand_name: vaccine.brand_name,
            manufacturer: vaccine.manufacturer,
            category: vaccine.category,
            vaccine_type: vaccine.vaccine_type
          } : null
        }
      })

      return joinedInventory
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)

    if (result.fromCache) {
      result.data = {
        success: true,
        data: result.data
      }
    }

    return result
  }

  return {
    isOffline: computed(() => isOffline.value),
    isCaching,

    // Generic fetch function
    fetchWithOfflineFallback,

    // Data fetching methods
    fetchPatients,
    fetchPatientById,
    fetchPatientStats,
    fetchVaccineInventory,
    fetchInventoryById,
    fetchVaccines,
    fetchSchedules,
    fetchScheduleById,
    fetchInventoryTransactions,
    fetchReceivingReports,
    fetchReceivingReportById,
    fetchUsers,
    fetchUserById,
    fetchDashboardMetrics,
    generateMonthlyReport,

    // Utility methods
    isDataAvailableOffline,
    getCacheInfo
  }
}