const supabase = require('../db');
const { ACTIVITY } = require('../constants/activityTypes');
const { logActivity } = require('./activityLogger');

function mapNotificationDTO(row) {
  if (!row) return null;
  // Normalize legacy channel tokens (e.g., 'Push' -> 'in-app') to frontend-facing values
  const normalizeOutChannel = (ch) => {
    if (!ch) return ch
    const s = String(ch).trim().toLowerCase()
    if (s === 'push') return 'in-app'
    if (s === 'sms') return 'sms'
    if (s === 'email') return 'email'
    if (s === 'in-app' || s === 'inapp' || s === 'notification') return 'in-app'
    return ch
  }

  const normalizeOutStatus = (st) => {
    if (!st) return st
    const s = String(st).trim().toLowerCase()
    if (['queued','pending'].includes(s)) return 'queued'
    if (s === 'sent') return 'sent'
    if (s === 'failed') return 'failed'
    if (s === 'delivered') return 'delivered'
    return s
  }
  const phTime = (dt) => {
    if (!dt) return null;
    try {
      const d = new Date(dt);
      return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true, timeZone: 'Asia/Manila'
      }).format(d);
    } catch (_) { return dt; }
  };

  return {
    notification_id: row.notification_id,
    channel: normalizeOutChannel(row.channel),
    recipient_user_id: row.recipient_user_id,
    recipient_phone: row.recipient_phone,
    recipient_email: row.recipient_email,
    recipient_name: row.recipient_name, // from view
    created_by: row.created_by ?? null,
    created_by_name: row.created_by_name || null,
    template_code: row.template_code,
    message_body: row.message_body,
    related_entity_type: row.related_entity_type,
    related_entity_id: row.related_entity_id,
    scheduled_at: row.scheduled_at,
    sent_at: row.sent_at,
    status: normalizeOutStatus(row.status),
    error_message: row.error_message,
    created_by: row.created_by,
    created_at: row.created_at,
    is_deleted: row.is_deleted,
    deleted_at: row.deleted_at,
    deleted_by: row.deleted_by,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
    read_at: row.read_at
  };
}

module.exports = {
  // Create new notification
  createNotification: async (notificationData, actorId) => {
    try {
      const coerceEmpty = (v) => (v === '' ? null : v)
      // Normalize incoming channel to DB tokens: Push, SMS, Email
      const normalizeChannelDB = (ch) => {
        if (!ch) return null
        const s = String(ch).trim().toLowerCase()
        if (['in-app','inapp','push','notification','push-notification'].includes(s)) return 'Push'
        if (['sms','text','mobile','sms-text','sms '].includes(s)) return 'SMS'
        if (['email','e-mail','mail'].includes(s)) return 'Email'
        if (['push','sms','email'].includes(s)) return s.charAt(0).toUpperCase() + s.slice(1)
        return ch
      }

      // Normalize incoming status to DB tokens: Queued, Sent, Failed, Delivered
      const normalizeStatusDB = (st) => {
        if (!st) return null
        const s = String(st).trim().toLowerCase()
        if (['pending','queue','queued','schedule','scheduled'].includes(s)) return 'Queued'
        if (s === 'sent') return 'Sent'
        if (s === 'failed') return 'Failed'
        if (s === 'delivered') return 'Delivered'
        return null
      }

      // Accept both snake_case and camelCase field names from clients
      const incoming = notificationData || {}
      console.log('Incoming notificationData:', JSON.stringify(incoming, null, 2));
      const insertPayload = {
        channel: normalizeChannelDB(incoming.channel),
  recipient_user_id: coerceEmpty(
          incoming.recipient_user_id
          ?? incoming.recipientUserId
          ?? incoming.recipientId
          ?? incoming.user_id
          ?? incoming.userId
          ?? incoming.recepient_user_id
          ?? incoming.recepientUserId
          ?? null
        ),
  recipient_phone: coerceEmpty(incoming.recipient_phone ?? incoming.recipientPhone ?? incoming.phone ?? incoming.contact_number ?? incoming.contactNumber ?? incoming.recepient_phone ?? incoming.recepientPhone ?? null),
  recipient_email: coerceEmpty(incoming.recipient_email ?? incoming.recipientEmail ?? incoming.email ?? incoming.recepient_email ?? incoming.recepientEmail ?? null),
        template_code: coerceEmpty(incoming.template_code ?? incoming.templateCode ?? incoming.template ?? null),
        message_body: coerceEmpty(incoming.message_body ?? incoming.messageBody ?? incoming.message ?? null),
        related_entity_type: coerceEmpty(incoming.related_entity_type ?? incoming.relatedEntityType ?? incoming.entity_type ?? incoming.entityType ?? null),
        related_entity_id: incoming.related_entity_id ?? incoming.relatedEntityId ?? incoming.entity_id ?? incoming.entityId ?? null,
        scheduled_at: coerceEmpty(incoming.scheduled_at ?? incoming.scheduledAt ?? null),
        status: normalizeStatusDB(incoming.status) || 'Queued',
        created_by: actorId || null,
        updated_by: actorId || null
      };
      console.log('InsertPayload:', JSON.stringify(insertPayload, null, 2));
      // Basic validations to ensure Inbox visibility and DB constraints
      if (!insertPayload.message_body) {
        const err = new Error('message_body is required')
        err.status = 400
        throw err
      }
      if (insertPayload.channel === 'Push' && !insertPayload.recipient_user_id) {
        const err = new Error('recipient_user_id is required for Push (in-app) notifications')
        err.status = 400
        throw err
      }
      if (insertPayload.channel === 'SMS' && !insertPayload.recipient_phone) {
        const err = new Error('recipient_phone is required for SMS notifications')
        err.status = 400
        throw err
      }
      if (insertPayload.channel === 'Email' && !insertPayload.recipient_email) {
        const err = new Error('recipient_email is required for Email notifications')
        err.status = 400
        throw err
      }
      // Validate channel token against allowed DB tokens
  const allowedChannels = ['Push', 'SMS', 'Email']
      if (!insertPayload.channel || !allowedChannels.includes(insertPayload.channel)) {
        const err = new Error('Invalid channel value; must be one of: ' + allowedChannels.join(', '))
        err.status = 400
        throw err
      }

      // For in-app immediate notifications (no schedule), mark as sent immediately
      if (insertPayload.channel === 'Push' && !insertPayload.scheduled_at) {
        insertPayload.status = 'Sent'
        insertPayload.sent_at = new Date().toISOString()
      }

      let data, error;
      ({ data, error } = await supabase.from('notifications').insert(insertPayload).select().single());
      // If the DB has a stricter/legacy check constraint (e.g., expects 'Push'/'SMS'/'Email'), retry with legacy tokens
      if (error && (error.code === '23514' || String(error.message || '').includes('notifications_channel_check'))) {
        const legacyMap = { 'in-app': 'Push', 'sms': 'SMS', 'email': 'Email' };
        const retryPayload = { ...insertPayload, channel: legacyMap[insertPayload.channel] || insertPayload.channel };
        ({ data, error } = await supabase.from('notifications').insert(retryPayload).select().single());
      }
      if (error) throw error;
      // Activity: notification created/enqueued
      try {
        await logActivity({
          action_type: ACTIVITY.NOTIFICATION.CREATE,
          description: `Notification created/enqueued ${data.notification_id}`,
          user_id: actorId || null,
          entity_type: 'notification',
          entity_id: data.notification_id,
          new_value: {
            channel: data.channel,
            recipient_user_id: data.recipient_user_id,
            recipient_phone: data.recipient_phone,
            recipient_email: data.recipient_email,
            template_code: data.template_code,
            related_entity_type: data.related_entity_type,
            related_entity_id: data.related_entity_id,
            status: data.status
          }
        });
      } catch (_) {}
      return mapNotificationDTO(data);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Get notifications for a user (inbox)
  getNotifications: async (userId, filters = {}) => {
    try {
      let query = supabase.from('notifications_view').select('*').eq('recipient_user_id', userId).eq('is_deleted', false);

      if (filters.status) {
        const s = String(filters.status).trim().toLowerCase()
        const map = { pending: 'Queued', queued: 'Queued', queue: 'Queued', schedule: 'Queued', scheduled: 'Queued', sent: 'Sent', failed: 'Failed', delivered: 'Delivered' }
        query = query.eq('status', map[s] || s)
      }
      if (filters.channel) {
        const ch = String(filters.channel).toLowerCase().trim()
        // Accept legacy stored values too
        if (['in-app','inapp','push','notification','push-notification'].includes(ch)) {
          query = query.in('channel', ['Push', 'push'])
        } else if (['sms','sms-text','text','mobile'].includes(ch)) {
          query = query.in('channel', ['SMS', 'sms'])
        } else if (['email','e-mail','mail'].includes(ch)) {
          query = query.in('channel', ['Email', 'email'])
        } else {
          query = query.eq('channel', ch)
        }
      }
      if (filters.unreadOnly) query = query.is('read_at', null);
      if (filters.search) {
        const q = `%${String(filters.search).toLowerCase()}%`
        // ILIKE on message_body or template_code
        query = query.or(`message_body.ilike.${q},template_code.ilike.${q}`)
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) query = query.limit(filters.limit);
      if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with created_by_name (lookup from users)
      const creatorIds = Array.from(new Set((data || []).map(r => r.created_by).filter(id => id != null)));
      let namesById = {};
      if (creatorIds.length) {
        try {
          const { data: usersRows } = await supabase
            .from('users')
            .select('user_id, firstname, surname, email')
            .in('user_id', creatorIds);
          namesById = (usersRows || []).reduce((acc, u) => {
            const name = [u.firstname || '', u.surname || ''].join(' ').trim() || u.email || `User #${u.user_id}`;
            acc[u.user_id] = name;
            return acc;
          }, {});
        } catch (_) {}
      }

      // Attach created_by_name and Manila time strings before mapping to DTO
      const enriched = (data || []).map(r => ({
        ...r,
        created_by_name: (r.created_by == null) ? 'System' : (namesById[r.created_by] || `User #${r.created_by}`),
      }));
      return enriched.map(mapNotificationDTO);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId, userId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString(), updated_by: userId })
        .eq('notification_id', notificationId)
        .eq('recipient_user_id', userId)
        .select()
        .single();
      if (error) throw error;
      // Activity: notification read
      try {
        await logActivity({
          action_type: ACTIVITY.NOTIFICATION.READ,
          description: `Notification read ${notificationId}`,
          user_id: userId || null,
          entity_type: 'notification',
          entity_id: notificationId,
          new_value: { read_at: data.read_at }
        });
      } catch (_) {}
      return mapNotificationDTO(data);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Update notification status (for sending)
  updateStatus: async (notificationId, status, errorMessage = null, actorId) => {
    try {
      const normalizeStatusDB = (st) => {
        if (!st) return null
        const s = String(st).trim().toLowerCase()
        if (['pending','queue','queued','schedule','scheduled'].includes(s)) return 'Queued'
        if (s === 'sent') return 'Sent'
        if (s === 'failed') return 'Failed'
        if (s === 'delivered') return 'Delivered'
        return null
      }
      const updatePayload = {
        status: normalizeStatusDB(status),
        updated_by: actorId || null
      };
      if (updatePayload.status === 'Sent') updatePayload.sent_at = new Date().toISOString();
      if (errorMessage) updatePayload.error_message = errorMessage;

      const { data, error } = await supabase
        .from('notifications')
        .update(updatePayload)
        .eq('notification_id', notificationId)
        .select()
        .single();
      if (error) throw error;
      // Activity: notification send/fail events
      try {
        const s = updatePayload.status;
        if (s === 'Sent' || s === 'Delivered' || s === 'Failed') {
          const action = (s === 'Failed') ? ACTIVITY.NOTIFICATION.FAIL : ACTIVITY.NOTIFICATION.SEND;
          await logActivity({
            action_type: action,
            description: `Notification ${s.toLowerCase()}: ${notificationId}`,
            user_id: actorId || updatePayload.updated_by || null,
            entity_type: 'notification',
            entity_id: notificationId,
            new_value: {
              status: s,
              error_message: updatePayload.error_message || null,
              sent_at: updatePayload.sent_at || null
            }
          });
        }
      } catch (_) {}
      return mapNotificationDTO(data);
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  },

  // Get pending notifications ready to send
  getPendingNotifications: async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
  .eq('status', 'Queued')
        .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
        .eq('is_deleted', false);
      if (error) throw error;
      return data.map(mapNotificationDTO);
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
      throw error;
    }
  },

  // Delete notification (soft delete)
  deleteNotification: async (notificationId, actorId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: actorId,
          updated_by: actorId
        })
        .eq('notification_id', notificationId)
        .select()
        .single();
      if (error) throw error;
      // Activity: deletion
      try {
        await logActivity({
          action_type: ACTIVITY.NOTIFICATION.DELETED,
          description: `Notification deleted ${notificationId}`,
          user_id: actorId || null,
          entity_type: 'notification',
          entity_id: notificationId,
          old_value: { is_deleted: false },
          new_value: { is_deleted: true }
        });
      } catch (_) {}
      return mapNotificationDTO(data);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
};

// Helper function for activity logging
async function logActivitySafely(activityData) {
  try {
    await logActivity(activityData);
  } catch (logError) {
    console.warn('Failed to log activity:', logError.message);
  }
}
