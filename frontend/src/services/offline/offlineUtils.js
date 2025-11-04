/**
 * Offline Data Access Utilities for Parent Portal
 * 
 * Provides clean API for components to fetch data with offline support.
 * Pattern: Try cache first if offline, otherwise let API interceptor handle it.
 */

import db from './db-parent-portal'
import api from '../api'

/**
 * Check if device is currently online
 */
export function isOnline() {
  return navigator.onLine
}

// ========================================
// PATIENT DATA
// ========================================

/**
 * Get complete patient details with all related data
 * @param {number} patientId - Patient ID
 * @param {boolean} forceCache - Force reading from cache even when online
 * @returns {Object} Patient object with nested guardian, birthhistory, vaccinations, schedule
 */
export async function getPatientDetails(patientId, forceCache = false) {
  try {
    // If online and not forcing cache, fetch from API (will auto-cache via interceptor)
    if (isOnline() && !forceCache) {
      console.log(`🌐 Fetching patient ${patientId} from API (online)`)
      const response = await api.get(`/patients/${patientId}`)
      return response.data.data || response.data
    }
    
    // Offline or forced cache - read from IndexedDB
    console.log(`📴 Loading patient ${patientId} from cache`)
    
    const patient = await db.patients.get(Number(patientId))
    if (!patient) {
      throw new Error('Patient not found in offline cache')
    }
    
    // Fetch related data from cache
    const [guardian, birthHistory, immunizations, schedule] = await Promise.all([
      patient.guardian_id ? db.guardians.get(patient.guardian_id) : null,
      db.birthhistory.where('patient_id').equals(Number(patientId)).first(),
      db.immunizations.where('patient_id').equals(Number(patientId)).toArray(),
      db.patientschedule.where('patient_id').equals(Number(patientId)).toArray()
    ])
    
    // Build response matching API format
    return {
      ...patient,
      // Guardian fields (flattened for compatibility)
      guardian_firstname: guardian?.firstname,
      guardian_surname: guardian?.surname,
      guardian_middlename: guardian?.middlename,
      guardian_contact_number: guardian?.contact_number,
      guardian_alternative_contact_number: guardian?.alternative_contact_number,
      guardian_occupation: guardian?.occupation,
      guardian_email: guardian?.email,
      guardian_user_id: guardian?.user_id,
      // Nested medical history
      medical_history: birthHistory || {},
      // Nested vaccination history
      vaccinationHistory: immunizations || [],
      // Nested schedule
      nextScheduledVaccinations: schedule || []
    }
  } catch (error) {
    console.error('Error fetching patient details:', error)
    throw error
  }
}

/**
 * Get list of all patients for current guardian
 * @param {number} guardianId - Guardian ID (optional, filters by guardian)
 * @param {boolean} forceCache - Force reading from cache
 * @returns {Array} List of patients
 */
export async function getPatientList(guardianId = null, forceCache = false) {
  try {
    // If online and not forcing cache, fetch from API
    if (isOnline() && !forceCache) {
      console.log('🌐 Fetching patient list from API')
      const response = await api.get('/parent/children')
      return response.data.data || response.data || []
    }
    
    // Offline or forced cache
    console.log('📴 Loading patient list from cache')
    
    if (guardianId) {
      return await db.patients.where('guardian_id').equals(Number(guardianId)).toArray()
    } else {
      return await db.patients.toArray()
    }
  } catch (error) {
    console.error('Error fetching patient list:', error)
    throw error
  }
}

// ========================================
// IMMUNIZATION DATA
// ========================================

/**
 * Get vaccination history for a patient
 * @param {number} patientId - Patient ID
 * @param {boolean} forceCache - Force reading from cache
 * @returns {Array} List of immunization records
 */
export async function getVaccinationHistory(patientId, forceCache = false) {
  try {
    // If online and not forcing cache, fetch from API
    if (isOnline() && !forceCache) {
      console.log(`🌐 Fetching immunizations for patient ${patientId} from API`)
      const response = await api.get(`/parent/children/${patientId}/immunizations`)
      return response.data.data || response.data || []
    }
    
    // Offline or forced cache
    console.log(`📴 Loading immunizations for patient ${patientId} from cache`)
    return await db.immunizations
      .where('patient_id')
      .equals(Number(patientId))
      .reverse() // Most recent first
      .sortBy('administered_date')
  } catch (error) {
    console.error('Error fetching vaccination history:', error)
    throw error
  }
}

// ========================================
// MEDICAL HISTORY
// ========================================

/**
 * Get medical visit history for a patient
 * @param {number} patientId - Patient ID
 * @param {boolean} forceCache - Force reading from cache
 * @returns {Array} List of visit records
 */
export async function getMedicalHistory(patientId, forceCache = false) {
  try {
    // If online and not forcing cache, fetch from API
    if (isOnline() && !forceCache) {
      console.log(`🌐 Fetching medical history for patient ${patientId} from API`)
      const response = await api.get(`/visits?patient_id=${patientId}`)
      return response.data.items || response.data.data || response.data || []
    }
    
    // Offline or forced cache
    console.log(`📴 Loading medical history for patient ${patientId} from cache`)
    return await db.visits
      .where('patient_id')
      .equals(Number(patientId))
      .reverse()
      .sortBy('visit_date')
  } catch (error) {
    console.error('Error fetching medical history:', error)
    throw error
  }
}

/**
 * Get vitals for a specific visit
 * @param {number} visitId - Visit ID
 * @param {boolean} forceCache - Force reading from cache
 * @returns {Object|null} Vital signs record
 */
export async function getVisitVitals(visitId, forceCache = false) {
  try {
    // If online, let components fetch from API normally
    if (isOnline() && !forceCache) {
      return null // Let component handle API call
    }
    
    // Offline - get from cache
    return await db.vitalsigns.where('visit_id').equals(Number(visitId)).first()
  } catch (error) {
    console.error('Error fetching visit vitals:', error)
    return null
  }
}

// ========================================
// SCHEDULE DATA
// ========================================

/**
 * Get vaccination schedule for a patient
 * @param {number} patientId - Patient ID
 * @param {boolean} forceCache - Force reading from cache
 * @returns {Array} List of scheduled vaccinations
 */
export async function getVaccinationSchedule(patientId, forceCache = false) {
  try {
    // If online and not forcing cache, fetch from API
    if (isOnline() && !forceCache) {
      console.log(`🌐 Fetching schedule for patient ${patientId} from API`)
      const response = await api.get(`/parent/children/${patientId}/schedule`)
      return response.data.data || response.data || []
    }
    
    // Offline or forced cache
    console.log(`📴 Loading schedule for patient ${patientId} from cache`)
    return await db.patientschedule
      .where('patient_id')
      .equals(Number(patientId))
      .sortBy('scheduled_date')
  } catch (error) {
    console.error('Error fetching vaccination schedule:', error)
    throw error
  }
}

// ========================================
// NOTIFICATIONS
// ========================================

/**
 * Get notifications for current user
 * @param {number} userId - User ID
 * @param {boolean} forceCache - Force reading from cache
 * @returns {Array} List of notifications
 */
export async function getNotifications(userId, forceCache = false) {
  try {
    // If online and not forcing cache, fetch from API
    if (isOnline() && !forceCache) {
      console.log('🌐 Fetching notifications from API')
      const response = await api.get('/parent/notifications')
      return response.data.data || response.data || []
    }
    
    // Offline or forced cache
    console.log('📴 Loading notifications from cache')
    return await db.notifications
      .where('recipient_user_id')
      .equals(Number(userId))
      .reverse()
      .sortBy('created_at')
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }
}

/**
 * Mark notification as read (online only)
 * @param {number} notificationId - Notification ID
 * @returns {boolean} Success status
 */
export async function markNotificationRead(notificationId) {
  try {
    if (!isOnline()) {
      console.warn('Cannot mark notification read while offline')
      return false
    }
    
    await api.patch(`/notifications/${notificationId}/read`)
    
    // Update cache
    await db.notifications.update(Number(notificationId), {
      read_at: new Date().toISOString()
    })
    
    return true
  } catch (error) {
    console.error('Error marking notification read:', error)
    return false
  }
}

// ========================================
// REFERENCE DATA
// ========================================

/**
 * Get vaccine master catalog
 * @param {boolean} forceCache - Force reading from cache
 * @returns {Array} List of vaccines
 */
export async function getVaccineMaster(forceCache = false) {
  try {
    // If online and not forcing cache, fetch from API
    if (isOnline() && !forceCache) {
      console.log('🌐 Fetching vaccine master from API')
      const response = await api.get('/vaccines')
      return response.data.data || response.data || []
    }
    
    // Offline or forced cache
    console.log('📴 Loading vaccine master from cache')
    return await db.vaccinemaster.toArray()
  } catch (error) {
    console.error('Error fetching vaccine master:', error)
    throw error
  }
}

// ========================================
// GUARDIAN DATA
// ========================================

/**
 * Get guardian details
 * @param {number} guardianId - Guardian ID
 * @param {boolean} forceCache - Force reading from cache
 * @returns {Object|null} Guardian record
 */
export async function getGuardianDetails(guardianId, forceCache = false) {
  try {
    // For guardians, always try cache first since it's saved with patient details
    const guardian = await db.guardians.get(Number(guardianId))
    
    if (guardian || !isOnline() || forceCache) {
      console.log(`📦 Loaded guardian ${guardianId} from cache`)
      return guardian
    }
    
    // If not in cache and online, it will be cached when patient details are fetched
    return null
  } catch (error) {
    console.error('Error fetching guardian details:', error)
    return null
  }
}

// ========================================
// CACHE MANAGEMENT
// ========================================

/**
 * Clear all offline cached data
 */
export async function clearCache() {
  try {
    const { clearOfflineData } = await import('./db-parent-portal')
    await clearOfflineData()
    console.log('✅ Offline cache cleared')
  } catch (error) {
    console.error('Error clearing cache:', error)
  }
}

/**
 * Get cache statistics for debugging
 */
export async function getCacheStats() {
  try {
    const { getDatabaseInfo } = await import('./db-parent-portal')
    return await getDatabaseInfo()
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return null
  }
}

export default {
  isOnline,
  getPatientDetails,
  getPatientList,
  getVaccinationHistory,
  getMedicalHistory,
  getVisitVitals,
  getVaccinationSchedule,
  getNotifications,
  markNotificationRead,
  getVaccineMaster,
  getGuardianDetails,
  clearCache,
  getCacheStats
}
