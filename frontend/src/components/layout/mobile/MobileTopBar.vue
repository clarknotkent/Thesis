<template>
  <nav class="mobile-top-bar navbar navbar-expand-lg navbar-dark navbar-custom">
    <div class="container-fluid">
      <a
        class="navbar-brand fw-bold"
        href="#"
      >
        <i class="bi bi-shield-check me-2" />
        {{ userRole }}
      </a>

      <div class="navbar-nav ms-auto d-flex flex-row">
        <!-- Connection Status Dropdown -->
        <MobileOfflineIndicatorDropdown class="me-2" />

        <!-- Notifications -->
        <router-link 
          :to="isOnline ? '/healthworker/notifications' : '#'"
          class="nav-link position-relative me-3"
          :class="{ disabled: !isOnline }"
          :title="!isOnline ? 'Notifications not available offline' : 'Notifications'"
          @click.prevent="!isOnline"
        >
          <i class="bi bi-bell" />
          <span
            v-if="notificationCount > 0"
            class="badge bg-danger position-absolute top-0 start-100 translate-middle"
          >{{ notificationCount > 99 ? '99+' : notificationCount }}</span>
        </router-link>

        <!-- Messages -->
        <router-link 
          :to="isOnline ? '/healthworker/messages' : '#'"
          class="nav-link position-relative"
          :class="{ disabled: !isOnline }"
          :title="!isOnline ? 'Messages not available offline' : 'Messages'"
          @click.prevent="!isOnline"
        >
          <i class="bi bi-chat-dots" />
          <span
            v-if="messageCount > 0"
            class="badge bg-danger position-absolute top-0 start-100 translate-middle"
          >{{ messageCount > 99 ? '99+' : messageCount }}</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { notificationAPI, conversationAPI } from '@/services/api'
import MobileOfflineIndicatorDropdown from '@/components/ui/feedback/MobileOfflineIndicatorDropdown.vue'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useNotificationStore } from '@/stores/notificationStore'

defineProps({
  userRole: {
    type: String,
    default: 'Health Staff'
  },
  userName: {
    type: String,
    default: ''
  }
})

// Online status
const { isOnline } = useOnlineStatus()

// Notification store
const notificationStore = useNotificationStore()

// Unread counters
const notificationCount = ref(0)
const messageCount = ref(0)

let pollInterval = null

const fetchCounts = async () => {
  try {
    // Fetch notification count from store
    await notificationStore.fetchUnreadCount()
    notificationCount.value = notificationStore.unreadCount

    // Messages: prefer fast unread count endpoint; fallback to summing conversations
    try {
      const uResp = await conversationAPI.getUnreadCount()
      const cnt = uResp?.data?.count ?? uResp?.data?.data?.count ?? null
      if (typeof cnt === 'number') {
        messageCount.value = cnt
      } else {
        // Fallback: sum unread_count from conversations
        const cResp = await conversationAPI.getConversations({ limit: 200 })
        const convs = cResp?.data?.items || cResp?.data || []
        messageCount.value = Array.isArray(convs) ? convs.reduce((acc, c) => acc + (Number(c.unread_count) || 0), 0) : 0
      }
    } catch (e) {
      console.error('Failed to fetch unread message count', e)
      messageCount.value = 0
    }
  } catch (e) {
    console.error('fetchCounts error', e)
  }
}

onMounted(() => {
  if (isOnline.value) {
    fetchCounts()
    // Start polling from notification store
    notificationStore.startPolling(30000)
    
    // Poll for messages every 15s
    pollInterval = setInterval(() => {
      if (isOnline.value) {
        fetchCounts()
      }
    }, 15000)
  }
})

// Watch notification store unread count
watch(() => notificationStore.unreadCount, (newCount) => {
  notificationCount.value = newCount
})

// Watch online status to clear counts when going offline
watch(isOnline, (newOnline) => {
  if (!newOnline) {
    // Clear counts when going offline
    notificationCount.value = 0
    messageCount.value = 0
    notificationStore.stopPolling()
  } else {
    // Fetch counts when coming back online
    fetchCounts()
    notificationStore.startPolling(30000)
  }
})

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval)
  notificationStore.stopPolling()
})
</script>

<style scoped>
.mobile-top-bar {
  background-color: #007bff !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 56px;
  padding: 0.5rem 0;
  position: relative;
  z-index: 1030;
}

.navbar-brand {
  font-size: 1.1rem;
  font-weight: 600;
  color: white !important;
}

.navbar-brand i {
  font-size: 1.2rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 1.1rem;
  padding: 0.5rem 0.75rem !important;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link i {
  font-size: 1.2rem;
}

.badge {
  font-size: 0.6em;
  padding: 0.25em 0.5em;
  min-width: 1.5em;
  height: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-link.disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
  pointer-events: none;
}

.nav-link.disabled:hover {
  background-color: transparent !important;
  color: rgba(255, 255, 255, 0.5) !important;
}
</style>
