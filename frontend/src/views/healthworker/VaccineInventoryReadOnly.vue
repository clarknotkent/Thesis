<template>
  <HealthWorkerLayout>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Search Bar and Filters -->
    <div v-if="!loading" class="search-container mb-4">
      <div class="input-group mb-3">
        <span class="input-group-text">
          <i class="bi bi-search"></i>
        </span>
        <input 
          type="text" 
          class="form-control" 
          placeholder="Search vaccines..."
          v-model="searchQuery"
          @input="debouncedSearch"
        >
        <select class="form-select search-filter" v-model="statusFilter" @change="resetPagination">
          <option value="">All Status</option>
          <option value="Available">Available</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
        </select>
      </div>
      
      <!-- NIP Filter Toggle Button -->
      <div class="d-flex justify-content-center">
        <button 
          class="btn filter-toggle-btn"
          :class="{
            'btn-primary': nipFilter === 'nip',
            'btn-info': nipFilter === 'other', 
            'btn-outline-secondary': nipFilter === 'all'
          }"
          @click="toggleNipFilter"
        >
          <i :class="getNipFilterIcon()" class="me-2"></i>
          {{ getNipFilterText() }}
          <i class="bi bi-arrow-repeat ms-2"></i>
        </button>
      </div>
    </div>

    <!-- Simple Vaccine List -->
    <div v-if="!loading && paginatedVaccines.length > 0" class="vaccine-list">
      <div 
        v-for="vaccine in paginatedVaccines" 
        :key="vaccine.id" 
        class="vaccine-item clickable"
        @click="viewVaccineDetail(vaccine.id)"
      >
        <div class="d-flex justify-content-between align-items-start">
          <div class="vaccine-info">
            <h6 class="vaccine-name mb-1">{{ vaccine.vaccineName }}</h6>
            <p class="vaccine-details mb-0">
              {{ vaccine.manufacturer }} • {{ vaccine.quantity }} doses
            </p>
          </div>
          <div class="d-flex align-items-center">
            <span class="badge me-2" :class="getStatusBadgeClass(vaccine.status)">
              {{ vaccine.status }}
            </span>
            <i class="bi bi-chevron-right text-muted" style="font-size: 0.9rem;"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && totalPages > 1" class="d-flex justify-content-center mt-4">
      <AppPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :items-per-page="itemsPerPage"
        @page-changed="changePage"
      />
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredVaccines.length === 0" class="text-center py-5">
      <i class="bi bi-box text-muted mb-3" style="font-size: 3rem;"></i>
      <h6 class="text-muted">No vaccines found</h6>
      <p class="text-muted small">Try adjusting your search criteria.</p>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import api from '@/services/api'

const router = useRouter()

const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')
const nipFilter = ref('all') // 'all', 'nip', 'other'
const vaccines = ref([])
const currentPage = ref(1)
const itemsPerPage = ref(5)
const totalItems = ref(0)

const filteredVaccines = computed(() => {
  let filtered = vaccines.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(vaccine => 
      vaccine.vaccineName.toLowerCase().includes(query) ||
      vaccine.manufacturer.toLowerCase().includes(query) ||
      vaccine.batchNo.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(vaccine => vaccine.status === statusFilter.value)
  }

  // Filter by NIP status
  if (nipFilter.value === 'nip') {
    filtered = filtered.filter(vaccine => vaccine.isNip === true)
  } else if (nipFilter.value === 'other') {
    filtered = filtered.filter(vaccine => vaccine.isNip === false)
  }

  totalItems.value = filtered.length
  return filtered
})

const paginatedVaccines = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return filteredVaccines.value.slice(startIndex, endIndex)
})

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage.value)
})

const fetchVaccines = async () => {
  try {
    loading.value = true
    // Try the inventory endpoint first (matches admin structure)
    let response
    try {
      response = await api.get('/vaccines/inventory')
    } catch (inventoryError) {
      console.warn('Inventory endpoint failed, trying stock endpoint:', inventoryError)
      response = await api.get('/vaccines/stock')
    }
    
    const rawData = response.data?.data || response.data || []
    
    // Normalize the data structure to ensure consistent IDs and status calculation
    vaccines.value = rawData.map(vaccine => {
      const qty = vaccine.quantity || vaccine.current_stock_level || 0
      
      // Calculate status based on expiry and quantity (similar to admin logic)
      const exp = vaccine.expiration_date || vaccine.expiry_date || vaccine.expiryDate || null
      const now = new Date()
      let status = vaccine.status || null
      
      if (exp) {
        const d = new Date(exp)
        if (!isNaN(d)) {
          const in30 = new Date(now.getTime() + 30*24*60*60*1000)
          if (d < now) status = 'Expired'
          else if (d >= now && d <= in30) status = 'Expiring Soon'
        }
      }
      
      if (!status) {
        status = qty > 0 ? (qty < 10 ? 'Low Stock' : 'Available') : 'Out of Stock'
      }
      
      return {
        id: vaccine.inventory_id || vaccine.id,
        vaccine_id: vaccine.vaccine_id || vaccine.vaccine?.vaccine_id,
        vaccineName: vaccine.vaccineName || vaccine.vaccinemaster?.antigen_name || vaccine.vaccine?.antigen_name || vaccine.antigen_name || 'Unknown Vaccine',
        brandName: vaccine.brandName || vaccine.vaccinemaster?.brand_name || vaccine.vaccine?.brand_name || vaccine.brand_name || '',
        manufacturer: vaccine.manufacturer || vaccine.vaccinemaster?.manufacturer || vaccine.vaccine?.manufacturer || 'Not specified',
        batchNo: vaccine.batchNo || vaccine.lot_number || vaccine.batch_number || '',
        quantity: qty,
        status: status,
        expiryDate: vaccine.expiration_date || vaccine.expiry_date || vaccine.expiryDate || '',
        storageLocation: vaccine.storage_location || vaccine.storageLocation || '',
        isNip: vaccine.is_nip || vaccine.vaccinemaster?.is_nip || vaccine.vaccine?.is_nip || false
      }
    })
    
    // Reset to first page when data changes
    currentPage.value = 1
  } catch (error) {
    console.error('Error fetching vaccines:', error)
    vaccines.value = []
  } finally {
    loading.value = false
  }
}

const viewVaccineDetail = (vaccineId) => {
  router.push(`/healthworker/inventory/${vaccineId}`)
}

const changePage = (page) => {
  currentPage.value = page
}

const toggleNipFilter = () => {
  // Cycle through: all -> nip -> other -> all
  if (nipFilter.value === 'all') {
    nipFilter.value = 'nip'
  } else if (nipFilter.value === 'nip') {
    nipFilter.value = 'other'
  } else {
    nipFilter.value = 'all'
  }
  resetPagination()
}

const getNipFilterText = () => {
  switch (nipFilter.value) {
    case 'nip': return 'NIP Only'
    case 'other': return 'Other Vaccines'
    default: return 'All Vaccines'
  }
}

const getNipFilterIcon = () => {
  switch (nipFilter.value) {
    case 'nip': return 'bi-shield-check'
    case 'other': return 'bi-capsule'
    default: return 'bi-collection'
  }
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Available': return 'bg-success'
    case 'Low Stock': return 'bg-warning text-dark'
    case 'Out of Stock': return 'bg-danger'
    case 'Expiring Soon': return 'bg-danger'
    case 'Expired': return 'bg-dark'
    default: return 'bg-secondary'
  }
}

// Watch for search changes to reset pagination
const resetPagination = () => {
  currentPage.value = 1
}

// Reset pagination when search query or status filter changes
const debouncedSearch = () => {
  resetPagination()
}

onMounted(() => {
  fetchVaccines()
})
</script>

<style scoped>
.search-container {
  padding: 0.5rem 0;
}

.search-filter {
  max-width: 140px;
  border-left: 0;
}

.vaccine-list {
  gap: 0;
}

.vaccine-item {
  background: white;
  border: 1px solid #e9ecef;
  border-bottom: 0;
  padding: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.vaccine-item.clickable:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.vaccine-item.clickable:active {
  background-color: #e9ecef;
  transform: translateY(0);
}

.vaccine-item:first-child {
  border-radius: 0.5rem 0.5rem 0 0;
}

.vaccine-item:last-child {
  border-bottom: 1px solid #e9ecef;
  border-radius: 0 0 0.5rem 0.5rem;
}

.vaccine-item:only-child {
  border-radius: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.vaccine-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.vaccine-details {
  color: #6c757d;
  font-size: 0.875rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.filter-toggle-btn {
  border-radius: 1.5rem;
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.filter-toggle-btn:active {
  transform: translateY(0);
}

.filter-toggle-btn i:last-child {
  opacity: 0.7;
  font-size: 0.85rem;
}

/* Mobile touch improvements */
@media (max-width: 576px) {
  .search-filter {
    max-width: 120px;
  }
  
  .vaccine-item {
    padding: 0.875rem;
    -webkit-tap-highlight-color: rgba(0, 123, 255, 0.1);
  }
  
  .vaccine-item.clickable:active {
    background-color: rgba(0, 123, 255, 0.1);
  }
  
  .vaccine-name {
    font-size: 0.95rem;
  }
  
  .vaccine-details {
    font-size: 0.8rem;
  }
  
  .filter-toggle-btn {
    padding: 0.4rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
