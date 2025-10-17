<template>
  <div class="sidebar" :class="{ show: isOpen }">
    <div class="sidebar-content">
      <ul class="nav nav-pills flex-column">
        <li class="nav-item" v-for="item in menuItems" :key="item.name">
          <router-link :to="item.path" class="nav-link">
            <i :class="item.icon + ' me-2'"></i>
            {{ item.label }}
          </router-link>
        </li>
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
      { name: 'patients', path: '/admin/patients', label: 'Patient Records', icon: 'bi bi-people' },
      { name: 'vaccines', path: '/admin/vaccines', label: 'Vaccine Inventory', icon: 'bi bi-box-seam' },
      { name: 'sms', path: '/admin/sms', label: 'SMS Logs', icon: 'bi bi-chat-dots' },
      { name: 'reports', path: '/admin/reports', label: 'Reports', icon: 'bi bi-file-earmark-text' },
      { name: 'users', path: '/admin/users', label: 'User Accounts', icon: 'bi bi-person-gear' },
      { name: 'notifications-inbox', path: '/admin/notifications-inbox', label: 'Notifications', icon: 'bi bi-bell' },
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
</script>
