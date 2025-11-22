<template>
  <div class="vaccine-stock-section">
    <!-- Header Section -->
    <div class="mb-3">
      <h5 class="mb-0">
        <i class="bi bi-capsule me-2" />Vaccine Stock Levels
      </h5>
    </div>

    <!-- Search and Filter Section -->
    <div class="d-flex justify-content-between align-items-center mb-3 gap-3">
      <div class="d-flex gap-2 align-items-center flex-grow-1">
        <!-- Search Bar -->
        <div
          class="input-group"
          style="max-width: 300px;"
        >
          <input 
            v-model="searchTerm" 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="Search vaccines..."
            aria-label="Search"
          >
          <button
            class="btn btn-sm btn-outline-primary"
            type="button"
          >
            <i class="bi bi-search" />
          </button>
        </div>
        
        <!-- Category Filter -->
        <div class="dropdown">
          <button
            id="categoryFilter"
            class="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            @click="debugDropdown('category')"
          >
            Filter: {{ currentCategoryLabel }}
          </button>
          <ul
            class="dropdown-menu"
            aria-labelledby="categoryFilter"
          >
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setCategoryFilter('All')"
              >All Vaccines</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setCategoryFilter('NIP')"
              >NIP Vaccines</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setCategoryFilter('Others')"
              >Other Vaccines</a>
            </li>
          </ul>
        </div>
        
        <!-- Type/Status Filter -->
        <div class="dropdown">
          <button
            id="statusFilter"
            class="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            @click="debugDropdown('status')"
          >
            Type: {{ currentStatusFilter }}
          </button>
          <ul
            class="dropdown-menu"
            aria-labelledby="statusFilter"
          >
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setStatusFilter('All Status')"
              >All Status</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setStatusFilter('Available')"
              >Available</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setStatusFilter('Low Stock')"
              >Low Stock</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setStatusFilter('Expiring Soon')"
              >Expiring Soon</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setStatusFilter('Expired')"
              >Expired</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setStatusFilter('Out of Stock')"
              >Out of Stock</a>
            </li>
          </ul>
        </div>
        
        <!-- Sort Dropdown -->
        <div class="dropdown">
          <button
            id="sortDropdown"
            class="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            @click="debugDropdown('sort')"
          >
            Sort: {{ currentSort }}
          </button>
          <ul
            class="dropdown-menu"
            aria-labelledby="sortDropdown"
          >
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setSort('Name A-Z')"
              >Name A-Z</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setSort('Name Z-A')"
              >Name Z-A</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setSort('Quantity Low-High')"
              >Quantity Low-High</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setSort('Quantity High-Low')"
              >Quantity High-Low</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setSort('Expiry Date')"
              >Expiry Date</a>
            </li>
          </ul>
        </div>

        <!-- Removed from view toggle -->
        <div class="form-check form-switch ms-2">
          <input
            id="toggleRemovedFromView"
            v-model="showRemovedFromView"
            class="form-check-input"
            type="checkbox"
          >
          <label
            class="form-check-label"
            for="toggleRemovedFromView"
          >Removed from view</label>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex gap-2 align-items-center">
        <button
          class="btn btn-sm btn-outline-primary"
          @click="refreshData"
        >
          <i class="bi bi-arrow-clockwise me-1" />Refresh
        </button>
        <button
          class="btn btn-sm btn-outline-warning"
          :disabled="isOffline"
          :title="isOffline ? 'Not available offline' : 'Edit Vaccine Type'"
          @click="handleEditVaccineTypeClick"
        >
          <i class="bi bi-pencil-square me-1" />Edit Vaccine Type
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
        <span class="visually-hidden">Loading vaccine stock...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!filteredInventory || filteredInventory.length === 0"
      class="text-center py-5"
    >
      <i
        class="bi bi-inbox text-muted"
        style="font-size: 3rem;"
      />
      <p class="text-muted mt-3">
        No vaccine stock found
      </p>
    </div>

    <!-- Stock Table -->
    <div
      v-else
      class="table-responsive"
    >
      <table class="table table-hover table-bordered">
        <thead class="table-light">
          <tr>
            <th class="text-center">
              Vaccine Name
            </th>
            <th class="text-center">
              Brand
            </th>
            <th class="text-center">
              Batch Number
            </th>
            <th class="text-center">
              Quantity
            </th>
            <th class="text-center">
              Expiration Date
            </th>
            <th class="text-center">
              Status
            </th>
            <th class="text-center">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in paginatedInventory"
            :key="item.id"
          >
            <td class="text-center align-middle">
              {{ item.antigen_name || '—' }}
            </td>
            <td class="text-center align-middle">
              {{ item.brand_name || '—' }}
            </td>
            <td class="text-center align-middle">
              <code>{{ item.batch_number || '—' }}</code>
            </td>
            <td class="text-center align-middle">
              <span
                class="badge"
                :class="getQuantityBadgeClass(item.quantity, item.minimum_stock)"
              >
                {{ item.quantity || 0 }}
              </span>
            </td>
            <td class="text-center align-middle">
              <span :class="getExpirationClass(item.expiration_date)">
                {{ formatDate(item.expiration_date) }}
              </span>
            </td>
            <td class="text-center align-middle">
              <span
                class="badge"
                :class="getStatusBadgeClass(item)"
              >
                {{ getStatus(item) }}
              </span>
            </td>
            <td class="text-center align-middle">
              <button
                class="btn btn-sm btn-outline-primary"
                title="View Details"
                @click="viewDetails(item)"
              >
                <i class="bi bi-eye me-1" />View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Pagination Footer -->
    <div
      v-if="filteredInventory.length > 0"
      class="pagination-footer border-top mt-3 pt-3"
    >
      <AppPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="filteredInventory.length"
        :items-per-page="itemsPerPage"
        @page-changed="goToPage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'
import { useToast } from '@/composables/useToast'
import AppPagination from '@/components/ui/base/AppPagination.vue'

const router = useRouter()
const { addToast } = useToast()
const { fetchVaccineInventory } = useOfflineAdmin()

const emit = defineEmits(['refresh'])

const loading = ref(true)
const inventory = ref([])
const searchTerm = ref('')
const currentCategoryFilter = ref('All')
const currentStatusFilter = ref('All Status')
const currentSort = ref('Name A-Z')
const currentPage = ref(1)
const itemsPerPage = 7
const showRemovedFromView = ref(false)
const isOffline = ref(!navigator.onLine)

// Label to display for current category filter
const currentCategoryLabel = computed(() => {
  if (currentCategoryFilter.value === 'NIP') return 'NIP Vaccines'
  if (currentCategoryFilter.value === 'Others') return 'Other Vaccines'
  return 'All Vaccines'
})

// Computed: Filtered inventory based on search and filters
const filteredInventory = computed(() => {
  let filtered = [...inventory.value]
  
  // Apply search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(item => 
      (item.antigen_name?.toLowerCase().includes(search)) ||
      (item.brand_name?.toLowerCase().includes(search)) ||
      (item.batch_number?.toLowerCase().includes(search)) ||
      (item.manufacturer?.toLowerCase().includes(search))
    )
  }
  
  // Apply category filter using is_nip boolean
  if (currentCategoryFilter.value === 'NIP') {
    filtered = filtered.filter(item => item.is_nip === true)
  } else if (currentCategoryFilter.value === 'Others') {
    filtered = filtered.filter(item => item.is_nip === false)
  }

  // Removed-from-view mode
  // Criteria: Out of Stock AND on or beyond expiry date (expiry <= today)
  // - If toggle is OFF: hide removed items
  // - If toggle is ON: show ONLY removed items
  if (showRemovedFromView.value) {
    filtered = filtered.filter(item => isRemovedFromView(item))
  } else {
    filtered = filtered.filter(item => !isRemovedFromView(item))
  }
  
  // Apply status filter
  // When viewing removed-only, ignore status filter to show all removed items
  if (!showRemovedFromView.value && currentStatusFilter.value !== 'All Status') {
    filtered = filtered.filter(item => getStatus(item) === currentStatusFilter.value)
  }
  
  // Apply sorting
  switch (currentSort.value) {
    case 'Name A-Z':
      filtered.sort((a, b) => (a.antigen_name || '').localeCompare(b.antigen_name || ''))
      break
    case 'Name Z-A':
      filtered.sort((a, b) => (b.antigen_name || '').localeCompare(a.antigen_name || ''))
      break
    case 'Quantity Low-High':
      filtered.sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
      break
    case 'Quantity High-Low':
      filtered.sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      break
    case 'Expiry Date':
      filtered.sort((a, b) => {
        const dateA = a.expiration_date ? new Date(a.expiration_date).getTime() : Infinity
        const dateB = b.expiration_date ? new Date(b.expiration_date).getTime() : Infinity
        return dateA - dateB
      })
      break
  }
  
  return filtered
})

// Computed: Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredInventory.value.length / itemsPerPage)
})

// Computed: Paginated inventory for current page
const paginatedInventory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredInventory.value.slice(start, end)
})

// Online/Offline event listeners
const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine
}

// Handle edit vaccine type button click
const handleEditVaccineTypeClick = () => {
  if (isOffline.value) {
    addToast({
      title: 'Feature Unavailable Offline',
      message: 'Editing vaccine types requires an internet connection',
      type: 'warning',
      timeout: 4000
    })
  } else {
    editVaccineType()
  }
}

onMounted(() => {
  loadInventory()
  
  // Add online/offline event listeners
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

// Cleanup event listeners on unmount
onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})

// Set category filter
const setCategoryFilter = (filter) => {
  currentCategoryFilter.value = filter
  currentPage.value = 1 // Reset to first page
  closeDropdown('category')
}

// Set status filter
const setStatusFilter = (filter) => {
  currentStatusFilter.value = filter
  currentPage.value = 1 // Reset to first page
  closeDropdown('status')
}

// Set sort option
const setSort = (sortOption) => {
  currentSort.value = sortOption
  currentPage.value = 1 // Reset to first page
  closeDropdown('sort')
}

// Debug dropdown clicks
const debugDropdown = (type) => {
  console.log(`Dropdown ${type} clicked`)
  const button = document.getElementById(`${type}Filter`) || document.getElementById(`${type}Dropdown`)
  if (button) {
    console.log(`Button found:`, button)
    console.log(`Button classes:`, button.className)
    console.log(`Button data-bs-toggle:`, button.getAttribute('data-bs-toggle'))
    
    // Try to manually toggle the dropdown
    const menu = button.nextElementSibling
    if (menu && menu.classList.contains('dropdown-menu')) {
      console.log('Found dropdown menu, toggling visibility')
      menu.classList.toggle('show')
      button.setAttribute('aria-expanded', menu.classList.contains('show'))
    }
  }
}

// Close dropdown menu
const closeDropdown = (type) => {
  const button = document.getElementById(`${type}Filter`) || document.getElementById(`${type}Dropdown`)
  if (button) {
    const menu = button.nextElementSibling
    if (menu && menu.classList.contains('dropdown-menu')) {
      menu.classList.remove('show')
      button.setAttribute('aria-expanded', 'false')
    }
  }
}

// Edit vaccine type navigation
const editVaccineType = () => {
  router.push('/admin/vaccines/edit-vaccine-type')
}

// Go to specific page
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const loadInventory = async () => {
  try {
    loading.value = true
    // Use offline-first data fetching
    const response = await fetchVaccineInventory()
    const items = response.data?.data || response.data || []
    
    // Defensive: filter out any soft-deleted items if backend ever returns them
    const filteredItems = Array.isArray(items) ? items.filter(v => v && v.is_deleted !== true) : []
    
    // Map to the same format as VaccineInventory.vue
    inventory.value = filteredItems.map(v => {
      const qty = (v.current_stock_level ?? v.quantity ?? 0)
      return {
        id: v.inventory_id || v.id,
        vaccine_id: v.vaccinemaster?.vaccine_id || v.vaccine_id || v.vaccine?.vaccine_id,
        antigen_name: v.vaccinemaster?.antigen_name || v.vaccine?.antigen_name || v.antigen_name || '',
        brand_name: v.vaccinemaster?.brand_name || v.vaccine?.brand_name || v.brand_name || '',
        manufacturer: v.vaccinemaster?.manufacturer || v.vaccine?.manufacturer || v.manufacturer || '',
        category: v.vaccinemaster?.category || v.category || '',
        is_nip: v.is_nip === true || v.is_nip === 'true' || v.vaccinemaster?.is_nip === true || v.vaccinemaster?.is_nip === 'true' || v.vaccine?.is_nip === true || v.vaccine?.is_nip === 'true' || false,
        batch_number: v.lot_number || v.batch_number || '',
        lot_number: v.lot_number || v.batch_number || '',
        expiration_date: v.expiration_date || v.expiry_date || '',
        storage_location: v.storage_location || v.storageLocation || '',
        quantity: qty,
        minimum_stock: v.minimum_stock || 10
      }
    })
    
    console.debug('[VaccineStockSection] fetched', items.length, 'inventory items, mapped', inventory.value.length, 'for table')
  } catch (error) {
    console.error('Error loading inventory:', error)
    addToast({ message: 'Failed to load vaccine stock', type: 'error' })
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadInventory()
  emit('refresh')
  currentPage.value = 1 // Reset to first page on refresh
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const getQuantityBadgeClass = (quantity, minimumStock) => {
  if (quantity <= 0) return 'bg-danger'
  if (quantity <= (minimumStock || 10)) return 'bg-warning'
  return 'bg-success'
}

const getExpirationClass = (expirationDate) => {
  if (!expirationDate) return 'text-muted'
  
  const expDate = new Date(expirationDate)
  const today = new Date()
  const daysUntilExpiration = Math.floor((expDate - today) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiration < 0) return 'text-danger fw-bold'
  if (daysUntilExpiration <= 30) return 'text-warning fw-bold'
  if (daysUntilExpiration <= 90) return 'text-info'
  return 'text-success'
}

const getStatusBadgeClass = (item) => {
  const status = getStatus(item)
  if (status === 'Expired') return 'bg-danger'
  if (status === 'Expiring Soon') return 'bg-warning'
  if (status === 'Low Stock') return 'bg-warning'
  if (status === 'Out of Stock') return 'bg-danger'
  return 'bg-success'
}

const getStatus = (item) => {
  // If no expiration date, base solely on quantity/minimum
  if (!item.expiration_date) {
    if (item.quantity <= 0) return 'Out of Stock'
    if (item.quantity <= (item.minimum_stock || 10)) return 'Low Stock'
    return 'Available'
  }

  const expDate = new Date(item.expiration_date)
  const today = new Date()
  const daysUntilExpiration = Math.floor((expDate - today) / (1000 * 60 * 60 * 24))

  // Show Out of Stock first to match UI expectations
  if (item.quantity <= 0) return 'Out of Stock'
  if (daysUntilExpiration < 0) return 'Expired'
  if (daysUntilExpiration <= 30) return 'Expiring Soon'
  if (item.quantity <= (item.minimum_stock || 10)) return 'Low Stock'
  return 'Available'
}

// Helper: determine if item should be considered removed from view
// Rule: stock is Out of Stock AND on or beyond expiry date (expiry <= today)
const isRemovedFromView = (item) => {
  if (!item?.expiration_date) return false
  const expDate = new Date(item.expiration_date)
  const today = new Date()
  const daysUntilExpiration = Math.floor((expDate - today) / (1000 * 60 * 60 * 24))
  const isOutOfStock = (item.quantity || 0) <= 0
  const isOnOrBeyondExpiry = daysUntilExpiration <= 0
  return isOutOfStock && isOnOrBeyondExpiry
}

const viewDetails = (item) => {
  // Allow navigation offline; page has offline fallback logic
  if (isOffline.value) {
    addToast({
      title: 'Offline Mode',
      message: 'Showing cached inventory details',
      type: 'info',
      timeout: 3000
    })
  }
  router.push(`/admin/vaccines/view/${item.id}`)
}
</script>

<style scoped>
.table {
  margin-bottom: 0;
}

code {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  background-color: #f8f9fa;
  border-radius: 0.25rem;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.pagination-footer {
  padding: 1rem 0;
  background-color: transparent;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: center;
}
</style>
