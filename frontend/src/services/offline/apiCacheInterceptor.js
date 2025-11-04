/**
 * API Cache Interceptor for Parent Portal Offline Support
 * 
 * Automatically caches API responses to IndexedDB for offline access.
 * Simple rule: If response succeeds, cache it.
 * 
 * New: Detects write operations (POST/PUT/DELETE) and triggers smart recaching
 */

import db from './db-parent-portal'
import { recacheAfterWrite } from './parentLoginPrefetch'

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
    (error) => {
      // Pass through errors unchanged
      return Promise.reject(error)
    }
  )
  
  console.log('✅ API cache interceptor installed with write detection')
}

/**
 * Handle write operations - trigger smart recaching
 */
async function handleWriteOperation(response) {
  const url = response.config.url
  const method = response.config.method?.toLowerCase()
  
  console.log(`🔄 Write operation detected: ${method.toUpperCase()} ${url}`)
  
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
      await recacheAfterWrite('immunization', patientId, guardianId, userId)
    }
  }
  else if (/\/visits/.test(url)) {
    if (patientId) {
      await recacheAfterWrite('visit', patientId, guardianId, userId)
    }
  }
  else if (/\/patients/.test(url)) {
    if (patientId) {
      await recacheAfterWrite('patient', patientId, guardianId, userId)
    }
  }
  else if (/\/patientschedule/.test(url) || /\/schedule/.test(url)) {
    if (patientId) {
      await recacheAfterWrite('schedule', patientId, guardianId, userId)
    }
  }
  else if (/\/notifications/.test(url)) {
    await recacheAfterWrite('notification', null, guardianId, userId)
  }
}

/**
 * Main caching logic - routes responses to appropriate handlers
 */
async function cacheResponse(response) {
  const url = response.config.url
  const data = response.data
  
  // Skip empty responses
  if (!data) return
  
  // Route to appropriate cache handler based on URL pattern
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
    await cacheSchedule(data)
  }
  else if (/\/notifications/.test(url)) {
    await cacheNotifications(data)
  }
  else if (/\/vaccines/.test(url) || /\/vaccinemaster/.test(url)) {
    await cacheVaccineMaster(data)
  }
}

// ========================================
// CACHE HANDLERS FOR EACH DATA TYPE
// ========================================

/**
 * Cache single patient details with nested data
 * Handles /patients/:id endpoint response
 */
async function cachePatientDetails(response) {
  const patient = response.data || response
  if (!patient || !patient.patient_id) return
  
  console.log('💾 Caching patient details:', patient.patient_id)
  
  // 1. Save patient basic info
  await db.patients.put({
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
  })
  
  // 2. Save guardian info (if present)
  if (patient.guardian_id && (patient.guardian_firstname || patient.guardian_surname)) {
    await db.guardians.put({
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
    })
  }
  
  // 3. Save birth history (if present in medical_history field)
  const birthHistory = patient.medical_history
  if (birthHistory && Object.keys(birthHistory).length > 0) {
    await db.birthhistory.put({
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
    })
  }
  
  // 4. Save nested vaccination history array
  const vaccinations = patient.vaccinationHistory || patient.vaccination_history || patient.immunizations
  if (Array.isArray(vaccinations) && vaccinations.length > 0) {
    console.log(`💉 Caching ${vaccinations.length} immunizations from patient details`)
    await cacheImmunizations({ data: vaccinations })
  }
  
  // 5. Save nested schedule array
  const schedules = patient.nextScheduledVaccinations || patient.next_scheduled_vaccinations || patient.schedule
  if (Array.isArray(schedules) && schedules.length > 0) {
    console.log(`📅 Caching ${schedules.length} schedules from patient details`)
    await cacheSchedule({ data: schedules })
  }
  
  console.log(`✅ Cached patient ${patient.patient_id} with related data`)
}

/**
 * Cache list of patients
 * Handles /patients or /parent/children endpoint
 */
async function cachePatientList(response) {
  const patients = response.data || response.items || response
  if (!Array.isArray(patients) || patients.length === 0) return
  
  console.log(`💾 Caching ${patients.length} patients`)
  
  const formatted = patients.map(p => ({
    patient_id: p.patient_id,
    surname: p.surname,
    firstname: p.firstname,
    middlename: p.middlename,
    full_name: p.full_name || `${p.firstname} ${p.middlename || ''} ${p.surname}`.trim(),
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
  }))
  
  await db.patients.bulkPut(formatted)
  console.log(`✅ Cached ${formatted.length} patients`)
}

/**
 * Cache immunization records
 */
async function cacheImmunizations(response) {
  const immunizations = response.data || response.items || response
  if (!Array.isArray(immunizations) || immunizations.length === 0) return
  
  console.log(`💾 Caching ${immunizations.length} immunizations`)
  
  const formatted = immunizations.map(i => ({
    immunization_id: i.immunization_id,
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
    outside: i.outside,
    remarks: i.remarks,
    inventory_id: i.inventory_id,
    vital_id: i.vital_id,
    created_at: i.created_at,
    updated_at: i.updated_at,
    // Denormalized fields from immunizationhistory_view
    vaccine_name: i.vaccine_name || i.antigen_name || i.vaccine_antigen_name,
    antigen_name: i.antigen_name || i.vaccine_antigen_name || i.vaccine_name,
    brand_name: i.brand_name,
    manufacturer: i.manufacturer,
    patient_name: i.patient_name || i.full_name,
    health_worker_name: i.health_worker_name || i.administered_by_name
  }))
  
  await db.immunizations.bulkPut(formatted)
  console.log(`✅ Cached ${formatted.length} immunizations`)
}

/**
 * Cache visit records (medical history)
 */
async function cacheVisits(response) {
  const visits = response.data || response.items || response
  if (!Array.isArray(visits) && visits.length === 0) return
  
  console.log(`💾 Caching ${visits.length} visits`)
  
  const formatted = visits.map(v => ({
    visit_id: v.visit_id,
    patient_id: v.patient_id,
    visit_date: v.visit_date,
    findings: v.findings,
    service_rendered: v.service_rendered,
    recorded_by: v.recorded_by,
    created_at: v.created_at,
    updated_at: v.updated_at,
    // Denormalized
    patient_name: v.patient_name || v.full_name,
    health_worker_name: v.health_worker_name
  }))
  
  await db.visits.bulkPut(formatted)
  console.log(`✅ Cached ${formatted.length} visits`)
}

/**
 * Cache vital signs (growth monitoring)
 */
async function cacheVitals(response) {
  const vitals = response.data || response.items || response
  if (!Array.isArray(vitals) || vitals.length === 0) return
  
  console.log(`💾 Caching ${vitals.length} vital signs`)
  
  const formatted = vitals.map(v => ({
    vital_id: v.vital_id,
    visit_id: v.visit_id,
    temperature: v.temperature,
    respiration_rate: v.respiration_rate,
    weight: v.weight,
    height_length: v.height_length,
    muac: v.muac,
    created_at: v.created_at,
    updated_at: v.updated_at
  }))
  
  await db.vitalsigns.bulkPut(formatted)
  console.log(`✅ Cached ${formatted.length} vital signs`)
}

/**
 * Cache patient schedule (upcoming vaccinations)
 */
async function cacheSchedule(response) {
  const schedules = response.data || response.items || response
  if (!Array.isArray(schedules) || schedules.length === 0) return
  
  console.log(`💾 Caching ${schedules.length} schedules`)
  
  const formatted = schedules.map(s => ({
    patient_schedule_id: s.patient_schedule_id,
    patient_id: s.patient_id,
    vaccine_id: s.vaccine_id,
    dose_number: s.dose_number,
    scheduled_date: s.scheduled_date,
    eligible_date: s.eligible_date,
    actual_date: s.actual_date,
    status: s.status,
    created_at: s.created_at,
    updated_at: s.updated_at,
    // Denormalized
    vaccine_name: s.vaccine_name || s.antigen_name,
    patient_name: s.patient_name || s.full_name
  }))
  
  await db.patientschedule.bulkPut(formatted)
  console.log(`✅ Cached ${formatted.length} schedules`)
}

/**
 * Cache notifications
 */
async function cacheNotifications(response) {
  const notifications = response.data || response.items || response
  if (!Array.isArray(notifications) || notifications.length === 0) return
  
  console.log(`💾 Caching ${notifications.length} notifications`)
  
  const formatted = notifications.map(n => ({
    notification_id: n.notification_id,
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
  }))
  
  await db.notifications.bulkPut(formatted)
  console.log(`✅ Cached ${formatted.length} notifications`)
}

/**
 * Cache vaccine master data (reference catalog)
 */
async function cacheVaccineMaster(response) {
  const vaccines = response.data || response.items || response
  if (!Array.isArray(vaccines) || vaccines.length === 0) return
  
  console.log(`💾 Caching ${vaccines.length} vaccines`)
  
  const formatted = vaccines.map(v => ({
    vaccine_id: v.vaccine_id,
    antigen_name: v.antigen_name,
    brand_name: v.brand_name,
    manufacturer: v.manufacturer,
    vaccine_type: v.vaccine_type,
    category: v.category,
    disease_prevented: v.disease_prevented,
    is_nip: v.is_nip,
    created_at: v.created_at,
    updated_at: v.updated_at
  }))
  
  await db.vaccinemaster.bulkPut(formatted)
  console.log(`✅ Cached ${formatted.length} vaccines`)
}

export default { installCacheInterceptor }
