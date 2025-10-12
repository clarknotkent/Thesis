const { createNotification, listNotifications, markAsSent } = require('../models/notificationModel');
const { getSupabaseForRequest } = require('../utils/supabaseClient');

const create = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const payload = { ...req.body, created_by: req.user?.user_id || null };
    const created = await createNotification(payload, supabase);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('[notification.create] error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
};

const list = async (req, res) => {
  try {
    const supabase = getSupabaseForRequest(req);
    const { page = 1, limit = 20, status, related_entity_type, related_entity_id } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (related_entity_type) filters.related_entity_type = related_entity_type;
    if (related_entity_id) filters.related_entity_id = Number(related_entity_id);
    if (req.user && req.user.user_id) filters.recipient_user_id = req.user.user_id;

    const result = await listNotifications(filters, Number(page), Number(limit), supabase);
    return res.json({ success: true, data: result.items, meta: { totalCount: result.totalCount, page: result.page, limit: result.limit, totalPages: result.totalPages } });
  } catch (err) {
    console.error('[notification.list] error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Failed to list notifications' });
  }
};

const mark_sent = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const supabase = getSupabaseForRequest(req);
    const updated = await markAsSent(id, new Date().toISOString(), supabase);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[notification.mark_sent] error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Failed to mark sent' });
  }
};

module.exports = { create, list, mark_sent };
