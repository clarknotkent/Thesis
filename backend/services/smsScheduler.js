const supabase = require('../db');
const smsService = require('./smsService');
const moment = require('moment-timezone');

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

async function fetchDueScheduled(limit = BATCH_LIMIT) {
  const nowIso = new Date().toISOString();
  // Only process scheduled items to avoid retrying manual failures
  let query = supabase
    .from('sms_logs')
    .select('id, phone_number, message, template_id, guardian_id, patient_id')
    .eq('status', 'pending')
    .eq('type', 'scheduled')
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
  let sent = 0;
  let failed = 0;
  const results = [];

  for (const row of due) {
    try {
      const sendRes = await smsService.sendSMS(row.phone_number, row.message);
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
      } else {
        failed++;
        await supabase
          .from('sms_logs')
          .update({
            // Keep as pending for retry on next run, but record the last error
            error_message: sendRes.error || 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
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
