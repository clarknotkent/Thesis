<template>
  <HealthWorkerLayout>
    <div class="notifications-container">
      <!-- Back Button -->
      <div class="back-button-container">
        <button @click="goBack" class="back-button">
          <i class="bi bi-arrow-left"></i>
          <span>Back</span>
        </button>
      </div>

      <!-- Notifications Header -->
      <div class="notifications-header">
        <div class="header-top">
          <h4 class="mb-0">
            <i class="bi bi-bell me-2"></i>
            Notifications
          </h4>
          <div class="header-actions">
            <button 
              v-if="unreadCount > 0" 
              class="btn btn-sm btn-outline-primary" 
              @click="markAllAsRead"
              title="Mark all as read"
            >
              <i class="bi bi-check2-all"></i>
            </button>
            <button 
              v-if="readCount > 0" 
              class="btn btn-sm btn-outline-danger" 
              @click="clearAllRead"
              title="Clear all read"
            >
              <i class="bi bi-trash"></i>
            </button>
            <button 
              class="btn btn-sm btn-outline-secondary" 
              @click="loadNotifications"
              :disabled="loading"
              title="Refresh"
            >
              <i class="bi bi-arrow-clockwise" :class="{ 'spin': loading }"></i>
            </button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button 
            class="filter-tab" 
            :class="{ active: filter === 'all' }"
            @click="filter = 'all'"
          >
            All ({{ notifications.length }})
          </button>
          <button 
            class="filter-tab" 
            :class="{ active: filter === 'unread' }"
            @click="filter = 'unread'"
          >
            Unread ({{ unreadCount }})
          </button>
          <button 
            class="filter-tab" 
            :class="{ active: filter === 'read' }"
            @click="filter = 'read'"
          >
            Read ({{ readCount }})
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && notifications.length === 0" class="loading-state">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading notifications...</p>
      </div>

      <!-- Notifications List -->
      <div v-else-if="filteredNotifications.length > 0" class="notifications-list">
        <div 
          v-for="notification in filteredNotifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 'unread': !notification.read }"
          @click="markAsRead(notification)"
        >
          <div class="notification-icon" :class="notification.type">
            <i :class="getNotificationIcon(notification.type)"></i>
          </div>
          <div class="notification-content">
            <div class="notification-header">
              <h6 class="notification-title">{{ notification.title }}</h6>
              <div class="notification-actions">
                <small class="notification-time">{{ notification.time }}</small>
                <button 
                  class="delete-btn" 
                  @click="deleteNotification(notification, $event)"
                  title="Delete"
                >
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>
            <p class="notification-message">{{ notification.message }}</p>
            <div class="notification-footer">
              <span class="notification-channel">
                <i 
                  :class="{
                    'bi bi-app': notification.channel === 'in-app' || notification.channel === 'Push',
                    'bi bi-envelope': notification.channel === 'email',
                    'bi bi-chat': notification.channel === 'sms'
                  }"
                ></i>
                {{ notification.channel }}
              </span>
            </div>
            <span v-if="!notification.read" class="unread-indicator"></span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="bi bi-bell-fill empty-icon"></i>
        <h5>No notifications</h5>
        <p class="text-muted">
          {{ filter === 'unread' ? "You're all caught up!" : 
             filter === 'read' ? "No read notifications" : 
             "You're all caught up!" }}
        </p>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import { notificationAPI } from '@/services/api'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

const loading = ref(false)
const notifications = ref([])
const filter = ref('all') // 'all', 'unread', 'read'

let pollInterval = null

const loadNotifications = async () => {
  loading.value = true
  try {
    const resp = await notificationAPI.getMyNotifications({ limit: 100, offset: 0, unreadOnly: false })
    const rows = resp?.data?.data || []
    notifications.value = rows.map(row => ({
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
    }))
    
    // Sort by timestamp descending (newest first)
    notifications.value.sort((a, b) => b.timestamp - a.timestamp)
  } catch (e) {
    console.error('Failed to load notifications', e)
  } finally {
    loading.value = false
  }
}

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

function mapType(row) {
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

function formatTemplateTitle(code) {
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

const markAsRead = async (notification) => {
  try {
    if (!notification.read) {
      await notificationAPI.markAsRead(notification.id)
      notification.read = true
    }
    
    // If related to conversation, navigate to messages
    if (notification.relatedType === 'conversation' && notification.relatedId) {
      router.push('/healthworker/messages')
    }
  } catch (e) {
    console.error('Failed to mark as read', e)
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

const deleteNotification = async (notification, event) => {
  event.stopPropagation()
  
  if (!confirm('Delete this notification?')) return
  
  try {
    await notificationAPI.delete(notification.id)
    notifications.value = notifications.value.filter(n => n.id !== notification.id)
  } catch (e) {
    console.error('Failed to delete notification', e)
    alert('Failed to delete notification')
  }
}

const clearAllRead = async () => {
  if (!confirm('Clear all read notifications?')) return
  
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

const startPolling = () => {
  // Poll for new notifications every 30 seconds
  pollInterval = setInterval(async () => {
    try {
      const resp = await notificationAPI.getMyNotifications({ limit: 100, offset: 0, unreadOnly: false })
      const rows = resp?.data?.data || []
      const newNotifications = rows.map(row => ({
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
      }))
      
      newNotifications.sort((a, b) => b.timestamp - a.timestamp)
      notifications.value = newNotifications
    } catch (e) {
      console.error('Polling error:', e)
    }
  }, 30000) // 30 seconds
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(() => {
  loadNotifications()
  startPolling()
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
.notifications-container {
  max-width: 100%;
  margin: 0 auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: #6c757d;
}

.back-button-container {
  margin-bottom: 1rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #007bff;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0;
  cursor: pointer;
  transition: color 0.2s ease;
}

.back-button:hover {
  color: #0056b3;
}

.back-button i {
  font-size: 1rem;
}

.notifications-header {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid #ffc107;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.header-actions .btn {
  padding: 0.375rem 0.75rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
}

.filter-tab {
  flex: 1;
  padding: 0.5rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab:hover {
  background: #f8f9fa;
  border-color: #007bff;
}

.filter-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.notifications-list {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.notification-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;
  position: relative;
  cursor: pointer;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread {
  background-color: #fffbf0;
  border-left: 3px solid #ffc107;
}

.notification-icon {
  margin-right: 0.75rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.notification-icon.urgent {
  background: #dc3545;
}

.notification-icon.appointment {
  background: #28a745;
}

.notification-icon.system {
  background: #6c757d;
}

.notification-icon.reminder {
  background: #ffc107;
  color: #212529;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.25rem;
  gap: 0.5rem;
}

.notification-title {
  font-weight: 600;
  margin: 0;
  color: #333;
  font-size: 0.9rem;
}

.notification-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.notification-time {
  color: #6c757d;
  font-size: 0.75rem;
  white-space: nowrap;
}

.delete-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
  opacity: 0;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(220, 53, 69, 0.1);
}

.notification-message {
  margin: 0 0 0.5rem 0;
  color: #555;
  font-size: 0.875rem;
  line-height: 1.4;
}

.notification-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notification-channel {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6c757d;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.unread-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 8px;
  height: 8px;
  background: #ffc107;
  border-radius: 50%;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .notifications-header {
    padding: 0.75rem;
  }

  .header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .filter-tabs {
    gap: 0.25rem;
  }

  .filter-tab {
    font-size: 0.75rem;
    padding: 0.4rem;
  }
  
  .notification-item {
    padding: 0.75rem;
  }
  
  .notification-icon {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
  
  .notification-title {
    font-size: 0.85rem;
  }
  
  .notification-message {
    font-size: 0.8rem;
  }

  .notification-time {
    font-size: 0.7rem;
  }

  .delete-btn {
    opacity: 1;
  }
}
</style>