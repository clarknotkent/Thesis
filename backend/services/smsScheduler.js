const supabase = require('../db');
const smsService = require('./smsService');
const moment = require('moment-timezone');
const { logActivity } = require('../models/activityLogger');
const { ACTIVITY } = require('../constants/activityTypes');

/**
 * SMS Scheduler
 * - Scans sms_logs for scheduled messages that are due (status='pending' AND type='scheduled' AND scheduled_at <= now)
 * - Sends them via smsService
 * - Updates sms_logs with status, sent_at, error_message, updated_at
 */

const TZ = process.env.SMS_CRON_TZ || 'Asia/Manila';
const DAILY_HOUR = Number(process.env.SMS_CRON_HOUR || 7); // 0-23
const DAILY_MINUTE = Number(process.env.SMS_CRON_MINUTE || 0);
const BATCH_LIMIT = Number(process.env.SMS_CRON_BATCH_LIMIT || 200);
// New: interval-based mode to poll frequently so messages send near their scheduled_at time
// SMS_CRON_MODE: 'interval' | 'daily' (default to 'interval' for timely sends)
const MODE = String(process.env.SMS_CRON_MODE || 'interval').toLowerCase();
const POLL_MS = Number(process.env.SMS_CRON_POLL_MS || 60_000); // default 60 seconds

// Log relevant debug env flags on module load so it's easy to confirm the running process has them
try {
  console.log('[SMS Scheduler] ENV SMS_DEBUG=' + String(process.env.SMS_DEBUG || '') + ' SHOW_SMS_MESSAGES=' + String(process.env.SHOW_SMS_MESSAGES || '') + ' SMS_DEBUG_BREAK=' + String(process.env.SMS_DEBUG_BREAK || ''));
} catch (_) {}

async function fetchDueScheduled(limit = BATCH_LIMIT) {
  const nowIso = new Date().toISOString();
  // Only process scheduled items to avoid retrying manual failures
  let query = supabase
    .from('sms_logs')
    .select('id, phone_number, message, template_id, guardian_id, patient_id, scheduled_at, status')
    // Accept both 'pending' and legacy 'scheduled' statuses to be robust
    .in('status', ['pending', 'scheduled'])
    .eq('type', 'scheduled')
    // Ignore sms_logs that were soft-deleted by cascade cleanup
    .eq('is_deleted', false)
    .lte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function processDueScheduledSMS({ limit = BATCH_LIMIT } = {}) {
  const startedAt = new Date();
  const due = await fetchDueScheduled(limit);
  if (due.length > 0) {
    console.log(`[SMS Scheduler] Found ${due.length} due scheduled sms_logs -> ${due.map(d => d.id).join(', ')}`);
  }
  let sent = 0;
  let failed = 0;
  const results = [];

  for (const row of due) {
    // Refresh recipient phone from patients_view when possible to avoid using stale numbers
    try {
      if (row.patient_id) {
        const { data: pv, error: pvErr } = await supabase
          .from('patients_view')
          .select('guardian_contact_number')
          .eq('patient_id', row.patient_id)
          .maybeSingle();
        if (!pvErr && pv && pv.guardian_contact_number) {
          const latest = pv.guardian_contact_number;
          if (latest !== row.phone_number) {
            const old = row.phone_number;
            // update sms_log with latest phone so audit reflects what was sent
            try {
              await supabase
                .from('sms_logs')
                .update({ phone_number: latest, updated_at: new Date().toISOString() })
                .eq('id', row.id);
              console.log(`[SMS Scheduler] Refreshed phone for sms_log ${row.id}: ${old} -> ${latest}`);
              row.phone_number = latest;
            } catch (uErr) {
              console.warn('[SMS Scheduler] Failed to update sms_log phone_number before send:', uErr?.message || uErr);
            }
          }
        }
      }
    } catch (refreshErr) {
      console.warn('[SMS Scheduler] Failed to refresh recipient phone for sms_log', row.id, refreshErr?.message || refreshErr);
    }
    // Basic validation: ensure we have a phone number and message
    if (!row.phone_number) {
      failed++;
      console.warn(`[SMS Scheduler] Skipping sms_log ${row.id} - missing phone_number`);
      await supabase
        .from('sms_logs')
        .update({ error_message: 'Skipped by scheduler: missing phone number', updated_at: new Date().toISOString() })
        .eq('id', row.id);
      results.push({ id: row.id, success: false, error: 'missing phone_number' });
      continue;
    }
    if (!row.message) {
      failed++;
      console.warn(`[SMS Scheduler] Skipping sms_log ${row.id} - missing message`);
      await supabase
        .from('sms_logs')
        .update({ error_message: 'Skipped by scheduler: missing message', updated_at: new Date().toISOString() })
        .eq('id', row.id);
      results.push({ id: row.id, success: false, error: 'missing message' });
      continue;
    }
    try {
      // Optional debug: show recipient and message preview in scheduler logs when SMS_DEBUG=true
      try {
        if (String(process.env.SMS_DEBUG || '').toLowerCase() === 'true') {
          const preview = typeof row.message === 'string' && row.message.length > 500
            ? row.message.slice(0, 500) + '...[truncated]'
            : row.message;
          console.log(`[SMS Scheduler][DEBUG] sms_log=${row.id} recipient=${row.phone_number} message="${preview}"`);
        }
      } catch (dbgErr) { /* ignore debug logging failures */ }

      // Also optionally print the full message when SHOW_SMS_MESSAGES=true (dev/staging only)
      try {
        if (String(process.env.SHOW_SMS_MESSAGES || '').toLowerCase() === 'true') {
          console.log('[SMS Scheduler][SHOW_MESSAGE] sms_log=' + row.id + ' recipient=' + row.phone_number + ' message="' + String(row.message) + '"');
        }
      } catch (_) {}

      // Optionally compute and log the finalized (sanitized) message before sending so we can compare
      // what the frontend provided vs what will actually be sent by smsService.
      try {
        // Keep stored message intact (preserve newlines). Compute finalized preview only.
        const finalized = typeof smsService.sanitizeMessage === 'function' ? smsService.sanitizeMessage(row.message) : row.message;
        try {
          console.log('[SMS Scheduler] message preview (first 100 chars):', JSON.stringify((String(finalized || '').slice(0, 100))));
        } catch (_) {}
        console.log(`[SMS Scheduler] prepared send sms_log=${row.id} recipient=${row.phone_number} rawLen=${String(row.message || '').length} finalLen=${String(finalized || '').length}`);
        if (String(process.env.SHOW_SMS_MESSAGES || '').toLowerCase() === 'true') {
          console.log('[SMS Scheduler][PREVIEW_RAW] sms_log=' + row.id + ' raw="' + String(row.message) + '"');
          console.log('[SMS Scheduler][PREVIEW_FINAL] sms_log=' + row.id + ' final="' + String(finalized) + '"');
        }
        // env-gated breakpoint: pause only when SMS_DEBUG_BREAK=true
          if (String(process.env.SMS_DEBUG_BREAK || '').toLowerCase() === 'true') {
            console.log('[SMS Scheduler][DBG_BREAK] sms_log=' + row.id + ' about to send; raw and final printed above');
            // debugger; // interactive debugger pause removed
        }
      } catch (e) {
        /* ignore preview errors */
      }

      // Send the sanitized message (newlines removed)
      let sendRes = await smsService.sendSMS(row.phone_number, row.message);
      // If provider returned a transient telco error, retry a few times with backoff
      if (!sendRes.success) {
        const errMsg = (sendRes.error || '').toString().toLowerCase();
        if (errMsg.includes('telco') || errMsg.includes('temporary') || errMsg.includes('timeout') || errMsg.includes('gateway') || errMsg.includes('502') || errMsg.includes('503') || errMsg.includes('504')) {
          const maxRetries = 3;
          let attempt = 0;
          let delay = 2000; // start with 2s
          while (attempt < maxRetries && !sendRes.success) {
            attempt++;
            console.log(`[SMS Scheduler] Transient send error for sms_log ${row.id} (${sendRes.error}). Retrying ${attempt}/${maxRetries} after ${delay}ms`);
            // Debug print each retry attempt
            try {
              if (String(process.env.SMS_DEBUG || '').toLowerCase() === 'true') {
                const preview = typeof row.message === 'string' && row.message.length > 500
                  ? row.message.slice(0, 500) + '...[truncated]'
                  : row.message;
                console.log(`[SMS Scheduler][DEBUG] retry=${attempt} sms_log=${row.id} recipient=${row.phone_number} message="${preview}"`);
              }
            } catch (_) {}
            await new Promise(r => setTimeout(r, delay));
            sendRes = await smsService.sendSMS(row.phone_number, row.message);
            delay *= 2;
          }
        }
      }

      if (sendRes.success) {
        sent++;
        await supabase
          .from('sms_logs')
          .update({
            status: 'sent',
            error_message: null,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        // Activity log for successful auto-send
        try {
          await logActivity({
            action_type: ACTIVITY.MESSAGE.SEND,
            description: 'Sent scheduled SMS via scheduler',
            user_id: null,
            entity_type: 'sms_log',
            entity_id: row.id,
            new_value: { patient_id: row.patient_id, phone_number: row.phone_number, type: 'scheduled', status: 'sent' }
          });
        } catch (_) {}
      } else {
        failed++;
        // Record full provider response (or error) for diagnostics
        const errText = sendRes.error || (sendRes.data && JSON.stringify(sendRes.data)) || 'Unknown error';
        await supabase
          .from('sms_logs')
          .update({
            // Keep as pending for retry on next run, but record the last error
            error_message: errText,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        // Activity log for failed auto-send attempt
        try {
          await logActivity({
            action_type: ACTIVITY.MESSAGE.FAIL,
            description: 'Failed to send scheduled SMS via scheduler',
            user_id: null,
            entity_type: 'sms_log',
            entity_id: row.id,
            new_value: { patient_id: row.patient_id, phone_number: row.phone_number, type: 'scheduled', status: 'pending', error: sendRes.error }
          });
        } catch (_) {}
      }
      results.push({ id: row.id, success: !!sendRes.success, error: sendRes.error });
    } catch (err) {
      failed++;
      await supabase
        .from('sms_logs')
        .update({
          error_message: err.message || 'Unhandled error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      results.push({ id: row.id, success: false, error: err.message });
    }
  }

  return {
    startedAt,
    finishedAt: new Date(),
    counts: { picked: due.length, sent, failed },
    results,
  };
}

function computeMsUntilNextRun() {
  const now = moment.tz(TZ);
  let next = now.clone().hour(DAILY_HOUR).minute(DAILY_MINUTE).second(0).millisecond(0);
  if (!next.isAfter(now)) {
    next = next.add(1, 'day');
  }
  return next.valueOf() - now.valueOf();
}

let dailyTimer = null;
let intervalHandle = null;
let running = false; // prevent overlapping runs

function scheduleNextDailyRun() {
  const ms = computeMsUntilNextRun();
  const nextAt = new Date(Date.now() + ms);
  console.log(`[SMS Scheduler] Next daily run scheduled at ${moment(nextAt).tz(TZ).format()} (${TZ})`);
  dailyTimer = setTimeout(async () => {
    if (running) {
      console.log('[SMS Scheduler] Previous run still in progress, skipping this tick');
    } else {
      running = true;
      console.log('[SMS Scheduler] Starting daily run...');
      try {
        const summary = await processDueScheduledSMS({ limit: BATCH_LIMIT });
        console.log('[SMS Scheduler] Completed run:', summary.counts);
      } catch (err) {
        console.error('[SMS Scheduler] Run error:', err);
      } finally {
        running = false;
      }
    }
    // Schedule the next run dynamically (handles DST and TZ changes)
    scheduleNextDailyRun();
  }, ms);
}

function start() {
  const enabled = String(process.env.SMS_CRON_ENABLED || 'true').toLowerCase() === 'true';
  if (!enabled) {
    console.log('[SMS Scheduler] Disabled via SMS_CRON_ENABLED=false');
    return;
  }

  if (MODE === 'daily') {
    console.log(`[SMS Scheduler] Starting in DAILY mode at ${String(DAILY_HOUR).padStart(2,'0')}:${String(DAILY_MINUTE).padStart(2,'0')} (${TZ})`);
    scheduleNextDailyRun();
  } else {
    const ms = Math.max(5_000, POLL_MS); // minimum 5 seconds safety
    console.log(`[SMS Scheduler] Starting in INTERVAL mode: every ${ms}ms; TZ=${TZ}`);
    // Kick off an immediate run on startup
    setImmediate(async () => {
      try {
        running = true;
        const summary = await processDueScheduledSMS({ limit: BATCH_LIMIT });
        console.log('[SMS Scheduler] Initial run completed:', summary.counts);
      } catch (err) {
        console.error('[SMS Scheduler] Initial run error:', err);
      } finally {
        running = false;
      }
    });
    intervalHandle = setInterval(async () => {
      if (running) return; // skip overlapping
      running = true;
      try {
        const summary = await processDueScheduledSMS({ limit: BATCH_LIMIT });
        if (summary.counts.picked > 0) {
          console.log('[SMS Scheduler] Interval run processed:', summary.counts);
        }
      } catch (err) {
        console.error('[SMS Scheduler] Interval run error:', err);
      } finally {
        running = false;
      }
    }, ms);
  }
}

function stop() {
  if (dailyTimer) clearTimeout(dailyTimer);
  if (intervalHandle) clearInterval(intervalHandle);
  dailyTimer = null;
  intervalHandle = null;
  running = false;
}

module.exports = {
  start,
  stop,
  processDueScheduledSMS,
};
