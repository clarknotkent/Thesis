import Dexie from 'dexie';

export const db = new Dexie('GuardianOfflineDB');
db.version(2).stores({
  guardians: 'id, profile, notifications, conversations',
  patients: 'id, guardianId, details, visits, vitals, schedules, birthHistory, immunizations',
  faqs: 'faq_id, question, answer, tags',
  messageQueue: 'id, message, timestamp',
  profileEdits: 'id, changes, timestamp'
});

console.log('IndexedDB initialized for GuardianOfflineDB');