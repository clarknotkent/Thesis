<template>
  <ParentLayout>
    <div class="notifications-container">
      <div class="section-header">
        <h5 class="section-title">Notifications</h5>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="notifications.length === 0" class="empty-state">
        <div class="empty-state-icon">
          <i class="bi bi-bell"></i>
        </div>
        <h6 class="empty-state-title">No Notifications</h6>
        <p class="empty-state-text">You're all caught up!</p>
      </div>

      <!-- Notifications List -->
      <div v-else class="notifications-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
        >
          <div class="notification-icon">
            <i :class="getNotificationIcon(notification.type)"></i>
          </div>
          <div class="notification-content">
            <h6 class="notification-title">{{ notification.title }}</h6>
            <p class="notification-message">{{ notification.message }}</p>
            <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'

const loading = ref(true)
const notifications = ref([])

// Placeholder data
onMounted(() => {
  setTimeout(() => {
    notifications.value = []
    loading.value = false
  }, 500)
})

const getNotificationIcon = (type) => {
  switch (type) {
    case 'vaccine': return 'bi bi-syringe'
    case 'appointment': return 'bi bi-calendar-check'
    case 'message': return 'bi bi-chat-dots'
    default: return 'bi bi-info-circle'
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.notifications-container {
  padding: 1rem;
  min-height: calc(100vh - 56px - 70px);
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  margin: 0;
  font-weight: 600;
  color: #333;
  font-size: 1.25rem;
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
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread {
  background-color: #eff6ff;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.2rem;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.notification-message {
  margin: 0 0 0.5rem 0;
  color: #6c757d;
  font-size: 0.85rem;
  line-height: 1.4;
}

.notification-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.empty-state-icon i {
  font-size: 2.5rem;
  color: #6c757d;
}

.empty-state-title {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.empty-state-text {
  color: #6c757d;
  font-size: 0.9rem;
}

@media (max-width: 576px) {
  .notifications-container {
    padding: 0.75rem;
  }

  .notification-item {
    padding: 0.875rem;
  }

  .notification-icon {
    width: 35px;
    height: 35px;
    font-size: 1rem;
    margin-right: 0.75rem;
  }
}
</style>
