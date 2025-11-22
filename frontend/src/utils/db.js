import Dexie from 'dexie'

// Mutable reference so we can fully recreate after delete()
let guardianDB = null

export function initGuardianOfflineDB() {
  // If already open, reuse
  if (guardianDB && guardianDB.isOpen()) {
    return guardianDB
  }
  guardianDB = new Dexie('GuardianOfflineDB')
  guardianDB.version(2).stores({
    guardians: 'id, profile, notifications, conversations',
    patients: 'id, guardianId, details, visits, vitals, schedules, birthHistory, immunizations',
    faqs: 'faq_id, question, answer, tags',
    messageQueue: 'id, message, timestamp',
    profileEdits: 'id, changes, timestamp'
  })
  console.log('✅ GuardianOfflineDB initialized / re-initialized')
  return guardianDB
}

// Initialize immediately on first import
initGuardianOfflineDB()

// Maintain existing export name `db`
export { guardianDB as db }
export default guardianDB