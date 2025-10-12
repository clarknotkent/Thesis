#!/usr/bin/env node
/*
  Script: generate-reminders.js
  Purpose: Insert notification rows for upcoming scheduled immunizations (14,7,0 days reminders)
  Usage: node scripts/generate-reminders.js
*/
const supabase = require('../db');
const { createNotification } = require('../models/notificationModel');

async function isoDateDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(8, 0, 0, 0); // schedule at 08:00 local
  return d.toISOString();
}

async function generate() {
  try {
    // Days offsets for reminders; configurable later
    const reminders = [14, 7, 0];
    for (const days of reminders) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const iso = targetDate.toISOString().split('T')[0];

      console.log(`Generating reminders for date=${iso} (offset ${days})`);

      // Query patientschedule_view for schedules matching scheduled_date = iso and status not Completed
      const { data: rows, error } = await supabase
        .from('patientschedule_view')
        .select('patient_schedule_id, patient_id, patient_name, guardian_contact_number, guardian_email, guardian_user_id, vaccine_id, antigen_name')
        .eq('scheduled_date', iso)
        .neq('status', 'Completed')
        .eq('is_deleted', false);
      if (error) {
        console.error('Failed to query patientschedule_view', error);
        continue;
      }

      for (const r of rows || []) {
        // Prepare notification
        const msg = `Reminder: ${r.antigen_name} scheduled for ${iso} for ${r.patient_name}`;
        const payload = {
          channel: 'in-app',
          recipient_user_id: r.guardian_user_id || null,
          recipient_phone: r.guardian_contact_number || null,
          recipient_email: r.guardian_email || null,
          template_code: 'SCHEDULE_REMINDER',
          message_body: msg,
          related_entity_type: 'patientschedule',
          related_entity_id: r.patient_schedule_id,
          scheduled_at: await isoDateDaysFromNow(days),
          status: 'scheduled'
        };
        try {
          await createNotification(payload, supabase);
        } catch (err) {
          console.error('Failed to create notification for schedule', r.patient_schedule_id, err.message || err);
        }
      }
    }

    console.log('generate-reminders finished');
    process.exit(0);
  } catch (err) {
    console.error('generate-reminders error', err);
    process.exit(1);
  }
}

generate();
