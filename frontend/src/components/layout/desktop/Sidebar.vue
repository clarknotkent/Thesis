<template>
  <div class="sidebar" :class="{ show: isOpen }">
    <div class="sidebar-content">
      <ul class="nav nav-pills flex-column">
        <!-- Main Section -->
        <template v-if="userRole === 'admin'">
          <li class="nav-header mt-0">MAIN</li>
          <li class="nav-item" v-for="item in mainSection" :key="item.name">
            <router-link :to="item.path" class="nav-link">
              <i :class="item.icon + ' me-2'"></i>
              {{ item.label }}
            </router-link>
          </li>

          <!-- Patient Management Group -->
          <li class="nav-header mt-3">PATIENT MANAGEMENT</li>
          <li class="nav-item" v-for="item in patientManagementGroup" :key="item.name">
            <router-link :to="item.path" class="nav-link">
              <i :class="item.icon + ' me-2'"></i>
              {{ item.label }}
            </router-link>
          </li>

          <!-- System Group -->
          <li class="nav-header mt-3">SYSTEM</li>
          <li class="nav-item" v-for="item in systemGroup" :key="item.name">
            <router-link :to="item.path" class="nav-link">
              <i :class="item.icon + ' me-2'"></i>
              {{ item.label }}
            </router-link>
          </li>
        </template>

        <!-- Healthworker and Parent roles remain unchanged -->
        <template v-else>
          <li class="nav-item" v-for="item in menuItems" :key="item.name">
            <router-link :to="item.path" class="nav-link">
              <i :class="item.icon + ' me-2'"></i>
              {{ item.label }}
            </router-link>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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
}

.sidebar.show {
  transform: translateX(0);
}

.sidebar:not(.show) {
  transform: translateX(-250px);
}

.sidebar-content {
  padding: 0 1rem;
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

.nav-link i {
  font-size: 1.1rem;
  width: 20px;
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
