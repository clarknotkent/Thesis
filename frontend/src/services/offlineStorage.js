import { db } from './offlineDB.js'
import axios from 'axios'

// Offline Storage Service - Handles data operations with automatic sync
export class OfflineStorageService {
  constructor() {
    this.isOnline = navigator.onLine
    this.syncInProgress = false
    this.setupEventListeners()
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.triggerSync()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  // Generic CRUD operations that work offline/online
  async create(tableName, data) {
    try {
      // Add offline metadata
      const offlineData = {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
        synced: false,
        offline_created: true
      }

      // Save to local database
      const localId = await db[tableName].add(offlineData)
      
      // Queue for sync if online
      if (this.isOnline) {
        await this.queueAction('CREATE', tableName, { ...offlineData, localId })
        this.triggerSync()
      } else {
        await this.queueAction('CREATE', tableName, { ...offlineData, localId })
      }

      return { id: localId, ...offlineData }
    } catch (error) {
      console.error(`Error creating ${tableName}:`, error)
      throw error
    }
  }

  async read(tableName, id = null) {
    try {
      if (id) {
        // Get specific record
        const record = await db[tableName].get(id)
        return record
      } else {
        // Get all records
        const records = await db[tableName].toArray()
        return records
      }
    } catch (error) {
      console.error(`Error reading ${tableName}:`, error)
      throw error
    }
  }

  async update(tableName, id, data) {
    try {
      const updateData = {
        ...data,
        updated_at: new Date(),
        synced: false
      }

      // Update local database
      await db[tableName].update(id, updateData)
      
      // Get updated record
      const updatedRecord = await db[tableName].get(id)
      
      // Queue for sync
      if (this.isOnline) {
        await this.queueAction('UPDATE', tableName, { ...updatedRecord, localId: id })
        this.triggerSync()
      } else {
        await this.queueAction('UPDATE', tableName, { ...updatedRecord, localId: id })
      }

      return updatedRecord
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error)
      throw error
    }
  }

  async delete(tableName, id) {
    try {
      // Get record before deletion for sync queue
      const record = await db[tableName].get(id)
      
      if (record) {
        // Mark as deleted instead of actually deleting (for sync)
        await db[tableName].update(id, {
          deleted: true,
          deleted_at: new Date(),
          synced: false
        })

        // Queue for sync
        if (this.isOnline) {
          await this.queueAction('DELETE', tableName, { ...record, localId: id })
          this.triggerSync()
        } else {
          await this.queueAction('DELETE', tableName, { ...record, localId: id })
        }
      }

      return true
    } catch (error) {
      console.error(`Error deleting ${tableName}:`, error)
      throw error
    }
  }

  // Search and filter operations
  async search(tableName, criteria) {
    try {
      let collection = db[tableName].where('deleted').notEqual(true)
      
      // Apply search criteria
      if (criteria.name) {
        collection = collection.and(item => 
          item.name && item.name.toLowerCase().includes(criteria.name.toLowerCase())
        )
      }
      
      if (criteria.email) {
        collection = collection.and(item => 
          item.email && item.email.toLowerCase().includes(criteria.email.toLowerCase())
        )
      }

      if (criteria.date_from && criteria.date_to) {
        collection = collection.and(item => {
          const itemDate = new Date(item.created_at)
          return itemDate >= new Date(criteria.date_from) && itemDate <= new Date(criteria.date_to)
        })
      }

      const results = await collection.toArray()
      return results
    } catch (error) {
      console.error(`Error searching ${tableName}:`, error)
      throw error
    }
  }

  // Queue actions for background sync
  async queueAction(actionType, tableName, data) {
    try {
      await db.offlineActions.add({
        action_type: actionType,
        table_name: tableName,
        data: data,
        timestamp: new Date(),
        retries: 0,
        synced: false
      })
    } catch (error) {
      console.error('Error queuing action:', error)
    }
  }

  // Sync with server when online
  async triggerSync() {
    if (!this.isOnline || this.syncInProgress) {
      return
    }

    this.syncInProgress = true
    
    try {
      console.log('🔄 Starting sync with server...')
      
      // Get all unsynced actions
      const pendingActions = await db.offlineActions.where('synced').equals(false).toArray()
      
      for (const action of pendingActions) {
        try {
          await this.syncAction(action)
          // Mark as synced
          await db.offlineActions.update(action.id, { synced: true })
        } catch (error) {
          console.error('Sync action failed:', error)
          // Increment retry count
          await db.offlineActions.update(action.id, { 
            retries: action.retries + 1 
          })
        }
      }

      // Update last sync time
      await db.appSettings.put({
        key: 'lastSync',
        value: new Date(),
        updated_at: new Date()
      })

      console.log('✅ Sync completed successfully')
    } catch (error) {
      console.error('❌ Sync failed:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  async syncAction(action) {
    const { action_type, table_name, data } = action
    const apiEndpoint = this.getApiEndpoint(table_name)

    switch (action_type) {
      case 'CREATE':
        const response = await axios.post(apiEndpoint, data)
        // Update local record with server ID
        if (response.data && response.data.id) {
          await db[table_name].update(data.localId, {
            [`${table_name.slice(0, -1)}_id`]: response.data.id,
            synced: true
          })
        }
        break

      case 'UPDATE':
        if (data[`${table_name.slice(0, -1)}_id`]) {
          await axios.put(`${apiEndpoint}/${data[`${table_name.slice(0, -1)}_id`]}`, data)
          await db[table_name].update(data.localId, { synced: true })
        }
        break

      case 'DELETE':
        if (data[`${table_name.slice(0, -1)}_id`]) {
          await axios.delete(`${apiEndpoint}/${data[`${table_name.slice(0, -1)}_id`]}`)
          // Actually delete from local database now
          await db[table_name].delete(data.localId)
        }
        break
    }
  }

  getApiEndpoint(tableName) {
    const endpoints = {
      patients: '/api/patients',
      appointments: '/api/appointments',
      immunizations: '/api/immunizations',
      vaccines: '/api/vaccines',
  healthWorkers: '/api/health-staff',
      guardians: '/api/guardians'
    }
    return endpoints[tableName] || `/api/${tableName}`
  }

  // Cache API responses for offline access
  async cacheApiResponse(endpoint, data, ttlMinutes = 60) {
    try {
      await db.apiCache.put({
        endpoint,
        data,
        timestamp: new Date(),
        expires_at: new Date(Date.now() + ttlMinutes * 60 * 1000)
      })
    } catch (error) {
      console.error('Error caching API response:', error)
    }
  }

  async getCachedResponse(endpoint) {
    try {
      const cached = await db.apiCache.get(endpoint)
      if (cached && new Date() < new Date(cached.expires_at)) {
        return cached.data
      }
      return null
    } catch (error) {
      console.error('Error getting cached response:', error)
      return null
    }
  }

  // Batch operations
  async bulkCreate(tableName, dataArray) {
    const results = []
    for (const data of dataArray) {
      const result = await this.create(tableName, data)
      results.push(result)
    }
    return results
  }

  // Get sync statistics
  async getSyncStatus() {
    return await db.getSyncStatus()
  }

  // Force full sync from server
  async fullSync() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }

    try {
      // Fetch latest data from server and update local database
      const endpoints = ['patients', 'appointments', 'immunizations', 'vaccines', 'healthWorkers', 'guardians']
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(this.getApiEndpoint(endpoint))
          const serverData = response.data

          // Update local database with server data
          for (const item of serverData) {
            const existingItem = await db[endpoint].where(`${endpoint.slice(0, -1)}_id`).equals(item.id).first()
            
            if (existingItem) {
              await db[endpoint].update(existingItem.id, {
                ...item,
                [`${endpoint.slice(0, -1)}_id`]: item.id,
                synced: true,
                updated_at: new Date(item.updated_at)
              })
            } else {
              await db[endpoint].add({
                ...item,
                [`${endpoint.slice(0, -1)}_id`]: item.id,
                synced: true,
                created_at: new Date(item.created_at),
                updated_at: new Date(item.updated_at)
              })
            }
          }
        } catch (error) {
          console.error(`Failed to sync ${endpoint}:`, error)
        }
      }

      console.log('✅ Full sync completed')
    } catch (error) {
      console.error('❌ Full sync failed:', error)
      throw error
    }
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorageService()

export default offlineStorage