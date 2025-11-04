<template>
  <div class="auto-send-settings">
    <!-- Section Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">
        <i class="bi bi-gear me-2"></i>Auto-Send Settings
      </h5>
    </div>

    <!-- Important Reminders -->
    <div class="alert alert-warning mb-3">
      <div class="d-flex align-items-start">
        <i class="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
        <div>
          <strong>Important Reminders:</strong>
          <ul class="mb-0 mt-2 small">
            <li>SMS costs apply for each message sent. Monitor your usage to control expenses.</li>
            <li>Guardians with disabled auto-send will not receive automated vaccination reminders.</li>
            <li>Messages are sent based on the configured templates and schedules (1 week, 3 days, 1 day before).</li>
            <li>Ensure guardian phone numbers are correct to avoid failed deliveries.</li>
          </ul>
        </div>
      </div>
    </div>

        <!-- Master Toggle -->
        <div class="alert alert-info d-flex align-items-start mb-4">
          <i class="bi bi-info-circle fs-4 me-3"></i>
          <div class="flex-grow-1">
            <h6 class="alert-heading">About Auto-Send</h6>
            <p class="mb-0 small">
              Enabling auto-send will automatically trigger SMS reminders based on vaccination schedules. 
              SMS costs will apply for each message sent. You can enable/disable per guardian to control costs.
            </p>
          </div>
        </div>

        <!-- Global Settings -->
        <div class="card border mb-4">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col">
                <h6 class="mb-1">
                  <i class="bi bi-toggle-on me-2 text-primary"></i>
                  Global Auto-Send
                </h6>
                <small class="text-muted">
                  Master switch for all automated SMS reminders
                </small>
              </div>
              <div class="col-auto">
                <div class="form-check form-switch">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="globalAutoSend"
                    v-model="globalSettings.enabled"
                    @change="toggleGlobalAutoSend"
                    style="width: 3em; height: 1.5em;"
                  >
                  <label class="form-check-label ms-2" for="globalAutoSend">
                    <strong :class="globalSettings.enabled ? 'text-success' : 'text-danger'">
                      {{ globalSettings.enabled ? 'Enabled' : 'Disabled' }}
                    </strong>
                  </label>
                </div>
              </div>
            </div>

            <div v-if="globalSettings.enabled" class="mt-3 pt-3 border-top">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small text-muted">Default Send Time</label>
                  <select class="form-select" v-model="globalSettings.default_time">
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label small text-muted">Max Messages Per Day</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    v-model="globalSettings.max_per_day"
                    min="1"
                    max="100"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="row g-3 mb-3">
          <div class="col-md-3">
            <div class="card border-start border-primary border-3 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="d-flex align-items-center">
                  <div class="flex-grow-1">
                    <div class="text-xs fw-bold text-primary text-uppercase mb-1">Total Guardians</div>
                    <div class="h4 mb-0 fw-bold text-gray-800">{{ stats.total_guardians }}</div>
                  </div>
                  <div class="text-primary" style="font-size: 2.5rem;">
                    <i class="bi bi-people"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-start border-success border-3 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="d-flex align-items-center">
                  <div class="flex-grow-1">
                    <div class="text-xs fw-bold text-success text-uppercase mb-1">Auto-Send Enabled</div>
                    <div class="h4 mb-0 fw-bold text-gray-800">{{ stats.enabled }}</div>
                  </div>
                  <div class="text-success" style="font-size: 2.5rem;">
                    <i class="bi bi-check-circle"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-start border-warning border-3 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="d-flex align-items-center">
                  <div class="flex-grow-1">
                    <div class="text-xs fw-bold text-warning text-uppercase mb-1">Auto-Send Disabled</div>
                    <div class="h4 mb-0 fw-bold text-gray-800">{{ stats.disabled }}</div>
                  </div>
                  <div class="text-warning" style="font-size: 2.5rem;">
                    <i class="bi bi-x-circle"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-start border-info border-3 shadow-sm h-100">
              <div class="card-body py-3">
                <div class="d-flex align-items-center">
                  <div class="flex-grow-1">
                    <div class="text-xs fw-bold text-info text-uppercase mb-1">Pending Messages</div>
                    <div class="h4 mb-0 fw-bold text-gray-800">{{ stats.pending_messages }}</div>
                  </div>
                  <div class="text-info" style="font-size: 2.5rem;">
                    <i class="bi bi-clock-history"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Guardian Auto-Send Settings -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">
            <i class="bi bi-list-ul me-2"></i>Guardian Auto-Send Settings
          </h6>
        </div>

        <!-- Search and Filter Row -->
        <div class="row mb-3 align-items-center g-2">
          <div class="col-md-3">
            <div class="input-group input-group-sm">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Search guardians..."
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
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control form-control-sm" placeholder="Date">
          </div>
          <div class="col-md-5 text-end">
            <button 
              class="btn btn-outline-primary btn-sm me-2"
              @click="clearFilters"
            >
              <i class="bi bi-arrow-clockwise me-1"></i>Refresh
            </button>
            <button 
              class="btn btn-success btn-sm me-2"
              @click="bulkToggle(true)"
              :disabled="!globalSettings.enabled"
            >
              <i class="bi bi-check-all me-1"></i>Enable All
            </button>
            <button 
              class="btn btn-danger btn-sm"
              @click="bulkToggle(false)"
            >
              <i class="bi bi-x-lg me-1"></i>Disable All
            </button>
          </div>
        </div>

        <!-- Guardian Table -->
        <div class="table-responsive">
          <table class="table table-sm table-hover table-bordered align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="text-center" style="width: 50px;">
                  <input 
                    type="checkbox" 
                    class="form-check-input"
                    v-model="selectAll"
                    @change="toggleSelectAll"
                  >
                </th>
                <th>Guardian Name</th>
                <th class="text-center">Phone Number</th>
                <th class="text-center">Children</th>
                <th class="text-center">Pending Vaccines</th>
                <th class="text-center">Auto-Send</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="text-center py-4">
                  <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredGuardians.length === 0">
                <td colspan="7" class="text-center text-muted py-4">
                  <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                  No guardians found
                </td>
              </tr>
              <tr v-else v-for="guardian in paginatedGuardians" :key="guardian.id">
                <td class="text-center">
                  <input 
                    type="checkbox" 
                    class="form-check-input"
                    v-model="guardian.selected"
                  >
                </td>
                <td>
                  <div class="fw-semibold">{{ guardian.name }}</div>
                  <small class="text-muted">{{ guardian.relationship }}</small>
                </td>
                <td class="text-center">
                  <span class="font-monospace text-muted" style="font-size: 0.85rem;">{{ guardian.phone }}</span>
                </td>
                <td class="text-center">
                  <span class="badge rounded-pill bg-info" style="font-size: 0.7rem; padding: 0.35em 0.65em;">{{ guardian.children_count }}</span>
                </td>
                <td class="text-center">
                  <span class="badge rounded-pill bg-warning" style="font-size: 0.7rem; padding: 0.35em 0.65em;">{{ guardian.pending_vaccines }}</span>
                </td>
                <td class="text-center">
                  <div class="form-check form-switch d-inline-block">
                    <input 
                      class="form-check-input" 
                      type="checkbox"
                      :id="`auto-${guardian.id}`"
                      v-model="guardian.auto_send_enabled"
                      @change="toggleGuardianAutoSend(guardian)"
                    >
                    <label class="form-check-label" :for="`auto-${guardian.id}`">
                      <small :class="guardian.auto_send_enabled ? 'text-success fw-semibold' : 'text-muted'">
                        {{ guardian.auto_send_enabled ? 'On' : 'Off' }}
                      </small>
                    </label>
                  </div>
                </td>
                <td class="text-center">
                  <button 
                    class="btn btn-sm btn-outline-primary"
                    @click="viewGuardianDetails(guardian)"
                    title="View Details"
                  >
                    <i class="bi bi-eye"></i>
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
                v-for="page in totalPages" 
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
          Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ filteredGuardians.length }} entries
        </div>
  </div>

  <!-- Guardian Details Modal -->
  <div 
    class="modal fade" 
    :class="{ show: showDetailsModal }" 
    :style="{ display: showDetailsModal ? 'block' : 'none' }" 
    tabindex="-1"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-person-circle me-2"></i>Guardian Details
          </h5>
          <button type="button" class="btn-close" @click="showDetailsModal = false"></button>
        </div>
        <div class="modal-body" v-if="selectedGuardian">
          <div class="row g-3">
            <!-- Basic Info -->
            <div class="col-12">
              <h6 class="text-primary mb-3">
                <i class="bi bi-info-circle me-2"></i>Basic Information
              </h6>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold small text-muted">Name</label>
              <div class="fs-6">{{ selectedGuardian.name || '—' }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold small text-muted">Phone Number</label>
              <div class="fs-6">{{ selectedGuardian.phone || '—' }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold small text-muted">Number of Children</label>
              <div class="fs-6">
                <span class="badge bg-primary">{{ selectedGuardian.children_count || 0 }}</span>
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold small text-muted">Auto-Send Status</label>
              <div class="fs-6">
                <span 
                  class="badge" 
                  :class="selectedGuardian.auto_send_enabled ? 'bg-success' : 'bg-secondary'"
                >
                  {{ selectedGuardian.auto_send_enabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </div>

            <!-- SMS History Summary -->
            <div class="col-12 mt-4">
              <h6 class="text-primary mb-3">
                <i class="bi bi-clock-history me-2"></i>SMS Activity
              </h6>
            </div>
            <div class="col-md-4">
              <div class="card bg-light border-0">
                <div class="card-body text-center py-2">
                  <div class="text-muted small">Total Sent</div>
                  <div class="fs-4 fw-bold text-primary">{{ guardianSMSHistory.total || 0 }}</div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-light border-0">
                <div class="card-body text-center py-2">
                  <div class="text-muted small">This Month</div>
                  <div class="fs-4 fw-bold text-info">{{ guardianSMSHistory.thisMonth || 0 }}</div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-light border-0">
                <div class="card-body text-center py-2">
                  <div class="text-muted small">Failed</div>
                  <div class="fs-4 fw-bold text-danger">{{ guardianSMSHistory.failed || 0 }}</div>
                </div>
              </div>
            </div>

            <!-- Recent Messages -->
            <div class="col-12 mt-4" v-if="guardianSMSHistory.recent && guardianSMSHistory.recent.length > 0">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="text-primary mb-0">
                  <i class="bi bi-chat-left-text me-2"></i>Recent Messages
                </h6>
                <small class="text-muted">Showing last 5 messages</small>
              </div>
              <div class="table-responsive">
                <table class="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th style="width: 180px;">Date</th>
                      <th>Message</th>
                      <th style="width: 100px;" class="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(msg, index) in guardianSMSHistory.recent.slice(0, 5)" :key="msg.id">
                      <td class="small">{{ formatDateTime(msg.sent_at) }}</td>
                      <td>
                        <div class="text-truncate" style="max-width: 350px;" :title="msg.message">
                          {{ msg.message }}
                        </div>
                      </td>
                      <td class="text-center">
                        <span 
                          class="badge" 
                          :class="{
                            'bg-success': msg.status === 'sent',
                            'bg-warning text-dark': msg.status === 'pending',
                            'bg-danger': msg.status === 'failed'
                          }"
                        >
                          {{ msg.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="col-12 mt-3" v-else>
              <div class="alert alert-info mb-0">
                <i class="bi bi-info-circle me-2"></i>No SMS history available for this guardian.
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showDetailsModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Backdrop -->
  <div v-if="showDetailsModal" class="modal-backdrop fade show" @click="showDetailsModal = false"></div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const { addToast } = useToast()

// State
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const selectAll = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showDetailsModal = ref(false)
const selectedGuardian = ref(null)
const guardianSMSHistory = ref({
  total: 0,
  thisMonth: 0,
  failed: 0,
  recent: []
})

const globalSettings = ref({
  enabled: false,
  default_time: '09:00',
  max_per_day: 50
})

const stats = ref({
  total_guardians: 0,
  enabled: 0,
  disabled: 0,
  pending_messages: 0
})

// Guardians data
const guardians = ref([])

// Computed
const filteredGuardians = computed(() => {
  let result = guardians.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(g => 
      g.name.toLowerCase().includes(query) ||
      g.phone.includes(query)
    )
  }

  if (filterStatus.value === 'enabled') {
    result = result.filter(g => g.auto_send_enabled)
  } else if (filterStatus.value === 'disabled') {
    result = result.filter(g => !g.auto_send_enabled)
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredGuardians.value.length / itemsPerPage.value))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, filteredGuardians.value.length))

const paginatedGuardians = computed(() => {
  return filteredGuardians.value.slice(startIndex.value, endIndex.value)
})

// Methods
const toggleGlobalAutoSend = () => {
  if (globalSettings.value.enabled) {
    addToast({ message: 'Global auto-send enabled. Configure individual guardians below.', type: 'success' })
  } else {
    addToast({ message: 'Global auto-send disabled. All automated messages stopped.', type: 'warning' })
  }
  updateStats()
}

const toggleGuardianAutoSend = async (guardian) => {
  try {
    await api.put(`/sms/guardians/${guardian.id}`, { auto_send_enabled: guardian.auto_send_enabled })
    
    // Update the modal if it's showing the same guardian
    if (selectedGuardian.value && selectedGuardian.value.id === guardian.id) {
      selectedGuardian.value.auto_send_enabled = guardian.auto_send_enabled
    }
    
    addToast({ 
      message: `Auto-send ${guardian.auto_send_enabled ? 'enabled' : 'disabled'} for ${guardian.name}`, 
      type: 'success' 
    })
    updateStats()
  } catch (err) {
    console.error('Failed to toggle guardian auto-send', err)
    guardian.auto_send_enabled = !guardian.auto_send_enabled // revert
    
    // Also revert in modal if open
    if (selectedGuardian.value && selectedGuardian.value.id === guardian.id) {
      selectedGuardian.value.auto_send_enabled = guardian.auto_send_enabled
    }
    
    addToast({ message: 'Failed to update guardian setting', type: 'danger' })
  }
}

const bulkToggle = async (enable) => {
  if (enable && !globalSettings.value.enabled) {
    addToast({ message: 'Please enable global auto-send first', type: 'warning' })
    return
  }

  const confirmed = confirm(
    `Are you sure you want to ${enable ? 'enable' : 'disable'} auto-send for all guardians?`
  )
  
  if (confirmed) {
    try {
      const ids = guardians.value.map(g => g.id)
      await api.post('/sms/guardians/bulk-toggle', { guardianIds: ids, auto_send_enabled: enable })
      guardians.value.forEach(g => { g.auto_send_enabled = enable })
      addToast({ 
        message: `Auto-send ${enable ? 'enabled' : 'disabled'} for all guardians`, 
        type: 'success' 
      })
      updateStats()
    } catch (err) {
      console.error('Failed bulk toggle', err)
      addToast({ message: 'Failed to update all guardians', type: 'danger' })
    }
  }
}

const toggleSelectAll = () => {
  paginatedGuardians.value.forEach(g => {
    g.selected = selectAll.value
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  filterStatus.value = ''
  fetchGuardians()
}

const viewGuardianDetails = async (guardian) => {
  selectedGuardian.value = guardian
  showDetailsModal.value = true
  
  // Fetch SMS history for this guardian
  try {
    const { data } = await api.get('/sms/history', {
      params: {
        guardianId: guardian.id,
        limit: 5
      }
    })
    
    const history = data?.data || []
    
    // Calculate statistics
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    guardianSMSHistory.value = {
      total: history.length,
      thisMonth: history.filter(h => new Date(h.sent_at) >= thisMonthStart).length,
      failed: history.filter(h => h.status === 'failed').length,
      recent: history.slice(0, 5)
    }
  } catch (err) {
    console.error('Failed to load guardian SMS history', err)
    guardianSMSHistory.value = {
      total: 0,
      thisMonth: 0,
      failed: 0,
      recent: []
    }
  }
}

const updateStats = () => {
  stats.value.enabled = guardians.value.filter(g => g.auto_send_enabled).length
  stats.value.disabled = guardians.value.filter(g => !g.auto_send_enabled).length
}

const fetchStats = async () => {
  try {
    const { data } = await api.get('/sms/statistics')
    const s = data?.data || {}
    stats.value.total_guardians = Number(s.guardians?.total_guardians || 0)
    stats.value.enabled = Number(s.guardians?.enabled_count || 0)
    stats.value.disabled = Number(s.guardians?.disabled_count || 0)
    stats.value.pending_messages = Number(s.sms?.pending_count || 0)
  } catch (err) {
    console.error('Failed to load stats', err)
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    })
  } catch {
    return dateString
  }
}

const fetchGuardians = async () => {
  loading.value = true
  try {
    const params = {
      search: searchQuery.value || undefined,
      status: filterStatus.value || undefined,
    }
    const { data } = await api.get('/sms/guardians', { params })
    guardians.value = (data?.data || []).map(g => ({ ...g, selected: false }))
    updateStats()
  } catch (err) {
    console.error('Failed to load guardians', err)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchStats()
  fetchGuardians()
})
</script>

<style scoped>
.text-xs {
  font-size: 0.75rem;
}

.text-gray-800 {
  color: #5a5c69;
}

.font-monospace {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

/* Modal Styling */
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

/* Table Styling */
.table-bordered {
  border: 1px solid #e3e6f0;
}

.table th {
  background-color: #f8f9fc;
  border-bottom: 2px solid #e3e6f0;
  font-weight: 600;
  padding: 0.75rem 0.5rem;
  white-space: nowrap;
  font-size: 0.875rem;
}

.table td {
  background-color: #fff;
  border: 1px solid #e3e6f0;
  padding: 0.75rem 0.5rem;
  vertical-align: middle;
}

.table-hover tbody tr:hover td {
  background-color: #f8f9fc;
}

.badge {
  font-size: 0.7rem;
  padding: 0.35em 0.65em;
}
</style>
