const notificationsModel = require('../models/notificationsModel');

// Create a notification (admin or system)
const createNotification = async (req, res) => {
  try {
    const payload = req.body || {};
    // expected fields: channel, recipient_user_id, recipient_phone, recipient_email, template_code, message_body, related_entity_type, related_entity_id, scheduled_at
    const result = await notificationsModel.insertNotification(payload, req.user && req.user.user_id);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('createNotification error', error);
    res.status(500).json({ success: false, message: 'Failed to create notification', error: error.message });
  }
};

// List notifications (inbox) for the authenticated user or admin
const listNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 25, status, type } = req.query;
    const userId = req.user && (req.user.user_id || req.user.id);
    const filters = { status, type, recipient_user_id: userId };
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const result = await notificationsModel.getNotifications(filters, pageNum, limitNum);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('listNotifications error', error);
    res.status(500).json({ success: false, message: 'Failed to list notifications', error: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && (req.user.user_id || req.user.id);
    const updated = await notificationsModel.markRead(id, userId);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('markAsRead error', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read', error: error.message });
  }
};

// For system to fetch pending scheduled notifications and mark them sent (used by a scheduler)
const fetchPendingScheduled = async (req, res) => {
  try {
    const pending = await notificationsModel.getPendingScheduledNotifications();
    res.json({ success: true, data: pending });
  } catch (error) {
    console.error('fetchPendingScheduled error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending notifications', error: error.message });
  }
};

module.exports = {
  createNotification,
  listNotifications,
  markAsRead,
  fetchPendingScheduled,
};
