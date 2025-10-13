<template>
  <HealthWorkerLayout>
    <!-- Mobile Header -->
    <div class="mobile-header d-flex align-items-center mb-3">
      <button class="btn btn-link p-0 me-3" @click="goBack">
        <i class="bi bi-arrow-left" style="font-size: 1.5rem; color: #007bff;"></i>
      </button>
      <h5 class="mb-0 fw-bold">Vaccine Details</h5>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Vaccine Details -->
    <div v-if="!loading && vaccine" class="vaccine-detail">
      <!-- Main Info Card -->
      <div class="detail-card mb-3">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="vaccine-title mb-0">{{ vaccine.vaccineName }}</h6>
            <span class="badge status-badge" :class="getStatusBadgeClass(vaccine.status)">
              {{ vaccine.status }}
            </span>
          </div>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Manufacturer</span>
              <span class="info-value">{{ vaccine.manufacturer || 'Not specified' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Batch Number</span>
              <span class="info-value batch-code">{{ vaccine.batchNo || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Available Doses</span>
              <span class="info-value quantity" :class="getQuantityClass(vaccine.quantity)">
                <strong>{{ vaccine.quantity || 0 }}</strong> doses
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Expiry Date</span>
              <span class="info-value">{{ formatDate(vaccine.expiryDate) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stock Level Card -->
      <div class="detail-card mb-3">
        <div class="card-header">
          <h6 class="mb-0">Stock Level</h6>
        </div>
        <div class="card-body">
          <div class="stock-visual mb-3">
            <div class="d-flex justify-content-between mb-2">
              <span class="stock-label">Current Stock</span>
              <span class="stock-amount" :class="getQuantityClass(vaccine.quantity)">
                {{ vaccine.quantity }} doses
              </span>
            </div>
            <div class="progress" style="height: 10px;">
              <div 
                class="progress-bar"
                :class="getProgressBarClass(vaccine.status)"
                :style="{ width: getProgressWidth(vaccine.quantity) + '%' }"
              ></div>
            </div>
          </div>
          
          <!-- Availability Status -->
          <div class="availability-status">
            <div class="d-flex align-items-center justify-content-between">
              <span class="availability-label">Available for administration</span>
              <div class="availability-indicator">
                <i :class="(vaccine.quantity || 0) > 0 ? 'bi bi-check-circle-fill text-success' : 'bi bi-x-circle-fill text-danger'"></i>
                <span class="fw-bold ms-2" :class="(vaccine.quantity || 0) > 0 ? 'text-success' : 'text-danger'">
                  {{ (vaccine.quantity || 0) > 0 ? 'YES' : 'NO' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="detail-card mb-3" v-if="vaccine.description || vaccine.ageGroup || vaccine.dosageInfo || vaccine.storageLocation || vaccine.brandName">
        <div class="card-header">
          <h6 class="mb-0">Additional Information</h6>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item" v-if="vaccine.brandName">
              <span class="info-label">Brand Name</span>
              <span class="info-value">{{ vaccine.brandName }}</span>
            </div>
            <div class="info-item" v-if="vaccine.storageLocation">
              <span class="info-label">Storage Location</span>
              <span class="info-value">{{ vaccine.storageLocation }}</span>
            </div>
            <div class="info-item" v-if="vaccine.ageGroup">
              <span class="info-label">Target Age Group</span>
              <span class="info-value">{{ vaccine.ageGroup }}</span>
            </div>
            <div class="info-item" v-if="vaccine.dosageInfo">
              <span class="info-label">Dosage Information</span>
              <span class="info-value">{{ vaccine.dosageInfo }}</span>
            </div>
            <div class="info-item full-width" v-if="vaccine.description">
              <span class="info-label">Description</span>
              <span class="info-value">{{ vaccine.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Expiry Warning -->
      <div v-if="vaccine.status === 'Expiring Soon'" class="alert alert-warning">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Warning:</strong> This vaccine expires within 30 days. Please prioritize its use.
      </div>

      <!-- Out of Stock Alert -->
      <div v-if="vaccine.status === 'Out of Stock'" class="alert alert-danger">
        <i class="bi bi-x-circle-fill me-2"></i>
        <strong>Out of Stock:</strong> This vaccine is currently unavailable. Please contact the administrator for restocking.
      </div>

      <!-- Low Stock Alert -->
      <div v-if="vaccine.status === 'Low Stock'" class="alert alert-warning">
        <i class="bi bi-exclamation-circle-fill me-2"></i>
        <strong>Low Stock:</strong> This vaccine is running low. Consider requesting a restock soon.
      </div>
    </div>

    <!-- Error State -->
    <div v-if="!loading && !vaccine" class="text-center py-5">
      <i class="bi bi-exclamation-triangle text-muted mb-3" style="font-size: 3rem;"></i>
      <h6 class="text-muted">Vaccine not found</h6>
      <p class="text-muted small">The requested vaccine could not be found or may have been removed from inventory.</p>
      <button class="btn btn-primary" @click="goBack">
        <i class="bi bi-arrow-left me-2"></i>Back to Inventory
      </button>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const vaccine = ref(null)

const goBack = () => {
  router.push('/healthworker/inventory')
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not specified'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Available': return 'bg-success'
    case 'Low Stock': return 'bg-warning text-dark'
    case 'Out of Stock': return 'bg-danger'
    case 'Expiring Soon': return 'bg-danger'
    default: return 'bg-secondary'
  }
}

const getQuantityClass = (quantity) => {
  const safeQuantity = quantity || 0
  if (safeQuantity === 0) return 'text-danger'
  if (safeQuantity <= 50) return 'text-warning'
  return 'text-success'
}

const getProgressBarClass = (status) => {
  switch (status) {
    case 'Available': return 'bg-success'
    case 'Low Stock': return 'bg-warning'
    case 'Out of Stock': return 'bg-danger'
    case 'Expiring Soon': return 'bg-danger'
    default: return 'bg-secondary'
  }
}

const getProgressWidth = (quantity) => {
  const maxStock = 200 // Assume max stock for visualization
  const safeQuantity = quantity || 0
  return Math.min((safeQuantity / maxStock) * 100, 100)
}

const fetchVaccineDetail = async (id) => {
  try {
    loading.value = true
    // Try to get from inventory first (which includes stock information)
    let response
    try {
      response = await api.get(`/vaccines/inventory/${id}`)
    } catch (inventoryError) {
      // Fallback to stock endpoint if inventory fails
      console.warn('Inventory endpoint failed, trying stock endpoint:', inventoryError)
      response = await api.get('/vaccines/stock')
      // Find the specific vaccine by ID
      const stockData = response.data?.data || []
      const foundVaccine = stockData.find(v => v.id === id || v.inventory_id === id)
      if (foundVaccine) {
        response = { data: { data: foundVaccine } }
      } else {
        throw new Error('Vaccine not found in stock data')
      }
    }
    
    // Normalize the data structure
    const rawData = response.data?.data || response.data
    if (rawData) {
      vaccine.value = {
        id: rawData.inventory_id || rawData.id,
        vaccine_id: rawData.vaccine_id || rawData.vaccine?.vaccine_id,
        vaccineName: rawData.vaccineName || rawData.vaccine?.antigen_name || rawData.antigen_name || 'Unknown Vaccine',
        brandName: rawData.brandName || rawData.vaccine?.brand_name || rawData.brand_name || '',
        manufacturer: rawData.manufacturer || rawData.vaccine?.manufacturer || '',
        batchNo: rawData.batchNo || rawData.lot_number || rawData.batch_number || '',
        expiryDate: rawData.expiryDate || rawData.expiration_date || rawData.expiry_date || '',
        quantity: rawData.quantity || rawData.current_stock_level || 0,
        status: rawData.status || (rawData.quantity > 0 ? 'Available' : 'Out of Stock'),
        storageLocation: rawData.storageLocation || rawData.storage_location || '',
        category: rawData.category || rawData.vaccine?.category || '',
        // Additional fields that might be useful
        ageGroup: rawData.ageGroup || rawData.age_group || '',
        dosageInfo: rawData.dosageInfo || rawData.dosage_info || '',
        description: rawData.description || rawData.vaccine?.disease_prevented || ''
      }
    } else {
      vaccine.value = null
    }
  } catch (error) {
    console.error('Error fetching vaccine details:', error)
    vaccine.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const vaccineId = route.params.id
  if (vaccineId) {
    fetchVaccineDetail(vaccineId)
  } else {
    loading.value = false
  }
})
</script>

<style scoped>
.mobile-header {
  background: white;
  padding: 1rem 0 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 56px;
  z-index: 100;
}

.vaccine-detail {
  padding-bottom: 2rem;
}

.detail-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e9ecef;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.card-body {
  padding: 1rem;
}

.vaccine-title {
  font-weight: 600;
  color: #2c3e50;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

.batch-code {
  font-family: 'Courier New', monospace;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
}

.quantity {
  font-size: 1.1rem;
}

.stock-visual {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
}

.stock-label {
  color: #6c757d;
  font-size: 0.875rem;
}

.stock-amount {
  font-weight: 600;
}

.availability-status {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
}

.availability-label {
  color: #6c757d;
  font-size: 0.875rem;
}

.availability-indicator {
  display: flex;
  align-items: center;
}

.alert {
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .mobile-header {
    margin-left: -1rem;
    margin-right: -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .vaccine-detail {
    margin-left: -0.5rem;
    margin-right: -0.5rem;
  }
  
  .detail-card {
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .card-body, .card-header {
    padding: 0.75rem;
  }
  
  .info-value {
    font-size: 0.95rem;
  }
  
  .vaccine-title {
    font-size: 1rem;
  }
}

@media (min-width: 576px) {
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>