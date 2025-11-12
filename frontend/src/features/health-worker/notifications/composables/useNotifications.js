/**
 * useNotifications Composable
 * 
 * Manages notification loading, filtering, marking as read/unread, 
 * deletion, and polling for new notifications.
 * 
 * @returns {Object} Notification state and methods
 */

import { ref, computed, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import { db } from '@/services/offline/db' // StaffOfflineDB
import { useOffline } from '@/composables/useOffline'

export function useNotifications() {
  const { effectiveOnline } = useOffline()
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
    title: row.title || row.template_code || 'Notification',
    message: row.message_body,
    created_at: row.created_at || row.sent_at || row.scheduled_at,
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
    if (effectiveOnline.value) {
      // ONLINE: Fetch from API
      console.log('🌐 Fetching notifications from API...')
      const response = await api.get('/notifications')
      const items = Array.isArray(response?.data) ? response.data : (response?.data?.data || [])

      notifications.value = items.map(transformNotification)        // Sort by timestamp descending (newest first)
        notifications.value.sort((a, b) => b.timestamp - a.timestamp)
        console.log('✅ Notifications loaded from API')
      } else {
        // OFFLINE: Load from cache
        console.log('📴 Loading notifications from cache...')
        try {
          // Ensure database is open
          if (!db.isOpen()) {
            await db.open()
            console.log('✅ StaffOfflineDB opened for notifications fetch')
          }
          
          const cachedNotifications = await db.notifications.toArray()
          
          // Transform cached notifications to match the expected format
          notifications.value = cachedNotifications.map(row => transformNotification({
            notification_id: row.id || row.notification_id,
            channel: row.channel || 'in-app',
            template_code: row.template_code || row.type || 'system',
            title: row.title || row.template_code || 'Notification',
            message_body: row.message || row.message_body || '',
            created_at: row.created_at || row.timestamp,
            read_at: row.read_at || (row.read ? new Date().toISOString() : null),
            related_entity_type: row.related_entity_type || row.relatedType,
            related_entity_id: row.related_entity_id || row.relatedId
          }))
          
          // Sort by timestamp descending (newest first)
          notifications.value.sort((a, b) => b.timestamp - a.timestamp)
          
          console.log(`✅ Loaded ${notifications.value.length} notifications from cache`)
        } catch (cacheError) {
          console.error('❌ Error loading notifications from cache:', cacheError)
          notifications.value = []
        }
      }
    } catch (e) {
      console.error('Failed to load notifications', e)
    } finally {
      loading.value = false
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.value.filter(n => !n.read)
    
    for (const n of unread) {
      try { 
        await api.put(`/notifications/${n.id}/read`)
        n.read = true 
      } catch (e) {
        console.error('Failed to mark notification as read:', e)
      }
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`)
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
        await api.delete(`/notifications/${n.id}`)
      } catch (e) {
        console.error('Failed to delete notification:', e)
      }
    }
    
    notifications.value = notifications.value.filter(n => !n.read)
  }

  const startPolling = (intervalMs = 30000) => {
    // Poll for new notifications (only when online)
    if (!effectiveOnline.value) {
      console.log('📴 Skipping notification polling - offline mode')
      return
    }
    
    pollInterval = setInterval(async () => {
      if (!effectiveOnline.value) return // Skip if went offline
      
      try {
        const response = await api.get('/notifications')
        const items = Array.isArray(response?.data) ? response.data : (response?.data?.data || [])
        const newNotifications = items.map(transformNotification)
        
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
    markAllAsRead,
    deleteNotification,
    clearAllRead,
    startPolling,
    stopPolling,
    getNotificationIcon
  }
}
