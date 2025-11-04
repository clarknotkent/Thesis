<template>
  <!-- WiFi Status Dropdown in header (always visible for HealthWorker/Parent) -->
  <div class="nav-item dropdown">
    <button 
      ref="dropdownButton"
      class="nav-link position-relative border-0 bg-transparent p-0" 
      id="mobileOfflineDropdown"
      data-bs-toggle="dropdown" 
      data-bs-auto-close="true"
      data-bs-offset="0,8"
      aria-expanded="false"
      type="button"
      @click="toggleDropdown"
    >
      <div class="d-flex align-items-center gap-2">
        <i :class="statusIcon" :style="{ color: statusColor }" class="fs-5"></i>
        <span class="last-sync-badge d-none d-sm-inline small text-white-50"></span>
      </div>
    </button>
    
    <ul class="dropdown-menu dropdown-menu-end offline-dropdown" aria-labelledby="mobileOfflineDropdown" data-bs-display="static">
      <li><div class="dropdown-header">
        <strong>{{ connectionStatus }}</strong>
      </div></li>
      
      <li><hr class="dropdown-divider"></li>
      
      <li><div class="dropdown-item-text small text-muted">
        <i class="bi bi-info-circle me-2"></i>
        Data caches automatically as you navigate
      </div></li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOffline } from '@/composables/useOffline'
import { Dropdown } from 'bootstrap'

const dropdownButton = ref(null)
let dropdownInstance = null

const {
  isOnline,
  connectionStatus,
} = useOffline()

const statusIcon = computed(() => {
  if (isOnline.value) return 'bi bi-wifi'
  return 'bi bi-wifi-off'
})

const statusColor = computed(() => {
  if (isOnline.value) return '#ffffff' // White when online
  return '#dc3545' // Red when offline
})

const toggleDropdown = () => {
  if (dropdownInstance) {
    dropdownInstance.toggle()
  }
}

// Manually initialize Bootstrap dropdown
onMounted(async () => {
  // Wait for next tick to ensure DOM is ready
  await new Promise(resolve => setTimeout(resolve, 200))
  
  try {
    if (dropdownButton.value) {
      dropdownInstance = new Dropdown(dropdownButton.value, {
        popperConfig: null, // Disable Popper.js positioning
      })
      console.log('Mobile offline dropdown initialized successfully')
    } else {
      console.error('Dropdown button ref not found')
    }
  } catch (error) {
    console.error('Failed to initialize mobile offline dropdown:', error)
  }
})
</script>

<style scoped>
.nav-item.dropdown {
  position: relative;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: white !important;
  opacity: 0.8;
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

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

<style>
/* Global styles for the dropdown (not scoped to avoid conflicts) */
.offline-dropdown {
  min-width: 240px !important;
  max-width: 280px !important;
  padding: 0.5rem 0 !important;
  z-index: 9999 !important;
  position: absolute !important;
  top: 100% !important;
  right: 0 !important;
  left: auto !important;
  margin-top: 0.5rem !important;
  transform: translate3d(0px, 0px, 0px) !important;
}

.offline-dropdown .dropdown-header {
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
}

.offline-dropdown .dropdown-item-text {
  padding: 0.4rem 1rem;
  color: #6c757d;
  white-space: normal;
  word-wrap: break-word;
}

.offline-dropdown .dropdown-item {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  white-space: normal;
}

.offline-dropdown .dropdown-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 576px) {
  .offline-dropdown {
    min-width: 220px !important;
    max-width: 240px !important;
    right: -8px !important;
  }
  
  .badge {
    font-size: 0.55em;
  }
}
</style>
