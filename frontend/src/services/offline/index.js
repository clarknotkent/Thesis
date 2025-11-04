/**
 * Initialize offline functionality
 * NEW ARCHITECTURE: Auto-caching API interceptor with offline utility functions
 * 
 * The offline system now works via:
 * 1. API interceptor automatically caches responses to IndexedDB
 * 2. Offline utilities provide seamless online/offline data access
 * 3. No manual prefetch needed - cache populates as users navigate
 */

import db from './db-parent-portal'

/**
 * Initialize the offline system
 */
export async function initializeOffline() {
  try {
    console.log('🔄 Initializing offline cache system...')

    // Database initializes automatically on first access
    // Just verify it's accessible
    await db.open()
    console.log('✅ ParentPortalOfflineDB ready')
    console.log('💡 Cache will auto-populate as you navigate (no manual sync needed)')

    return true
  } catch (error) {
    console.error('❌ Failed to initialize offline system:', error)
    return false
  }
}

/**
 * Called after login - inform user about auto-caching
 */
export async function syncAfterLogin(userRole = null) {
  if (userRole === 'Guardian' || userRole === 'Parent') {
    console.log('👪 Parent user logged in')
    console.log('💾 Cache will auto-populate as you navigate')
    console.log('💡 Visit child details pages while online to cache data for offline use')
  }
}

/**
 * Clear offline data on logout
 */
export async function clearOfflineDataOnLogout() {
  try {
    console.log('🗑️ Clearing offline cache on logout...')
    
    const { clearCache } = await import('./offlineUtils')
    await clearCache()
    
    console.log('✅ Offline cache cleared')
  } catch (error) {
    console.error('❌ Failed to clear offline cache:', error)
  }
}

export default {
  initializeOffline,
  syncAfterLogin,
  clearOfflineDataOnLogout,
}
