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
          @filter-change="setFilterOverride"
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
          :format-time="formatTime"
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
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'
import {
  InventoryStatsCards,
  InventoryTable,
  ReceivingReportsTable,
  VaccineScheduleSection
} from '@/features/admin/inventory'

const router = useRouter()
const {
  isOffline,
  isCaching,
  fetchVaccineInventory: fetchVaccineInventoryOffline,
  fetchVaccines: fetchVaccinesOffline
} = useOfflineAdmin()

// Wrapper methods to use offline functionality
const fetchVaccinesOfflineWrapper = async () => {
  try {
    const params = {}
    
    if (currentFilter.value === 'NIP') {
      params.is_nip = 'true'
    } else if (currentFilter.value === 'Others') {
      params.is_nip = 'false'
    }
    
    const result = await fetchVaccineInventoryOffline(params)
    
    if (result.success) {
      // Transform the cached data to match the expected format
      const items = result.data || []
      const filteredItems = Array.isArray(items) ? items.filter(v => v && v.is_deleted !== true) : []
      
      vaccines.value = filteredItems.map(v => {
        const qty = (v.current_stock_level ?? v.quantity ?? 0)
        const exp = v.expiration_date || v.expiry_date || null
        const now = new Date()
        let status = v.status || null
        
        if (exp) {
          const d = new Date(exp)
          if (!isNaN(d)) {
            const in30 = new Date(now.getTime() + 30*24*60*60*1000)
            if (d < now) status = 'Expired'
            else if (d >= now && d <= in30) status = 'Expiring Soon'
          }
        }
        
        if (!status) status = (qty > 0 ? (qty < 10 ? 'Low Stock' : 'Available') : 'Out of Stock')
        
        return {
          id: v.inventory_id || v.id,
          vaccine_id: v.vaccinemaster?.vaccine_id || v.vaccine_id || v.vaccine?.vaccine_id,
          vaccineName: v.vaccinemaster?.antigen_name || v.vaccine?.antigen_name || v.antigen_name || '',
          brandName: v.vaccinemaster?.brand_name || v.vaccine?.brand_name || v.brand_name || '',
          manufacturer: v.vaccinemaster?.manufacturer || v.vaccine?.manufacturer || v.manufacturer || '',
          category: v.vaccinemaster?.category || v.category || '',
          is_nip: v.is_nip === true || v.is_nip === 'true' || v.vaccinemaster?.is_nip === true || v.vaccinemaster?.is_nip === 'true' || v.vaccine?.is_nip === true || v.vaccine?.is_nip === 'true' || false,
          batchNo: v.lot_number || v.batch_number || '',
          expiryDate: v.expiration_date || v.expiry_date || '',
          storageLocation: v.storage_location || v.storageLocation || '',
          quantity: qty,
          status
        }
      })
      
      console.log('📦 [VaccineInventory] Loaded vaccine inventory from cache/offline storage')
    } else {
      // If offline fetch fails and we're online, try a fresh API call once
      if (!isOffline.value) {
        console.log('📡 [VaccineInventory] Offline fetch failed, falling back to fresh API call')
        await fetchVaccines()
      } else {
        console.log('📴 [VaccineInventory] Offline fetch failed and currently offline, using empty data')
        vaccines.value = []
      }
    }
  } catch (error) {
    console.error('Error fetching vaccines offline:', error)
    // Only fallback to API if we're online and this is the first attempt
    if (!isOffline.value) {
      console.log('📡 [VaccineInventory] Error occurred, falling back to API call')
      await fetchVaccines()
    } else {
      console.log('📴 [VaccineInventory] Error occurred while offline, using empty data')
      vaccines.value = []
    }
  }
}

const fetchExistingVaccinesOfflineWrapper = async () => {
  try {
    const result = await fetchVaccinesOffline()
    
    if (result.success) {
      const items = result.data || []
      existingVaccines.value = items.map(v => ({
        ...v,
        id: v.vaccine_id || v.id
      }))
      console.log('📦 [VaccineInventory] Loaded vaccine types from cache/offline storage')
    } else {
      // If offline fetch fails and we're online, try a fresh API call once
      if (!isOffline.value) {
        console.log('📡 [VaccineInventory] Offline fetch failed, falling back to fresh API call')
        await fetchExistingVaccines()
      } else {
        console.log('📴 [VaccineInventory] Offline fetch failed and currently offline, using empty data')
        existingVaccines.value = []
      }
    }
  } catch (error) {
    console.error('Error fetching vaccine types offline:', error)
    // Only fallback to API if we're online
    if (!isOffline.value) {
      console.log('📡 [VaccineInventory] Error occurred, falling back to API call')
      await fetchExistingVaccines()
    } else {
      console.log('📴 [VaccineInventory] Error occurred while offline, using empty data')
      existingVaccines.value = []
    }
  }
}

const fetchDiseaseOptionsOfflineWrapper = async () => {
  try {
    const result = await fetchVaccinesOffline()
    
    if (result.success) {
      const vaccines = result.data || []
      
      diseaseOptions.value = [...new Set(vaccines.map(v => v.disease_prevented).filter(d => d && d.trim()))].sort()
      antigenOptions.value = [...new Set(vaccines.map(v => v.antigen_name).filter(d => d && d.trim()))].sort()
      brandOptions.value = [...new Set(vaccines.map(v => v.brand_name).filter(d => d && d.trim()))].sort()
      manufacturerOptions.value = [...new Set(vaccines.map(v => v.manufacturer).filter(d => d && d.trim()))].sort()
      
      console.log('📦 [VaccineInventory] Loaded disease options from cache/offline storage')
    } else {
      // If offline fetch fails and we're online, try a fresh API call once
      if (!isOffline.value) {
        console.log('📡 [VaccineInventory] Offline fetch failed, falling back to fresh API call')
        await fetchDiseaseOptions()
      } else {
        console.log('📴 [VaccineInventory] Offline fetch failed and currently offline, using empty options')
        diseaseOptions.value = []
        antigenOptions.value = []
        brandOptions.value = []
        manufacturerOptions.value = []
      }
    }
  } catch (error) {
    console.error('Error fetching disease options offline:', error)
    // Only fallback to API if we're online
    if (!isOffline.value) {
      console.log('📡 [VaccineInventory] Error occurred, falling back to API call')
      await fetchDiseaseOptions()
    } else {
      console.log('📴 [VaccineInventory] Error occurred while offline, using empty options')
      diseaseOptions.value = []
      antigenOptions.value = []
      brandOptions.value = []
      manufacturerOptions.value = []
    }
  }
}

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
  fetchExistingVaccines,
  fetchReceivingList,
  fetchDiseaseOptions,
  deleteVaccine,
  formatDate,
  formatTime,
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

// Override setFilter to use offline functionality
const setFilterOverride = (filter) => {
  currentFilter.value = filter
  goToPage(1)
  fetchVaccinesOfflineWrapper()
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
  // Preload InventoryHistory component for transaction history view offline support
  import('@/views/admin/inventory/InventoryHistory.vue').catch(() => {
    console.warn('[Offline] InventoryHistory preload failed - may not be available offline')
  })
  
  console.log('📦 [VaccineInventory] Preloading inventory components for offline use')
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
  
  await fetchVaccinesOfflineWrapper()
  await fetchExistingVaccinesOfflineWrapper()
  await fetchStatsOfflineWrapper()
  await fetchSchedulesOfflineWrapper()
  await fetchDiseaseOptionsOfflineWrapper()
  await fetchReceivingList()
  
  // Preload lazy-loaded components for offline use
  preloadInventoryComponents()
})

// Cleanup event listeners on unmount
onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>
