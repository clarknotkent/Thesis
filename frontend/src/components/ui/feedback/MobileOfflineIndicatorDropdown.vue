<template>
  <!-- WiFi Status Dropdown in header (always visible for HealthWorker/Parent) -->
  <div class="nav-item dropdown">
    <button 
      ref="dropdownButton"
      class="nav-link position-relative border-0 bg-transparent p-0" 
      id="mobileOfflineDropdown"
      data-bs-toggle="dropdown" 
      data-bs-auto-close="true"
      aria-expanded="false"
      type="button"
      @click="toggleDropdown"
    >
      <i :class="statusIcon" :style="{ color: statusColor }" class="fs-5"></i>
      <span v-if="pendingSyncCount > 0" class="badge bg-warning position-absolute top-0 start-100 translate-middle">
        {{ pendingSyncCount }}
      </span>
    </button>
    
    <ul class="dropdown-menu dropdown-menu-end offline-dropdown" aria-labelledby="mobileOfflineDropdown">
      <li><div class="dropdown-header">
        <strong>{{ connectionStatus }}</strong>
      </div></li>
      
      <li><hr class="dropdown-divider"></li>
      
      <li><div class="dropdown-item-text small">
        <i class="bi bi-clock-history me-2"></i>
        Last sync: {{ formattedLastSyncTime }}
      </div></li>
      
      <li v-if="isSyncing"><div class="dropdown-item-text small">
        <div class="spinner-border spinner-border-sm me-2" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        {{ syncProgress }}
      </div></li>
      
      <li><hr class="dropdown-divider"></li>
      
      <li><button 
        class="dropdown-item text-primary"
        @click="handleSync"
        :disabled="!isOnline || isSyncing"
      >
        <i class="bi bi-arrow-repeat me-2"></i>
        Sync Now
      </button></li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOffline } from '@/composables/useOffline'

const dropdownButton = ref(null)
let dropdownInstance = null

const {
  isOnline,
  isSyncing,
  syncProgress,
  pendingSyncCount,
  formattedLastSyncTime,
  connectionStatus,
  syncData,
} = useOffline()

const statusIcon = computed(() => {
  if (isSyncing.value) return 'bi bi-arrow-repeat spinner'
  if (isOnline.value) return 'bi bi-wifi'
  return 'bi bi-wifi-off'
})

const statusColor = computed(() => {
  // Always white for header visibility
  return '#ffffff'
})

const handleSync = async () => {
  try {
    await syncData()
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

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
    const { Dropdown } = await import('bootstrap')
    if (dropdownButton.value) {
      dropdownInstance = new Dropdown(dropdownButton.value)
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
  min-width: 280px !important;
  padding: 0.5rem 0 !important;
  z-index: 9999 !important;
  position: absolute !important;
}

.offline-dropdown .dropdown-header {
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
}

.offline-dropdown .dropdown-item-text {
  padding: 0.4rem 1rem;
  color: #6c757d;
}

.offline-dropdown .dropdown-item {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.offline-dropdown .dropdown-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 576px) {
  .offline-dropdown {
    min-width: 260px;
  }
  
  .badge {
    font-size: 0.55em;
  }
}
</style>
