const supabase = require('../db');

// Send SMS
const sendSMS = async (to, message) => {
  // Placeholder for SMS API integration
  console.log(`Sending SMS to ${to}: ${message}`);
  return { status: 'success', to, message };
};

// Fetch SMS logs
const getSMSLogs = async (filters) => {
  const { recipient, status } = filters;
  let query = supabase.from('notifications').select('*').eq('channel', 'SMS');

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
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        channel: 'SMS',
        recipient_phone: to,
        message_body: message,
        status,
        created_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Test functions for compatibility
const getAllNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

const getNotificationById = async (id) => {
  const { data, error } = await supabase
    .from('notifications')
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
