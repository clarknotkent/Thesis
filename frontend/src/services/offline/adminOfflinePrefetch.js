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

    // 15. Fetch and cache patient schedules (per-patient, no bulk endpoint)
    console.log('📥 Fetching patient schedules (per patient)...')
    await prefetchPatientSchedules()

    // 16. Fetch and cache immunizations (per patient) for vaccination history offline
    console.log('📥 Fetching immunizations (per patient)...')
    await prefetchPatientImmunizations()

    // 17. Enrich immunizations with batch numbers from inventory
    console.log('🔗 Enriching immunizations with batch numbers from inventory...')
    await enrichImmunizationsWithInventory()

    // 18. Fetch and cache visits (per patient) for medical history offline
    console.log('📥 Fetching visits (per patient)...')
    await prefetchPatientVisits()

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
      family_number: guardian.family_number || guardian.familyNumber || '',
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
    const scheduleRows = []
    const doseRows = []

    for (const schedule of schedules) {
      const masterId = schedule.schedule_master_id || schedule.schedule_id || schedule.id
      const scheduleId = schedule.schedule_id || schedule.id || masterId
      if (!masterId) continue

      // Store master schedule row (without embedded doses)
      scheduleRows.push({
        schedule_id: scheduleId,
        schedule_master_id: masterId,
        name: schedule.name,
        vaccine_id: schedule.vaccine_id,
        total_doses: schedule.total_doses,
        code: schedule.code || schedule.schedule_code,
        concurrent_allowed: schedule.concurrent_allowed ?? false,
        min_age_days: schedule.min_age_days || schedule.minimum_age_days,
        max_age_days: schedule.max_age_days || schedule.maximum_age_days,
        catchup_strategy: schedule.catchup_strategy,
        notes: schedule.notes,
        is_deleted: Boolean(schedule.is_deleted),
        created_at: schedule.created_at,
        updated_at: schedule.updated_at
      })

      // Store dose rows if present
      const doses = schedule.schedule_doses || schedule.doses || []
      for (const dose of doses) {
        doseRows.push({
          id: `${masterId}-${dose.dose_number}`,
          schedule_master_id: masterId,
            dose_number: dose.dose_number,
            due_after_days: dose.due_after_days,
            min_interval_days: dose.min_interval_days,
            max_interval_days: dose.max_interval_days,
            min_interval_other_vax: dose.min_interval_other_vax,
            requires_previous: dose.requires_previous ?? false,
            skippable: dose.skippable ?? false,
            grace_period_days: dose.grace_period_days,
            absolute_latest_days: dose.absolute_latest_days,
            notes: dose.notes
        })
      }
    }

    if (scheduleRows.length > 0) {
      await adminDB.schedules.bulkPut(scheduleRows)
      console.log(`✅ Cached ${scheduleRows.length} master schedules`)
    } else {
      console.log('⚠️ No master schedules to cache')
    }

    if (doseRows.length > 0) {
      await adminDB.schedule_doses.bulkPut(doseRows)
      console.log(`✅ Cached ${doseRows.length} schedule dose entries`)
    } else {
      console.log('⚠️ No schedule dose entries to cache')
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

    // Group transactions by inventory to compute before/after balances when API omits them
    const inventoryMap = new Map()
    for (const tx of transactions) {
      const invId = tx.inventory_id
      if (!inventoryMap.has(invId)) inventoryMap.set(invId, [])
      inventoryMap.get(invId).push(tx)
    }

    // Load current stock levels for inventories (final state)
    const cachedInventory = await adminDB.inventory.toArray()
    const finalStockMap = new Map(cachedInventory.map(i => [i.inventory_id, i.current_stock_level || i.quantity || i.stock_level || 0]))

    const negativeTypes = ['RETURN', 'EXPIRED', 'ISSUE', 'OUTBOUND', 'USE', 'DISPENSE', 'STOCK_OUT']
    const enriched = []

    for (const [invId, list] of inventoryMap.entries()) {
      // Sort oldest -> newest
      list.sort((a, b) => new Date(a.created_at || a.date || 0) - new Date(b.created_at || b.date || 0))
      // Compute signed changes & total
      const signedChanges = list.map(tx => {
        const raw = Number(tx.quantity_delta ?? tx.quantity ?? 0)
        const type = (tx.transaction_type || '').toUpperCase()
        return negativeTypes.includes(type) ? -Math.abs(raw) : Math.abs(raw)
      })
      const sumChanges = signedChanges.reduce((acc, v) => acc + v, 0)
      const finalStock = finalStockMap.get(invId)
      // Derive starting stock: final = start + sumChanges => start = final - sumChanges
      let runningStock = (typeof finalStock === 'number' ? finalStock : 0) - sumChanges
      list.forEach((tx, idx) => {
        const signedQty = signedChanges[idx]
        const before = runningStock
        const after = before + signedQty
        runningStock = after
        enriched.push({
          transaction_id: tx.transaction_id,
          inventory_id: invId,
            transaction_type: tx.transaction_type,
          quantity: tx.quantity_delta ?? tx.quantity ?? Math.abs(signedQty),
          quantity_delta: signedQty, // signed change
          quantity_before: before,
          quantity_after: after,
          balance_after: after,
          note: tx.remarks || tx.note,
          created_by: tx.created_by,
          created_at: tx.created_at || tx.date
        })
      })
    }

    const transformedTransactions = enriched.filter(t => t.transaction_id)

    if (transformedTransactions.length > 0) {
      await adminDB.transactions.bulkPut(transformedTransactions)
      console.log(`✅ Cached ${transformedTransactions.length} transactions (with before/after balances)`) 
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
    const immunizations = response.data?.data || response.data || []
    console.log(`📥 Caching ${immunizations.length} immunizations...`)
    
    // Debug: Log first immunization to see what fields API returns
    if (immunizations.length > 0) {
      console.log('🔍 Sample immunization from API:', immunizations[0])
    }

    const transformedImmunizations = immunizations.map(immunization => ({
      immunization_id: immunization.immunization_id || immunization.id,
      patient_id: String(immunization.patient_id), // Ensure string for consistency
      visit_id: immunization.visit_id,
      vaccine_id: immunization.vaccine_id,
      inventory_id: immunization.inventory_id, // IMPORTANT: Store this for batch number lookup
      // Vaccine/antigen names
      antigen_name: immunization.antigen_name || immunization.vaccine_antigen_name || immunization.disease_prevented,
      vaccine_antigen_name: immunization.vaccine_antigen_name || immunization.antigen_name,
      disease_prevented: immunization.disease_prevented || immunization.diseasePrevented,
      // Dose and date info
      dose_number: immunization.dose_number || immunization.doseNumber,
      administered_date: immunization.administered_date || immunization.administeredDate,
      age_at_administration: immunization.age_at_administration || immunization.ageAtAdministration,
      // Worker info - immunizationhistory_view has administered_by_name from users join
      administered_by: immunization.administered_by,
      administered_by_name: immunization.administered_by_name || immunization.administeredByName,
      // Vaccine details
      lot_number: immunization.lot_number || immunization.lotNumber,
      batch_number: immunization.batch_number || immunization.batchNumber || immunization.lot_number,
      site: immunization.site,
      route: immunization.route,
      // Facility info
      facility_name: immunization.facility_name || immunization.facilityName || immunization.immunization_facility_name,
      outside: immunization.outside || immunization.immunization_outside,
      // Other
      remarks: immunization.remarks,
      is_deleted: Boolean(immunization.is_deleted),
      created_at: immunization.created_at,
      updated_at: immunization.updated_at
    })).filter(i => i.immunization_id) // Only cache valid records
    
    // Debug: Log first transformed to see what we're caching
    if (transformedImmunizations.length > 0) {
      console.log('🔍 Sample cached immunization:', transformedImmunizations[0])
    }

    if (transformedImmunizations.length > 0) {
      await adminDB.immunizations.bulkPut(transformedImmunizations)
      console.log(`✅ Cached ${transformedImmunizations.length} immunizations`)
    } else {
      console.log('⚠️ No immunizations to cache')
    }
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
    const visits = response.data?.items || response.data?.data || response.data || []
    console.log(`📥 Caching ${visits.length} visits...`)
    
    // Debug: Log first visit to see what fields API returns
    if (visits.length > 0) {
      console.log('🔍 Sample visit from API:', visits[0])
    }

    const transformedVisits = visits.map(visit => ({
      visit_id: visit.visit_id || visit.id,
      patient_id: String(visit.patient_id), // Ensure string for consistency
      visit_date: visit.visit_date || visit.visitDate,
      visit_type: visit.visit_type || visit.visitType,
      service_rendered: visit.service_rendered || visit.visit_type, // IMPORTANT: Cache service_rendered
      notes: visit.notes,
      findings: visit.findings,
      recorded_by: visit.recorded_by || visit.recordedBy,
      health_worker_name: visit.health_worker_name || visit.healthWorkerName || visit.recorded_by,
      // Vitals from visits_view (top-level columns)
      weight: visit.weight,
      height: visit.height,
      height_length: visit.height_length || visit.height,
      temperature: visit.temperature,
      muac: visit.muac,
      respiration_rate: visit.respiration_rate || visit.respiratoryRate,
      respiratory_rate: visit.respiration_rate || visit.respiratoryRate,
      pulse: visit.pulse,
      is_deleted: Boolean(visit.is_deleted),
      created_at: visit.created_at,
      updated_at: visit.updated_at
    })).filter(v => v.visit_id) // Only cache valid records
    
    // Debug: Log first transformed to see what we're caching
    if (transformedVisits.length > 0) {
      console.log('🔍 Sample cached visit:', transformedVisits[0])
    }

    if (transformedVisits.length > 0) {
      await adminDB.visits.bulkPut(transformedVisits)
      console.log(`✅ Cached ${transformedVisits.length} visits`)
    } else {
      console.log('⚠️ No visits to cache')
    }
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
 * DISABLED: Receiving reports are no longer needed for offline access
 */
/*
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
*/

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

/**
 * Prefetch patient schedules for each patient (patientschedule table)
 * This makes Scheduled Vaccinations available offline without opening each patient online.
 */
async function prefetchPatientSchedules() {
  try {
    const patients = await adminDB.patients.toArray()
    console.log(`📥 Prefetching schedules for ${patients.length} patients...`)
    let totalSchedules = 0

    // Limit concurrent requests to avoid flooding backend
    const concurrency = 5
    const queue = [...patients]
    const workers = Array.from({ length: concurrency }).map(async () => {
      while (queue.length) {
        const p = queue.shift()
        if (!p || !p.patient_id) continue
        try {
          const resp = await api.get(`/patients/${p.patient_id}/schedule`)
          const rows = resp.data?.data || resp.data || []
          if (Array.isArray(rows) && rows.length) {
            const transformed = rows.map(s => ({
              patient_schedule_id: s.patient_schedule_id || s.id,
              patient_id: String(p.patient_id), // Ensure string for consistency
              vaccine_id: s.vaccine_id,
              antigen_name: s.antigen_name || s.vaccine?.antigen_name || s.vaccine_name,
              dose_number: s.dose_number || s.doseNumber,
              scheduled_date: s.scheduled_date || s.scheduledDate,
              time_slot: s.time_slot || s.timeSlot || null, // IMPORTANT: Cache time_slot for calendar
              status: s.status,
              days_overdue: s.days_overdue || s.daysOverdue || 0,
              notes: s.notes,
              is_deleted: Boolean(s.is_deleted),
              created_at: s.created_at,
              updated_at: s.updated_at
            })).filter(r => r.patient_schedule_id)
            if (transformed.length) {
              await adminDB.patientschedule.bulkPut(transformed)
              totalSchedules += transformed.length
            }
          }
        } catch (err) {
          // Non-fatal; some patients may have no schedule
        }
      }
    })
    await Promise.all(workers)
    console.log(`✅ Cached ${totalSchedules} patient schedule rows`)
  } catch (error) {
    console.warn('⚠️ Failed to prefetch patient schedules:', error.message)
  }
}

/**
 * Prefetch immunizations for each patient (immunizations table)
 * Enables Vaccination History offline access.
 */
async function prefetchPatientImmunizations() {
  try {
    const patients = await adminDB.patients.toArray()
    console.log(`📥 Prefetching immunizations for ${patients.length} patients...`)
    let totalImmunizations = 0
    let sampleLogged = false
    const concurrency = 5
    const queue = [...patients]
    const workers = Array.from({ length: concurrency }).map(async () => {
      while (queue.length) {
        const p = queue.shift()
        if (!p || !p.patient_id) continue
        try {
          const resp = await api.get(`/patients/${p.patient_id}/immunizations`)
          const rows = resp.data?.data || resp.data || []
          
          // Debug: Log first immunization from API to see structure
          if (!sampleLogged && Array.isArray(rows) && rows.length > 0) {
            console.log('🔍 Sample immunization from /patients/:id/immunizations API:', rows[0])
            sampleLogged = true
          }
          
          if (Array.isArray(rows) && rows.length) {
            const transformed = rows.map(i => ({
              immunization_id: i.immunization_id || i.id,
              patient_id: String(p.patient_id), // Ensure string for consistency
              visit_id: i.visit_id,
              vaccine_id: i.vaccine_id,
              inventory_id: i.inventory_id, // For batch lookup
              // Vaccine/antigen names
              antigen_name: i.antigen_name || i.vaccine_antigen_name || i.vaccine?.antigen_name || i.disease_prevented,
              vaccine_antigen_name: i.vaccine_antigen_name || i.antigen_name,
              disease_prevented: i.disease_prevented || i.diseasePrevented,
              // Dose and date info
              dose_number: i.dose_number || i.doseNumber,
              administered_date: i.administered_date || i.administeredDate,
              age_at_administration: i.age_at_administration || i.ageAtAdministration,
              // Worker info
              administered_by: i.administered_by || i.administeredBy,
              administered_by_name: i.administered_by_name || i.administeredByName,
              healthworker_id: i.healthworker_id || i.healthWorkerId,
              // Vaccine details
              lot_number: i.lot_number || i.lotNumber,
              batch_number: i.batch_number || i.batchNumber || i.lot_number,
              site: i.site,
              route: i.route,
              // Facility info - check multiple possible field names
              facility_name: i.facility_name || i.facilityName || i.immunization_facility_name || i.health_center,
              outside: i.outside || i.immunization_outside,
              // Other
              remarks: i.remarks,
              is_deleted: Boolean(i.is_deleted),
              created_at: i.created_at,
              updated_at: i.updated_at
            })).filter(r => r.immunization_id)
            if (transformed.length) {
              await adminDB.immunizations.bulkPut(transformed)
              totalImmunizations += transformed.length
            }
          }
        } catch (err) {
          // Non-fatal
        }
      }
    })
    await Promise.all(workers)
    console.log(`✅ Cached ${totalImmunizations} immunization rows`)
  } catch (error) {
    console.warn('⚠️ Failed to prefetch immunizations:', error.message)
  }
}

/**
 * Prefetch visits for each patient (visits table)
 * Enables Medical History offline access.
 */
async function prefetchPatientVisits() {
  try {
    const patients = await adminDB.patients.toArray()
    console.log(`📥 Prefetching visits for ${patients.length} patients...`)
    let totalVisits = 0
    let sampleLogged = false
    const concurrency = 5
    const queue = [...patients]
    const workers = Array.from({ length: concurrency }).map(async () => {
      while (queue.length) {
        const p = queue.shift()
        if (!p || !p.patient_id) continue
        try {
          const resp = await api.get(`/patients/${p.patient_id}/visits`)
          const rows = resp.data?.data || resp.data || []
          
          // Debug: Log first visit from API to see structure
          if (!sampleLogged && Array.isArray(rows) && rows.length > 0) {
            console.log('🔍 Sample visit from /patients/:id/visits API:', rows[0])
            sampleLogged = true
          }
          
          if (Array.isArray(rows) && rows.length) {
            const transformed = rows.map(v => ({
              visit_id: v.visit_id || v.id,
              patient_id: String(p.patient_id), // Ensure string for consistency
              visit_date: v.visit_date || v.visitDate,
              visit_type: v.visit_type || v.visitType,
              service_rendered: v.service_rendered || v.serviceRendered || v.visit_type, // IMPORTANT: service rendered
              reason: v.reason,
              notes: v.notes,
              findings: v.findings,
              recorded_by: v.recorded_by || v.recordedBy,
              health_worker_name: v.health_worker_name || v.healthWorkerName || v.recorded_by,
              // Vitals - check both nested and top-level
              height: v.height || v.vitals?.height || v.vital_signs?.height_length,
              height_length: v.height_length || v.height || v.vitals?.height_length || v.vital_signs?.height_length,
              weight: v.weight || v.vitals?.weight || v.vital_signs?.weight,
              muac: v.muac || v.vitals?.muac || v.vital_signs?.muac,
              temperature: v.temperature || v.vitals?.temperature || v.vital_signs?.temperature,
              pulse: v.pulse || v.vitals?.pulse || v.vital_signs?.pulse,
              respiratory_rate: v.respiratory_rate || v.respiration_rate || v.respiratoryRate || v.vitals?.respiration_rate || v.vital_signs?.respiration_rate,
              respiration_rate: v.respiration_rate || v.respiratory_rate || v.respiratoryRate || v.vitals?.respiration_rate || v.vital_signs?.respiration_rate,
              // Immunizations given (array) - important for visit summary
              immunizations_given: v.immunizations_given || v.immunizationsGiven || v.immunizations || [],
              healthworker_id: v.healthworker_id || v.healthWorkerId,
              is_deleted: Boolean(v.is_deleted),
              created_at: v.created_at,
              updated_at: v.updated_at
            })).filter(r => r.visit_id)
            if (transformed.length) {
              await adminDB.visits.bulkPut(transformed)
              totalVisits += transformed.length
            }
          }
        } catch (err) {
          // Non-fatal
        }
      }
    })
    await Promise.all(workers)
    console.log(`✅ Cached ${totalVisits} visit rows`)
  } catch (error) {
    console.warn('⚠️ Failed to prefetch visits:', error.message)
  }
}

/**
 * Enrich immunizations with batch/lot numbers from inventory
 * This adds facility_name, batch_number, and lot_number to cached immunizations
 */
async function enrichImmunizationsWithInventory() {
  try {
    // Get all cached immunizations and inventory
    const immunizations = await adminDB.immunizations.toArray()
    const inventory = await adminDB.inventory.toArray()
    
    if (!immunizations.length) {
      console.log('⚠️ No immunizations to enrich')
      return
    }
    
    if (!inventory.length) {
      console.log('⚠️ No inventory data for enrichment')
      return
    }
    
    // Build inventory map: inventory_id -> { batch_number, lot_number }
    const inventoryMap = {}
    inventory.forEach(item => {
      const id = item.inventory_id || item.id
      if (id) {
        inventoryMap[id] = {
          batch_number: item.batch_number || item.lot_number,
          lot_number: item.lot_number || item.batch_number
        }
      }
    })
    
    console.log(`🔗 Built inventory map with ${Object.keys(inventoryMap).length} entries`)
    
    // Enrich immunizations that have inventory_id but missing batch/lot info
    let enrichedCount = 0
    const enriched = immunizations.map(imm => {
      const inventoryId = imm.inventory_id
      
      // Skip if no inventory_id or already has batch/lot info
      if (!inventoryId || (imm.batch_number && imm.lot_number)) {
        return imm
      }
      
      // Look up in inventory map
      const invData = inventoryMap[inventoryId]
      if (invData) {
        enrichedCount++
        return {
          ...imm,
          batch_number: imm.batch_number || invData.batch_number,
          lot_number: imm.lot_number || invData.lot_number
        }
      }
      
      return imm
    })
    
    // Update cache with enriched data
    if (enrichedCount > 0) {
      await adminDB.immunizations.bulkPut(enriched)
      console.log(`✅ Enriched ${enrichedCount} immunizations with batch/lot numbers`)
    } else {
      console.log('ℹ️ No immunizations needed enrichment')
    }
  } catch (error) {
    console.warn('⚠️ Failed to enrich immunizations:', error.message)
  }
}