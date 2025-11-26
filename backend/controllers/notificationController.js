import {
  createNotification,
  getNotifications,
  markAsRead,
  updateStatus,
  getPendingNotifications,
  deleteNotification,
  broadcastNotifications
} from '../models/notificationModel.js';
import { sendPushToMultiple } from '../utils/webPush.js';
import supabase from '../db.js';

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
    const result = await createNotification(notificationData, actorId);

    // Send push notification if user is subscribed
    if (result && result.recipient_user_id) {
      sendPushToUser(result.recipient_user_id, {
        title: result.header || 'New Notification',
        body: result.message_body || '',
        data: {
          notificationId: result.notification_id,
          url: '/notifications'
        }
      }).catch(err => console.error('Push send failed:', err));
    }

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
    const result = await broadcastNotifications(payload, actorId);
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

    const notifications = await getNotifications(userId, filters);
    // Best effort total count; if we want exact counts, we'd run a separate count query
    return res.json({ success: true, data: notifications, meta: { totalCount: notifications.length } });
  } catch (error) {
    console.error('getMyNotifications error:', error);
    return sendError(res, error, 'Failed to fetch notifications');
  }
};

// Mark notification as read
const markAsReadHandler = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await markAsRead(id, userId);
    return res.json({ success: true, message: 'Notification marked as read', data: result });
  } catch (error) {
    console.error('markAsRead error:', error);
    return sendError(res, error, 'Failed to mark notification as read');
  }
};

// Delete notification (soft delete)
const deleteNotificationHandler = async (req, res) => {
  try {
    const actorId = req.user?.user_id;
    const { id } = req.params;
    if (!actorId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await deleteNotification(id, actorId);
    return res.json({ success: true, message: 'Notification deleted', data: result });
  } catch (error) {
    console.error('deleteNotification error:', error);
    return sendError(res, error, 'Failed to delete notification');
  }
};

// Get pending notifications (for sending service)
const getPendingNotificationsHandler = async (req, res) => {
  try {
    // This might be restricted to admin or service accounts
    const notifications = await getPendingNotifications();
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

    const result = await updateStatus(id, status, error_message, actorId);
    return res.json({ success: true, message: 'Notification status updated', data: result });
  } catch (error) {
    console.error('updateNotificationStatus error:', error);
    return sendError(res, error, 'Failed to update notification status');
  }
};

// Subscribe to push notifications
const subscribeToPush = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription data' });
    }

    // Store subscription in database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        subscription_data: subscription,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Push subscription saved for user ${userId}`);
    return res.json({ success: true, message: 'Push subscription saved', data });
  } catch (error) {
    console.error('subscribeToPush error:', error);
    return sendError(res, error, 'Failed to save push subscription');
  }
};

// Unsubscribe from push notifications
const unsubscribeFromPush = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription data' });
    }

    // Remove subscription from database
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .match({ user_id: userId, endpoint: subscription.endpoint });

    if (error) throw error;

    console.log(`✅ Push subscription removed for user ${userId}`);
    return res.json({ success: true, message: 'Push subscription removed' });
  } catch (error) {
    console.error('unsubscribeFromPush error:', error);
    return sendError(res, error, 'Failed to remove push subscription');
  }
};

// Helper function to send push notification to a specific user
async function sendPushToUser(userId, payload) {
  try {
    // Get user's subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    // Send push to all user's subscriptions
    const results = await sendPushToMultiple(
      subscriptions.map(s => s.subscription_data),
      payload
    );

    // Remove expired subscriptions
    const expiredSubscriptions = results.results
      .filter(r => r.expired)
      .map(r => r.subscription.endpoint);

    if (expiredSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredSubscriptions);

      console.log(`Removed ${expiredSubscriptions.length} expired subscriptions`);
    }

    console.log(`Push sent to user ${userId}: ${results.sent}/${results.total} successful`);
    return results;
  } catch (error) {
    console.error('sendPushToUser error:', error);
    throw error;
  }
}

export { create, list, markAsReadHandler as markAsRead, deleteNotificationHandler as deleteNotification, getPendingNotificationsHandler as getPendingNotifications, updateNotificationStatus, broadcast, subscribeToPush, unsubscribeFromPush };
