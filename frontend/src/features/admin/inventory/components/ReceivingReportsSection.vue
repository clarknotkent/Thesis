<template>
  <div class="receiving-reports-section">
    <!-- Header Section -->
    <div class="mb-3">
      <h5 class="mb-0">
        <i class="bi bi-box-seam me-2" />Receiving Reports
      </h5>
    </div>

    <!-- Search and Filter Section -->
    <div class="d-flex justify-content-between align-items-center mb-3 gap-3">
      <div class="d-flex gap-2 align-items-center flex-grow-1">
        <!-- Search Bar -->
        <div
          class="input-group"
          style="max-width: 300px;"
        >
          <input 
            v-model="searchTerm" 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="Search RR-..."
            @input="applyFilters"
          >
          <button
            class="btn btn-sm btn-outline-primary"
            type="button"
          >
            <i class="bi bi-search" />
          </button>
        </div>
        
        <!-- Status Filter -->
        <div class="dropdown">
          <button
            id="statusFilter"
            class="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            @click="debugDropdown('status')"
          >
            {{ currentStatusFilter }}
          </button>
          <ul
            class="dropdown-menu"
            aria-labelledby="statusFilter"
          >
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setStatusFilter('All Status')"
              >All Status</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setStatusFilter('COMPLETED')"
              >Completed</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setStatusFilter('DRAFT')"
              >Draft</a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="setStatusFilter('CANCELLED')"
              >Cancelled</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex gap-2 align-items-center">
        <button
          class="btn btn-sm btn-outline-primary"
          @click="refreshData"
        >
          <i class="bi bi-arrow-clockwise me-1" />Refresh
        </button>
        <button
          class="btn btn-sm btn-primary"
          :disabled="isOffline"
          :title="isOffline ? 'Not available offline' : 'New Report'"
          @click="handleNewReportClick"
        >
          <i class="bi bi-plus-circle me-1" />New Report
        </button>
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
        <span class="visually-hidden">Loading receiving reports...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!reports || reports.length === 0"
      class="text-center py-5"
    >
      <i
        class="bi bi-inbox text-muted"
        style="font-size: 3rem;"
      />
      <p class="text-muted mt-3">
        No receiving reports found
      </p>
      <button
        class="btn btn-primary"
        @click="createNew"
      >
        <i class="bi bi-plus-circle me-2" />Create First Report
      </button>
    </div>

    <!-- Reports Table -->
    <div
      v-else
      class="table-responsive"
    >
      <table class="table table-hover table-bordered">
        <thead class="table-light">
          <tr>
            <th class="text-center">
              Report #
            </th>
            <th class="text-center">
              Delivery Date
            </th>
            <th class="text-center">
              Delivered By
            </th>
            <th class="text-center">
              Received By
            </th>
            <th class="text-center">
              Total Items
            </th>
            <th class="text-center">
              Total Qty
            </th>
            <th class="text-center">
              Status
            </th>
            <th class="text-center">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="report in paginatedReports"
            :key="report.id"
          >
            <td class="text-center align-middle fw-semibold">
              {{ report.report_number || '—' }}
            </td>
            <td class="text-center align-middle">
              {{ formatDate(report.delivery_date) }}
            </td>
            <td class="text-center align-middle">
              {{ report.delivered_by || '—' }}
            </td>
            <td class="text-center align-middle">
              {{ report.received_by || '—' }}
            </td>
            <td class="text-center align-middle">
              {{ report.total_items || 0 }}
            </td>
            <td class="text-center align-middle">
              {{ report.total_qty || 0 }}
            </td>
            <td class="text-center align-middle">
              <span
                class="badge"
                :class="getStatusBadgeClass(report.status)"
              >
                {{ report.status || 'COMPLETED' }}
              </span>
            </td>
            <td class="text-center align-middle">
              <button
                class="btn btn-sm btn-outline-primary"
                title="View Details"
                @click="viewReport(report)"
              >
                <i class="bi bi-eye me-1" />View
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Footer -->
      <div class="pagination-footer border-top mt-3 pt-3">
        <AppPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="filteredReports.length"
          :items-per-page="itemsPerPage"
          @page-changed="changePage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'
import AppPagination from '@/components/ui/base/AppPagination.vue'

const router = useRouter()
const { addToast } = useToast()
const { fetchReceivingReports } = useOfflineAdmin()

const emit = defineEmits(['refresh'])

const loading = ref(true)
const reports = ref([])
const searchTerm = ref('')
const currentStatusFilter = ref('All Status')
const currentPage = ref(1)
const itemsPerPage = 7
const isOffline = ref(!navigator.onLine)

// Filtered reports based on search and status
const filteredReports = computed(() => {
  let filtered = reports.value

  // Filter by search term
  if (searchTerm.value.trim()) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(report => 
      (report.report_number || '').toLowerCase().includes(search) ||
      (report.received_by || '').toLowerCase().includes(search) ||
      (report.delivered_by || '').toLowerCase().includes(search)
    )
  }

  // Filter by status
  if (currentStatusFilter.value !== 'All Status') {
    filtered = filtered.filter(report => 
      (report.status || 'COMPLETED') === currentStatusFilter.value
    )
  }

  return filtered
})

// Paginated reports
const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredReports.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredReports.value.length / itemsPerPage))

const setStatusFilter = (status) => {
  currentStatusFilter.value = status
  currentPage.value = 1
  closeDropdown('status')
}

const applyFilters = () => {
  currentPage.value = 1
}

// Debug dropdown clicks
const debugDropdown = (type) => {
  console.log(`Dropdown ${type} clicked`)
  const button = document.getElementById(`${type}Filter`) || document.getElementById(`${type}Dropdown`)
  if (button) {
    console.log(`Button found:`, button)
    console.log(`Button classes:`, button.className)
    console.log(`Button data-bs-toggle:`, button.getAttribute('data-bs-toggle'))
    
    // Try to manually toggle the dropdown
    const menu = button.nextElementSibling
    if (menu && menu.classList.contains('dropdown-menu')) {
      console.log('Found dropdown menu, toggling visibility')
      menu.classList.toggle('show')
      button.setAttribute('aria-expanded', menu.classList.contains('show'))
    }
  }
}

// Close dropdown menu
const closeDropdown = (type) => {
  const button = document.getElementById(`${type}Filter`) || document.getElementById(`${type}Dropdown`)
  if (button) {
    const menu = button.nextElementSibling
    if (menu && menu.classList.contains('dropdown-menu')) {
      menu.classList.remove('show')
      button.setAttribute('aria-expanded', 'false')
    }
  }
}

onMounted(() => {
  loadReports()
  
  // Add online/offline event listeners
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

// Online/Offline event listeners
const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine
}

// Handle new report button click
const handleNewReportClick = () => {
  if (isOffline.value) {
    addToast({
      title: 'Feature Unavailable Offline',
      message: 'Creating new receiving reports requires an internet connection',
      type: 'warning',
      timeout: 4000
    })
  } else {
    createNew()
  }
}

// Cleanup event listeners on unmount
onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})

const loadReports = async () => {
  try {
    loading.value = true
    const response = await fetchReceivingReports()
    
    console.log('Receiving reports response:', response.data)
    
    // Handle different response structures
    const rawData = response.data?.data || response.data
    let items = []
    
    if (Array.isArray(rawData)) {
      items = rawData
    } else if (rawData.items && Array.isArray(rawData.items)) {
      items = rawData.items
    }
    
    // Map the reports to expected format
    reports.value = items.map(r => ({
      id: r.report_id || r.id,
      report_number: r.report_number || r.id || '—',
      delivery_date: r.delivery_date || r.date_received || r.created_at,
      delivered_by: r.delivered_by || r.supplier || '—',
      received_by: r.received_by_name || r.received_by || '—',
      total_items: r.total_items || 0,
      total_qty: r.total_quantity || r.quantity || 0,
      status: r.status || 'COMPLETED'
    }))
    
    console.log('Mapped reports:', reports.value)
  } catch (error) {
    console.error('Error loading receiving reports:', error)
    addToast({ message: 'Failed to load receiving reports', type: 'error' })
    reports.value = []
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadReports()
  emit('refresh')
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
}

const getStatusBadgeClass = (status) => {
  const statusUpper = (status || '').toUpperCase()
  switch (statusUpper) {
    case 'COMPLETED':
      return 'bg-success'
    case 'DRAFT':
      return 'bg-secondary'
    case 'CANCELLED':
      return 'bg-danger'
    case 'PENDING':
      return 'bg-warning text-dark'
    default:
      return 'bg-info'
  }
}

const createNew = () => {
  router.push({ name: 'ReceivingReportNew' })
}

const viewReport = (report) => {
  router.push({ name: 'ReceivingReportView', params: { id: report.id } })
}
</script>

<style scoped>
.table {
  margin-bottom: 0;
}

code {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  background-color: #f8f9fa;
  border-radius: 0.25rem;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.pagination-footer {
  padding: 1rem 0;
  background-color: transparent;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: center;
}
</style>
