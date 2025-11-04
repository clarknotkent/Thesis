/**
 * Parent Login Prefetch - One-Time Bulk Cache on Login
 * 
 * Strategy:
 * 1. On successful parent login, fetch and cache ALL their data once
 * 2. Only re-cache when Supabase detects a write operation
 * 3. This ensures immediate offline functionality without over-fetching
 */

import api from '@/services/api'
import db from './db-parent-portal'

// Track if we've already cached for this session
let hasCachedThisSession = false
let isCurrentlyCaching = false

/**
 * Prefetch all parent route components for offline use
 * Uses dynamic imports to trigger module loading and caching
 */
async function prefetchParentRouteComponents() {
  console.log('📦 Prefetching parent route components...')
  
  try {
    // Use dynamic imports to load components (this triggers Vite's bundler and service worker caching)
    const components = await Promise.allSettled([
      import('@/views/parent/ParentHome.vue'),
      import('@/views/parent/ParentSchedule.vue'),
      import('@/views/parent/ParentRecords.vue'),
      import('@/views/parent/ParentNotifications.vue'),
      import('@/views/parent/ParentProfile.vue'),
      import('@/features/parent/records/DependentDetails.vue'),
      import('@/features/parent/records/VisitSummary.vue'),
      import('@/features/parent/records/VaccineRecordDetails.vue'),
      import('@/features/parent/schedule/ScheduleDetails.vue'),
      // Also prefetch shared components used by parent views
      import('@/components/parent/DependentCard.vue')
    ])
    
    const successful = components.filter(c => c.status === 'fulfilled').length
    const failed = components.filter(c => c.status === 'rejected').length
    
    console.log(`✅ Route components cached (${successful} success, ${failed} failed)`)
    return true
  } catch (err) {
    console.error('❌ Failed to prefetch routes:', err)
    return false
  }
}

/**
 * Main function: Bulk cache all parent data on login
 * Call this immediately after successful parent login
 */
export async function prefetchParentDataOnLogin(guardianId, userId) {
  // Prevent duplicate caching in same session
  if (hasCachedThisSession || isCurrentlyCaching) {
    console.log('⏭️ Skipping prefetch - already cached this session')
    return { success: true, cached: false, reason: 'already-cached' }
  }

  isCurrentlyCaching = true
  console.log('🚀 Starting one-time bulk cache on login...')
  console.log('📝 Guardian ID:', guardianId, 'User ID:', userId)
  
  const startTime = Date.now()
  const stats = {
    patients: 0,
    immunizations: 0,
    visits: 0,
    vitals: 0,
    schedules: 0,
    notifications: 0,
    vaccines: 0
  }

  try {
    // Step 0: Prefetch route components first (critical for offline navigation)
    console.log('📦 Step 0: Caching route components...')
    await prefetchParentRouteComponents()
    
    // Step 1: If guardianId not provided, fetch it from profile
    if (!guardianId) {
      console.log('📋 Guardian ID not provided, fetching from profile...')
      try {
        const profileResponse = await api.get('/parent/profile')
        const profile = profileResponse.data?.data || profileResponse.data
        guardianId = profile.guardian_id
        console.log('✅ Found guardian_id:', guardianId)
      } catch (err) {
        console.error('❌ Failed to fetch guardian profile:', err.message)
        isCurrentlyCaching = false
        return { success: false, cached: false, error: 'Failed to fetch guardian profile' }
      }
    }
    
    // Step 2: Fetch all children for this guardian
    console.log('📋 Fetching children list...')
    const patientsResponse = await api.get(`/parent/children`)
    const patients = Array.isArray(patientsResponse.data) 
      ? patientsResponse.data 
      : patientsResponse.data.data || []
    
    if (patients.length === 0) {
      console.log('⚠️ No children found for guardian')
      isCurrentlyCaching = false
      return { success: true, cached: false, reason: 'no-children' }
    }

    // Cache patients (clean data - remove nested objects)
    const cleanPatients = patients.map(p => {
      // Remove nested objects and arrays that aren't part of the patients table schema
      const { patientschedule, immunizations, visits, guardian, birthhistory, ...patientData } = p
      
      // Map frontend field names to database field names
      return {
        patient_id: patientData.id || patientData.patient_id,
        full_name: patientData.name || patientData.full_name,
        date_of_birth: patientData.dateOfBirth || patientData.date_of_birth,
        sex: patientData.gender || patientData.sex,
        barangay: patientData.barangay,
        // Keep other fields that might exist
        ...patientData
      }
    })
    
    console.log('📝 Clean patients to cache:', cleanPatients)
    console.log('🔑 First patient keys:', Object.keys(cleanPatients[0] || {}))
    console.log('🔑 First patient has patient_id?', cleanPatients[0]?.patient_id)
    
    try {
      await db.patients.bulkPut(cleanPatients)
      stats.patients = cleanPatients.length
      console.log(`✅ Cached ${cleanPatients.length} children`)
    } catch (err) {
      console.error('❌ Failed to cache patients:', err)
      throw new Error(`Failed to cache patients: ${err.message}`)
    }

    // Step 2: For each child, fetch detailed data
    for (const patient of patients) {
      // Use the original 'id' field from API response (not the mapped patient_id)
      const patientId = patient.id || patient.patient_id
      console.log(`📦 Caching data for child: ${patientId} - ${patient.name || patient.full_name || patient.firstname}`)

      // Fetch child details (includes birthhistory, guardian info, vaccination history)
      try {
        const detailsResponse = await api.get(`/patients/${patientId}`)
        const details = detailsResponse.data?.data || detailsResponse.data

        // The API interceptor automatically caches:
        // - Patient data to patients table
        // - Guardian info to guardians table  
        // - Birth history to birthhistory table
        // - Vaccination history to immunizations table
        console.log(`✅ Cached full details for patient ${patientId}`)
        
        // Count vaccinations if present
        if (details.vaccinationHistory && Array.isArray(details.vaccinationHistory)) {
          stats.immunizations += details.vaccinationHistory.length
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch details for patient ${patientId}:`, err.message)
      }

      // Note: Immunizations are included in patient details response as vaccinationHistory
      // No separate endpoint needed - skipping dedicated immunizations fetch

      // Fetch visits
      try {
        const visitsResponse = await api.get(`/parent/children/${patientId}/visits`)
        const visits = Array.isArray(visitsResponse.data)
          ? visitsResponse.data
          : visitsResponse.data.data || []
        
        if (visits.length > 0) {
          await db.visits.bulkPut(visits)
          stats.visits += visits.length

          // For each visit, fetch vitals
          for (const visit of visits) {
            try {
              const vitalsResponse = await api.get(`/vitals/${visit.visit_id}`)
              const vitals = vitalsResponse.data?.data || vitalsResponse.data
              
              if (vitals && vitals.vital_id) {
                await db.vitalsigns.put(vitals)
                stats.vitals++
              }
            } catch (err) {
              // Vitals might not exist for all visits - that's okay
            }
          }
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch visits for patient ${patientId}:`, err.message)
      }

      // Fetch vaccination schedule
      try {
        const scheduleResponse = await api.get(`/parent/children/${patientId}/schedule`)
        const schedules = Array.isArray(scheduleResponse.data)
          ? scheduleResponse.data
          : scheduleResponse.data.data || []
        
        if (schedules.length > 0) {
          await db.patientschedule.bulkPut(schedules)
          stats.schedules += schedules.length
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch schedule for patient ${patientId}:`, err.message)
      }
    }

    // Step 3: Fetch notifications for parent
    try {
      console.log('📬 Fetching notifications...')
      const notificationsResponse = await api.get(`/notifications`, {
        params: { user_id: userId }
      })
      const notifications = Array.isArray(notificationsResponse.data)
        ? notificationsResponse.data
        : notificationsResponse.data.data || []
      
      if (notifications.length > 0) {
        await db.notifications.bulkPut(notifications)
        stats.notifications = notifications.length
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch notifications:', err.message)
    }

    // Step 4: Fetch vaccine master list (reference data)
    try {
      console.log('💉 Fetching vaccine catalog...')
      const vaccinesResponse = await api.get(`/vaccines`)
      const vaccines = Array.isArray(vaccinesResponse.data)
        ? vaccinesResponse.data
        : vaccinesResponse.data.data || []
      
      if (vaccines.length > 0) {
        await db.vaccinemaster.bulkPut(vaccines)
        stats.vaccines = vaccines.length
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch vaccines:', err.message)
    }

    // Mark as cached for this session
    hasCachedThisSession = true
    isCurrentlyCaching = false

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log('🎉 Bulk cache complete!')
    console.log('📊 Cache Statistics:')
    console.log(`   • ${stats.patients} children`)
    console.log(`   • ${stats.immunizations} immunization records`)
    console.log(`   • ${stats.visits} visits`)
    console.log(`   • ${stats.vitals} vital signs`)
    console.log(`   • ${stats.schedules} scheduled appointments`)
    console.log(`   • ${stats.notifications} notifications`)
    console.log(`   • ${stats.vaccines} vaccines in catalog`)
    console.log(`   ⏱️ Completed in ${duration}s`)
    console.log('✅ You can now use the app offline!')

    return { 
      success: true, 
      cached: true, 
      duration,
      stats 
    }

  } catch (error) {
    console.error('❌ Bulk cache failed:', error)
    isCurrentlyCaching = false
    return { 
      success: false, 
      cached: false, 
      error: error.message 
    }
  }
}

/**
 * Reset cache flag (for logout)
 */
export function resetCacheFlag() {
  hasCachedThisSession = false
  isCurrentlyCaching = false
}

/**
 * Smart recache - only update when data changes
 * Call this when you detect a write operation (POST/PUT/DELETE)
 */
export async function recacheAfterWrite(resourceType, resourceId, guardianId, userId) {
  console.log(`🔄 Recaching ${resourceType} after write operation...`)
  
  try {
    switch (resourceType) {
      case 'patient':
        // Refetch single patient details
        const patientResponse = await api.get(`/parent/children/${resourceId}`)
        const patientData = patientResponse.data?.data || patientResponse.data
        await db.patients.put(patientData)
        if (patientData.birthhistory) {
          await db.birthhistory.put(patientData.birthhistory)
        }
        console.log(`✅ Recached patient ${resourceId}`)
        break

      case 'immunization':
        // Refetch immunizations for patient
        const immunizationsResponse = await api.get(`/parent/children/${resourceId}/immunizations`)
        const immunizations = Array.isArray(immunizationsResponse.data)
          ? immunizationsResponse.data
          : immunizationsResponse.data.data || []
        await db.immunizations.bulkPut(immunizations)
        console.log(`✅ Recached immunizations for patient ${resourceId}`)
        break

      case 'visit':
        // Refetch visits for patient
        const visitsResponse = await api.get(`/parent/children/${resourceId}/visits`)
        const visits = Array.isArray(visitsResponse.data)
          ? visitsResponse.data
          : visitsResponse.data.data || []
        await db.visits.bulkPut(visits)
        console.log(`✅ Recached visits for patient ${resourceId}`)
        break

      case 'schedule':
        // Refetch schedule for patient
        const scheduleResponse = await api.get(`/parent/children/${resourceId}/schedule`)
        const schedules = Array.isArray(scheduleResponse.data)
          ? scheduleResponse.data
          : scheduleResponse.data.data || []
        await db.patientschedule.bulkPut(schedules)
        console.log(`✅ Recached schedule for patient ${resourceId}`)
        break

      case 'notification':
        // Refetch all notifications for user
        const notificationsResponse = await api.get(`/notifications`, {
          params: { user_id: userId }
        })
        const notifications = Array.isArray(notificationsResponse.data)
          ? notificationsResponse.data
          : notificationsResponse.data.data || []
        await db.notifications.bulkPut(notifications)
        console.log(`✅ Recached notifications`)
        break

      default:
        console.warn(`⚠️ Unknown resource type: ${resourceType}`)
    }

    return { success: true }
  } catch (error) {
    console.error(`❌ Recache failed for ${resourceType}:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if cache exists and is not empty
 */
export async function hasCachedData() {
  try {
    const patientCount = await db.patients.count()
    return patientCount > 0
  } catch (error) {
    return false
  }
}
