<template>
  <HealthWorkerLayout>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Search Bar and Filters -->
    <div v-if="!loading">
      <InventoryFilters
        v-model="searchQuery"
        v-model:status-filter="statusFilter"
        :nip-filter="nipFilter"
        @toggle-nip-filter="toggleNipFilter"
      />
    </div>

    <!-- Simple Vaccine List -->
    <div v-if="!loading && paginatedVaccines.length > 0" class="vaccine-list">
      <VaccineStockCard
        v-for="vaccine in paginatedVaccines"
        :key="vaccine.id"
        :vaccine="vaccine"
        @click="viewVaccineDetail"
      />
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import { VaccineStockCard, InventoryFilters } from '@/features/health-worker/inventory'
import api from '@/services/api'

const router = useRouter()

const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')
const nipFilter = ref('all')
const vaccines = ref([])
const currentPage = ref(1)
const itemsPerPage = ref(5)
const totalItems = ref(0)

const filteredVaccines = computed(() => {
  let filtered = vaccines.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(vaccine => 
      vaccine.vaccineName.toLowerCase().includes(query) ||
      vaccine.manufacturer.toLowerCase().includes(query) ||
      vaccine.batchNo.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(vaccine => vaccine.status === statusFilter.value)
  }

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
    let response
    try {
      response = await api.get('/vaccines/inventory')
    } catch (inventoryError) {
      console.warn('Inventory endpoint failed, trying stock endpoint:', inventoryError)
      response = await api.get('/vaccines/stock')
    }
    
    const rawData = response.data?.data || response.data || []
    
    vaccines.value = rawData.map(vaccine => {
      const qty = vaccine.quantity || vaccine.current_stock_level || 0
      
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
  if (nipFilter.value === 'all') {
    nipFilter.value = 'nip'
  } else if (nipFilter.value === 'nip') {
    nipFilter.value = 'other'
  } else {
    nipFilter.value = 'all'
  }
  resetPagination()
}

const resetPagination = () => {
  currentPage.value = 1
}

watch(searchQuery, () => {
  resetPagination()
})

watch(statusFilter, () => {
  resetPagination()
})

onMounted(() => {
  fetchVaccines()
})
</script>


<style scoped>
.vaccine-list {
  gap: 0;
}
</style>