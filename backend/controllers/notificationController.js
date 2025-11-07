import * as notificationModel from '../models/notificationModel.js';

// Helper to send standardized error
function sendError(res, error, fallback) {
  const status = error.status || 500;
  return res.status(status).json({ success: false, message: error.status ? error.message : fallback, error: error.message });
}

// Create notification (admin)
const create = async (req, res) => {
  try {
    const actorId = req.user?.user_id || null;
    const notificationData = req.body;
    const result = await notificationModel.createNotification(notificationData, actorId);
    return res.status(201).json({ success: true, message: 'Notification created', data: result });
  } catch (error) {
    console.error('createNotification error:', error);
    return sendError(res, error, 'Failed to create notification');
  }
};

// Broadcast notifications to recipient groups (admins/healthstaff/guardians/all-users)
const broadcast = async (req, res) => {
  try {
    const actorId = req.user?.user_id || null;
    const payload = req.body;
    const result = await notificationModel.broadcastNotifications(payload, actorId);
    return res.status(201).json({ success: true, message: `Broadcast created for ${result.length} recipient(s)`, data: result });
  } catch (error) {
    console.error('broadcastNotifications error:', error);
    return sendError(res, error, 'Failed to broadcast notifications');
  }
};

// Get notifications for current user (inbox)
const list = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const filters = {
      status: req.query.status,
      channel: req.query.channel,
      unreadOnly: req.query.unreadOnly === 'true',
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    const notifications = await notificationModel.getNotifications(userId, filters);
    // Best effort total count; if we want exact counts, we'd run a separate count query
    return res.json({ success: true, data: notifications, meta: { totalCount: notifications.length } });
  } catch (error) {
    console.error('getMyNotifications error:', error);
    return sendError(res, error, 'Failed to fetch notifications');
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await notificationModel.markAsRead(id, userId);
    return res.json({ success: true, message: 'Notification marked as read', data: result });
  } catch (error) {
    console.error('markAsRead error:', error);
    return sendError(res, error, 'Failed to mark notification as read');
  }
};

// Delete notification (soft delete)
const deleteNotification = async (req, res) => {
  try {
    const actorId = req.user?.user_id;
    const { id } = req.params;
    if (!actorId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await notificationModel.deleteNotification(id, actorId);
    return res.json({ success: true, message: 'Notification deleted', data: result });
  } catch (error) {
    console.error('deleteNotification error:', error);
    return sendError(res, error, 'Failed to delete notification');
  }
};

// Get pending notifications (for sending service)
const getPendingNotifications = async (req, res) => {
  try {
    // This might be restricted to admin or service accounts
    const notifications = await notificationModel.getPendingNotifications();
    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('getPendingNotifications error:', error);
    return sendError(res, error, 'Failed to fetch pending notifications');
  }
};

// Update notification status (for sending service)
const updateNotificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, error_message } = req.body;
    const actorId = req.user?.user_id || null;

    const result = await notificationModel.updateStatus(id, status, error_message, actorId);
    return res.json({ success: true, message: 'Notification status updated', data: result });
  } catch (error) {
    console.error('updateNotificationStatus error:', error);
    return sendError(res, error, 'Failed to update notification status');
  }
};

export { create, list, markAsRead, deleteNotification, getPendingNotifications, updateNotificationStatus, broadcast };
