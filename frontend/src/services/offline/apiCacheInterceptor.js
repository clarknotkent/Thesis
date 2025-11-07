/**
 * API Cache Interceptor - Supports both Parent Portal and Admin/Staff offline access
 * 
 * Parent Portal: Full offline functionality with nested data
 * Admin/Staff: Read-only cache for patients and inventory
 * 
 * Security: Admin/Staff data is wiped on logout
 * 
 * IMPORTANT: Parent database is lazy-loaded to prevent ParentPortalOfflineDB 
 * from being created when Admin users log in
 */

import { db as staffDb } from './db' // StaffOfflineDB (Admin + HealthStaff)
import { getRole } from '../auth' // Import role checker

// Lazy-loaded parent modules (only when guardian/parent role accesses them)
let parentDb = null
let recacheAfterWrite = null

// Lazy loader for parent database
async function ensureParentDb() {
  if (!parentDb) {
    parentDb = (await import('./db-parent-portal')).default
  }
  return parentDb
}

// Lazy loader for parent recache function
async function ensureRecacheAfterWrite() {
  if (!recacheAfterWrite) {
    recacheAfterWrite = (await import('./parentLoginPrefetch')).recacheAfterWrite
  }
  return recacheAfterWrite
}

// Performance tuning
const CHUNK_SIZE = 500

/**
 * Write a collection into a single store using chunked bulkPut to avoid oversized transactions.
 * - If records <= CHUNK_SIZE: one transaction, one bulkPut
 * - If larger: split into batches, each in its own transaction
 * Returns { total, batches }
 */
async function bulkPutChunked(table, records, typeLabel) {
  const db = await ensureParentDb() // Lazy load parent DB
  const total = records.length
  if (total === 0) return { total: 0, batches: 0 }
  if (total <= CHUNK_SIZE) {
    await db.transaction('rw', table, async () => {
      await table.bulkPut(records)
    })
    console.log(`✅ Cached ${total} ${typeLabel}`)
    return { total, batches: 1 }
  }
  const batches = Math.ceil(total / CHUNK_SIZE)
  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE)
    await db.transaction('rw', table, async () => {
      await table.bulkPut(chunk)
    })
  }
  console.log(`✅ Cached ${total} ${typeLabel} in ${batches} batches`)
  return { total, batches }
}

/**
 * Install cache interceptor on axios instance
 * Call this once during app initialization
 */
export function installCacheInterceptor(apiInstance) {
  apiInstance.interceptors.response.use(
    async (response) => {
      const method = response.config.method?.toLowerCase()
      
      // Cache successful GET requests (reads)
      if (method === 'get') {
        try {
          await cacheResponse(response)
        } catch (cacheError) {
          // Don't fail the request if caching fails
          console.warn('Cache save failed (non-blocking):', cacheError.message)
        }
      }
      
      // Detect write operations and trigger smart recaching
      else if (['post', 'put', 'delete', 'patch'].includes(method)) {
        try {
          await handleWriteOperation(response)
        } catch (recacheError) {
          console.warn('Recache after write failed (non-blocking):', recacheError.message)
        }
      }
      
      return response
    },
    async (error) => {
      // Check if this is a network error and the request was a GET
      const isNetworkError = error.code === 'ERR_NETWORK' || !error.response
      const isGetRequest = error.config?.method?.toLowerCase() === 'get'
      
      if (isNetworkError && isGetRequest) {
        console.log(`🔌 Offline detected for ${error.config.url} - checking cache...`)
        
        try {
          const cachedData = await getCachedData(error.config.url)
          
          if (cachedData) {
            console.log(`✅ Serving from offline cache: ${error.config.url}`)
            
            // Return a mock response object that looks like an Axios response
            return {
              data: cachedData,
              status: 200,
              statusText: 'OK (from cache)',
              headers: {},
              config: error.config,
              fromCache: true
            }
          } else {
            console.warn(`❌ No cached data for ${error.config.url}`)
          }
        } catch (cacheError) {
          console.error('Cache retrieval failed:', cacheError)
        }
      }
      
      // If not a network error or no cache available, pass through error
      return Promise.reject(error)
    }
  )
  
  console.log('✅ API cache interceptor installed with write detection')
}

/**
 * Handle write operations - trigger smart recaching
 * Only runs for parent/guardian roles
 */
async function handleWriteOperation(response) {
  const userRole = getRole()
  
  // Only handle writes for parent/guardian roles (not admin/staff)
  if (userRole !== 'guardian' && userRole !== 'parent') {
    return
  }
  
  const url = response.config.url
  const method = response.config.method?.toLowerCase()
  
  console.log(`🔄 Write operation detected: ${method.toUpperCase()} ${url}`)
  
  // Lazy load recache function
  const recache = await ensureRecacheAfterWrite()
  
  // Get user info for recaching
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
  if (!userInfo) return
  
  const guardianId = userInfo.guardian_id || userInfo.id
  const userId = userInfo.user_id || userInfo.id
  
  // Extract patient_id from URL if present
  const patientIdMatch = url.match(/\/patients\/(\d+)/)
  const patientId = patientIdMatch ? patientIdMatch[1] : null
  
  // Determine resource type and trigger recaching
  if (/\/immunizations/.test(url) || /\/vaccinations/.test(url)) {
    if (patientId) {
      await recache('immunization', patientId, guardianId, userId)
    }
  }
  else if (/\/visits/.test(url)) {
    if (patientId) {
      await recache('visit', patientId, guardianId, userId)
    }
  }
  else if (/\/patients/.test(url)) {
    if (patientId) {
      await recache('patient', patientId, guardianId, userId)
    }
  }
  else if (/\/patientschedule/.test(url) || /\/schedule/.test(url)) {
    if (patientId) {
      await recache('schedule', patientId, guardianId, userId)
    }
  }
  else if (/\/notifications/.test(url)) {
    await recache('notification', null, guardianId, userId)
  }
    else if (/\/conversations(\?|$)/.test(url)) {
      await cacheConversations(response.data)
    }
    else if (/\/messages\//.test(url)) {
      await cacheMessages(response.data)
    }
}

/**
 * Main caching logic - routes responses to appropriate handlers
 * Now supports both Parent Portal and Admin/Staff caching
 */
async function cacheResponse(response) {
  const url = response.config.url
  const data = response.data
  
  // Skip empty responses
  if (!data) return
  
  // Get current user role
  const userRole = getRole()
  console.log(`[Cache Interceptor] URL: ${url}, Role: ${userRole}`)
  
  // --- ADMIN/STAFF "CACHE-ON-READ" LOGIC ---
  // Cache patients and inventory for admin/healthstaff roles
  if (userRole === 'admin' || userRole === 'healthstaff') {
    console.log(`[Admin/Staff] Checking URL for caching: ${url}`)
    
    // Match patient list endpoint: /patients or /patients?query (but not /patients/123 or /patients/stats)
    if (/^\/patients(\?|$)/.test(url)) {
      console.log(`[Admin/Staff] Caching patients list from ${url}`)
      try {
        await cacheStaffPatients(data)
      } catch (error) {
        console.error(`[Admin/Staff] Cache error for patients:`, error)
      }
      return
    }
    
    // Match single patient endpoint: /patients/123 (numeric ID only)
    if (/^\/patients\/\d+$/.test(url)) {
      console.log(`[Admin/Staff] Caching single patient from ${url}`)
      try {
        await cacheStaffPatients(data)
      } catch (error) {
        console.error(`[Admin/Staff] Cache error for patient:`, error)
      }
      return
    }
    
    // Match inventory endpoints
    if (/^\/inventory/.test(url) || /^\/vaccine-stocks/.test(url) || /^\/vaccines\/inventory/.test(url)) {
      console.log(`[Admin/Staff] Caching inventory from ${url}`)
      try {
        await cacheStaffInventory(data)
      } catch (error) {
        console.error(`[Admin/Staff] Cache error for inventory:`, error)
      }
      return
    }
    
    // CRITICAL: Early return to prevent admin from caching to parent DB
    return
  }
  
  // --- PARENT PORTAL LOGIC (Existing) ---
  // Original parent portal caching continues below
  // Only executes if role is guardian/parent (admin returned above)
  if (userRole === 'guardian' || userRole === 'parent') {
    if (/\/patients\/\d+$/.test(url)) {
      await cachePatientDetails(data)
    }
    else if (/\/patients(\?|$)/.test(url)) {
      await cachePatientList(data)
    }
    else if (/\/immunizations/.test(url) || /\/vaccinations/.test(url)) {
      await cacheImmunizations(data)
    }
    else if (/\/visits/.test(url)) {
      await cacheVisits(data)
    }
    else if (/\/vitalsigns/.test(url) || /\/vitals/.test(url)) {
      await cacheVitals(data)
    }
    else if (/\/patientschedule/.test(url) || /\/schedule/.test(url)) {
       await cacheSchedule(response)
    }
    else if (/\/notifications/.test(url)) {
      await cacheNotifications(data)
    }
    else if (/\/vaccines/.test(url) || /\/vaccinemaster/.test(url)) {
      await cacheVaccineMaster(data)
    }
    else if (/\/conversations(\?|$)/.test(url)) {
      await cacheConversations(data)
    }
    else if (/\/messages\//.test(url)) {
      await cacheMessages(data)
    }
    else if (/\/faqs(\?|$)/.test(url)) {
      await cacheFaqs(data)
    }
  }
}

// ========================================
// ADMIN/STAFF CACHE HANDLERS
// ========================================

/**
 * Cache patients for Admin/Staff (simplified, read-only)
 */
async function cacheStaffPatients(data) {
  const patients = Array.isArray(data) ? data : (data.data || [data])
  if (!Array.isArray(patients) || patients.length === 0) return
  
  const formatted = patients
    .filter(p => p && p.patient_id)
    .map(p => ({
      patient_id: p.patient_id,
      surname: p.surname,
      firstname: p.firstname,
      middlename: p.middlename,
      full_name: p.full_name || `${p.firstname || ''} ${p.middlename || ''} ${p.surname || ''}`.trim(),
      sex: p.sex,
      date_of_birth: p.date_of_birth,
      address: p.address,
      barangay: p.barangay,
      health_center: p.health_center,
      status: p.status,
      tags: p.tags,
      family_number: p.family_number
    }))
  
  if (formatted.length > 0) {
    await staffDb.patients.bulkPut(formatted)
    console.log(`✅ [Admin/Staff] Cached ${formatted.length} patients`)
  }
}

/**
 * Cache inventory for Admin/Staff (simplified, read-only)
 */
async function cacheStaffInventory(data) {
  const inventory = Array.isArray(data) ? data : (data.data || [data])
  if (!Array.isArray(inventory) || inventory.length === 0) return
  
  const formatted = inventory
    .filter(i => i && i.id)
    .map(i => ({
      id: i.id,
      vaccine_id: i.vaccine_id,
      vaccine_name: i.vaccine_name,
      lot_no: i.lot_no,
      batch_no: i.batch_no,
      quantity: i.quantity,
      expiry_date: i.expiry_date,
      manufacturer: i.manufacturer,
      location: i.location,
      status: i.status
    }))
  
  if (formatted.length > 0) {
    await staffDb.inventory.bulkPut(formatted)
    console.log(`✅ [Admin/Staff] Cached ${formatted.length} inventory items`)
  }
}

// ========================================
// PARENT PORTAL CACHE HANDLERS (Existing)
// ========================================

/**
 * Cache single patient details with nested data
 * Handles /patients/:id endpoint response
 */
async function cachePatientDetails(response) {
  const db = await ensureParentDb() // Lazy load parent DB
  const patient = response?.data || response
  if (!patient || !patient.patient_id) return

  // Precompute records and arrays, filter invalids early
  const patientRecord = {
    patient_id: patient.patient_id,
    surname: patient.surname,
    firstname: patient.firstname,
    middlename: patient.middlename,
    full_name: patient.full_name || `${patient.firstname} ${patient.middlename || ''} ${patient.surname}`.trim(),
    sex: patient.sex,
    date_of_birth: patient.date_of_birth,
    address: patient.address,
    barangay: patient.barangay,
    health_center: patient.health_center,
    guardian_id: patient.guardian_id,
    family_number: patient.family_number,
    mother_name: patient.mother_name,
    mother_occupation: patient.mother_occupation,
    mother_contact_number: patient.mother_contact_number,
    father_name: patient.father_name,
    father_occupation: patient.father_occupation,
    father_contact_number: patient.father_contact_number,
    relationship_to_guardian: patient.relationship_to_guardian,
    tags: patient.tags,
    status: patient.status,
    date_registered: patient.date_registered,
    created_at: patient.created_at,
    updated_at: patient.updated_at
  }

  const hasGuardianBasics = !!(patient.guardian_id && (patient.guardian_firstname || patient.guardian_surname))
  const guardianRecord = hasGuardianBasics
    ? {
        guardian_id: patient.guardian_id,
        surname: patient.guardian_surname,
        firstname: patient.guardian_firstname,
        middlename: patient.guardian_middlename,
        birthdate: patient.guardian_birthdate,
        address: patient.guardian_address || patient.address,
        occupation: patient.guardian_occupation,
        contact_number: patient.guardian_contact_number,
        alternative_contact_number: patient.guardian_alternative_contact_number,
        email: patient.guardian_email,
        family_number: patient.family_number || patient.guardian_family_number,
        user_id: patient.guardian_user_id
      }
    : null

  const birthHistory = patient.medical_history
  const hasBirthHistory = !!(birthHistory && Object.keys(birthHistory).length > 0)
  const birthHistoryRecord = hasBirthHistory
    ? {
        birthhistory_id: birthHistory.birthhistory_id || `bh-${patient.patient_id}`,
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
      }
    : null

  const vaccinations = patient.vaccinationHistory || patient.vaccination_history || patient.immunizations || []
  const immunizationRecords = []
  if (Array.isArray(vaccinations) && vaccinations.length) {
    for (let idx = 0; idx < vaccinations.length; idx++) {
      const i = vaccinations[idx]
      const id = i && (i.immunization_id)
      if (!id) continue
      const vname = i.vaccine_name || i.antigen_name || i.vaccine_antigen_name
      const aname = i.antigen_name || i.vaccine_antigen_name || i.vaccine_name
      immunizationRecords.push({
        immunization_id: id,
        patient_id: i.patient_id || patient.patient_id,
        visit_id: i.visit_id,
        vaccine_id: i.vaccine_id,
        dose_number: i.dose_number,
        administered_date: i.administered_date,
        administered_time: i.administered_time,
        administered_by: i.administered_by,
        age_at_administration: i.age_at_administration,
        disease_prevented: i.disease_prevented,
        facility_name: i.facility_name,
        immunization_facility_name: i.immunization_facility_name,
        outside: i.outside,
        remarks: i.remarks,
        inventory_id: i.inventory_id,
        vital_id: i.vital_id,
        created_at: i.created_at,
        updated_at: i.updated_at,
        // Denormalized
        vaccine_name: vname,
        antigen_name: aname,
        brand_name: i.brand_name,
        manufacturer: i.manufacturer,
        patient_name: i.patient_name || i.full_name,
        health_worker_name: i.health_worker_name || i.administered_by_name
      })
    }
  }

  const schedulesRaw = patient.nextScheduledVaccinations || patient.next_scheduled_vaccinations || patient.schedule || []
  const scheduleRecords = []
  if (Array.isArray(schedulesRaw) && schedulesRaw.length) {
    for (let idx = 0; idx < schedulesRaw.length; idx++) {
      const s = schedulesRaw[idx]
      const sid = s && (s.patient_schedule_id || s.id)
      const pid = (s && (s.patient_id != null ? s.patient_id : patient.patient_id))
      if (!sid || !pid) continue
      const sname = s.name
      const vaccineName = sname || s.vaccine_name || s.antigen_name
      scheduleRecords.push({
        patient_schedule_id: sid,
        patient_id: pid,
        vaccine_id: s.vaccine_id,
        dose_number: s.dose_number || s.dose || 1,
        scheduled_date: s.scheduled_date || s.scheduledDate,
        eligible_date: s.eligible_date,
        actual_date: s.actual_date,
        status: s.status,
        created_at: s.created_at,
        updated_at: s.updated_at,
        // Denormalized
        vaccine_name: vaccineName,
        name: sname,
        patient_name: s.patient_name || s.full_name
      })
    }
  }

  // Prefer a single transaction when record sets are reasonably small.
  if (immunizationRecords.length <= CHUNK_SIZE && scheduleRecords.length <= CHUNK_SIZE) {
    await db.transaction('rw', db.patients, db.guardians, db.birthhistory, db.immunizations, db.patientschedule, async () => {
      await db.patients.put(patientRecord)
      if (guardianRecord) await db.guardians.put(guardianRecord)
      if (birthHistoryRecord) await db.birthhistory.put(birthHistoryRecord)
      if (immunizationRecords.length) await db.immunizations.bulkPut(immunizationRecords)
      if (scheduleRecords.length) await db.patientschedule.bulkPut(scheduleRecords)
    })
  } else {
    // For very large nested arrays: keep core entities in one small transaction, then chunk big tables
    await db.transaction('rw', db.patients, db.guardians, db.birthhistory, async () => {
      await db.patients.put(patientRecord)
      if (guardianRecord) await db.guardians.put(guardianRecord)
      if (birthHistoryRecord) await db.birthhistory.put(birthHistoryRecord)
    })
    if (immunizationRecords.length) {
      await bulkPutChunked(db.immunizations, immunizationRecords, 'immunizations')
    }
    if (scheduleRecords.length) {
      await bulkPutChunked(db.patientschedule, scheduleRecords, 'schedules')
    }
  }
  console.log(`✅ Cached patient ${patient.patient_id} (guardian:${guardianRecord ? 1 : 0}, birthhistory:${birthHistoryRecord ? 1 : 0}, immunizations:${immunizationRecords.length}, schedules:${scheduleRecords.length})`)
}

/**
 * Cache list of patients
 * Handles /patients or /parent/children endpoint
 */
async function cachePatientList(response) {
  const db = await ensureParentDb() // Lazy load parent DB
  const patients = response.data || response.items || response
  if (!Array.isArray(patients) || patients.length === 0) return
  const formatted = []
  for (let i = 0; i < patients.length; i++) {
    const p = patients[i]
    const id = p && p.patient_id
    if (!id) continue
    const full = p.full_name || `${p.firstname || ''} ${p.middlename || ''} ${p.surname || ''}`.trim()
    formatted.push({
      patient_id: id,
      surname: p.surname,
      firstname: p.firstname,
      middlename: p.middlename,
      full_name: full,
      sex: p.sex,
      date_of_birth: p.date_of_birth,
      address: p.address,
      barangay: p.barangay,
      health_center: p.health_center,
      guardian_id: p.guardian_id,
      family_number: p.family_number,
      mother_name: p.mother_name,
      father_name: p.father_name,
      tags: p.tags,
      status: p.status,
      date_registered: p.date_registered
    })
  }
  if (formatted.length === 0) return
  await bulkPutChunked(db.patients, formatted, 'patients')
}

/**
 * Cache immunization records
 */
async function cacheImmunizations(response) {
  const db = await ensureParentDb() // Lazy load parent DB
  const immunizations = response.data || response.items || response
  if (!Array.isArray(immunizations) || immunizations.length === 0) return
  const out = []
  for (let k = 0; k < immunizations.length; k++) {
    const i = immunizations[k]
    const id = i && i.immunization_id
    if (!id) continue
    const vname = i.vaccine_name || i.antigen_name || i.vaccine_antigen_name
    const aname = i.antigen_name || i.vaccine_antigen_name || i.vaccine_name
    out.push({
      immunization_id: id,
      patient_id: i.patient_id,
      visit_id: i.visit_id,
      vaccine_id: i.vaccine_id,
      dose_number: i.dose_number,
      administered_date: i.administered_date,
      administered_time: i.administered_time,
      administered_by: i.administered_by,
      age_at_administration: i.age_at_administration,
      disease_prevented: i.disease_prevented,
      facility_name: i.facility_name,
      immunization_facility_name: i.immunization_facility_name,
      outside: i.outside,
      remarks: i.remarks,
      inventory_id: i.inventory_id,
      vital_id: i.vital_id,
      created_at: i.created_at,
      updated_at: i.updated_at,
      vaccine_name: vname,
      antigen_name: aname,
      brand_name: i.brand_name,
      manufacturer: i.manufacturer,
      patient_name: i.patient_name || i.full_name,
      health_worker_name: i.health_worker_name || i.administered_by_name
    })
  }
  if (out.length === 0) return
  await bulkPutChunked(db.immunizations, out, 'immunizations')
}

/**
 * Cache visit records (medical history)
 */
async function cacheVisits(response) {
  const db = await ensureParentDb() // Lazy load parent DB
  const visits = response.data || response.items || response
  if (!Array.isArray(visits) || visits.length === 0) return
  const out = []
  for (let i = 0; i < visits.length; i++) {
    const v = visits[i]
    const id = v && v.visit_id
    if (!id) continue
    out.push({
      visit_id: id,
      patient_id: v.patient_id,
      visit_date: v.visit_date,
      findings: v.findings,
      service_rendered: v.service_rendered,
      recorded_by: v.recorded_by,
      created_at: v.created_at,
      updated_at: v.updated_at,
      patient_name: v.patient_name || v.full_name,
      health_worker_name: v.health_worker_name
    })
  }
  if (out.length === 0) return
  await bulkPutChunked(db.visits, out, 'visits')
}

/**
 * Cache vital signs (growth monitoring)
 */
async function cacheVitals(response) {
  const db = await ensureParentDb() // Lazy load parent DB
  const vitalsRaw = response.data || response.items || response
  if (!vitalsRaw) return
  const list = Array.isArray(vitalsRaw) ? vitalsRaw : [vitalsRaw]
  if (list.length === 0) return
  const out = []
  for (let i = 0; i < list.length; i++) {
    const v = list[i]
    const id = v.vital_id || (v.visit_id ? `vital-${v.visit_id}` : undefined)
    if (!id) continue
    out.push({
      vital_id: id,
      visit_id: v.visit_id,
      temperature: v.temperature,
      respiration_rate: v.respiration_rate,
      weight: v.weight,
      height_length: v.height_length,
      muac: v.muac,
      created_at: v.created_at,
      updated_at: v.updated_at
    })
  }
  if (out.length === 0) return
  await bulkPutChunked(db.vitalsigns, out, 'vital signs')
}

/**
 * Cache patient schedule (upcoming vaccinations)
 */
async function cacheSchedule(response) {
  const db = await ensureParentDb() // Lazy load parent DB
  // response can be either the axios response (with config/url) or raw data
  const url = response?.config?.url || ''
  const raw = response?.data || response?.items || response
  let schedules = []
  if (Array.isArray(raw)) {
    schedules = raw
  } else if (Array.isArray(raw?.schedule)) {
    schedules = raw.schedule
  } else if (Array.isArray(raw?.data?.schedule)) {
    schedules = raw.data.schedule
  } else if (Array.isArray(raw?.data)) {
    schedules = raw.data
  }
  if (!Array.isArray(schedules) || schedules.length === 0) return
  // Try to infer patient_id from URL: /parent/children/:id/schedule
  let inferredPatientId
  const m = url.match(/\/parent\/children\/(\d+)\/schedule/)
  if (m) inferredPatientId = parseInt(m[1])
  const formatted = []
  for (let i = 0; i < schedules.length; i++) {
    const s = schedules[i]
    const sid = s && (s.patient_schedule_id || s.id)
    const pid = s && (s.patient_id != null ? s.patient_id : inferredPatientId)
    if (!sid || !pid) continue
    const sname = s.name
    const vname = sname || s.vaccine_name || s.antigen_name
    formatted.push({
      patient_schedule_id: sid,
      patient_id: pid,
      vaccine_id: s.vaccine_id,
      dose_number: s.dose_number || s.dose || 1,
      scheduled_date: s.scheduled_date || s.scheduledDate,
      eligible_date: s.eligible_date,
      actual_date: s.actual_date,
      status: s.status,
      created_at: s.created_at,
      updated_at: s.updated_at,
      vaccine_name: vname,
      name: sname,
      patient_name: s.patient_name || s.full_name
    })
  }
  if (formatted.length === 0) return
  await bulkPutChunked(db.patientschedule, formatted, 'schedules')
}

/**
 * Cache notifications
 */
async function cacheNotifications(response) {
  const db = await ensureParentDb() // Lazy load parent DB
  const notifications = response.data || response.items || response
  if (!Array.isArray(notifications) || notifications.length === 0) return
  const formatted = []
  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i]
    const id = n && n.notification_id
    if (!id) continue
    formatted.push({
      notification_id: id,
      channel: n.channel,
      recipient_user_id: n.recipient_user_id,
      recipient_phone: n.recipient_phone,
      recipient_email: n.recipient_email,
      template_code: n.template_code,
      message_body: n.message_body,
      related_entity_type: n.related_entity_type,
      related_entity_id: n.related_entity_id,
      scheduled_at: n.scheduled_at,
      sent_at: n.sent_at,
      read_at: n.read_at,
      status: n.status,
      created_at: n.created_at,
      updated_at: n.updated_at
    })
  }
  if (formatted.length === 0) return
  await bulkPutChunked(db.notifications, formatted, 'notifications')
}

/**
 * Cache vaccine master data (reference catalog)
 */
async function cacheVaccineMaster(response) {
  const db = await ensureParentDb() // Lazy load parent DB
  const vaccines = response.data || response.items || response
  if (!Array.isArray(vaccines) || vaccines.length === 0) return
  const formatted = []
  for (let i = 0; i < vaccines.length; i++) {
    const v = vaccines[i]
    const id = v && v.vaccine_id
    if (!id) continue
    formatted.push({
      vaccine_id: id,
      antigen_name: v.antigen_name,
      brand_name: v.brand_name,
      manufacturer: v.manufacturer,
      vaccine_type: v.vaccine_type,
      category: v.category,
      disease_prevented: v.disease_prevented,
      is_nip: v.is_nip,
      created_at: v.created_at,
      updated_at: v.updated_at
    })
  }
  if (formatted.length === 0) return
  await bulkPutChunked(db.vaccinemaster, formatted, 'vaccines')
}

/**
 * Cache conversations list
 */
async function cacheConversations(response) {
  const db = await ensureParentDb() // Lazy load parent DB
  const conversations = response.data || response.items || response
  if (!Array.isArray(conversations) || conversations.length === 0) return
  const formatted = []
  for (let i = 0; i < conversations.length; i++) {
    const c = conversations[i]
    const id = c && (c.conversation_id || c.id)
    if (!id) continue
    formatted.push({
      conversation_id: id,
      subject: c.subject || c.title || 'Conversation',
      updated_at: c.updated_at || c.last_message_at || c.created_at,
      unread_count: c.unread_count || 0,
      participants: c.participants || [],
    })
  }
  if (formatted.length === 0) return
  try {
    await bulkPutChunked(db.conversations, formatted, 'conversations')
  } catch (_) {}
}

/**
 * Cache messages for a conversation
 */
async function cacheMessages(response) {
  const db = await ensureParentDb() // Lazy load parent DB
  const messages = response.data || response.items || response
  if (!Array.isArray(messages) || messages.length === 0) return
  const formatted = []
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    const id = m && (m.message_id || m.id)
    if (!id) continue
    formatted.push({
      message_id: id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id || m.user_id,
      content: m.message_content || m.content || m.text,
      created_at: m.created_at || m.timestamp,
      pending: false,
    })
  }
  if (formatted.length === 0) return
  try {
    await bulkPutChunked(db.messages, formatted, 'messages')
  } catch (_) {}
}

/**
 * Cache FAQs for offline
 */
async function cacheFaqs(response) {
  const db = await ensureParentDb() // Lazy load parent DB
  let faqs = response.data || response.items || response
  if (!Array.isArray(faqs)) {
    if (Array.isArray(response?.data?.items)) faqs = response.data.items
    else if (Array.isArray(response?.items?.data)) faqs = response.items.data
  }
  if (!Array.isArray(faqs) || faqs.length === 0) return
  const formatted = []
  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i]
    const id = f && (f.faq_id || f.id)
    if (!id) continue
    formatted.push({
      faq_id: id,
      question: f.question || f.q,
      answer: f.answer || f.a,
      updated_at: f.updated_at || f.updatedAt || new Date().toISOString(),
    })
  }
  if (formatted.length === 0) return
  try {
    await bulkPutChunked(db.faqs, formatted, 'FAQs')
  } catch (_) {}
}

// ========================================
// OFFLINE FALLBACK - GET CACHED DATA
// ========================================

/**
 * Retrieve cached data when offline
 * Supports both Admin/Staff (StaffOfflineDB) and Parent Portal (ParentPortalOfflineDB)
 */
async function getCachedData(url) {
  const userRole = getRole()
  
  // --- ADMIN/STAFF OFFLINE READS ---
  if (userRole === 'admin' || userRole === 'healthstaff') {
    console.log(`[Admin/Staff Offline] Checking cache for: ${url}`)
    
    // Patient list: /patients or /patients?status=not_archived
    if (/^\/patients(\?|$)/.test(url)) {
      try {
        const allPatients = await staffDb.patients.toArray()
        console.log(`[Admin/Staff Offline] Found ${allPatients.length} cached patients`)
        
        // Return in same format as API (paginated response)
        return {
          data: allPatients,
          items: allPatients,
          pagination: {
            total: allPatients.length,
            page: 1,
            limit: allPatients.length,
            pages: 1
          }
        }
      } catch (error) {
        console.error('[Admin/Staff Offline] Error reading patients cache:', error)
        return null
      }
    }
    
    // Patient stats: /patients/stats
    if (/^\/patients\/stats/.test(url)) {
      try {
        const allPatients = await staffDb.patients.toArray()
        const total = allPatients.length
        const active = allPatients.filter(p => p.status === 'not_archived').length
        
        console.log(`[Admin/Staff Offline] Returning stats from ${total} cached patients`)
        return {
          total,
          active,
          archived: total - active
        }
      } catch (error) {
        console.error('[Admin/Staff Offline] Error calculating stats:', error)
        return null
      }
    }
    
    // Single patient: /patients/123
    const patientIdMatch = url.match(/^\/patients\/(\d+)$/)
    if (patientIdMatch) {
      const patientId = parseInt(patientIdMatch[1])
      try {
        const patient = await staffDb.patients.get(patientId)
        console.log(`[Admin/Staff Offline] Found patient ${patientId}:`, patient ? 'YES' : 'NO')
        return patient || null
      } catch (error) {
        console.error('[Admin/Staff Offline] Error reading single patient:', error)
        return null
      }
    }
    
    // Inventory: /inventory or /vaccines/inventory
    if (/^\/inventory/.test(url) || /^\/vaccine-stocks/.test(url) || /^\/vaccines\/inventory/.test(url)) {
      try {
        const inventory = await staffDb.inventory.toArray()
        console.log(`[Admin/Staff Offline] Found ${inventory.length} inventory items`)
        return {
          data: inventory,
          items: inventory
        }
      } catch (error) {
        console.error('[Admin/Staff Offline] Error reading inventory cache:', error)
        return null
      }
    }
    
    return null // No cache match for admin/staff
  }
  
  // --- PARENT PORTAL OFFLINE READS ---
  if (userRole === 'guardian' || userRole === 'parent') {
    const db = await ensureParentDb()
    console.log(`[Parent Offline] Checking cache for: ${url}`)
    
    // Patient list: /patients
    if (/^\/patients(\?|$)/.test(url)) {
      try {
        const patients = await db.patients.toArray()
        console.log(`[Parent Offline] Found ${patients.length} cached patients`)
        return { data: patients }
      } catch (error) {
        console.error('[Parent Offline] Error reading patients:', error)
        return null
      }
    }
    
    // Single patient: /patients/123
    const patientIdMatch = url.match(/^\/patients\/(\d+)$/)
    if (patientIdMatch) {
      const patientId = parseInt(patientIdMatch[1])
      try {
        const patient = await db.patients.get(patientId)
        console.log(`[Parent Offline] Found patient ${patientId}:`, patient ? 'YES' : 'NO')
        return patient || null
      } catch (error) {
        console.error('[Parent Offline] Error reading single patient:', error)
        return null
      }
    }
    
    // Immunizations: /immunizations or /patients/123/immunizations
    if (/\/immunizations/.test(url)) {
      try {
        let immunizations
        const patientIdFromUrl = url.match(/\/patients\/(\d+)\/immunizations/)
        
        if (patientIdFromUrl) {
          const patientId = parseInt(patientIdFromUrl[1])
          immunizations = await db.immunizations.where('patient_id').equals(patientId).toArray()
        } else {
          immunizations = await db.immunizations.toArray()
        }
        
        console.log(`[Parent Offline] Found ${immunizations.length} cached immunizations`)
        return { data: immunizations }
      } catch (error) {
        console.error('[Parent Offline] Error reading immunizations:', error)
        return null
      }
    }
    
    // Visits: /visits or /patients/123/visits
    if (/\/visits/.test(url)) {
      try {
        let visits
        const patientIdFromUrl = url.match(/\/patients\/(\d+)\/visits/)
        
        if (patientIdFromUrl) {
          const patientId = parseInt(patientIdFromUrl[1])
          visits = await db.visits.where('patient_id').equals(patientId).toArray()
        } else {
          visits = await db.visits.toArray()
        }
        
        console.log(`[Parent Offline] Found ${visits.length} cached visits`)
        return { data: visits }
      } catch (error) {
        console.error('[Parent Offline] Error reading visits:', error)
        return null
      }
    }
    
    // Notifications: /notifications
    if (/^\/notifications/.test(url)) {
      try {
        const notifications = await db.notifications.toArray()
        console.log(`[Parent Offline] Found ${notifications.length} cached notifications`)
        return { data: notifications }
      } catch (error) {
        console.error('[Parent Offline] Error reading notifications:', error)
        return null
      }
    }
    
    // Conversations: /conversations
    if (/^\/conversations/.test(url)) {
      try {
        const conversations = await db.conversations.toArray()
        console.log(`[Parent Offline] Found ${conversations.length} cached conversations`)
        return { data: conversations }
      } catch (error) {
        console.error('[Parent Offline] Error reading conversations:', error)
        return null
      }
    }
    
    // Messages: /messages/123
    const conversationIdMatch = url.match(/^\/messages\/(\d+)/)
    if (conversationIdMatch) {
      const conversationId = parseInt(conversationIdMatch[1])
      try {
        const messages = await db.messages.where('conversation_id').equals(conversationId).toArray()
        console.log(`[Parent Offline] Found ${messages.length} cached messages for conversation ${conversationId}`)
        return { data: messages }
      } catch (error) {
        console.error('[Parent Offline] Error reading messages:', error)
        return null
      }
    }
    
    // FAQs: /faqs
    if (/^\/faqs/.test(url)) {
      try {
        const faqs = await db.faqs.toArray()
        console.log(`[Parent Offline] Found ${faqs.length} cached FAQs`)
        return { data: faqs }
      } catch (error) {
        console.error('[Parent Offline] Error reading FAQs:', error)
        return null
      }
    }
    
    // Guardians: /guardians
    if (/^\/guardians/.test(url)) {
      try {
        const guardians = await db.guardians.toArray()
        console.log(`[Parent Offline] Found ${guardians.length} cached guardians`)
        return { data: guardians }
      } catch (error) {
        console.error('[Parent Offline] Error reading guardians:', error)
        return null
      }
    }
    
    return null // No cache match for parent portal
  }
  
  return null // No role match
}

export default { installCacheInterceptor }

