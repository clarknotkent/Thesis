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

      <!-- Details Card -->
      <div v-else-if="inventoryData" class="card shadow">
        <div class="card-body p-4">
          <div class="row g-4">
            <div class="col-md-6">
              <div class="form-text">Vaccine</div>
              <div class="fw-semibold fs-5">{{ inventoryData.vaccineName }}</div>
            </div>
            <div class="col-md-6">
              <div class="form-text">Status</div>
              <span class="badge fs-6" :class="getStatusBadgeClass(inventoryData.status)">
                {{ inventoryData.status }}
              </span>
            </div>
            <div class="col-md-6">
              <div class="form-text">Manufacturer</div>
              <div class="fw-semibold">{{ inventoryData.manufacturer || '-' }}</div>
            </div>
            <div class="col-md-6">
              <div class="form-text">Brand</div>
              <div class="fw-semibold">{{ inventoryData.brandName || '-' }}</div>
            </div>
            <div class="col-md-6">
              <div class="form-text">Lot Number</div>
              <div class="fw-semibold">{{ inventoryData.batchNo || inventoryData.lotNumber || '-' }}</div>
            </div>
            <div class="col-md-6">
              <div class="form-text">Quantity</div>
              <div class="fw-semibold fs-4 text-primary">{{ inventoryData.quantity }} doses</div>
            </div>
            <div class="col-md-6">
              <div class="form-text">Expiration Date</div>
              <div class="fw-semibold">{{ formatDate(inventoryData.expiryDate) }}</div>
            </div>
            <div class="col-md-6">
              <div class="form-text">Storage Location</div>
              <div class="fw-semibold">{{ inventoryData.storageLocation || '-' }}</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="d-flex justify-content-end gap-2 mt-4 pt-4 border-top">
            <router-link 
              :to="`/admin/vaccines/edit-stock/${$route.params.id}`" 
              class="btn btn-primary"
            >
              <i class="bi bi-pencil me-2"></i>Edit
            </router-link>
            <router-link 
              :to="`/admin/vaccines/history/${$route.params.id}`" 
              class="btn btn-info"
            >
              <i class="bi bi-clock-history me-2"></i>View History
            </router-link>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { formatPHDate } from '@/utils/dateUtils'

const route = useRoute()
const router = useRouter()
const { addToast } = useToast()

const inventoryData = ref(null)
const loading = ref(true)

const goBack = () => {
  router.back()
}

onMounted(async () => {
  await fetchInventoryData()
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

const formatDate = (date) => {
  if (!date) return '-'
  return formatPHDate(date, 'MMM DD, YYYY')
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
    case 'out of stock':
      return 'bg-secondary'
    default:
      return 'bg-info'
  }
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

.form-text {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.fw-semibold {
  font-weight: 600;
}
</style>
