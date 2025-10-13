<template>
  <nav class="navbar navbar-expand-lg navbar-dark navbar-custom fixed-top">
    <div class="container-fluid">
      <a class="navbar-brand fw-bold" href="#">
        <i class="bi bi-shield-check me-2"></i>
        ImmunizeMe {{ userRole }}
      </a>

      <button
        class="navbar-toggler sidebar-toggle"
        type="button"
        @click="toggleSidebar"
        aria-label="Toggle sidebar"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <!-- Notifications -->
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle position-relative"
              href="#"
              id="notificationsDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-bell me-1"></i>
              <span v-if="unreadCount > 0" class="badge bg-danger position-absolute top-0 start-100 translate-middle">{{ unreadCount }}</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end notification-dropdown">
              <li><h6 class="dropdown-header">Notifications</h6></li>
              <li v-if="recentNotifications.length === 0">
                <a class="dropdown-item text-muted">No new notifications</a>
              </li>
              <li v-for="notification in recentNotifications.slice(0, 5)" :key="notification.id">
                <a class="dropdown-item" @click="viewNotification(notification)">
                  <div class="d-flex">
                    <div class="flex-grow-1">
                      <small class="text-muted">{{ notification.message.substring(0, 50) }}...</small>
                    </div>
                    <small class="text-muted ms-2">{{ formatTime(notification.created_at) }}</small>
                  </div>
                </a>
              </li>
              <li v-if="recentNotifications.length > 5"><hr class="dropdown-divider" /></li>
              <li v-if="recentNotifications.length > 5">
                <router-link class="dropdown-item text-center" :to="getInboxRoute()">
                  View all notifications
                </router-link>
              </li>
            </ul>
          </li>

          <!-- User Menu -->
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="navbarDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-person-circle me-1"></i>
              {{ userName }}
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <a class="dropdown-item" href="#">
                  <i class="bi bi-person me-2"></i>Profile
                </a>
              </li>
              <li>
                <a class="dropdown-item" href="#">
                  <i class="bi bi-gear me-2"></i>Settings
                </a>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a class="dropdown-item cursor-pointer" @click="logout">
                  <i class="bi bi-box-arrow-right me-2"></i>Logout
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { logout as doLogout } from '@/services/auth'
import { notificationAPI } from '@/services/api'

const props = defineProps({
  userRole: {
    type: String,
    default: 'Admin'
  },
  userName: {
    type: String,
    default: 'Admin User'
  }
})

const emit = defineEmits(['toggle-sidebar'])
const router = useRouter()

const recentNotifications = ref([])
const unreadCount = ref(0)

const logout = () => {
  doLogout()
  router.push('/auth/login')
}

const toggleSidebar = () => {
  emit('toggle-sidebar')
}

const getInboxRoute = () => {
  return '/admin/notifications-inbox'
}

const loadNotifications = async () => {
  try {
    const response = await notificationAPI.getMyNotifications({ unreadOnly: true, limit: 10 })
    recentNotifications.value = response.data.data || []
    unreadCount.value = recentNotifications.value.length
  } catch (error) {
    console.error('Failed to load notifications:', error)
  }
}

const viewNotification = (notification) => {
  // Mark as read and navigate to inbox
  notificationAPI.markAsRead(notification.notification_id).catch(console.error)
  router.push(getInboxRoute())
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

onMounted(() => {
  loadNotifications()
  // Refresh notifications every 5 minutes
  setInterval(loadNotifications, 5 * 60 * 1000)
})
</script>

<style scoped>
/* Desktop-only Admin Navbar */
.navbar-custom {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  min-height: 70px;
}

.notification-dropdown {
  width: 350px;
  max-height: 400px;
  overflow-y: auto;
}

.badge {
  font-size: 0.7em;
}

.cursor-pointer {
  cursor: pointer;
}

/* Admin navbar is desktop-only - hide on mobile/tablet */
@media (max-width: 991px) {
  .navbar {
    display: none !important;
  }
}

/* Desktop optimizations */
@media (min-width: 992px) {
  .navbar-brand {
    font-size: 1.25rem;
    font-weight: 700;
  }
  
  .nav-link {
    font-size: 1rem;
    padding: 0.5rem 1rem;
  }
  
  .dropdown-menu {
    border: none;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    border-radius: 0.5rem;
  }
}
</style>
