/**
 * IndexedDB Service for Offline Data Persistence
 * Stores all Supabase data locally for offline access
 */

const DB_NAME = 'ImmunizeMeDB';
const DB_VERSION = 1;

// Define all object stores (tables)
const STORES = {
  patients: 'patients',
  immunizations: 'immunizations',
  vaccines: 'vaccines',
  users: 'users',
  guardians: 'guardians',
  schedules: 'schedules',
  visits: 'visits',
  inventory: 'inventory',
  messages: 'messages',
  notifications: 'notifications',
  activityLogs: 'activityLogs',
  smsLogs: 'smsLogs',
  pendingSync: 'pendingSync', // Queue for offline operations
  metadata: 'metadata', // Store sync timestamps
};

class IndexedDBService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the IndexedDB database
   */
  async init() {
    if (this.isInitialized) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores for all data types
        // Patients store
        if (!db.objectStoreNames.contains(STORES.patients)) {
          const patientsStore = db.createObjectStore(STORES.patients, { keyPath: 'patient_id' });
          patientsStore.createIndex('guardian_id', 'guardian_id', { unique: false });
          patientsStore.createIndex('last_name', 'last_name', { unique: false });
        }

        // Immunizations store
        if (!db.objectStoreNames.contains(STORES.immunizations)) {
          const immunizationsStore = db.createObjectStore(STORES.immunizations, { keyPath: 'immunization_id' });
          immunizationsStore.createIndex('patient_id', 'patient_id', { unique: false });
          immunizationsStore.createIndex('vaccine_id', 'vaccine_id', { unique: false });
        }

        // Vaccines store
        if (!db.objectStoreNames.contains(STORES.vaccines)) {
          const vaccinesStore = db.createObjectStore(STORES.vaccines, { keyPath: 'vaccine_id' });
          vaccinesStore.createIndex('vaccine_name', 'vaccine_name', { unique: false });
        }

        // Users store
        if (!db.objectStoreNames.contains(STORES.users)) {
          const usersStore = db.createObjectStore(STORES.users, { keyPath: 'user_id' });
          usersStore.createIndex('email', 'email', { unique: true });
          usersStore.createIndex('role', 'role', { unique: false });
        }

        // Guardians store
        if (!db.objectStoreNames.contains(STORES.guardians)) {
          const guardiansStore = db.createObjectStore(STORES.guardians, { keyPath: 'guardian_id' });
          guardiansStore.createIndex('user_id', 'user_id', { unique: false });
        }

        // Schedules store
        if (!db.objectStoreNames.contains(STORES.schedules)) {
          const schedulesStore = db.createObjectStore(STORES.schedules, { keyPath: 'schedule_id' });
          schedulesStore.createIndex('patient_id', 'patient_id', { unique: false });
          schedulesStore.createIndex('scheduled_date', 'scheduled_date', { unique: false });
        }

        // Visits store
        if (!db.objectStoreNames.contains(STORES.visits)) {
          const visitsStore = db.createObjectStore(STORES.visits, { keyPath: 'visit_id' });
          visitsStore.createIndex('patient_id', 'patient_id', { unique: false });
          visitsStore.createIndex('visit_date', 'visit_date', { unique: false });
        }

        // Inventory store
        if (!db.objectStoreNames.contains(STORES.inventory)) {
          const inventoryStore = db.createObjectStore(STORES.inventory, { keyPath: 'inventory_id' });
          inventoryStore.createIndex('vaccine_id', 'vaccine_id', { unique: false });
        }

        // Messages store
        if (!db.objectStoreNames.contains(STORES.messages)) {
          const messagesStore = db.createObjectStore(STORES.messages, { keyPath: 'message_id' });
          messagesStore.createIndex('conversation_id', 'conversation_id', { unique: false });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Notifications store
        if (!db.objectStoreNames.contains(STORES.notifications)) {
          const notificationsStore = db.createObjectStore(STORES.notifications, { keyPath: 'notification_id' });
          notificationsStore.createIndex('user_id', 'user_id', { unique: false });
          notificationsStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Activity Logs store
        if (!db.objectStoreNames.contains(STORES.activityLogs)) {
          const activityLogsStore = db.createObjectStore(STORES.activityLogs, { keyPath: 'activity_id' });
          activityLogsStore.createIndex('user_id', 'user_id', { unique: false });
          activityLogsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // SMS Logs store
        if (!db.objectStoreNames.contains(STORES.smsLogs)) {
          const smsLogsStore = db.createObjectStore(STORES.smsLogs, { keyPath: 'log_id' });
          smsLogsStore.createIndex('sent_at', 'sent_at', { unique: false });
        }

        // Pending Sync Queue (for offline operations)
        if (!db.objectStoreNames.contains(STORES.pendingSync)) {
          const pendingSyncStore = db.createObjectStore(STORES.pendingSync, { keyPath: 'id', autoIncrement: true });
          pendingSyncStore.createIndex('timestamp', 'timestamp', { unique: false });
          pendingSyncStore.createIndex('operation', 'operation', { unique: false });
        }

        // Metadata store (for sync timestamps)
        if (!db.objectStoreNames.contains(STORES.metadata)) {
          db.createObjectStore(STORES.metadata, { keyPath: 'key' });
        }

        console.log('IndexedDB object stores created');
      };
    });
  }

  /**
   * Generic method to add/update data in a store
   */
  async put(storeName, data) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Bulk insert/update data
   */
  async putBulk(storeName, dataArray) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let successCount = 0;
      const errors = [];

      dataArray.forEach((data, index) => {
        const request = store.put(data);
        request.onsuccess = () => successCount++;
        request.onerror = () => errors.push({ index, error: request.error });
      });

      transaction.oncomplete = () => {
        if (errors.length > 0) {
          console.warn(`Bulk put completed with ${errors.length} errors:`, errors);
        }
        resolve({ successCount, errors });
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get a single record by key
   */
  async get(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records from a store
   */
  async getAll(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get records by index
   */
  async getByIndex(storeName, indexName, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a record by key
   */
  async delete(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add operation to pending sync queue
   */
  async addToPendingSync(operation, storeName, data) {
    const syncItem = {
      operation, // 'create', 'update', 'delete'
      storeName,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    };
    return this.put(STORES.pendingSync, syncItem);
  }

  /**
   * Get all pending sync operations
   */
  async getPendingSync() {
    return this.getAll(STORES.pendingSync);
  }

  /**
   * Remove operation from pending sync queue
   */
  async removePendingSync(id) {
    return this.delete(STORES.pendingSync, id);
  }

  /**
   * Set metadata (e.g., last sync timestamp)
   */
  async setMetadata(key, value) {
    return this.put(STORES.metadata, { key, value, timestamp: new Date().toISOString() });
  }

  /**
   * Get metadata
   */
  async getMetadata(key) {
    const result = await this.get(STORES.metadata, key);
    return result ? result.value : null;
  }

  /**
   * Check if data exists in store
   */
  async exists(storeName, key) {
    const data = await this.get(storeName, key);
    return data !== undefined;
  }

  /**
   * Search records with a custom filter function
   */
  async filter(storeName, filterFn) {
    const allData = await this.getAll(storeName);
    return allData.filter(filterFn);
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
const indexedDBService = new IndexedDBService();
export default indexedDBService;

// Export store names for convenience
export { STORES };
