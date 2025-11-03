/**
 * Initialize offline functionality
 * Call this from main.js to set up PWA offline features
 * 
 * OFFLINE-FIRST ARCHITECTURE:
 * Uses Dexie.js for local database and syncService for background sync
 */

import db from './db'
import syncService from './syncService'

/**
 * Initialize the offline system
 */
export async function initializeOffline() {
  try {
    console.log('🔄 Initializing offline-first functionality...')

    // Dexie is automatically initialized when imported
    // Verify database is accessible
    await db.open()
    console.log('✅ Dexie database initialized')

    // Initialize and start the sync service
    await syncService.initialize()
    console.log('✅ Sync service initialized')

    console.log('✅ Offline-first functionality initialized successfully')
    
    return true
  } catch (error) {
    console.error('❌ Failed to initialize offline functionality:', error)
    return false
  }
}

/**
 * Sync data after login
 * Triggers appropriate sync based on user role
 */
export async function syncAfterLogin(userRole = null) {
  if (navigator.onLine) {
    console.log('🔄 Syncing data after login...')
    
    // For Guardian/Parent role, download read-only data
    if (userRole === 'Guardian' || userRole === 'Parent') {
      console.log('👪 User is Parent/Guardian - downloading parent data')
      await syncService.downloadParentData()
    } else {
      // For Health Worker and Admin, trigger regular sync (upload pending changes)
      await syncService.triggerSync()
    }
  }
}

/**
 * Clear offline data on logout
 * Clears all cached data based on user role
 */
export async function clearOfflineDataOnLogout() {
  try {
    console.log('🗑️ Clearing offline data on logout...')
    
    // Clear all Dexie tables
    await db.patients.clear()
    await db.immunizations.clear()
    await db.pending_uploads.clear()
    
    // Clear parent/guardian tables
    await db.children.clear()
    await db.schedules.clear()
    await db.notifications.clear()
    await db.guardian_profile.clear()
    
    console.log('✅ Offline data cleared')
  } catch (error) {
    console.error('❌ Failed to clear offline data:', error)
  }
}

export default {
  initializeOffline,
  syncAfterLogin,
  clearOfflineDataOnLogout,
}
