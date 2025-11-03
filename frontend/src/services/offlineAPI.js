/**
 * Offline-First API Wrapper
 * Wraps the axios API client with offline support using IndexedDB
 */

import api from './api';
import indexedDBService, { STORES } from './indexedDB';
import offlineSyncService from './offlineSync';

/**
 * Offline-aware API wrapper
 */
class OfflineAPI {
  constructor() {
    this.isOnline = navigator.onLine;
    
    // Subscribe to online/offline status
    offlineSyncService.onOnlineStatusChange((isOnline) => {
      this.isOnline = isOnline;
    });
  }

  /**
   * Generic GET request with offline fallback
   */
  async get(endpoint, config = {}) {
    // Try online first if available
    if (this.isOnline) {
      try {
        const response = await api.get(endpoint, config);
        
        // Cache the response in IndexedDB
        await this.cacheResponse(endpoint, response.data);
        
        return response;
      } catch (error) {
        console.warn(`Online request failed, falling back to cache: ${endpoint}`, error);
        // Fall through to offline mode
      }
    }

    // Offline mode: get from IndexedDB
    console.log(`📴 Offline mode: Loading from IndexedDB for ${endpoint}`);
    const cachedData = await this.getCachedData(endpoint);
    
    if (cachedData) {
      return { data: cachedData, cached: true, offline: true };
    }

    throw new Error('No cached data available and device is offline');
  }

  /**
   * Generic POST request with offline queue
   */
  async post(endpoint, data, config = {}) {
    if (this.isOnline) {
      try {
        const response = await api.post(endpoint, data, config);
        
        // Update local cache with new data
        await this.updateLocalCache(endpoint, response.data, 'create');
        
        return response;
      } catch (error) {
        console.warn(`Online request failed: ${endpoint}`, error);
        throw error;
      }
    } else {
      // Offline: queue the operation
      console.log(`📴 Offline mode: Queuing POST request for ${endpoint}`);
      await this.queueOperation('create', endpoint, data);
      
      // Optimistically update local cache
      await this.optimisticUpdate(endpoint, data, 'create');
      
      return { data, queued: true, offline: true };
    }
  }

  /**
   * Generic PUT request with offline queue
   */
  async put(endpoint, data, config = {}) {
    if (this.isOnline) {
      try {
        const response = await api.put(endpoint, data, config);
        
        // Update local cache
        await this.updateLocalCache(endpoint, response.data, 'update');
        
        return response;
      } catch (error) {
        console.warn(`Online request failed: ${endpoint}`, error);
        throw error;
      }
    } else {
      // Offline: queue the operation
      console.log(`📴 Offline mode: Queuing PUT request for ${endpoint}`);
      await this.queueOperation('update', endpoint, data);
      
      // Optimistically update local cache
      await this.optimisticUpdate(endpoint, data, 'update');
      
      return { data, queued: true, offline: true };
    }
  }

  /**
   * Generic DELETE request with offline queue
   */
  async delete(endpoint, config = {}) {
    if (this.isOnline) {
      try {
        const response = await api.delete(endpoint, config);
        
        // Remove from local cache
        await this.removeFromLocalCache(endpoint);
        
        return response;
      } catch (error) {
        console.warn(`Online request failed: ${endpoint}`, error);
        throw error;
      }
    } else {
      // Offline: queue the operation
      console.log(`📴 Offline mode: Queuing DELETE request for ${endpoint}`);
      await this.queueOperation('delete', endpoint, null);
      
      // Optimistically remove from cache
      await this.removeFromLocalCache(endpoint);
      
      return { queued: true, offline: true };
    }
  }

  /**
   * Cache API response in IndexedDB
   */
  async cacheResponse(endpoint, data) {
    const storeName = this.getStoreFromEndpoint(endpoint);
    
    if (!storeName) return;

    try {
      if (Array.isArray(data)) {
        await indexedDBService.putBulk(storeName, data);
      } else {
        await indexedDBService.put(storeName, data);
      }
    } catch (error) {
      console.error('Failed to cache response:', error);
    }
  }

  /**
   * Get cached data from IndexedDB
   */
  async getCachedData(endpoint) {
    const storeName = this.getStoreFromEndpoint(endpoint);
    
    if (!storeName) return null;

    try {
      // Check if endpoint requests a specific ID
      const id = this.extractIdFromEndpoint(endpoint);
      
      if (id) {
        return await indexedDBService.get(storeName, id);
      } else {
        return await indexedDBService.getAll(storeName);
      }
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Update local cache after successful operation
   */
  async updateLocalCache(endpoint, data, operation) {
    const storeName = this.getStoreFromEndpoint(endpoint);
    
    if (!storeName) return;

    try {
      if (operation === 'create' || operation === 'update') {
        await indexedDBService.put(storeName, data);
      }
    } catch (error) {
      console.error('Failed to update local cache:', error);
    }
  }

  /**
   * Optimistically update cache (for offline operations)
   */
  async optimisticUpdate(endpoint, data, operation) {
    const storeName = this.getStoreFromEndpoint(endpoint);
    
    if (!storeName) return;

    try {
      if (operation === 'create' || operation === 'update') {
        // Add temporary ID if creating
        if (operation === 'create' && !this.hasId(storeName, data)) {
          data._tempId = `temp_${Date.now()}_${Math.random()}`;
          data._pending = true;
          // Ensure record has a primary key to satisfy IndexedDB keyPath
          const idField = this.getIdField(storeName);
          if (idField) {
            data[idField] = data._tempId;
          }
        }
        
        await indexedDBService.put(storeName, data);
      }
    } catch (error) {
      console.error('Failed optimistic update:', error);
    }
  }

  /**
   * Remove from local cache
   */
  async removeFromLocalCache(endpoint) {
    const storeName = this.getStoreFromEndpoint(endpoint);
    const id = this.extractIdFromEndpoint(endpoint);
    
    if (!storeName || !id) return;

    try {
      await indexedDBService.delete(storeName, id);
    } catch (error) {
      console.error('Failed to remove from cache:', error);
    }
  }

  /**
   * Queue operation for later sync
   */
  async queueOperation(operation, endpoint, data) {
    const storeName = this.getStoreFromEndpoint(endpoint);
    
    if (!storeName) return;

    await indexedDBService.addToPendingSync(operation, storeName, data, endpoint);
    console.log(`✅ Operation queued for sync: ${operation} on ${storeName}`);
  }

  /**
   * Map endpoint to IndexedDB store name
   */
  getStoreFromEndpoint(endpoint) {
    // Remove leading slash and query parameters
    const path = endpoint.split('?')[0].replace(/^\//, '');
    // More specific routes first
    if (path.startsWith('vaccines/schedules')) return STORES.vaccineSchedules;
    if (path.startsWith('vaccines/transactions')) return STORES.vaccineTransactions;
    if (path.startsWith('receiving-reports')) return STORES.receivingReports;
    if (path.startsWith('activity-logs')) return STORES.activityLogs;
    if (path.startsWith('faqs')) return STORES.faqs;
    if (path.startsWith('reports')) return STORES.reports;
    if (path.startsWith('deworming')) return STORES.deworming;
    if (path.startsWith('vitamina')) return STORES.vitamina;
    if (path.startsWith('vitals')) return STORES.vitals;

    if (path.startsWith('patients')) return STORES.patients;
    if (path.startsWith('immunizations')) return STORES.immunizations;
    if (path.startsWith('vaccines')) return STORES.vaccines;
    if (path.startsWith('users')) return STORES.users;
    if (path.startsWith('health-staff')) return STORES.users; // Health workers stored in users
    if (path.startsWith('guardians')) return STORES.guardians;
    if (path.startsWith('schedules')) return STORES.schedules;
    if (path.startsWith('visits')) return STORES.visits;
    if (path.startsWith('inventory')) return STORES.inventory;
    if (path.startsWith('messages')) return STORES.messages;
    if (path.startsWith('conversations')) return STORES.conversations;
    if (path.startsWith('notifications')) return STORES.notifications;
    if (path.startsWith('activity')) return STORES.activityLogs;
    if (path.startsWith('sms')) return STORES.smsLogs;
    if (path.startsWith('profile')) return STORES.users; // Profile is user data
    
    return null;
  }

  /**
   * Extract ID from endpoint if present
   */
  extractIdFromEndpoint(endpoint) {
    // Match patterns like /patients/123 or /patients/123/something
    const match = endpoint.match(/\/(\d+)(?:\/|$)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Check if data has an ID field
   */
  hasId(storeName, data) {
    const idFields = {
      [STORES.patients]: 'patient_id',
      [STORES.immunizations]: 'immunization_id',
      [STORES.vaccines]: 'vaccine_id',
      [STORES.users]: 'user_id',
      [STORES.guardians]: 'guardian_id',
      [STORES.schedules]: 'schedule_id',
      [STORES.visits]: 'visit_id',
      [STORES.inventory]: 'inventory_id',
      [STORES.messages]: 'message_id',
      [STORES.notifications]: 'notification_id',
    };

    const idField = idFields[storeName];
    return data && data[idField];
  }

  /**
   * Get ID field name for a given store
   */
  getIdField(storeName) {
    const idFields = {
      [STORES.patients]: 'patient_id',
      [STORES.immunizations]: 'immunization_id',
      [STORES.vaccines]: 'vaccine_id',
      [STORES.users]: 'user_id',
      [STORES.guardians]: 'guardian_id',
      [STORES.schedules]: 'schedule_id',
      [STORES.visits]: 'visit_id',
      [STORES.inventory]: 'inventory_id',
      [STORES.messages]: 'message_id',
      [STORES.notifications]: 'notification_id',
    };
    return idFields[storeName] || null;
  }
}

// Create singleton instance
const offlineAPI = new OfflineAPI();

// Export offline-aware API methods
export default {
  get: (endpoint, config) => offlineAPI.get(endpoint, config),
  post: (endpoint, data, config) => offlineAPI.post(endpoint, data, config),
  put: (endpoint, data, config) => offlineAPI.put(endpoint, data, config),
  delete: (endpoint, config) => offlineAPI.delete(endpoint, config),
};

// Export offline API with same specialized endpoints as original API
export const notificationAPI = {
  create: (data) => offlineAPI.post('/notifications', data),
  getMyNotifications: (params = {}) => offlineAPI.get('/notifications', { params }),
  markAsRead: (id) => offlineAPI.put(`/notifications/${id}/read`),
  delete: (id) => offlineAPI.delete(`/notifications/${id}`),
  getPending: () => offlineAPI.get('/notifications/pending'),
  updateStatus: (id, status, errorMessage) => offlineAPI.put(`/notifications/${id}/status`, { status, error_message: errorMessage }),
};

export const conversationAPI = {
  getConversations: (params = {}) => offlineAPI.get('/conversations', { params }),
  create: (data) => offlineAPI.post('/conversations', data),
  startWithMessage: (data) => offlineAPI.post('/conversations/start', data),
  leave: (conversationId) => offlineAPI.post(`/conversations/${conversationId}/leave`),
};

export const messageAPI = {
  getMessages: (conversationId, params = {}) => offlineAPI.get(`/messages/${conversationId}`, { params }),
  send: (data) => offlineAPI.post('/messages', data),
  markAsRead: (messageId) => offlineAPI.post(`/messages/${messageId}/read`),
};
