/**
 * IndexedDB Schema for Parent Portal - MINIMAL & CLEAN
 * Mirrors Supabase structure for essential parent-facing tables only
 * 
 * Design Principles:
 * 1. Only cache what parents SEE (no admin/staff tables)
 * 2. Use exact Supabase primary keys (patient_id, guardian_id, etc.)
 * 3. One database version - no migrations
 * 4. Auto-cache on API response
 * 5. Read from cache only when offline
 */

import Dexie from 'dexie'

// Create a fresh database with clean name
const db = new Dexie('ParentPortalOfflineDB')

/**
 * VERSION 1 - Initial Schema
 * Tables mirror Supabase structure with only fields parents need
 */
db.version(1).stores({
  // ========================================
  // CORE PATIENT DATA
  // ========================================
  
  /**
   * patients - Child basic information
   * Primary key: patient_id (bigint from Supabase)
   * Indexes: guardian_id (for filtering by parent), family_number
   */
  patients: 'patient_id, guardian_id, family_number, date_of_birth, full_name, surname, firstname',
  
  /**
   * guardians - Parent/guardian information
   * Primary key: guardian_id (bigint from Supabase)
   * Indexes: user_id (for current logged-in parent), contact_number
   */
  guardians: 'guardian_id, user_id, contact_number, family_number',
  
  /**
   * birthhistory - Birth details for each patient
   * Primary key: birthhistory_id (bigint from Supabase)
   * Indexes: patient_id (one-to-one with patients)
   */
  birthhistory: 'birthhistory_id, patient_id',
  
  // ========================================
  // MEDICAL RECORDS
  // ========================================
  
  /**
   * immunizations - Vaccination records
   * Primary key: immunization_id (bigint from Supabase)
   * Indexes: patient_id (for filtering by child), visit_id, vaccine_id, administered_date
   */
  immunizations: 'immunization_id, patient_id, visit_id, vaccine_id, administered_date',
  
  /**
   * visits - Medical checkup history
   * Primary key: visit_id (bigint from Supabase)
   * Indexes: patient_id (for filtering by child), visit_date
   */
  visits: 'visit_id, patient_id, visit_date',
  
  /**
   * vitalsigns - Growth monitoring (weight, height)
   * Primary key: vital_id (bigint from Supabase)
   * Indexes: visit_id (linked to visits)
   */
  vitalsigns: 'vital_id, visit_id',
  
  // ========================================
  // SCHEDULING
  // ========================================
  
  /**
   * patientschedule - Upcoming vaccination schedule
   * Primary key: patient_schedule_id (bigint from Supabase)
   * Indexes: patient_id, vaccine_id, scheduled_date, status
   */
  patientschedule: 'patient_schedule_id, patient_id, vaccine_id, scheduled_date, status',
  
  // ========================================
  // NOTIFICATIONS & MESSAGES
  // ========================================
  
  /**
   * notifications - SMS/push notifications for parents
   * Primary key: notification_id (bigint from Supabase)
   * Indexes: recipient_user_id (current parent), created_at, read_at
   */
  notifications: 'notification_id, recipient_user_id, created_at, read_at',
  
  // ========================================
  // REFERENCE DATA
  // ========================================
  
  /**
   * vaccinemaster - Vaccine catalog (read-only reference)
   * Primary key: vaccine_id (bigint from Supabase)
   * Indexes: antigen_name, category
   */
  vaccinemaster: 'vaccine_id, antigen_name, category, disease_prevented',
  
  // ========================================
  // METADATA
  // ========================================
  
  /**
   * _sync_metadata - Track last sync time per table
   * Used for cache invalidation and partial sync
   */
  _sync_metadata: 'table_name, last_synced_at'
})

// VERSION 2 - Messaging cache and outbox for offline chat
db.version(2).stores({
  conversations: 'conversation_id, updated_at',
  conversationparticipants: '++id, conversation_id, user_id',
  messages: 'message_id, conversation_id, created_at, sender_id',
  messages_outbox: '++id, conversation_id, created_at' // queued messages to send when back online
})

// VERSION 3 - FAQs cache for offline help panel
db.version(3).stores({
  faqs: 'faq_id, updated_at'
})

// Database initialization hook
db.on('ready', () => {
  return db
})

// Error handler
db.on('blocked', () => {
  console.warn('⚠️ Database blocked - another tab may have a different version open')
})

/**
 * Helper: Clear all offline data (useful for logout/debugging)
 */
export async function clearOfflineData() {
  try {
    await db.patients.clear()
    await db.guardians.clear()
    await db.birthhistory.clear()
    await db.immunizations.clear()
    await db.visits.clear()
    await db.vitalsigns.clear()
    await db.patientschedule.clear()
    await db.notifications.clear()
    await db.vaccinemaster.clear()
    await db._sync_metadata.clear()
    console.log('🗑️ All offline data cleared')
  } catch (error) {
    console.error('Failed to clear offline data:', error)
  }
}

/**
 * Helper: Get database info (for debugging)
 */
export async function getDatabaseInfo() {
  try {
    const counts = {}
    for (const table of db.tables) {
      counts[table.name] = await table.count()
    }
    return {
      name: db.name,
      version: db.verno,
      isOpen: db.isOpen(),
      tables: counts
    }
  } catch (error) {
    console.error('Failed to get database info:', error)
    return null
  }
}

export default db
