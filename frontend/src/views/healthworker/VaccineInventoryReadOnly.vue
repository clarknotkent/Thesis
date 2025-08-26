<template>
  <HealthWorkerLayout>
    <AppPageHeader
      title="Vaccine Inventory"
      subtitle="Check available vaccine stock (Read Only)"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <div class="text-end">
          <small class="d-block text-muted">Last Updated</small>
          <strong>{{ lastUpdated }}</strong>
        </div>
      </template>
    </AppPageHeader>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Quick Stock Status -->
    <div v-if="!loading" class="row g-3 mb-4">
      <div class="col-md-4">
        <AppCard class="hw-stat-card bg-success text-white h-100">
          <div class="text-center">
            <i class="bi bi-check-circle-fill hw-stat-icon"></i>
            <h5>Available Types</h5>
            <h2 class="fw-bold">{{ stats.available }}</h2>
          </div>
        </AppCard>
      </div>
      <div class="col-md-4">
        <AppCard class="hw-stat-card bg-warning text-white h-100">
          <div class="text-center">
            <i class="bi bi-exclamation-triangle-fill hw-stat-icon"></i>
            <h5>Low Stock</h5>
            <h2 class="fw-bold">{{ stats.lowStock }}</h2>
          </div>
        </AppCard>
      </div>
      <div class="col-md-4">
        <AppCard class="hw-stat-card bg-danger text-white h-100">
          <div class="text-center">
            <i class="bi bi-x-circle-fill hw-stat-icon"></i>
            <h5>Out of Stock</h5>
            <h2 class="fw-bold">{{ stats.outOfStock }}</h2>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Search Bar -->
    <div v-if="!loading" class="card mb-4">
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-8">
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                class="form-control" 
                placeholder="Search vaccines by name or manufacturer..."
                v-model="searchQuery"
              >
            </div>
          </div>
          <div class="col-md-4">
            <select class="form-select" v-model="statusFilter">
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Expiring Soon">Expiring Soon</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Vaccine Cards -->
    <div v-if="!loading" class="row g-3">
      <div class="col-lg-6 col-xl-4" v-for="vaccine in filteredVaccines" :key="vaccine.id">
        <div class="card hw-vaccine-card h-100">
          <div class="card-header bg-light">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold">{{ vaccine.vaccineName }}</h6>
              <span class="badge" :class="getStatusBadgeClass(vaccine.status)">
                {{ vaccine.status }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <div class="hw-vaccine-info mb-3">
              <div class="row g-2">
                <div class="col-12">
                  <small class="text-muted">Manufacturer:</small>
                  <div class="fw-semibold">{{ vaccine.manufacturer }}</div>
                </div>
                <div class="col-6">
                  <small class="text-muted">Batch No:</small>
                  <div><code>{{ vaccine.batchNo }}</code></div>
                </div>
                <div class="col-6">
                  <small class="text-muted">Expiry:</small>
                  <div>{{ formatDate(vaccine.expiryDate) }}</div>
                </div>
              </div>
            </div>

            <!-- Stock Level Visual -->
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <small class="text-muted">Stock Level</small>
                <small class="fw-semibold" :class="getQuantityClass(vaccine.quantity)">
                  {{ vaccine.quantity }} doses
                </small>
              </div>
              <div class="progress" style="height: 8px;">
                <div 
                  class="progress-bar"
                  :class="getProgressBarClass(vaccine.status)"
                  :style="{ width: getProgressWidth(vaccine.quantity) + '%' }"
                ></div>
              </div>
            </div>

            <!-- Availability for Today -->
            <div class="hw-availability-check">
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted">Available for administration:</span>
                <span class="fw-bold" :class="vaccine.quantity > 0 ? 'text-success' : 'text-danger'">
                  <i :class="vaccine.quantity > 0 ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
                  {{ vaccine.quantity > 0 ? 'YES' : 'NO' }}
                </span>
              </div>
            </div>

            <!-- Expiry Warning -->
            <div v-if="vaccine.status === 'Expiring Soon'" class="alert alert-warning mt-2 py-1 px-2 small">
              <i class="bi bi-exclamation-triangle-fill me-1"></i>
              Expires within 30 days
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredVaccines.length === 0" class="text-center py-5">
      <i class="bi bi-box text-muted mb-3" style="font-size: 4rem;"></i>
      <h4 class="text-muted">No vaccines found</h4>
      <p class="text-muted">Try adjusting your search criteria.</p>
    </div>

    <!-- Table View Toggle -->
    <div v-if="!loading && vaccines.length > 0" class="mt-4">
      <div class="card">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Detailed Vaccine List</h6>
            <button class="btn btn-outline-primary btn-sm" @click="showTable = !showTable">
              <i :class="showTable ? 'bi bi-grid-3x3-gap' : 'bi bi-table'"></i>
              {{ showTable ? 'Card View' : 'Table View' }}
            </button>
          </div>
        </div>
        <div class="card-body" v-if="showTable">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Vaccine Name</th>
                  <th>Manufacturer</th>
                  <th>Batch No.</th>
                  <th>Expiry Date</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="vaccine in filteredVaccines" :key="vaccine.id">
                  <td class="fw-semibold">{{ vaccine.vaccineName }}</td>
                  <td>{{ vaccine.manufacturer }}</td>
                  <td><code>{{ vaccine.batchNo }}</code></td>
                  <td>{{ formatDate(vaccine.expiryDate) }}</td>
                  <td>
                    <span class="fw-bold" :class="getQuantityClass(vaccine.quantity)">
                      {{ vaccine.quantity }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="getStatusBadgeClass(vaccine.status)">
                      {{ vaccine.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Notice -->
    <div class="alert alert-info mt-4">
      <i class="bi bi-info-circle me-2"></i>
      <strong>Note:</strong> This is a read-only view. For stock updates or procurement, please contact the administrator.
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppCard from '@/components/common/AppCard.vue'
import api from '@/services/api'

const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')
const showTable = ref(false)
const vaccines = ref([])
const stats = ref({
  available: 0,
  lowStock: 0,
  outOfStock: 0,
  expiringSoon: 0
})

const breadcrumbs = [
  { text: 'Health Worker', href: '/healthworker/dashboard' },
  { text: 'Vaccine Inventory', active: true }
]

const lastUpdated = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

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

  return filtered
})

const fetchVaccines = async () => {
  try {
    loading.value = true
    const response = await api.get('/vaccines/stock')
    vaccines.value = response.data.data
  } catch (error) {
    console.error('Error fetching vaccines:', error)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await api.get('/vaccines/stock/stats')
    const data = response.data.data
    stats.value = {
      available: data.available,
      lowStock: data.lowStock,
      outOfStock: data.outOfStock,
      expiringSoon: data.expiringSoon
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
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
  if (quantity === 0) return 'text-danger'
  if (quantity <= 50) return 'text-warning'
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
  // Simple calculation: assume max stock is 200 for visualization
  const maxStock = 200
  return Math.min((quantity / maxStock) * 100, 100)
}

onMounted(() => {
  fetchVaccines()
  fetchStats()
})
</script>

<style scoped>
.hw-stat-card {
  border: none;
  border-radius: 1rem;
}

.hw-stat-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hw-vaccine-card {
  border: none;
  box-shadow: 0 0.15rem 1.75rem 0 rgba(33, 40, 50, 0.15);
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.hw-vaccine-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.25rem 2rem 0 rgba(33, 40, 50, 0.2);
}

.hw-vaccine-info {
  font-size: 0.875rem;
}

.hw-availability-check {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
}

.card-header {
  border-bottom: 1px solid #e9ecef;
  border-radius: 0.75rem 0.75rem 0 0 !important;
}

code {
  background: #e9ecef;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}
</style>
