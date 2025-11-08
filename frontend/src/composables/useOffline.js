/**
 * Composable for managing offline functionality
 * NEW ARCHITECTURE: Uses auto-caching system with offline utilities
 */

import { ref, onMounted, onUnmounted, computed } from 'vue';

export function useOffline() {
  const isOnline = ref(navigator.onLine);
  const lastSyncTime = ref(null);
  
  let unsubscribeOnlineStatus = null;

  /**
   * Initialize offline listeners
   */
  const init = () => {
    // Monitor online/offline status using native events
    const handleOnline = () => {
      isOnline.value = true;
      console.log('🌐 Back online - cache will auto-update as you navigate');
    };
    
    const handleOffline = () => {
      isOnline.value = false;
      console.log('📴 Offline - using cached data');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Store cleanup functions
    unsubscribeOnlineStatus = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  /**
   * Clear all offline data
   */
  const clearOfflineData = async () => {
    console.warn('Parent offline functionality removed - only staff offline data remains');
    return Promise.resolve();
  };

  /**
   * Get offline storage statistics
   */
  const getStorageStats = async () => {
    console.warn('Parent offline functionality removed');
    return {};
  };

  /**
   * Connection status text
   */
  const connectionStatus = computed(() => {
    return isOnline.value ? 'Online' : 'Offline';
  });

  /**
   * Connection status color
   */
  const connectionStatusColor = computed(() => {
    return isOnline.value ? 'success' : 'danger';
  });

  // Lifecycle hooks
  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    if (unsubscribeOnlineStatus) unsubscribeOnlineStatus();
  });

  return {
    // State
    isOnline,
    lastSyncTime,
    connectionStatus,
    connectionStatusColor,

    // Actions
    clearOfflineData,
    getStorageStats,
  };
}
