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
      { name: 'patients', path: '/admin/patients', label: 'Patient Management', icon: 'bi bi-people' },
      { name: 'vaccines', path: '/admin/vaccines', label: 'Vaccine Inventory', icon: 'bi bi-box-seam' },
      { name: 'users', path: '/admin/users', label: 'User Management', icon: 'bi bi-person-gear' }
    ],
    'health-worker': [
      { name: 'dashboard', path: '/health-worker/dashboard', label: 'Dashboard', icon: 'bi bi-speedometer2' },
      { name: 'patients', path: '/health-worker/patients', label: 'Patient Lookup', icon: 'bi bi-qr-code-scan' },
      { name: 'appointments', path: '/health-worker/appointments', label: 'Appointments', icon: 'bi bi-calendar-event' },
      { name: 'vaccinations', path: '/health-worker/vaccinations', label: 'Vaccine Administration', icon: 'bi bi-shield-check' }
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
