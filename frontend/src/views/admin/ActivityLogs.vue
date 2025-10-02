<template>
  <AdminLayout>
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Activity Logs</h1>
          <p class="text-muted mb-0">Monitor system activity and user actions</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary" @click="exportLogs">
            <i class="bi bi-download me-2"></i>Export Logs
          </button>
          <button class="btn btn-outline-danger" @click="showClearModal = true">
            <i class="bi bi-trash me-2"></i>Clear Old Logs
          </button>
        </div>
      </div>

      <!-- Activity Stats -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-start border-primary border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-primary text-uppercase mb-1">
                    Total Logs
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.totalLogs }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-journal-text text-primary" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-success border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-success text-uppercase mb-1">
                    Today's Activity
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.todayLogs }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-calendar-day text-success" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-info border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-info text-uppercase mb-1">
                    Active Users
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.activeUsers }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-people text-info" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-warning border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-warning text-uppercase mb-1">
                    Failed Actions
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.failedActions }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label">Date Range:</label>
              <select class="form-select" v-model="filters.dateRange" @change="applyFilters">
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div class="col-md-3" v-if="filters.dateRange === 'custom'">
              <label class="form-label">From Date:</label>
              <DateInput v-model="filters.fromDate" />
            </div>
            <div class="col-md-3" v-if="filters.dateRange === 'custom'">
              <label class="form-label">To Date:</label>
              <DateInput v-model="filters.toDate" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Action Type:</label>
              <select class="form-select" v-model="filters.actionType" @change="applyFilters">
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="view">View</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">User Role:</label>
              <select class="form-select" v-model="filters.userRole" @change="applyFilters">
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="health_worker">Health Worker</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Search:</label>
              <div class="input-group">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Search by user, action, or IP address..."
                  v-model="searchQuery"
                  @input="debouncedSearch"
                >
                <button class="btn btn-outline-primary" type="button">
                  <i class="bi bi-search"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Logs Table -->
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 fw-bold text-primary">Activity History</h6>
          <div class="d-flex align-items-center gap-2">
            <small class="text-muted">
              {{ totalItems }} total logs 
              <span v-if="totalPages > 1">
                (Page {{ currentPage }} of {{ totalPages }})
              </span>
            </small>
            <button class="btn btn-outline-primary btn-sm" @click="refreshLogs" title="Refresh">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in logs" :key="log.id">
                  <td>{{ formatDatePH(log.timestamp) }}</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="me-2">
                        <i class="bi bi-person-circle text-muted"></i>
                      </div>
                      <div>
                        <div class="fw-semibold">{{ log.userFullName }}</div>
                        <small class="text-muted">{{ log.userRole }}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge" :class="getActionBadgeClass(log.action)">
                      {{ log.action }}
                    </span>
                  </td>
                  <td>{{ log.resource }}</td>
                  <td><code>{{ log.ipAddress }}</code></td>
                  <td>
                    <span class="badge" :class="log.status === 'success' ? 'bg-success' : 'bg-danger'">
                      {{ log.status }}
                    </span>
                  </td>
                  <td>
                    <button 
                      class="btn btn-outline-info btn-sm" 
                      @click="viewLogDetails(log)"
                      title="View Details"
                    >
                      <i class="bi bi-eye"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="logs.length === 0">
                  <td colspan="7" class="text-center text-muted py-4">
                    No activity logs found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Pagination -->
        <div class="card-footer" v-if="totalPages > 1">
          <AppPagination
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-items="totalItems"
            :items-per-page="itemsPerPage"
            @page-changed="changePage"
          />
        </div>
      </div>

      <!-- Log Details Modal -->
      <div class="modal fade" :class="{ show: showDetailsModal }" :style="{ display: showDetailsModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-info-circle me-2"></i>
                Activity Log Details
              </h5>
              <button type="button" class="btn-close" @click="closeDetailsModal"></button>
            </div>
            <div class="modal-body" v-if="selectedLog">
              <div class="row g-3">
                <div class="col-md-6">
                  <strong>Timestamp:</strong><br>
                  <span class="text-muted">{{ formatDatePH(selectedLog.timestamp) }}</span>
                </div>
                <div class="col-md-6">
                  <strong>User:</strong><br>
                  <span class="text-muted">{{ selectedLog.userFullName }} ({{ selectedLog.userRole }})</span>
                </div>
                <div class="col-md-6">
                  <strong>Action:</strong><br>
                  <span class="badge" :class="getActionBadgeClass(selectedLog.action)">{{ selectedLog.action }}</span>
                </div>
                <div class="col-md-6">
                  <strong>Status:</strong><br>
                  <span class="badge" :class="selectedLog.status === 'success' ? 'bg-success' : 'bg-danger'">{{ selectedLog.status }}</span>
                </div>
                <div class="col-md-6">
                  <strong>IP Address:</strong><br>
                  <code>{{ selectedLog.ipAddress }}</code>
                </div>
                <div class="col-md-6">
                  <strong>User Agent:</strong><br>
                  <small class="text-muted">{{ selectedLog.userAgent || 'Not available' }}</small>
                </div>
                <div class="col-12">
                  <strong>Resource:</strong><br>
                  <span class="text-muted">{{ selectedLog.resource }}</span>
                </div>
                <div class="col-12" v-if="selectedLog.description">
                  <strong>Description:</strong><br>
                  <p class="text-muted">{{ selectedLog.description }}</p>
                </div>
                <div class="col-12" v-if="selectedLog.metadata">
                  <strong>Additional Data:</strong><br>
                  <pre class="bg-light p-3 rounded"><code>{{ JSON.stringify(selectedLog.metadata, null, 2) }}</code></pre>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeDetailsModal">
                <i class="bi bi-x-circle me-2"></i>Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Clear Logs Confirmation Modal -->
      <div class="modal fade" :class="{ show: showClearModal }" :style="{ display: showClearModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Clear Activity Logs
              </h5>
              <button type="button" class="btn-close" @click="closeClearModal"></button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to clear old activity logs?</p>
              <div class="mb-3">
                <label class="form-label">Clear logs older than:</label>
                <select class="form-select" v-model="clearLogsAge">
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                </select>
              </div>
              <p class="text-danger small">This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeClearModal">
                <i class="bi bi-x-circle me-2"></i>Cancel
              </button>
              <button type="button" class="btn btn-danger" @click="clearOldLogs" :disabled="clearing">
                <span v-if="clearing" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-trash me-2"></i>
                {{ clearing ? 'Clearing...' : 'Clear Logs' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Backdrop -->
      <div v-if="showDetailsModal || showClearModal" class="modal-backdrop fade show"></div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import api from '@/services/api'
import DateInput from '@/components/common/DateInput.vue'

// Reactive data
const loading = ref(true)
const clearing = ref(false)
const logs = ref([])
const selectedLog = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10) // Set to 10 items per page as requested
const totalItems = ref(0)
const totalPages = ref(0)

// Date picker refs

// Modal states
const showDetailsModal = ref(false)
const showClearModal = ref(false)
const clearLogsAge = ref('90')

// Filters
const filters = ref({
  dateRange: 'week',
  fromDate: '',
  toDate: '',
  actionType: '',
  userRole: ''
})

// Computed properties
// Helper: normalize various timestamp shapes to a Date assuming UTC if timezone is missing
const toDateAssumingUTCIfMissingTZ = (val) => {
  if (!val) return null
  if (val instanceof Date) return val
  if (typeof val === 'number') return new Date(val)
  if (typeof val === 'string') {
    // If string lacks timezone offset or Z, treat it as UTC and append Z
    const hasTZ = /[zZ]|[+\-]\d{2}:?\d{2}$/.test(val)
    const normalized = hasTZ ? val : (val.replace(' ', 'T') + 'Z')
    return new Date(normalized)
  }
  return new Date(val)
}

// Helper: get YYYY-MM-DD string in Asia/Manila for day comparisons
const getPHDateKey = (val) => {
  const d = toDateAssumingUTCIfMissingTZ(val)
  if (!d || isNaN(d.getTime())) return ''
  // en-CA yields YYYY-MM-DD
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

const stats = computed(() => ({
  totalLogs: totalItems.value,
  todayLogs: logs.value.filter(log => {
    const todayPH = getPHDateKey(new Date())
    return getPHDateKey(log.timestamp) === todayPH
  }).length,
  activeUsers: new Set(logs.value.map(log => log.userId)).size,
  failedActions: logs.value.filter(log => log.status === 'failed').length
}))

// Methods
const fetchLogs = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value,
      date_range: filters.value.dateRange,
      action_type: filters.value.actionType,
      user_role: filters.value.userRole
    }
    
    if (filters.value.dateRange === 'custom') {
      params.from_date = convertToISODate(filters.value.fromDate)
      params.to_date = convertToISODate(filters.value.toDate)
    }

    const response = await api.get('/activity-logs', { params })
    const result = response.data.data || response.data
    
    // Handle the backend response structure properly
    if (result.items) {
      // Backend returns { items: [], totalCount: number, page: number, limit: number, totalPages: number }
      logs.value = result.items.map(log => ({
        id: log.log_id || log.id,
        timestamp: log.timestamp,
        userId: log.user_id,
        userFullName: log.display_user_name || log.user_fullname || log.username || 'Unknown User',
        userRole: log.user_role || 'Unknown',
        action: log.display_action || log.description || log.action_type || 'Unknown Action',
        resource: log.resource || log.table_name || 'System',
        ipAddress: log.ip_address || 'N/A',
        status: log.status || (log.success ? 'success' : 'failed'),
        userAgent: log.user_agent,
        description: log.full_description || log.details,
        metadata: log.metadata || log.additional_data
      }))

      totalItems.value = result.totalCount
      totalPages.value = result.totalPages
    } else {
      // Fallback for other response formats
      const logsArray = Array.isArray(result) ? result : result.data || []
      logs.value = logsArray.map(log => ({
        id: log.log_id || log.id,
        timestamp: log.timestamp,
        userId: log.user_id,
        userFullName: log.display_user_name || log.user_fullname || log.username || 'Unknown User',
        userRole: log.user_role || 'Unknown',
        action: log.display_action || log.description || log.action_type || 'Unknown Action',
        resource: log.resource || log.table_name || 'System',
        ipAddress: log.ip_address || 'N/A',
        status: log.status || (log.success ? 'success' : 'failed'),
        userAgent: log.user_agent,
        description: log.full_description || log.details,
        metadata: log.metadata || log.additional_data
      }))

      totalItems.value = result.totalCount || result.total || logs.value.length
      totalPages.value = Math.ceil(totalItems.value / itemsPerPage.value)
    }

  } catch (error) {
    console.error('Error fetching activity logs:', error)
    logs.value = []
    totalItems.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
}

const refreshLogs = () => {
  fetchLogs()
}

const applyFilters = () => {
  currentPage.value = 1
  fetchLogs()
}

// Debounced search
let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchLogs()
  }, 500)
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page
    fetchLogs()
  }
}

const viewLogDetails = (log) => {
  selectedLog.value = log
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedLog.value = null
}

const closeClearModal = () => {
  showClearModal.value = false
  clearLogsAge.value = '90'
}

const clearOldLogs = async () => {
  try {
    clearing.value = true
    await api.delete(`/activity-logs/clear-old/${clearLogsAge.value}`)
    closeClearModal()
    await fetchLogs()
    alert(`Logs older than ${clearLogsAge.value} days have been cleared successfully!`)
  } catch (error) {
    console.error('Error clearing logs:', error)
    alert('Error clearing logs. Please try again.')
  } finally {
    clearing.value = false
  }
}

const exportLogs = async () => {
  try {
    const params = {
      format: 'csv',
      search: searchQuery.value,
      date_range: filters.value.dateRange,
      action_type: filters.value.actionType,
      user_role: filters.value.userRole
    }
    
    if (filters.value.dateRange === 'custom') {
      params.from_date = convertToISODate(filters.value.fromDate)
      params.to_date = convertToISODate(filters.value.toDate)
    }

    const response = await api.get('/activity-logs/export', { 
      params,
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    console.error('Error exporting logs:', error)
    alert('Error exporting logs. Please try again.')
  }
}

// Date formatting methods
const formatDatePH = (date) => {
  if (!date) return 'Never'
  const d = toDateAssumingUTCIfMissingTZ(date)
  if (!d || isNaN(d.getTime())) return 'Invalid date'
  try {
    return d.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    })
  } catch (e) {
    return d.toLocaleString()
  }
}

const convertToISODate = (dateValue) => {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

// DateInput handles formatting and picker; we'll watch for changes to apply filters

const getActionBadgeClass = (action) => {
  switch (action?.toLowerCase()) {
    case 'login': return 'bg-success'
    case 'logout': return 'bg-info'
    case 'create': return 'bg-primary'
    case 'update': return 'bg-warning text-dark'
    case 'delete': return 'bg-danger'
    case 'view': return 'bg-secondary'
    default: return 'bg-light text-dark'
  }
}

// Lifecycle
onMounted(() => {
  fetchLogs()
})

// Auto-apply filters when custom dates change
watch(() => filters.value.fromDate, (nv, ov) => {
  if (filters.value.dateRange === 'custom') applyFilters()
})
watch(() => filters.value.toDate, (nv, ov) => {
  if (filters.value.dateRange === 'custom') applyFilters()
})
</script>

<style scoped>
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.border-start {
  border-left: 0.25rem solid !important;
}

.text-gray-800 {
  color: #5a5c69 !important;
}

code {
  background: #e9ecef;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}
</style>