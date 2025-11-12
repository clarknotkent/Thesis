/**
 * useOfflineBHS Composable - Comprehensive offline data prefetching for BHS UI
 *
 * This composable handles prefetching and caching all data needed for the
 * Barangay Health Station (BHS) UI to work offline in readonly mode.
 *
 * Features:
 * - Prefetches all patient data with full details
 * - Caches immunizations, visits, schedules, deworming, vitamina records
 * - Caches inventory, vaccines, and transactions
 * - Caches user's notifications, conversations, and messages
 * - Caches health workers directory and guardians
 * - Provides offline status and sync controls
 */

import { ref, computed } from 'vue'
import api from '@/services/api'
import { db, clearStaffOfflineData, getStaffDatabaseInfo } from '@/services/offline/db'
import { useToast } from '@/composables/useToast'
import { getUserId } from '@/services/auth'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

export function useOfflineBHS() {
  const isOfflineReady = ref(false)
  const isPrefetching = ref(false)
  const lastSyncTime = ref(null)
  const prefetchProgress = ref('')
  const { addToast } = useToast()
  const { isOnline } = useOnlineStatus()

  // Session-level guard to prevent re-prefetching on component re-mounts
  const PREFETCH_SESSION_KEY = 'bhs_prefetch_completed'
  const getPrefetchCompleted = () => localStorage.getItem(PREFETCH_SESSION_KEY) === 'true'
  const setPrefetchCompleted = (completed) => {
    if (completed) {
      localStorage.setItem(PREFETCH_SESSION_KEY, 'true')
    } else {
      localStorage.removeItem(PREFETCH_SESSION_KEY)
    }
  }

  /**
   * Prefetch all BHS data for offline use
   */
  const prefetchAndCacheData = async () => {
    // Check if prefetch has already been completed for this session
    if (getPrefetchCompleted()) {
      console.log('📥 BHS prefetch already completed for this session, skipping...')
      isOfflineReady.value = true
      return
    }

    if (isPrefetching.value) {
      console.log('📥 Prefetch already in progress, skipping...')
      return
    }

    try {
      isPrefetching.value = true
      console.log('🚀 Starting comprehensive BHS offline data prefetch...')

      // Ensure database is properly initialized and opened
      if (!db.isOpen()) {
        console.log('🔄 Opening StaffOfflineDB for BHS prefetch...')
        try {
          await db.open()
          console.log('✅ StaffOfflineDB opened for BHS prefetch')
        } catch (openError) {
          console.error('❌ Failed to open database:', openError)
          // Try to delete and recreate the database
          console.log('🔄 Attempting database reset...')
          await db.delete()
          await db.open()
          console.log('✅ Database reset and reopened')
        }
        // Small delay to ensure database is fully ready
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Verify database is ready by testing a simple operation
      try {
        await db.patients.count() // Test if database is responsive
        console.log('✅ Database connectivity verified')
      } catch (dbTestError) {
        console.error('❌ Database connectivity test failed:', dbTestError)
        throw new Error('Database not ready for operations')
      }

      // Verify that all required tables are available
      const requiredTables = ['patients', 'guardians', 'healthworkers', 'inventory', 'vaccines', 'transactions', 'notifications', 'conversations', 'messages', 'immunizations', 'visits', 'patientschedule', 'deworming', 'vitamina']
      const missingTables = requiredTables.filter(tableName => !db[tableName])

      if (missingTables.length > 0) {
        console.error('❌ Missing database tables:', missingTables)
        throw new Error(`Database tables not available: ${missingTables.join(', ')}`)
      }

      console.log('✅ All database tables verified and ready')

      const userId = getUserId()
      if (!userId) {
        console.warn('⚠️ No user ID found, cannot prefetch user-specific data')
        return
      }

      // 1. Cache all patients with complete details
      await prefetchPatients()

      // 2. Cache all guardians
      await prefetchGuardians()

      // 3. Cache all health workers
      await prefetchHealthWorkers()

      // 4. Cache vaccine inventory and master data
      await prefetchInventory()

      // 5. Cache user's notifications (only when online)
      if (isOnline.value) {
        await prefetchNotifications(userId)
      } else {
        console.log('📴 Skipping notifications prefetch - offline mode')
      }

      // 6. Cache user's conversations and messages (only when online)
      if (isOnline.value) {
        await prefetchConversations(userId)
      } else {
        console.log('📴 Skipping conversations prefetch - offline mode')
      }

      // 7. Cache comprehensive patient-related data (immunizations, visits, schedules, etc.)
      await prefetchPatientRelatedData()

      lastSyncTime.value = new Date()
      isOfflineReady.value = true

      // Mark prefetch as completed for this session
      setPrefetchCompleted(true)

      console.log('🎉 BHS offline prefetch complete! All data cached for offline use.')
      addToast({
        title: 'Offline Ready',
        message: 'All BHS data has been cached for offline access.',
        type: 'success',
        timeout: 5000
      })

    } catch (error) {
      console.error('❌ Error during BHS prefetch:', error)
      addToast({
        title: 'Offline Sync Failed',
        message: 'Some data may not be available offline. Please try again when online.',
        type: 'warning',
        timeout: 7000
      })
    } finally {
      isPrefetching.value = false
      prefetchProgress.value = ''
    }
  }

  /**
   * Prefetch all patients with complete details
   */
  const prefetchPatients = async () => {
    try {
      prefetchProgress.value = 'Fetching patients...'
      console.log('📥 Fetching all patients...')

      const response = await api.get('/patients', { params: { limit: 10000 } }) // Get all patients
      const patients = response.data?.data?.patients || response.data?.data || response.data || []

      // Cache basic patient info
      const patientRecords = patients.map(patient => ({
        patient_id: patient.patient_id,
        full_name: patient.full_name || `${patient.firstname} ${patient.surname}`.trim(),
        surname: patient.surname,
        firstname: patient.firstname,
        middlename: patient.middlename,
        date_of_birth: patient.date_of_birth,
        sex: patient.sex,
        address: patient.address,
        barangay: patient.barangay,
        health_center: patient.health_center,
        mother_name: patient.mother_name,
        mother_contact_number: patient.mother_contact_number,
        mother_occupation: patient.mother_occupation,
        father_name: patient.father_name,
        father_contact_number: patient.father_contact_number,
        father_occupation: patient.father_occupation,
        guardian_contact_number: patient.guardian_contact_number,
        guardian_id: patient.guardian_id,
        guardian_firstname: patient.guardian_firstname,
        guardian_surname: patient.guardian_surname,
        guardian_family_number: patient.guardian_family_number,
        relationship_to_guardian: patient.relationship_to_guardian,
        tags: patient.tags,
        date_registered: patient.date_registered,
        age_months: patient.age_months,
        age_days: patient.age_days,
        // Include birth history
        birth_weight: patient.birth_weight,
        birth_length: patient.birth_length,
        place_of_birth: patient.place_of_birth,
        address_at_birth: patient.address_at_birth,
        time_of_birth: patient.time_of_birth,
        attendant_at_birth: patient.attendant_at_birth,
        type_of_delivery: patient.type_of_delivery,
        ballards_score: patient.ballards_score,
        hearing_test_date: patient.hearing_test_date,
        newborn_screening_date: patient.newborn_screening_date,
        newborn_screening_result: patient.newborn_screening_result
      }))

      // Ensure database is open before bulk operations
      if (!db.isOpen()) {
        await db.open()
        console.log('✅ StaffOfflineDB opened for patients prefetch')
      }

      await db.patients.bulkPut(patientRecords)
      console.log(`✅ Cached ${patientRecords.length} patients with complete details`)

    } catch (error) {
      console.warn('⚠️ Failed to prefetch patients:', error)
    }
  }

  /**
   * Prefetch all guardians
   */
  const prefetchGuardians = async () => {
    try {
      prefetchProgress.value = 'Fetching guardians...'
      console.log('📥 Fetching guardians...')

      const response = await api.get('/guardians', { params: { limit: 1000 } })
      const guardians = response.data?.data || response.data || []

      const guardianRecords = guardians.map(guardian => ({
        guardian_id: guardian.guardian_id,
        full_name: guardian.full_name || `${guardian.firstname} ${guardian.surname}`.trim(),
        contact_number: guardian.contact_number,
        family_number: guardian.family_number,
        address: guardian.address,
        ...guardian
      }))

      // Ensure database is open before bulk operations
      if (!db.isOpen()) {
        await db.open()
        console.log('✅ StaffOfflineDB opened for guardians prefetch')
      }

      await db.guardians.bulkPut(guardianRecords)
      console.log(`✅ Cached ${guardianRecords.length} guardians`)

    } catch (error) {
      console.warn('⚠️ Failed to prefetch guardians:', error)
    }
  }

  /**
   * Prefetch health workers directory
   */
  const prefetchHealthWorkers = async () => {
    try {
      prefetchProgress.value = 'Fetching health workers...'
      console.log('📥 Fetching health workers...')

      const response = await api.get('/health-staff', { params: { limit: 1000 } })
      const healthworkers = response.data?.data?.healthStaff || response.data?.data || response.data || []

      const hwRecords = healthworkers.map(hw => ({
        health_worker_id: hw.health_worker_id || hw.id,
        full_name: hw.full_name || `${hw.firstname} ${hw.surname}`.trim(),
        contact_number: hw.contact_number,
        ...hw
      }))

      // Ensure database is open before bulk operations
      if (!db.isOpen()) {
        await db.open()
        console.log('✅ StaffOfflineDB opened for health workers prefetch')
      }

      await db.healthworkers.bulkPut(hwRecords)
      console.log(`✅ Cached ${hwRecords.length} health workers`)

    } catch (error) {
      console.warn('⚠️ Failed to prefetch health workers:', error)
    }
  }

  /**
   * Prefetch vaccine inventory and master data
   */
  const prefetchInventory = async () => {
    try {
      prefetchProgress.value = 'Fetching vaccine inventory...'
      console.log('📥 Fetching vaccine inventory...')

      // Ensure database is open and ready - with explicit verification
      if (!db.isOpen()) {
        console.log('🔄 Opening StaffOfflineDB for inventory prefetch...')
        await db.open()
        console.log('✅ StaffOfflineDB opened for inventory prefetch')
        // Small delay to ensure database is fully ready
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Verify database is ready by checking a simple operation
      try {
        await db.patients.count() // Test if database is responsive
        console.log('✅ Database connectivity verified')
      } catch (dbTestError) {
        console.error('❌ Database connectivity test failed:', dbTestError)
        throw new Error('Database not ready for operations')
      }

      // Double-check that tables are available
      if (!db.inventory || !db.vaccines || !db.transactions) {
        console.error('❌ Required tables not available:', {
          inventory: !!db.inventory,
          vaccines: !!db.vaccines,
          transactions: !!db.transactions
        })
        throw new Error('Database tables not available for inventory operations')
      }

      console.log('📦 Starting inventory data fetch...')

      // Inventory
      const inventoryResponse = await api.get('/vaccines/inventory', { params: { limit: 1000 } })
      const inventory = inventoryResponse.data?.data || inventoryResponse.data || []
      console.log(`📊 Fetched ${inventory.length} inventory items from API`)

      if (inventory.length > 0) {
        // Clear existing inventory data first to avoid conflicts
        console.log('🗑️ Clearing existing inventory data...')
        await db.inventory.clear()

        const inventoryRecords = inventory.map(item => ({
          ...item,
          id: item.inventory_id // Map inventory_id to id for Dexie primary key
        }))

        console.log('💾 Inserting inventory records:', inventoryRecords.slice(0, 3)) // Log first 3 for debugging

        try {
          await db.inventory.bulkPut(inventoryRecords)
          console.log(`✅ Cached ${inventoryRecords.length} inventory items`)
        } catch (bulkPutError) {
          console.error('❌ bulkPut failed for inventory:', bulkPutError)
          console.error('First inventory record:', inventoryRecords[0])
          throw bulkPutError
        }
      }

      // Vaccines master data
      const vaccinesResponse = await api.get('/vaccines', { params: { limit: 1000 } })
      const vaccines = vaccinesResponse.data?.data || vaccinesResponse.data || []
      console.log(`📊 Fetched ${vaccines.length} vaccine types from API`)

      if (vaccines.length > 0) {
        // Clear existing vaccine data first
        await db.vaccines.clear()
        console.log('💾 Storing vaccine records:', vaccines.slice(0, 2)) // Log first 2 for debugging
        await db.vaccines.bulkPut(vaccines)
        console.log(`✅ Cached ${vaccines.length} vaccine types`)
        
        // Verify storage
        const vaccineCount = await db.vaccines.count()
        console.log(`🔍 Verification: ${vaccineCount} vaccines in database`)
      }

      // Recent transactions
      const transactionsResponse = await api.get('/vaccines/transactions', {
        params: { limit: 500, sort: 'created_at:desc' }
      })
      const transactions = transactionsResponse.data?.data || transactionsResponse.data || []
      console.log(`📊 Fetched ${transactions.length} transactions from API`)

      if (transactions.length > 0) {
        // Clear existing transaction data first
        await db.transactions.clear()
        await db.transactions.bulkPut(transactions)
        console.log(`✅ Cached ${transactions.length} inventory transactions`)
      }

    } catch (error) {
      console.error('❌ Failed to prefetch inventory data:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
  }

  /**
   * Prefetch user's notifications
   */
  const prefetchNotifications = async (userId) => {
    try {
      prefetchProgress.value = 'Fetching notifications...'
      console.log('📥 Fetching notifications...')

      const response = await api.get('/notifications', { params: { limit: 500 } })
      const notifications = response.data?.data || response.data || []

      const notificationRecords = notifications.map(notification => ({
        ...notification,
        user_id: userId // Associate with current user
      }))

      // Ensure database is open before bulk operations
      if (!db.isOpen()) {
        await db.open()
        console.log('✅ StaffOfflineDB opened for notifications prefetch')
      }

      await db.notifications.bulkPut(notificationRecords)
      console.log(`✅ Cached ${notificationRecords.length} notifications`)

    } catch (error) {
      console.warn('⚠️ Failed to prefetch notifications:', error)
    }
  }

  /**
   * Prefetch user's conversations and messages
   */
  const prefetchConversations = async (_userId) => {
    try {
      prefetchProgress.value = 'Fetching conversations...'
      console.log('📥 Fetching conversations...')

      // Ensure database is open and ready
      if (!db.isOpen()) {
        await db.open()
        console.log('✅ StaffOfflineDB opened for conversations prefetch')
        // Small delay to ensure database is fully ready
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Double-check that tables are available
      if (!db.conversations || !db.messages) {
        throw new Error('Database tables not available for conversation operations')
      }

      const conversationsResponse = await api.get('/conversations', { params: { limit: 200 } })
      const conversations = conversationsResponse.data?.items || conversationsResponse.data || []

      if (conversations.length > 0) {
        // Clear existing conversation data first
        await db.conversations.clear()
        try {
          await db.conversations.bulkPut(conversations)
          console.log(`✅ Cached ${conversations.length} conversations`)
        } catch (bulkPutError) {
          console.error('❌ bulkPut failed for conversations:', bulkPutError)
          console.error('First conversation record:', conversations[0])
          throw bulkPutError
        }
      }

      // Fetch messages for each conversation (limit to recent ones)
      for (const conversation of conversations.slice(0, 20)) {
        try {
          const messagesResponse = await api.get(`/messages/${conversation.conversation_id}`, {
            params: { limit: 100, sort: 'created_at:desc' }
          })
          const messages = messagesResponse.data?.data || messagesResponse.data || []

          if (messages.length > 0) {
            // Clear existing messages for this conversation first
            await db.messages.where('conversation_id').equals(conversation.conversation_id).delete()
            await db.messages.bulkPut(messages)
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch messages for conversation ${conversation.conversation_id}`)
        }
      }

      const totalMessages = await db.messages.count()
      console.log(`✅ Cached ${totalMessages} messages`)

    } catch (error) {
      console.warn('⚠️ Failed to prefetch conversations:', error)
    }
  }

  /**
   * Prefetch comprehensive patient-related data (immunizations, visits, schedules, etc.)
   */
  const prefetchPatientRelatedData = async () => {
    try {
      prefetchProgress.value = 'Fetching patient records...'
      console.log('📥 Prefetching comprehensive patient-related data...')

      const patients = await db.patients.toArray()
      console.log(`📊 Processing ${patients.length} patients for related data...`)

      // Process patients in batches to avoid overwhelming the API
      const batchSize = 20
      for (let i = 0; i < patients.length; i += batchSize) {
        const batch = patients.slice(i, i + batchSize)
        prefetchProgress.value = `Fetching records for patients... (${i + batch.length}/${patients.length})`

        // Process batch concurrently
        await Promise.all(batch.map(async (patient) => {
          const patientId = patient.patient_id

          // Immunizations - get all for this patient
          try {
            const immunizationsResponse = await api.get('/immunizations', {
              params: { patient_id: patientId, limit: 1000 }
            })
            const immunizations = immunizationsResponse.data?.data || immunizationsResponse.data || []
            if (immunizations.length > 0) {
              await db.immunizations.bulkPut(immunizations)
            }
          } catch (error) {
            // Continue with other data
          }

          // Visits/Medical History - get all for this patient
          try {
            const visitsResponse = await api.get('/visits', {
              params: { patient_id: patientId, limit: 1000 }
            })
            const visits = Array.isArray(visitsResponse.data)
              ? visitsResponse.data
              : (visitsResponse.data?.items || visitsResponse.data?.data || [])
            if (Array.isArray(visits) && visits.length > 0) {
              await db.visits.bulkPut(visits)
            }
          } catch (error) {
            // Continue
          }

          // Patient schedules - get all for this patient
          try {
            const schedulesResponse = await api.get(`/patients/${patientId}/schedule`)
            const schedules = schedulesResponse.data?.data || schedulesResponse.data || []
            if (schedules.length > 0) {
              await db.patientschedule.bulkPut(schedules)
            }
          } catch (error) {
            // Continue
          }

          // Deworming - get all for this patient
          try {
            const dewormingResponse = await api.get('/deworming', {
              params: { patient_id: patientId, limit: 1000 }
            })
            const deworming = dewormingResponse.data?.data || dewormingResponse.data || []
            if (deworming.length > 0) {
              await db.deworming.bulkPut(deworming)
            }
          } catch (error) {
            // Continue
          }

          // Vitamin A - get all for this patient
          try {
            const vitaminaResponse = await api.get('/vitamina', {
              params: { patient_id: patientId, limit: 1000 }
            })
            const vitamina = vitaminaResponse.data?.data || vitaminaResponse.data || []
            if (vitamina.length > 0) {
              await db.vitamina.bulkPut(vitamina)
            }
          } catch (error) {
            // Continue
          }
        }))

        // Small delay between batches to be API-friendly
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Get final counts
      const immunizationsCount = await db.immunizations.count()
      const visitsCount = await db.visits.count()
      const schedulesCount = await db.patientschedule.count()
      const dewormingCount = await db.deworming.count()
      const vitaminaCount = await db.vitamina.count()

      console.log(`✅ Cached comprehensive patient data: ${immunizationsCount} immunizations, ${visitsCount} visits, ${schedulesCount} schedules, ${dewormingCount} deworming, ${vitaminaCount} vitamina`)

    } catch (error) {
      console.warn('⚠️ Failed to prefetch comprehensive patient-related data:', error)
    }
  }

  /**
   * Get offline storage statistics
   */
  const getOfflineStats = async () => {
    try {
      const stats = await getStaffDatabaseInfo()
      return {
        ...stats,
        lastSyncTime: lastSyncTime.value,
        isReady: isOfflineReady.value
      }
    } catch (error) {
      console.error('❌ Failed to get offline stats:', error)
      return null
    }
  }

  /**
   * Clear all cached data
   */
  const clearOfflineData = async () => {
    try {
      console.log('🗑️ Clearing StaffOfflineDB...')
      await clearStaffOfflineData()
      isOfflineReady.value = false
      lastSyncTime.value = null
      
      // Clear the session prefetch flag
      setPrefetchCompleted(false)
      
      addToast({
        title: 'Offline Data Cleared',
        message: 'All cached data has been removed.',
        type: 'info'
      })
      console.log('✅ StaffOfflineDB cleared successfully')
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error)
    }
  }

  /**
   * Force reset database (nuclear option)
   */
  const resetDatabase = async () => {
    try {
      console.log('💥 Force resetting StaffOfflineDB...')
      if (db.isOpen()) {
        await db.close()
      }
      await db.delete()
      await db.open()
      console.log('✅ Database force reset complete')
      isOfflineReady.value = false
      lastSyncTime.value = null
      
      // Clear the session prefetch flag
      setPrefetchCompleted(false)
      
      addToast({
        title: 'Database Reset',
        message: 'Database has been completely reset.',
        type: 'warning'
      })
    } catch (error) {
      console.error('❌ Failed to reset database:', error)
    }
  }

  /**
   * Force sync now (ignores session guard)
   */
  const forceSync = async () => {
    console.log('🔄 Force syncing BHS data (ignoring session guard)...')
    setPrefetchCompleted(false) // Clear the session flag
    await prefetchAndCacheData()
  }

  return {
    // State
    isOfflineReady: computed(() => isOfflineReady.value),
    isPrefetching: computed(() => isPrefetching.value),
    lastSyncTime: computed(() => lastSyncTime.value),
    prefetchProgress: computed(() => prefetchProgress.value),

    // Methods
    prefetchAndCacheData,
    getOfflineStats,
    clearOfflineData,
    resetDatabase,
    forceSync
  }
}