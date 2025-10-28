<template>
  <HealthWorkerLayout>
    <!-- Combined Fixed Header -->
    <template #header>
      <!-- Blue TopBar -->
      <div class="top-bar">
        <div class="brand">
          <i class="bi bi-shield-check"></i>
          <span>HealthStaff</span>
        </div>
      </div>

      <!-- Controls Card -->
      <div class="controls-card">
        <div class="controls-header">
          <div class="title-section">
            <i class="bi bi-clipboard-data title-icon"></i>
            <h1 class="title">Vaccine Stock Levels</h1>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar">
          <i class="bi bi-search search-icon"></i>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search vaccines..."
            v-model="searchTerm"
          >
          <button v-if="searchTerm" class="clear-btn" @click="searchTerm = ''">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>

        <!-- Filters Row -->
        <div class="filters-row">
          <!-- Type Filter -->
          <button class="filter-btn" @click="showTypeFilter = !showTypeFilter">
            <i class="bi bi-funnel"></i>
            <span>Filter: {{ typeFilterLabel }}</span>
            <i class="bi bi-chevron-down"></i>
          </button>

          <!-- Status Filter -->
          <button class="filter-btn" @click="showStatusFilter = !showStatusFilter">
            <i class="bi bi-tag"></i>
            <span>Status: {{ statusFilterLabel }}</span>
            <i class="bi bi-chevron-down"></i>
          </button>

          <!-- Sort -->
          <button class="filter-btn" @click="showSortMenu = !showSortMenu">
            <i class="bi bi-sort-down"></i>
            <span>Sort: {{ currentSort }}</span>
            <i class="bi bi-chevron-down"></i>
          </button>
        </div>

        <!-- Active Filters Chips -->
        <div v-if="hasActiveFilters" class="active-filters">
          <span v-if="currentTypeFilter !== 'All'" class="filter-chip">
            {{ currentTypeFilter }}
            <button @click="currentTypeFilter = 'All'" class="chip-remove">
              <i class="bi bi-x"></i>
            </button>
          </span>
          <span v-if="currentStatusFilter !== 'All'" class="filter-chip">
            {{ currentStatusFilter }}
            <button @click="currentStatusFilter = 'All'" class="chip-remove">
              <i class="bi bi-x"></i>
            </button>
          </span>
          <button class="clear-all-btn" @click="clearAllFilters">
            Clear All
          </button>
        </div>
      </div>

      <!-- Type Filter Dropdown -->
      <div v-if="showTypeFilter" class="filter-dropdown" @click="showTypeFilter = false">
        <div class="dropdown-content" @click.stop>
          <button 
            class="dropdown-item" 
            :class="{ active: currentTypeFilter === 'All' }"
            @click="selectTypeFilter('All')"
          >
            All Types
          </button>
          <button 
            class="dropdown-item" 
            :class="{ active: currentTypeFilter === 'NIP' }"
            @click="selectTypeFilter('NIP')"
          >
            NIP Vaccines
          </button>
          <button 
            class="dropdown-item" 
            :class="{ active: currentTypeFilter === 'Others' }"
            @click="selectTypeFilter('Others')"
          >
            Other Vaccines
          </button>
        </div>
      </div>

      <!-- Status Filter Dropdown -->
      <div v-if="showStatusFilter" class="filter-dropdown" @click="showStatusFilter = false">
        <div class="dropdown-content" @click.stop>
          <button 
            class="dropdown-item" 
            :class="{ active: currentStatusFilter === 'All' }"
            @click="selectStatusFilter('All')"
          >
            All Status
          </button>
          <button 
            class="dropdown-item" 
            :class="{ active: currentStatusFilter === 'In Stock' }"
            @click="selectStatusFilter('In Stock')"
          >
            In Stock
          </button>
          <button 
            class="dropdown-item" 
            :class="{ active: currentStatusFilter === 'Low Stock' }"
            @click="selectStatusFilter('Low Stock')"
          >
            Low Stock
          </button>
          <button 
            class="dropdown-item" 
            :class="{ active: currentStatusFilter === 'Out of Stock' }"
            @click="selectStatusFilter('Out of Stock')"
          >
            Out of Stock
          </button>
          <button 
            class="dropdown-item" 
            :class="{ active: currentStatusFilter === 'Expired' }"
            @click="selectStatusFilter('Expired')"
          >
            Expired
          </button>
        </div>
      </div>

      <!-- Sort Menu Dropdown -->
      <div v-if="showSortMenu" class="filter-dropdown" @click="showSortMenu = false">
        <div class="dropdown-content" @click.stop>
          <button 
            class="dropdown-item" 
            :class="{ active: currentSort === 'Name A-Z' }"
            @click="selectSort('Name A-Z')"
          >
            Name A-Z
          </button>
          <button 
            class="dropdown-item" 
            :class="{ active: currentSort === 'Name Z-A' }"
            @click="selectSort('Name Z-A')"
          >
            Name Z-A
          </button>
          <button 
            class="dropdown-item" 
            :class="{ active: currentSort === 'Quantity Low-High' }"
            @click="selectSort('Quantity Low-High')"
          >
            Quantity Low-High
          </button>
          <button 
            class="dropdown-item" 
            :class="{ active: currentSort === 'Quantity High-Low' }"
            @click="selectSort('Quantity High-Low')"
          >
            Quantity High-Low
          </button>
          <button 
            class="dropdown-item" 
            :class="{ active: currentSort === 'Expiry Date' }"
            @click="selectSort('Expiry Date')"
          >
            Expiry Date
          </button>
        </div>
      </div>
    </template>

    <!-- Scrollable Content Area -->
    <div class="page-content-wrapper">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p class="loading-text">Loading vaccine stock...</p>
      </div>

      <!-- Inventory List -->
      <div v-else-if="paginatedInventory.length > 0" class="inventory-list">
        <InventoryCard
          v-for="item in paginatedInventory" 
          :key="item.inventory_id || item.id"
          :inventory="item"
          @click="viewInventoryDetails(item)"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="bi bi-inbox empty-icon"></i>
        <h4 class="empty-title">No vaccine stock found</h4>
        <p class="empty-text">Try adjusting your search or filter criteria.</p>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && totalPages > 1" class="pagination-container">
        <AppPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="filteredInventory.length"
          :items-per-page="itemsPerPage"
          @page-changed="changePage"
        />
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import InventoryCard from '@/features/health-worker/inventory/InventoryCard.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import api from '@/services/api'

const router = useRouter()

// State
const loading = ref(true)
const inventory = ref([])
const searchTerm = ref('')
const currentTypeFilter = ref('All')
const currentStatusFilter = ref('All')
const currentSort = ref('Name A-Z')
const showTypeFilter = ref(false)
const showStatusFilter = ref(false)
const showSortMenu = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(7)

// Computed
const typeFilterLabel = computed(() => currentTypeFilter.value)
const statusFilterLabel = computed(() => currentStatusFilter.value)

const hasActiveFilters = computed(() => {
  return currentTypeFilter.value !== 'All' || currentStatusFilter.value !== 'All'
})

const filteredInventory = computed(() => {
  let filtered = [...inventory.value]

  // Search filter
  if (searchTerm.value) {
    const query = searchTerm.value.toLowerCase()
    filtered = filtered.filter(item => {
      const vaccineName = item.vaccinemaster?.antigen_name || item.vaccine_name || ''
      const brandName = item.vaccinemaster?.brand_name || item.brand_name || ''
      const manufacturer = item.vaccinemaster?.manufacturer || item.manufacturer || ''
      return vaccineName.toLowerCase().includes(query) ||
             brandName.toLowerCase().includes(query) ||
             manufacturer.toLowerCase().includes(query)
    })
  }

  // Type filter
  if (currentTypeFilter.value !== 'All') {
    if (currentTypeFilter.value === 'NIP') {
      filtered = filtered.filter(item => item.is_nip || item.vaccinemaster?.is_nip)
    } else if (currentTypeFilter.value === 'Others') {
      filtered = filtered.filter(item => !(item.is_nip || item.vaccinemaster?.is_nip))
    }
  }

  // Status filter
  if (currentStatusFilter.value !== 'All') {
    filtered = filtered.filter(item => {
      const status = getStatus(item)
      return status === currentStatusFilter.value
    })
  }

  // Sort
  filtered.sort((a, b) => {
    switch (currentSort.value) {
      case 'Name A-Z':
        return (a.vaccinemaster?.antigen_name || '').localeCompare(b.vaccinemaster?.antigen_name || '')
      case 'Name Z-A':
        return (b.vaccinemaster?.antigen_name || '').localeCompare(a.vaccinemaster?.antigen_name || '')
      case 'Quantity Low-High':
        return (a.current_stock_level || 0) - (b.current_stock_level || 0)
      case 'Quantity High-Low':
        return (b.current_stock_level || 0) - (a.current_stock_level || 0)
      case 'Expiry Date':
        return new Date(a.expiration_date || '9999-12-31') - new Date(b.expiration_date || '9999-12-31')
      default:
        return 0
    }
  })

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredInventory.value.length / itemsPerPage.value))

const paginatedInventory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredInventory.value.slice(start, end)
})

// Methods
const getStatus = (item) => {
  const quantity = item.current_stock_level || 0
  const expiry = new Date(item.expiration_date)
  const today = new Date()
  const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return 'Expired'
  if (quantity === 0) return 'Out of Stock'
  if (quantity < 10) return 'Low Stock'
  return 'In Stock'
}

const selectTypeFilter = (type) => {
  currentTypeFilter.value = type
  showTypeFilter.value = false
  currentPage.value = 1
}

const selectStatusFilter = (status) => {
  currentStatusFilter.value = status
  showStatusFilter.value = false
  currentPage.value = 1
}

const selectSort = (sort) => {
  currentSort.value = sort
  showSortMenu.value = false
  currentPage.value = 1
}

const clearAllFilters = () => {
  currentTypeFilter.value = 'All'
  currentStatusFilter.value = 'All'
  currentPage.value = 1
}

const changePage = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const viewInventoryDetails = (item) => {
  router.push({
    name: 'HealthWorkerStockDetails',
    params: { id: item.inventory_id || item.id }
  })
}

const fetchInventory = async () => {
  try {
    loading.value = true
    const response = await api.get('/vaccines/inventory')
    const data = response.data?.data || response.data || []
    inventory.value = Array.isArray(data) ? data : []
    console.log('📦 [VaccineStock] Loaded inventory:', inventory.value.length, 'items')
  } catch (error) {
    console.error('❌ [VaccineStock] Error fetching inventory:', error)
    inventory.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInventory()
})
</script>

<style scoped>
/* Top Bar */
.top-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.brand i {
  font-size: 1.5rem;
}

/* Controls Card */
.controls-card {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 90;
}

.controls-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.title-icon {
  font-size: 1.5rem;
  color: #667eea;
}

.title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

/* Search Bar */
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  background: #f3f4f6;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}

.search-icon {
  color: #6b7280;
  font-size: 1.125rem;
  margin-right: 0.625rem;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9375rem;
  color: #111827;
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 1.125rem;
}

/* Filters Row */
.filters-row {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.filters-row::-webkit-scrollbar {
  display: none;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.filter-btn i {
  font-size: 0.875rem;
}

/* Active Filters */
.active-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
}

.chip-remove {
  background: none;
  border: none;
  color: #1e40af;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.clear-all-btn {
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
}

/* Filter Dropdown */
.filter-dropdown {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.dropdown-content {
  background: white;
  width: 100%;
  border-radius: 1rem 1rem 0 0;
  padding: 1.5rem 0;
  max-height: 60vh;
  overflow-y: auto;
}

.dropdown-item {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: none;
  border: none;
  text-align: left;
  font-size: 0.9375rem;
  color: #374151;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.dropdown-item.active {
  background: #dbeafe;
  color: #1e40af;
  font-weight: 600;
}

/* Page Content */
.page-content-wrapper {
  padding: 1rem;
  padding-bottom: 120px; /* Bottom navbar + pagination */
  min-height: calc(100vh - 200px);
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #6b7280;
  font-size: 0.9375rem;
}

/* Inventory List */
.inventory-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-text {
  color: #6b7280;
  font-size: 0.9375rem;
  margin: 0;
}

/* Pagination */
.pagination-container {
  margin-top: 1.5rem;
  padding-bottom: 1rem;
}
</style>
