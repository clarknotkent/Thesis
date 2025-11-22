<template>
  <div
    class="sidebar"
    :class="{ show: isOpen }"
  >
    <div class="sidebar-content">
      <ul class="nav nav-pills flex-column">
        <!-- Main Section -->
        <template v-if="userRole === 'admin'">
          <li class="nav-header mt-0">
            MAIN
          </li>
          <li
            v-for="item in mainSection"
            :key="item.name"
            class="nav-item"
          >
            <router-link
              :to="item.path"
              class="nav-link"
              :class="{ 'disabled': isNavItemDisabled(item) }"
              @click="handleNavClick($event, item)"
            >
              <i :class="item.icon + ' me-2'" />
              {{ item.label }}
            </router-link>
          </li>

          <!-- Patient Management Group -->
          <li class="nav-header mt-3">
            PATIENT MANAGEMENT
          </li>
          <li
            v-for="item in patientManagementGroup"
            :key="item.name"
            class="nav-item"
          >
            <router-link
              :to="item.path"
              class="nav-link"
              :class="{ 'disabled': isNavItemDisabled(item) }"
              @click="handleNavClick($event, item)"
            >
              <i :class="item.icon + ' me-2'" />
              {{ item.label }}
            </router-link>
          </li>

          <!-- System Group -->
          <li class="nav-header mt-3">
            SYSTEM
          </li>
          <li
            v-for="item in systemGroup"
            :key="item.name"
            class="nav-item"
          >
            <router-link
              :to="item.path"
              class="nav-link"
              :class="{ 'disabled': isNavItemDisabled(item) }"
              @click="handleNavClick($event, item)"
            >
              <i :class="item.icon + ' me-2'" />
              {{ item.label }}
            </router-link>
          </li>
        </template>

        <!-- Healthworker and Parent roles remain unchanged -->
        <template v-else>
          <li
            v-for="item in menuItems"
            :key="item.name"
            class="nav-item"
          >
            <router-link
              :to="item.path"
              class="nav-link"
              :class="{ 'disabled': isNavItemDisabled(item) }"
              @click="handleNavClick($event, item)"
            >
              <i :class="item.icon + ' me-2'" />
              {{ item.label }}
            </router-link>
          </li>
        </template>
      </ul>

      <!-- Offline Sync Section (Admin Only) -->
      <div
        v-if="userRole === 'admin'"
        class="offline-section"
      >
        <div
          class="offline-header"
          @click="toggleOfflineDetails"
        >
          <div class="d-flex align-items-center">
            <i
              :class="statusIcon"
              :style="{ color: statusColor }"
            />
            <span class="ms-2">{{ connectionStatus }}</span>
          </div>
        </div>
        
        <div
          v-if="showOfflineDetails"
          class="offline-details"
        >
          <div class="detail-item">
            <small class="text-muted">Status</small>
            <small class="fw-bold">{{ connectionStatus }}</small>
          </div>
          <div class="detail-item">
            <small class="text-muted">Cache</small>
            <small class="fw-bold">Auto-enabled</small>
          </div>
          
          <button 
            class="btn btn-sm btn-outline-danger w-100 mt-3" 
            @click="handleClearData"
          >
            <i class="bi bi-trash me-1" />
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOffline } from '@/composables/useOffline'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: true
  },
  userRole: {
    type: String,
    default: 'admin'
  }
})

// Offline sync composable (only for admin)
const {
  isOnline,
  connectionStatus,
  clearOfflineData
} = props.userRole === 'admin' ? useOffline() : {}

const { addToast } = useToast()
const showOfflineDetails = ref(false)

// Routes that are restricted in offline mode for admin
const offlineRestrictedRoutes = [
  '/admin/dashboard',
  '/admin/chat',
  '/admin/notifications-inbox', 
  '/admin/sms-management',
  '/admin/faqs',
  '/admin/activity-logs',
  '/admin/activity'
]

// Check if navigation to a route is allowed in offline mode
const handleNavClick = (event, item) => {
  // Only restrict admin routes when offline
  if (props.userRole === 'admin' && offlineRestrictedRoutes.includes(item.path)) {
    if (!isOnline || !isOnline.value) {
      event.preventDefault()
      addToast({
        title: 'Feature Unavailable Offline',
        message: `${item.label} is not available in offline mode.`,
        type: 'warning',
        timeout: 4000
      })
      return false
    }
  }
  return true
}

// Check if a navigation item should be disabled in offline mode
const isNavItemDisabled = (item) => {
  return props.userRole === 'admin' && 
         offlineRestrictedRoutes.includes(item.path) && 
         (!isOnline || !isOnline.value)
}

const toggleOfflineDetails = async () => {
  showOfflineDetails.value = !showOfflineDetails.value
}

const handleClearData = async () => {
  if (confirm('Clear offline cache? This will only remove locally stored data. Your data in the database is safe and will re-sync automatically.')) {
    await clearOfflineData()
    showOfflineDetails.value = false
  }
}

const statusIcon = computed(() => {
  if (!isOnline || !isOnline.value) return 'bi bi-wifi-off'
  return 'bi bi-wifi'
})

const statusColor = computed(() => {
  if (!isOnline || !isOnline.value) return '#dc3545'
  return '#198754'
})

const menuItems = computed(() => {
  const menus = {
    admin: [
      { name: 'dashboard', path: '/admin/dashboard', label: 'Dashboard', icon: 'bi bi-speedometer2' },
      { name: 'chat', path: '/admin/chat', label: 'Chat', icon: 'bi bi-chat-left-text' },
      { name: 'notifications-inbox', path: '/admin/notifications-inbox', label: 'Notifications', icon: 'bi bi-bell' },
      { name: 'patients', path: '/admin/patients', label: 'Patient Records', icon: 'bi bi-people' },
      { name: 'vaccines', path: '/admin/vaccines', label: 'Vaccine Inventory', icon: 'bi bi-box-seam' },
      { name: 'reports', path: '/admin/reports', label: 'Reports', icon: 'bi bi-file-earmark-text' },
      { name: 'users', path: '/admin/users', label: 'User Accounts', icon: 'bi bi-person-gear' },
      { name: 'sms-management', path: '/admin/sms-management', label: 'SMS Management', icon: 'bi bi-chat-dots' },
      { name: 'faqs', path: '/admin/faqs', label: 'FAQ Manager', icon: 'bi bi-question-circle' },
      { name: 'activity-logs', path: '/admin/activity-logs', label: 'Activity Logs', icon: 'bi bi-activity' }
    ],
    healthworker: [
      { name: 'dashboard', path: '/healthworker/dashboard', label: 'Dashboard', icon: 'bi bi-speedometer2' },
      { name: 'patients', path: '/healthworker/patients', label: 'Patient Records', icon: 'bi bi-people' },
      { name: 'inventory', path: '/healthworker/inventory', label: 'Vaccine Stock', icon: 'bi bi-box-seam' }
    ],
    parent: [
      { name: 'dashboard', path: '/parent/dashboard', label: 'Dashboard', icon: 'bi bi-speedometer2' },
      { name: 'schedule', path: '/parent/schedule', label: 'Vaccination Schedule', icon: 'bi bi-calendar-event' },
      { name: 'status', path: '/parent/status', label: 'Vaccination Status', icon: 'bi bi-check-square' }
    ]
  }

  return menus[props.userRole] || menus.admin
})

const mainSection = computed(() => menuItems.value.filter(item => ['dashboard', 'chat', 'notifications-inbox'].includes(item.name)))
const patientManagementGroup = computed(() => menuItems.value.filter(item => ['patients', 'vaccines', 'reports'].includes(item.name)))
const systemGroup = computed(() => menuItems.value.filter(item => ['users', 'sms-management', 'faqs', 'activity-logs'].includes(item.name)))
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 70px;
  left: 0;
  width: 250px;
  height: calc(100vh - 70px);
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  transition: transform 0.3s ease;
  padding: 5px 0;
  overflow-y: auto;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.sidebar.show {
  transform: translateX(0);
}

.sidebar:not(.show) {
  transform: translateX(-250px);
}

.sidebar-content {
  padding: 0 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.nav {
  flex: 1;
}

.nav-header {
  font-size: 0.875rem;
  font-weight: bold;
  color: #6c757d;
  text-transform: uppercase;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #495057;
  transition: all 0.3s ease;
  border-radius: 0.375rem;
  font-size: 0.95rem;
}

.nav-link:hover {
  color: #212529;
  background-color: #e9ecef;
  transform: translateX(4px);
}

.nav-link.router-link-active {
  color: #fff;
  background-color: #007bff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.nav-link.disabled {
  color: #6c757d !important;
  background-color: #f8f9fa !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}

.nav-link.disabled:hover {
  color: #6c757d !important;
  background-color: #f8f9fa !important;
  transform: none !important;
}

.nav-link i {
  font-size: 1.1rem;
  width: 20px;
}

/* Offline Section */
.offline-section {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
  background: #fff;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.offline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 0.5rem;
}

.offline-header:hover {
  background-color: #f8f9fa;
}

.offline-header i {
  font-size: 1.1rem;
}

.offline-header span {
  font-size: 0.875rem;
  font-weight: 500;
}

.offline-details {
  padding: 0 0.75rem 0.75rem;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f3f5;
}

.detail-item:last-of-type {
  border-bottom: none;
}

.storage-stats {
  border-top: 1px solid #f1f3f5;
  padding-top: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  padding: 0.25rem;
  background: #f8f9fa;
  border-radius: 0.25rem;
}

.spin {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Desktop: Sidebar toggleable, content adjusted */
@media (min-width: 992px) {
  .sidebar {
    position: fixed;
  }
  
  .sidebar.show {
    transform: translateX(0);
  }
  
  .sidebar:not(.show) {
    transform: translateX(-250px);
  }
}

/* Tablet and below: Sidebar as overlay with backdrop */
@media (max-width: 991px) {
  .sidebar {
    top: 60px;
    height: calc(100vh - 60px);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    z-index: 1040;
  }
  
  .sidebar:not(.show) {
    transform: translateX(-250px);
  }
  
  .sidebar.show {
    transform: translateX(0);
  }
  
  /* Backdrop for mobile */
  .sidebar.show::after {
    content: '';
    position: fixed;
    top: 60px;
    left: 250px;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
}

/* Mobile screens */
@media (max-width: 768px) {
  .sidebar {
    top: 56px;
    height: calc(100vh - 56px);
    width: 280px;
  }
  
  .sidebar:not(.show) {
    transform: translateX(-280px);
  }
  
  .sidebar.show::after {
    top: 56px;
    left: 280px;
  }
}
</style>
