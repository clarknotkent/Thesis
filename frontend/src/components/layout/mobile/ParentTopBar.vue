<template>
  <nav class="mobile-top-bar navbar navbar-expand-lg navbar-dark navbar-custom">
    <div class="container-fluid">
      <a
        class="navbar-brand fw-bold"
        href="#"
      >
        <i class="bi bi-shield-check me-2" />
        {{ title || 'My Portal' }}
      </a>

      <div class="navbar-nav ms-auto d-flex flex-row">
        <!-- Connection Status Dropdown -->
        <MobileOfflineIndicatorDropdown class="me-2" />

        <!-- Notifications (always enabled, shows cached counts when offline) -->
        <router-link 
          to="/parent/notifications" 
          class="nav-link position-relative me-3"
          aria-label="Notifications"
          :title="effectiveOnline ? 'Notifications' : 'Notifications (cached data)'"
        >
          <i class="bi bi-bell" />
          <span
            v-if="notificationCount > 0"
            class="badge bg-danger position-absolute top-0 start-100 translate-middle"
          >
            {{ notificationCount }}
          </span>
        </router-link>

        <!-- Messages (always enabled, shows cached counts when offline) -->
        <router-link 
          to="/parent/messages" 
          class="nav-link position-relative"
          aria-label="Messages"
          :title="effectiveOnline ? 'Messages' : 'Messages (cached data)'"
        >
          <i class="bi bi-chat-dots" />
          <span
            v-if="messageCount > 0"
            class="badge bg-danger position-absolute top-0 start-100 translate-middle"
          >
            {{ messageCount }}
          </span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { notificationAPI, conversationAPI } from '@/services/api'
import MobileOfflineIndicatorDropdown from '@/components/ui/feedback/MobileOfflineIndicatorDropdown.vue'
import { useOffline } from '@/composables/useOffline'
import { db } from '@/utils/db'

defineProps({
  title: {
    type: String,
    default: null
  }
})

const { effectiveOnline } = useOffline()
const notificationCount = ref(0)
const messageCount = ref(0)

let pollInterval = null

const fetchCounts = async () => {
  try {
    if (effectiveOnline.value) {
      // Online: fetch fresh counts from API
      console.log('🌐 Online - fetching fresh notification/message counts')
      
      // Notifications
      try {
        const nResp = await notificationAPI.getMyNotifications({ unreadOnly: true, limit: 1 })
        const nRows = nResp?.data?.data || nResp?.data || []
        notificationCount.value = Array.isArray(nRows) ? nRows.length : (nResp?.data?.count || 0)
      } catch (e) {
        console.error('Failed to fetch parent notifications', e)
        notificationCount.value = 0
      }

      // Messages
      try {
        const cResp = await conversationAPI.getConversations({ limit: 200 })
        const convs = cResp?.data?.items || cResp?.data || []
        messageCount.value = Array.isArray(convs) ? convs.reduce((acc, c) => acc + (Number(c.unread_count) || 0), 0) : 0
      } catch (e) {
        console.error('Failed to fetch parent conversations', e)
        messageCount.value = 0
      }
    } else {
      // Offline: load cached counts
      console.log('📴 Offline - loading cached notification/message counts')
      await loadCachedCounts()
    }
  } catch (e) {
    console.error('fetchCounts parent error', e)
  }
}

const loadCachedCounts = async () => {
  try {
    // Get current user info to find cached data
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const guardianId = userInfo.id || userInfo.guardian_id || userInfo.userId || userInfo.user_id
    
    if (!guardianId) {
      console.warn('No guardian ID found for cached counts')
      return
    }

    // Load cached guardian data
    const cachedData = await db.guardians.get(guardianId)
    
    if (cachedData) {
      // Count unread notifications from cache
      const notifications = cachedData.notifications || []
      notificationCount.value = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0
      
      // Count unread messages from cached conversations
      const conversations = cachedData.conversations || []
      messageCount.value = Array.isArray(conversations) 
        ? conversations.reduce((acc, c) => acc + (Number(c.unread_count) || 0), 0) 
        : 0
      
      console.log(`📱 Cached counts loaded - Notifications: ${notificationCount.value}, Messages: ${messageCount.value}`)
    } else {
      console.log('📱 No cached data found for counts')
      notificationCount.value = 0
      messageCount.value = 0
    }
  } catch (error) {
    console.error('Error loading cached counts:', error)
    notificationCount.value = 0
    messageCount.value = 0
  }
}

onMounted(() => {
  fetchCounts()
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
  min-height: 56px;
  max-height: 56px;
  padding: 0;
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1030;
  flex-shrink: 0;
  margin: 0;
}

.mobile-top-bar .container-fluid {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  margin: 0;
  width: 100%;
  max-width: 100%;
  padding-left: 1rem !important;
  padding-right: 1rem !important;
}

.navbar-brand {
  font-size: 1.1rem;
  font-weight: 600;
  color: white !important;
  height: 56px;
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  line-height: 56px;
}

.navbar-brand i {
  font-size: 1.2rem;
  line-height: 1;
}

.navbar-nav {
  height: 56px;
  display: flex;
  align-items: center;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 1.1rem;
  padding: 0.5rem 0.75rem !important;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-link:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link i {
  font-size: 1.2rem;
  line-height: 1;
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
