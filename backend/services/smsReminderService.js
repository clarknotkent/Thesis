import moment from 'moment-timezone';
import serviceSupabase from '../db.js';
import smsService from './smsService.js';
import { logActivity } from '../models/activityLogger.js';
import { ACTIVITY } from '../constants/activityTypes.js';

// Helper to use provided client or default service client
function withClient(client) {
  return client || serviceSupabase;
}

// Fetch patient full name, guardian contact, and relationship for SMS. Falls back if patients_view is unavailable.
async function getPatientSmsInfo(patientId, supabase) {
  // Try patients_view first
  try {
    const { data: pv } = await supabase
      .from('patients_view')
      .select('patient_id, full_name, guardian_contact_number, guardian_relationship, guardian_last_name')
      .eq('patient_id', patientId)
      .maybeSingle();
    if (pv) {
      // Try to also fetch guardian_id from patients table so we can store it in sms_logs
      let guardianId = null;
      try {
        const { data: pr } = await supabase
          .from('patients')
          .select('guardian_id')
          .eq('patient_id', patientId)
          .maybeSingle();
        guardianId = pr?.guardian_id || null;
      } catch (_) {}
      return {
        full_name: pv.full_name || null,
        guardian_contact_number: pv.guardian_contact_number || null,
        guardian_relationship: pv.guardian_relationship || null,
        guardian_last_name: pv.guardian_last_name || null,
        guardian_id: guardianId,
      };
    }
  } catch (_) { /* fall through */ }

  // Fallback to base tables
  try {
    const { data: patient } = await supabase
      .from('patients')
      .select('patient_id, firstname, middlename, surname, guardian_id, relationship_to_guardian, mother_name, father_name, mother_contact_number, father_contact_number')
      .eq('patient_id', patientId)
      .maybeSingle();
    if (!patient) return null;
    const full_name = [patient.firstname, patient.middlename, patient.surname].filter(Boolean).join(' ').trim() || null;
    let guardian_contact_number = null;
    let guardian_last_name = null;
    if (patient.guardian_id) {
      const { data: g } = await supabase
        .from('guardians')
        .select(`
          guardian_id,
          contact_number,
          users:users!guardians_user_id_fkey ( surname, contact_number )
        `)
        .eq('guardian_id', patient.guardian_id)
        .eq('is_deleted', false)
        .maybeSingle();
      if (g) {
        guardian_contact_number = g.contact_number || (Array.isArray(g.users) ? g.users[0]?.contact_number : g.users?.contact_number) || null;
        guardian_last_name = (Array.isArray(g.users) ? g.users[0]?.surname : g.users?.surname) || null;
      }
    }
    // Fallback to mother/father contact if guardian missing
    if (!guardian_contact_number) {
      const rel = (patient.relationship_to_guardian || '').toLowerCase();
      if (rel === 'mother') guardian_contact_number = patient.mother_contact_number || null;
      else if (rel === 'father') guardian_contact_number = patient.father_contact_number || null;
    }
    return {
      full_name,
      guardian_contact_number,
      guardian_relationship: patient.relationship_to_guardian || null,
      guardian_last_name,
      guardian_id: patient.guardian_id || null,
    };
  } catch (_) {
    return null;
  }
}

// Parse reminder day offsets from env or use default [7,3,1,0]
function getReminderOffsets() {
  const raw = process.env.SMS_REMINDER_DAYS;
  if (!raw) return [7, 3, 1, 0];
  try {
    return String(raw)
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => Number.isFinite(n));
  } catch (_) {
    return [7, 3, 1, 0];
  }
}

// Parse reminder send time from env (PHT). Accepts formats like "08:00", "8:00 AM", "20:30". Defaults to 08:00.
function getReminderTime(tz = 'Asia/Manila') {
  const raw = (process.env.SMS_REMINDER_TIME || '08:00').trim();
  // Try common patterns
  let m = moment.tz(raw, ['H:mm', 'HH:mm', 'h:mm A', 'h:mmA', 'hh:mm A', 'hh:mmA'], true, tz);
  if (!m.isValid()) {
    // Fallback: try extracting numbers like "935" => 09:35
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.length === 3 || digits.length === 4) {
      const hh = digits.length === 3 ? `0${digits[0]}` : digits.slice(0, 2);
      const mm = digits.slice(-2);
      m = moment.tz(`${hh}:${mm}`, 'HH:mm', true, tz);
    }
  }
  if (!m.isValid()) {
    m = moment.tz('08:00', 'HH:mm', true, tz);
  }
  const hour = m.hour();
  const minute = m.minute();
  const display = moment.tz(tz).hour(hour).minute(minute).second(0).format('hh:mm A [PHT]');
  return { hour, minute, display };
}

// Compute 08:00 Asia/Manila on scheduled_date - offset days, return ISO string (UTC)
function computeRunAtISO(scheduledDateISO, offsetDays, tz = 'Asia/Manila') {
  const base = moment.tz(scheduledDateISO, tz).startOf('day');
  const { hour, minute } = getReminderTime(tz);
  // Configured time of the day (scheduled_date - offset)
  const runLocal = base.clone().subtract(offsetDays, 'days').hour(hour).minute(minute).second(0).millisecond(0);
  return runLocal.toDate().toISOString();
}

// Build a simple message if no template system is used for SMS logs
function buildReminderMessage({ antigenName, patientName, scheduledDateISO }) {
  const d = new Date(scheduledDateISO);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  // Show time in Philippine Time so recipients know when reminders are sent
  const timeCfg = getReminderTime('Asia/Manila');
  const timePHT = moment.tz('Asia/Manila').hour(timeCfg.hour).minute(timeCfg.minute).second(0).format('hh:mm A [PHT]');
  return `Reminder: ${antigenName || 'vaccine'} vaccination for ${patientName || 'patient'} on ${yyyy}-${mm}-${dd} at ${timePHT}`;
}

/**
 * Create scheduled SMS logs (and link rows) for a given patient_schedule.
 * Combines all same-day schedules for the same patient into one SMS per reminder offset.
 * - Loads all upcoming schedules for the patient on the same date
 * - Creates up to N combined reminder logs at configured offsets
 * - Only inserts reminders whose runAt >= now (to avoid back-sending old reminders for new schedules)
 * - Links each created sms_logs row to all relevant patient_schedule_ids via sms_log_patientschedule
 */
async function scheduleReminderLogsForPatientSchedule(patientScheduleId, client) {
  const supabase = withClient(client);
  const OFFSETS = getReminderOffsets();

  // 1) Load the triggering schedule
  const { data: triggerSched, error: sErr } = await supabase
    .from('patientschedule')
    .select('patient_schedule_id, patient_id, vaccine_id, scheduled_date, is_deleted')
    .eq('patient_schedule_id', patientScheduleId)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!triggerSched || triggerSched.is_deleted) return { created: 0, skipped: 'not-found' };
  if (!triggerSched.scheduled_date) return { created: 0, skipped: 'no-scheduled-date' };

  // 2) Patient info (phone/name) and guardian relationship (with fallback)
  const patientRow = await getPatientSmsInfo(triggerSched.patient_id, supabase);
  const normalizedPhone = patientRow?.guardian_contact_number ? smsService.formatPhoneNumber(patientRow.guardian_contact_number) : null;
  if (!patientRow || !normalizedPhone) return { created: 0, skipped: 'no-guardian-phone' };

  // 2.5) Check guardian auto-send setting - skip if disabled
  if (patientRow.guardian_id) {
    const { data: autoSendSetting, error: autoSendErr } = await supabase
      .from('guardian_auto_send_settings')
      .select('auto_send_enabled')
      .eq('guardian_id', patientRow.guardian_id)
      .maybeSingle();

    if (autoSendErr) {
      console.warn('[scheduleReminder] Error checking auto-send setting:', autoSendErr?.message || autoSendErr);
    } else if (autoSendSetting && autoSendSetting.auto_send_enabled === false) {
      console.log(`[scheduleReminder] Skipping SMS creation for patient ${triggerSched.patient_id} - guardian ${patientRow.guardian_id} has auto-send disabled`);
      return { created: 0, skipped: 'auto-send-disabled' };
    }
  }

  // 3) Find all schedules for same patient on same date (combine same-day schedules)
  // Align day-boundaries to Asia/Manila and avoid 'Z' to match other queries
  const schedDateLocal = moment.tz(triggerSched.scheduled_date, 'Asia/Manila').format('YYYY-MM-DD');
  const dayStart = `${schedDateLocal}T00:00:00`;
  const dayEnd = `${schedDateLocal}T23:59:59`;
  const { data: allSchedsOnDay, error: allErr } = await supabase
    .from('patientschedule')
    .select('patient_schedule_id, vaccine_id, dose_number')
    .eq('patient_id', triggerSched.patient_id)
    .gte('scheduled_date', dayStart)
    .lte('scheduled_date', dayEnd)
    .eq('is_deleted', false);
  if (allErr) throw allErr;
  if (!allSchedsOnDay || allSchedsOnDay.length === 0) {
    console.log(`[scheduleReminder] No same-day schedules found for patient ${triggerSched.patient_id} on ${schedDateLocal} (range ${dayStart}..${dayEnd})`);
    return { created: 0, skipped: 'no-schedules-found' };
  }

  // Ensure existing pending/scheduled logs use current guardian phone so dedupe can match
  try {
    if (patientRow.guardian_contact_number) {
      await updatePhoneNumberForPatient(triggerSched.patient_id, patientRow.guardian_contact_number, supabase);
    }
  } catch (e) {
    console.warn('[scheduleReminder] phone normalization failed:', e?.message || e);
  }

  // 4) Gather vaccine names and doses for combined message
  const vaccineIds = [...new Set(allSchedsOnDay.map(s => s.vaccine_id).filter(Boolean))];
  let vaccineNames = [];
  let doseList = [];
  if (vaccineIds.length > 0) {
    try {
      const { data: vacs } = await supabase
        .from('vaccinemaster')
        .select('vaccine_id, antigen_name')
        .in('vaccine_id', vaccineIds);
      const nameMap = new Map((vacs || []).map(v => [v.vaccine_id, v.antigen_name]));

      vaccineNames = allSchedsOnDay
        .map(s => nameMap.get(s.vaccine_id) || 'vaccine')
        .filter(Boolean);

      doseList = allSchedsOnDay.map(s => `Dose ${s.dose_number || 1}`);
    } catch (_) {}
  }

  const combinedVaccineName = vaccineNames.length > 0
    ? vaccineNames.join(', ')
    : 'vaccines';
  const combinedDoseNumber = doseList.length > 0
    ? doseList.join(', ')
    : 'Dose 1';

  // Build clean multi-line vaccine list (e.g., "- Vaccine A (Dose 1)\n- Vaccine B (Dose 2)")
  const vaccineLines = allSchedsOnDay.map(s => {
    const name = (vaccineNames[allSchedsOnDay.indexOf(s)] || 'vaccine');
    const dose = `Dose ${s.dose_number || 1}`;
    return `- ${name} (${dose})`;
  }).join('\n');
  const patientScheduleIds = allSchedsOnDay.map(s => s.patient_schedule_id);

  const nowISO = new Date().toISOString();
  let created = 0;
  const createdIds = [];
  let linked = 0;

  for (const days of OFFSETS) {
    try {
      const runAt = computeRunAtISO(triggerSched.scheduled_date, days);
      if (runAt < nowISO) {
        // Skip past reminders for newly created schedules
        continue;
      }

      const triggerType = { 7: '1-week', 3: '3-days', 1: '1-day', 0: '0-day' }[days] || null;

      // Deduplicate: check if a log already exists for this patient/phone/runAt
      let existingLogId = null;
      try {
        const { data: existing } = await supabase
          .from('sms_logs')
          .select('id')
          .eq('patient_id', triggerSched.patient_id)
          .eq('phone_number', normalizedPhone)
          .eq('type', 'scheduled')
          .eq('scheduled_at', runAt)
          .limit(1)
          .maybeSingle();
        if (existing) existingLogId = existing.id;
      } catch (_) {}

      if (existingLogId) {
        // Reuse existing SMS: attach any missing patient_schedule_ids
        try {
          const { data: alreadyLinked } = await supabase
            .from('sms_log_patientschedule')
            .select('patient_schedule_id')
            .eq('sms_log_id', existingLogId);
          const linkedSet = new Set((alreadyLinked || []).map(l => l.patient_schedule_id));
          const toLink = patientScheduleIds.filter(psid => !linkedSet.has(psid));
          if (toLink.length > 0) {
            await supabase
              .from('sms_log_patientschedule')
              .insert(toLink.map(psid => ({ sms_log_id: existingLogId, patient_schedule_id: psid })));
            linked += toLink.length;
            console.log(`[scheduleReminder] Reused SMS ${existingLogId} at ${runAt}; linked ${toLink.length}: ${toLink.join(', ')}`);
          } else {
            console.log(`[scheduleReminder] Reused SMS ${existingLogId} at ${runAt}; no new links (already complete)`);
          }
        } catch (linkErr) {
          console.warn('[smsReminderService] link to existing log failed:', linkErr?.message || linkErr);
        }
        continue;
      }

      // Pick template and render message
      let templateId = null;
      let templateText = null;
      if (triggerType) {
        try {
          const { data: tpl } = await supabase
            .from('sms_templates')
            .select('id, template')
            .ilike('trigger_type', triggerType)
            .eq('is_active', true)
            .eq('is_deleted', false)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (tpl) {
            templateId = tpl.id;
            // Normalize escaped newlines (\n) stored in DB to real newlines so templates display correctly
            templateText = typeof tpl.template === 'string' ? tpl.template.replace(/\\n/g, '\n') : tpl.template;
          }
        } catch (_) {}
      }

      // Determine title: Ms. for Mother, Mr. for Father, blank otherwise
      const relationship = (patientRow.guardian_relationship || '').toLowerCase();
      const guardianTitle = relationship === 'mother' ? 'Ms.' : relationship === 'father' ? 'Mr.' : '';

      const timeCfg = getReminderTime('Asia/Manila');
      const greetingTime = (timeCfg.hour >= 6 && timeCfg.hour < 18) ? 'Good Day' : 'Good Evening';
      const scheduledDateLong = moment.tz(triggerSched.scheduled_date, 'Asia/Manila').format('MMMM DD, YYYY');

      const message = templateText
        ? renderTemplate(templateText, {
          patientName: patientRow.full_name,
          guardianLastName: patientRow.guardian_last_name || (patientRow.full_name || '').split(' ').pop() || '',
          guardianTitle,
          vaccineName: combinedVaccineName,
          doseNumber: combinedDoseNumber,
          vaccineLines,
          scheduledDate: scheduledDateLong,
          appointmentTime: timeCfg.display,
          daysUntil: String(days),
          greetingTime,
        })
        : buildReminderMessage({
          antigenName: combinedVaccineName,
          patientName: patientRow.full_name,
          scheduledDateISO: triggerSched.scheduled_date,
        });

      // Insert sms_logs row
      const { data: ins, error: insErr } = await supabase
        .from('sms_logs')
        .insert({
          guardian_id: patientRow.guardian_id || null,
          patient_id: triggerSched.patient_id,
          phone_number: normalizedPhone,
          message,
          type: 'scheduled',
          status: 'pending',
          template_id: templateId,
          scheduled_at: runAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, patient_id, phone_number, scheduled_at, type, status, template_id')
        .single();
      if (insErr) throw insErr;

      // Activity log: queued SMS reminder (normalized)
      try {
        await logActivity({
          action_type: ACTIVITY.MESSAGE.SEND,
          description: `Queued scheduled SMS reminder for patient ${triggerSched.patient_id} on ${schedDateLocal}`,
          user_id: null,
          entity_type: 'sms_log',
          entity_id: ins.id,
          new_value: {
            patient_id: ins.patient_id,
            phone_number: ins.phone_number,
            scheduled_at: ins.scheduled_at,
            type: ins.type,
            status: ins.status,
            template_id: ins.template_id,
          }
        });
      } catch (_) {}

      // Link to all same-day patient schedules
      try {
        await supabase
          .from('sms_log_patientschedule')
          .insert(patientScheduleIds.map(psid => ({ sms_log_id: ins.id, patient_schedule_id: psid })));
      } catch (linkErr) {
        console.warn('[smsReminderService] link creation failed:', linkErr?.message || linkErr);
      }

      created += 1;
      createdIds.push(ins.id);
    } catch (e) {
      console.warn('[smsReminderService] create reminder failed:', e?.message || e);
    }
  }

  return { created, sms_log_ids: createdIds, linked };
}

// Helper to render template with variable replacement
function renderTemplate(template, vars) {
  return template
    .replace(/{\s*patient_name\s*}/gi, vars.patientName || '')
    .replace(/{\s*patient_first_name\s*}/gi, (vars.patientName || '').split(' ')[0] || '')
    .replace(/{\s*guardian_title\s*}/gi, vars.guardianTitle || '')
    .replace(/{\s*vaccine_name\s*}/gi, vars.vaccineName || '')
    .replace(/{\s*dose_number\s*}/gi, vars.doseNumber || '')
    .replace(/{\s*vaccine_lines\s*}/gi, vars.vaccineLines || '')
    .replace(/{\s*vaccine_list\s*}/gi, vars.vaccineLines || '')
    .replace(/{\s*scheduled_date\s*}/gi, vars.scheduledDate || '')
    .replace(/{\s*appointment_date\s*}/gi, vars.scheduledDate || '')
    // Prefer provided appointmentTime; default to 08:00 AM PHT for clarity
    .replace(/{\s*appointment_time\s*}/gi, vars.appointmentTime || getReminderTime('Asia/Manila').display)
    .replace(/{\s*days_until\s*}/gi, vars.daysUntil || '')
    .replace(/{\s*schedule_summary\s*}/gi, vars.scheduleSummary || '')
    .replace(/{\s*guardian_name\s*}/gi, '')
    .replace(/{\s*guardian_first_name\s*}/gi, '')
    .replace(/{\s*guardian_last_name\s*}/gi, vars.guardianLastName || '')
    .replace(/{\s*greeting_time\s*}/gi, vars.greetingTime || '')
    .replace(/{\s*health_center\s*}/gi, 'Barangay Health Center');
}

/**
 * Send a single immediate SMS to notify about rescheduling.
 * Combines multiple schedules (by date) into one message summary.
 * Will dedupe by updating an existing pending manual SMS created within the last 15s for the same patient.
 */
async function sendRescheduleNotification(patientId, scheduleIds, client) {
  const supabase = withClient(client);

  try {
    // Load patient info and phone
    const patient = await getPatientSmsInfo(patientId, supabase);
    const normalizedPhone = patient?.guardian_contact_number ? smsService.formatPhoneNumber(patient.guardian_contact_number) : null;
    if (!patient || !normalizedPhone) {
      console.log('[rescheduleNotify] Skipped: no guardian phone for patient', patientId);
      return { sent: 0, reason: 'no-guardian-phone' };
    }

    // Load schedules (id, vaccine, dose, date)
    const { data: schedules, error: schedErr } = await supabase
      .from('patientschedule')
      .select('patient_schedule_id, vaccine_id, dose_number, scheduled_date')
      .in('patient_schedule_id', scheduleIds)
      .eq('is_deleted', false);
    if (schedErr) throw schedErr;
    if (!schedules || schedules.length === 0) {
      console.log('[rescheduleNotify] No schedules found for ids', scheduleIds);
      return { sent: 0, reason: 'no-schedules' };
    }

    // Fetch vaccine names
    const vaccineIds = [...new Set(schedules.map(s => s.vaccine_id).filter(Boolean))];
    let vaccineMap = new Map();
    if (vaccineIds.length > 0) {
      const { data: vacs } = await supabase
        .from('vaccinemaster')
        .select('vaccine_id, antigen_name')
        .in('vaccine_id', vaccineIds);
      vaccineMap = new Map((vacs || []).map(v => [v.vaccine_id, v.antigen_name]));
    }

    // Group by date and build summary lines, format date as 'MMMM DD, YYYY' and place each detail on its own line
    const byDate = new Map();
    for (const s of schedules) {
      const raw = s.scheduled_date || '';
      const dateLabel = raw
        ? moment.tz(raw, 'Asia/Manila').format('MMMM DD, YYYY')
        : raw.split('T')[0];
      const name = vaccineMap.get(s.vaccine_id) || 'vaccine';
      const dose = `Dose ${s.dose_number || 1}`;
      const item = `${name} (${dose})`;
      if (!byDate.has(dateLabel)) byDate.set(dateLabel, []);
      byDate.get(dateLabel).push(item);
    }
    const summaryParts = [];
    for (const [dateLabel, items] of byDate.entries()) {
      // format as:
      // November 02, 2025:
      // - Vaccine A (Dose 1)
      // - Vaccine B (Dose 2)
      summaryParts.push(`${dateLabel}:\n${items.map(i => `- ${i}`).join('\n')}`);
    }
    // Separate different date blocks with a blank line
    const scheduleSummary = summaryParts.join('\n\n');

    // Determine guardian title
    const relationship = (patient.guardian_relationship || '').toLowerCase();
    const guardianTitle = relationship === 'mother' ? 'Ms.' : relationship === 'father' ? 'Mr.' : '';

    // Try to load a reschedule template
    let templateId = null;
    let templateText = null;
    try {
      const { data: tpl } = await supabase
        .from('sms_templates')
        .select('id, template')
        .ilike('trigger_type', 'reschedule')
        .eq('is_active', true)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (tpl) {
        templateId = tpl.id;
        templateText = typeof tpl.template === 'string' ? tpl.template.replace(/\\n/g, '\n') : tpl.template;
      }
    } catch (_) {}

    // Fallback template
    if (!templateText) {
      templateText = 'Good Day, {guardian_title} {guardian_last_name}!\n\nYour child, {patient_name}, has updated appointments. New schedule(s):\n\n{schedule_summary}\n\nThank you!';
    }

    const message = renderTemplate(templateText, {
      patientName: patient.full_name,
      guardianTitle,
      guardianLastName: patient.guardian_last_name || patient.full_name?.split(' ').pop() || '',
      scheduleSummary,
      vaccineName: '',
      doseNumber: '',
      scheduledDate: ''
    });

    // Preserve template formatting exactly - no sanitization

    // Stronger dedupe: if an identical manual message for this patient/phone was created very recently, skip sending a duplicate
    const dedupeWindowMs = Number(process.env.SMS_RESCHEDULE_DEDUPE_MS || 60_000); // default 60s
    const cutoffISO = new Date(Date.now() - dedupeWindowMs).toISOString();
    try {
      const { data: recentSame } = await supabase
        .from('sms_logs')
        .select('id, status')
        .eq('patient_id', patientId)
        .eq('phone_number', normalizedPhone)
        .eq('type', 'manual')
        .gte('created_at', cutoffISO)
        .eq('message', message)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (recentSame) {
        console.log(`[rescheduleNotify] 🛑 Duplicate reschedule message suppressed (within ${dedupeWindowMs}ms). Using existing log ${recentSame.id}.`);
        return { sent: 0, reason: 'duplicate-suppressed', id: recentSame.id };
      }
    } catch (_) {}

    // Dedupe within a short window: try to atomically claim an existing pending manual SMS (set to 'sending')
    let existingId = null;
    try {
      const { data: existing } = await supabase
        .from('sms_logs')
        .select('id')
        .eq('patient_id', patientId)
        .eq('phone_number', normalizedPhone)
        .eq('type', 'manual')
        .eq('status', 'pending')
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) existingId = existing.id;
    } catch (_) {}

    // We will either claim an existing pending log (by updating it to 'sending') or create one marked 'sending'
    let targetLogId = null;
    try {
      if (existingId) {
        // Attempt to atomically claim the existing pending log. Only proceed if we successfully flip it to 'sending'.
        const { data: locked, error: lockErr } = await supabase
          .from('sms_logs')
          .update({ message, template_id: templateId, status: 'sending', error_message: null, updated_at: new Date().toISOString() })
          .eq('id', existingId)
          .eq('status', 'pending')
          .gte('created_at', cutoffISO)
          .select('id')
          .maybeSingle();

        if (lockErr) {
          console.warn('[rescheduleNotify] Failed to lock existing pending SMS:', lockErr?.message || lockErr);
        }

        if (!locked) {
          console.log(`[rescheduleNotify] Another worker claimed pending SMS ${existingId}; skipping send.`);
          return { sent: 0, reason: 'already-handled', id: existingId };
        }

        targetLogId = locked.id;
      } else {
        // Insert a new log in 'sending' state to claim responsibility for sending
        const nowISO = new Date().toISOString();
        const { data: ins, error: insErr } = await supabase
          .from('sms_logs')
          .insert({
            guardian_id: patient.guardian_id || null,
            patient_id: patientId,
            phone_number: normalizedPhone,
            message,
            type: 'manual',
            status: 'sending',
            error_message: null,
            template_id: templateId,
            scheduled_at: nowISO,
            created_at: nowISO,
            updated_at: nowISO,
          })
          .select('id')
          .single();
        if (insErr) throw insErr;
        targetLogId = ins.id;
      }
    } catch (e) {
      console.warn('[rescheduleNotify] Failed to claim or create sms_log for sending:', e?.message || e);
      return { sent: 0, reason: 'claim-failed', error: e?.message || String(e) };
    }

    // Now perform the external send (we own the targetLogId)
    const sendRes = await smsService.sendSMS(normalizedPhone, message);

    try {
      // Update the claimed log with the final send status
      const { error: updErr } = await supabase
        .from('sms_logs')
        .update({
          status: sendRes.success ? 'sent' : 'pending',
          error_message: sendRes.success ? null : (sendRes.error || null),
          sent_at: sendRes.success ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetLogId);
      if (updErr) throw updErr;

      console.log(`[rescheduleNotify] ✅ ${sendRes.success ? 'Sent' : 'Queued (pending)'} manual SMS ${targetLogId} for patient ${patientId}`);

      // Activity log for manual send creation/update
      try {
        await logActivity({
          action_type: sendRes.success ? ACTIVITY.MESSAGE.SEND : ACTIVITY.MESSAGE.FAIL,
          description: `${sendRes.success ? 'Sent' : 'Queued'} manual SMS to guardian for patient ${patientId}`,
          user_id: null,
          entity_type: 'sms_log',
          entity_id: targetLogId,
          new_value: { patient_id: patientId, phone_number: sendRes.recipient || normalizedPhone, type: 'manual', status: sendRes.success ? 'sent' : 'pending' }
        });
      } catch (_) {}

      return { sent: sendRes.success ? 1 : 0, id: targetLogId, error: sendRes.error };
    } catch (e) {
      console.warn('[rescheduleNotify] Failed to update sms_log after send:', e?.message || e);
      return { sent: sendRes.success ? 1 : 0, id: targetLogId, error: e?.message || String(e) };
    }
  } catch (e) {
    console.warn('[rescheduleNotify] Failed to send reschedule SMS:', e?.message || e);
    return { sent: 0, reason: 'error', error: e?.message || String(e) };
  }
}

/**
 * Update phone number in all pending/scheduled SMS logs for a patient
 * Called when guardian contact number is updated
 */
async function updatePhoneNumberForPatient(patientId, newPhoneNumber, client) {
  const supabase = withClient(client);

  try {
    // Normalize the number before storing so future comparisons are consistent
    const formatted = newPhoneNumber ? smsService.formatPhoneNumber(newPhoneNumber) : newPhoneNumber;

    // Update all pending/scheduled SMS logs for this patient
    const { data, error } = await supabase
      .from('sms_logs')
      .update({
        phone_number: formatted,
        updated_at: new Date().toISOString()
      })
      .eq('patient_id', patientId)
    // Only update logs that are still pending (not sent/failed). 'scheduled' is a type, not a status.
      .eq('status', 'pending')
      .in('type', ['scheduled', 'manual'])
      .select();

    if (error) throw error;

    console.log(`[smsReminderService] Updated ${data?.length || 0} SMS logs with new phone number for patient ${patientId}`);
    return { updated: data?.length || 0, data };
  } catch (e) {
    console.error('[smsReminderService] updatePhoneNumberForPatient failed:', e?.message || e);
    throw e;
  }
}

/**
 * Recreate SMS reminders when a schedule is rescheduled
 * SMART LOGIC:
 * 1. Delete only the SMS logs that link to the MOVED schedule
 * 2. For the OLD date: If other schedules remain, recreate combined SMS for them
 * 3. For the NEW date: Delete existing SMS for that date, then create combined SMS
 */
async function handleScheduleReschedule(patientScheduleId, oldDateStr, client) {
  const supabase = withClient(client);

  console.log('\n========== RESCHEDULE CASCADE START ==========');
  console.log(`[RESCHEDULE] Schedule ID: ${patientScheduleId}`);
  console.log(`[RESCHEDULE] Old Date String: ${oldDateStr}`);

  try {
    // Get the rescheduled schedule details (with NEW date)
    const { data: schedule, error: schedErr } = await supabase
      .from('patientschedule')
      .select('patient_id, scheduled_date, vaccine_id, dose_number')
      .eq('patient_schedule_id', patientScheduleId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (schedErr) throw schedErr;
    if (!schedule) {
      console.warn(`[RESCHEDULE] ❌ Schedule ${patientScheduleId} not found or deleted`);
      return { success: false, reason: 'schedule_not_found' };
    }

    const newDate = schedule.scheduled_date?.split('T')[0];
    const oldDate = oldDateStr?.split('T')[0];
    const patientId = schedule.patient_id;

    console.log(`[RESCHEDULE] Patient ID: ${patientId}`);
    console.log(`[RESCHEDULE] Old Date: ${oldDate}`);
    console.log(`[RESCHEDULE] New Date: ${newDate}`);
    console.log(`[RESCHEDULE] Vaccine: ${schedule.vaccine_id} (Dose ${schedule.dose_number})`);

    // STEP 1: Detach the moved schedule from any existing SMS logs
    // If an SMS is shared, DO NOT delete it — only unlink this schedule
    console.log('\n--- STEP 1: Detach moved schedule from existing SMS ---');
    const { data: linksToDelete } = await supabase
      .from('sms_log_patientschedule')
      .select('sms_log_id')
      .eq('patient_schedule_id', patientScheduleId);

    console.log(`[STEP 1] Found ${linksToDelete?.length || 0} SMS links referencing the moved schedule`);

    if (linksToDelete && linksToDelete.length > 0) {
      const smsLogIds = [...new Set(linksToDelete.map(l => l.sms_log_id))];
      console.log(`[STEP 1] SMS Log IDs to process: ${smsLogIds.join(', ')}`);

      // For each SMS, check if it's shared with other schedules
      for (const smsId of smsLogIds) {
        const { data: allLinksForThisSms } = await supabase
          .from('sms_log_patientschedule')
          .select('patient_schedule_id')
          .eq('sms_log_id', smsId);

        const otherSchedules = allLinksForThisSms?.filter(l => l.patient_schedule_id !== patientScheduleId) || [];

        if (otherSchedules.length > 0) {
          console.log(`[STEP 1] 🔗 SMS ${smsId} is shared with ${otherSchedules.length} other schedule(s): ${otherSchedules.map(s => s.patient_schedule_id).join(', ')}`);
          // Unlink the moved schedule from this shared SMS
          await supabase
            .from('sms_log_patientschedule')
            .delete()
            .eq('sms_log_id', smsId)
            .eq('patient_schedule_id', patientScheduleId);
          console.log(`[STEP 1] ✅ Unlinked moved schedule ${patientScheduleId} from SMS ${smsId}`);
        } else {
          console.log(`[STEP 1] 🗑️ SMS ${smsId} is standalone (only linked to moved schedule), deleting...`);
          // This SMS is only linked to the moved schedule, safe to delete
          // Only delete pending SMS logs (safe to remove standalone pending reminders).
          await supabase
            .from('sms_logs')
            .delete()
            .eq('id', smsId)
            .eq('status', 'pending')
            .eq('type', 'scheduled');
          console.log(`[STEP 1] ✅ Deleted standalone SMS ${smsId}`);
        }
      }

      // Refresh messages for remaining shared SMS after unlinking
      await updateMessagesForPatient(patientId, supabase);
      console.log(`[STEP 1] ✅ Processed ${smsLogIds.length} SMS logs and refreshed message content`);
    } else {
      console.log('[STEP 1] ℹ️ No SMS logs found for this schedule (might be new)');
    }

    // STEP 2: Handle the OLD date - check if other schedules remain (no deletes here)
    console.log(`\n--- STEP 2: Handle old date (${oldDate}) ---`);
    if (oldDate && oldDate !== newDate) {
      const { data: remainingOnOldDate } = await supabase
        .from('patientschedule')
        .select('patient_schedule_id, vaccine_id, dose_number')
        .eq('patient_id', patientId)
        .gte('scheduled_date', `${oldDate}T00:00:00`)
        .lte('scheduled_date', `${oldDate}T23:59:59`)
        .eq('is_deleted', false);

      console.log(`[STEP 2] Found ${remainingOnOldDate?.length || 0} schedules remaining on old date`);

      if (remainingOnOldDate && remainingOnOldDate.length > 0) {
        console.log('[STEP 2] Remaining schedules:', remainingOnOldDate.map(s =>
          `ID:${s.patient_schedule_id} (${s.vaccine_id} Dose ${s.dose_number})`
        ).join(', '));
        console.log('[STEP 2] ✍️ Updating messages in place for old-date schedules...');
        await updateMessagesForPatient(patientId, supabase);
        console.log(`[STEP 2] ✅ Updated message content for ${oldDate}`);
      } else {
        console.log(`[STEP 2] ℹ️ No schedules remain on ${oldDate}, nothing to recreate`);
      }
    } else {
      console.log('[STEP 2] ℹ️ Skipping (same date or no old date provided)');
    }

    // Decide if new date is in the past (Asia/Manila)
    const todayLocal = moment.tz('Asia/Manila').format('YYYY-MM-DD');
    const isPastNewDate = newDate && newDate < todayLocal;

    // STEP 3: Handle the NEW date - only if the new date is today or future
    console.log(`\n--- STEP 3: Handle new date (${newDate}) ---`);
    if (isPastNewDate) {
      console.log(`[STEP 3] ⏭️ Skipping SMS creation/linking for past new date ${newDate} (today ${todayLocal}).`);
      console.log('[STEP 3] No reschedule notification will be sent for past date.');
      console.log('\n========== RESCHEDULE CASCADE COMPLETE ==========');
      return { success: true, skipped: 'past-new-date' };
    }

    const { data: schedulesOnNewDate } = await supabase
      .from('patientschedule')
      .select('patient_schedule_id, vaccine_id, dose_number')
      .eq('patient_id', patientId)
      .gte('scheduled_date', `${newDate}T00:00:00`)
      .lte('scheduled_date', `${newDate}T23:59:59`)
      .eq('is_deleted', false);

    console.log(`[STEP 3] Found ${schedulesOnNewDate?.length || 0} total schedules on new date`);

    if (schedulesOnNewDate && schedulesOnNewDate.length > 0) {
      const scheduleIdsOnNewDate = schedulesOnNewDate.map(s => s.patient_schedule_id);
      console.log(`[STEP 3] Schedule IDs on new date: ${scheduleIdsOnNewDate.join(', ')}`);
      console.log('[STEP 3] Schedules:', schedulesOnNewDate.map(s =>
        `ID:${s.patient_schedule_id} (${s.vaccine_id} Dose ${s.dose_number})`
      ).join(', '));
      // Link/create combined SMS without deleting existing ones
      console.log(`[STEP 3] 🔄 Linking or creating combined SMS for ${scheduleIdsOnNewDate.length} schedules...`);
      const result = await scheduleReminderLogsForPatientSchedule(patientScheduleId, supabase);
      console.log(`[STEP 3] ↪️ scheduleReminder created: ${result?.created || 0}, linked: ${result?.linked || 0}, skipped: ${result?.skipped || ''}, ids: ${(result?.sms_log_ids || []).join(', ')}`);
      // Ensure message text reflects the combined schedules
      await updateMessagesForPatient(patientId, supabase);
      console.log('[STEP 3] ✅ Linked/created and updated messages for new date');
      // Send immediate reschedule notification combining affected schedules on the new date
      const notify = await sendRescheduleNotification(patientId, scheduleIdsOnNewDate, supabase);
      console.log(`[STEP 3] 📣 Reschedule notify -> sent: ${notify.sent}, updatedExisting: ${notify.updatedExisting ? 'yes' : 'no'}, id: ${notify.id || ''}, reason: ${notify.reason || ''}`);
    } else {
      console.log('[STEP 3] ⚠️ No schedules found on new date (unexpected!)');
    }

    console.log('\n========== RESCHEDULE CASCADE COMPLETE ==========\n');
    return { success: true };
  } catch (e) {
    console.error('\n❌ [RESCHEDULE] FAILED:', e?.message || e);
    console.error('Stack:', e?.stack);
    console.log('\n========== RESCHEDULE CASCADE FAILED ==========\n');
    throw e;
  }
}

/**
 * Update message content in pending SMS logs when patient/guardian/vaccine data changes
 * This regenerates the message using the current template and updated data
 */
async function updateMessagesForPatient(patientId, client) {
  const supabase = withClient(client);

  try {
    // Get all pending SMS logs for this patient
    const { data: smsLogs, error: smsErr } = await supabase
      .from('sms_logs')
      .select('id, template_id, scheduled_at')
      .eq('patient_id', patientId)
      // Only update logs that are still pending (these will be re-rendered). 'scheduled' is a type, not a status.
      .eq('status', 'pending')
      .in('type', ['scheduled', 'manual']);

    if (smsErr) throw smsErr;
    if (!smsLogs || smsLogs.length === 0) {
      console.log(`[smsReminderService] No pending SMS logs to update for patient ${patientId}`);
      return { updated: 0 };
    }
    console.log(`[smsReminderService] Will update ${smsLogs.length} SMS log(s) for patient ${patientId}`);

    // For each SMS log, regenerate the message
    let updated = 0;
    for (const smsLog of smsLogs) {
      try {
        // Get linked schedules to rebuild message
        const { data: links, error: linkErr } = await supabase
          .from('sms_log_patientschedule')
          .select('patient_schedule_id')
          .eq('sms_log_id', smsLog.id);

        if (linkErr || !links || links.length === 0) {
          console.log(`[updateMessages] sms_log ${smsLog.id}: no links, skipping`);
          continue;
        }

        const psIds = links.map(l => l.patient_schedule_id);
        console.log(`[updateMessages] sms_log ${smsLog.id}: linked schedules -> ${psIds.join(', ')}`);

        // Get schedule data
        const { data: schedules, error: schedErr } = await supabase
          .from('patientschedule')
          .select('patient_schedule_id, patient_id, vaccine_id, dose_number, scheduled_date')
          .in('patient_schedule_id', psIds)
          .eq('is_deleted', false);

        if (schedErr || !schedules || schedules.length === 0) {
          console.log(`[updateMessages] sms_log ${smsLog.id}: schedules not found, skipping`);
          continue;
        }
        const scheduleDates = schedules.map(s => `${s.patient_schedule_id}:${(s.scheduled_date||'').split('T')[0]}`);
        console.log(`[updateMessages] sms_log ${smsLog.id}: schedule dates -> ${scheduleDates.join(', ')}`);

        // Get patient data
        const patient = await getPatientSmsInfo(patientId, supabase);
        if (!patient) {
          console.log(`[updateMessages] sms_log ${smsLog.id}: patient ${patientId} not found (both view and base tables), skipping`);
          continue;
        }

        // Get vaccine data
        const vaccineIds = [...new Set(schedules.map(s => s.vaccine_id))];
        const { data: vaccines, error: vacErr } = await supabase
          .from('vaccinemaster')
          .select('vaccine_id, antigen_name')
          .in('vaccine_id', vaccineIds);

        if (vacErr) {
          console.warn('[smsReminderService] vaccine lookup failed:', vacErr?.message || vacErr);
          continue;
        }

        const vaccineMap = new Map((vaccines || []).map(v => [v.vaccine_id, v.antigen_name]));

        // Combine vaccine names and doses
        const vaccineNames = schedules.map(s => vaccineMap.get(s.vaccine_id) || 'vaccine').join(', ');
        const doseNumbers = schedules.map(s => `Dose ${s.dose_number || 1}`).join(', ');
        const vaccineLines2 = schedules.map(s => {
          const name = vaccineMap.get(s.vaccine_id) || 'vaccine';
          const dose = `Dose ${s.dose_number || 1}`;
          return `${name} — ${dose}`;
        }).join(',\n');
        const scheduledDate = schedules[0]?.scheduled_date
          ? moment.tz(schedules[0].scheduled_date, 'Asia/Manila').format('MMMM DD, YYYY')
          : '';

        // Get guardian title
        const relationship = (patient.guardian_relationship || '').toLowerCase();
        const guardianTitle = relationship === 'mother' ? 'Ms.' : relationship === 'father' ? 'Mr.' : '';

        // Get template if available
        let template = null;
        if (smsLog.template_id) {
          const { data: tpl, error: tplErr } = await supabase
            .from('sms_templates')
            .select('template')
            .eq('id', smsLog.template_id)
            .maybeSingle();

          if (!tplErr && tpl) template = typeof tpl.template === 'string' ? tpl.template.replace(/\\n/g, '\n') : tpl.template;
        }

        // Fallback template
        if (!template) {
          template = 'Good Day, {guardian_title} {guardian_last_name}!\n\nThis is a reminder that your child, {patient_name} has scheduled on {scheduled_date} for the following vaccines:\n\n{vaccine_lines}\n\nSee you there! Thank you!';
        }

        // Render message
        const timeCfg2 = getReminderTime('Asia/Manila');
        const greetingTime2 = (timeCfg2.hour >= 6 && timeCfg2.hour < 18) ? 'Good Day' : 'Good Evening';
        const message = renderTemplate(template, {
          patientName: patient.full_name,
          guardianTitle,
          guardianLastName: patient.guardian_last_name || patient.full_name?.split(' ').pop() || '',
          vaccineName: vaccineNames,
          doseNumber: doseNumbers,
          vaccineLines: vaccineLines2,
          scheduledDate,
          appointmentTime: timeCfg2.display,
          daysUntil: '',
          greetingTime: greetingTime2,
        });

        // Update SMS log
        const { error: updateErr } = await supabase
          .from('sms_logs')
          .update({
            message,
            updated_at: new Date().toISOString()
          })
          .eq('id', smsLog.id);

        if (!updateErr) {
          updated++;
          console.log(`[updateMessages] ✅ Updated sms_log ${smsLog.id}`);
        } else {
          console.log(`[updateMessages] ❌ Failed to update sms_log ${smsLog.id}:`, updateErr?.message || updateErr);
        }
      } catch (e) {
        console.warn(`[smsReminderService] Failed to update message for SMS log ${smsLog.id}:`, e?.message || e);
      }
    }

    console.log(`[smsReminderService] Updated ${updated} SMS messages for patient ${patientId}`);
    return { updated };
  } catch (e) {
    console.error('[smsReminderService] updateMessagesForPatient failed:', e?.message || e);
    throw e;
  }
}

export { scheduleReminderLogsForPatientSchedule,
  updatePhoneNumberForPatient,
  handleScheduleReschedule,
  updateMessagesForPatient,
  getPatientSmsInfo };
