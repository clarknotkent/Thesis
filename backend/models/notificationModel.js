import supabase from '../db.js';
import { ACTIVITY } from '../constants/activityTypes.js';
import { logActivity } from './activityLogger.js';

// Normalization functions
const toSentenceCase = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Normalize a notification row into a consistent DTO
function mapNotificationDTO(row) {
  if (!row) return row;
  const {
    notification_id,
    channel,
    recipient_user_id,
    recipient_phone,
    recipient_email,
    template_code,
    message_body,
    header,
    related_entity_type,
    related_entity_id,
    status,
    error_message,
    scheduled_at,
    sent_at,
    read_at,
    created_at,
    updated_at,
    deleted_at,
    is_deleted,
    created_by,
    updated_by,
    deleted_by,
    created_by_name,
  } = row;

  // Derive header from template if it's a custom message (no template_code)
  let derivedHeader = header;
  if (!template_code && message_body) {
    // For custom messages, extract header from the first line or first sentence
    const lines = message_body.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      // Take first line if it's short (likely a header), or first sentence
      const firstLine = lines[0].trim();
      if (firstLine.length <= 50) {
        derivedHeader = firstLine;
      } else {
        // Take first sentence if line is long
        const firstSentence = message_body.split(/[.!?]/)[0].trim();
        if (firstSentence.length <= 50) {
          derivedHeader = firstSentence;
        }
      }
    }
  }

  return {
    notification_id,
    channel,
    recipient_user_id,
    recipient_phone,
    recipient_email,
    template_code,
    message_body,
    header: derivedHeader ?? null,
    related_entity_type,
    related_entity_id,
    status,
    error_message,
    scheduled_at,
    sent_at,
    read_at,
    created_at,
    updated_at,
    deleted_at,
    is_deleted,
    created_by,
    updated_by,
    deleted_by,
    created_by_name: created_by_name ?? row.created_by_name ?? null,
  };
}
// Broadcast notifications to a recipient group (by role)
const broadcastNotifications = async (notificationData, actorId) => {
  try {
    const incoming = notificationData || {};
    const coerceEmpty = (v) => (v === '' ? null : v);
    const normalizeChannelDB = (ch) => {
      if (!ch) return null;
      const s = String(ch).trim().toLowerCase();
      if (['in-app','inapp','push','notification','push-notification'].includes(s)) return 'Push';
      if (['sms','text','mobile','sms-text','sms'].includes(s)) return 'SMS';
      if (['email','e-mail','mail'].includes(s)) return 'Email';
      if (['push','sms','email'].includes(s)) return s.charAt(0).toUpperCase() + s.slice(1);
      return ch;
    };
    const mapGroupToRoles = (grp) => {
      const g = String(grp || '').trim().toLowerCase();
      if (!g || ['all','all-users','all_users','everyone'].includes(g)) return ['Admin','HealthStaff','Guardian'];
      if (['guardian','guardians','parents','parent'].includes(g)) return ['Guardian'];
      if (['healthstaff','health-staff','health staff','health workers','health-workers','healthworker','healthworkers','hs'].includes(g)) return ['HealthStaff'];
      if (['admin','admins','administrator','administrators','system admin'].includes(g)) return ['Admin'];
      return [];
    };

    const channel = normalizeChannelDB(incoming.channel);
    if (!channel) {
      const err = new Error('channel is required');
      err.status = 400;
      throw err;
    }
    const roles = mapGroupToRoles(incoming.recipientGroup || incoming.recipient_group);
    if (!roles.length) {
      const err = new Error('recipientGroup is required and must be one of admins|healthstaff|guardians|all-users');
      err.status = 400;
      throw err;
    }
    const messageBody = coerceEmpty(toSentenceCase(incoming.message_body ?? incoming.messageBody ?? incoming.message));
    if (!messageBody) {
      const err = new Error('message_body is required');
      err.status = 400;
      throw err;
    }
    const templateCode = coerceEmpty(incoming.template_code ?? incoming.templateCode ?? incoming.template ?? null);
    const relatedType = coerceEmpty(incoming.related_entity_type ?? incoming.relatedEntityType ?? incoming.entity_type ?? incoming.entityType ?? null);
    const relatedId = incoming.related_entity_id ?? incoming.relatedEntityId ?? incoming.entity_id ?? incoming.entityId ?? null;
    const scheduledAt = coerceEmpty(incoming.scheduled_at ?? incoming.scheduledAt ?? null);

    // Fetch recipients by role (active, not deleted)
    const { data: users, error: uerr } = await supabase
      .from('users')
      .select('user_id, email, contact_number, is_deleted, user_status, role')
      .in('role', roles)
      .eq('is_deleted', false);
    if (uerr) throw uerr;

    // Build payloads per channel requirements
    const now = new Date().toISOString();
    const rows = [];
    for (const u of users || []) {
      const uStatus = String(u.user_status || 'active').toLowerCase();
      if (uStatus !== 'active') continue;
      const row = {
        channel,
        recipient_user_id: null,
        recipient_phone: null,
        recipient_email: null,
        template_code: templateCode,
        message_body: messageBody,
        related_entity_type: relatedType,
        related_entity_id: relatedId,
        scheduled_at: scheduledAt,
        status: 'Queued',
        created_by: actorId || null,
        updated_by: actorId || null
      };
      if (channel === 'Push') {
        row.recipient_user_id = u.user_id;
        if (!row.scheduled_at) {
          row.status = 'Sent';
          row.sent_at = now;
        }
      } else if (channel === 'SMS') {
        if (!u.contact_number) continue;
        row.recipient_phone = u.contact_number;
      } else if (channel === 'Email') {
        if (!u.email) continue;
        row.recipient_email = u.email;
      }
      rows.push(row);
    }
    if (!rows.length) return [];

    const { data, error } = await supabase.from('notifications').insert(rows).select('*');
    if (error) throw error;
    return (data || []).map(mapNotificationDTO);
  } catch (error) {
    console.error('Error broadcasting notifications:', error);
    throw error;
  }
};

// Create new notification
const createNotification = async (notificationData, actorId) => {
  try {
    const coerceEmpty = (v) => (v === '' ? null : v);
    // Normalize incoming channel to DB tokens: Push, SMS, Email
    const normalizeChannelDB = (ch) => {
      if (!ch) return null;
      const s = String(ch).trim().toLowerCase();
      if (['in-app','inapp','push','notification','push-notification'].includes(s)) return 'Push';
      if (['sms','text','mobile','sms-text','sms'].includes(s)) return 'SMS';
      if (['email','e-mail','mail'].includes(s)) return 'Email';
      if (['push','sms','email'].includes(s)) return s.charAt(0).toUpperCase() + s.slice(1);
      return ch;
    };

    // Normalize incoming status to DB tokens: Queued, Sent, Failed, Delivered
    const normalizeStatusDB = (st) => {
      if (!st) return null;
      const s = String(st).trim().toLowerCase();
      if (['pending','queue','queued','schedule','scheduled'].includes(s)) return 'Queued';
      if (s === 'sent') return 'Sent';
      if (s === 'failed') return 'Failed';
      if (s === 'delivered') return 'Delivered';
      return null;
    };

    // Accept both snake_case and camelCase field names from clients
    const incoming = notificationData || {};
    console.log('Incoming notificationData:', JSON.stringify(incoming, null, 2));

    // For custom messages (empty template_code), use header as template_code
    let effectiveTemplateCode = coerceEmpty(incoming.template_code ?? incoming.templateCode ?? incoming.template ?? null);
    const headerValue = coerceEmpty(incoming.header ?? incoming.notificationHeader ?? null);

    if (!effectiveTemplateCode && headerValue) {
      effectiveTemplateCode = headerValue;
    }

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
      template_code: effectiveTemplateCode,
      message_body: coerceEmpty(toSentenceCase(incoming.message_body ?? incoming.messageBody ?? incoming.message ?? null)),
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
      const err = new Error('message_body is required');
      err.status = 400;
      throw err;
    }
    if (insertPayload.channel === 'Push' && !insertPayload.recipient_user_id) {
      const err = new Error('recipient_user_id is required for Push (in-app) notifications');
      err.status = 400;
      throw err;
    }
    if (insertPayload.channel === 'SMS' && !insertPayload.recipient_phone) {
      const err = new Error('recipient_phone is required for SMS notifications');
      err.status = 400;
      throw err;
    }
    if (insertPayload.channel === 'Email' && !insertPayload.recipient_email) {
      const err = new Error('recipient_email is required for Email notifications');
      err.status = 400;
      throw err;
    }
    // Validate channel token against allowed DB tokens
    const allowedChannels = ['Push', 'SMS', 'Email'];
    if (!insertPayload.channel || !allowedChannels.includes(insertPayload.channel)) {
      const err = new Error('Invalid channel value; must be one of: ' + allowedChannels.join(', '));
      err.status = 400;
      throw err;
    }

    // For in-app immediate notifications (no schedule), mark as sent immediately
    if (insertPayload.channel === 'Push' && !insertPayload.scheduled_at) {
      insertPayload.status = 'Sent';
      insertPayload.sent_at = new Date().toISOString();
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
};

// Get notifications for a user (inbox)
const getNotifications = async (userId, filters = {}) => {
  try {
    let query = supabase.from('notifications_view').select('*').eq('recipient_user_id', userId).eq('is_deleted', false);

    if (filters.status) {
      const s = String(filters.status).trim().toLowerCase();
      const map = { pending: 'Queued', queued: 'Queued', queue: 'Queued', schedule: 'Queued', scheduled: 'Queued', sent: 'Sent', failed: 'Failed', delivered: 'Delivered' };
      query = query.eq('status', map[s] || s);
    }
    if (filters.channel) {
      const ch = String(filters.channel).toLowerCase().trim();
      // Accept legacy stored values too
      if (['in-app','inapp','push','notification','push-notification'].includes(ch)) {
        query = query.in('channel', ['Push', 'push']);
      } else if (['sms','sms-text','text','mobile'].includes(ch)) {
        query = query.in('channel', ['SMS', 'sms']);
      } else if (['email','e-mail','mail'].includes(ch)) {
        query = query.in('channel', ['Email', 'email']);
      } else {
        query = query.eq('channel', ch);
      }
    }
    if (filters.unreadOnly) query = query.is('read_at', null);
    if (filters.search) {
      const q = `%${String(filters.search).toLowerCase()}%`;
      // ILIKE on message_body or template_code
      query = query.or(`message_body.ilike.${q},template_code.ilike.${q}`);
    }

    query = query.order('created_at', { ascending: false });

    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error } = await query;
    if (error) throw error;

    // Enrich with created_by_name (lookup from users)
    const creatorIds = Array.from(new Set((data || []).map(r => r.created_by).filter(id => id !== null)));
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
      created_by_name: (r.created_by === null) ? 'System' : (namesById[r.created_by] || `User #${r.created_by}`),
    }));
    return enriched.map(mapNotificationDTO);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Mark notification as read
const markAsRead = async (notificationId, userId) => {
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
};

// Update notification status (for sending)
const updateStatus = async (notificationId, status, errorMessage = null, actorId) => {
  try {
    const normalizeStatusDB = (st) => {
      if (!st) return null;
      const s = String(st).trim().toLowerCase();
      if (['pending','queue','queued','schedule','scheduled'].includes(s)) return 'Queued';
      if (s === 'sent') return 'Sent';
      if (s === 'failed') return 'Failed';
      if (s === 'delivered') return 'Delivered';
      return null;
    };
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
};

// Get pending notifications ready to send
const getPendingNotifications = async () => {
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
};

// Delete notification (soft delete)
const deleteNotification = async (notificationId, actorId) => {
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
};

export {
  createNotification,
  getNotifications,
  markAsRead,
  updateStatus,
  getPendingNotifications,
  deleteNotification,
  broadcastNotifications
};
