<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Offline Indicator Banner -->
      <div
        v-if="isOffline"
        class="alert alert-warning d-flex align-items-center mb-3"
        role="alert"
      >
        <i class="bi bi-wifi-off me-2 fs-5" />
        <div>
          <strong>Offline Mode</strong> - You're viewing cached dashboard data. Some features may be limited until you reconnect.
        </div>
      </div>

      <!-- Caching Progress Banner -->
      <div
        v-if="isCaching"
        class="alert alert-info d-flex align-items-center mb-3"
        role="alert"
      >
        <div
          class="spinner-border spinner-border-sm me-2"
          role="status"
        >
          <span class="visually-hidden">Caching...</span>
        </div>
        <div>
          <strong>Caching dashboard data...</strong> Saving metrics and statistics for offline access.
        </div>
      </div>
      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-speedometer2 me-2" />Admin Dashboard
          </h1>
          <p class="text-muted mb-0">
            Welcome to the Immunization Management System
          </p>
        </div>
        <div class="d-flex align-items-center gap-2 header-actions">
          <small class="text-muted">Last updated: {{ lastUpdated }}</small>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading dashboard...</span>
        </div>
      </div>

      <!-- Stats Cards Row -->
      <div
        v-if="!loading"
        class="row g-3 mb-4"
      >
        <!-- Vaccinations Today Card -->
        <div class="col-md">
          <div class="card border border-success border-3 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-success text-uppercase mb-1">
                    Vaccinations Today
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ stats.vaccinationsToday }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-shield-check text-success"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Patients Card -->
        <div class="col-md">
          <div class="card border border-primary border-3 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-primary text-uppercase mb-1">
                    Total Patients
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ stats.totalPatients }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-people text-primary"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Health Staff Card -->
        <div class="col-md">
          <div class="card border border-info border-3 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-info text-uppercase mb-1">
                    Active Health Staff
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ stats.activeHealthWorkers }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-person-badge text-info"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Appointments Card -->
        <div class="col-md">
          <div class="card border border-warning border-3 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-warning text-uppercase mb-1">
                    Pending Appointments
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ stats.pendingAppointments }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-calendar-event text-warning"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart and Recent Vaccinations -->
      <div
        v-if="!loading"
        class="row"
      >
        <!-- Vaccine Data Chart -->
        <div class="col-12">
          <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 class="m-0 fw-bold text-primary">
                All 7 Vaccines Usage
              </h6>
              <small class="text-muted">Across all records</small>
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
              <h6 class="m-0 fw-bold text-primary">
                Recent Vaccinations
              </h6>
              <div class="dropdown no-arrow">
                <a
                  id="dropdownMenuLink"
                  class="dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  <i class="bi bi-three-dots-vertical" />
                </a>
                <div class="dropdown-menu dropdown-menu-end shadow">
                  <div class="dropdown-header">
                    Actions:
                  </div>
                  <a
                    class="dropdown-item"
                    href="#"
                    @click.prevent="refreshData"
                  >Refresh Data</a>
                  <a
                    class="dropdown-item"
                    href="#"
                  >Export Data</a>
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
                    <tr
                      v-for="vaccination in recentVaccinations"
                      :key="vaccination.id"
                    >
                      <td class="fw-semibold">
                        {{ vaccination.patientName }}
                      </td>
                      <td>{{ vaccination.parentName }}</td>
                      <td>{{ vaccination.vaccineName }}</td>
                      <td>
                        <span v-if="vaccination.outside"><em>(Taken Outside)</em></span>
                        <span v-else>{{ vaccination.healthWorker || '—' }}</span>
                      </td>
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
                      <td
                        colspan="6"
                        class="text-center text-muted py-4"
                      >
                        No recent vaccinations found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination Footer -->
              <div
                v-if="totalRecentItems > 0"
                class="pagination-footer border-top mt-3 pt-3"
              >
                <AppPagination
                  :current-page="recentPage"
                  :total-pages="totalPages"
                  :total-items="totalRecentItems"
                  :items-per-page="pageSize"
                  @page-changed="fetchRecentPage"
                />
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
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import BarChart from '@/features/admin/analytics/BarChart.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import api from '@/services/api'
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'

const { isOffline, isCaching, fetchDashboardMetrics } = useOfflineAdmin()
const stats = ref({
  vaccinationsToday: 0,
  totalPatients: 0,
  activeHealthWorkers: 0,
  pendingAppointments: 0
})
const recentVaccinations = ref([])
const vaccineChartData = ref([])
const loading = ref(false)

// Pagination state for Recent Vaccinations (client-side)
const recentPage = ref(1)
const pageSize = ref(8) // display 8 per page as requested
const totalRecentItems = ref(0)
const isLoadingRecent = ref(false)
const allRecentItems = ref([]) // cached full list for client-side paging

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(totalRecentItems.value / pageSize.value))
})

const lastUpdated = computed(() => {
  try {
    return new Date().toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    })
  } catch {
    return new Date().toLocaleString()
  }
})

// Methods
// Map a row from the immunizationhistory_view to the UI shape
function mapVaccRow(row) {
  return {
    id: row.immunization_id || row.id || null,
    patientName: row.patient_full_name || row.patientName || '—',
    parentName: row.patient_guardian_full_name || row.parentName || row.guardian_name || row.parent_name || '—',
    vaccineName: row.vaccine_antigen_name || row.vaccineName || row.vaccine_name || '—',
    healthWorker: row.administered_by_name || row.administered_by || null,
    dateAdministered: row.administered_date || row.date_administered || null,
    status: row.status || (row.immunization_is_deleted ? 'deleted' : 'completed'),
    outside: !!row.immunization_outside || !!row.outside
  }
}

const fetchRecentPage = async (page = 1) => {
  try {
    isLoadingRecent.value = true

    // If we haven't loaded all items yet, fetch them once (no limit) and cache
    if (!allRecentItems.value || allRecentItems.value.length === 0) {
      let resp
      try {
        resp = await api.get('/immunizations')
      } catch (e) {
        // Fallback: try a large limit if server rejects no-limit
        resp = await api.get('/immunizations', { params: { limit: 10000 } })
      }

      let fetched = []
      if (resp && Array.isArray(resp.data)) {
        fetched = resp.data
      } else if (resp && resp.data && resp.data.success && Array.isArray(resp.data.data)) {
        fetched = resp.data.data.slice()
        const total = Number(resp.data.meta?.total || fetched.length)
        const perPage = Number(resp.data.meta?.pageSize || fetched.length || 1000)
        if (total > fetched.length) {
          // fetch remaining pages (page-based) in batches
          const pages = Math.ceil(total / perPage)
          for (let p = 2; p <= pages; p++) {
            try {
              const r = await api.get('/immunizations', { params: { page: p, limit: perPage, sort: 'administered_date:desc' } })
              if (r && r.data && r.data.success && Array.isArray(r.data.data)) {
                fetched.push(...r.data.data)
              } else if (r && Array.isArray(r.data)) {
                fetched.push(...r.data)
              } else {
                break
              }
            } catch (_) {
              break
            }
          }
        }
      }

      allRecentItems.value = (fetched || []).map(mapVaccRow)
      totalRecentItems.value = allRecentItems.value.length
    }

    // Compute slice for current page (client-side)
    const p = Number(page) || 1
    const start = (p - 1) * pageSize.value
    const end = start + pageSize.value
    recentVaccinations.value = allRecentItems.value.slice(start, end)
    totalRecentItems.value = allRecentItems.value.length
    recentPage.value = p
  } catch (err) {
    console.error('Failed to load recent vaccinations (client-side pagination):', err)
    recentVaccinations.value = []
    totalRecentItems.value = 0
    allRecentItems.value = []
  } finally {
    isLoadingRecent.value = false
  }
}

const fetchDashboardData = async () => {
  try {
    loading.value = true

    // Try online first
    if (!isOffline.value) {
      try {
        // Fetch dashboard overview data (stats + chart)
        const response = await api.get('/dashboard/overview')
        const data = response.data.data

        stats.value = data.stats
        vaccineChartData.value = data.chartData

        // Fetch the paginated recent vaccinations separately (first page)
        await fetchRecentPage(1)
        return
      } catch (onlineError) {
        console.warn('Online dashboard fetch failed, trying offline:', onlineError.message)
      }
    }

    // Fallback to offline
    console.log('📊 Fetching dashboard data from cached data')
    const metricsResult = await fetchDashboardMetrics()
    
    if (metricsResult) {
      stats.value = {
        vaccinationsToday: metricsResult.vaccinationsToday || 0,
        totalPatients: metricsResult.totalPatients || 0,
        activeHealthWorkers: metricsResult.activeHealthWorkers || 0,
        pendingAppointments: metricsResult.pendingAppointments || 0
      }
      
      // For offline mode, we'll show empty chart data and recent vaccinations
      vaccineChartData.value = []
      recentVaccinations.value = []
      totalRecentItems.value = 0
    } else {
      throw new Error('Failed to fetch dashboard metrics from cache')
    }
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
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Manila'
    })
  } catch {
    return new Date(dateString).toLocaleDateString()
  }
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

/* Pagination Footer */
.pagination-footer {
  padding: 1rem 0;
  background-color: transparent;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: center;
}
</style>