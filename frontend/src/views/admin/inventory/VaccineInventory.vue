<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Offline Indicator Banner -->
      <div
        v-if="isOffline"
        class="alert alert-warning d-flex align-items-center mb-3"
        role="alert"
      >
        <i class="bi bi-wifi-off me-2 fs-5" />
        <div>
          <strong>Offline Mode</strong> - You're viewing cached inventory data. Creating new records is disabled until you reconnect.
        </div>
      </div>

      <!-- Caching Progress Banner -->
      <div
        v-if="isCaching"
        class="alert alert-info d-flex align-items-center mb-3"
        role="alert"
      >
        <div
          class="spinner-border spinner-border-sm me-2"
          role="status"
        >
          <span class="visually-hidden">Caching...</span>
        </div>
        <div>
          <strong>Caching inventory data...</strong> Saving vaccine stock for offline access.
        </div>
      </div>

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            Vaccine Inventory
          </h1>
          <p class="text-muted mb-0">
            Manage vaccine types and track vaccine stock levels
          </p>
        </div>
        <div class="d-flex gap-2">
          <router-link
            v-if="!isOffline"
            class="btn btn-outline-warning"
            to="/admin/vaccines/edit-vaccine-type"
          >
            <i class="bi bi-pencil-square me-2" />Edit Vaccine Type
          </router-link>
          <button
            v-else
            class="btn btn-outline-secondary"
            disabled
            title="Editing is disabled while offline"
          >
            <i class="bi bi-wifi-off me-2" />Edit Vaccine Type (Offline)
          </button>
          
          <button
            v-if="!isOffline"
            class="btn btn-primary"
            @click="goToCreateReceiving"
          >
            <i class="bi bi-plus-circle me-2" />New Receiving Report
          </button>
          <button
            v-else
            class="btn btn-secondary"
            disabled
            title="Creating records is disabled while offline"
          >
            <i class="bi bi-wifi-off me-2" />New Receiving Report (Offline)
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <template v-if="!loading">
        <!-- Statistics Cards -->
        <InventoryStatsCards :stats="stats" />

        <!-- Inventory Table -->
        <InventoryTable
          :paginated-vaccines="paginatedVaccines"
          :search-term="searchTerm"
          :current-filter="currentFilter"
          :current-sort="currentSort"
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="filteredVaccines.length"
          :items-per-page="itemsPerPage"
          :is-offline="isOffline"
          :format-date="formatDate"
          :get-quantity-class="getQuantityClass"
          :get-status-badge-class="getStatusBadgeClass"
          @update:search-term="searchTerm = $event; watchSearchTerm()"
          @filter-change="setFilter"
          @sort-change="setSort"
          @delete="deleteVaccine"
          @page-changed="goToPage"
        />

        <!-- Vaccine Schedules Section -->
        <VaccineScheduleSection :existing-vaccines="existingVaccines" />

        <!-- Receiving Reports Section -->
        <ReceivingReportsTable
          :receiving-list="receivingList"
          :loading="receivingLoading"
          :search-term="receivingSearch"
          :status="receivingStatus"
          :format-date="formatDate"
          :get-receiving-badge-class="getReceivingBadgeClass"
          @update:search-term="receivingSearch = $event; fetchReceivingList()"
          @update:status="receivingStatus = $event; fetchReceivingList()"
          @refresh="fetchReceivingList"
          @view="goToViewReceiving"
          @complete="goToCompleteReceiving"
          @cancel="goToCancelReceiving"
        />
      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import { useVaccineInventory } from '@/composables/useVaccineInventory'
import { useToast } from '@/composables/useToast'
import {
  InventoryStatsCards,
  InventoryTable,
  ReceivingReportsTable,
  VaccineScheduleSection
} from '@/features/admin/inventory'

const router = useRouter()
const { addToast } = useToast()

const isOffline = ref(!navigator.onLine)
const isCaching = ref(false)

const {
  // State
  loading,
  existingVaccines,
  stats,
  searchTerm,
  currentFilter,
  
  // Receiving
  receivingLoading,
  receivingList,
  receivingStatus,
  receivingSearch,
  
  // Pagination
  itemsPerPage,
  currentPage,
  totalPages,
  filteredVaccines,
  paginatedVaccines,
  goToPage,
  
  // Methods
  fetchVaccines,
  fetchStats,
  fetchExistingVaccines,
  fetchSchedules,
  fetchReceivingList,
  fetchDiseaseOptions,
  deleteVaccine,
  formatDate,
  setFilter,
  watchSearchTerm,
  goToViewReceiving,
  goToCompleteReceiving,
  goToCancelReceiving,
  getReceivingBadgeClass,
  getQuantityClass,
  getStatusBadgeClass
} = useVaccineInventory()

// Local handlers
const goToCreateReceiving = () => {
  router.push('/admin/inventory/receiving-report/new')
}

const setSort = (_sortKey) => {
  // Handle sort change
}

/**
 * Preload lazy-loaded inventory route components for offline use
 * This ensures components are cached and available offline
 */
const preloadInventoryComponents = () => {
  // Preload ViewInventory component (lazy-loaded in router)
  // Used when clicking "View" button on any inventory item
  import('@/views/admin/inventory/ViewInventory.vue').catch(() => {
    console.warn('[Offline] ViewInventory preload failed - may not be available offline')
  })
  
  console.log('📦 [VaccineInventory] Preloading inventory components for offline use')
}

/**
 * Prefetch inventory data for offline caching
 * Caches all vaccine stock when viewing inventory page
 */
const prefetchInventoryData = async () => {
  // Skip if offline
  if (!navigator.onLine) {
    console.log('⚠️ [VaccineInventory] Skipping prefetch (offline)')
    return
  }
  
  try {
    isCaching.value = true
    console.log('🔄 [VaccineInventory] Prefetching inventory data for offline access')
    
    // Inventory is already fetched by fetchVaccines()
    // The response interceptor will auto-cache it
    // So we just need to show the success message
    
    // Small delay to ensure caching completes
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('✅ [VaccineInventory] Inventory data cached')
    
    // Show success toast notification
    addToast({
      title: 'Offline Ready',
      message: 'Inventory cached successfully',
      type: 'success',
      timeout: 3000
    })
    
  } catch (error) {
    console.warn('[VaccineInventory] Prefetch failed:', error)
  } finally {
    isCaching.value = false
  }
}

// Online/Offline event listeners
const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine
  
  if (navigator.onLine) {
    console.log('🌐 Connection restored')
    addToast({
      title: 'Back Online',
      message: 'You can now edit records',
      type: 'success',
      timeout: 3000
    })
  } else {
    console.log('📴 Connection lost')
    addToast({
      title: 'Offline',
      message: 'Viewing cached data',
      type: 'warning',
      timeout: 3000
    })
  }
}

// Initialize on mount
onMounted(async () => {
  // Add online/offline event listeners
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  
  await fetchVaccines()
  await fetchExistingVaccines()
  await fetchStats()
  await fetchSchedules()
  await fetchDiseaseOptions()
  await fetchReceivingList()
  
  // Preload lazy-loaded components for offline use
  preloadInventoryComponents()
  
  // Prefetch inventory data for offline caching
  await prefetchInventoryData()
})

// Cleanup event listeners on unmount
onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>
