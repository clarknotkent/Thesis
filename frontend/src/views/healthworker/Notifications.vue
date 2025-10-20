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
        <h4 class="mb-0">
          <i class="bi bi-bell me-2"></i>
          Notifications
        </h4>
        <button v-if="unreadCount > 0" class="btn btn-sm btn-outline-primary" @click="markAllAsRead">
          Mark all as read
        </button>
      </div>

      <!-- Notifications List -->
      <div class="notifications-list">
        <div 
          v-for="notification in notifications" 
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
              <small class="notification-time">{{ notification.time }}</small>
            </div>
            <p class="notification-message">{{ notification.message }}</p>
            <span v-if="!notification.read" class="unread-indicator"></span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="notifications.length === 0" class="empty-state">
        <i class="bi bi-bell-fill empty-icon"></i>
        <h5>No notifications</h5>
        <p class="text-muted">You're all caught up!</p>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import { notificationAPI } from '@/services/api'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

const loading = ref(false)
const notifications = ref([])

const loadNotifications = async () => {
  loading.value = true
  try {
    const resp = await notificationAPI.getMyNotifications({ limit: 50, offset: 0, unreadOnly: false })
    const rows = resp?.data?.data || []
    notifications.value = rows.map(row => ({
      id: row.notification_id,
      type: mapType(row),
      title: row.template_code ? formatTemplateTitle(row.template_code) : 'Notification',
      message: row.message_body,
      time: new Date(row.created_at).toLocaleString(),
      read: !!row.read_at
    }))
  } catch (e) {
    console.error('Failed to load notifications', e)
  } finally {
    loading.value = false
  }
}

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function mapType(row) {
  const ch = (row.channel || '').toLowerCase()
  if (ch === 'in-app') return 'system'
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
    vaccination_reminder_0: 'Due Date Reminder',
    vaccination_overdue: 'Overdue Alert',
    immunization_confirmation: 'Immunization Confirmation',
    low_stock_alert: 'Low Stock Alert',
    password_reset: 'Password Reset',
    role_change: 'Role Change'
  }
  return map[code] || 'Notification'
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
  } catch (e) {
    console.error('Failed to mark as read', e)
  }
}

const markAllAsRead = async () => {
  for (const n of notifications.value) {
    if (!n.read) {
      try { await notificationAPI.markAsRead(n.id); n.read = true } catch {}
    }
  }
}

onMounted(loadNotifications)
</script>

<style scoped>
.notifications-container {
  max-width: 100%;
  margin: 0 auto;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  align-items: center;
  margin-bottom: 0.25rem;
}

.notification-title {
  font-weight: 600;
  margin: 0;
  color: #333;
  font-size: 0.9rem;
}

.notification-time {
  color: #6c757d;
  font-size: 0.75rem;
}

.notification-message {
  margin: 0;
  color: #555;
  font-size: 0.875rem;
  line-height: 1.4;
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
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
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
}
</style>