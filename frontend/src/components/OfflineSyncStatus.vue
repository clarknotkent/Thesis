<template>
  <div class="offline-sync-status">
    <!-- Sync Status Bar -->
    <div 
      v-if="showSyncStatus" 
      :class="syncBarClasses"
      class="sync-status-bar d-flex align-items-center justify-content-between p-2"
    >
      <div class="d-flex align-items-center">
        <i :class="syncIconClass" class="me-2"></i>
        <span class="sync-message">{{ syncMessage }}</span>
        <span v-if="pendingCount > 0" class="badge bg-warning ms-2">
          {{ pendingCount }} pending
        </span>
      </div>
      
      <div class="sync-actions">
        <button 
          v-if="canSync" 
          @click="manualSync"
          :disabled="isSyncing"
          class="btn btn-sm btn-outline-light"
        >
          <i class="bi bi-arrow-clockwise" :class="{ 'spin': isSyncing }"></i>
          {{ isSyncing ? 'Syncing...' : 'Sync Now' }}
        </button>
        
        <button 
          @click="hideSyncStatus" 
          class="btn btn-sm btn-link text-white ms-2"
        >
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>

    <!-- Offline Data Manager -->
    <div v-if="showDataManager" class="offline-data-manager mt-3">
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <h6 class="mb-0">
            <i class="bi bi-database me-2"></i>
            Offline Data Storage
          </h6>
          <button 
            @click="toggleDataManager" 
            class="btn btn-sm btn-outline-secondary"
          >
            <i class="bi bi-chevron-up"></i>
          </button>
        </div>
        
        <div class="card-body">
          <!-- Storage Statistics -->
          <div class="row mb-3">
            <div class="col-md-6">
              <div class="stat-card text-center p-3 border rounded">
                <div class="h4 mb-1 text-primary">{{ totalRecords }}</div>
                <small class="text-muted">Total Records</small>
              </div>
            </div>
            <div class="col-md-6">
              <div class="stat-card text-center p-3 border rounded">
                <div class="h4 mb-1 text-warning">{{ pendingSync }}</div>
                <small class="text-muted">Pending Sync</small>
              </div>
            </div>
          </div>

          <!-- Data Breakdown -->
          <div class="data-breakdown">
            <h6 class="mb-2">Data Breakdown:</h6>
            <div class="row">
              <div v-for="(count, table) in tableData" :key="table" class="col-6 col-md-4 mb-2">
                <div class="small">
                  <i :class="getTableIcon(table)" class="me-1"></i>
                  {{ formatTableName(table) }}: 
                  <span class="fw-bold">{{ count.total }}</span>
                  <span v-if="count.unsynced > 0" class="text-warning">
                    ({{ count.unsynced }} unsynced)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Storage Usage -->
          <div v-if="storageInfo" class="mt-3">
            <h6 class="mb-2">Storage Usage:</h6>
            <div class="progress mb-2" style="height: 8px;">
              <div 
                class="progress-bar bg-info" 
                :style="{ width: storagePercentage + '%' }"
              ></div>
            </div>
            <small class="text-muted">
              {{ storageInfo.usedMB }} MB used of {{ storageInfo.availableMB }} MB available
            </small>
          </div>

          <!-- Actions -->
          <div class="mt-3 d-flex gap-2">
            <button 
              @click="exportData" 
              class="btn btn-sm btn-outline-primary"
              :disabled="isSyncing"
            >
              <i class="bi bi-download me-1"></i>
              Export Data
            </button>
            
            <button 
              @click="clearOfflineData" 
              class="btn btn-sm btn-outline-danger"
              :disabled="isSyncing"
            >
              <i class="bi bi-trash me-1"></i>
              Clear Offline Data
            </button>

            <button 
              @click="fullSync" 
              class="btn btn-sm btn-primary"
              :disabled="!isOnline || isSyncing"
            >
              <i class="bi bi-cloud-download me-1"></i>
              Full Sync
            </button>
          </div>
          
          <!-- Last Sync Info -->
          <div v-if="lastSync" class="mt-3 text-muted small">
            Last sync: {{ formatDate(lastSync) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Access Toggle -->
    <button 
      v-if="!showDataManager && (pendingCount > 0 || !isOnline)"
      @click="toggleDataManager"
      class="btn btn-sm floating-sync-btn"
      :class="isOnline ? 'btn-warning' : 'btn-secondary'"
    >
      <i class="bi bi-database"></i>
      <span v-if="pendingCount > 0" class="badge bg-danger position-absolute">
        {{ pendingCount > 99 ? '99+' : pendingCount }}
      </span>
    </button>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { offlineStorage } from '../services/offlineStorage.js'
import { backgroundSync } from '../services/backgroundSync.js'
import { dbHelpers } from '../services/offlineDB.js'

export default {
  name: 'OfflineSyncStatus',
  setup() {
    const isOnline = ref(navigator.onLine)
    const isSyncing = ref(false)
    const showSyncStatus = ref(false)
    const showDataManager = ref(false)
    const syncStatus = ref({})
    const storageInfo = ref(null)
    const lastSyncMessage = ref('')

    // Computed properties
    const pendingCount = computed(() => syncStatus.value.totalUnsynced || 0)
    
    const syncMessage = computed(() => {
      if (!isOnline.value) return 'Offline - Data saved locally'
      if (isSyncing.value) return 'Syncing with server...'
      if (pendingCount.value > 0) return `${pendingCount.value} items need syncing`
      return lastSyncMessage.value || 'All data synced'
    })

    const syncBarClasses = computed(() => {
      if (!isOnline.value) return 'bg-secondary'
      if (isSyncing.value) return 'bg-info'
      if (pendingCount.value > 0) return 'bg-warning'
      return 'bg-success'
    })

    const syncIconClass = computed(() => {
      if (!isOnline.value) return 'bi bi-wifi-off'
      if (isSyncing.value) return 'bi bi-arrow-clockwise spin'
      if (pendingCount.value > 0) return 'bi bi-exclamation-triangle'
      return 'bi bi-check-circle'
    })

    const canSync = computed(() => isOnline.value && pendingCount.value > 0)

    const totalRecords = computed(() => {
      if (!syncStatus.value.unsyncedCounts) return 0
      return Object.values(syncStatus.value.unsyncedCounts).reduce((total, count) => {
        return total + (count.total || 0)
      }, 0)
    })

    const pendingSync = computed(() => pendingCount.value)

    const tableData = computed(() => {
      if (!syncStatus.value.unsyncedCounts) return {}
      return syncStatus.value.unsyncedCounts
    })

    const storagePercentage = computed(() => {
      if (!storageInfo.value) return 0
      return Math.round((storageInfo.value.used / storageInfo.value.available) * 100)
    })

    // Methods
    const updateSyncStatus = async () => {
      try {
        syncStatus.value = await backgroundSync.getSyncInfo()
        
        // Show sync bar if offline or pending items
        showSyncStatus.value = !isOnline.value || pendingCount.value > 0
      } catch (error) {
        console.error('Failed to update sync status:', error)
      }
    }

    const updateStorageInfo = async () => {
      try {
        storageInfo.value = await dbHelpers.getStorageSize()
      } catch (error) {
        console.error('Failed to get storage info:', error)
      }
    }

    const manualSync = async () => {
      if (!isOnline.value) return
      
      isSyncing.value = true
      try {
        await backgroundSync.manualSync()
        lastSyncMessage.value = 'Sync completed successfully'
      } catch (error) {
        console.error('Manual sync failed:', error)
        lastSyncMessage.value = 'Sync failed'
      } finally {
        isSyncing.value = false
        await updateSyncStatus()
      }
    }

    const fullSync = async () => {
      if (!isOnline.value) return
      
      isSyncing.value = true
      try {
        await offlineStorage.fullSync()
        lastSyncMessage.value = 'Full sync completed'
      } catch (error) {
        console.error('Full sync failed:', error)
        lastSyncMessage.value = 'Full sync failed'
      } finally {
        isSyncing.value = false
        await updateSyncStatus()
      }
    }

    const { addToast } = useToast()

    const exportData = async () => {
      try {
        const data = await dbHelpers.exportData()
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
          type: 'application/json' 
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `healthcare-data-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Export failed:', error)
        addToast({ title: 'Error', message: 'Export failed. Please try again.', type: 'error' })
      }
    }

    const clearOfflineData = async () => {
      if (confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
        try {
          await dbHelpers.clearAllData()
          await updateSyncStatus()
          addToast({ title: 'Success', message: 'Offline data cleared successfully', type: 'success' })
        } catch (error) {
          console.error('Clear data failed:', error)
          addToast({ title: 'Error', message: 'Failed to clear data. Please try again.', type: 'error' })
        }
      }
    }

    const hideSyncStatus = () => {
      showSyncStatus.value = false
    }

    const toggleDataManager = () => {
      showDataManager.value = !showDataManager.value
    }

    const formatTableName = (tableName) => {
      const names = {
        patients: 'Patients',
        appointments: 'Appointments',
        immunizations: 'Immunizations',
        vaccines: 'Vaccines',
        healthWorkers: 'Health Workers',
        guardians: 'Guardians'
      }
      return names[tableName] || tableName
    }

    const getTableIcon = (tableName) => {
      const icons = {
        patients: 'bi bi-person',
        appointments: 'bi bi-calendar-event',
        immunizations: 'bi bi-shield-plus',
        vaccines: 'bi bi-capsule',
        healthWorkers: 'bi bi-person-badge',
        guardians: 'bi bi-people'
      }
      return icons[tableName] || 'bi bi-database'
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleString()
    }

    // Event listeners
    const handleOnline = () => {
      isOnline.value = true
      updateSyncStatus()
    }

    const handleOffline = () => {
      isOnline.value = false
      updateSyncStatus()
    }

    const handleSyncEvent = (event) => {
      lastSyncMessage.value = event.detail.message
      updateSyncStatus()
    }

    onMounted(() => {
      // Initial load
      updateSyncStatus()
      updateStorageInfo()
      
      // Setup event listeners
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      window.addEventListener('sync-status', handleSyncEvent)
      
      // Periodic updates
      const interval = setInterval(() => {
        updateSyncStatus()
        updateStorageInfo()
      }, 30000) // Update every 30 seconds
      
      onUnmounted(() => {
        clearInterval(interval)
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        window.removeEventListener('sync-status', handleSyncEvent)
      })
    })

    return {
      isOnline,
      isSyncing,
      showSyncStatus,
      showDataManager,
      pendingCount,
      syncMessage,
      syncBarClasses,
      syncIconClass,
      canSync,
      totalRecords,
      pendingSync,
      tableData,
      storageInfo,
      storagePercentage,
      lastSync: computed(() => syncStatus.value.lastSync),
      manualSync,
      fullSync,
      exportData,
      clearOfflineData,
      hideSyncStatus,
      toggleDataManager,
      formatTableName,
      getTableIcon,
      formatDate
    }
  }
}
</script>

<style scoped>
.sync-status-bar {
  position: sticky;
  top: 0;
  z-index: 1000;
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.floating-sync-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.floating-sync-btn .badge {
  top: -5px;
  right: -5px;
  font-size: 0.6rem;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.data-breakdown {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
}

.progress {
  background-color: #e9ecef;
}

@media (max-width: 768px) {
  .sync-status-bar {
    flex-direction: column;
    gap: 10px;
  }
  
  .sync-actions {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
}
</style>