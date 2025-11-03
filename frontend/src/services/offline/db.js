/**
 * Local Database Configuration using Dexie.js
 * 
 * This file initializes the local IndexedDB database for offline-first functionality.
 * All form data is saved here first, then synced to Supabase via the sync service.
 */

import Dexie from 'dexie';

/**
 * Initialize Dexie database instance
 * Database name: ImmunizationDB
 */
const db = new Dexie('ImmunizationDB');

/**
 * Define database schema (version 3 - Add indexes for pending_uploads.status & created_at)
 * 
 * Schema includes:
 * 
 * === Health Worker Tables (offline-first writes) ===
 * - patients: Local copy of patient records from Supabase
 *   - id: Primary key (Supabase UUID)
 *   - updated_at: Timestamp for conflict resolution
 *   - lastName: Indexed for efficient local search
 * 
 * - immunizations: Local copy of immunization records from Supabase
 *   - id: Primary key (Supabase UUID)
 *   - patient_id: Foreign key to patients table
 *   - updated_at: Timestamp for conflict resolution
 * 
 * === Parent/Guardian Tables (offline-first reads) ===
 * - children: Parent's children data (read-only cache)
 *   - id: Primary key (patient_id from Supabase)
 *   - guardian_id: Foreign key to identify parent's children
 *   - name: Full name for quick display
 * 
 * - schedules: Vaccination schedules for all children (read-only cache)
 *   - id: Primary key (patient_schedule_id from Supabase)
 *   - patient_id: Foreign key to children table
 *   - scheduled_date: Indexed for date-based queries
 * 
 * - notifications: User notifications (read-only cache)
 *   - id: Primary key (notification_id from Supabase)
 *   - created_at: Timestamp for sorting
 * 
 * - guardian_profile: Single-record table for logged-in guardian profile
 *   - id: Always 1 (single record per logged-in user)
 * 
 * === Sync Management ===
 * - pending_uploads: Outbox pattern table for tracking pending syncs
 *   - ++id: Auto-incrementing primary key (ensures FIFO processing)
 *   - type: Type of operation (e.g., 'patient', 'immunization')
 */
// v2 existed previously. We bump to v3 to add missing indexes on pending_uploads.
db.version(2).stores({
  // Health Worker tables
  patients: 'id, updated_at, lastName',
  immunizations: 'id, patient_id, updated_at',
  
  // Parent/Guardian tables
  children: 'id, guardian_id, name',
  schedules: 'id, patient_id, scheduled_date',
  notifications: 'id, created_at',
  guardian_profile: 'id',
  
  // Sync management
  pending_uploads: '++id, type'
}).upgrade(tx => {
  // Migration function for existing databases
  console.log('📦 Upgrading Dexie database from v1 to v2 - adding parent tables');
});

// v3: Add indexes used by syncService (status filter, created_at sort)
db.version(3).stores({
  // Health Worker tables
  patients: 'id, updated_at, lastName',
  immunizations: 'id, patient_id, updated_at',

  // Parent/Guardian tables
  children: 'id, guardian_id, name',
  schedules: 'id, patient_id, scheduled_date',
  notifications: 'id, created_at',
  guardian_profile: 'id',

  // Sync management
  // Add indexes for status and created_at so queries like where('status') work
  pending_uploads: '++id, type, status, created_at'
}).upgrade(async tx => {
  // Ensure existing records have created_at/status fields where missing
  try {
    const table = tx.table('pending_uploads');
    await table.toCollection().modify(item => {
      if (!item.created_at) item.created_at = new Date().toISOString();
      if (!item.status) item.status = 'pending';
    });
    console.log('🔧 Upgraded pending_uploads: added defaults for created_at/status');
  } catch (e) {
    console.warn('⚠️ v3 upgrade: could not backfill pending_uploads defaults', e);
  }
});

export default db;
