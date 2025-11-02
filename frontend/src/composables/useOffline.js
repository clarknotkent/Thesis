/**
 * Composable for managing offline functionality
 * Provides reactive offline status and sync controls
 */

import { ref, onMounted, onUnmounted, computed } from 'vue';
import offlineSyncService from '@/services/offlineSync';
import indexedDBService from '@/services/indexedDB';

export function useOffline() {
  const isOnline = ref(navigator.onLine);
  const isSyncing = ref(false);
  const syncProgress = ref(null);
  const lastSyncTime = ref(null);
  const pendingSyncCount = ref(0);
  
  let unsubscribeOnlineStatus = null;
  let unsubscribeSync = null;

  /**
   * Initialize offline listeners
   */
  const init = () => {
    // Subscribe to online/offline status changes
    unsubscribeOnlineStatus = offlineSyncService.onOnlineStatusChange((online) => {
      isOnline.value = online;
      
      if (online) {
        // Auto-sync when coming back online
        syncData();
      }
    });

    // Subscribe to sync progress
    unsubscribeSync = offlineSyncService.onSync((event, data) => {
      switch (event) {
        case 'start':
          isSyncing.value = true;
          syncProgress.value = data.message;
          break;
        case 'pending':
          pendingSyncCount.value = data.count;
          break;
        case 'complete':
          isSyncing.value = false;
          syncProgress.value = data.message;
          updateLastSyncTime();
          updatePendingSyncCount();
          break;
        case 'error':
          isSyncing.value = false;
          syncProgress.value = `Error: ${data.message}`;
          console.error('Sync error:', data.error);
          break;
      }
    });

    // Load initial state
    updateLastSyncTime();
    updatePendingSyncCount();
  };

  /**
   * Manually trigger data sync
   */
  const syncData = async () => {
    try {
      await offlineSyncService.syncAll();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  /**
   * Update last sync timestamp
   */
  const updateLastSyncTime = async () => {
    try {
      const timestamp = await offlineSyncService.getLastSyncTime();
      lastSyncTime.value = timestamp;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
    }
  };

  /**
   * Update pending sync count
   */
  const updatePendingSyncCount = async () => {
    try {
      const pending = await indexedDBService.getPendingSync();
      pendingSyncCount.value = pending.length;
    } catch (error) {
      console.error('Failed to get pending sync count:', error);
    }
  };

  /**
   * Clear all offline data
   */
  const clearOfflineData = async () => {
    try {
      await offlineSyncService.clearAllData();
      pendingSyncCount.value = 0;
      lastSyncTime.value = null;
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  };

  /**
   * Get offline storage statistics
   */
  const getStorageStats = async () => {
    try {
      const stores = [
        'patients',
        'immunizations',
        'vaccines',
        'users',
        'guardians',
        'schedules',
        'visits',
        'inventory',
        'messages',
        'notifications',
      ];

      const stats = {};
      for (const store of stores) {
        const count = await indexedDBService.count(store);
        stats[store] = count;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {};
    }
  };

  /**
   * Format last sync time for display
   */
  const formattedLastSyncTime = computed(() => {
    if (!lastSyncTime.value) return 'Never';

    const syncDate = new Date(lastSyncTime.value);
    const now = new Date();
    const diffMs = now - syncDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return syncDate.toLocaleString();
  });

  /**
   * Connection status text
   */
  const connectionStatus = computed(() => {
    if (isOnline.value) {
      if (isSyncing.value) return 'Syncing...';
      if (pendingSyncCount.value > 0) return `Online (${pendingSyncCount.value} pending)`;
      return 'Online';
    } else {
      return pendingSyncCount.value > 0 
        ? `Offline (${pendingSyncCount.value} pending)` 
        : 'Offline';
    }
  });

  /**
   * Connection status color
   */
  const connectionStatusColor = computed(() => {
    if (isOnline.value) {
      if (isSyncing.value) return 'warning';
      if (pendingSyncCount.value > 0) return 'info';
      return 'success';
    }
    return 'danger';
  });

  // Lifecycle hooks
  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    if (unsubscribeOnlineStatus) unsubscribeOnlineStatus();
    if (unsubscribeSync) unsubscribeSync();
  });

  return {
    // State
    isOnline,
    isSyncing,
    syncProgress,
    lastSyncTime,
    pendingSyncCount,
    formattedLastSyncTime,
    connectionStatus,
    connectionStatusColor,

    // Actions
    syncData,
    clearOfflineData,
    getStorageStats,
    updatePendingSyncCount,
  };
}
