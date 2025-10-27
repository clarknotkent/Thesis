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
                      :disabled="!globalSettings.enabled"
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
    addToast('Global auto-send enabled. Configure individual guardians below.', 'success')
  } else {
    addToast('Global auto-send disabled. All automated messages stopped.', 'warning')
  }
  updateStats()
}

const toggleGuardianAutoSend = async (guardian) => {
  try {
    await api.put(`/sms/guardians/${guardian.id}`, { auto_send_enabled: guardian.auto_send_enabled })
    addToast(`Auto-send ${guardian.auto_send_enabled ? 'enabled' : 'disabled'} for ${guardian.name}`, 'success')
    updateStats()
  } catch (err) {
    console.error('Failed to toggle guardian auto-send', err)
    guardian.auto_send_enabled = !guardian.auto_send_enabled // revert
    addToast('Failed to update guardian setting', 'danger')
  }
}

const bulkToggle = async (enable) => {
  if (enable && !globalSettings.value.enabled) {
    addToast('Please enable global auto-send first', 'warning')
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
      addToast(`Auto-send ${enable ? 'enabled' : 'disabled'} for all guardians`, 'success')
      updateStats()
    } catch (err) {
      console.error('Failed bulk toggle', err)
      addToast('Failed to update all guardians', 'danger')
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

const viewGuardianDetails = (guardian) => {
  // TODO: Navigate to guardian details or show modal
  console.log('View details for:', guardian)
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
