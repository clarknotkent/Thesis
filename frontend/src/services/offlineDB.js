import Dexie from 'dexie'

// Define the database schema for offline storage
export class HealthcareDB extends Dexie {
  constructor() {
    super('HealthcareDB')
    
    this.version(1).stores({
      // Patient data
      patients: '++id, patient_id, name, email, phone, date_of_birth, gender, address, guardian_id, created_at, updated_at, synced',
      
  // Appointments/Visits (recorded_by maps to health_staff user id)
  appointments: '++id, appointment_id, patient_id, health_worker_id, appointment_date, status, notes, created_at, updated_at, synced',
      
  // Immunization records (recorded_by maps to health_staff user id)
  immunizations: '++id, immunization_id, patient_id, vaccine_id, date_administered, health_worker_id, notes, created_at, updated_at, synced',
      
      // Vaccine information
      vaccines: '++id, vaccine_id, vaccine_name, description, age_range, dosage_info, created_at, updated_at, synced',
      
      // Health workers
      healthWorkers: '++id, worker_id, name, email, phone, position, created_at, updated_at, synced',
      
      // Guardians
      guardians: '++id, guardian_id, name, email, phone, relationship, created_at, updated_at, synced',
      
      // Offline actions queue (for background sync)
      offlineActions: '++id, action_type, table_name, data, timestamp, retries, synced',
      
      // App settings and sync metadata
      appSettings: 'key, value, updated_at',
      
      // Cached API responses
      apiCache: 'endpoint, data, timestamp, expires_at'
    })

    // Define hooks for automatic timestamping and sync status
    this.patients.hook('creating', function (primKey, obj, trans) {
      obj.created_at = obj.created_at || new Date()
      obj.updated_at = new Date()
      obj.synced = false
    })

    this.patients.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updated_at = new Date()
      modifications.synced = false
    })

    // Apply similar hooks to other tables
    const tables = ['appointments', 'immunizations', 'vaccines', 'healthWorkers', 'guardians']
    tables.forEach(tableName => {
      this[tableName].hook('creating', function (primKey, obj, trans) {
        obj.created_at = obj.created_at || new Date()
        obj.updated_at = new Date()
        obj.synced = false
      })

      this[tableName].hook('updating', function (modifications, primKey, obj, trans) {
        modifications.updated_at = new Date()
        modifications.synced = false
      })
    })
  }
}

// Create database instance
export const db = new HealthcareDB()

// Database initialization and setup
export async function initializeDB() {
  try {
    await db.open()
    // Set up initial app settings if not exists
    const lastSync = await db.appSettings.get('lastSync')
    if (!lastSync) {
      await db.appSettings.put({
        key: 'lastSync',
        value: null,
        updated_at: new Date()
      })
    }

    const offlineMode = await db.appSettings.get('offlineMode')
    if (!offlineMode) {
      await db.appSettings.put({
        key: 'offlineMode',
        value: false,
        updated_at: new Date()
      })
    }

    return true
  } catch (error) {
    console.error('❌ Failed to initialize offline database:', error)
    return false
  }
}

// Helper functions for database operations
export const dbHelpers = {
  // Get sync status
  async getSyncStatus() {
    const unsyncedCounts = {}
    const tables = ['patients', 'appointments', 'immunizations', 'vaccines', 'healthWorkers', 'guardians']
    
    for (const table of tables) {
      unsyncedCounts[table] = await db[table].where('synced').equals(false).count()
    }
    
    const pendingActions = await db.offlineActions.where('synced').equals(false).count()
    const lastSync = await db.appSettings.get('lastSync')
    
    return {
      unsyncedCounts,
      pendingActions,
      lastSync: lastSync?.value,
      totalUnsynced: Object.values(unsyncedCounts).reduce((a, b) => a + b, 0) + pendingActions
    }
  },

  // Clear all data (for testing/reset)
  async clearAllData() {
    const tables = ['patients', 'appointments', 'immunizations', 'vaccines', 'healthWorkers', 'guardians', 'offlineActions', 'apiCache']
    for (const table of tables) {
      await db[table].clear()
    }
  },

  // Get database size estimate
  async getStorageSize() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage,
          available: estimate.quota,
          usedMB: Math.round(estimate.usage / 1024 / 1024 * 100) / 100,
          availableMB: Math.round(estimate.quota / 1024 / 1024 * 100) / 100
        }
      }
    } catch (error) {
      console.warn('Could not estimate storage size:', error)
    }
    return null
  },

  // Export data for backup
  async exportData() {
    const data = {}
    const tables = ['patients', 'appointments', 'immunizations', 'vaccines', 'healthWorkers', 'guardians']
    
    for (const table of tables) {
      data[table] = await db[table].toArray()
    }
    
    return {
      exportDate: new Date(),
      version: 1,
      data
    }
  }
}

export default db
