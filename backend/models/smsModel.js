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

module.exports = {
  sendSMS,
  getSMSLogs,
  logSMS,
};
