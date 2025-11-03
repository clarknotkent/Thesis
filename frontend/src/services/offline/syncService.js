/**
 * Sync Service - The Brain of Offline-First Architecture
 * 
 * This service implements the "Outbox Pattern" for our offline-first PWA.
 * It handles background syncing of pending data to Supabase and manages
 * data conflicts using the "Reject & Refresh" strategy.
 * 
 * ARCHITECTURE:
 * 1. Monitors the pending_uploads table (the "Outbox")
 * 2. When online, processes each pending upload sequentially
 * 3. Detects conflicts by comparing timestamps (updated_at)
 * 4. Resolves conflicts using "Reject & Refresh" (never auto-merge)
 * 5. Notifies users when their changes are rejected due to conflicts
 */

import db from './db'
import api from '@/services/api' // Use direct API (not offlineAPI wrapper)
import { addToast } from '@/composables/useToast'

class SyncService {
  constructor() {
    this.isSyncing = false
    this.isOnline = navigator.onLine
    this.syncInterval = null
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Device is ONLINE')
      this.isOnline = true
      this.triggerSync()
    })
    
    window.addEventListener('offline', () => {
      console.log('📴 Device is OFFLINE')
      this.isOnline = false
    })
  }

  /**
   * Initialize the sync service
   * Called once when the app starts
   */
  async initialize() {
    console.log('🚀 SyncService initialized')
    
    // Trigger initial sync if online
    if (this.isOnline) {
      await this.triggerSync()
    }
    
    // Set up periodic sync (every 30 seconds when online)
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.triggerSync()
      }
    }, 30000)
  }

  /**
   * Main sync function - processes all pending uploads
   */
  async triggerSync() {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...')
      return
    }

    if (!this.isOnline) {
      console.log('📴 Device is offline, skipping sync')
      return
    }

    try {
      this.isSyncing = true
      console.log('🔄 Starting sync...')

      // Get all pending uploads ordered by creation time (FIFO)
      const pendingUploads = await db.pending_uploads
        .where('status')
        .equals('pending')
        .sortBy('created_at')

      if (pendingUploads.length === 0) {
        console.log('✅ No pending uploads to sync')
        return
      }

      console.log(`📤 Found ${pendingUploads.length} pending uploads`)

      // Process each upload sequentially
      for (const upload of pendingUploads) {
        await this.processUpload(upload)
      }

      console.log('✅ Sync completed successfully')
    } catch (error) {
      console.error('❌ Sync failed:', error)
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Process a single pending upload
   */
  async processUpload(upload) {
    try {
      console.log(`📤 Processing ${upload.type} (${upload.operation}):`, upload.id)

      // Route to appropriate handler based on type
      switch (upload.type) {
        case 'patient':
          await this.syncPatient(upload)
          break
        case 'immunization':
          await this.syncImmunization(upload)
          break
        default:
          console.warn(`Unknown upload type: ${upload.type}`)
          await this.markUploadFailed(upload.id, `Unknown type: ${upload.type}`)
      }
    } catch (error) {
      console.error(`❌ Failed to process upload ${upload.id}:`, error)
      await this.markUploadFailed(upload.id, error.message)
    }
  }

  /**
   * Sync a patient record to Supabase
   */
  async syncPatient(upload) {
    const { operation, data, local_id } = upload

    if (operation === 'create') {
      try {
        // POST to Supabase to create patient
        const response = await api.post('/patients', data)
        const serverPatient = response.data?.data || response.data

        if (!serverPatient || !serverPatient.id) {
          throw new Error('Server did not return a valid patient ID')
        }

        // Update local Dexie record with real Supabase UUID
        const localPatient = await db.patients.get(local_id)
        if (localPatient) {
          // Remove the temporary record
          await db.patients.delete(local_id)
          
          // Add the server record with real UUID
          await db.patients.put({
            ...serverPatient,
            _pending: false,
            _synced_at: new Date().toISOString()
          })
          
          console.log(`✅ Patient synced: ${local_id} → ${serverPatient.id}`)
        }

        // Remove from pending_uploads
        await db.pending_uploads.delete(upload.id)
        
        // Show success notification
        addToast({
          title: 'Synced',
          message: 'Patient record synced to server',
          type: 'success',
          timeout: 3000
        })
      } catch (error) {
        console.error('Failed to sync patient:', error)
        throw error
      }
    } else if (operation === 'update') {
      // TODO: Implement update with conflict detection
      await this.syncPatientUpdate(upload)
    }
  }

  /**
   * Sync a patient UPDATE with conflict detection (Reject & Refresh)
   */
  async syncPatientUpdate(upload) {
    const { data, local_id } = upload

    try {
      // STEP 1: Fetch the current server timestamp for this record
      const serverResponse = await api.get(`/patients/${data.id}`)
      const serverRecord = serverResponse.data?.data || serverResponse.data
      const serverTimestamp = new Date(serverRecord.updated_at).getTime()

      // STEP 2: Get the local record's original timestamp
      const localRecord = await db.patients.get(local_id)
      const localTimestamp = new Date(localRecord._original_updated_at || localRecord.updated_at).getTime()

      // STEP 3: Detect conflict
      if (serverTimestamp > localTimestamp) {
        // CONFLICT DETECTED! Server has newer data
        console.warn('⚠️ CONFLICT DETECTED for patient:', data.id)
        
        // REJECT: Don't send the stale update
        await db.pending_uploads.delete(upload.id)
        
        // REFRESH: Overwrite local with server data
        await db.patients.put({
          ...serverRecord,
          _pending: false,
          _synced_at: new Date().toISOString()
        })
        
        // NOTIFY: Tell the user
        addToast({
          title: 'Sync Conflict',
          message: `Your changes for patient "${serverRecord.firstname} ${serverRecord.surname}" could not be saved because the record was updated by someone else. The record has been refreshed. Please make your changes again.`,
          type: 'warning',
          timeout: 10000
        })
        
        console.log('✅ Conflict resolved: Local data refreshed from server')
        return
      }

      // STEP 4: No conflict - proceed with update
      const response = await api.put(`/patients/${data.id}`, data)
      const updatedRecord = response.data?.data || response.data

      // Update local record
      await db.patients.put({
        ...updatedRecord,
        _pending: false,
        _synced_at: new Date().toISOString()
      })

      // Remove from pending_uploads
      await db.pending_uploads.delete(upload.id)

      addToast({
        title: 'Synced',
        message: 'Patient record updated successfully',
        type: 'success',
        timeout: 3000
      })

      console.log('✅ Patient updated successfully:', data.id)
    } catch (error) {
      console.error('Failed to sync patient update:', error)
      throw error
    }
  }

  /**
   * Sync an immunization record to Supabase
   */
  async syncImmunization(upload) {
    const { operation, data, local_id } = upload

    if (operation === 'create') {
      try {
        // POST to Supabase to create immunization
        const response = await api.post('/immunizations', data)
        const serverImmunization = response.data?.data || response.data

        if (!serverImmunization || !serverImmunization.id) {
          throw new Error('Server did not return a valid immunization ID')
        }

        // Update local Dexie record with real Supabase UUID
        const localImmunization = await db.immunizations.get(local_id)
        if (localImmunization) {
          // Remove the temporary record
          await db.immunizations.delete(local_id)
          
          // Add the server record with real UUID
          await db.immunizations.put({
            ...serverImmunization,
            _pending: false,
            _synced_at: new Date().toISOString()
          })
          
          console.log(`✅ Immunization synced: ${local_id} → ${serverImmunization.id}`)
        }

        // Remove from pending_uploads
        await db.pending_uploads.delete(upload.id)
        
        // Show success notification
        addToast({
          title: 'Synced',
          message: 'Immunization record synced to server',
          type: 'success',
          timeout: 3000
        })
      } catch (error) {
        console.error('Failed to sync immunization:', error)
        throw error
      }
    } else if (operation === 'update') {
      // TODO: Implement update with conflict detection
      await this.syncImmunizationUpdate(upload)
    }
  }

  /**
   * Sync an immunization UPDATE with conflict detection (Reject & Refresh)
   */
  async syncImmunizationUpdate(upload) {
    const { data, local_id } = upload

    try {
      // STEP 1: Fetch the current server timestamp for this record
      const serverResponse = await api.get(`/immunizations/${data.id}`)
      const serverRecord = serverResponse.data?.data || serverResponse.data
      const serverTimestamp = new Date(serverRecord.updated_at).getTime()

      // STEP 2: Get the local record's original timestamp
      const localRecord = await db.immunizations.get(local_id)
      const localTimestamp = new Date(localRecord._original_updated_at || localRecord.updated_at).getTime()

      // STEP 3: Detect conflict
      if (serverTimestamp > localTimestamp) {
        // CONFLICT DETECTED! Server has newer data
        console.warn('⚠️ CONFLICT DETECTED for immunization:', data.id)
        
        // REJECT: Don't send the stale update
        await db.pending_uploads.delete(upload.id)
        
        // REFRESH: Overwrite local with server data
        await db.immunizations.put({
          ...serverRecord,
          _pending: false,
          _synced_at: new Date().toISOString()
        })
        
        // NOTIFY: Tell the user
        addToast({
          title: 'Sync Conflict',
          message: `Your changes for an immunization record could not be saved because it was updated by someone else. The record has been refreshed. Please make your changes again.`,
          type: 'warning',
          timeout: 10000
        })
        
        console.log('✅ Conflict resolved: Local data refreshed from server')
        return
      }

      // STEP 4: No conflict - proceed with update
      const response = await api.put(`/immunizations/${data.id}`, data)
      const updatedRecord = response.data?.data || response.data

      // Update local record
      await db.immunizations.put({
        ...updatedRecord,
        _pending: false,
        _synced_at: new Date().toISOString()
      })

      // Remove from pending_uploads
      await db.pending_uploads.delete(upload.id)

      addToast({
        title: 'Synced',
        message: 'Immunization record updated successfully',
        type: 'success',
        timeout: 3000
      })

      console.log('✅ Immunization updated successfully:', data.id)
    } catch (error) {
      console.error('Failed to sync immunization update:', error)
      throw error
    }
  }

  /**
   * Mark an upload as failed
   */
  async markUploadFailed(uploadId, errorMessage) {
    try {
      await db.pending_uploads.update(uploadId, {
        status: 'failed',
        error: errorMessage,
        failed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to mark upload as failed:', error)
    }
  }

  /**
   * Get sync status for debugging
   */
  async getSyncStatus() {
    const pending = await db.pending_uploads.where('status').equals('pending').count()
    const failed = await db.pending_uploads.where('status').equals('failed').count()
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: pending,
      failedCount: failed
    }
  }

  /**
   * Manual sync trigger (for UI button)
   */
  async manualSync() {
    console.log('🔄 Manual sync triggered')
    await this.triggerSync()
  }

  /**
   * Download Parent/Guardian Data (Read-Only Cache)
   * 
   * This function is called after login for Guardian role users.
   * It downloads and caches read-only data from the server:
   * - Children list with vaccination summaries
   * - Vaccination schedules for all children
   * - Notifications
   * - Guardian profile
   * 
   * This enables the parent mobile app to work offline.
   */
  async downloadParentData() {
    console.log('📥 Downloading parent data for offline cache...')
    
    try {
      // Fetch all parent data in parallel
      const [childrenRes, notificationsRes, profileRes] = await Promise.all([
        api.get('/parent/children'),
        api.get('/notifications', { params: { limit: 50 } }),
        api.get('/parent/profile')
      ])

      const children = childrenRes.data?.data || []
      const notifications = notificationsRes.data?.data || []
      const profile = profileRes.data?.data || {}

      console.log(`📥 Downloaded ${children.length} children, ${notifications.length} notifications`)

      // Clear existing cached data
      await db.children.clear()
      await db.schedules.clear()
      await db.notifications.clear()
      await db.guardian_profile.clear()

      // Store children
      if (children.length > 0) {
        await db.children.bulkAdd(children)
      }

      // Store guardian profile (single record)
      if (profile && profile.guardian_id) {
        await db.guardian_profile.put({ id: 1, ...profile })
      }

      // Store notifications
      if (notifications.length > 0) {
        const formattedNotifications = notifications.map(n => ({
          id: n.notification_id || n.id,
          title: n.title,
          message: n.message,
          type: n.type || 'info',
          is_read: n.is_read || false,
          created_at: n.created_at,
          metadata: n.metadata
        }))
        await db.notifications.bulkAdd(formattedNotifications)
      }

      // Fetch and store schedules for each child
      for (const child of children) {
        try {
          const scheduleRes = await api.get(`/parent/children/${child.id}/schedule`)
          const schedules = scheduleRes.data?.data || []
          
          if (schedules.length > 0) {
            const formattedSchedules = schedules.map(s => ({
              id: s.patient_schedule_id || s.id,
              patient_id: child.id,
              vaccine_id: s.vaccine_id,
              vaccine_name: s.vaccine_name,
              dose_number: s.dose_number,
              scheduled_date: s.scheduled_date,
              actual_date: s.actual_date,
              status: s.status,
              remarks: s.remarks
            }))
            await db.schedules.bulkAdd(formattedSchedules)
          }
        } catch (err) {
          console.warn(`⚠️ Failed to download schedule for child ${child.id}:`, err.message)
        }
      }

      console.log('✅ Parent data downloaded and cached successfully')
      
      addToast({
        type: 'success',
        message: 'Your data is now available offline!',
        duration: 3000
      })

      return { success: true }
    } catch (error) {
      console.error('❌ Failed to download parent data:', error)
      
      addToast({
        type: 'warning',
        message: 'Could not download offline data. You may need an internet connection.',
        duration: 5000
      })
      
      return { success: false, error: error.message }
    }
  }

  /**
   * Stop the sync service
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    console.log('🛑 SyncService stopped')
  }
}

// Create singleton instance
const syncService = new SyncService()

// Export singleton
export default syncService
