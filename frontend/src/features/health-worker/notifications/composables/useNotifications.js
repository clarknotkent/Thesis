/**
 * useNotifications Composable
 * 
 * Manages notification loading, filtering, marking as read/unread, 
 * deletion, and polling for new notifications.
 * 
 * @returns {Object} Notification state and methods
 */

import { ref, computed, onBeforeUnmount } from 'vue'
import { notificationAPI } from '@/services/api'

export function useNotifications() {
  // State
  const loading = ref(false)
  const notifications = ref([])
  const filter = ref('all') // 'all', 'unread', 'read'
  
  let pollInterval = null

  // Computed
  const filteredNotifications = computed(() => {
    if (filter.value === 'unread') {
      return notifications.value.filter(n => !n.read)
    } else if (filter.value === 'read') {
      return notifications.value.filter(n => n.read)
    }
    return notifications.value
  })

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
  const readCount = computed(() => notifications.value.filter(n => n.read).length)

  // Helper methods
  const mapType = (row) => {
    const ch = (row.channel || '').toLowerCase()
    const code = (row.template_code || '').toLowerCase()
    
    // Map based on template code
    if (code.includes('overdue') || code.includes('urgent')) return 'urgent'
    if (code.includes('reminder') || code.includes('schedule')) return 'reminder'
    if (code.includes('appointment') || code.includes('vaccination')) return 'appointment'
    if (code.includes('low_stock') || code.includes('alert')) return 'urgent'
    
    // Map based on channel
    if (ch === 'sms') return 'urgent'
    if (ch === 'email') return 'reminder'
    
    return 'system'
  }

  const formatTemplateTitle = (code) => {
    const map = {
      welcome_guardian: 'Welcome',
      schedule_created: 'Schedule Created',
      vaccination_reminder_14: '14-Day Reminder',
      vaccination_reminder_7: '7-Day Reminder',
      vaccination_reminder_0: 'Due Today',
      vaccination_overdue: 'Overdue Alert',
      immunization_confirmation: 'Immunization Confirmed',
      low_stock_alert: 'Low Stock Alert',
      password_reset: 'Password Reset',
      role_change: 'Role Changed',
      new_message: 'New Message',
      conversation_started: 'New Conversation'
    }
    return map[code] || map[code.toLowerCase()] || 'Notification'
  }

  const getNotificationIcon = (type) => {
    const icons = {
      urgent: 'bi bi-exclamation-triangle-fill',
      appointment: 'bi bi-calendar-check-fill',
      system: 'bi bi-gear-fill',
      reminder: 'bi bi-clock-fill'
    }
    return icons[type] || 'bi bi-info-circle-fill'
  }

  const transformNotification = (row) => ({
    id: row.notification_id,
    type: mapType(row),
    title: row.template_code ? formatTemplateTitle(row.template_code) : 'Notification',
    message: row.message_body,
    time: new Date(row.created_at).toLocaleString(),
    timestamp: new Date(row.created_at).getTime(),
    read: !!row.read_at,
    channel: row.channel || 'in-app',
    relatedType: row.related_entity_type,
    relatedId: row.related_entity_id
  })

  // Methods
  const loadNotifications = async () => {
    loading.value = true
    try {
      const resp = await notificationAPI.getMyNotifications({ 
        limit: 100, 
        offset: 0, 
        unreadOnly: false 
      })
      const rows = resp?.data?.data || []
      notifications.value = rows.map(transformNotification)
      
      // Sort by timestamp descending (newest first)
      notifications.value.sort((a, b) => b.timestamp - a.timestamp)
    } catch (e) {
      console.error('Failed to load notifications', e)
    } finally {
      loading.value = false
    }
  }

  const markAsRead = async (notification) => {
    try {
      if (!notification.read) {
        await notificationAPI.markAsRead(notification.id)
        notification.read = true
      }
      
      return {
        shouldNavigate: notification.relatedType === 'conversation' && notification.relatedId,
        relatedId: notification.relatedId
      }
    } catch (e) {
      console.error('Failed to mark as read', e)
      return { shouldNavigate: false }
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.value.filter(n => !n.read)
    
    for (const n of unread) {
      try { 
        await notificationAPI.markAsRead(n.id)
        n.read = true 
      } catch (e) {
        console.error('Failed to mark notification as read:', e)
      }
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId)
      notifications.value = notifications.value.filter(n => n.id !== notificationId)
      return true
    } catch (e) {
      console.error('Failed to delete notification', e)
      return false
    }
  }

  const clearAllRead = async () => {
    const readNotifications = notifications.value.filter(n => n.read)
    
    for (const n of readNotifications) {
      try {
        await notificationAPI.delete(n.id)
      } catch (e) {
        console.error('Failed to delete notification:', e)
      }
    }
    
    notifications.value = notifications.value.filter(n => !n.read)
  }

  const startPolling = (intervalMs = 30000) => {
    // Poll for new notifications
    pollInterval = setInterval(async () => {
      try {
        const resp = await notificationAPI.getMyNotifications({ 
          limit: 100, 
          offset: 0, 
          unreadOnly: false 
        })
        const rows = resp?.data?.data || []
        const newNotifications = rows.map(transformNotification)
        
        newNotifications.sort((a, b) => b.timestamp - a.timestamp)
        notifications.value = newNotifications
      } catch (e) {
        console.error('Polling error:', e)
      }
    }, intervalMs)
  }

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    stopPolling()
  })

  return {
    // State
    loading,
    notifications,
    filter,
    
    // Computed
    filteredNotifications,
    unreadCount,
    readCount,
    
    // Methods
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
    startPolling,
    stopPolling,
    getNotificationIcon
  }
}
