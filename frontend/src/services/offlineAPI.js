/**
 * Offline-First API Wrapper
 * Wraps the axios API client with offline support using IndexedDB
 */

import api from './api';
import indexedDBService, { STORES } from './indexedDB';
import offlineSyncService from './offlineSync';
import { getUser, getUserId } from './auth';

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
      // Many backend responses are wrapped: { success, data, meta } or { items, total }
      const payload = this.unwrapPayload(data);

      if (Array.isArray(payload)) {
        const normalized = payload.map((rec) => this.normalizeRecordForStore(storeName, rec));
        await indexedDBService.putBulk(storeName, normalized);
      } else if (payload && typeof payload === 'object') {
        const normalized = this.normalizeRecordForStore(storeName, payload);
        await indexedDBService.put(storeName, normalized);
      } // else nothing to cache
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
      const full = String(endpoint || '');
      // Special-case: parent schedule by child id -> query schedules by patient_id index
      const pathOnly = full.split('?')[0].replace(/^\//, '');
      if (/^parent\/children\/[^/]+\/schedule/.test(pathOnly)) {
        const segments = pathOnly.split('/').filter(Boolean);
        const patientId = segments[2];
        if (patientId) {
          return await indexedDBService.getByIndex(STORES.schedules, 'patient_id', patientId);
        }
      }

      // Special-case: parent child details -> get patient by id
      if (/^parent\/children\/[^/]+$/.test(pathOnly)) {
        const segments = pathOnly.split('/').filter(Boolean);
        const patientId = segments[2];
        if (patientId) {
          return await indexedDBService.get(STORES.patients, patientId);
        }
      }

      // Special-case: parent children list -> filter by guardian_id when possible
      if (pathOnly === 'parent/children') {
        const all = await indexedDBService.getAll(STORES.patients);
        // Attempt to derive guardian_id from user or guardians store
        let guardianId = null;
        const u = getUser?.();
        guardianId = u?.guardian_id || u?.guardian?.guardian_id || null;
        if (!guardianId) {
          const uid = getUserId?.();
          if (uid) {
            try {
              const guardians = await indexedDBService.getByIndex(STORES.guardians, 'user_id', uid);
              if (Array.isArray(guardians) && guardians.length > 0) {
                guardianId = guardians[0]?.guardian_id || null;
              }
            } catch (_) {}
          }
        }
        if (guardianId) {
          return all.filter(p => String(p.guardian_id) === String(guardianId));
        }
        return all; // fallback: return whatever is cached
      }

      // Special-case: visits filtered by patient_id query -> use index
      if (pathOnly.startsWith('visits') && full.includes('patient_id=')) {
        const m = full.match(/[?&]patient_id=([^&]+)/);
        const patientId = m ? decodeURIComponent(m[1]) : null;
        if (patientId) {
          return await indexedDBService.getByIndex(STORES.visits, 'patient_id', patientId);
        }
      }

      // Check if endpoint requests a specific ID
      const id = this.extractIdFromEndpoint(endpoint);
      
      if (id) {
        const direct = await indexedDBService.get(storeName, id);
        if (direct !== undefined && direct !== null) return direct;
        // If keyPath was stored as a number but id is a numeric string (or vice versa), try the other type
        if (/^\d+$/.test(String(id))) {
          const numId = Number(id);
          const alt = await indexedDBService.get(storeName, numId);
          if (alt !== undefined && alt !== null) return alt;
          // Also try the string form if first attempt used number
          const strId = String(id);
          const alt2 = await indexedDBService.get(storeName, strId);
          if (alt2 !== undefined && alt2 !== null) return alt2;
        }
        // Last-chance fallback: scan cached patients for matching patient_id
        if (storeName === STORES.patients) {
          const allPatients = await indexedDBService.getAll(STORES.patients);
          const match = allPatients.find(p => String(p.patient_id) === String(id));
          if (match) return match;
        }
        return null;
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
        const payload = this.unwrapPayload(data);
        if (Array.isArray(payload)) {
          const normalized = payload.map((rec) => this.normalizeRecordForStore(storeName, rec));
          await indexedDBService.putBulk(storeName, normalized);
        } else if (payload && typeof payload === 'object') {
          const normalized = this.normalizeRecordForStore(storeName, payload);
          await indexedDBService.put(storeName, normalized);
        }
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
    // Parent-facing endpoints
    if (path === 'parent/children') return STORES.patients; // children list maps to patients store
    if (/^parent\/children\/[^/]+\/schedule/.test(path)) return STORES.schedules; // child schedule maps to schedules store
    if (/^parent\/children\/[^/]+$/.test(path)) return STORES.patients; // child details maps to patients store

    if (path.startsWith('sms/templates')) return STORES.smsTemplates;
    if (path.startsWith('sms/history')) return STORES.smsLogs;
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
    // Extract second path segment only if it looks like an ID
    const path = (endpoint || '').split('?')[0].replace(/^\//, '');
    const segments = path.split('/').filter(Boolean);
    if (segments.length < 2) return null;
    const candidate = segments[1];
    // Accept numeric IDs, UUID-like, or long alphanumerics (>=8)
    const isNumeric = /^\d+$/.test(candidate);
    const isUUIDish = /^[0-9a-fA-F-]{8,}$/.test(candidate);
    const isAlphaNumLong = /^[A-Za-z0-9_:-]{8,}$/.test(candidate);
    return (isNumeric || isUUIDish || isAlphaNumLong) ? candidate : null;
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
      [STORES.activityLogs]: 'activity_id',
      [STORES.smsLogs]: 'log_id',
      [STORES.conversations]: 'conversation_id',
      [STORES.deworming]: 'deworming_id',
      [STORES.vitamina]: 'vitamina_id',
      [STORES.vitals]: 'vitals_id',
      [STORES.faqs]: 'faq_id',
      [STORES.reports]: 'report_id',
      [STORES.receivingReports]: 'receiving_report_id',
      [STORES.vaccineSchedules]: 'schedule_id',
      [STORES.vaccineTransactions]: 'transaction_id',
      [STORES.smsTemplates]: 'template_id',
      [STORES.settings]: 'setting_key',
    };
    return idFields[storeName] || null;
  }

  /**
   * Unwrap common API envelope shapes to the actual payload
   * Supports: { success, data }, { data }, { items }, plain array/object
   */
  unwrapPayload(data) {
    if (data == null) return data;
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') {
      if (Array.isArray(data.data)) return data.data;
      if (data.data && typeof data.data === 'object') return data.data;
      if (Array.isArray(data.items)) return data.items;
      if (data.rows && Array.isArray(data.rows)) return data.rows;
    }
    return data;
  }

  /**
   * Ensure the record has the correct keyPath field for the target store.
   * If the expected id field is missing, try common aliases; as a last resort, synthesize a stable key.
   */
  normalizeRecordForStore(storeName, record) {
    if (!record || typeof record !== 'object') return record;
    const idField = this.getIdField(storeName);
    if (!idField) return record;

    // Already has correct id
    if (record[idField]) return record;

    const aliases = [
      'id', 'ID', 'uuid', 'UID', 'guid', 'pk',
      // camelCase variants
      this.camelFromSnake(idField),
    ].filter(Boolean);

    for (const key of aliases) {
      if (record[key]) {
        return { ...record, [idField]: record[key] };
      }
    }

    // If backend sometimes returns `{ <entity>_id }` without matching store id (e.g., schedule_id for both tables), also try stripping prefixes
    const alt = this.findIdLikeField(record);
    if (alt) {
      return { ...record, [idField]: record[alt] };
    }

    // Last resort: synthesize a deterministic key from JSON string hash to avoid put() failure
    const synthetic = this.stableHash(record);
    return { ...record, [idField]: `tmp_${synthetic}` };
  }

  camelFromSnake(s) {
    if (!s || typeof s !== 'string') return null;
    return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  }

  findIdLikeField(obj) {
    const keys = Object.keys(obj || {});
    // Prefer fields that end with _id
    const idLike = keys.find(k => /_id$/i.test(k) && obj[k]);
    if (idLike) return idLike;
    // Next prefer conversation_id, message_id, etc.
    const common = ['conversation_id','message_id','notification_id','patient_id','user_id','guardian_id','schedule_id','visit_id'];
    for (const k of common) {
      if (obj[k]) return k;
    }
    return null;
  }

  stableHash(obj) {
    try {
      const str = JSON.stringify(obj);
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
      }
      return Math.abs(h).toString(36);
    } catch {
      return Math.random().toString(36).slice(2);
    }
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
