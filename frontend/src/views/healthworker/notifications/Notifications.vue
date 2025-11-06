<template>
  <HealthWorkerLayout>
    <div class="notifications-container">
      <!-- Back Button -->
      <div class="back-button-container">
        <button
          class="back-button"
          @click="goBack"
        >
          <i class="bi bi-arrow-left" />
          <span>Back</span>
        </button>
      </div>

      <!-- Notifications Header -->
      <div class="notifications-header">
        <div class="header-top">
          <h4 class="mb-0">
            <i class="bi bi-bell me-2" />
            Notifications
          </h4>
          <div class="header-actions">
            <button 
              v-if="unreadCount > 0" 
              class="btn btn-sm btn-outline-primary" 
              title="Mark all as read"
              @click="markAllAsRead"
            >
              <i class="bi bi-check2-all" />
            </button>
            <button 
              v-if="readCount > 0" 
              class="btn btn-sm btn-outline-danger" 
              title="Clear all read"
              @click="handleClearAll"
            >
              <i class="bi bi-trash" />
            </button>
            <button 
              class="btn btn-sm btn-outline-secondary" 
              :disabled="loading"
              title="Refresh"
              @click="loadNotifications"
            >
              <i
                class="bi bi-arrow-clockwise"
                :class="{ 'spin': loading }"
              />
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
      <div
        v-if="loading && notifications.length === 0"
        class="loading-state"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">
          Loading notifications...
        </p>
      </div>

      <!-- Notifications List -->
      <div
        v-else-if="filteredNotifications.length > 0"
        class="notifications-list"
      >
        <div 
          v-for="notification in filteredNotifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 'unread': !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <div
            class="notification-icon"
            :class="notification.type"
          >
            <i :class="getNotificationIcon(notification.type)" />
          </div>
          <div class="notification-content">
            <div class="notification-header">
              <h6 class="notification-title">
                {{ notification.title }}
              </h6>
              <div class="notification-actions">
                <small class="notification-time">{{ notification.time }}</small>
                <button 
                  class="delete-btn" 
                  title="Delete"
                  @click="handleDelete(notification, $event)"
                >
                  <i class="bi bi-x" />
                </button>
              </div>
            </div>
            <p class="notification-message">
              {{ notification.message }}
            </p>
            <div class="notification-footer">
              <span class="notification-channel">
                <i 
                  :class="{
                    'bi bi-app': notification.channel === 'in-app' || notification.channel === 'Push',
                    'bi bi-envelope': notification.channel === 'email',
                    'bi bi-chat': notification.channel === 'sms'
                  }"
                />
                {{ notification.channel }}
              </span>
            </div>
            <span
              v-if="!notification.read"
              class="unread-indicator"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="empty-state"
      >
        <i class="bi bi-bell-fill empty-icon" />
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
import { addToast } from '@/composables/useToast'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import { useNotifications } from '@/features/health-worker/notifications/composables'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

// Use notifications composable
const {
  loading,
  notifications,
  filter,
  filteredNotifications,
  unreadCount,
  readCount,
  loadNotifications,
  markAsRead,
  markAllAsRead,
  clearAllRead,
  startPolling,
  getNotificationIcon
} = useNotifications()

// Handle notification click with navigation
const handleNotificationClick = async (notification) => {
  const result = await markAsRead(notification)
  
  // If related to conversation, navigate to messages
  if (result.shouldNavigate) {
    router.push('/healthworker/messages')
  }
}

// DELETE functionality disabled for health workers (no delete permissions)
const handleDelete = async (notification, event) => {
  event.stopPropagation()
  
  // Health workers cannot delete notifications
  addToast({ 
    title: 'Permission Denied', 
    message: 'Health workers cannot delete notifications. They can only mark them as read.', 
    type: 'warning' 
  })
  return
  
  /* Original delete code - disabled for health workers
  if (!confirm('Delete this notification?')) return
  
  const success = await deleteNotification(notification.id)
  if (!success) {
    addToast({ title: 'Error', message: 'Failed to delete notification', type: 'error' })
  }
  */
}

// Handle clear all with confirmation
const handleClearAll = async () => {
  if (!confirm('Clear all read notifications?')) return
  await clearAllRead()
}

onMounted(() => {
  loadNotifications()
  startPolling()
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

