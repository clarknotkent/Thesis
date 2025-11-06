<template>
  <div class="message-logs">
    <!-- Section Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">
        <i class="bi bi-list-ul me-2" />SMS Message Logs
      </h5>
    </div>

    <!-- Search and Filters Row -->
    <div class="row mb-3 align-items-center g-2">
      <div class="col-md-2">
        <div class="input-group input-group-sm">
          <input 
            v-model="searchQuery" 
            type="text" 
            class="form-control"
            placeholder="Search..."
            @keyup.enter="loadLogs"
          >
          <button
            class="btn btn-outline-secondary"
            type="button"
            @click="loadLogs"
          >
            <i class="bi bi-search" />
          </button>
        </div>
      </div>
      <div class="col-md-2">
        <select
          v-model="filterStatus"
          class="form-select form-select-sm"
          @change="loadLogs"
        >
          <option value="">
            Status: All
          </option>
          <option value="sent">
            Sent
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="scheduled">
            Scheduled
          </option>
          <option value="failed">
            Failed
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <select
          v-model="filterType"
          class="form-select form-select-sm"
          @change="loadLogs"
        >
          <option value="">
            Type: All
          </option>
          <option value="scheduled">
            Scheduled
          </option>
          <option value="1-week">
            1 Week
          </option>
          <option value="3-days">
            3 Days
          </option>
          <option value="1-day">
            1 Day
          </option>
          <option value="0-day">
            Same Day
          </option>
          <option value="manual">
            Manual
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <input
          v-model="filterDate"
          type="date"
          class="form-control form-control-sm"
          placeholder="Sent Date"
          @change="loadLogs"
        >
      </div>
      <div class="col-md-2">
        <select
          v-model="sortBy"
          class="form-select form-select-sm"
          @change="applySorting"
        >
          <option value="created_at">
            Sort: Recent First
          </option>
          <option value="scheduled_at">
            Sort: Scheduled Date
          </option>
          <option value="patient_name">
            Sort: Patient Name
          </option>
          <option value="guardian_name">
            Sort: Guardian Name
          </option>
          <option value="status">
            Sort: Status
          </option>
        </select>
      </div>
      <div class="col-md-2 text-end">
        <button
          class="btn btn-outline-primary btn-sm me-2"
          :disabled="loading"
          @click="loadLogs"
        >
          <i class="bi bi-arrow-clockwise me-1" />Refresh
        </button>
        <button
          class="btn btn-warning btn-sm"
          @click="openManualSMS"
        >
          <i class="bi bi-pencil-square me-1" />Manual
        </button>
      </div>
    </div>

    <!-- Messages Table -->
    <div class="table-responsive">
      <table class="table table-sm table-hover table-bordered align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th
              class="text-center"
              style="width: 140px;"
            >
              Date & Time
            </th>
            <th style="width: 150px;">
              Guardian
            </th>
            <th style="width: 150px;">
              Patient
            </th>
            <th
              class="text-center"
              style="width: 120px;"
            >
              Phone Number
            </th>
            <th>Message</th>
            <th
              class="text-center"
              style="width: 90px;"
            >
              Type
            </th>
            <th
              class="text-center"
              style="width: 90px;"
            >
              Status
            </th>
            <th
              class="text-center"
              style="width: 80px;"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td
              colspan="8"
              class="text-center py-4"
            >
              <div
                class="spinner-border spinner-border-sm text-primary"
                role="status"
              >
                <span class="visually-hidden">Loading...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredLogs.length === 0">
            <td
              colspan="8"
              class="text-center text-muted py-4"
            >
              <i class="bi bi-inbox fs-3 d-block mb-2" />
              No messages found
            </td>
          </tr>
          <tr
            v-for="log in displayedLogs"
            v-else
            :key="log.id"
          >
            <td class="text-center">
              <small class="text-muted">{{ formatDateTime(log.sent_at || log.scheduled_at) }}</small>
            </td>
            <td>
              <span
                class="text-truncate d-inline-block"
                style="max-width: 140px;"
                :title="log.guardian_name"
              >
                {{ log.guardian_name || '—' }}
              </span>
            </td>
            <td>
              <span
                class="text-truncate d-inline-block"
                style="max-width: 140px;"
                :title="log.patient_name"
              >
                {{ log.patient_name || '—' }}
              </span>
            </td>
            <td class="text-center">
              <span
                class="font-monospace text-muted"
                style="font-size: 0.85rem;"
              >{{ log.phone_number }}</span>
            </td>
            <td>
              <small
                class="text-truncate d-inline-block"
                style="max-width: 300px;"
                :title="log.message"
              >
                {{ log.message }}
              </small>
            </td>
            <td class="text-center">
              <span
                class="badge rounded-pill"
                :class="getTypeBadgeClass(log.type)"
                style="font-size: 0.7rem; padding: 0.35em 0.65em;"
              >
                {{ formatType(log.type) }}
              </span>
            </td>
            <td class="text-center">
              <span
                class="badge rounded-pill"
                :class="getStatusBadgeClass(log.status)"
                style="font-size: 0.7rem; padding: 0.35em 0.65em;"
              >
                {{ log.status }}
              </span>
            </td>
            <td class="text-center">
              <button 
                class="btn btn-sm btn-outline-primary"
                style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                @click="viewMessage(log)"
              >
                <i class="bi bi-eye me-1" />View
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
          <li
            class="page-item"
            :class="{ disabled: currentPage === 1 }"
          >
            <a
              class="page-link"
              href="#"
              @click.prevent="currentPage > 1 && currentPage--"
            >
              <i class="bi bi-chevron-left" /> Previous
            </a>
          </li>
          <li 
            v-for="page in visiblePages" 
            :key="page"
            class="page-item"
            :class="{ active: currentPage === page }"
          >
            <a
              class="page-link"
              href="#"
              @click.prevent="currentPage = page"
            >{{ page }}</a>
          </li>
          <li
            class="page-item"
            :class="{ disabled: currentPage === totalPages }"
          >
            <a
              class="page-link"
              href="#"
              @click.prevent="currentPage < totalPages && currentPage++"
            >
              Next <i class="bi bi-chevron-right" />
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Entry count -->
    <div
      class="text-center text-muted mt-2"
      style="font-size: 0.875rem;"
    >
      Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ filteredLogs.length }} entries
    </div>

    <!-- Message Details Modal -->
    <div 
      id="messageDetailsModal" 
      ref="messageModal" 
      class="modal fade" 
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div
          v-if="selectedMessage"
          class="modal-content"
        >
          <div class="modal-header bg-light">
            <h5 class="modal-title">
              <i class="bi bi-chat-dots me-2" />Message Details
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            />
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-6">
                <label class="text-muted small mb-1">Recipient</label>
                <div class="fw-semibold">
                  {{ selectedMessage.guardian_name }}
                </div>
              </div>
              <div class="col-6">
                <label class="text-muted small mb-1">Patient</label>
                <div>{{ selectedMessage.patient_name }}</div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="text-muted small mb-1">Phone Number</label>
                <div class="font-monospace">
                  {{ selectedMessage.phone_number }}
                </div>
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
                  <span
                    class="badge rounded-pill"
                    :class="getTypeBadgeClass(selectedMessage.type)"
                  >
                    {{ formatType(selectedMessage.type) }}
                  </span>
                </div>
              </div>
              <div class="col-6">
                <label class="text-muted small mb-1">Status</label>
                <div>
                  <span
                    class="badge rounded-pill"
                    :class="getStatusBadgeClass(selectedMessage.status)"
                  >
                    {{ selectedMessage.status }}
                  </span>
                </div>
              </div>
            </div>
            <div class="mb-3">
              <label class="text-muted small mb-1">Message Content</label>
              <div
                class="border rounded p-3 bg-light"
                style="font-size: 0.95rem;"
              >
                <pre
                  class="mb-0"
                  style="white-space: pre-wrap;"
                >{{ selectedMessage.message }}</pre>
              </div>
              <small class="text-muted">{{ selectedMessage.message.length }} characters</small>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Manual SMS Modal -->
    <div
      id="manualSMSModal"
      ref="manualSMSModal"
      class="modal fade"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning-subtle">
            <h5 class="modal-title">
              <i class="bi bi-pencil-square me-2" />Send Manual SMS
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            />
          </div>
          <div class="modal-body">
            <!-- Alerts -->
            <div
              v-if="smsError"
              class="alert alert-danger py-2 mb-3"
            >
              <i class="bi bi-exclamation-triangle me-2" />{{ smsError }}
            </div>
            <div
              v-if="smsSuccess"
              class="alert alert-success py-2 mb-3"
            >
              <i class="bi bi-check-circle me-2" />{{ smsSuccess }}
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label form-label-sm">Phone Number</label>
                <input
                  v-model="smsForm.phoneNumber"
                  type="text"
                  class="form-control"
                  placeholder="e.g. 09171234567"
                >
                <small class="text-muted">We'll format to +63 automatically.</small>
              </div>
              <div class="col-md-6">
                <label class="form-label form-label-sm">Type</label>
                <select
                  v-model="smsForm.type"
                  class="form-select"
                >
                  <option value="manual">
                    Manual
                  </option>
                  <option value="1-week">
                    1 Week Before
                  </option>
                  <option value="3-days">
                    3 Days Before
                  </option>
                  <option value="1-day">
                    1 Day Before
                  </option>
                </select>
              </div>
            </div>

            <hr>

            <div class="form-check form-switch mb-2">
              <input
                id="useTemplateSwitch"
                v-model="useTemplate"
                class="form-check-input"
                type="checkbox"
              >
              <label
                class="form-check-label"
                for="useTemplateSwitch"
              >Use Template</label>
            </div>

            <div v-if="useTemplate">
              <div class="row g-3 align-items-end">
                <div class="col-md-8">
                  <label class="form-label form-label-sm">Template</label>
                  <select
                    v-model="smsForm.templateId"
                    class="form-select"
                  >
                    <option value="">
                      Select a template…
                    </option>
                    <option
                      v-for="t in templates"
                      :key="t.id"
                      :value="t.id"
                    >
                      {{ t.name }} ({{ t.trigger_type }})
                    </option>
                  </select>
                </div>
                <div class="col-md-4 text-end">
                  <button
                    class="btn btn-outline-secondary"
                    :disabled="!smsForm.templateId || previewing"
                    @click="previewTemplate"
                  >
                    <i class="bi bi-eye me-1" />
                    <span v-if="!previewing">Preview</span>
                    <span v-else>Previewing…</span>
                  </button>
                </div>
              </div>

              <!-- Minimal variable set for quick send -->
              <div class="row g-3 mt-1">
                <div class="col-md-4">
                  <label class="form-label form-label-sm">Guardian Last Name</label>
                  <input
                    v-model="smsForm.variables.guardianLastName"
                    type="text"
                    class="form-control"
                  >
                </div>
                <div class="col-md-4">
                  <label class="form-label form-label-sm">Guardian Gender</label>
                  <select
                    v-model="smsForm.variables.guardianGender"
                    class="form-select"
                  >
                    <option value="male">
                      Male (Mr.)
                    </option>
                    <option value="female">
                      Female (Ms.)
                    </option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label form-label-sm">Patient Name</label>
                  <input
                    v-model="smsForm.variables.patientName"
                    type="text"
                    class="form-control"
                  >
                </div>
                <div class="col-md-4">
                  <label class="form-label form-label-sm">Vaccine Name</label>
                  <input
                    v-model="smsForm.variables.vaccineName"
                    type="text"
                    class="form-control"
                    placeholder="e.g. BCG"
                  >
                </div>
                <div class="col-md-4">
                  <label class="form-label form-label-sm">Dose Number</label>
                  <input
                    v-model="smsForm.variables.doseNumber"
                    type="number"
                    min="1"
                    class="form-control"
                  >
                </div>
                <div class="col-md-4">
                  <label class="form-label form-label-sm">Appointment Date</label>
                  <input
                    v-model="smsForm.variables.appointmentDate"
                    type="date"
                    class="form-control"
                  >
                </div>
              </div>

              <div
                v-if="smsPreview"
                class="mt-3"
              >
                <label class="form-label form-label-sm">Preview</label>
                <div class="border rounded p-3 bg-light">
                  <pre
                    class="mb-0"
                    style="white-space: pre-wrap;"
                  >{{ smsPreview }}</pre>
                </div>
                <small class="text-muted">{{ smsPreview.length }} characters</small>
              </div>
            </div>

            <div v-else>
              <label class="form-label form-label-sm">Message</label>
              <textarea
                v-model="smsForm.message"
                class="form-control"
                rows="4"
                placeholder="Type your SMS here…"
              />
              <div class="d-flex justify-content-between mt-1">
                <small class="text-muted">{{ (smsForm.message || '').length }} / 160 chars</small>
                <small class="text-muted">Keep it concise to avoid multi-part SMS.</small>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
              :disabled="sending"
            >
              Close
            </button>
            <button
              type="button"
              class="btn btn-warning"
              :disabled="!canSend || sending"
              @click="sendManualSMS"
            >
              <i class="bi bi-send me-1" />
              <span v-if="!sending">Send Now</span>
              <span v-else>Sending…</span>
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
import api from '@/services/api'

// State
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const filterType = ref('')
const filterDate = ref('')
const sortBy = ref('created_at')
const sortOrder = ref('desc')
const currentPage = ref(1)
const itemsPerPage = ref(15)
const selectedMessage = ref(null)
const messageModal = ref(null)
const manualSMSModal = ref(null)

// Data
const logs = ref([])
const templates = ref([])

// Manual SMS form state
const useTemplate = ref(true)
const smsPreview = ref('')
const previewing = ref(false)
const sending = ref(false)
const smsError = ref('')
const smsSuccess = ref('')
const smsForm = ref({
  phoneNumber: '',
  type: 'manual',
  templateId: '',
  message: '',
  variables: {
    guardianLastName: '',
    guardianGender: 'male',
    patientName: '',
    vaccineName: '',
    doseNumber: '1',
    appointmentDate: ''
  }
})

// Computed
const filteredLogs = computed(() => {
  return logs.value
})

const sortedLogs = computed(() => {
  const sorted = [...filteredLogs.value]
  
  sorted.sort((a, b) => {
    let aVal, bVal
    
    switch (sortBy.value) {
      case 'scheduled_at':
        aVal = new Date(a.scheduled_at || a.sent_at || a.created_at)
        bVal = new Date(b.scheduled_at || b.sent_at || b.created_at)
        break
      case 'patient_name':
        aVal = (a.patient_name || '').toLowerCase()
        bVal = (b.patient_name || '').toLowerCase()
        break
      case 'guardian_name':
        aVal = (a.guardian_name || '').toLowerCase()
        bVal = (b.guardian_name || '').toLowerCase()
        break
      case 'status':
        aVal = (a.status || '').toLowerCase()
        bVal = (b.status || '').toLowerCase()
        break
      default: // created_at
        aVal = new Date(a.created_at || a.sent_at)
        bVal = new Date(b.created_at || b.sent_at)
    }
    
    if (sortOrder.value === 'desc') {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    } else {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    }
  })
  
  return sorted
})

const totalPages = computed(() => Math.ceil(sortedLogs.value.length / itemsPerPage.value))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, sortedLogs.value.length))

const displayedLogs = computed(() => {
  return sortedLogs.value.slice(startIndex.value, endIndex.value)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Methods
const loadLogs = async () => {
  loading.value = true
  currentPage.value = 1 // Reset to first page on filter change
  try {
    const params = {
      status: filterStatus.value || undefined,
      type: filterType.value || undefined,
      startDate: filterDate.value || undefined,
      search: searchQuery.value || undefined,
      page: 1,
      limit: 200 // Fetch more for client-side sorting
    }
    const { data } = await api.get('/sms/history', { params })
    logs.value = data?.data || []
  } catch (err) {
    console.error('Failed to load SMS logs', err)
    logs.value = []
  } finally {
    loading.value = false
  }
}

const applySorting = () => {
  currentPage.value = 1 // Reset to first page when sorting changes
}

const formatDateTime = (dateString) => {
  if (!dateString) return '—'
  const original = new Date(dateString)
  if (isNaN(original.getTime())) return '—'
  // Explicitly add +8 hours to the timestamp for display
  const shifted = new Date(original.getTime() + 8 * 60 * 60 * 1000)
  try {
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(shifted)
  } catch {
    return shifted.toLocaleString('en-PH')
  }
}

const truncateMessage = (message, length = 60) => {
  if (!message) return ''
  return message.length > length ? message.substring(0, length) + '...' : message
}

const formatType = (type) => {
  const types = {
    'scheduled': 'Scheduled',
    '1-week': '1 Week',
    '3-days': '3 Days',
    '1-day': '1 Day',
    '0-day': 'Same Day',
    'manual': 'Manual'
  }
  return types[type] || type
}

const getTypeBadgeClass = (type) => {
  const classes = {
    'scheduled': 'bg-primary',
    '1-week': 'bg-info text-dark',
    '3-days': 'bg-warning text-dark',
    '1-day': 'bg-danger',
    '0-day': 'bg-danger',
    'manual': 'bg-secondary'
  }
  return classes[type] || 'bg-secondary'
}

const getStatusBadgeClass = (status) => {
  const classes = {
    'sent': 'bg-success',
    'pending': 'bg-warning text-dark',
    'scheduled': 'bg-info text-dark',
    'failed': 'bg-danger'
  }
  return classes[status] || 'bg-secondary'
}

// Simple cache to avoid repeated guardian lookups within the session
const guardianCache = new Map()

const resolveGuardianName = async (guardian_id) => {
  if (!guardian_id) return ''
  if (guardianCache.has(guardian_id)) return guardianCache.get(guardian_id)
  try {
    const { data } = await api.get(`/guardians/${guardian_id}`)
    const g = data?.data
    const name = g ? `${g.firstname || ''} ${g.surname || ''}`.trim() : ''
    if (name) guardianCache.set(guardian_id, name)
    return name
  } catch (_) {
    return ''
  }
}

const viewMessage = async (log) => {
  // Fallback: if backend didn't include guardian_name but we have guardian_id, resolve on demand
  if ((!log.guardian_name || log.guardian_name === '—') && log.guardian_id) {
    const name = await resolveGuardianName(log.guardian_id)
    if (name) {
      log.guardian_name = name
    }
  }
  selectedMessage.value = log
  const modal = new Modal(messageModal.value)
  modal.show()
}

const openManualSMS = async () => {
  // reset state
  smsError.value = ''
  smsSuccess.value = ''
  smsPreview.value = ''
  sending.value = false
  previewing.value = false
  smsForm.value = {
    phoneNumber: '',
    type: 'manual',
    templateId: '',
    message: '',
    variables: {
      guardianLastName: '',
      guardianGender: 'male',
      patientName: '',
      vaccineName: '',
      doseNumber: '1',
      appointmentDate: ''
    }
  }
  try {
    // lazy-load templates
    const { data } = await api.get('/sms/templates')
    templates.value = data?.data || []
  } catch (_) {}
  const modal = new Modal(manualSMSModal.value)
  modal.show()
}

const canSend = computed(() => {
  if (!smsForm.value.phoneNumber) return false
  if (useTemplate.value) {
    return !!smsForm.value.templateId
  }
  return (smsForm.value.message || '').trim().length > 0
})

const previewTemplate = async () => {
  smsError.value = ''
  smsPreview.value = ''
  if (!smsForm.value.templateId) return
  previewing.value = true
  try {
    const { data } = await api.post('/sms/templates/preview', {
      templateId: smsForm.value.templateId,
      variables: smsForm.value.variables
    })
    smsPreview.value = data?.data?.preview || ''
  } catch (e) {
    smsError.value = e?.response?.data?.message || 'Failed to preview template'
  } finally {
    previewing.value = false
  }
}

const sendManualSMS = async () => {
  smsError.value = ''
  smsSuccess.value = ''
  sending.value = true
  try {
    const payload = {
      phoneNumber: smsForm.value.phoneNumber,
      type: smsForm.value.type
    }
    if (useTemplate.value && smsForm.value.templateId) {
      payload.templateId = smsForm.value.templateId
      payload.variables = smsForm.value.variables
    } else {
      payload.message = smsForm.value.message
    }

    const { data } = await api.post('/sms', payload)
    if (data?.success) {
      smsSuccess.value = 'SMS sent successfully.'
      await loadLogs()
      // Auto-close after a short delay
      setTimeout(() => {
        const modal = Modal.getInstance(manualSMSModal.value)
        modal && modal.hide()
      }, 750)
    } else {
      throw new Error(data?.message || 'Failed to send SMS')
    }
  } catch (e) {
    smsError.value = e?.response?.data?.message || e?.message || 'Failed to send SMS'
  } finally {
    sending.value = false
  }
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
