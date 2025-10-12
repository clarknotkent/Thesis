const notificationsModel = require('../models/notificationsModel');
const supabase = require('../db');

// Basic scheduler script to insert reminders for vaccination schedules
// Usage: node scripts/notification-scheduler.js

async function loadSettings() {
  // Try to read settings table if exists, otherwise fallback
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', 'notifications').limit(1);
    if (data && data[0] && data[0].value) return data[0].value;
  } catch (e) {}
  // Default reminder days (relative to due date)
  return { reminderDays: [14, 7, 0] };
}

async function scheduleReminders() {
  const settings = await loadSettings();
  const reminderDays = (settings.reminderDays && Array.isArray(settings.reminderDays)) ? settings.reminderDays : [14,7,0];

  const now = new Date();

  for (const daysBefore of reminderDays) {
    const target = new Date(now);
    target.setDate(now.getDate() + daysBefore);
    const targetDateStr = target.toISOString().slice(0,10);

    // Look up patient schedules with scheduled_date = targetDateStr
    // Use patientschedule_view which contains patient and guardian info
    const { data: schedules, error } = await supabase.from('patientschedule_view').select('*').eq('scheduled_date', targetDateStr).eq('is_deleted', false);
    if (error) {
      console.error('Error fetching schedules for', targetDateStr, error);
      continue;
    }
    for (const s of schedules || []) {
      // Compose notification
      const message = `Reminder: ${s.antigen_name} dose ${s.dose_number} is scheduled on ${s.scheduled_date}`;
      const payload = {
        channel: 'in_app',
        recipient_user_id: s.guardian_user_id || null,
        recipient_phone: s.guardian_contact || null,
        recipient_email: s.guardian_email || null,
        template_code: 'vaccination_due',
        message_body: message,
        related_entity_type: 'patientschedule',
        related_entity_id: s.patient_schedule_id || null,
        scheduled_at: new Date().toISOString(),
      };
      try {
        await notificationsModel.insertNotification(payload, null);
        console.log('Inserted reminder for schedule', s.patient_schedule_id);
      } catch (e) {
        console.error('Failed to insert reminder for', s.patient_schedule_id, e.message);
      }
    }
  }
}

if (require.main === module) {
  scheduleReminders().then(()=>{
    console.log('Notification scheduler finished');
    process.exit(0);
  }).catch(err=>{
    console.error('Scheduler error', err);
    process.exit(1);
  });
}

module.exports = {
  scheduleReminders,
};
