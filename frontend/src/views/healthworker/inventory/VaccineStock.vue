<template>
  <HealthWorkerLayout
    :show-controls="true"
    :controls-props="{
      icon: 'clipboard-data',
      title: 'Vaccine Stock Levels',
      searchPlaceholder: 'Search vaccines...',
      searchQuery: searchTerm,
      hasActiveFilters: hasActiveFilters,
      showFilterButton: true,
      showScanButton: false,
      showAddButton: false
    }"
    @filter="showFilterSheet = !showFilterSheet"
    @update:searchQuery="searchTerm = $event"
  >
    <!-- Filter Sheet -->
    <div v-if="showFilterSheet" class="filter-sheet-overlay" @click="showFilterSheet = false">
      <div class="filter-sheet" @click.stop>
        <div class="filter-sheet-header">
          <h3>Filters & Sort</h3>
          <button class="btn-close-sheet" @click="showFilterSheet = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div class="filter-sheet-body">
          <!-- Type Filter Section -->
          <div class="filter-section">
            <h4 class="filter-section-title">Vaccine Type</h4>
            <div class="filter-options">
              <button 
                class="filter-option-btn"
                :class="{ active: currentTypeFilter === 'All' }"
                @click="selectTypeFilter('All')"
              >
                All Types
              </button>
              <button 
                class="filter-option-btn"
                :class="{ active: currentTypeFilter === 'NIP' }"
                @click="selectTypeFilter('NIP')"
              >
                NIP Vaccines
              </button>
              <button 
                class="filter-option-btn"
                :class="{ active: currentTypeFilter === 'Others' }"
                @click="selectTypeFilter('Others')"
              >
                Other Vaccines
              </button>
            </div>
          </div>

          <!-- Status Filter Section -->
          <div class="filter-section">
            <h4 class="filter-section-title">Stock Status</h4>
            <div class="filter-options">
              <button 
                class="filter-option-btn"
                :class="{ active: currentStatusFilter === 'All' }"
                @click="selectStatusFilter('All')"
              >
                All Status
              </button>
              <button 
                class="filter-option-btn"
                :class="{ active: currentStatusFilter === 'In Stock' }"
                @click="selectStatusFilter('In Stock')"
              >
                In Stock
              </button>
              <button 
                class="filter-option-btn"
                :class="{ active: currentStatusFilter === 'Low Stock' }"
                @click="selectStatusFilter('Low Stock')"
              >
                Low Stock
              </button>
              <button 
                class="filter-option-btn"
                :class="{ active: currentStatusFilter === 'Out of Stock' }"
                @click="selectStatusFilter('Out of Stock')"
              >
                Out of Stock
              </button>
              <button 
                class="filter-option-btn"
                :class="{ active: currentStatusFilter === 'Expired' }"
                @click="selectStatusFilter('Expired')"
              >
                Expired
              </button>
            </div>
          </div>

          <!-- Sort Section -->
          <div class="filter-section">
            <h4 class="filter-section-title">Sort By</h4>
            <div class="filter-options">
              <button 
                class="filter-option-btn"
                :class="{ active: currentSort === 'Name A-Z' }"
                @click="selectSort('Name A-Z')"
              >
                <i class="bi bi-sort-alpha-down me-2"></i>Name A-Z
              </button>
              <button 
                class="filter-option-btn"
                :class="{ active: currentSort === 'Name Z-A' }"
                @click="selectSort('Name Z-A')"
              >
                <i class="bi bi-sort-alpha-up me-2"></i>Name Z-A
              </button>
              <button 
                class="filter-option-btn"
                :class="{ active: currentSort === 'Quantity Low-High' }"
                @click="selectSort('Quantity Low-High')"
              >
                <i class="bi bi-sort-numeric-down me-2"></i>Quantity Low-High
              </button>
              <button 
                class="filter-option-btn"
                :class="{ active: currentSort === 'Quantity High-Low' }"
                @click="selectSort('Quantity High-Low')"
              >
                <i class="bi bi-sort-numeric-up me-2"></i>Quantity High-Low
              </button>
              <button 
                class="filter-option-btn"
                :class="{ active: currentSort === 'Expiry Date' }"
                @click="selectSort('Expiry Date')"
              >
                <i class="bi bi-calendar-event me-2"></i>Expiry Date
              </button>
            </div>
          </div>
        </div>

        <div class="filter-sheet-footer">
          <button class="btn-clear-filters" @click="clearAllFilters">
            Clear All Filters
          </button>
          <button class="btn-apply-filters" @click="showFilterSheet = false">
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Page Content Wrapper -->
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
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import InventoryCard from '@/features/health-worker/inventory/InventoryCard.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import { useVaccineInventory } from '@/features/health-worker/inventory/composables'

const router = useRouter()

// Use vaccine inventory composable
const {
  loading,
  inventory,
  searchTerm,
  currentTypeFilter,
  currentStatusFilter,
  currentSort,
  showFilterSheet,
  currentPage,
  itemsPerPage,
  hasActiveFilters,
  filteredInventory,
  totalPages,
  paginatedInventory,
  getStatus,
  selectTypeFilter,
  selectStatusFilter,
  selectSort,
  clearAllFilters,
  changePage,
  fetchInventory
} = useVaccineInventory()

// Navigation
const viewInventoryDetails = (item) => {
  router.push({
    name: 'HealthWorkerStockDetails',
    params: { id: item.inventory_id || item.id }
  })
}

onMounted(() => {
  fetchInventory()
})
</script>

<style scoped>
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

/* Filter Sheet Overlay */
.filter-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.filter-sheet {
  background: white;
  border-radius: 1rem 1rem 0 0;
  max-height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.filter-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.filter-sheet-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.btn-close-sheet {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 0.375rem;
}

.btn-close-sheet:hover {
  background: #f3f4f6;
}

.filter-sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-option-btn {
  width: 100%;
  padding: 0.875rem 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #374151;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.filter-option-btn:hover {
  border-color: #667eea;
  background: #f5f7ff;
}

.filter-option-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  font-weight: 600;
}

.filter-sheet-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
}

.btn-clear-filters {
  flex: 1;
  padding: 0.875rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
}

.btn-apply-filters {
  flex: 2;
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
}

/* Active Filters Container */
.active-filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 1rem;
  font-size: 0.8125rem;
  color: #374151;
}

.chip-remove {
  background: none;
  border: none;
  padding: 0;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.chip-remove:hover {
  color: #ef4444;
}

.clear-all-btn {
  padding: 0.375rem 0.875rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #dc2626;
  cursor: pointer;
}

.clear-all-btn:hover {
  background: #fecaca;
}
</style>
