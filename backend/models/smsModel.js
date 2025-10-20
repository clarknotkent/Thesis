const supabase = require('../db');
const notificationModel = require('./notificationModel');

// Send SMS
const sendSMS = async (to, message) => {
  // Placeholder for SMS API integration
  console.log(`Sending SMS to ${to}: ${message}`);
  return { status: 'success', to, message };
};

// Fetch SMS logs
const getSMSLogs = async (filters) => {
  const { recipient, status } = filters;
  // Be tolerant of legacy stored values ("SMS") but prefer canonical 'sms'
  let query = supabase.from('notifications_view').select('*').in('channel', ['sms', 'SMS']);

  if (recipient) {
    query = query.eq('recipient_phone', recipient);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Log SMS
const logSMS = async (to, message, status) => {
  // Use createNotification to ensure normalization and constraint compatibility
  return notificationModel.createNotification({
    channel: 'sms',
    recipient_phone: to,
    message_body: message,
    status,
    // no recipient_user_id in this context; purely SMS log
  }, null);
};

// Test functions for compatibility
const getAllNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications_view')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

const getNotificationById = async (id) => {
  const { data, error } = await supabase
    .from('notifications_view')
    .select('*')
    .eq('notification_id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

module.exports = {
  sendSMS,
  getSMSLogs,
  logSMS,
  getAllNotifications,
  getNotificationById,
};
