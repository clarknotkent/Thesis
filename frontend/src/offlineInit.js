/**
 * Initialize offline functionality
 * Call this from main.js to set up PWA offline features
 */

import indexedDBService from './services/indexedDB';
import offlineSyncService from './services/offlineSync';

/**
 * Initialize the offline system
 */
export async function initializeOffline() {
  try {
    console.log('🔄 Initializing offline functionality...');

    // Initialize IndexedDB
    await indexedDBService.init();
    console.log('✅ IndexedDB initialized');

    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    
    if (authToken && navigator.onLine) {
      // Initial sync if online and authenticated
      console.log('🌐 Online and authenticated, starting initial sync...');
      await offlineSyncService.syncAll();
      console.log('✅ Initial sync completed');
    } else if (!navigator.onLine) {
      console.log('📴 Offline mode - will sync when connection is restored');
    } else {
      console.log('ℹ️ Not authenticated - sync will start after login');
    }

    // Set up periodic sync (every 5 minutes when online)
    setInterval(async () => {
      if (navigator.onLine && localStorage.getItem('authToken')) {
        console.log('🔄 Periodic sync starting...');
        await offlineSyncService.syncAll();
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('✅ Offline functionality initialized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize offline functionality:', error);
    return false;
  }
}

/**
 * Sync data after login
 */
export async function syncAfterLogin() {
  if (navigator.onLine) {
    console.log('🔄 Syncing data after login...');
    await offlineSyncService.syncAll();
  }
}

/**
 * Clear offline data on logout
 */
export async function clearOfflineDataOnLogout() {
  try {
    console.log('🗑️ Clearing offline data on logout...');
    await offlineSyncService.clearAllData();
    console.log('✅ Offline data cleared');
  } catch (error) {
    console.error('❌ Failed to clear offline data:', error);
  }
}

export default {
  initializeOffline,
  syncAfterLogin,
  clearOfflineDataOnLogout,
};
