<template>
  <!-- Desktop Only: Floating indicator at bottom left -->
  <div
    class="desktop-offline-indicator d-none d-xl-block"
    :class="indicatorClass"
  >
    <!-- Main status bar -->
    <div
      class="status-bar"
      @click="toggleDetails"
    >
      <i :class="statusIcon" />
      <span class="status-text">{{ connectionStatus }}</span>
      <i class="bi bi-chevron-down ms-auto" />
    </div>

    <!-- Expandable details -->
    <transition name="slide-down">
      <div
        v-if="showDetails"
        class="details-panel"
      >
        <!-- Info message -->
        <div class="detail-row">
          <i class="bi bi-info-circle" />
          <span>Data caches automatically as you navigate</span>
        </div>

        <!-- Storage stats -->
        <div
          v-if="storageStats && Object.keys(storageStats).length > 0"
          class="detail-row"
        >
          <i class="bi bi-database" />
          <span>Cached: {{ totalCachedRecords }} records</span>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button 
            class="btn btn-sm btn-outline-secondary" 
            @click="showStorageDetails = !showStorageDetails"
          >
            <i class="bi bi-info-circle" />
            {{ showStorageDetails ? 'Hide' : 'Show' }} Details
          </button>
        </div>

        <!-- Storage details -->
        <transition name="fade">
          <div
            v-if="showStorageDetails && storageStats"
            class="storage-details"
          >
            <h6>Offline Storage</h6>
            <div class="storage-list">
              <div
                v-for="(count, store) in storageStats"
                :key="store"
                class="storage-item"
              >
                <span class="store-name">{{ formatStoreName(store) }}</span>
                <span class="store-count">{{ count }}</span>
              </div>
            </div>
            <button 
              class="btn btn-sm btn-outline-danger mt-2 w-100"
              @click="handleClearData"
            >
              <i class="bi bi-trash" />
              Clear Offline Data
            </button>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOffline } from '@/composables/useOffline'

const {
  isOnline,
  connectionStatus,
  clearOfflineData,
  getStorageStats,
} = useOffline()

const showDetails = ref(false)
const showStorageDetails = ref(false)
const storageStats = ref(null)

const indicatorClass = computed(() => ({
  'online': isOnline.value,
  'offline': !isOnline.value,
}))

const statusIcon = computed(() => {
  if (isOnline.value) return 'bi bi-wifi'
  return 'bi bi-wifi-off'
})

const totalCachedRecords = computed(() => {
  if (!storageStats.value) return 0
  return Object.values(storageStats.value).reduce((sum, count) => sum + count, 0)
})

const toggleDetails = () => {
  showDetails.value = !showDetails.value
  if (showDetails.value && !storageStats.value) {
    loadStorageStats()
  }
}

const handleClearData = async () => {
  if (!confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
    return
  }

  try {
    await clearOfflineData()
    await loadStorageStats()
    alert('Offline data cleared successfully.')
  } catch (error) {
    console.error('Failed to clear data:', error)
    alert('Failed to clear offline data.')
  }
}

const loadStorageStats = async () => {
  try {
    storageStats.value = await getStorageStats()
  } catch (error) {
    console.error('Failed to load storage stats:', error)
  }
}

const formatStoreName = (store) => {
  return store
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

onMounted(() => {
  loadStorageStats()
})
</script>

<style scoped>
.desktop-offline-indicator {
  position: fixed;
  bottom: 20px;
  left: 20px;
  max-width: 350px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1050;
  overflow: hidden;
  transition: all 0.3s ease;
}

.desktop-offline-indicator.online {
  border-left: 4px solid #198754;
}

.desktop-offline-indicator.offline {
  border-left: 4px solid #dc3545;
}

.status-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.status-bar:hover {
  background-color: #f8f9fa;
}

.status-bar i:first-child {
  font-size: 18px;
  margin-right: 10px;
}

.status-text {
  font-weight: 500;
  flex: 1;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.details-panel {
  border-top: 1px solid #dee2e6;
  padding: 12px 16px;
  background-color: #f8f9fa;
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: #6c757d;
}

.detail-row i {
  margin-right: 8px;
  font-size: 16px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.actions button {
  flex: 1;
}

.storage-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #dee2e6;
}

.storage-details h6 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #495057;
}

.storage-list {
  max-height: 200px;
  overflow-y: auto;
}

.storage-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  font-size: 13px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.storage-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.store-name {
  color: #495057;
}

.store-count {
  font-weight: 600;
  color: #0d6efd;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
