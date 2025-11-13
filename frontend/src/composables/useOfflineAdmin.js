import { ref, computed } from 'vue'
import api from '@/services/api'
import { adminDB } from '@/services/offline/adminOfflineDB'
import { useToast } from '@/composables/useToast'

export function useOfflineAdmin() {
  const { addToast } = useToast()
  const isOffline = ref(!navigator.onLine)
  const isCaching = ref(false)

  // Listen for online/offline events
  const updateOnlineStatus = () => {
    isOffline.value = !navigator.onLine
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  }

  /**
   * Generic fetch function that tries online first, falls back to cache
   */
  const fetchWithOfflineFallback = async (apiCall, cacheQuery, cacheKey = null) => {
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
            } : null
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
      let birthHistory = allBirthHistory.find(b => b.patient_id === patientId)

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
        i.patient_id === patientId && i.is_deleted !== true
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
        s.patient_id === patientId && s.is_deleted !== true
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

      // Transform patient data to include guardian information
      const transformedPatient = {
        ...patient,
        // Add guardian information in the format expected by components
        guardian_firstname: guardian?.firstname || '',
        guardian_middlename: guardian?.middlename || '',
        guardian_surname: guardian?.surname || '',
        guardian_contact_number: guardian?.contact_number || patient.mother_contact_number || patient.father_contact_number || '',
        guardian: guardian ? {
          full_name: guardian.full_name,
          contact_number: guardian.contact_number
        } : null
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
      const inventory = await adminDB.inventory.get(inventoryId)
      if (!inventory) return null

      // Get vaccine details
      const vaccine = await adminDB.vaccines.get(inventory.vaccine_id)

      return {
        data: {
          ...inventory,
          vaccine: vaccine || null
        }
      }
    }

    const result = await fetchWithOfflineFallback(apiCall, cacheQuery)
    return result.data
  }

  /**
   * Fetch vaccine schedule by ID with offline support
   */
  const fetchScheduleById = async (scheduleId) => {
    const apiCall = () => api.get(`/vaccines/schedules/${scheduleId}`)
    const cacheQuery = async () => {
      const schedule = await adminDB.schedules.get(scheduleId)
      if (!schedule) return null

      // Get vaccine details
      const vaccine = await adminDB.vaccines.get(schedule.vaccine_id)

      return {
        data: {
          ...schedule,
          vaccine: vaccine || null
        }
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
    const apiCall = () => api.get('/vaccines/inventory/transactions', { params })
    const cacheQuery = async () => {
      let query = adminDB.transactions.orderBy('created_at').reverse()

      if (params.inventory_id) {
        query = query.and(t => t.inventory_id === params.inventory_id)
      }

      if (params.transaction_type) {
        query = query.and(t => t.transaction_type === params.transaction_type)
      }

      // Simple pagination simulation
      const all = await query.toArray()
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
      // Get data from cache - filter in memory to avoid index issues
      const allImmunizations = await adminDB.immunizations.toArray()
      const immunizations = allImmunizations.filter(i => 
        i.is_deleted !== true && i.is_deleted !== 1 && i.is_deleted !== 'true'
      ).filter(i => {
        const date = new Date(i.administered_date)
        return date.getMonth() + 1 === month && date.getFullYear() === year
      })

      const patients = await adminDB.patients.toArray()
      const vaccines = await adminDB.vaccines.toArray()

      // Group by vaccine and gender
      const report = {}

      immunizations.forEach(imm => {
        const patient = patients.find(p => p.patient_id === imm.patient_id)
        const vaccine = vaccines.find(v => v.vaccine_id === imm.vaccine_id)

        if (!patient || !vaccine) return

        const key = vaccine.antigen_name || vaccine.vaccine_id
        if (!report[key]) {
          report[key] = { male: 0, female: 0, total: 0 }
        }

        if (patient.sex?.toLowerCase() === 'male') {
          report[key].male++
        } else if (patient.sex?.toLowerCase() === 'female') {
          report[key].female++
        }
        report[key].total++
      })

      return {
        success: true,
        data: {
          month,
          year,
          report: Object.entries(report).map(([vaccine, counts]) => ({
            vaccine,
            ...counts
          })),
          totalVaccinated: immunizations.length
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