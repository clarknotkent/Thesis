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
      { name: 'sms', path: '/admin/sms', label: 'SMS Logs', icon: 'bi bi-chat-dots' },
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
const systemGroup = computed(() => menuItems.value.filter(item => ['users', 'sms', 'faqs', 'activity-logs'].includes(item.name)))
</script>

<style scoped>
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
  padding: 0.5rem 1rem;
  color: #495057;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #212529;
}
</style>
