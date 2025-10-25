<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">Admin</router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/admin/vaccines">Vaccine Inventory</router-link>
          </li>
          <li class="breadcrumb-item active">View Details</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-eye me-2"></i>Inventory Details
          </h1>
          <p class="text-muted mb-0">View vaccine stock information</p>
        </div>
        <div class="d-flex gap-2">
          <button @click="goBack" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>Back
          </button>
          <router-link to="/admin/vaccines" class="btn btn-outline-primary">
            <i class="bi bi-house me-2"></i>Home
          </router-link>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Details and History -->
      <div v-else-if="inventoryData">
        <!-- Inventory Details Card -->
        <div class="card shadow mb-4">
          <div class="card-header bg-white py-3">
            <h6 class="m-0 fw-bold text-primary">
              <i class="bi bi-info-circle me-2"></i>Vaccine Information
            </h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <!-- Left Column -->
              <div class="col-md-6">
                <label class="form-label text-muted small fw-semibold">VACCINE</label>
                <input type="text" class="form-control bg-light" :value="inventoryData.vaccineName" readonly>
              </div>
              
              <div class="col-md-6">
                <label class="form-label text-muted small fw-semibold">STATUS</label>
                <div>
                  <span class="badge" :class="getStatusBadgeClass(inventoryData.status)">
                    {{ inventoryData.status }}
                  </span>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label text-muted small fw-semibold">MANUFACTURER</label>
                <input type="text" class="form-control bg-light" :value="inventoryData.manufacturer || '—'" readonly>
              </div>

              <div class="col-md-6">
                <label class="form-label text-muted small fw-semibold">BRAND</label>
                <input type="text" class="form-control bg-light" :value="inventoryData.brandName || '—'" readonly>
              </div>

              <div class="col-md-6">
                <label class="form-label text-muted small fw-semibold">LOT NUMBER</label>
                <input type="text" class="form-control bg-light" :value="inventoryData.batchNo || inventoryData.lotNumber || '—'" readonly>
              </div>

              <div class="col-md-6">
                <label class="form-label text-muted small fw-semibold">QUANTITY</label>
                <input type="text" class="form-control bg-light fw-bold" :value="`${inventoryData.quantity} doses`" readonly>
              </div>

              <div class="col-md-6">
                <label class="form-label text-muted small fw-semibold">EXPIRATION DATE</label>
                <input type="text" class="form-control bg-light" :value="formatDate(inventoryData.expiryDate)" readonly>
              </div>

              <div class="col-md-6">
                <label class="form-label text-muted small fw-semibold">STORAGE LOCATION</label>
                <input type="text" class="form-control bg-light" :value="inventoryData.storageLocation || '—'" readonly>
              </div>
            </div>
          </div>
          <div class="card-footer bg-white d-flex justify-content-end gap-2">
            <button @click="editInventory" class="btn btn-primary">
              <i class="bi bi-pencil me-2"></i>Edit
            </button>
          </div>
        </div>

        <!-- History Table Card -->
        <div class="card shadow">
          <div class="card-header bg-white py-3">
            <h6 class="m-0 fw-bold text-primary">
              <i class="bi bi-clock-history me-2"></i>Transaction History
            </h6>
          </div>
          <div class="card-body">
            <!-- Search and Sort Controls -->
            <div v-if="history && history.length > 0" class="d-flex justify-content-between align-items-center mb-3 gap-3">
              <div class="d-flex gap-2 align-items-center flex-grow-1">
                <!-- Search Bar -->
                <div class="input-group" style="max-width: 300px;">
                  <input 
                    type="text" 
                    class="form-control form-control-sm" 
                    v-model="searchQuery"
                    placeholder="Search transactions..."
                  >
                  <button class="btn btn-sm btn-outline-primary" type="button">
                    <i class="bi bi-search"></i>
                  </button>
                </div>
                
                <!-- Type Filter -->
                <div class="dropdown">
                  <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="typeFilter" data-bs-toggle="dropdown" aria-expanded="false">
                    Filter: {{ filterType || 'All Types' }}
                  </button>
                  <ul class="dropdown-menu" aria-labelledby="typeFilter">
                    <li><a class="dropdown-item" href="#" @click.prevent="filterType = ''">All Types</a></li>
                    <li><a class="dropdown-item" href="#" @click.prevent="filterType = 'ADJUST'">ADJUST</a></li>
                    <li><a class="dropdown-item" href="#" @click.prevent="filterType = 'RETURN'">RETURN</a></li>
                    <li><a class="dropdown-item" href="#" @click.prevent="filterType = 'EXPIRED'">EXPIRED</a></li>
                    <li><a class="dropdown-item" href="#" @click.prevent="filterType = 'RECEIVE'">RECEIVE</a></li>
                    <li><a class="dropdown-item" href="#" @click.prevent="filterType = 'ISSUE'">ISSUE</a></li>
                  </ul>
                </div>
                
                <!-- Sort Dropdown -->
                <div class="dropdown">
                  <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    Sort: {{ sortOrder === 'newest' ? 'Newest First' : 'Oldest First' }}
                  </button>
                  <ul class="dropdown-menu" aria-labelledby="sortDropdown">
                    <li><a class="dropdown-item" href="#" @click.prevent="sortOrder = 'newest'">Newest First</a></li>
                    <li><a class="dropdown-item" href="#" @click.prevent="sortOrder = 'oldest'">Oldest First</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="historyLoading" class="text-center py-4">
              <div class="spinner-border text-primary spinner-border-sm" role="status">
                <span class="visually-hidden">Loading history...</span>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="!history || history.length === 0" class="text-center py-4 text-muted">
              <i class="bi bi-inbox" style="font-size: 2rem;"></i>
              <p class="mb-0 mt-2">No transaction history available</p>
            </div>

            <!-- No Results State -->
            <div v-else-if="paginatedHistory.length === 0" class="text-center py-4 text-muted">
              <i class="bi bi-search" style="font-size: 2rem;"></i>
              <p class="mb-0 mt-2">No transactions match your search</p>
            </div>

            <!-- History Table -->
            <div v-else class="table-responsive">
              <table class="table table-hover table-bordered mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="text-center">Date</th>
                    <th class="text-center">Time</th>
                    <th class="text-center">Transaction Type</th>
                    <th class="text-center">Quantity Change</th>
                    <th class="text-center">Before</th>
                    <th class="text-center">After</th>
                    <th class="text-center">Performed By</th>
                    <th class="text-center">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="record in paginatedHistory" :key="record.id">
                    <td class="text-center align-middle">
                      {{ formatDateOnly(record.timestamp) }}
                    </td>
                    <td class="text-center align-middle">
                      {{ formatTimeOnly(record.timestamp) }}
                    </td>
                    <td class="text-center align-middle">
                      <span class="badge" :class="getTransactionTypeClass(record.type)">
                        {{ record.type }}
                      </span>
                    </td>
                    <td class="text-center align-middle">
                      <span :class="getQuantityChangeClass(record.quantityChange)">
                        {{ formatQuantityChange(record.quantityChange) }}
                      </span>
                    </td>
                    <td class="text-center align-middle fw-semibold">
                      {{ displayNumber(record.quantityBefore) }}
                    </td>
                    <td class="text-center align-middle fw-semibold">
                      {{ displayNumber(record.quantityAfter) }}
                    </td>
                    <td class="text-center align-middle">
                      {{ record.userName || 'System' }}
                    </td>
                    <td class="text-center align-middle">
                      <small class="text-muted">{{ record.note || '—' }}</small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            <div v-if="filteredHistory.length > 0" class="pagination-footer border-top mt-3 pt-3">
              <AppPagination
                :currentPage="currentPage"
                :totalPages="totalPages"
                :totalItems="filteredHistory.length"
                :itemsPerPage="itemsPerPage"
                @page-changed="(page) => currentPage = page"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="alert alert-danger">
        <i class="bi bi-exclamation-circle me-2"></i>
        Failed to load inventory data. <router-link to="/admin/vaccines">Go back to inventory</router-link>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { formatPHDate } from '@/utils/dateUtils'

const route = useRoute()
const router = useRouter()
const { addToast } = useToast()

const inventoryData = ref(null)
const loading = ref(true)
const history = ref([])
const historyLoading = ref(false)

// Pagination and filtering
const searchQuery = ref('')
const filterType = ref('')
const sortOrder = ref('newest')
const currentPage = ref(1)
const itemsPerPage = 5

const goBack = () => {
  router.back()
}

const editInventory = () => {
  router.push(`/admin/vaccines/edit-stock/${route.params.id}`)
}

// Computed: Filtered history based on search
const filteredHistory = computed(() => {
  let filtered = [...history.value]
  
  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => {
      return (
        item.type?.toLowerCase().includes(query) ||
        item.userName?.toLowerCase().includes(query) ||
        item.note?.toLowerCase().includes(query)
      )
    })
  }
  
  // Apply type filter
  if (filterType.value) {
    filtered = filtered.filter(item => item.type === filterType.value)
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    const dateA = new Date(a.timestamp)
    const dateB = new Date(b.timestamp)
    return sortOrder.value === 'newest' ? dateB - dateA : dateA - dateB
  })
  
  return filtered
})

// Computed: Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredHistory.value.length / itemsPerPage)
})

// Computed: Paginated history for current page
const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredHistory.value.slice(start, end)
})

// Watch for search/sort changes and reset to page 1
watch([searchQuery, filterType, sortOrder], () => {
  currentPage.value = 1
})

onMounted(async () => {
  await fetchInventoryData()
  await fetchHistory()
})

const fetchInventoryData = async () => {
  try {
    const id = route.params.id
    const response = await api.get(`/vaccines/inventory/${id}`)
    console.log('Raw response:', response)
    console.log('Response data:', response.data)
    
    const data = response.data.data || response.data
    console.log('Processed data:', data)
    
    // Map backend field names to expected frontend field names
    // Backend returns: inventory_id, vaccine_id, lot_number, expiration_date, current_stock_level, storage_location
    // And nested vaccinemaster: { antigen_name, brand_name, manufacturer, vaccine_type, category }
    const vaccine = data.vaccinemaster || {}
    
    inventoryData.value = {
      id: data.inventory_id || data.id,
      vaccineName: vaccine.antigen_name || data.vaccine_name || data.vaccineName,
      brandName: vaccine.brand_name || data.brand_name || data.brandName,
      manufacturer: vaccine.manufacturer || data.manufacturer,
      lotNumber: data.lot_number || data.lotNumber || data.batch_no,
      batchNo: data.lot_number || data.batch_no || data.batchNo,
      quantity: data.current_stock_level || data.quantity || data.stock_level || 0,
      expiryDate: data.expiration_date || data.expiry_date || data.expiryDate,
      storageLocation: data.storage_location || data.storageLocation,
      status: data.status || (data.current_stock_level > 0 ? 'Available' : 'Out of Stock')
    }
    
    console.log('Mapped inventoryData:', inventoryData.value)
  } catch (error) {
    console.error('Error fetching inventory data:', error)
    addToast('Error loading inventory data', 'error')
  } finally {
    loading.value = false
  }
}

const fetchHistory = async () => {
  try {
    historyLoading.value = true
    const id = route.params.id
    const response = await api.get(`/vaccines/transactions`, {
      params: { inventory_id: id, limit: 100 }
    })
    
    console.log('History response:', response.data)
    
    // Handle different response structures (copied from InventoryHistory.vue)
    let transactions = []
    if (response.data.data && Array.isArray(response.data.data)) {
      transactions = response.data.data
    } else if (response.data.transactions && Array.isArray(response.data.transactions)) {
      transactions = response.data.transactions
    } else if (Array.isArray(response.data)) {
      transactions = response.data
    } else if (response.data.data && response.data.data.transactions) {
      transactions = response.data.data.transactions || []
    }
    
    // Map transactions with proper field handling (copied from InventoryHistory.vue)
    history.value = transactions.map(item => {
      const type = (item.transaction_type || item.type || '').toUpperCase()
      const rawQty = Number(
        item.quantity_delta ?? item.quantity ?? item.quantity_change ?? item.quantityChange ?? 0
      )
      // Determine sign based on type; RETURN/EXPIRED/ISSUE/OUTBOUND and similar are negative
      const negativeTypes = ['RETURN', 'EXPIRED', 'ISSUE', 'OUTBOUND', 'USE', 'DISPENSE', 'STOCK_OUT']
      const signedQty = negativeTypes.includes(type) ? -Math.abs(rawQty) : Math.abs(rawQty)
      const after = Number(
        item.balance_after ?? item.quantity_after ?? item.quantityAfter ?? NaN
      )
      const before = Number.isFinite(after) && Number.isFinite(signedQty)
        ? after - signedQty
        : null

      return {
        id: item.transaction_id || item.id,
        timestamp: item.created_at || item.date || item.timestamp,
        type: type || 'UNKNOWN',
        quantityChange: signedQty,
        quantityBefore: Number.isFinite(before) ? before : null,
        quantityAfter: Number.isFinite(after) ? after : null,
        userName: item.performed_by || item.user_name || item.userName || 'SYSTEM',
        note: item.remarks || item.note || item.notes || item.description || null
      }
    })
    
    console.log('Mapped history:', history.value)
  } catch (error) {
    console.error('Error fetching history:', error)
    history.value = []
  } finally {
    historyLoading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '—'
  return formatPHDate(date, 'MMM DD, YYYY')
}

const formatDateOnly = (date) => {
  if (!date) return '—'
  return formatPHDate(date, 'MMM DD, YYYY')
}

const formatTimeOnly = (date) => {
  if (!date) return '—'
  return formatPHDate(date, 'hh:mm A')
}

const formatQuantityChange = (change) => {
  if (!change) return '0'
  const num = Number(change)
  return num > 0 ? `+${num}` : String(num)
}

const displayNumber = (v) => {
  return v === 0 ? '0' : (v ?? '—')
}

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'available':
    case 'in stock':
      return 'bg-success'
    case 'low stock':
      return 'bg-warning text-dark'
    case 'expired':
      return 'bg-danger'
    case 'expiring soon':
      return 'bg-warning'
    case 'out of stock':
      return 'bg-secondary'
    default:
      return 'bg-info'
  }
}

const getTransactionTypeClass = (type) => {
  switch (type?.toUpperCase()) {
    case 'ADD':
    case 'RECEIVE':
    case 'RECEIVED':
    case 'STOCK_IN':
      return 'bg-success'
    case 'ADJUST':
    case 'ADJUSTMENT':
      return 'bg-primary'
    case 'USE':
    case 'DISPENSE':
    case 'DISPENSED':
    case 'ISSUED':
    case 'STOCK_OUT':
      return 'bg-info'
    case 'RETURN':
      return 'bg-warning text-dark'
    case 'EXPIRED':
    case 'DISPOSE':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}

const getQuantityChangeClass = (change) => {
  const num = Number(change)
  if (num > 0) return 'text-success fw-bold'
  if (num < 0) return 'text-danger fw-bold'
  return 'text-muted'
}
</script>

<style scoped>
.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin: 0;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
}

.breadcrumb-item a {
  color: #4e73df;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #6c757d;
}

.text-gray-800 {
  color: #5a5c69 !important;
}

.form-control[readonly] {
  background-color: #e9ecef !important;
  border-color: #dee2e6;
  cursor: default;
  color: #495057;
}

.form-label {
  margin-bottom: 0.5rem;
}

.card-header {
  background-color: #ffffff !important;
  border-bottom: 2px solid #e3e6f0;
}

.card-footer {
  background-color: #ffffff !important;
  border-top: 1px solid #e3e6f0;
}

code {
  font-size: 0.875rem;
}

.table {
  margin-bottom: 0;
}

.table th {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table td {
  vertical-align: middle;
}

.pagination-footer {
  padding: 1rem 0;
  background-color: transparent;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: center;
}
</style>
