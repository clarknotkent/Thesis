/**
 * StaffOfflineDB - Primary database for Admin and Health Staff offline access.
 * This database is separate from 'ParentPortalOfflineDB' to manage data scoping
 * and to be easily wiped on logout for security.
 * 
 * SECURITY: This database is completely wiped on logout to prevent
 * sensitive patient data from persisting in the browser.
 * 
 * SHARED BY: Both Admin and HealthStaff roles (same permissions, same data)
 * CACHED DATA: Patients and Inventory only (read-only offline access)
 */
import Dexie from 'dexie'

// Export the Admin/Staff database
export const db = new Dexie('StaffOfflineDB')

// Define the schema - only caching 'patients' and 'inventory' for Admin/Staff
db.version(1).stores({
  /**
   * patients - Caches patient records for offline viewing
   * Primary key: patient_id (matches Supabase)
   * Indexes: full_name (for offline search/sorting)
   */
  patients: 'patient_id, full_name, surname, firstname, date_of_birth',

  /**
   * inventory - Caches vaccine stock/inventory records
   * Primary key: id (matches Supabase vaccine_stocks table)
   * Indexes: vaccine_id, lot_no (for offline filtering)
   */
  inventory: 'id, vaccine_id, lot_no, expiry_date'
})

console.log('✅ StaffOfflineDB (Admin/HealthStaff) initialized')

// NOTE: ParentPortalOfflineDB is NOT imported here to prevent it from
// being created when Admin users log in. It will be lazy-loaded only
// when guardian/parent users access parent-specific features.

// Re-export for backward compatibility
export default db
