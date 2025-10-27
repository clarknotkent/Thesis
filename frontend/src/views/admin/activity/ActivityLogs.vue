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
                <option value="health_staff">Health Staff</option>
                <option value="parent">Parent</option>
                <option value="System">System</option>
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
                  <th>User</th>
                  <th>Action</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in logs" :key="log.id">
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="me-2">
                        <i :class="getRoleIcon(log.userRole)" :style="{ color: getRoleColor(log.userRole) }"></i>
                      </div>
                      <div>
                        <div class="fw-semibold">{{ log.userFullName }}</div>
                        <small class="badge role-badge" :class="getRoleBadgeClass(log.userRole)">{{ formatUserRole(log.userRole) }}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge" :class="getActionBadgeClass(log.actionType)">
                      {{ log.displayAction }}
                    </span>
                  </td>
                  <td>{{ formatDateOnly(log.timestamp) }}</td>
                  <td>{{ formatTimeOnly(log.timestamp) }}</td>
                  <td>
                    <router-link 
                      class="btn btn-outline-info btn-sm"
                      :to="{ name: 'ActivityLogDetails', params: { id: log.id } }"
                      title="View Details"
                      @click="prefetchDetails(log)"
                    >
                      <i class="bi bi-eye"></i>
                    </router-link>
                  </td>
                </tr>
                <tr v-if="logs.length === 0">
                  <td colspan="5" class="text-center text-muted py-4">
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
  <div v-if="showClearModal" class="modal-backdrop fade show"></div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useActivityLogStore } from '@/stores/activityLogStore'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import api from '@/services/api'
import DateInput from '@/components/ui/form/DateInput.vue'
import { formatPHDate, formatPHDateTime, utcToPH, nowPH, getPHDateKey } from '@/utils/dateUtils'

// Reactive data
const loading = ref(true)
const clearing = ref(false)
const logs = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10) // Set to 10 items per page as requested
const totalItems = ref(0)
const totalPages = ref(0)
const activityLogStore = useActivityLogStore()
const router = useRouter()

// Date picker refs

// Modal states
const showClearModal = ref(false)
const clearLogsAge = ref('90')

// Filters
const filters = ref({
  dateRange: 'all',
  fromDate: '',
  toDate: '',
  actionType: '',
  userRole: ''
})

// Computed properties

// Helper: get YYYY-MM-DD string in Asia/Manila for day comparisons
// Note: getPHDateKey is now imported from dateUtils

const stats = computed(() => ({
  totalLogs: totalItems.value,
  todayLogs: logs.value.filter(log => {
    const todayPH = getPHDateKey(nowPH().toDate())
    return getPHDateKey(log.timestamp) === todayPH
  }).length,
  activeUsers: new Set(logs.value.map(log => log.userId)).size,
  failedActions: logs.value.filter(log => log.status === 'failed').length
}))
// Prefetch selected log into store so details can render immediately/fallback
const prefetchDetails = (log) => {
  try {
    activityLogStore.setSelectedLog(log)
    // fallback for new-tab opens where click handler may not run in target tab
    try {
      localStorage.setItem('activityLog:selected', JSON.stringify(log))
    } catch {}
  } catch (e) {
    // no-op
  }
}

// Methods
// Normalize action into a canonical type and a display label
const deriveAction = (raw) => {
  const s = String(raw || '').toLowerCase().trim()
  const includes = (k) => s.includes(k)
  // Canonical buckets
  if (s === 'login' || includes('log in') || includes('signin') || includes('sign in')) {
    return { type: 'login', label: 'Login' }
  }
  if (s === 'logout' || includes('log out') || includes('signout') || includes('sign out')) {
    return { type: 'logout', label: 'Logout' }
  }
  if (s === 'create' || includes('add') || includes('insert') || includes('register') || includes('new ')) {
    return { type: 'create', label: 'Create' }
  }
  if (s === 'update' || includes('edit') || includes('modify') || includes('change')) {
    return { type: 'update', label: 'Update' }
  }
  if (s === 'delete' || includes('remove') || includes('destroy')) {
    return { type: 'delete', label: 'Delete' }
  }
  if (s === 'view' || includes('read') || includes('open') || includes('viewed')) {
    return { type: 'view', label: 'View' }
  }
  // Messaging/notification flavored actions
  if (includes('send') || includes('sent') || includes('message')) {
    return { type: 'send', label: 'Send Message' }
  }
  if (includes('deliver') || includes('delivered')) {
    return { type: 'deliver', label: 'Delivery' }
  }
  if (includes('notify') || includes('notification') || includes('broadcast')) {
    return { type: 'notify', label: 'Notification' }
  }
  // Fallback: Title Case
  const title = s
    .replace(/[\-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return { type: 'other', label: title || 'Unknown' }
}
// Extract a robust timestamp from various possible fields and formats
const extractTimestamp = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  const candidates = [
    raw.timestamp,
    raw.created_at, raw.createdAt,
    raw.occurred_at, raw.occurredAt,
    raw.logged_at, raw.loggedAt,
    raw.datetime, raw.date_time,
    raw.event_time, raw.action_time,
    raw.time, raw.date,
    raw.ts,
    // sometimes stored inside metadata/additional_data
    (raw.metadata && (raw.metadata.timestamp || raw.metadata.time || raw.metadata.date)) || null,
    (raw.additional_data && (raw.additional_data.timestamp || raw.additional_data.time || raw.additional_data.date)) || null
  ]

  for (const val of candidates) {
    if (val === undefined || val === null || val === '') continue
    // numeric epoch seconds/ms
    if (typeof val === 'number') {
      const ms = val < 1e12 ? val * 1000 : val
      const d = new Date(ms)
      if (!isNaN(d.getTime())) return d
      continue
    }
    if (typeof val === 'string') {
      const v = val.trim()
      if (!v) continue
      // pure digits
      if (/^\d{10,13}$/.test(v)) {
        const num = Number(v)
        const ms = num < 1e12 ? num * 1000 : num
        const d = new Date(ms)
        if (!isNaN(d.getTime())) return d
        continue
      }
      const d = new Date(v)
      if (!isNaN(d.getTime())) return d
    }
    // Date object
    if (val instanceof Date && !isNaN(val.getTime())) return val
  }
  return null
}

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

    // Compute accurate date bounds in PH timezone and send as UTC ISO strings
    // Backend will honor explicit from/to regardless of date_range
    const todayPH = nowPH()
    if (filters.value.dateRange === 'today') {
      params.from_date = todayPH.clone().startOf('day').format('YYYY-MM-DD HH:mm:ss')
      params.to_date = todayPH.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    } else if (filters.value.dateRange === 'week') {
      // Ensure week starts on Sunday explicitly
      const sundayOffset = todayPH.day() // 0 = Sunday
      const weekStart = todayPH.clone().subtract(sundayOffset, 'days').startOf('day')
      params.from_date = weekStart.format('YYYY-MM-DD HH:mm:ss')
      params.to_date = todayPH.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    } else if (filters.value.dateRange === 'month') {
      const monthStart = todayPH.clone().startOf('month')
      params.from_date = monthStart.clone().startOf('day').format('YYYY-MM-DD HH:mm:ss')
      params.to_date = todayPH.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    } else if (filters.value.dateRange === 'custom') {
      if (filters.value.fromDate) {
        params.from_date = `${String(filters.value.fromDate)} 00:00:00`
      }
      if (filters.value.toDate) {
        params.to_date = `${String(filters.value.toDate)} 23:59:59`
      }
    }

    const response = await api.get('/activity-logs', { params })
    const result = response.data.data || response.data
    
    // Handle the backend response structure properly
    if (result.items) {
      // Backend returns { items: [], totalCount: number, page: number, limit: number, totalPages: number }
      logs.value = result.items.map(log => {
        const actionTypeRaw = log.action_type || log.action || log.actionName || log.event || log.display_action || log.description
        const actionNorm = deriveAction(actionTypeRaw)
        return {
        id: log.log_id || log.id || log.activity_id || log.audit_id || log.event_id,
        timestamp: extractTimestamp(log),
        userId: log.user_id,
        userFullName: log.display_user_name || log.user_fullname || log.username || 'Unknown User',
  userRole: log.user_role || 'System',
        actionType: actionNorm.type,
        displayAction: actionNorm.label,
        resource: log.resource || log.table_name || 'System',
        ipAddress: log.ip_address || 'N/A',
        status: log.status || (log.success ? 'success' : 'failed'),
        userAgent: log.user_agent,
        description: log.full_description || log.details,
        metadata: log.metadata || log.additional_data
        }
      })

      totalItems.value = result.totalCount
      totalPages.value = result.totalPages
    } else {
      // Fallback for other response formats
      const logsArray = Array.isArray(result) ? result : result.data || []
      logs.value = logsArray.map(log => {
        const actionTypeRaw = log.action_type || log.action || log.actionName || log.event || log.display_action || log.description
        const actionNorm = deriveAction(actionTypeRaw)
        return {
        id: log.log_id || log.id || log.activity_id || log.audit_id || log.event_id,
        timestamp: extractTimestamp(log),
        userId: log.user_id,
        userFullName: log.display_user_name || log.user_fullname || log.username || 'Unknown User',
  userRole: log.user_role || 'System',
        actionType: actionNorm.type,
        displayAction: actionNorm.label,
        resource: log.resource || log.table_name || 'System',
        ipAddress: log.ip_address || 'N/A',
        status: log.status || (log.success ? 'success' : 'failed'),
        userAgent: log.user_agent,
        description: log.full_description || log.details,
        metadata: log.metadata || log.additional_data
        }
      })

  const totalCount = (result.totalCount ?? result.total) ?? logs.value.length
  totalItems.value = Number(totalCount)
  totalPages.value = Math.ceil((Number(totalCount) || 0) / Number(itemsPerPage.value))
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

// Details view now navigates via router-link in template

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
    
    // Mirror the same date-range calculations used in list fetch
    const todayPH = nowPH()
    if (filters.value.dateRange === 'today') {
      params.from_date = todayPH.clone().startOf('day').format('YYYY-MM-DD HH:mm:ss')
      params.to_date = todayPH.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    } else if (filters.value.dateRange === 'week') {
      const sundayOffset = todayPH.day()
      const weekStart = todayPH.clone().subtract(sundayOffset, 'days').startOf('day')
      params.from_date = weekStart.format('YYYY-MM-DD HH:mm:ss')
      params.to_date = todayPH.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    } else if (filters.value.dateRange === 'month') {
      const monthStart = todayPH.clone().startOf('month')
      params.from_date = monthStart.clone().startOf('day').format('YYYY-MM-DD HH:mm:ss')
      params.to_date = todayPH.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    } else if (filters.value.dateRange === 'custom') {
      if (filters.value.fromDate) {
        params.from_date = `${String(filters.value.fromDate)} 00:00:00`
      }
      if (filters.value.toDate) {
        params.to_date = `${String(filters.value.toDate)} 23:59:59`
      }
    }

    const response = await api.get('/activity-logs/export', { 
      params,
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `activity-logs-${formatPHDate(nowPH().toDate(), 'YYYY-MM-DD')}.csv`)
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
  return formatPHDateTime(date)
}

const formatDateOnly = (date) => {
  if (!date) return '-'
  return formatPHDate(date, 'MMM DD, YYYY')
}

const formatTimeOnly = (date) => {
  if (!date) return '-'
  return formatPHDate(date, 'hh:mm A')
}

const convertToISODate = (dateValue) => {
  if (!dateValue) return ''
  return formatPHDate(dateValue, 'YYYY-MM-DD')
}

// DateInput handles formatting and picker; we'll watch for changes to apply filters

const formatUserRole = (role) => {
  if (!role) return 'Unknown'
  const roleStr = String(role).toLowerCase()
  if (roleStr === 'admin') return 'Admin'
  if (roleStr === 'health_worker' || roleStr === 'healthworker' || roleStr === 'health_staff' || roleStr === 'healthstaff' || roleStr === 'health staff') return 'Health Staff'
  if (roleStr === 'parent' || roleStr === 'guardian') return 'Guardian'
  return role
}

const getRoleIcon = (role) => {
  const roleStr = String(role).toLowerCase()
  if (roleStr === 'admin') return 'bi bi-shield-fill-check fs-5'
  if (roleStr === 'health_worker' || roleStr === 'healthworker' || roleStr === 'health_staff' || roleStr === 'healthstaff' || roleStr === 'health staff') return 'bi bi-person-lines-fill fs-5'
  if (roleStr === 'parent' || roleStr === 'guardian') return 'bi bi-person-hearts fs-5'
  if (roleStr === 'system') return 'bi bi-gear-fill fs-5'
  return 'bi bi-person-circle fs-5'
}

const getRoleColor = (role) => {
  const roleStr = String(role).toLowerCase()
  if (roleStr === 'admin') return '#601fc2'
  if (roleStr === 'health_worker' || roleStr === 'healthworker' || roleStr === 'health_staff' || roleStr === 'healthstaff' || roleStr === 'health staff') return '#00b2e3'
  if (roleStr === 'parent' || roleStr === 'guardian') return '#bc4e1e'
  if (roleStr === 'system') return '#ff3a3a'
  return '#6c757d'
}

const getRoleBadgeClass = (role) => {
  const roleStr = String(role).toLowerCase().replace(/[-\s]+/g, '_')
  if (roleStr === 'admin') return 'role-admin'
  if (roleStr === 'parent' || roleStr === 'guardian') return 'role-parent'
  if (roleStr === 'system') return 'role-system'
  if (roleStr === 'health_worker' || roleStr === 'healthworker' || roleStr === 'health_staff' || roleStr === 'healthstaff') return 'role-healthstaff'
  return 'role-system'
}

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