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
        // this.syncSchedules(), // TODO: Endpoint doesn't exist yet
        this.syncVisits(),
        // this.syncInventory(), // TODO: Endpoint doesn't exist yet
        // this.syncMessages(), // TODO: Endpoint doesn't exist yet
        this.syncNotifications(),
        this.syncHealthStaff(), // Health worker accounts
        this.syncConversations(),
        this.syncDeworming(),
        this.syncVitamina(),
        // this.syncVitals(), // TODO: Endpoint doesn't exist yet
        this.syncFAQs(),
        // this.syncReports(), // TODO: Endpoint doesn't exist yet
        this.syncReceivingReports(),
        this.syncActivityLogs(),
        this.syncSMSLogs(),
        this.syncVaccineSchedules(),
        this.syncVaccineTransactions(),
        this.syncSMSTemplates(),
        // this.syncSettings(), // TODO: Endpoint doesn't exist yet
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
        // Simple exponential backoff before retrying next rounds
        const backoffMs = Math.min(30000, 1000 * Math.pow(2, Math.min(5, op.retries - 1)));
        try {
          await new Promise((res) => setTimeout(res, backoffMs));
        } catch (_) {}
        
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
    const { operation, storeName, data, endpoint } = op;
    
    // Check if delete operation - only admins can delete
    if (operation === 'delete') {
      const userRole = localStorage.getItem('userRole');
      if (userRole !== 'admin') {
        console.warn('⚠️ Delete operation blocked: User is not admin');
        throw new Error('Only administrators can delete records');
      }
    }
    
    switch (operation) {
      case 'create':
        {
          // If original endpoint is available, prefer replaying exact route
          const serverData = endpoint
            ? (await api.post(endpoint, data)).data
            : await this.createOnServer(storeName, data);
          // Reconcile temp ID with server ID if needed
          try {
            const idField = this.getIdFieldForStore(storeName);
            const tempId = data?._tempId || (idField ? data?.[idField] : null);
            const serverId = idField ? (serverData?.[idField] || serverData?.id) : (serverData?.id || null);
            if (idField && tempId && serverId && tempId !== serverId) {
              await indexedDBService.reconcileTempId(storeName, idField, tempId, serverId, serverData);
            }
          } catch (e) {
            console.warn('Reconcile temp ID failed:', e);
          }
          return serverData;
        }
      case 'update':
        if (endpoint) {
          return (await api.put(endpoint, data)).data;
        }
        return this.updateOnServer(storeName, data);
      case 'delete':
        if (endpoint) {
          return (await api.delete(endpoint)).data;
        }
        return this.deleteOnServer(storeName, data);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Get ID field from store name
   */
  getIdFieldForStore(storeName) {
    const idFields = {
      [STORES.patients]: 'patient_id',
      [STORES.immunizations]: 'immunization_id',
      [STORES.schedules]: 'schedule_id',
      [STORES.visits]: 'visit_id',
      [STORES.vaccines]: 'vaccine_id',
      [STORES.guardians]: 'guardian_id',
      [STORES.users]: 'user_id',
      [STORES.messages]: 'message_id',
      [STORES.notifications]: 'notification_id',
    };
    return idFields[storeName] || null;
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
   * Sync health staff data (health worker accounts)
   */
  async syncHealthStaff() {
    try {
      const response = await api.get('/health-staff');
      const healthStaff = response.data;
      
      if (Array.isArray(healthStaff) && healthStaff.length > 0) {
        // Store in users table with health worker role
        await indexedDBService.putBulk(STORES.users, healthStaff);
        console.log(`📥 Synced ${healthStaff.length} health staff`);
      }
    } catch (error) {
      console.error('Failed to sync health staff:', error);
      throw error;
    }
  }

  /**
   * Sync conversations data
   */
  async syncConversations() {
    try {
      const response = await api.get('/conversations');
      const conversations = response.data;
      
      if (Array.isArray(conversations) && conversations.length > 0) {
        await indexedDBService.putBulk(STORES.conversations, conversations);
        console.log(`📥 Synced ${conversations.length} conversations`);
      }
    } catch (error) {
      console.error('Failed to sync conversations:', error);
      throw error;
    }
  }

  /**
   * Sync deworming data
   */
  async syncDeworming() {
    try {
      const response = await api.get('/deworming');
      const deworming = response.data;
      
      if (Array.isArray(deworming) && deworming.length > 0) {
        await indexedDBService.putBulk(STORES.deworming, deworming);
        console.log(`📥 Synced ${deworming.length} deworming records`);
      }
    } catch (error) {
      console.error('Failed to sync deworming:', error);
      throw error;
    }
  }

  /**
   * Sync vitamin A data
   */
  async syncVitamina() {
    try {
      const response = await api.get('/vitamina');
      const vitamina = response.data;
      
      if (Array.isArray(vitamina) && vitamina.length > 0) {
        await indexedDBService.putBulk(STORES.vitamina, vitamina);
        console.log(`📥 Synced ${vitamina.length} vitamin A records`);
      }
    } catch (error) {
      console.error('Failed to sync vitamin A:', error);
      throw error;
    }
  }

  /**
   * Sync vitals data
   */
  async syncVitals() {
    try {
      const response = await api.get('/vitals');
      const vitals = response.data;
      
      if (Array.isArray(vitals) && vitals.length > 0) {
        await indexedDBService.putBulk(STORES.vitals, vitals);
        console.log(`📥 Synced ${vitals.length} vitals records`);
      }
    } catch (error) {
      console.error('Failed to sync vitals:', error);
      throw error;
    }
  }

  /**
   * Sync FAQs data
   */
  async syncFAQs() {
    try {
      const response = await api.get('/faqs');
      const faqs = response.data;
      
      if (Array.isArray(faqs) && faqs.length > 0) {
        await indexedDBService.putBulk(STORES.faqs, faqs);
        console.log(`📥 Synced ${faqs.length} FAQs`);
      }
    } catch (error) {
      console.error('Failed to sync FAQs:', error);
      throw error;
    }
  }

  /**
   * Sync reports data
   */
  async syncReports() {
    try {
      const response = await api.get('/reports');
      const reports = response.data;
      
      if (Array.isArray(reports) && reports.length > 0) {
        await indexedDBService.putBulk(STORES.reports, reports);
        console.log(`📥 Synced ${reports.length} reports`);
      }
    } catch (error) {
      console.error('Failed to sync reports:', error);
      throw error;
    }
  }

  /**
   * Sync receiving reports data
   */
  async syncReceivingReports() {
    try {
      const response = await api.get('/receiving-reports');
      const receivingReports = response.data;
      
      if (Array.isArray(receivingReports) && receivingReports.length > 0) {
        await indexedDBService.putBulk(STORES.receivingReports, receivingReports);
        console.log(`📥 Synced ${receivingReports.length} receiving reports`);
      }
    } catch (error) {
      console.error('Failed to sync receiving reports:', error);
      throw error;
    }
  }

  /**
   * Sync activity logs data
   */
  async syncActivityLogs() {
    try {
      const response = await api.get('/activity-logs');
      const activityLogs = response.data;
      
      if (Array.isArray(activityLogs) && activityLogs.length > 0) {
        await indexedDBService.putBulk(STORES.activityLogs, activityLogs);
        console.log(`📥 Synced ${activityLogs.length} activity logs`);
      }
    } catch (error) {
      console.error('Failed to sync activity logs:', error);
      throw error;
    }
  }

  /**
   * Sync SMS logs data
   */
  async syncSMSLogs() {
    try {
      const response = await api.get('/sms/history');
      const smsLogs = response.data;
      
      if (Array.isArray(smsLogs) && smsLogs.length > 0) {
        await indexedDBService.putBulk(STORES.smsLogs, smsLogs);
        console.log(`📥 Synced ${smsLogs.length} SMS logs`);
      }
    } catch (error) {
      console.error('Failed to sync SMS logs:', error);
      throw error;
    }
  }

  /**
   * Sync vaccine schedules data
   */
  async syncVaccineSchedules() {
    try {
      const response = await api.get('/vaccines/schedules');
      const schedules = response.data;
      
      if (Array.isArray(schedules) && schedules.length > 0) {
        await indexedDBService.putBulk(STORES.vaccineSchedules, schedules);
        console.log(`📥 Synced ${schedules.length} vaccine schedules`);
      }
    } catch (error) {
      console.error('Failed to sync vaccine schedules:', error);
      throw error;
    }
  }

  /**
   * Sync vaccine transactions data
   */
  async syncVaccineTransactions() {
    try {
      const response = await api.get('/vaccines/transactions');
      const transactions = response.data;
      
      if (Array.isArray(transactions) && transactions.length > 0) {
        await indexedDBService.putBulk(STORES.vaccineTransactions, transactions);
        console.log(`📥 Synced ${transactions.length} vaccine transactions`);
      }
    } catch (error) {
      console.error('Failed to sync vaccine transactions:', error);
      throw error;
    }
  }

  /**
   * Sync SMS templates data
   */
  async syncSMSTemplates() {
    try {
      const response = await api.get('/sms/templates');
      const templates = response.data;
      
      if (Array.isArray(templates) && templates.length > 0) {
        await indexedDBService.putBulk(STORES.smsTemplates, templates);
        console.log(`📥 Synced ${templates.length} SMS templates`);
      }
    } catch (error) {
      console.error('Failed to sync SMS templates:', error);
      throw error;
    }
  }

  /**
   * Sync settings data
   */
  async syncSettings() {
    try {
      const response = await api.get('/settings');
      const settings = response.data;
      
      if (settings && typeof settings === 'object') {
        // Settings might be an object, convert to array of key-value pairs
        const settingsArray = Object.entries(settings).map(([key, value]) => ({
          setting_key: key,
          setting_value: value
        }));
        
        await indexedDBService.putBulk(STORES.settings, settingsArray);
        console.log(`📥 Synced ${settingsArray.length} settings`);
      }
    } catch (error) {
      console.error('Failed to sync settings:', error);
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
