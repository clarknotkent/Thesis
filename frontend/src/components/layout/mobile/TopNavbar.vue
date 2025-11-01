<template>
  <nav class="top-navbar navbar navbar-expand-lg navbar-dark navbar-custom fixed-top">
    <div class="container-fluid">
      <a class="navbar-brand fw-bold" href="#">
        <i class="bi bi-shield-check me-2"></i>
        {{ userRole }}
      </a>

      <div class="navbar-nav ms-auto d-flex flex-row">
        <!-- Notifications -->
        <router-link 
          to="/healthworker/notifications" 
          class="nav-link position-relative me-3"
          aria-label="Notifications"
        >
          <i class="bi bi-bell"></i>
          <span v-if="notificationCount > 0" class="badge bg-danger position-absolute top-0 start-100 translate-middle">{{ notificationCount > 99 ? '99+' : notificationCount }}</span>
        </router-link>

        <!-- Messages -->
        <router-link 
          to="/healthworker/messages" 
          class="nav-link position-relative"
          aria-label="Messages"
        >
          <i class="bi bi-chat-dots"></i>
          <span v-if="messageCount > 0" class="badge bg-danger position-absolute top-0 start-100 translate-middle">{{ messageCount > 99 ? '99+' : messageCount }}</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  userRole: {
    type: String,
    default: 'Health Staff'
  },
  userName: {
    type: String,
    default: 'Dr. Sarah Wilson'
  }
})

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { notificationAPI, conversationAPI } from '@/services/api'

const router = useRouter()

const notificationCount = ref(0)
const messageCount = ref(0)

let pollInterval = null

const fetchCounts = async () => {
  try {
    try {
      const nResp = await notificationAPI.getMyNotifications({ unreadOnly: true, limit: 1 })
      const nRows = nResp?.data?.data || nResp?.data || []
      notificationCount.value = Array.isArray(nRows) ? nRows.length : (nResp?.data?.count || 0)
    } catch (e) {
      console.error('Failed to fetch notifications in TopNavbar', e)
      notificationCount.value = 0
    }

    try {
      const cResp = await conversationAPI.getConversations({ limit: 200 })
      const convs = cResp?.data?.items || cResp?.data || []
      messageCount.value = Array.isArray(convs) ? convs.reduce((acc, c) => acc + (Number(c.unread_count) || 0), 0) : 0
    } catch (e) {
      console.error('Failed to fetch conversations in TopNavbar', e)
      messageCount.value = 0
    }
  } catch (e) {
    console.error('fetchCounts TopNavbar error', e)
  }
}

onMounted(() => {
  fetchCounts()
  pollInterval = setInterval(fetchCounts, 15000)
})

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval)
})

const logout = () => {
  // Add logout logic here
  console.log('Logging out...')
  router.push('/auth/login')
}
</script>

<style scoped>
.top-navbar {
  background-color: #007bff !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 56px; /* Fixed height for consistent spacing */
  padding: 0.5rem 0; /* Reduced padding to fit height */
}

.navbar-brand {
  font-size: 1.1rem;
  font-weight: 600;
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

.dropdown-toggle {
  font-size: 0.9rem !important;
}

.badge {
  font-size: 0.6em;
  top: -2px !important;
  right: -6px !important;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .navbar-brand {
    font-size: 1rem;
  }
  
  .nav-link {
    font-size: 1rem;
    padding: 0.4rem 0.6rem !important;
  }
  
  .nav-link i {
    font-size: 1.1rem;
  }
  
  .dropdown-toggle {
    font-size: 0.8rem !important;
  }
  
  .badge {
    font-size: 0.55em;
  }
}

/* Tablet view - still optimized for mobile use */
@media (min-width: 577px) and (max-width: 991px) {
  .top-navbar {
    padding: 0.875rem 0;
  }
  
  .navbar-brand {
    font-size: 1.2rem;
  }
}

/* Desktop and Large Screen Scaling */
@media (min-width: 992px) {
  .top-navbar {
    height: 64px;
    padding: 0.75rem 0;
    background: #007bff !important;
    box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3);
  }
  
  .navbar-brand {
    font-size: 1.4rem;
    transition: all 0.2s ease;
  }
  
  .navbar-brand:hover {
    transform: scale(1.05);
    color: rgba(255, 255, 255, 1) !important;
  }
  
  .nav-link {
    font-size: 1.2rem;
    padding: 0.6rem 1rem !important;
    margin: 0 0.25rem;
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  
  .nav-link:hover {
    background-color: rgba(255, 255, 255, 0.15) !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
  }
  
  .nav-link i {
    font-size: 1.4rem;
  }
  
  .badge {
    font-size: 0.7em;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Extra Large Screens */
@media (min-width: 1400px) {
  .top-navbar {
    height: 72px;
    padding: 1rem 0;
  }
  
  .navbar-brand {
    font-size: 1.6rem;
  }
  
  .nav-link {
    font-size: 1.3rem;
    padding: 0.75rem 1.25rem !important;
    margin: 0 0.5rem;
  }
  
  .nav-link i {
    font-size: 1.5rem;
  }
}
</style>