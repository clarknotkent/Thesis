<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">Admin</router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/admin/vaccines">Vaccine Inventory</router-link>
          </li>
          <li class="breadcrumb-item active">Vaccine Schedules</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-calendar-check me-2"></i>Vaccine Schedules
          </h1>
          <p class="text-muted mb-0">Manage vaccination schedules and dosage timelines</p>
        </div>
        <div class="d-flex gap-2">
          <router-link to="/admin/vaccines" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>Back to Inventory
          </router-link>
          <button class="btn btn-primary" @click="openScheduleModal()">
            <i class="bi bi-plus-circle me-2"></i>New Schedule
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Schedules Table -->
      <div v-else class="card shadow">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Schedule Name</th>
                  <th>Vaccine</th>
                  <th>Total Doses</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in schedules" :key="s.id || s.schedule_master_id">
                  <td>{{ s.name }}</td>
                  <td>{{ s.vaccine?.antigen_name || s.vaccine?.brand_name || (s.vaccine_id) }}</td>
                  <td>{{ s.total_doses }}</td>
                  <td>{{ formatDate(s.created_at) }}</td>
                  <td>{{ formatDate(s.updated_at) }}</td>
                  <td>
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-primary" @click="editSchedule(s)">
                        <i class="bi bi-pencil me-2"></i>Edit
                      </button>
                      <button class="btn btn-sm btn-outline-secondary" @click="viewSchedule(s)">
                        <i class="bi bi-eye me-2"></i>View
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="schedules.length === 0">
                  <td colspan="6" class="text-center text-muted py-4">No schedules defined</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Schedule Modal -->
      <div v-if="showScheduleModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Manage Vaccine Scheduling</h5>
              <button type="button" class="btn-close" @click="showScheduleModal = false"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="submitSchedule">
                <div class="mb-3">
                  <label class="form-label">Select Vaccine Type *</label>
                  <select v-model="selectedVaccine" class="form-select" :disabled="scheduleReadOnly" required>
                    <option value="">-- Select Vaccine --</option>
                    <option v-for="v in existingVaccines" :key="v.id" :value="v.id">
                      {{ v.antigen_name }} ({{ v.brand_name }})
                    </option>
                  </select>
                </div>
                <div v-if="selectedVaccine">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Schedule Name *</label>
                      <input type="text" class="form-control" v-model="schedulingFields.name" :disabled="scheduleReadOnly" required placeholder="e.g. NIP BCG Schedule" />
                      <small class="text-muted">A descriptive name for this schedule.</small>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Schedule Code</label>
                      <input type="text" class="form-control" v-model="schedulingFields.code" :disabled="scheduleReadOnly" placeholder="e.g. NIP-BCG-2025" />
                      <small class="text-muted">Optional code for reference.</small>
                    </div>
                  </div>
                  <div class="row g-3 mt-1">
                    <div class="col-md-4">
                      <label class="form-label">Total Doses *</label>
                      <input type="number" class="form-control" v-model.number="schedulingFields.total_doses" :disabled="scheduleReadOnly" min="1" required placeholder="e.g. 3" />
                      <small class="text-muted">How many doses in this series? This creates per-dose panels automatically.</small>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Concurrent Allowed</label>
                      <select class="form-select" v-model="schedulingFields.concurrent_allowed" :disabled="scheduleReadOnly">
                        <option :value="true">Yes</option>
                        <option :value="false">No</option>
                      </select>
                      <small class="text-muted">Can this vaccine be given with others?</small>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Catch-up Strategy</label>
                      <input type="text" class="form-control" v-model="schedulingFields.catchup_strategy" :disabled="scheduleReadOnly" placeholder="e.g. Give ASAP if missed" />
                      <small class="text-muted">Instructions if a dose is missed.</small>
                    </div>
                  </div>
                  <div class="row g-3 mt-1">
                    <div class="col-md-6">
                      <label class="form-label">Minimum Age (days) *</label>
                      <input type="number" class="form-control" v-model.number="schedulingFields.min_age_days" :disabled="scheduleReadOnly" min="0" required placeholder="e.g. 0 for birth" />
                      <small class="text-muted">Earliest age (in days) for first dose. Use days for precision (e.g., 0 = birth).</small>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Maximum Age (days)</label>
                      <input type="number" class="form-control" v-model.number="schedulingFields.max_age_days" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 365 for 1 year" />
                      <small class="text-muted">Latest age (in days) for last dose (optional). Leave empty if not applicable.</small>
                    </div>
                  </div>
                    <div class="mb-3 mt-2">
                    <label class="form-label">Notes</label>
                    <textarea class="form-control" v-model="schedulingFields.notes" :disabled="scheduleReadOnly" placeholder="Any extra info or instructions"></textarea>
                  </div>
                  <hr />
                  <h6>Dose Schedule <span class="text-muted">(Configure each dose)</span></h6>
                  <div v-if="(schedulingFields.doses || []).length === 0" class="alert alert-info">Enter a value in <strong>Total Doses</strong> to create per-dose panels.</div>
                  <div v-else class="border rounded p-3 mb-3 bg-light-subtle">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong>Dose {{ (currentDoseIndex || 0) + 1 }} of {{ schedulingFields.total_doses }}</strong>
                        <div class="text-muted">Use Prev/Next or pick a dose below to navigate</div>
                      </div>
                      <div>
                        <button class="btn btn-sm btn-outline-secondary me-2" @click="prevDose" :disabled="currentDoseIndex === 0">&laquo; Prev</button>
                        <button class="btn btn-sm btn-outline-secondary" @click="nextDose" :disabled="currentDoseIndex >= (Number(schedulingFields.total_doses) - 1)">Next &raquo;</button>
                      </div>
                    </div>
                    <div class="mb-2">
                      <div class="btn-group" role="group" aria-label="Dose picker">
                        <button v-for="n in Number(schedulingFields.total_doses || 0)" :key="n" type="button" class="btn btn-sm" :class="{'btn-outline-secondary': currentDoseIndex !== (n-1), 'btn-primary': currentDoseIndex === (n-1)}" @click="goToDose(n-1)">Dose {{ n }}</button>
                      </div>
                    </div>
                    <div class="row g-3">
                      <div class="col-md-2">
                        <label class="form-label">Dose # *</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].dose_number" :disabled="scheduleReadOnly" min="1" required />
                        <small class="text-muted">e.g. 1, 2, 3</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Due After Days *</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].due_after_days" :disabled="scheduleReadOnly" min="0" required placeholder="e.g. 0, 42, 75" />
                        <small class="text-muted">Child's age in days for this dose.</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Min Interval (days)</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].min_interval_days" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 28" />
                        <small class="text-muted">Min days after previous dose.</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Max Interval (days)</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].max_interval_days" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 90" />
                        <small class="text-muted">Max days after previous dose.</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Min Interval Other Vax</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].min_interval_other_vax" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 14" />
                        <small class="text-muted">Min days after other vaccines.</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Requires Previous</label>
                        <select class="form-select" v-model="schedulingFields.doses[currentDoseIndex].requires_previous" :disabled="scheduleReadOnly">
                          <option :value="true">Yes</option>
                          <option :value="false">No</option>
                        </select>
                        <small class="text-muted">Must follow previous dose?</small>
                      </div>
                    </div>
                    <div class="mt-2">
                      <div v-if="errors.doses && errors.doses[currentDoseIndex]" class="text-danger small">
                        <div v-for="(msg, key) in errors.doses[currentDoseIndex]" :key="key">{{ msg }}</div>
                      </div>
                    </div>
                    <div class="row g-3 mt-1">
                      <div class="col-md-2">
                        <label class="form-label">Skippable</label>
                        <select class="form-select" v-model="schedulingFields.doses[currentDoseIndex].skippable" :disabled="scheduleReadOnly">
                          <option :value="true">Yes</option>
                          <option :value="false">No</option>
                        </select>
                        <small class="text-muted">Can this dose be skipped?</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Grace Period (days)</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].grace_period_days" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 7" />
                        <small class="text-muted">Days after due date still on time.</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Absolute Latest (days)</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].absolute_latest_days" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 180" />
                        <small class="text-muted">Last possible day for this dose.</small>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Notes</label>
                        <input type="text" class="form-control" v-model="schedulingFields.doses[currentDoseIndex].notes" :disabled="scheduleReadOnly" placeholder="Any special instructions" />
                      </div>
                    </div>
                  </div>
                  <div v-if="submitMessage" :class="{'alert': true, 'alert-success': submitMessage.includes('success'), 'alert-danger': !submitMessage.includes('success')}" >{{ submitMessage }}</div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showScheduleModal = false" :disabled="isSubmitting">
                <i class="bi bi-x-circle me-2"></i>Close
              </button>
              <button v-if="!scheduleReadOnly" class="btn btn-outline-secondary me-2" type="button" @click="openPreview">
                <i class="bi bi-eye me-2"></i>Preview Payload
              </button>
              <button v-if="!scheduleReadOnly" class="btn btn-primary" :disabled="!selectedVaccine || isSubmitting" @click="submitSchedule">
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check-circle me-2"></i>
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Modal -->
      <div v-if="showPreviewModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Preview Schedule Payload</h5>
              <button type="button" class="btn-close" @click="closePreview"></button>
            </div>
            <div class="modal-body">
              <pre style="max-height:60vh; overflow:auto; background:#f8f9fa; padding:1rem; border-radius:.25rem">{{ JSON.stringify(previewPayload, null, 2) }}</pre>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closePreview">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div v-if="showScheduleModal || showPreviewModal" class="modal-backdrop fade show"></div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { addToast } = useToast()

// State
const loading = ref(true)
const schedules = ref([])
const existingVaccines = ref([])
const showScheduleModal = ref(false)
const scheduleReadOnly = ref(false)
const selectedVaccine = ref('')
const currentDoseIndex = ref(0)
const isSubmitting = ref(false)
const submitMessage = ref('')
const errors = ref({ general: '', doses: [] })
const showPreviewModal = ref(false)
const previewPayload = ref(null)

const schedulingFields = ref({
  name: '',
  code: '',
  total_doses: 1,
  concurrent_allowed: false,
  catchup_strategy: '',
  min_age_days: 0,
  max_age_days: null,
  created_by: null,
  notes: '',
  doses: []
})

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchSchedules(), fetchExistingVaccines()])
  loading.value = false
})

// Watch for total_doses changes to create/remove dose panels
watch(() => schedulingFields.value.total_doses, (newVal) => {
  ensureDosesCount(newVal)
})

// Watch selectedVaccine to fetch its schedule
watch(selectedVaccine, (val) => {
  if (val) fetchSchedule(val)
  else resetSchedulingFields()
})

// API Calls
const fetchSchedules = async () => {
  try {
    const res = await api.get('/vaccines/schedules')
    const data = res.data?.data || res.data || []
    schedules.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Error fetching schedules', e)
    schedules.value = []
    addToast('Error loading schedules', 'error')
  }
}

const fetchExistingVaccines = async () => {
  try {
    const res = await api.get('/vaccines')
    const data = res.data?.data || res.data || []
    existingVaccines.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Error fetching vaccines', e)
    existingVaccines.value = []
    addToast('Error loading vaccines', 'error')
  }
}

async function fetchSchedule(vaccineId) {
  if (!vaccineId) return resetSchedulingFields()
  try {
    const res = await api.get(`/vaccines/${vaccineId}/schedule`)
    const payload = res.data?.data || res.data || null
    if (!payload) {
      resetSchedulingFields()
      return
    }

    const rawDoses = Array.isArray(payload.schedule_doses)
      ? payload.schedule_doses
      : (Array.isArray(payload.doses) ? payload.doses : [])

    const mappedDoses = rawDoses
      .map((d, i) => ({
        dose_number: d?.dose_number != null ? Number(d.dose_number) : (i + 1),
        due_after_days: d?.due_after_days == null ? '' : Number(d.due_after_days),
        min_interval_days: d?.min_interval_days == null ? '' : Number(d.min_interval_days),
        max_interval_days: d?.max_interval_days == null ? '' : Number(d.max_interval_days),
        min_interval_other_vax: d?.min_interval_other_vax == null ? '' : Number(d.min_interval_other_vax),
        requires_previous: !!d?.requires_previous,
        skippable: !!d?.skippable,
        grace_period_days: d?.grace_period_days == null ? '' : Number(d.grace_period_days),
        absolute_latest_days: d?.absolute_latest_days == null ? '' : Number(d.absolute_latest_days),
        notes: d?.notes || ''
      }))
      .sort((a, b) => (a.dose_number || 0) - (b.dose_number || 0))

    schedulingFields.value = {
      name: payload.name || '',
      code: payload.code || '',
      total_doses: Number(payload.total_doses) || mappedDoses.length || 1,
      concurrent_allowed: !!payload.concurrent_allowed,
      catchup_strategy: payload.catchup_strategy || '',
      min_age_days: payload.min_age_days != null ? Number(payload.min_age_days) : 0,
      max_age_days: payload.max_age_days != null ? Number(payload.max_age_days) : null,
      created_by: payload.created_by || null,
      notes: payload.notes || '',
      doses: mappedDoses
    }

    currentDoseIndex.value = 0
    ensureDosesCount(schedulingFields.value.total_doses)
  } catch (e) {
    console.error('Error fetching schedule for vaccine', vaccineId, e)
    resetSchedulingFields()
    addToast('Error loading schedule', 'error')
  }
}

async function submitSchedule() {
  if (!selectedVaccine.value) return
  isSubmitting.value = true
  submitMessage.value = ''
  
  if (!validateSchedule()) {
    submitMessage.value = errors.value.general || 'Validation failed.'
    isSubmitting.value = false
    return
  }
  
  const payload = buildPayload()
  try {
    const res = await api.post(`/vaccines/${selectedVaccine.value}/schedule`, payload)
    const data = res.data
    if (data && (data.success || res.status === 200 || res.status === 201)) {
      submitMessage.value = 'Scheduling updated successfully.'
      await fetchSchedules()
      setTimeout(() => {
        showScheduleModal.value = false
        submitMessage.value = ''
        addToast('Schedule saved successfully!', 'success')
      }, 800)
    } else {
      submitMessage.value = data?.message || 'Failed to update scheduling.'
    }
  } catch (e) {
    console.error('Error posting schedule', e)
    submitMessage.value = 'Error connecting to server.'
    addToast('Error saving schedule', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Helper Functions
function resetSchedulingFields() {
  schedulingFields.value = {
    name: '',
    code: '',
    total_doses: 1,
    concurrent_allowed: false,
    catchup_strategy: '',
    min_age_days: 0,
    max_age_days: null,
    created_by: null,
    notes: '',
    doses: []
  }
}

function ensureDosesCount(count) {
  const n = Number(count) || 0
  const doses = schedulingFields.value.doses || []
  if (doses.length < n) {
    for (let i = doses.length; i < n; i++) {
      doses.push({
        dose_number: i + 1,
        due_after_days: '',
        min_interval_days: '',
        max_interval_days: '',
        min_interval_other_vax: '',
        requires_previous: false,
        skippable: false,
        grace_period_days: '',
        absolute_latest_days: '',
        notes: ''
      })
    }
  } else if (doses.length > n) {
    doses.splice(n)
    if (currentDoseIndex.value >= n) currentDoseIndex.value = Math.max(0, n - 1)
  }
  schedulingFields.value.doses = doses
}

function clearErrors() {
  errors.value = { general: '', doses: [] }
}

function validateSchedule() {
  clearErrors()
  const sf = schedulingFields.value
  if (!sf.name || String(sf.name).trim() === '') {
    errors.value.general = 'Schedule name is required.'
    return false
  }
  const total = Number(sf.total_doses) || 0
  if (total < 1) {
    errors.value.general = 'Total doses must be at least 1.'
    return false
  }
  if (!Array.isArray(sf.doses) || sf.doses.length < total) {
    errors.value.general = 'Dose count does not match Total Doses.'
    return false
  }
  
  for (let i = 0; i < total; i++) {
    const d = sf.doses[i] || {}
    const dErr = {}
    if (d.dose_number == null) dErr.dose_number = 'Dose number required.'
    if (d.due_after_days === '' || d.due_after_days == null) dErr.due_after_days = 'Due After Days required.'
    if (Object.keys(dErr).length > 0) {
      errors.value.doses[i] = dErr
    }
  }
  
  if (errors.value.doses.some(x => x && Object.keys(x).length > 0)) {
    errors.value.general = errors.value.general || 'Please fix per-dose errors.'
    return false
  }
  return true
}

function buildPayload() {
  const sf = schedulingFields.value
  const payload = {
    name: String(sf.name || ''),
    code: sf.code || null,
    total_doses: Number(sf.total_doses) || 0,
    concurrent_allowed: !!sf.concurrent_allowed,
    catchup_strategy: sf.catchup_strategy || null,
    min_age_days: sf.min_age_days != null ? Number(sf.min_age_days) : null,
    max_age_days: sf.max_age_days != null ? Number(sf.max_age_days) : null,
    notes: sf.notes || null,
    doses: (sf.doses || []).map(d => ({
      dose_number: Number(d.dose_number) || null,
      due_after_days: d.due_after_days === '' || d.due_after_days == null ? null : Number(d.due_after_days),
      min_interval_days: d.min_interval_days === '' || d.min_interval_days == null ? null : Number(d.min_interval_days),
      max_interval_days: d.max_interval_days === '' || d.max_interval_days == null ? null : Number(d.max_interval_days),
      min_interval_other_vax: d.min_interval_other_vax === '' || d.min_interval_other_vax == null ? null : Number(d.min_interval_other_vax),
      requires_previous: !!d.requires_previous,
      skippable: !!d.skippable,
      grace_period_days: d.grace_period_days === '' || d.grace_period_days == null ? null : Number(d.grace_period_days),
      absolute_latest_days: d.absolute_latest_days === '' || d.absolute_latest_days == null ? null : Number(d.absolute_latest_days),
      notes: d.notes || null
    }))
  }
  return payload
}

// Modal Actions
function openScheduleModal() {
  resetSchedulingFields()
  selectedVaccine.value = ''
  scheduleReadOnly.value = false
  currentDoseIndex.value = 0
  showScheduleModal.value = true
}

const editSchedule = (s) => {
  scheduleReadOnly.value = false
  const vaccineId = s.vaccine?.vaccine_id || s.vaccine_id || null
  if (vaccineId) {
    selectedVaccine.value = vaccineId
    fetchSchedule(vaccineId)
  } else {
    schedulingFields.value = { ...s }
  }
  showScheduleModal.value = true
}

const viewSchedule = (s) => {
  scheduleReadOnly.value = true
  const vaccineId = s.vaccine?.vaccine_id || s.vaccine_id || null
  if (vaccineId) {
    selectedVaccine.value = vaccineId
    fetchSchedule(vaccineId)
  } else {
    schedulingFields.value = { ...s }
    currentDoseIndex.value = 0
  }
  showScheduleModal.value = true
}

// Dose Navigation
function nextDose() {
  const total = Number(schedulingFields.value.total_doses) || schedulingFields.value.doses.length
  if (currentDoseIndex.value < total - 1) currentDoseIndex.value++
}

function prevDose() {
  if (currentDoseIndex.value > 0) currentDoseIndex.value--
}

function goToDose(i) {
  const total = Number(schedulingFields.value.total_doses) || schedulingFields.value.doses.length
  if (i >= 0 && i < total) currentDoseIndex.value = i
}

// Preview Modal
function openPreview() {
  if (!validateSchedule()) {
    submitMessage.value = errors.value.general || 'Validation failed.'
    return
  }
  previewPayload.value = buildPayload()
  showPreviewModal.value = true
}

function closePreview() {
  showPreviewModal.value = false
  previewPayload.value = null
}

// Date Formatting
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin: 0;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
}

.breadcrumb-item a {
  color: #4e73df;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #6c757d;
}

.text-gray-800 {
  color: #5a5c69 !important;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.bg-light-subtle {
  background-color: #f8f9fa !important;
}
</style>
