<template>
  <div class="message-logs">
    <!-- Section Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">
        <i class="bi bi-list-ul me-2"></i>SMS Message Logs
      </h5>
    </div>

    <!-- Search and Filters Row -->
    <div class="row mb-3 align-items-center g-2">
      <div class="col-md-3">
        <div class="input-group input-group-sm">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search messages..."
            v-model="searchQuery"
          >
          <button class="btn btn-outline-secondary" type="button">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>
      <div class="col-md-2">
        <select class="form-select form-select-sm" v-model="filterStatus">
          <option value="">Status: All</option>
          <option value="sent">Sent</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div class="col-md-2">
        <select class="form-select form-select-sm" v-model="filterType">
          <option value="">Type: All</option>
          <option value="1-week">1 Week</option>
          <option value="3-days">3 Days</option>
          <option value="1-day">1 Day</option>
          <option value="manual">Manual</option>
        </select>
      </div>
      <div class="col-md-2">
        <input type="date" class="form-control form-control-sm" v-model="filterDate" placeholder="Date">
      </div>
      <div class="col-md-3 text-end">
        <button class="btn btn-outline-primary btn-sm me-2" @click="loadLogs">
          <i class="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
        <button class="btn btn-warning btn-sm">
          <i class="bi bi-pencil-square me-1"></i>Send Manual SMS
        </button>
      </div>
    </div>

    <!-- Messages Table -->
    <div class="table-responsive">
      <table class="table table-sm table-hover table-bordered align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="text-center">Date & Time</th>
            <th>Recipient</th>
            <th>Patient</th>
            <th class="text-center">Phone Number</th>
            <th>Message</th>
            <th class="text-center">Type</th>
            <th class="text-center">Status</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredLogs.length === 0">
            <td colspan="8" class="text-center text-muted py-4">
              <i class="bi bi-inbox fs-3 d-block mb-2"></i>
              No messages found
            </td>
          </tr>
          <tr v-else v-for="log in paginatedLogs" :key="log.id">
            <td class="text-center">
              <small class="text-muted">{{ formatDateTime(log.sent_at) }}</small>
            </td>
            <td>{{ log.recipient_name }}</td>
            <td>{{ log.patient_name }}</td>
            <td class="text-center">
              <span class="font-monospace text-muted" style="font-size: 0.85rem;">{{ log.phone_number }}</span>
            </td>
            <td>
              <small>{{ truncateMessage(log.message, 60) }}</small>
            </td>
            <td class="text-center">
              <span class="badge rounded-pill" :class="getTypeBadgeClass(log.type)" style="font-size: 0.7rem; padding: 0.35em 0.65em;">
                {{ formatType(log.type) }}
              </span>
            </td>
            <td class="text-center">
              <span class="badge rounded-pill" :class="getStatusBadgeClass(log.status)" style="font-size: 0.7rem; padding: 0.35em 0.65em;">
                {{ log.status }}
              </span>
            </td>
            <td class="text-center">
              <button 
                class="btn btn-sm btn-outline-primary"
                @click="viewMessage(log)"
                style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
              >
                <i class="bi bi-eye me-1"></i>View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="d-flex justify-content-center align-items-center mt-3 pt-3 border-top">
      <nav>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="currentPage > 1 && currentPage--">
              <i class="bi bi-chevron-left"></i> Previous
            </a>
          </li>
          <li 
            v-for="page in visiblePages" 
            :key="page"
            class="page-item"
            :class="{ active: currentPage === page }"
          >
            <a class="page-link" href="#" @click.prevent="currentPage = page">{{ page }}</a>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <a class="page-link" href="#" @click.prevent="currentPage < totalPages && currentPage++">
              Next <i class="bi bi-chevron-right"></i>
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Entry count -->
    <div class="text-center text-muted mt-2" style="font-size: 0.875rem;">
      Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ filteredLogs.length }} entries
    </div>

    <!-- Message Details Modal -->
    <div 
      class="modal fade" 
      id="messageDetailsModal" 
      tabindex="-1" 
      ref="messageModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" v-if="selectedMessage">
          <div class="modal-header bg-light">
            <h5 class="modal-title">
              <i class="bi bi-chat-dots me-2"></i>Message Details
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-6">
                <label class="text-muted small mb-1">Recipient</label>
                <div class="fw-semibold">{{ selectedMessage.recipient_name }}</div>
              </div>
              <div class="col-6">
                <label class="text-muted small mb-1">Patient</label>
                <div>{{ selectedMessage.patient_name }}</div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="text-muted small mb-1">Phone Number</label>
                <div class="font-monospace">{{ selectedMessage.phone_number }}</div>
              </div>
              <div class="col-6">
                <label class="text-muted small mb-1">Date Sent</label>
                <div>{{ formatDateTime(selectedMessage.sent_at) }}</div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="text-muted small mb-1">Message Type</label>
                <div>
                  <span class="badge rounded-pill" :class="getTypeBadgeClass(selectedMessage.type)">
                    {{ formatType(selectedMessage.type) }}
                  </span>
                </div>
              </div>
              <div class="col-6">
                <label class="text-muted small mb-1">Status</label>
                <div>
                  <span class="badge rounded-pill" :class="getStatusBadgeClass(selectedMessage.status)">
                    {{ selectedMessage.status }}
                  </span>
                </div>
              </div>
            </div>
            <div class="mb-3">
              <label class="text-muted small mb-1">Message Content</label>
              <div class="border rounded p-3 bg-light" style="font-size: 0.95rem;">
                {{ selectedMessage.message }}
              </div>
              <small class="text-muted">{{ selectedMessage.message.length }} characters</small>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Modal } from 'bootstrap'

// State
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const filterType = ref('')
const filterDate = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const selectedMessage = ref(null)
const messageModal = ref(null)

// Sample data (replace with API call)
const logs = ref([
  {
    id: 1,
    sent_at: '2025-10-26T14:30:00',
    recipient_name: 'Mr. Juan Dela Cruz',
    patient_name: 'Maria Dela Cruz',
    phone_number: '+639171234567',
    message: 'Good Day, Mr. Dela Cruz. Your child, Maria, is scheduled for vaccination on October 28, 2025 for BCG Dose 1.',
    type: '1-day',
    status: 'sent'
  },
  {
    id: 2,
    sent_at: '2025-10-26T09:15:00',
    recipient_name: 'Ms. Ana Santos',
    patient_name: 'Pedro Santos',
    phone_number: '+639281234567',
    message: 'Good Day, Ms. Santos. Your child, Pedro, is scheduled for vaccination on November 2, 2025 for DPT-HiB-HepB Dose 2.',
    type: '1-week',
    status: 'sent'
  },
  {
    id: 3,
    sent_at: '2025-10-26T16:45:00',
    recipient_name: 'Mr. Carlos Reyes',
    patient_name: 'Sofia Reyes',
    phone_number: '+639391234567',
    message: 'Good Evening, Mr. Reyes. Your child, Sofia, is scheduled for vaccination on October 29, 2025 for MMR Dose 1.',
    type: '3-days',
    status: 'pending'
  },
  {
    id: 4,
    sent_at: '2025-10-25T10:20:00',
    recipient_name: 'Ms. Linda Garcia',
    patient_name: 'Miguel Garcia',
    phone_number: '+639451234567',
    message: 'Good Day, Ms. Garcia. Your child, Miguel, is scheduled for vaccination on November 1, 2025 for OPV Dose 3.',
    type: '1-week',
    status: 'sent'
  },
  {
    id: 5,
    sent_at: '2025-10-25T15:00:00',
    recipient_name: 'Mr. Roberto Cruz',
    patient_name: 'Anna Cruz',
    phone_number: '+639561234567',
    message: 'Good Day, Mr. Cruz. Your child, Anna, is scheduled for vaccination on October 26, 2025 for Measles Dose 1.',
    type: '1-day',
    status: 'failed'
  }
])

// Computed
const filteredLogs = computed(() => {
  let result = logs.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(log => 
      log.recipient_name.toLowerCase().includes(query) ||
      log.patient_name.toLowerCase().includes(query) ||
      log.phone_number.includes(query) ||
      log.message.toLowerCase().includes(query)
    )
  }

  if (filterStatus.value) {
    result = result.filter(log => log.status === filterStatus.value)
  }

  if (filterType.value) {
    result = result.filter(log => log.type === filterType.value)
  }

  if (filterDate.value) {
    result = result.filter(log => log.sent_at.startsWith(filterDate.value))
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / itemsPerPage.value))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, filteredLogs.value.length))

const paginatedLogs = computed(() => {
  return filteredLogs.value.slice(startIndex.value, endIndex.value)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Methods
const loadLogs = () => {
  loading.value = true
  // TODO: Fetch logs from API
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const truncateMessage = (message, length = 60) => {
  return message.length > length ? message.substring(0, length) + '...' : message
}

const formatType = (type) => {
  const types = {
    '1-week': '1 Week',
    '3-days': '3 Days',
    '1-day': '1 Day',
    'manual': 'Manual'
  }
  return types[type] || type
}

const getTypeBadgeClass = (type) => {
  const classes = {
    '1-week': 'bg-info text-dark',
    '3-days': 'bg-warning text-dark',
    '1-day': 'bg-danger',
    'manual': 'bg-secondary'
  }
  return classes[type] || 'bg-secondary'
}

const getStatusBadgeClass = (status) => {
  const classes = {
    'sent': 'bg-success',
    'pending': 'bg-warning text-dark',
    'failed': 'bg-danger'
  }
  return classes[status] || 'bg-secondary'
}

const viewMessage = (log) => {
  selectedMessage.value = log
  const modal = new Modal(messageModal.value)
  modal.show()
}

// Lifecycle
onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.font-monospace {
  font-family: 'Courier New', Courier, monospace;
}

.table {
  font-size: 0.875rem;
  border-collapse: collapse;
}

.table-bordered {
  border: 1px solid #e3e6f0;
}

.table-bordered th,
.table-bordered td {
  border: 1px solid #e3e6f0;
}

.table th {
  font-weight: 600;
  color: #5a5c69;
  background-color: #f8f9fc;
  border-bottom: 2px solid #e3e6f0;
  padding: 0.75rem 0.5rem;
  white-space: nowrap;
}

.table td {
  padding: 0.75rem 0.5rem;
  vertical-align: middle;
  background-color: #fff;
}

.table-hover tbody tr:hover td {
  background-color: #f8f9fc;
}

.table-light {
  background-color: #f8f9fc;
}

.pagination {
  --bs-pagination-active-bg: #4e73df;
  --bs-pagination-active-border-color: #4e73df;
}
</style>
