/**
 * Offline Sync Service
 * Handles synchronization between IndexedDB and Supabase API
 * Monitors online/offline status and syncs data accordingly
 */

import indexedDBService, { STORES } from './indexedDB';
import api from './api';

class OfflineSyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.syncListeners = [];
    this.onlineListeners = [];
    
    // Setup online/offline event listeners
    this.initNetworkListeners();
  }

  /**
   * Initialize network status listeners
   */
  initNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online! Starting sync...');
      this.isOnline = true;
      this.notifyOnlineStatusChange(true);
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Offline mode activated');
      this.isOnline = false;
      this.notifyOnlineStatusChange(false);
    });
  }

  /**
   * Check if currently online
   */
  checkOnlineStatus() {
    this.isOnline = navigator.onLine;
    return this.isOnline;
  }

  /**
   * Subscribe to online status changes
   */
  onOnlineStatusChange(callback) {
    this.onlineListeners.push(callback);
    // Immediately call with current status
    callback(this.isOnline);
    
    // Return unsubscribe function
    return () => {
      this.onlineListeners = this.onlineListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of online status change
   */
  notifyOnlineStatusChange(isOnline) {
    this.onlineListeners.forEach(callback => callback(isOnline));
  }

  /**
   * Subscribe to sync events
   */
  onSync(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify sync progress
   */
  notifySync(event, data) {
    this.syncListeners.forEach(callback => callback(event, data));
  }

  /**
   * Sync all data from API to IndexedDB
   */
  async syncAll() {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    this.notifySync('start', { message: 'Starting sync...' });

    try {
      // First, process pending operations (offline changes)
      await this.processPendingOperations();

      // Then fetch fresh data from API
      const syncOperations = [
        this.syncPatients(),
        this.syncVaccines(),
        this.syncImmunizations(),
        this.syncUsers(),
        this.syncGuardians(),
        this.syncSchedules(),
        this.syncVisits(),
        this.syncInventory(),
        this.syncMessages(),
        this.syncNotifications(),
      ];

      const results = await Promise.allSettled(syncOperations);
      
      // Log results
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Sync operation ${index} failed:`, result.reason);
        }
      });

      // Update last sync timestamp
      await indexedDBService.setMetadata('lastSyncTimestamp', new Date().toISOString());

      this.notifySync('complete', { message: 'Sync completed successfully' });
      console.log('✅ All data synced successfully');
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.notifySync('error', { message: 'Sync failed', error });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process pending operations from offline queue
   */
  async processPendingOperations() {
    const pendingOps = await indexedDBService.getPendingSync();
    
    if (pendingOps.length === 0) {
      console.log('No pending operations to sync');
      return;
    }

    console.log(`📤 Processing ${pendingOps.length} pending operations...`);
    this.notifySync('pending', { count: pendingOps.length });

    for (const op of pendingOps) {
      try {
        await this.executePendingOperation(op);
        await indexedDBService.removePendingSync(op.id);
        console.log(`✅ Synced pending operation:`, op);
      } catch (error) {
        console.error(`❌ Failed to sync operation:`, op, error);
        
        // Increment retry count
        op.retries = (op.retries || 0) + 1;
        
        // If too many retries, mark as failed
        if (op.retries >= 3) {
          console.error(`⚠️ Operation failed after 3 retries, removing:`, op);
          await indexedDBService.removePendingSync(op.id);
        } else {
          await indexedDBService.put(STORES.pendingSync, op);
        }
      }
    }
  }

  /**
   * Execute a pending operation
   */
  async executePendingOperation(op) {
    const { operation, storeName, data } = op;
    
    switch (operation) {
      case 'create':
        return this.createOnServer(storeName, data);
      case 'update':
        return this.updateOnServer(storeName, data);
      case 'delete':
        return this.deleteOnServer(storeName, data);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Create record on server based on store name
   */
  async createOnServer(storeName, data) {
    const endpoints = {
      [STORES.patients]: '/patients',
      [STORES.immunizations]: '/immunizations',
      [STORES.schedules]: '/schedules',
      [STORES.visits]: '/visits',
      [STORES.messages]: '/messages',
      [STORES.guardians]: '/guardians',
    };

    const endpoint = endpoints[storeName];
    if (!endpoint) throw new Error(`No endpoint for store: ${storeName}`);

    const response = await api.post(endpoint, data);
    return response.data;
  }

  /**
   * Update record on server
   */
  async updateOnServer(storeName, data) {
    const endpoints = {
      [STORES.patients]: (id) => `/patients/${id}`,
      [STORES.immunizations]: (id) => `/immunizations/${id}`,
      [STORES.schedules]: (id) => `/schedules/${id}`,
      [STORES.visits]: (id) => `/visits/${id}`,
      [STORES.guardians]: (id) => `/guardians/${id}`,
    };

    const endpointFn = endpoints[storeName];
    if (!endpointFn) throw new Error(`No endpoint for store: ${storeName}`);

    const id = this.getIdFromData(storeName, data);
    const response = await api.put(endpointFn(id), data);
    return response.data;
  }

  /**
   * Delete record on server
   */
  async deleteOnServer(storeName, data) {
    const endpoints = {
      [STORES.patients]: (id) => `/patients/${id}`,
      [STORES.immunizations]: (id) => `/immunizations/${id}`,
      [STORES.schedules]: (id) => `/schedules/${id}`,
      [STORES.visits]: (id) => `/visits/${id}`,
      [STORES.guardians]: (id) => `/guardians/${id}`,
    };

    const endpointFn = endpoints[storeName];
    if (!endpointFn) throw new Error(`No endpoint for store: ${storeName}`);

    const id = this.getIdFromData(storeName, data);
    const response = await api.delete(endpointFn(id));
    return response.data;
  }

  /**
   * Get ID field from data based on store name
   */
  getIdFromData(storeName, data) {
    const idFields = {
      [STORES.patients]: 'patient_id',
      [STORES.immunizations]: 'immunization_id',
      [STORES.schedules]: 'schedule_id',
      [STORES.visits]: 'visit_id',
      [STORES.vaccines]: 'vaccine_id',
      [STORES.guardians]: 'guardian_id',
      [STORES.users]: 'user_id',
    };

    return data[idFields[storeName]];
  }

  /**
   * Sync patients data
   */
  async syncPatients() {
    try {
      const response = await api.get('/patients');
      const patients = response.data;
      
      if (Array.isArray(patients) && patients.length > 0) {
        await indexedDBService.putBulk(STORES.patients, patients);
        console.log(`📥 Synced ${patients.length} patients`);
      }
    } catch (error) {
      console.error('Failed to sync patients:', error);
      throw error;
    }
  }

  /**
   * Sync vaccines data
   */
  async syncVaccines() {
    try {
      const response = await api.get('/vaccines');
      const vaccines = response.data;
      
      if (Array.isArray(vaccines) && vaccines.length > 0) {
        await indexedDBService.putBulk(STORES.vaccines, vaccines);
        console.log(`📥 Synced ${vaccines.length} vaccines`);
      }
    } catch (error) {
      console.error('Failed to sync vaccines:', error);
      throw error;
    }
  }

  /**
   * Sync immunizations data
   */
  async syncImmunizations() {
    try {
      const response = await api.get('/immunizations');
      const immunizations = response.data;
      
      if (Array.isArray(immunizations) && immunizations.length > 0) {
        await indexedDBService.putBulk(STORES.immunizations, immunizations);
        console.log(`📥 Synced ${immunizations.length} immunizations`);
      }
    } catch (error) {
      console.error('Failed to sync immunizations:', error);
      throw error;
    }
  }

  /**
   * Sync users data
   */
  async syncUsers() {
    try {
      const response = await api.get('/users');
      const users = response.data;
      
      if (Array.isArray(users) && users.length > 0) {
        await indexedDBService.putBulk(STORES.users, users);
        console.log(`📥 Synced ${users.length} users`);
      }
    } catch (error) {
      console.error('Failed to sync users:', error);
      throw error;
    }
  }

  /**
   * Sync guardians data
   */
  async syncGuardians() {
    try {
      const response = await api.get('/guardians');
      const guardians = response.data;
      
      if (Array.isArray(guardians) && guardians.length > 0) {
        await indexedDBService.putBulk(STORES.guardians, guardians);
        console.log(`📥 Synced ${guardians.length} guardians`);
      }
    } catch (error) {
      console.error('Failed to sync guardians:', error);
      throw error;
    }
  }

  /**
   * Sync schedules data
   */
  async syncSchedules() {
    try {
      const response = await api.get('/schedules');
      const schedules = response.data;
      
      if (Array.isArray(schedules) && schedules.length > 0) {
        await indexedDBService.putBulk(STORES.schedules, schedules);
        console.log(`📥 Synced ${schedules.length} schedules`);
      }
    } catch (error) {
      console.error('Failed to sync schedules:', error);
      throw error;
    }
  }

  /**
   * Sync visits data
   */
  async syncVisits() {
    try {
      const response = await api.get('/visits');
      const visits = response.data;
      
      if (Array.isArray(visits) && visits.length > 0) {
        await indexedDBService.putBulk(STORES.visits, visits);
        console.log(`📥 Synced ${visits.length} visits`);
      }
    } catch (error) {
      console.error('Failed to sync visits:', error);
      throw error;
    }
  }

  /**
   * Sync inventory data
   */
  async syncInventory() {
    try {
      const response = await api.get('/inventory');
      const inventory = response.data;
      
      if (Array.isArray(inventory) && inventory.length > 0) {
        await indexedDBService.putBulk(STORES.inventory, inventory);
        console.log(`📥 Synced ${inventory.length} inventory items`);
      }
    } catch (error) {
      console.error('Failed to sync inventory:', error);
      throw error;
    }
  }

  /**
   * Sync messages data
   */
  async syncMessages() {
    try {
      const response = await api.get('/messages');
      const messages = response.data;
      
      if (Array.isArray(messages) && messages.length > 0) {
        await indexedDBService.putBulk(STORES.messages, messages);
        console.log(`📥 Synced ${messages.length} messages`);
      }
    } catch (error) {
      console.error('Failed to sync messages:', error);
      throw error;
    }
  }

  /**
   * Sync notifications data
   */
  async syncNotifications() {
    try {
      const response = await api.get('/notifications');
      const notifications = response.data;
      
      if (Array.isArray(notifications) && notifications.length > 0) {
        await indexedDBService.putBulk(STORES.notifications, notifications);
        console.log(`📥 Synced ${notifications.length} notifications`);
      }
    } catch (error) {
      console.error('Failed to sync notifications:', error);
      throw error;
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime() {
    return await indexedDBService.getMetadata('lastSyncTimestamp');
  }

  /**
   * Clear all offline data
   */
  async clearAllData() {
    const stores = Object.values(STORES);
    for (const store of stores) {
      await indexedDBService.clear(store);
    }
    console.log('🗑️ All offline data cleared');
  }
}

// Export singleton instance
const offlineSyncService = new OfflineSyncService();
export default offlineSyncService;
