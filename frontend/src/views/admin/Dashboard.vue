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
        <div class="col">
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
        <div class="col">
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
        <div class="col">
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

        <!-- Pending Appointments Card -->
        <div class="col">
          <div class="card border-start border-warning border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-warning text-uppercase mb-1">
                    Pending Appointments
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.pendingAppointments }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-calendar-event text-warning" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart and Recent Vaccinations -->
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

        <!-- Recent Vaccinations Table -->
        <div class="col-12">
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
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Patient</th>
                      <th>Parent</th>
                      <th>Vaccine</th>
                      <th>Health Worker</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="vaccination in recentVaccinations" :key="vaccination.id">
                      <td class="fw-semibold">{{ vaccination.patientName }}</td>
                      <td>{{ vaccination.parentName }}</td>
                      <td>{{ vaccination.vaccineName }}</td>
                      <td>{{ vaccination.healthWorker }}</td>
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
                      <td colspan="6" class="text-center text-muted py-4">
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
  pendingAppointments: 0
})
const recentVaccinations = ref([])
const vaccineChartData = ref([])

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
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Fallback to empty data
    stats.value = {
      vaccinationsToday: 0,
      totalPatients: 0,
      activeHealthWorkers: 0,
      pendingAppointments: 0
    }
    recentVaccinations.value = []
    vaccineChartData.value = []
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
</style>