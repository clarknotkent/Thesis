/**
 * Cleanup script to remove pending scheduled SMS logs for guardians with auto-send disabled
 * Run this once after implementing the auto-send check to clean up existing invalid SMS logs
 */

import supabase from '../db.js';

async function cleanupAutoSendDisabledSMS() {
  try {
    console.log('Starting cleanup of pending SMS logs for guardians with auto-send disabled...');

    // Find all pending scheduled SMS logs with guardian_id
    console.log('Querying pending scheduled SMS logs...');
    const { data: pendingSMS, error: smsErr } = await supabase
      .from('sms_logs')
      .select('id, guardian_id, patient_id, phone_number, scheduled_at')
      .eq('status', 'pending')
      .eq('type', 'scheduled')
      .not('guardian_id', 'is', null);

    if (smsErr) {
      console.error('SMS query error:', smsErr);
      throw smsErr;
    }

    console.log('Pending SMS query result:', { count: pendingSMS?.length || 0, error: smsErr });

    if (!pendingSMS || pendingSMS.length === 0) {
      console.log('No pending scheduled SMS logs found.');
      return { cleaned: 0 };
    }

    console.log(`Found ${pendingSMS.length} pending scheduled SMS logs to check.`);

    // Get unique guardian IDs
    const guardianIds = [...new Set(pendingSMS.map(sms => sms.guardian_id))];

    // Get auto-send settings for these guardians
    const { data: settings, error: settingsErr } = await supabase
      .from('guardian_auto_send_settings')
      .select('guardian_id, auto_send_enabled')
      .in('guardian_id', guardianIds);

    if (settingsErr) throw settingsErr;

    // Create map of guardian auto-send settings (default to false if not set)
    const settingsMap = new Map();
    (settings || []).forEach(setting => {
      settingsMap.set(setting.guardian_id, setting.auto_send_enabled);
    });

    // Find SMS logs to delete (guardians with auto_send_enabled = false)
    const smsToDelete = pendingSMS.filter(sms => {
      const isEnabled = settingsMap.get(sms.guardian_id);
      return isEnabled === false; // false or undefined (not set) means disabled
    });

    if (smsToDelete.length === 0) {
      console.log('No SMS logs to clean up - all guardians have auto-send enabled or setting not configured.');
      return { cleaned: 0 };
    }

    console.log(`Found ${smsToDelete.length} SMS logs to delete for guardians with auto-send disabled:`);
    smsToDelete.forEach(sms => {
      console.log(`  - SMS ID ${sms.id}: Guardian ${sms.guardian_id}, Patient ${sms.patient_id}, Scheduled ${sms.scheduled_at}`);
    });

    // Delete the SMS logs
    const smsIdsToDelete = smsToDelete.map(sms => sms.id);
    const { error: deleteErr } = await supabase
      .from('sms_logs')
      .delete()
      .in('id', smsIdsToDelete);

    if (deleteErr) throw deleteErr;

    // Also clean up the sms_log_patientschedule links
    const { error: linkDeleteErr } = await supabase
      .from('sms_log_patientschedule')
      .delete()
      .in('sms_log_id', smsIdsToDelete);

    if (linkDeleteErr) {
      console.warn('Warning: Failed to clean up sms_log_patientschedule links:', linkDeleteErr?.message || linkDeleteErr);
    }

    console.log(`✅ Successfully cleaned up ${smsToDelete.length} pending SMS logs for guardians with auto-send disabled.`);

    return {
      cleaned: smsToDelete.length,
      smsIds: smsIdsToDelete
    };

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup if this script is executed directly
console.log('Script starting...');
cleanupAutoSendDisabledSMS()
  .then(result => {
    console.log('Cleanup completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });

export { cleanupAutoSendDisabledSMS };
