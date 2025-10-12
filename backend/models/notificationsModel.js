const supabase = require('../db');

// Insert a notification row
async function insertNotification(payload, created_by) {
  const row = {
    channel: payload.channel || 'in_app',
    recipient_user_id: payload.recipient_user_id || null,
    recipient_phone: payload.recipient_phone || null,
    recipient_email: payload.recipient_email || null,
    template_code: payload.template_code || null,
    message_body: payload.message_body || null,
    related_entity_type: payload.related_entity_type || null,
    related_entity_id: payload.related_entity_id || null,
    scheduled_at: payload.scheduled_at || null,
    status: payload.scheduled_at ? 'scheduled' : 'pending',
    created_by: created_by || null,
  };

  const { data, error } = await supabase.from('notifications').insert(row).select();
  if (error) throw error;
  return data && data[0];
}

// Basic pagination & filters
async function getNotifications(filters = {}, page = 1, limit = 25) {
  const offset = (page - 1) * limit;
  let query = supabase.from('notifications_view').select('*', { count: 'exact' }).order('created_at', { ascending: false });

  if (filters.recipient_user_id) query = query.eq('recipient_user_id', filters.recipient_user_id);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.type) query = query.eq('template_code', filters.type);

  const rangeStart = offset;
  const rangeEnd = offset + limit - 1;
  const { data, error, count } = await query.range(rangeStart, rangeEnd);
  if (error) throw error;
  const totalCount = Number(count || (data && data.length) || 0);
  const totalPages = Math.ceil(totalCount / limit) || 1;
  return { notifications: data || [], totalCount, page, limit, totalPages };
}

async function markRead(notificationId, userId) {
  const { data, error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('notification_id', notificationId).eq('recipient_user_id', userId).select();
  if (error) throw error;
  return data && data[0];
}

// Fetch scheduled notifications that are due to be sent
async function getPendingScheduledNotifications() {
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('notifications').select('*').lte('scheduled_at', now).in('status', ['scheduled', 'pending']);
  if (error) throw error;
  return data || [];
}

module.exports = {
  insertNotification,
  getNotifications,
  markRead,
  getPendingScheduledNotifications,
};
