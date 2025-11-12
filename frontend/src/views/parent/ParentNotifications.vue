<template>
  <ParentLayout>
    <div class="notifications-container">
      <div class="section-header">
        <h5 class="section-title">
          Notifications
        </h5>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="notifications.length === 0"
        class="empty-state"
      >
        <div class="empty-state-icon">
          <i class="bi bi-bell" />
        </div>
        <h6 class="empty-state-title">
          No Notifications
        </h6>
        <p class="empty-state-text">
          You're all caught up!
        </p>
      </div>

      <!-- Notifications List -->
      <div
        v-else
        class="notifications-list"
      >
        <NotificationItem
          v-for="n in notifications"
          :id="n.id"
          :key="n.id"
          :title="n.title"
          :message="n.message"
          :type="n.type"
          :created-at="n.created_at"
          :channel="n.channel"
          :read="n.read"
          @click="handleClick(n)"
        />
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import NotificationItem from '@/features/shared/notifications/NotificationItem.vue'
import api from '@/services/api'
import { useOfflineGuardian } from '@/composables/useOfflineGuardian'
import { useOffline } from '@/composables/useOffline'

const { getCachedData } = useOfflineGuardian()
const { effectiveOnline } = useOffline()

const loading = ref(true)
const notifications = ref([])

const fetchNotifications = async () => {
  try {
    loading.value = true

    if (effectiveOnline.value) {
      // Fetch from API
      try {
        const response = await api.get('/notifications')
        const items = Array.isArray(response?.data) ? response.data : (response?.data?.data || [])

        notifications.value = items.map(n => ({
          id: n.notification_id || n.id,
          title: n.title || n.template_code || 'Notification',
          message: n.message || n.message_body || '',
          type: n.type || n.related_entity_type || n.channel || 'info',
          channel: n.channel || n.delivery_channel || n.channel_type || null,
          created_at: n.created_at || n.sent_at || n.scheduled_at,
          read: Boolean(n.read_at || n.is_read)
        }))

      } catch (apiError) {
        console.error('Failed to fetch notifications from API:', apiError)
        notifications.value = []
      }
    } else {
      // Load from cache
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const guardianId = userInfo.id || userInfo.guardian_id || userInfo.userId || userInfo.user_id
      const cached = await getCachedData(guardianId)
      
      // Transform cached notifications to match the expected format
      const cachedNotifications = cached?.notifications || []
      notifications.value = cachedNotifications.map(n => ({
        id: n.notification_id || n.id,
        title: n.title || n.template_code || 'Notification',
        message: n.message || n.message_body || '',
        type: n.type || n.related_entity_type || n.channel || 'info',
        channel: n.channel || n.delivery_channel || n.channel_type || null,
        created_at: n.created_at || n.sent_at || n.scheduled_at,
        read: Boolean(n.read_at || n.is_read)
      }))
    }
  } catch (e) {
    console.error('Failed to fetch notifications:', e)
    notifications.value = []
  } finally {
    loading.value = false
  }
}

const markAsRead = async (id) => {
  if (!effectiveOnline.value) {
    console.log('Mark as read disabled offline.');
    return;
  }
  try {
    // Mark as read in UI immediately
    const target = notifications.value.find(n => n.id === id)
    if (target) target.read = true
    
    // Send to API
    try {
      await api.put(`/notifications/${id}/read`)
    } catch (_) {
      // Ignore API errors for read status
    }
  } catch (e) {
    console.error('Failed to mark notification as read:', e)
  }
}

const handleClick = (notification) => {
  // Mark as read only if online
  if (!notification.read && notification.id && effectiveOnline.value) {
    markAsRead(notification.id)
  }
}

onMounted(fetchNotifications)

// Watch for online status changes and refresh data when coming back online
watch(effectiveOnline, async (isOnline, wasOnline) => {
  if (isOnline && !wasOnline) {
    console.log('🌐 Back online - refreshing notifications with latest data')
    await fetchNotifications()
  }
})
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
  cursor: pointer;
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
