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
          to="/healthworker/notifications" 
          class="nav-link position-relative me-3"
          aria-label="Notifications"
        >
          <i class="bi bi-bell" />
          <span
            v-if="notificationCount > 0"
            class="badge bg-danger position-absolute top-0 start-100 translate-middle"
          >{{ notificationCount > 99 ? '99+' : notificationCount }}</span>
        </router-link>

        <!-- Messages -->
        <router-link 
          to="/healthworker/messages" 
          class="nav-link position-relative"
          aria-label="Messages"
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { notificationAPI, conversationAPI } from '@/services/api'
import MobileOfflineIndicatorDropdown from '@/components/ui/feedback/MobileOfflineIndicatorDropdown.vue'

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

// Unread counters
const notificationCount = ref(0)
const messageCount = ref(0)

let pollInterval = null

const fetchCounts = async () => {
  try {
    // Notifications: ask for unread only if backend supports it
    try {
      const nResp = await notificationAPI.getMyNotifications({ unreadOnly: true, limit: 1 })
      const nRows = nResp?.data?.data || nResp?.data || []
      // If backend returns array
      if (Array.isArray(nRows)) {
        notificationCount.value = nRows.length
      } else if (typeof nResp?.data?.count === 'number') {
        notificationCount.value = nResp.data.count
      } else {
        // Fallback: request all and count unread
        const all = await notificationAPI.getMyNotifications({ limit: 100 })
        const rows = all?.data?.data || all?.data || []
        notificationCount.value = Array.isArray(rows) ? rows.filter(r => !r.read_at).length : 0
      }
    } catch (e) {
      console.error('Failed to fetch notifications count', e)
      notificationCount.value = 0
    }

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
  fetchCounts()
  // Poll every 15s for updates
  pollInterval = setInterval(fetchCounts, 15000)
})

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval)
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

/* Mobile optimizations */
@media (max-width: 576px) {
  .navbar-brand {
    font-size: 1rem;
  }
  
  .navbar-brand i {
    font-size: 1.1rem;
  }
  
  .nav-link {
    font-size: 1rem;
    padding: 0.4rem 0.6rem !important;
  }
  
  .nav-link i {
    font-size: 1.1rem;
  }
  
  .badge {
    font-size: 0.55em;
  }
}
</style>
