<template>
  <AdminLayout>
    <div class="container-fluid">
      <AppPageHeader 
        title="SMS Communication Logs" 
        subtitle="Monitor and manage SMS notifications and reminders"
      >
        <template #actions>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-success" @click="refreshLogs">
              <i class="bi bi-arrow-clockwise me-2"></i>Refresh
            </button>
            <button class="btn btn-success" @click="showSendModal = true">
              <i class="bi bi-chat-left-text me-2"></i>Send SMS
            </button>
          </div>
        </template>
      </AppPageHeader>

      <!-- Filters & Search -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Search messages..."
                  v-model="searchQuery"
                  @input="debouncedSearch"
                >
              </div>
            </div>
            <div class="col-md-2">
              <select class="form-select" v-model="selectedStatus" @change="applyFilters">
                <option value="">All Status</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select" v-model="selectedType" @change="applyFilters">
                <option value="">All Types</option>
                <option value="appointment_reminder">Appointment Reminder</option>
                <option value="vaccination_due">Vaccination Due</option>
                <option value="missed_appointment">Missed Appointment</option>
                <option value="general_notification">General Notification</option>
              </select>
            </div>
            <div class="col-md-3">
              <DateInput v-model="selectedDate" />
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-secondary w-100" @click="resetFilters">
                <i class="bi bi-funnel"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SMS Statistics Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs fw-bold text-primary text-uppercase mb-1">Total Sent</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ smsStats.totalSent }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-send text-primary" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs fw-bold text-success text-uppercase mb-1">Delivered</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ smsStats.delivered }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-check-circle text-success" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs fw-bold text-warning text-uppercase mb-1">Pending</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ smsStats.pending }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-clock text-warning" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-left-danger shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs fw-bold text-danger text-uppercase mb-1">Failed</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ smsStats.failed }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-x-circle text-danger" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SMS Logs Table -->
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 fw-bold text-primary">SMS Communication History</h6>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-info">{{ totalLogs }} messages</span>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" @click="exportLogs" title="Export">
                <i class="bi bi-download"></i>
              </button>
              <button class="btn btn-outline-primary" @click="printLogs" title="Print">
                <i class="bi bi-printer"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading SMS logs...</span>
            </div>
          </div>

          <!-- SMS Logs Table -->
          <div v-else-if="smsLogs.length > 0" class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Date & Time</th>
                  <th>Recipient</th>
                  <th>Phone Number</th>
                  <th>Message Type</th>
                  <th>Content</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in smsLogs" :key="log.id">
                  <td>
                    <div>
                      {{ formatDate(log.sentAt) }}
                      <div class="text-muted small">{{ formatTime(log.sentAt) }}</div>
                    </div>
                  </td>
                  <td>
                    <div class="fw-semibold">{{ log.recipientName }}</div>
                    <div class="text-muted small">{{ log.patientRelation }}</div>
                  </td>
                  <td>{{ log.phoneNumber }}</td>
                  <td>
                    <span class="badge" :class="getTypeBadgeClass(log.messageType)">
                      {{ formatMessageType(log.messageType) }}
                    </span>
                  </td>
                  <td>
                    <div class="text-truncate" style="max-width: 200px;" :title="log.content">
                      {{ log.content }}
                    </div>
                  </td>
                  <td>
                    <span class="badge" :class="getStatusBadgeClass(log.status)">
                      <i :class="getStatusIcon(log.status)" class="me-1"></i>
                      {{ log.status }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button 
                        class="btn btn-outline-primary" 
                        @click="viewMessage(log)"
                        title="View Full Message"
                      >
                        <i class="bi bi-eye"></i>
                      </button>
                      <button 
                        v-if="log.status === 'failed'" 
                        class="btn btn-outline-warning" 
                        @click="resendMessage(log)"
                        title="Resend"
                      >
                        <i class="bi bi-arrow-repeat"></i>
                      </button>
                      <button 
                        class="btn btn-outline-danger" 
                        @click="deleteLog(log)"
                        title="Delete"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-5">
            <i class="bi bi-chat-left-text text-muted" style="font-size: 4rem;"></i>
            <h5 class="mt-3 text-muted">No SMS logs found</h5>
            <p class="text-muted">SMS communications will appear here once sent</p>
          </div>
        </div>

        <!-- Pagination -->
        <div class="card-footer" v-if="totalPages > 1">
          <AppPagination
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-items="totalLogs"
            :items-per-page="itemsPerPage"
            @page-change="changePage"
          />
        </div>
      </div>

      <!-- View Message Modal -->
      <div class="modal fade" :class="{ show: showViewModal }" :style="{ display: showViewModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">SMS Message Details</h5>
              <button type="button" class="btn-close" @click="showViewModal = false"></button>
            </div>
            <div class="modal-body" v-if="selectedMessage">
              <div class="row g-3">
                <div class="col-md-6">
                  <strong>Recipient:</strong><br>
                  <span class="text-muted">{{ selectedMessage.recipientName }}</span>
                </div>
                <div class="col-md-6">
                  <strong>Phone Number:</strong><br>
                  <span class="text-muted">{{ selectedMessage.phoneNumber }}</span>
                </div>
                <div class="col-md-6">
                  <strong>Message Type:</strong><br>
                  <span class="badge" :class="getTypeBadgeClass(selectedMessage.messageType)">
                    {{ formatMessageType(selectedMessage.messageType) }}
                  </span>
                </div>
                <div class="col-md-6">
                  <strong>Status:</strong><br>
                  <span class="badge" :class="getStatusBadgeClass(selectedMessage.status)">
                    {{ selectedMessage.status }}
                  </span>
                </div>
                <div class="col-md-6">
                  <strong>Sent Date:</strong><br>
                  <span class="text-muted">{{ formatDate(selectedMessage.sentAt) }}</span>
                </div>
                <div class="col-md-6">
                  <strong>Delivery Date:</strong><br>
                  <span class="text-muted">{{ selectedMessage.deliveredAt ? formatDate(selectedMessage.deliveredAt) : 'N/A' }}</span>
                </div>
                <div class="col-12">
                  <strong>Message Content:</strong><br>
                  <div class="bg-light p-3 rounded mt-2">
                    {{ selectedMessage.content }}
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showViewModal = false">Close</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Send SMS Modal -->
      <div class="modal fade" :class="{ show: showSendModal }" :style="{ display: showSendModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Send SMS Message</h5>
              <button type="button" class="btn-close" @click="closeSendModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="sendSMS">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label">Message Type</label>
                    <select class="form-select" v-model="smsForm.messageType" required>
                      <option value="">Select Type</option>
                      <option value="appointment_reminder">Appointment Reminder</option>
                      <option value="vaccination_due">Vaccination Due</option>
                      <option value="missed_appointment">Missed Appointment</option>
                      <option value="general_notification">General Notification</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Recipients</label>
                    <select class="form-select" v-model="smsForm.recipients" multiple required>
                      <option value="all">All Parents</option>
                      <option value="due_vaccinations">Parents with Due Vaccinations</option>
                      <option value="missed_appointments">Parents with Missed Appointments</option>
                    </select>
                    <div class="form-text">Hold Ctrl to select multiple options</div>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Message Content</label>
                    <textarea 
                      class="form-control" 
                      rows="5" 
                      v-model="smsForm.content" 
                      :maxlength="160"
                      required
                    ></textarea>
                    <div class="form-text">
                      {{ smsForm.content.length }}/160 characters
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="smsForm.scheduleMessage" id="scheduleMessage">
                      <label class="form-check-label" for="scheduleMessage">
                        Schedule message for later
                      </label>
                    </div>
                  </div>
                  <div class="col-12" v-if="smsForm.scheduleMessage">
                    <label class="form-label">Schedule Date & Time</label>
                    <input type="datetime-local" class="form-control" v-model="smsForm.scheduledFor">
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeSendModal">Cancel</button>
              <button type="button" class="btn btn-success" @click="sendSMS" :disabled="sending">
                <span v-if="sending" class="spinner-border spinner-border-sm me-2"></span>
                {{ smsForm.scheduleMessage ? 'Schedule SMS' : 'Send SMS' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Backdrop -->
      <div v-if="showViewModal || showSendModal" class="modal-backdrop fade show"></div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { addToast } from '@/composables/useToast'
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import AppPageHeader from '@/components/ui/base/AppPageHeader.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import api from '@/services/api'
import DateInput from '@/components/ui/form/DateInput.vue'

// Reactive data
const loading = ref(true)
const sending = ref(false)
const smsLogs = ref([])
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedType = ref('')
const selectedDate = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalLogs = ref(0)
const totalPages = ref(0)

// Modal states
const showViewModal = ref(false)
const showSendModal = ref(false)
const selectedMessage = ref(null)

// Form data
const smsForm = ref({
  messageType: '',
  recipients: [],
  content: '',
  scheduleMessage: false,
  scheduledFor: ''
})

// SMS Statistics
const smsStats = ref({
  totalSent: 0,
  delivered: 0,
  pending: 0,
  failed: 0
})

// Methods
const fetchSMSLogs = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value
    }

    if (searchQuery.value) params.search = searchQuery.value
    if (selectedStatus.value) params.status = selectedStatus.value
    // Map UI type to backend types ('manual' | 'scheduled')
    const mapUITypeToBackend = (t) => {
      if (!t) return ''
      if (t === 'appointment_reminder') return 'scheduled'
      // group other UI types as manual since backend only stores manual/scheduled
      return 'manual'
    }
    const backendType = mapUITypeToBackend(selectedType.value)
    if (backendType) params.type = backendType
    // Date filter (optional): backend expects startDate/endDate; if single date selected, pass as day bounds
    if (selectedDate.value) {
      const d = new Date(selectedDate.value)
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
      params.startDate = start.toISOString()
      params.endDate = end.toISOString()
    }

    const { data } = await api.get('/sms/history', { params })
    const rows = data?.data || []
    const pagination = data?.pagination || { total: rows.length }

    // Map backend rows to UI model
    const mapBackendTypeToUI = (t) => {
      if (t === 'scheduled') return 'appointment_reminder'
      return 'general_notification' // default for 'manual' or others
    }

    smsLogs.value = rows.map(r => ({
      id: r.id,
      recipientName: r.guardian_name || r.patient_name || '—',
      patientRelation: r.patient_name ? `Guardian of ${r.patient_name}` : '',
      phoneNumber: r.phone_number || '',
      messageType: mapBackendTypeToUI(r.type),
      content: r.message || '',
      status: r.status || 'pending',
      sentAt: r.sent_at || r.scheduled_at || new Date().toISOString(),
      deliveredAt: null
    }))

    totalLogs.value = Number(pagination.total || smsLogs.value.length)
    totalPages.value = Math.ceil(totalLogs.value / itemsPerPage.value)

    // Optional: compute simple stats client-side (or call /sms/statistics)
    const counts = smsLogs.value.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1
      return acc
    }, {})
    smsStats.value = {
      totalSent: totalLogs.value,
      delivered: counts['delivered'] || 0,
      pending: counts['pending'] || 0,
      failed: counts['failed'] || 0
    }

  } catch (error) {
    console.error('Error fetching SMS logs:', error)
    smsLogs.value = []
    totalLogs.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  currentPage.value = page
  fetchSMSLogs()
}

const applyFilters = () => {
  currentPage.value = 1
  fetchSMSLogs()
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = ''
  selectedType.value = ''
  selectedDate.value = ''
  currentPage.value = 1
  fetchSMSLogs()
}

const refreshLogs = () => {
  fetchSMSLogs()
}

// Debounced search
let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchSMSLogs()
  }, 500)
}

const viewMessage = (message) => {
  selectedMessage.value = message
  showViewModal.value = true
}

const resendMessage = async (message) => {
  if (confirm(`Resend SMS to ${message.recipientName}?`)) {
    try {
      // Simulate resend API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update status
      message.status = 'sent'
      message.sentAt = new Date().toISOString()
      
    } catch (error) {
      console.error('Error resending SMS:', error)
      alert('Error resending SMS')
    }
  }
}

const deleteLog = async (log) => {
  if (confirm(`Delete SMS log for ${log.recipientName}?`)) {
    smsLogs.value = smsLogs.value.filter(l => l.id !== log.id)
    totalLogs.value--
  }
}

const sendSMS = async () => {
  try {
    sending.value = true
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Add new log entry
    const newLog = {
      id: Date.now(),
      recipientName: 'Recipients Selected',
      patientRelation: 'Multiple Recipients',
      phoneNumber: 'Multiple',
      messageType: smsForm.value.messageType,
      content: smsForm.value.content,
      status: smsForm.value.scheduleMessage ? 'scheduled' : 'sent',
      sentAt: smsForm.value.scheduleMessage ? smsForm.value.scheduledFor : new Date().toISOString(),
      deliveredAt: null
    }
    
    smsLogs.value.unshift(newLog)
    totalLogs.value++
    smsStats.value.totalSent++
    
    closeSendModal()
    
  } catch (error) {
    console.error('Error sending SMS:', error)
    alert('Error sending SMS')
  } finally {
    sending.value = false
  }
}

const closeSendModal = () => {
  showSendModal.value = false
  smsForm.value = {
    messageType: '',
    recipients: [],
    content: '',
    scheduleMessage: false,
    scheduledFor: ''
  }
}

const exportLogs = () => {
  // Implement export functionality
}

const printLogs = () => {
  window.print()
}

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return '—'
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

const formatTime = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    })
  } catch {
    return new Date(dateString).toLocaleTimeString()
  }
}

const formatMessageType = (type) => {
  const types = {
    appointment_reminder: 'Appointment Reminder',
    vaccination_due: 'Vaccination Due',
    missed_appointment: 'Missed Appointment',
    general_notification: 'General Notification'
  }
  return types[type] || type
}

const getTypeBadgeClass = (type) => {
  const classes = {
    appointment_reminder: 'bg-primary',
    vaccination_due: 'bg-warning text-dark',
    missed_appointment: 'bg-danger',
    general_notification: 'bg-info'
  }
  return classes[type] || 'bg-secondary'
}

const getStatusBadgeClass = (status) => {
  const classes = {
    sent: 'bg-primary',
    delivered: 'bg-success',
    failed: 'bg-danger',
    pending: 'bg-warning text-dark'
  }
  return classes[status] || 'bg-secondary'
}

const getStatusIcon = (status) => {
  const icons = {
    sent: 'bi bi-send',
    delivered: 'bi bi-check-circle',
    failed: 'bi bi-x-circle',
    pending: 'bi bi-clock'
  }
  return icons[status] || 'bi bi-info-circle'
}

// Lifecycle
onMounted(() => {
  fetchSMSLogs()
})
</script>

<style scoped>
.border-left-primary {
  border-left: 0.25rem solid #4e73df !important;
}

.border-left-success {
  border-left: 0.25rem solid #1cc88a !important;
}

.border-left-warning {
  border-left: 0.25rem solid #f6c23e !important;
}

.border-left-danger {
  border-left: 0.25rem solid #e74a3b !important;
}

.text-xs {
  font-size: 0.7rem;
}

.text-gray-800 {
  color: #5a5c69 !important;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.btn-group .btn {
  border-radius: 0.25rem;
  margin-right: 0.125rem;
}

.btn-group .btn:last-child {
  margin-right: 0;
}
</style>


