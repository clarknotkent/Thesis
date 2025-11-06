<template>
  <div class="message-templates">
    <!-- Section Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">
        <i class="bi bi-file-text me-2" />SMS Message Templates
      </h5>
    </div>

    <!-- Search and Filters Row -->
    <div class="row mb-3 align-items-center g-2">
      <div class="col-md-3">
        <div class="input-group input-group-sm">
          <input 
            v-model="searchQuery" 
            type="text" 
            class="form-control"
            placeholder="Search templates..."
          >
          <button
            class="btn btn-outline-secondary"
            type="button"
          >
            <i class="bi bi-search" />
          </button>
        </div>
      </div>
      <div class="col-md-2">
        <select
          v-model="filterType"
          class="form-select form-select-sm"
        >
          <option value="">
            Type: All
          </option>
          <option
            v-for="tt in TRIGGER_TYPES"
            :key="tt.value"
            :value="tt.value"
          >
            {{ tt.label }}
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <select
          v-model="filterStatus"
          class="form-select form-select-sm"
        >
          <option value="">
            Status: All
          </option>
          <option value="active">
            Active
          </option>
          <option value="inactive">
            Inactive
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <input
          type="date"
          class="form-control form-control-sm"
          placeholder="Date"
        >
      </div>
      <div class="col-md-3 text-end">
        <button
          class="btn btn-outline-primary btn-sm me-2"
          @click="fetchTemplates"
        >
          <i class="bi bi-arrow-clockwise me-1" />Refresh
        </button>
        <button
          class="btn btn-warning btn-sm"
          @click="createNewTemplate"
        >
          <i class="bi bi-pencil-square me-1" />Create Template
        </button>
      </div>
    </div>

    <!-- Template Cards -->
    <div class="row g-3">
      <div 
        v-for="template in filteredTemplates" 
        :key="template.id"
        class="col-md-6 col-lg-4"
      >
        <div class="card h-100 shadow-sm hover-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span
                  class="badge"
                  :class="getTypeBadgeClass(template.trigger_type)"
                >
                  {{ formatTriggerType(template.trigger_type) }}
                </span>
              </div>
              <div class="btn-group">
                <button
                  class="btn btn-sm btn-outline-secondary"
                  title="View"
                  @click="viewTemplate(template)"
                >
                  <i class="bi bi-eye" />
                </button>
                <button
                  class="btn btn-sm btn-outline-secondary"
                  title="Edit"
                  @click="editTemplate(template)"
                >
                  <i class="bi bi-pencil" />
                </button>
                <button
                  class="btn btn-sm btn-outline-secondary"
                  title="Duplicate"
                  @click="duplicateTemplate(template)"
                >
                  <i class="bi bi-files" />
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  title="Delete"
                  @click="deleteTemplate(template)"
                >
                  <i class="bi bi-trash" />
                </button>
              </div>
            </div>

            <h6 class="card-title">
              {{ template.name }}
            </h6>
                
            <div
              class="template-preview bg-light rounded p-3 mb-3"
              style="min-height: 100px;"
            >
              <small class="text-muted d-block mb-2">Preview:</small>
              <small class="font-monospace">{{ getCardPreview(template) }}</small>
            </div>

            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted">
                <i class="bi bi-clock me-1" />
                {{ formatTimeRange(template.time_range) }}
              </small>
              <div class="form-check form-switch">
                <input 
                  :id="`active-${template.id}`" 
                  v-model="template.is_active" 
                  class="form-check-input"
                  type="checkbox"
                  @change="toggleTemplateStatus(template)"
                >
                <label
                  class="form-check-label"
                  :for="`active-${template.id}`"
                >
                  Active
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredTemplates.length === 0"
        class="col-12"
      >
        <div class="text-center py-5">
          <i class="bi bi-inbox fs-1 text-muted d-block mb-3" />
          <p class="text-muted mb-3">
            No message templates found
          </p>
          <button
            class="btn btn-primary"
            @click="createNewTemplate"
          >
            <i class="bi bi-plus-lg me-2" />Create Your First Template
          </button>
        </div>
      </div>
    </div>

    <!-- Template Editor Modal -->
    <div 
      id="templateEditorModal" 
      ref="editorModal" 
      class="modal fade" 
      tabindex="-1"
      data-bs-backdrop="static"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingTemplate?.id ? 'Edit Template' : 'Create Template' }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            />
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveTemplate">
              <!-- Template Name -->
              <div class="mb-3">
                <label class="form-label">Template Name</label>
                <input 
                  v-model="editingTemplate.name" 
                  type="text" 
                  class="form-control"
                  placeholder="e.g., 1 Week Vaccination Reminder"
                  required
                >
              </div>

              <!-- Trigger Type -->
              <div class="mb-3">
                <label class="form-label">Trigger Type</label>
                <select
                  v-model="editingTemplate.trigger_type"
                  class="form-select"
                  required
                >
                  <option value="">
                    Select trigger...
                  </option>
                  <option
                    v-for="tt in TRIGGER_TYPES"
                    :key="tt.value"
                    :value="tt.value"
                  >
                    {{ tt.label }}
                  </option>
                </select>
              </div>

              <!-- Time Range -->
              <div class="mb-3">
                <label class="form-label">Time of Day</label>
                <select
                  v-model="editingTemplate.time_range"
                  class="form-select"
                  required
                >
                  <option value="day">
                    Day (6:00 AM - 5:59 PM)
                  </option>
                  <option value="evening">
                    Evening (6:00 PM - 5:59 AM)
                  </option>
                </select>
              </div>

              <!-- Message Template -->
              <div class="mb-3">
                <label class="form-label">Message Template</label>
                <div class="alert alert-info">
                  <small>
                    <strong>Available Variables:</strong><br>
                    <code>{{ '{' }}{greeting{{ '}' }}</code> - Good Day/Evening<br>
                    <code>{{ '{' }}{greeting_time{{ '}' }}</code> - Good Day/Evening (auto, based on send time)<br>
                    <code>{{ '{' }}{title{{ '}' }}</code> - Mr./Ms.<br>
                    <code>{{ '{' }}{guardian_name{{ '}' }}</code> - Guardian name<br>
                    <code>{{ '{' }}{patient_name{{ '}' }}</code> - Patient name<br>
                    <code>{{ '{' }}{scheduled_date{{ '}' }}</code> - Vaccination date<br>
                    <code>{{ '{' }}{vaccine_name{{ '}' }}</code> - Vaccine name<br>
                    <code>{{ '{' }}{dose_number{{ '}' }}</code> - Dose number<br>
                    <code>{{ '{' }}{vaccine_lines{{ '}' }}</code> - Multi-line list (e.g., Antigen — Dose 1,\nAntigen — Dose 2)
                  </small>
                </div>
                <textarea 
                  v-model="editingTemplate.template" 
                  class="form-control font-monospace"
                  rows="6"
                  placeholder="Enter your message template..."
                  required
                />
                <small class="text-muted">
                  Characters: {{ editingTemplate.template?.length || 0 }} / 160
                </small>
              </div>

              <!-- Preview -->
              <div class="mb-3">
                <label class="form-label">Preview</label>
                <div class="border rounded p-3 bg-light">
                  <pre
                    class="mb-0"
                    style="white-space: pre-wrap;"
                  >{{ previewMessage }}</pre>
                </div>
              </div>

              <!-- Active Status -->
              <div class="mb-3">
                <div class="form-check form-switch">
                  <input 
                    id="templateActive" 
                    v-model="editingTemplate.is_active" 
                    class="form-check-input"
                    type="checkbox"
                  >
                  <label
                    class="form-check-label"
                    for="templateActive"
                  >
                    Activate this template
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="saveTemplate"
            >
              <i class="bi bi-save me-2" />Save Template
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Viewer Modal -->
    <div
      id="templateViewerModal"
      ref="viewerModal"
      class="modal fade"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-eye me-2" />View Template
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            />
          </div>
          <div
            v-if="viewingTemplate"
            class="modal-body"
          >
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="text-muted small mb-1">Name</label>
                <div class="fw-semibold">
                  {{ viewingTemplate.name }}
                </div>
              </div>
              <div class="col-md-3">
                <label class="text-muted small mb-1">Trigger</label>
                <div>
                  <span
                    class="badge"
                    :class="getTypeBadgeClass(viewingTemplate.trigger_type)"
                  >{{ formatTriggerType(viewingTemplate.trigger_type) }}</span>
                </div>
              </div>
              <div class="col-md-3">
                <label class="text-muted small mb-1">Time</label>
                <div>{{ formatTimeRange(viewingTemplate.time_range) }}</div>
              </div>
            </div>
            <div class="mb-2">
              <label class="text-muted small mb-1">Template</label>
              <div class="border rounded bg-light p-3">
                <pre
                  class="mb-0"
                  style="white-space: pre-wrap;"
                >{{ viewingTemplate.template }}</pre>
              </div>
              <small class="text-muted">{{ (viewingTemplate.template || '').length }} characters</small>
            </div>
            <div class="alert alert-info mt-3">
              <small>
                <strong>Variables:</strong> {greeting_time}, {guardian_title}, {guardian_name}, {guardian_first_name}, {guardian_last_name}, {patient_name}, {patient_first_name}, {vaccine_name}, {dose_number}, {appointment_date}, {appointment_time}, {scheduled_date}, {vaccine_lines}
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="editFromViewer"
            >
              <i class="bi bi-pencil me-1" />Edit
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
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const { addToast } = useToast()

// Normalized trigger types mapping used across UI
const TRIGGER_TYPES = [
  { value: '1-week', label: '1 Week Before' },
  { value: '3-days', label: '3 Days Before' },
  { value: '1-day', label: '1 Day Before' },
  { value: '0-day', label: 'Same Day (0-Day)' },
  { value: 'manual', label: 'Manual' }
]

// State
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')

const templates = ref([])

const editingTemplate = ref({
  name: '',
  trigger_type: '',
  time_range: 'day',
  template: '',
  is_active: true
})

const editorModal = ref(null)
let modalInstance = null
const viewerModal = ref(null)
let viewerInstance = null
const viewingTemplate = ref(null)

// Computed
const filteredTemplates = computed(() => {
  let result = templates.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.template.toLowerCase().includes(query)
    )
  }

  // Type filter
  if (filterType.value) {
    result = result.filter(t => t.trigger_type === filterType.value)
  }

  // Status filter
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active'
    result = result.filter(t => t.is_active === isActive)
  }

  return result
})

const previewMessage = computed(() => {
  if (!editingTemplate.value.template) return 'Preview will appear here...'
  
  // Sample data for preview
  const greeting = editingTemplate.value.time_range === 'day' ? 'Good Day' : 'Good Evening'
  const greetingTime = greeting
  const title = 'Mr.'
  const guardianName = 'Dela Cruz'
  const patientName = 'Maria'
  const scheduledDate = 'October 28, 2025'
  const vaccineName = 'BCG'
  const doseNumber = '1'
  const vaccineLines = 'Oral Polio Vaccine (OPV) — Dose 1,\nPentavalent Vaccine (DPT-HepB-Hib) — Dose 1,\nPneumococcal Conjugate Vaccine (PCV) — Dose 1'

  let preview = editingTemplate.value.template
  preview = preview.replace('{greeting}', greeting)
  preview = preview.replace('{greeting_time}', greetingTime)
  preview = preview.replace('{title}', title)
  preview = preview.replace('{guardian_name}', guardianName)
  preview = preview.replace('{patient_name}', patientName)
  preview = preview.replace('{scheduled_date}', scheduledDate)
  preview = preview.replace('{vaccine_name}', vaccineName)
  preview = preview.replace('{dose_number}', doseNumber)
  preview = preview.replace('{vaccine_lines}', vaccineLines)
  preview = preview.replace('{vaccine_list}', vaccineLines)

  return preview
})

// Methods
const formatTriggerType = (type) => {
  const found = TRIGGER_TYPES.find(t => t.value === type)
  return found ? found.label : String(type || '').toString()
}

const formatTimeRange = (range) => {
  return range === 'day' ? '6:00 AM - 5:59 PM' : '6:00 PM - 5:59 AM'
}

const getTypeBadgeClass = (type) => {
  const classes = {
    '1-week': 'bg-info',
    '3-days': 'bg-warning',
    '1-day': 'bg-danger',
    '0-day': 'bg-primary',
    'manual': 'bg-secondary'
  }
  return classes[type] || 'bg-secondary'
}

const getCardPreview = (t) => {
  if (!t?.template) return ''
  const greeting = (t.time_range === 'day') ? 'Good Day' : 'Good Evening'
  const title = 'Mr.'
  const guardianName = 'Dela Cruz'
  const patientName = 'Maria'
  const scheduledDate = 'October 28, 2025'
  const vaccineName = 'BCG'
  const doseNumber = '1'
  const vaccineLines = 'Oral Polio Vaccine (OPV) — Dose 1,\nPentavalent Vaccine (DPT-HepB-Hib) — Dose 1,\nPneumococcal Conjugate Vaccine (PCV) — Dose 1'
  let preview = t.template
  preview = preview
    .replaceAll('{greeting}', greeting)
    .replaceAll('{greeting_time}', greeting)
    .replaceAll('{title}', title)
    .replaceAll('{guardian_title}', title)
    .replaceAll('{guardian_name}', guardianName)
    .replaceAll('{guardian_last_name}', 'Dela Cruz')
    .replaceAll('{patient_name}', patientName)
    .replaceAll('{scheduled_date}', scheduledDate)
    .replaceAll('{appointment_date}', scheduledDate)
    .replaceAll('{vaccine_name}', vaccineName)
    .replaceAll('{dose_number}', doseNumber)
    .replaceAll('{vaccine_lines}', vaccineLines)
    .replaceAll('{vaccine_list}', vaccineLines)
  return preview
}

const createNewTemplate = () => {
  editingTemplate.value = {
    name: '',
    trigger_type: '',
    time_range: 'day',
    template: 'Good Day, {guardian_title} {guardian_last_name}! This is a reminder that your child, {patient_name} has scheduled on {scheduled_date} for the following vaccines:\n\n{vaccine_lines}\n\nSee you there! Thank you!',
    is_active: true
  }
  showModal()
}

const editTemplate = (template) => {
  editingTemplate.value = { ...template }
  showModal()
}

const viewTemplate = (template) => {
  viewingTemplate.value = { ...template }
  if (!viewerInstance) viewerInstance = new Modal(viewerModal.value)
  viewerInstance.show()
}

const editFromViewer = () => {
  if (viewerInstance) viewerInstance.hide()
  if (viewingTemplate.value) editTemplate(viewingTemplate.value)
}

const duplicateTemplate = (template) => {
  editingTemplate.value = {
    ...template,
    id: null,
    name: `${template.name} (Copy)`
  }
  showModal()
}

const deleteTemplate = async (template) => {
  if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return
  try {
    await api.delete(`/sms/templates/${template.id}`)
    templates.value = templates.value.filter(t => t.id !== template.id)
    addToast({ message: 'Template deleted successfully', type: 'success' })
  } catch (err) {
    console.error('Failed to delete template', err)
    addToast({ message: 'Failed to delete template', type: 'danger' })
  }
}

const saveTemplate = async () => {
  try {
    if (editingTemplate.value.id) {
      // Update existing
      const { data } = await api.put(`/sms/templates/${editingTemplate.value.id}` , {
        name: editingTemplate.value.name,
        template: editingTemplate.value.template,
        trigger_type: editingTemplate.value.trigger_type,
        time_range: editingTemplate.value.time_range,
        is_active: editingTemplate.value.is_active,
      })
      const updated = data?.data
      if (updated) {
        const idx = templates.value.findIndex(t => t.id === updated.id)
        if (idx > -1) templates.value[idx] = updated
      }
      addToast({ message: 'Template updated successfully', type: 'success' })
    } else {
      // Create new
      const { data } = await api.post('/sms/templates', {
        name: editingTemplate.value.name,
        template: editingTemplate.value.template,
        trigger_type: editingTemplate.value.trigger_type,
        time_range: editingTemplate.value.time_range,
        is_active: editingTemplate.value.is_active,
      })
      const created = data?.data
      if (created) templates.value.unshift(created)
      addToast({ message: 'Template created successfully', type: 'success' })
    }
  } catch (err) {
    console.error('Failed to save template', err)
    addToast({ message: 'Failed to save template', type: 'danger' })
  } finally {
    hideModal()
  }
}

const toggleTemplateStatus = async (template) => {
  try {
    await api.put(`/sms/templates/${template.id}`, { ...template })
    addToast({ message: `Template ${template.is_active ? 'activated' : 'deactivated'}`, type: 'success' })
  } catch (err) {
    console.error('Failed to toggle template status', err)
    template.is_active = !template.is_active // revert
    addToast({ message: 'Failed to update status', type: 'danger' })
  }
}

const showModal = () => {
  if (!modalInstance) {
    modalInstance = new Modal(editorModal.value)
  }
  modalInstance.show()
}

const hideModal = () => {
  if (modalInstance) {
    modalInstance.hide()
  }
}

// Lifecycle
const fetchTemplates = async () => {
  try {
    const { data } = await api.get('/sms/templates')
    templates.value = (data?.data || [])
  } catch (err) {
    console.error('Failed to load templates', err)
  }
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
.hover-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.btn-ghost {
  background: none;
  border: none;
  color: inherit;
}

.btn-ghost:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.template-preview {
  font-size: 0.85rem;
  line-height: 1.5;
}
</style>
