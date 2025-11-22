/**
 * AdminOfflineDB - Separate database for Admin offline access.
 * This database is separate from 'StaffOfflineDB' and 'ParentPortalOfflineDB'
 * to manage data scoping and to be easily wiped on logout for security.
 *
 * SECURITY: This database is completely wiped on logout to prevent
 * sensitive patient data from persisting in the browser.
 *
 * SHARED BY: Admin role only (readonly offline access)
 * CACHED DATA: Patients, Guardians, Users, Inventory, and related data (read-only offline access)
 */
import Dexie from 'dexie'

// We keep a mutable reference so we can recreate after delete (logout)
let adminDB = null

export function initAdminOfflineDB() {
  // If already initialized and open, reuse
  if (adminDB && adminDB.isOpen()) {
    return adminDB
  }
  adminDB = new Dexie('AdminOfflineDB')

  // Define base schema versions
  adminDB.version(1).stores({
    patients: 'patient_id, full_name, surname, firstname, date_of_birth, is_deleted',
    guardians: 'guardian_id, full_name, contact_number',
    users: 'user_id, role, username, contact_number, is_deleted',
    healthworkers: 'health_worker_id, full_name, contact_number',
    inventory: 'id, inventory_id, vaccine_id, lot_number, expiration_date, is_deleted',
    vaccines: 'vaccine_id, antigen_name, brand_name, manufacturer, category, vaccine_type, is_deleted',
    schedules: 'schedule_id, schedule_master_id, name, vaccine_id, total_doses, dose_number, is_deleted',
    transactions: 'transaction_id, inventory_id, transaction_type, created_at',
    birthhistory: 'birthhistory_id, patient_id',
    immunizations: 'immunization_id, patient_id, visit_id, vaccine_id, administered_date, is_deleted',
    visits: 'visit_id, patient_id, visit_date',
    vitalsigns: 'vital_id, visit_id, patient_id',
    patientschedule: 'patient_schedule_id, patient_id, vaccine_id, scheduled_date, status, is_deleted',
    deworming: 'deworming_id, patient_id, visit_id, administered_date',
    vitamina: 'vitamina_id, patient_id, visit_id, administered_date',
    receiving_reports: 'report_id, delivery_date, status',
    receiving_report_items: 'item_id, report_id, vaccine_id',
    metadata: 'key'
  })

  // Version 2 upgrades
  adminDB.version(2).stores({
    patients: 'patient_id, full_name, surname, firstname, date_of_birth, is_deleted',
    users: 'user_id, role, username, contact_number, is_deleted',
    inventory: 'id, inventory_id, vaccine_id, lot_number, expiration_date, is_deleted',
    vaccines: 'vaccine_id, antigen_name, brand_name, manufacturer, category, vaccine_type, is_deleted',
    schedules: 'schedule_id, schedule_master_id, name, vaccine_id, total_doses, dose_number, is_deleted',
    immunizations: 'immunization_id, patient_id, visit_id, vaccine_id, administered_date, is_deleted',
    patientschedule: 'patient_schedule_id, patient_id, vaccine_id, scheduled_date, status, is_deleted'
  })
  adminDB.version(2).upgrade(async () => {
    console.log('🔄 Upgrading AdminOfflineDB to version 2 - adding is_deleted indexes')
    try {
      await clearAdminOfflineData()
      console.log('✅ AdminOfflineDB upgraded successfully')
    } catch (error) {
      console.error('❌ Failed to upgrade AdminOfflineDB:', error)
    }
  })

  // Version 3 upgrades
  adminDB.version(3).stores({
    vaccines: 'vaccine_id, antigen_name, brand_name, manufacturer, category, vaccine_type, is_deleted'
  })
  adminDB.version(3).upgrade(async () => {
    console.log('🔄 Upgrading AdminOfflineDB to version 3 - adding brand_name and manufacturer indexes')
    try {
      await adminDB.vaccines.clear()
      console.log('✅ AdminOfflineDB vaccines table upgraded successfully')
    } catch (error) {
      console.error('❌ Failed to upgrade AdminOfflineDB vaccines table:', error)
    }
  })

  // Version 4 upgrades
  adminDB.version(4).stores({
    schedules: 'schedule_id, schedule_master_id, name, vaccine_id, total_doses, dose_number, is_deleted'
  })
  adminDB.version(4).upgrade(async () => {
    console.log('🔄 Upgrading AdminOfflineDB to version 4 - adding schedule fields')
    try {
      await adminDB.schedules.clear()
      console.log('✅ AdminOfflineDB schedules table upgraded successfully')
    } catch (error) {
      console.error('❌ Failed to upgrade AdminOfflineDB schedules table:', error)
    }
  })

  // Version 5: add schedule_doses table for dose entries
  adminDB.version(5).stores({
    schedule_doses: 'id, schedule_master_id, dose_number'
  })
  adminDB.version(5).upgrade(async () => {
    console.log('🔄 Upgrading AdminOfflineDB to version 5 - adding schedule_doses table')
    try {
      // Nothing to clear (new table). Future migrations could normalize existing dose rows.
      console.log('✅ AdminOfflineDB schedule_doses table added')
    } catch (error) {
      console.error('❌ Failed to add schedule_doses table:', error)
    }
  })

  console.log('✅ AdminOfflineDB initialized / re-initialized')
  return adminDB
}

// Initialize immediately on first import
if (!adminDB) {
  initAdminOfflineDB()
}

// The version schema below is redundant but kept for reference - actual schema is defined above in initAdminOfflineDB()
// Define the schema - caching admin data
adminDB.version(1).stores({
  /**
   * patients - Caches all patient records for offline viewing
   * Primary key: patient_id (matches Supabase)
   * Indexes: full_name, surname, firstname, date_of_birth, is_deleted (for filtering)
   * Includes: mother_name, father_name, and other parent details
   */
  patients: 'patient_id, full_name, surname, firstname, date_of_birth, is_deleted',

  /**
   * guardians - Caches all guardian/parent records
   * Primary key: guardian_id (matches Supabase)
   * Indexes: full_name, contact_number (for offline search)
   */
  guardians: 'guardian_id, full_name, contact_number',

  /**
   * users - Caches all user accounts (admin, staff, guardians)
   * Primary key: user_id (matches Supabase)
   * Indexes: role, username, contact_number, is_deleted (for filtering)
   */
  users: 'user_id, role, username, contact_number, is_deleted',

  /**
   * healthworkers - Caches health worker directory
   * Primary key: health_worker_id (matches Supabase)
   * Indexes: full_name, contact_number
   */
  healthworkers: 'health_worker_id, full_name, contact_number',

  /**
   * inventory - Caches vaccine stock/inventory records
   * Primary key: id (mapped from inventory_id - Dexie requires "id" for auto-increment)
   * Indexes: inventory_id, vaccine_id, lot_number, expiration_date, is_deleted (for filtering)
   */
  inventory: 'id, inventory_id, vaccine_id, lot_number, expiration_date, is_deleted',

  /**
   * vaccines - Caches vaccine types master list
   * Primary key: vaccine_id (matches Supabase)
   * Indexes: antigen_name, brand_name, manufacturer, category, vaccine_type, is_deleted (for filtering)
   */
  vaccines: 'vaccine_id, antigen_name, brand_name, manufacturer, category, vaccine_type, is_deleted',

  /**
   * schedules - Caches vaccine schedule templates
   * Primary key: schedule_id (matches Supabase)
   * Indexes: vaccine_id, dose_number, schedule_master_id, name, is_deleted (for filtering)
   */
  schedules: 'schedule_id, schedule_master_id, name, vaccine_id, total_doses, dose_number, is_deleted',

  /**
   * transactions - Caches vaccine inventory transaction history
   * Primary key: transaction_id (matches Supabase)
   * Indexes: inventory_id, transaction_type, created_at (for offline filtering)
   */
  transactions: 'transaction_id, inventory_id, transaction_type, created_at',

  /**
   * birthhistory - Caches birth history/medical history for patients
   * Primary key: birthhistory_id (matches Supabase)
   * Index: patient_id (for querying by patient)
   */
  birthhistory: 'birthhistory_id, patient_id',

  /**
   * immunizations - Caches vaccination records
   * Primary key: immunization_id (matches Supabase)
   * Indexes: patient_id, visit_id, vaccine_id, administered_date, is_deleted (for filtering)
   */
  immunizations: 'immunization_id, patient_id, visit_id, vaccine_id, administered_date, is_deleted',

  /**
   * visits - Caches medical visit records
   * Primary key: visit_id (matches Supabase)
   * Indexes: patient_id, visit_date
   */
  visits: 'visit_id, patient_id, visit_date',

  /**
   * vitalsigns - Caches vital signs (weight, height, etc.)
   * Primary key: vital_id (matches Supabase)
   * Indexes: visit_id, patient_id
   */
  vitalsigns: 'vital_id, visit_id, patient_id',

  /**
   * patientschedule - Caches vaccination schedule
   * Primary key: patient_schedule_id (matches Supabase)
   * Indexes: patient_id, vaccine_id, scheduled_date, status, is_deleted (for filtering)
   */
  patientschedule: 'patient_schedule_id, patient_id, vaccine_id, scheduled_date, status, is_deleted',

  /**
   * deworming - Caches deworming records
   * Primary key: deworming_id (matches Supabase)
   * Indexes: patient_id, visit_id, administered_date
   */
  deworming: 'deworming_id, patient_id, visit_id, administered_date',

  /**
   * vitamina - Caches Vitamin A supplementation records
   * Primary key: vitamina_id (matches Supabase)
   * Indexes: patient_id, visit_id, administered_date
   */
  vitamina: 'vitamina_id, patient_id, visit_id, administered_date',

  /**
   * receiving_reports - Caches receiving reports for vaccine inventory
   * Primary key: report_id (matches Supabase)
   * Indexes: delivery_date, status
   */
  receiving_reports: 'report_id, delivery_date, status',

  /**
   * receiving_report_items - Caches receiving report items
   * Primary key: item_id (matches Supabase)
   * Indexes: report_id, vaccine_id
   */
  receiving_report_items: 'item_id, report_id, vaccine_id',

  /**
   * metadata - Caches metadata like cache timestamps and stats
   * Primary key: key
   */
  metadata: 'key'
})

// Add upgrade path for version 2 - add is_deleted indexes
adminDB.version(2).stores({
  // Version 2: Add is_deleted indexes for proper filtering
  patients: 'patient_id, full_name, surname, firstname, date_of_birth, is_deleted',
  users: 'user_id, role, username, contact_number, is_deleted',
  inventory: 'id, inventory_id, vaccine_id, lot_number, expiration_date, is_deleted',
  vaccines: 'vaccine_id, antigen_name, brand_name, manufacturer, category, vaccine_type, is_deleted',
  schedules: 'schedule_id, schedule_master_id, name, vaccine_id, total_doses, dose_number, is_deleted',
  immunizations: 'immunization_id, patient_id, visit_id, vaccine_id, administered_date, is_deleted',
  patientschedule: 'patient_schedule_id, patient_id, vaccine_id, scheduled_date, status, is_deleted'
})

// Handle database upgrades
adminDB.version(2).upgrade(async () => {
  console.log('🔄 Upgrading AdminOfflineDB to version 2 - adding is_deleted indexes')
  try {
    // Clear existing data since schema changed (indexes added)
    await clearAdminOfflineData()
    console.log('✅ AdminOfflineDB upgraded successfully')
  } catch (error) {
    console.error('❌ Failed to upgrade AdminOfflineDB:', error)
  }
})

// Add upgrade path for version 3 - add brand_name and manufacturer indexes to vaccines
adminDB.version(3).stores({
  vaccines: 'vaccine_id, antigen_name, brand_name, manufacturer, category, vaccine_type, is_deleted'
})

// Handle database upgrades for version 3
adminDB.version(3).upgrade(async () => {
  console.log('🔄 Upgrading AdminOfflineDB to version 3 - adding brand_name and manufacturer indexes')
  try {
    // Clear existing vaccine data since schema changed (indexes added)
    await adminDB.vaccines.clear()
    console.log('✅ AdminOfflineDB vaccines table upgraded successfully')
  } catch (error) {
    console.error('❌ Failed to upgrade AdminOfflineDB vaccines table:', error)
  }
})

// Add upgrade path for version 4 - add schedule fields
adminDB.version(4).stores({
  schedules: 'schedule_id, schedule_master_id, name, vaccine_id, total_doses, dose_number, is_deleted'
})

// Handle database upgrades for version 4
adminDB.version(4).upgrade(async () => {
  console.log('🔄 Upgrading AdminOfflineDB to version 4 - adding schedule fields')
  try {
    // Clear existing schedule data since schema changed (fields added)
    await adminDB.schedules.clear()
    console.log('✅ AdminOfflineDB schedules table upgraded successfully')
  } catch (error) {
    console.error('❌ Failed to upgrade AdminOfflineDB schedules table:', error)
  }
})
// Version 5: add schedule_doses table for dose entries
adminDB.version(5).stores({
  schedule_doses: 'id, schedule_master_id, dose_number'
})
adminDB.version(5).upgrade(async () => {
  console.log('🔄 Upgrading AdminOfflineDB to version 5 - adding schedule_doses table')
  try {
    // Nothing to clear (new table). Future migrations could normalize existing dose rows.
    console.log('✅ AdminOfflineDB schedule_doses table added')
  } catch (error) {
    console.error('❌ Failed to add schedule_doses table:', error)
  }
})

// console.log handled inside init

/**
 * Clear all admin offline data (for logout/security)
 */
export async function clearAdminOfflineData() {
  try {
    console.log('🗑️ Clearing AdminOfflineDB...')
    await adminDB.patients.clear()
    await adminDB.guardians.clear()
    await adminDB.users.clear()
    await adminDB.healthworkers.clear()
    await adminDB.inventory.clear()
    await adminDB.vaccines.clear()
    await adminDB.schedules.clear()
    if (adminDB.schedule_doses) await adminDB.schedule_doses.clear()
    await adminDB.transactions.clear()
    await adminDB.birthhistory.clear()
    await adminDB.immunizations.clear()
    await adminDB.visits.clear()
    await adminDB.vitalsigns.clear()
    await adminDB.patientschedule.clear()
    await adminDB.deworming.clear()
    await adminDB.vitamina.clear()
    await adminDB.receiving_reports.clear()
    await adminDB.receiving_report_items.clear()
    await adminDB.metadata.clear()
    console.log('✅ AdminOfflineDB cleared')
  } catch (error) {
    console.error('❌ Failed to clear AdminOfflineDB:', error)
  }
}

/**
 * Get AdminOfflineDB statistics (for debugging)
 */
export async function getAdminDatabaseInfo() {
  try {
    const patientCount = await adminDB.patients.count()
    const guardianCount = await adminDB.guardians.count()
    const userCount = await adminDB.users.count()
    const healthworkerCount = await adminDB.healthworkers.count()
    const inventoryCount = await adminDB.inventory.count()
    const vaccineCount = await adminDB.vaccines.count()
    const scheduleCount = await adminDB.schedules.count()
    const transactionCount = await adminDB.transactions.count()
    const vitaminaCount = await adminDB.vitamina.count()
    const receivingReportsCount = await adminDB.receiving_reports.count()
    const receivingReportItemsCount = await adminDB.receiving_report_items.count()

    return {
      name: adminDB.name,
      version: adminDB.verno,
      isOpen: adminDB.isOpen(),
      tables: {
        patients: patientCount,
        guardians: guardianCount,
        users: userCount,
        healthworkers: healthworkerCount,
        inventory: inventoryCount,
        vaccines: vaccineCount,
        schedules: scheduleCount,
        transactions: transactionCount,
        vitamina: vitaminaCount,
        receiving_reports: receivingReportsCount,
        receiving_report_items: receivingReportItemsCount
      },
      total: patientCount + guardianCount + userCount + healthworkerCount +
             inventoryCount + vaccineCount + scheduleCount + transactionCount +
             vitaminaCount + receivingReportsCount + receivingReportItemsCount
    }
  } catch (error) {
    console.error('❌ Failed to get AdminOfflineDB info:', error)
    return null
  }
}

// Re-export for backward compatibility
export { adminDB }
export default adminDB