const supabase = require('../db');
const { ACTIVITY } = require('../constants/activityTypes');

function mapNotificationDTO(row) {
  if (!row) return null;
  return {
    notification_id: row.notification_id,
    channel: row.channel,
    recipient_user_id: row.recipient_user_id,
    recipient_phone: row.recipient_phone,
    recipient_email: row.recipient_email,
    recipient_name: row.recipient_name, // from view
    template_code: row.template_code,
    message_body: row.message_body,
    related_entity_type: row.related_entity_type,
    related_entity_id: row.related_entity_id,
    scheduled_at: row.scheduled_at,
    sent_at: row.sent_at,
    status: row.status,
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
      const insertPayload = {
        channel: notificationData.channel,
        recipient_user_id: notificationData.recipient_user_id || null,
        recipient_phone: notificationData.recipient_phone || null,
        recipient_email: notificationData.recipient_email || null,
        template_code: notificationData.template_code,
        message_body: notificationData.message_body,
        related_entity_type: notificationData.related_entity_type || null,
        related_entity_id: notificationData.related_entity_id || null,
        scheduled_at: notificationData.scheduled_at || null,
        status: notificationData.status || 'pending',
        created_by: actorId || null,
        updated_by: actorId || null
      };
      const { data, error } = await supabase.from('notifications').insert(insertPayload).select().single();
      if (error) throw error;
      await logActivitySafely({
        action_type: 'NOTIFICATION_CREATE',
        description: `Created notification ${data.notification_id}`,
        user_id: actorId || null,
        entity_type: 'notification',
        entity_id: data.notification_id,
        new_value: { template_code: data.template_code, recipient_user_id: data.recipient_user_id }
      });
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

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.channel) query = query.eq('channel', filters.channel);
      if (filters.unreadOnly) query = query.is('read_at', null);

      query = query.order('created_at', { ascending: false });

      if (filters.limit) query = query.limit(filters.limit);
      if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

      const { data, error } = await query;
      if (error) throw error;
      return data.map(mapNotificationDTO);
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
      return mapNotificationDTO(data);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Update notification status (for sending)
  updateStatus: async (notificationId, status, errorMessage = null, actorId) => {
    try {
      const updatePayload = {
        status: status,
        updated_by: actorId || null
      };
      if (status === 'sent') updatePayload.sent_at = new Date().toISOString();
      if (errorMessage) updatePayload.error_message = errorMessage;

      const { data, error } = await supabase
        .from('notifications')
        .update(updatePayload)
        .eq('notification_id', notificationId)
        .select()
        .single();
      if (error) throw error;
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
        .eq('status', 'pending')
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
    await supabase.from('activitylogs').insert(activityData);
  } catch (logError) {
    console.warn('Failed to log activity:', logError.message);
  }
}
