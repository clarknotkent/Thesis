/**
 * Composable for managing offline functionality
 * NEW ARCHITECTURE: Uses auto-caching system with offline utilities
 */

import { ref, onMounted, onUnmounted, computed } from 'vue';

export function useOffline() {
  const isOnline = ref(navigator.onLine);
  const manualOffline = ref(false);
  const lastSyncTime = ref(null);
  
  let unsubscribeOnlineStatus = null;

  /**
   * Initialize offline listeners
   */
  const init = () => {
    // Monitor online/offline status using native events
    const handleOnline = async () => {
      isOnline.value = true;
      console.log('🌐 Back online - checking for incomplete offline data...');
      
      // Check if we need to resume caching for guardians
      try {
        const userRole = localStorage.getItem('userRole')?.toLowerCase();
        if (userRole === 'guardian' || userRole === 'parent') {
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
          const guardianId = userInfo.id || userInfo.guardian_id || userInfo.userId || userInfo.user_id;
          
          if (guardianId) {
            // Check if we have incomplete cached data
            const cachedData = await db.guardians.get(guardianId);
            const patients = await db.patients.where('guardianId').equals(guardianId).toArray();
            
            // Check if any patients are missing full details (details should be comprehensive object)
            const incompletePatients = patients.filter(p => {
              // If details is just basic info (from /parent/children), it won't have guardian_contact_number
              return !p.details?.guardian_contact_number && !p.details?.address;
            });
            
            if (incompletePatients.length > 0 || !cachedData?.profile) {
              console.log(`📥 Resuming offline data caching for ${incompletePatients.length} incomplete patients...`);
              const { useOfflineGuardian } = await import('@/composables/useOfflineGuardian');
              const { fetchAndCacheData } = useOfflineGuardian();
              await fetchAndCacheData(guardianId);
            } else {
              console.log('✅ Offline data appears complete');
            }
          }
        }
      } catch (error) {
        console.warn('❌ Error checking for incomplete offline data:', error);
      }
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
    if (manualOffline.value) return 'Offline (Manual)';
    return isOnline.value ? 'Online' : 'Offline';
  });

  /**
   * Effective online status (considering manual offline mode)
   */
  const effectiveOnline = computed(() => {
    return !manualOffline.value && isOnline.value;
  });

  /**
   * Connection status color
   */
  const connectionStatusColor = computed(() => {
    return effectiveOnline.value ? 'success' : 'danger';
  });

  /**
   * Toggle manual offline mode
   */
  const toggleManualOffline = () => {
    manualOffline.value = !manualOffline.value;
    console.log(`Manual offline mode: ${manualOffline.value ? 'ENABLED' : 'DISABLED'}`);
  };

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
    manualOffline,
    effectiveOnline,
    lastSyncTime,
    connectionStatus,
    connectionStatusColor,

    // Actions
    clearOfflineData,
    getStorageStats,
    toggleManualOffline,
  };
}
