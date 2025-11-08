/**
 * StaffOfflineDB - Primary database for Admin and Health Staff offline access.
 * This database is separate from 'ParentPortalOfflineDB' to manage data scoping
 * and to be easily wiped on logout for security.
 * 
 * SECURITY: This database is completely wiped on logout to prevent
 * sensitive patient data from persisting in the browser.
 * 
 * SHARED BY: Both Admin and HealthStaff roles (same permissions, same data)
 * CACHED DATA: Patients, Guardians, and Inventory (read-only offline access)
 */
import Dexie from 'dexie'

// Export the Admin/Staff database
export const db = new Dexie('StaffOfflineDB')

// Define the schema - caching patients (with details), guardians, users, inventory, and birthhistory
db.version(1).stores({
  /**
   * patients - Caches patient records for offline viewing
   * Primary key: patient_id (matches Supabase)
   * Indexes: full_name (for offline search/sorting)
   * Includes: mother_name, father_name, and other parent details
   */
  patients: 'patient_id, full_name, surname, firstname, date_of_birth',

  /**
   * guardians - Caches guardian/parent records
   * Primary key: guardian_id (matches Supabase)
   * Indexes: full_name, contact_number (for offline search)
   */
  guardians: 'guardian_id, full_name, contact_number',

  /**
   * users - Caches guardian/parent user accounts only (NOT admin/staff)
   * Primary key: user_id (matches Supabase)
   * Indexes: role, username, contact_number (for offline search)
   */
  users: 'user_id, role, username, contact_number',

  /**
   * inventory - Caches vaccine stock/inventory records
   * Primary key: id (mapped from inventory_id - Dexie requires "id" for auto-increment)
   * Indexes: inventory_id, vaccine_id, lot_number, expiration_date (for offline filtering)
   */
  inventory: 'id, inventory_id, vaccine_id, lot_number, expiration_date',

  /**
   * birthhistory - Caches birth history/medical history for patients
   * Primary key: birthhistory_id (matches Supabase)
   * Index: patient_id (for querying by patient)
   */
  birthhistory: 'birthhistory_id, patient_id',

  /**
   * immunizations - Caches vaccination records
   * Primary key: immunization_id (matches Supabase)
   * Indexes: patient_id, visit_id, vaccine_id, administered_date
   */
  immunizations: 'immunization_id, patient_id, visit_id, vaccine_id, administered_date',

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
   * Indexes: patient_id, vaccine_id, scheduled_date, status
   */
  patientschedule: 'patient_schedule_id, patient_id, vaccine_id, scheduled_date, status',

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
   * vaccines - Caches vaccine types master list
   * Primary key: vaccine_id (matches Supabase)
   * Indexes: antigen_name, category, vaccine_type (for offline filtering)
   */
  vaccines: 'vaccine_id, antigen_name, category, vaccine_type',

  /**
   * transactions - Caches vaccine inventory transaction history
   * Primary key: transaction_id (matches Supabase)
   * Indexes: inventory_id, transaction_type, created_at (for offline filtering)
   */
  transactions: 'transaction_id, inventory_id, transaction_type, created_at'
})

console.log('✅ StaffOfflineDB (Admin/HealthStaff) initialized')

/**
 * Clear all staff offline data (for logout/security)
 */
export async function clearStaffOfflineData() {
  try {
    console.log('🗑️ Clearing StaffOfflineDB...')
    await db.patients.clear()
    await db.guardians.clear()
    await db.users.clear()
    await db.inventory.clear()
    await db.birthhistory.clear()
    await db.immunizations.clear()
    await db.visits.clear()
    await db.vitalsigns.clear()
    await db.patientschedule.clear()
    await db.deworming.clear()
    await db.vitamina.clear()
    await db.vaccines.clear()
    await db.transactions.clear()
    console.log('✅ StaffOfflineDB cleared')
  } catch (error) {
    console.error('❌ Failed to clear StaffOfflineDB:', error)
  }
}

/**
 * Get StaffOfflineDB statistics (for debugging)
 */
export async function getStaffDatabaseInfo() {
  try {
    const patientCount = await db.patients.count()
    const guardianCount = await db.guardians.count()
    const userCount = await db.users.count()
    const inventoryCount = await db.inventory.count()
    
    return {
      name: db.name,
      version: db.verno,
      isOpen: db.isOpen(),
      tables: {
        patients: patientCount,
        guardians: guardianCount,
        users: userCount,
        inventory: inventoryCount
      },
      total: patientCount + guardianCount + userCount + inventoryCount
    }
  } catch (error) {
    console.error('❌ Failed to get StaffOfflineDB info:', error)
    return null
  }
}

// NOTE: ParentPortalOfflineDB is NOT imported here to prevent it from
// being created when Admin users log in. It will be lazy-loaded only
// when guardian/parent users access parent-specific features.

// Re-export for backward compatibility
export default db
