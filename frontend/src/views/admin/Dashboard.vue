<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 page-header">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Admin Dashboard</h1>
          <p class="text-muted mb-0">Welcome to the Immunization Management System</p>
        </div>
        <div class="d-flex align-items-center gap-2 header-actions">
          <small class="text-muted">Last updated: {{ lastUpdated }}</small>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading dashboard...</span>
        </div>
      </div>

      <!-- Stats Cards Row -->
      <div v-if="!loading" class="row g-3 mb-4">
        <!-- Vaccinations Today Card -->
        <div class="col-xl-3 col-md-6">
          <div class="card border-start border-success border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-success text-uppercase mb-1">
                    Vaccinations Today
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.vaccinationsToday }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-shield-check text-success" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Patients Card -->
        <div class="col-xl-3 col-md-6">
          <div class="card border-start border-primary border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-primary text-uppercase mb-1">
                    Total Patients
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.totalPatients }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-people text-primary" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Health Workers Card -->
        <div class="col-xl-3 col-md-6">
          <div class="card border-start border-info border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-info text-uppercase mb-1">
                    Active Health Workers
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.activeHealthWorkers }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-person-badge text-info" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Inventory Items Card -->
        <div class="col-xl-3 col-md-6">
          <div class="card border-start border-purple border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-purple text-uppercase mb-1">
                    Total Inventory Items
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.totalInventoryItems }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-box-seam text-purple" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Status Cards Row -->
      <div v-if="!loading" class="row g-3 mb-4">
        <!-- Low Stock Alert Card -->
        <div class="col-xl-4 col-md-6">
          <div class="card border-start border-danger border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-danger text-uppercase mb-1">
                    Low Stock Alerts
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.lowStockItems }}</div>
                  <small class="text-muted">Items below 10 units</small>
                </div>
                <div class="col-auto">
                  <i class="bi bi-exclamation-triangle text-danger" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Expiring Soon Card -->
        <div class="col-xl-4 col-md-6">
          <div class="card border-start border-warning border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-warning text-uppercase mb-1">
                    Expiring Soon
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.expiringSoon }}</div>
                  <small class="text-muted">Within 30 days</small>
                </div>
                <div class="col-auto">
                  <i class="bi bi-clock text-warning" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Appointments Card -->
        <div class="col-xl-4 col-md-6">
          <div class="card border-start border-secondary border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-secondary text-uppercase mb-1">
                    Pending Appointments
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.pendingAppointments }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-calendar-event text-secondary" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart and Recent Data -->
      <div v-if="!loading" class="row">
        <!-- Vaccine Data Chart -->
        <div class="col-12">
          <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 class="m-0 fw-bold text-primary">Vaccine Data</h6>
              <small class="text-muted">Doses Administered (Last 7 Days)</small>
            </div>
            <div class="card-body">
              <BarChart 
                :data="vaccineChartData" 
                :height="320"
                :colors="['#0d6efd', '#198754', '#0dcaf0', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14']"
              />
            </div>
          </div>
        </div>

        <!-- Inventory Status Table -->
        <div class="col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 class="m-0 fw-bold text-primary">Inventory Status</h6>
              <div class="dropdown no-arrow">
                <a class="dropdown-toggle" href="#" role="button" id="inventoryDropdown" data-bs-toggle="dropdown">
                  <i class="bi bi-three-dots-vertical"></i>
                </a>
                <div class="dropdown-menu dropdown-menu-end shadow">
                  <div class="dropdown-header">Actions:</div>
                  <a class="dropdown-item" href="#" @click.prevent="refreshData">Refresh Data</a>
                  <router-link class="dropdown-item" to="/admin/vaccine-inventory">Manage Inventory</router-link>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover table-sm">
                  <thead class="table-light">
                    <tr>
                      <th>Vaccine</th>
                      <th>Stock</th>
                      <th>Expiry</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in inventoryItems" :key="item.inventory_id">
                      <td class="fw-semibold">
                        {{ item.vaccinemaster?.antigen_name || 'Unknown' }}
                        <small class="text-muted d-block">{{ item.vaccinemaster?.brand_name }}</small>
                      </td>
                      <td>
                        <span :class="getStockClass(item.current_stock_level)">
                          {{ item.current_stock_level === 0 ? 'No stock' : item.current_stock_level + ' units' }}
                        </span>
                      </td>
                      <td>{{ item.expiration_date ? formatDate(item.expiration_date) : 'N/A' }}</td>
                      <td>
                        <span class="badge" :class="getStatusClass(item)">
                          {{ getStatusText(item) }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="inventoryItems.length === 0">
                      <td colspan="4" class="text-center text-muted py-4">
                        No inventory items found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Vaccinations Table -->
        <div class="col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 class="m-0 fw-bold text-primary">Recent Vaccinations</h6>
              <div class="dropdown no-arrow">
                <a class="dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-bs-toggle="dropdown">
                  <i class="bi bi-three-dots-vertical"></i>
                </a>
                <div class="dropdown-menu dropdown-menu-end shadow">
                  <div class="dropdown-header">Actions:</div>
                  <a class="dropdown-item" href="#" @click.prevent="refreshData">Refresh Data</a>
                  <a class="dropdown-item" href="#">Export Data</a>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover table-sm">
                  <thead class="table-light">
                    <tr>
                      <th>Patient</th>
                      <th>Vaccine</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="vaccination in recentVaccinations" :key="vaccination.id">
                      <td class="fw-semibold">
                        {{ vaccination.patientName }}
                        <small class="text-muted d-block">{{ vaccination.parentName }}</small>
                      </td>
                      <td>{{ vaccination.vaccineName }}</td>
                      <td>{{ formatDate(vaccination.dateAdministered) }}</td>
                      <td>
                        <span 
                          class="badge" 
                          :class="vaccination.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'"
                        >
                          {{ vaccination.status === 'completed' ? 'Completed' : 'Pending' }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="recentVaccinations.length === 0">
                      <td colspan="4" class="text-center text-muted py-4">
                        No recent vaccinations found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import BarChart from '@/components/common/BarChart.vue'
import api from '@/services/api'

// Reactive data
const loading = ref(true)
const stats = ref({
  vaccinationsToday: 0,
  totalPatients: 0,
  activeHealthWorkers: 0,
  pendingAppointments: 0,
  totalInventoryItems: 0,
  lowStockItems: 0,
  expiringSoon: 0
})
const recentVaccinations = ref([])
const vaccineChartData = ref([])
const inventoryItems = ref([])

const lastUpdated = computed(() => {
  return new Date().toLocaleString()
})

// Methods
const fetchDashboardData = async () => {
  try {
    loading.value = true
    
    // Fetch dashboard overview data
    const response = await api.get('/dashboard/overview')
    const data = response.data.data
    
    stats.value = data.stats
    recentVaccinations.value = data.recentVaccinations
    vaccineChartData.value = data.chartData
    inventoryItems.value = data.inventoryItems || []
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Fallback to empty data
    stats.value = {
      vaccinationsToday: 0,
      totalPatients: 0,
      activeHealthWorkers: 0,
      pendingAppointments: 0,
      totalInventoryItems: 0,
      lowStockItems: 0,
      expiringSoon: 0
    }
    recentVaccinations.value = []
    vaccineChartData.value = []
    inventoryItems.value = []
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await fetchDashboardData()
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStockClass = (stockLevel) => {
  if (stockLevel === 0) return 'text-secondary'
  if (stockLevel <= 5) return 'text-danger fw-bold'
  if (stockLevel <= 10) return 'text-warning fw-bold'
  return 'text-success'
}

const getStatusClass = (item) => {
  if (item.current_stock_level === 0) return 'bg-secondary'
  
  const daysToExpiry = item.expiration_date ? 
    Math.ceil((new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)) : 
    null
  
  if (item.current_stock_level <= 5) return 'bg-danger'
  if (item.current_stock_level <= 10) return 'bg-warning text-dark'
  if (daysToExpiry && daysToExpiry <= 30) return 'bg-warning text-dark'
  return 'bg-success'
}

const getStatusText = (item) => {
  if (item.current_stock_level === 0) return 'No Inventory'
  
  const daysToExpiry = item.expiration_date ? 
    Math.ceil((new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)) : 
    null
  
  if (item.current_stock_level <= 5) return 'Critical'
  if (item.current_stock_level <= 10) return 'Low Stock'
  if (daysToExpiry && daysToExpiry <= 30) return 'Expiring'
  return 'Good'
}

// Lifecycle
onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.border-start {
  border-left: 0.25rem solid !important;
}

.text-gray-800 {
  color: #5a5c69 !important;
}

.text-xs {
  font-size: 0.75rem;
}

.dropdown-toggle::after {
  display: none;
}

.page-header {
  border-bottom: 1px solid #e3e6f0;
  padding-bottom: 1rem;
}

.border-purple {
  border-color: #6f42c1 !important;
}

.text-purple {
  color: #6f42c1 !important;
}
</style>