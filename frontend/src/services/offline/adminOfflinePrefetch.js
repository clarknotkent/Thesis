/**
 * Admin Offline Data Prefetch Service
 * Fetches and caches all admin data for offline readonly access
 */
import api from '@/services/api'
import { adminDB } from './adminOfflineDB'

/**
 * Prefetch all admin data for offline access
 * Called after admin login to cache data
 */
export async function prefetchAdminData() {
  console.log('📥 [Admin] Starting admin data prefetch for offline access...')

  try {
    // Cache timestamp
    await adminDB.metadata.put({
      key: 'lastPrefetch',
      value: new Date().toISOString(),
      timestamp: Date.now()
    })

    // 1. Fetch and cache patients
    console.log('📥 Fetching patients...')
    await prefetchPatients()

    // 2. Fetch and cache guardians
    console.log('📥 Fetching guardians...')
    await prefetchGuardians()

    // 3. Fetch and cache users
    console.log('📥 Fetching users...')
    await prefetchUsers()

    // 4. Fetch and cache health workers
    console.log('📥 Fetching health workers...')
    await prefetchHealthWorkers()

    // 5. Fetch and cache vaccine inventory
    console.log('📥 Fetching vaccine inventory...')
    await prefetchInventory()

    // 6. Fetch and cache vaccine types
    console.log('📥 Fetching vaccine types...')
    await prefetchVaccines()

    // 7. Fetch and cache vaccine schedules
    console.log('📥 Fetching vaccine schedules...')
    await prefetchSchedules()

    // 8. Fetch and cache inventory transactions
    console.log('📥 Fetching inventory transactions...')
    await prefetchTransactions()

    // 8. Fetch and cache immunizations
    console.log('📥 Fetching immunizations...')
    await prefetchImmunizations()

    // 9. Fetch and cache visits
    console.log('📥 Fetching visits...')
    await prefetchVisits()

    // 10. Fetch and cache visits
    console.log('📥 Fetching visits...')
    await prefetchVisits()

    // Note: Vitals prefetch skipped - no bulk endpoint available
    // Vitals are fetched per visit when needed

    // Note: Patient schedules prefetch skipped - no bulk endpoint available
    // Patient schedules are fetched per patient when needed

    // 11. Fetch and cache deworming records
    console.log('📥 Fetching deworming records...')
    await prefetchDeworming()

    // 13. Fetch and cache vitamin A records
    console.log('📥 Fetching vitamin A records...')
    await prefetchVitamina()

    // 14. Fetch and cache birth history
    console.log('📥 Fetching birth history...')
    await prefetchBirthHistory()

    // 15. Fetch and cache receiving reports
    console.log('📥 Fetching receiving reports...')
    await prefetchReceivingReports()

    console.log('✅ [Admin] All admin data cached successfully for offline access')

    // Update cache metadata
    await adminDB.metadata.put({
      key: 'cacheStatus',
      value: 'complete',
      timestamp: Date.now()
    })

    return true
  } catch (error) {
    console.error('❌ [Admin] Failed to prefetch admin data:', error)
    await adminDB.metadata.put({
      key: 'cacheStatus',
      value: 'error',
      error: error.message,
      timestamp: Date.now()
    })
    throw error
  }
}

/**
 * Prefetch all patients
 */
async function prefetchPatients() {
  try {
    // Get all patients without pagination (admin can see all)
    const response = await api.get('/patients', {
      params: { page: 1, limit: 10000 } // Large limit to get all
    })

    const patients = response.data?.data?.patients || []
    console.log(`📥 Caching ${patients.length} patients...`)

    // Transform and cache
    const transformedPatients = patients.map(patient => ({
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
      is_deleted: Boolean(patient.is_deleted), // Ensure boolean value
      created_at: patient.created_at,
      updated_at: patient.updated_at
    }))

    await adminDB.patients.bulkPut(transformedPatients)
    console.log(`✅ Cached ${transformedPatients.length} patients`)
  } catch (error) {
    console.warn('⚠️ Failed to prefetch patients:', error.message)
  }
}

/**
 * Prefetch all guardians
 */
async function prefetchGuardians() {
  try {
    // Get all guardians (admin can see all)
    const response = await api.get('/guardians', {
      params: { page: 1, limit: 10000 }
    })

    const guardians = response.data?.data || []
    console.log(`📥 Caching ${guardians.length} guardians...`)

    const transformedGuardians = guardians.map(guardian => ({
      guardian_id: guardian.guardian_id,
      full_name: [guardian.surname, guardian.firstname, guardian.middlename].filter(Boolean).join(' ').trim(),
      surname: guardian.surname || '',
      firstname: guardian.firstname || '',
      middlename: guardian.middlename || '',
      contact_number: guardian.contact_number || '',
      address: guardian.address || '',
      occupation: guardian.occupation || '',
      is_deleted: Boolean(guardian.is_deleted), // Ensure boolean value
      created_at: guardian.created_at,
      updated_at: guardian.updated_at
    })).filter(guardian => guardian.guardian_id) // Only cache guardians with valid guardian_id

    if (transformedGuardians.length > 0) {
      await adminDB.guardians.bulkPut(transformedGuardians)
      console.log(`✅ Cached ${transformedGuardians.length} guardians`)
    } else {
      console.log('⚠️ No valid guardians to cache')
    }
  } catch (error) {
    console.warn('⚠️ Failed to prefetch guardians:', error.message)
  }
}

async function prefetchUsers() {
  try {
    // Get all users (admin can see all active users)
    const response = await api.get('/users', {
      params: { page: 1, limit: 10000, status: 'not_archived' }
    })

    const users = response.data?.users || []
    console.log(`📥 Caching ${users.length} active users...`)

    // Transform and cache (API already filters out deleted/archived users)
    const transformedUsers = users.map(user => ({
      user_id: user.id, // API returns 'id', but we store as 'user_id'
      role: user.role,
      username: user.username || user.email,
      surname: user.surname || '',
      firstname: user.firstname || '',
      middlename: user.middlename || '',
      contact_number: user.contact_number || '',
      email: user.email,
      address: user.address,
      is_active: user.status === 'active',
      is_deleted: false, // API already filtered out deleted users, so mark as false
      created_at: user.created_at,
      updated_at: user.updated_at
    })).filter(user => user.user_id) // Only cache users with valid user_id

    if (transformedUsers.length > 0) {
      await adminDB.users.bulkPut(transformedUsers)
      console.log(`✅ Cached ${transformedUsers.length} active users`)
    } else {
      console.log('⚠️ No valid active users to cache')
    }
  } catch (error) {
    console.warn('⚠️ Failed to prefetch users:', error.message)
  }
}

/**
 * Prefetch health workers
 */
async function prefetchHealthWorkers() {
  try {
    // Get health workers (using correct endpoint)
    const response = await api.get('/health-staff', {
      params: { page: 1, limit: 10000 }
    })

    const healthworkers = response.data?.data?.healthStaff || []
    console.log(`📥 Caching ${healthworkers.length} health workers...`)
    console.log('Sample health worker data:', healthworkers[0]) // Debug log

    const transformedHealthworkers = healthworkers.map(hw => ({
      health_worker_id: hw.health_worker_id || hw.user_id || hw.id,
      full_name: [hw.surname, hw.firstname, hw.middlename].filter(Boolean).join(' ').trim(),
      surname: hw.surname || '',
      firstname: hw.firstname || '',
      middlename: hw.middlename || '',
      contact_number: hw.contact_number || '',
      address: hw.address || '',
      is_deleted: Boolean(hw.is_deleted), // Ensure boolean value
      created_at: hw.created_at,
      updated_at: hw.updated_at
    })).filter(hw => {
      // Validate that health_worker_id is a valid IndexedDB key
      const key = hw.health_worker_id
      const isValid = key !== null && key !== undefined && key !== '' &&
                     (typeof key === 'string' || typeof key === 'number' || key instanceof Date)
      if (!isValid) {
        console.warn('⚠️ Skipping health worker with invalid key:', key, hw)
      }
      return isValid
    })

    console.log(`📥 Filtered to ${transformedHealthworkers.length} valid health workers`)

    if (transformedHealthworkers.length > 0) {
      await adminDB.healthworkers.bulkPut(transformedHealthworkers)
      console.log(`✅ Cached ${transformedHealthworkers.length} health workers`)
    } else {
      console.log('⚠️ No valid health workers to cache')
    }
  } catch (error) {
    console.warn('⚠️ Failed to prefetch health workers:', error.message)
  }
}

/**
 * Prefetch vaccine inventory
 */
async function prefetchInventory() {
  try {
    const response = await api.get('/vaccines/inventory')
    const inventory = response.data?.data || []
    console.log(`📥 Caching ${inventory.length} inventory items...`)

    const transformedInventory = inventory.map((item, index) => ({
      id: item.inventory_id || index + 1,
      inventory_id: item.inventory_id,
      vaccine_id: item.vaccine_id,
      lot_number: item.lot_number,
      expiration_date: item.expiration_date,
      current_stock_level: item.current_stock_level,
      storage_location: item.storage_location,
      vaccine_name: item.vaccine?.antigen_name || item.antigen_name,
      manufacturer: item.vaccine?.manufacturer || item.manufacturer,
      is_deleted: Boolean(item.is_deleted), // Ensure boolean value
      created_at: item.created_at,
      updated_at: item.updated_at
    })).filter(item => item.inventory_id) // Only cache inventory with valid inventory_id

    if (transformedInventory.length > 0) {
      await adminDB.inventory.bulkPut(transformedInventory)
      console.log(`✅ Cached ${transformedInventory.length} inventory items`)
    } else {
      console.log('⚠️ No valid inventory items to cache')
    }
  } catch (error) {
    console.warn('⚠️ Failed to prefetch inventory:', error.message)
  }
}

/**
 * Prefetch vaccine types
 */
async function prefetchVaccines() {
  try {
    const response = await api.get('/vaccines', {
      params: { page: 1, limit: 1000 }
    })
    let vaccines = response.data

    // Handle different response structures
    if (vaccines?.data?.vaccines && Array.isArray(vaccines.data.vaccines)) {
      vaccines = vaccines.data.vaccines
    } else if (vaccines?.data && Array.isArray(vaccines.data)) {
      vaccines = vaccines.data
    } else if (Array.isArray(vaccines)) {
      // Already an array
    } else {
      console.warn('⚠️ Unexpected vaccines response structure:', vaccines)
      vaccines = []
    }

    console.log(`📥 Caching ${vaccines.length} vaccine types...`)

    const transformedVaccines = vaccines.map(vaccine => ({
      vaccine_id: vaccine.vaccine_id,
      antigen_name: vaccine.antigen_name,
      brand_name: vaccine.brand_name,
      disease_prevented: vaccine.disease_prevented,
      manufacturer: vaccine.manufacturer,
      vaccine_type: vaccine.vaccine_type,
      category: vaccine.category,
      is_nip: vaccine.is_nip,
      description: vaccine.description,
      is_deleted: Boolean(vaccine.is_deleted), // Ensure boolean value
      created_at: vaccine.created_at,
      updated_at: vaccine.updated_at
    })).filter(vaccine => vaccine.vaccine_id) // Only cache vaccines with valid vaccine_id

    if (transformedVaccines.length > 0) {
      await adminDB.vaccines.bulkPut(transformedVaccines)
      console.log(`✅ Cached ${transformedVaccines.length} vaccine types`)
    } else {
      console.log('⚠️ No valid vaccine types to cache')
    }
  } catch (error) {
    console.warn('⚠️ Failed to prefetch vaccines:', error.message)
  }
}

/**
 * Prefetch vaccine schedules
 */
async function prefetchSchedules() {
  try {
    const response = await api.get('/vaccines/schedules')
    const schedules = response.data?.data || response.data || []
    console.log(`📥 Caching ${schedules.length} vaccine schedules...`)

    const transformedSchedules = schedules.map(schedule => ({
      schedule_id: schedule.schedule_id || schedule.id,
      schedule_master_id: schedule.schedule_master_id || schedule.id,
      name: schedule.name,
      vaccine_id: schedule.vaccine_id,
      total_doses: schedule.total_doses,
      schedule_doses: schedule.schedule_doses,
      dose_number: schedule.dose_number,
      recommended_age_months: schedule.recommended_age_months,
      recommended_age_weeks: schedule.recommended_age_weeks,
      minimum_age_months: schedule.minimum_age_months,
      minimum_age_weeks: schedule.minimum_age_weeks,
      maximum_age_months: schedule.maximum_age_months,
      maximum_age_weeks: schedule.maximum_age_weeks,
      is_deleted: Boolean(schedule.is_deleted), // Ensure boolean value
      created_at: schedule.created_at,
      updated_at: schedule.updated_at
    })).filter(schedule => schedule.schedule_id) // Only cache schedules with valid schedule_id

    if (transformedSchedules.length > 0) {
      await adminDB.schedules.bulkPut(transformedSchedules)
      console.log(`✅ Cached ${transformedSchedules.length} vaccine schedules`)
    } else {
      console.log('⚠️ No valid vaccine schedules to cache')
    }
  } catch (error) {
    console.warn('⚠️ Failed to prefetch vaccine schedules:', error.message)
  }
}

/**
 * Prefetch inventory transactions
 */
async function prefetchTransactions() {
  try {
    const response = await api.get('/vaccines/transactions', {
      params: { page: 1, limit: 5000 }
    })
    const transactions = response.data?.transactions || []
    console.log(`📥 Caching ${transactions.length} transactions...`)

    const transformedTransactions = transactions.map(transaction => ({
      transaction_id: transaction.transaction_id,
      inventory_id: transaction.inventory_id,
      transaction_type: transaction.transaction_type,
      quantity: transaction.quantity_delta || transaction.quantity,
      note: transaction.remarks || transaction.note,
      created_by: transaction.created_by,
      created_at: transaction.created_at || transaction.date
    })).filter(transaction => transaction.transaction_id) // Only cache transactions with valid transaction_id

    if (transformedTransactions.length > 0) {
      await adminDB.transactions.bulkPut(transformedTransactions)
      console.log(`✅ Cached ${transformedTransactions.length} transactions`)
    } else {
      console.log('⚠️ No valid transactions to cache')
    }
  } catch (error) {
    console.warn('⚠️ Failed to prefetch transactions:', error.message)
  }
}

/**
 * Prefetch immunizations
 */
async function prefetchImmunizations() {
  try {
    // Get all immunizations (may need pagination for large datasets)
    const response = await api.get('/immunizations', {
      params: { page: 1, limit: 10000 }
    })
    const immunizations = response.data?.data || []
    console.log(`📥 Caching ${immunizations.length} immunizations...`)

    const transformedImmunizations = immunizations.map(immunization => ({
      immunization_id: immunization.immunization_id,
      patient_id: immunization.patient_id,
      visit_id: immunization.visit_id,
      vaccine_id: immunization.vaccine_id,
      dose_number: immunization.dose_number,
      administered_date: immunization.administered_date,
      administered_by: immunization.administered_by,
      remarks: immunization.remarks,
      is_deleted: Boolean(immunization.is_deleted), // Ensure boolean value
      created_at: immunization.created_at,
      updated_at: immunization.updated_at
    }))

    await adminDB.immunizations.bulkPut(transformedImmunizations)
    console.log(`✅ Cached ${transformedImmunizations.length} immunizations`)
  } catch (error) {
    console.warn('⚠️ Failed to prefetch immunizations:', error.message)
  }
}

/**
 * Prefetch visits
 */
async function prefetchVisits() {
  try {
    const response = await api.get('/visits', {
      params: { page: 1, limit: 10000 }
    })
    const visits = response.data?.data || []
    console.log(`📥 Caching ${visits.length} visits...`)

    const transformedVisits = visits.map(visit => ({
      visit_id: visit.visit_id,
      patient_id: visit.patient_id,
      visit_date: visit.visit_date,
      visit_type: visit.visit_type,
      notes: visit.notes,
      conducted_by: visit.conducted_by,
      is_deleted: visit.is_deleted,
      created_at: visit.created_at,
      updated_at: visit.updated_at
    }))

    await adminDB.visits.bulkPut(transformedVisits)
    console.log(`✅ Cached ${transformedVisits.length} visits`)
  } catch (error) {
    console.warn('⚠️ Failed to prefetch visits:', error.message)
  }
}

/**
 * Prefetch deworming records
 */
async function prefetchDeworming() {
  try {
    const response = await api.get('/deworming', {
      params: { page: 1, limit: 10000 }
    })
    const deworming = response.data?.data || []
    console.log(`📥 Caching ${deworming.length} deworming records...`)

    const transformedDeworming = deworming.map(record => ({
      deworming_id: record.deworming_id,
      patient_id: record.patient_id,
      visit_id: record.visit_id,
      administered_date: record.administered_date,
      drug_given: record.drug_given,
      administered_by: record.administered_by,
      remarks: record.remarks,
      is_deleted: record.is_deleted,
      created_at: record.created_at,
      updated_at: record.updated_at
    }))

    await adminDB.deworming.bulkPut(transformedDeworming)
    console.log(`✅ Cached ${transformedDeworming.length} deworming records`)
  } catch (error) {
    console.warn('⚠️ Failed to prefetch deworming:', error.message)
  }
}

/**
 * Prefetch vitamin A records
 */
async function prefetchVitamina() {
  try {
    const response = await api.get('/vitamina', {
      params: { page: 1, limit: 10000 }
    })
    const vitamina = response.data?.data || []
    console.log(`📥 Caching ${vitamina.length} vitamin A records...`)

    const transformedVitamina = vitamina.map(record => ({
      vitamina_id: record.vitamina_id,
      patient_id: record.patient_id,
      visit_id: record.visit_id,
      administered_date: record.administered_date,
      dose_given: record.dose_given,
      administered_by: record.administered_by,
      remarks: record.remarks,
      is_deleted: record.is_deleted,
      created_at: record.created_at,
      updated_at: record.updated_at
    }))

    await adminDB.vitamina.bulkPut(transformedVitamina)
    console.log(`✅ Cached ${transformedVitamina.length} vitamin A records`)
  } catch (error) {
    console.warn('⚠️ Failed to prefetch vitamin A:', error.message)
  }
}

/**
 * Prefetch birth history
 */
async function prefetchBirthHistory() {
  try {
    // Get all patients first to fetch birth history for each
    const patients = await adminDB.patients.toArray()
    console.log(`📥 Fetching birth history for ${patients.length} patients...`)

    let successCount = 0
    for (const patient of patients) {
      try {
        const response = await api.get(`/patients/${patient.patient_id}/birth-history`)
        const birthHistory = response.data?.data || response.data

        if (birthHistory && birthHistory.birthhistory_id) {
          await adminDB.birthhistory.put({
            birthhistory_id: birthHistory.birthhistory_id,
            patient_id: patient.patient_id,
            birth_weight: birthHistory.birth_weight,
            birth_length: birthHistory.birth_length,
            place_of_birth: birthHistory.place_of_birth,
            address_at_birth: birthHistory.address_at_birth,
            time_of_birth: birthHistory.time_of_birth,
            attendant_at_birth: birthHistory.attendant_at_birth,
            type_of_delivery: birthHistory.type_of_delivery,
            ballards_score: birthHistory.ballards_score,
            hearing_test_date: birthHistory.hearing_test_date,
            newborn_screening_date: birthHistory.newborn_screening_date,
            newborn_screening_result: birthHistory.newborn_screening_result,
            created_at: birthHistory.created_at,
            updated_at: birthHistory.updated_at
          })
          successCount++
        }
      } catch (error) {
        // Birth history might not exist for all patients, continue
      }
    }

    console.log(`✅ Cached birth history for ${successCount} patients`)
  } catch (error) {
    console.warn('⚠️ Failed to prefetch birth history:', error.message)
  }
}

/**
 * Prefetch receiving reports
 */
async function prefetchReceivingReports() {
  try {
    const response = await api.get('/receiving-reports', {
      params: { page: 1, limit: 1000 }
    })
    const reports = response.data?.data?.items || response.data?.data || response.data || []
    console.log(`📥 Caching ${reports.length} receiving reports...`)

    const transformedReports = reports.map(report => ({
      report_id: report.report_id || report.id,
      report_number: report.report_number,
      delivery_date: report.delivery_date,
      delivered_by: report.delivered_by,
      received_by: report.received_by_name || report.received_by,
      total_items: report.total_items,
      total_quantity: report.total_quantity || report.quantity,
      status: report.status,
      created_at: report.created_at,
      updated_at: report.updated_at
    })).filter(report => report.report_id) // Only cache reports with valid report_id

    if (transformedReports.length > 0) {
      await adminDB.receiving_reports.bulkPut(transformedReports)
      console.log(`✅ Cached ${transformedReports.length} receiving reports`)
    } else {
      console.log('⚠️ No valid receiving reports to cache')
    }

    // Also prefetch report items for each report
    const allItems = []
    for (const report of reports) {
      try {
        const reportResponse = await api.get(`/receiving-reports/${report.report_id || report.id}`)
        const items = reportResponse.data?.data?.items || []
        const transformedItems = items.map(item => ({
          item_id: item.item_id,
          report_id: report.report_id || report.id,
          vaccine_id: item.vaccine_id,
          antigen_name: item.antigen_name,
          brand_name: item.brand_name,
          manufacturer: item.manufacturer,
          lot_number: item.lot_number,
          expiration_date: item.expiration_date,
          quantity_received: item.quantity_received,
          storage_location: item.storage_location,
          vaccine_type: item.vaccine_type,
          category: item.category,
          is_nip: item.is_nip
        })).filter(item => item.item_id) // Only cache items with valid item_id

        allItems.push(...transformedItems)
      } catch (itemError) {
        console.warn(`⚠️ Failed to prefetch items for report ${report.report_id || report.id}:`, itemError.message)
      }
    }

    if (allItems.length > 0) {
      await adminDB.receiving_report_items.bulkPut(allItems)
      console.log(`✅ Cached ${allItems.length} receiving report items`)
    }
  } catch (error) {
    console.warn('⚠️ Failed to prefetch receiving reports:', error.message)
  }
}

/**
 * Check if admin data is cached and ready for offline use
 */
export async function isAdminDataCached() {
  try {
    const metadata = await adminDB.metadata.get('cacheStatus')
    return metadata?.value === 'complete'
  } catch (error) {
    return false
  }
}

/**
 * Get cache timestamp
 */
export async function getAdminCacheTimestamp() {
  try {
    const metadata = await adminDB.metadata.get('lastPrefetch')
    return metadata?.value
  } catch (error) {
    return null
  }
}