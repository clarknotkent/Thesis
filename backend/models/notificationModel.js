const supabase = require('../db');

const createNotification = async (payload, supabaseClient = supabase) => {
  const now = new Date().toISOString();
  const record = {
    channel: payload.channel || 'in-app',
    recipient_user_id: payload.recipient_user_id || null,
    recipient_phone: payload.recipient_phone || null,
    recipient_email: payload.recipient_email || null,
    template_code: payload.template_code || null,
    message_body: payload.message_body || null,
    related_entity_type: payload.related_entity_type || null,
    related_entity_id: payload.related_entity_id || null,
    scheduled_at: payload.scheduled_at || now,
    status: payload.status || 'scheduled',
    created_by: payload.created_by || null,
    created_at: now,
    is_deleted: false
  };

  const { data, error } = await supabaseClient.from('notifications').insert(record).select('*').maybeSingle();
  if (error) throw error;
  return data;
};

const listNotifications = async (filters = {}, page = 1, limit = 20, supabaseClient = supabase) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 500);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  let query = supabaseClient.from('notifications_view').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (filters.recipient_user_id) query = query.eq('recipient_user_id', filters.recipient_user_id);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.related_entity_type) query = query.eq('related_entity_type', filters.related_entity_type);
  if (filters.related_entity_id) query = query.eq('related_entity_id', filters.related_entity_id);

  const { data, error, count } = await query.range(offset, offset + safeLimit - 1);
  if (error) throw error;
  return {
    items: data || [],
    totalCount: count || 0,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil((count || 0) / safeLimit)
  };
};

const markAsSent = async (notification_id, sentAt = new Date().toISOString(), supabaseClient = supabase) => {
  const { data, error } = await supabaseClient
    .from('notifications')
    .update({ status: 'sent', sent_at: sentAt })
    .eq('notification_id', notification_id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
};

module.exports = { createNotification, listNotifications, markAsSent };
