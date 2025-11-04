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
          <li class="breadcrumb-item active">Add Schedule</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-plus-circle me-2"></i>Create Vaccine Schedule
          </h1>
          <p class="text-muted mb-0">Configure vaccination schedule and dosage timeline</p>
        </div>
        <div class="d-flex gap-2">
          <button @click="goBack" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>Back
          </button>
          <router-link to="/admin/vaccines" class="btn btn-outline-primary">
            <i class="bi bi-house me-2"></i>Home
          </router-link>
        </div>
      </div>

      <!-- Form Card -->
      <div class="card shadow">
        <div class="card-body p-4">
          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label class="form-label">Select Vaccine Type *</label>
              <div class="vaccine-dropdown-wrapper" v-click-outside="() => dropdownOpen = false">
                <input
                  type="text"
                  class="form-control"
                  v-model="vaccineSearch"
                  @input="onVaccineInput"
                  @focus="openDropdown"
                  placeholder="Type or select a vaccine..."
                  autocomplete="off"
                  :ref="el => inputRef = el"
                  required
                />
                <div
                  v-if="dropdownOpen"
                  class="vaccine-dropdown-menu"
                  :style="dropdownPosition"
                >
                  <div
                    class="vaccine-dropdown-item"
                    @click="selectVaccine(null)"
                  >
                    -- Select Vaccine --
                  </div>
                  <div
                    v-for="v in getFilteredVaccines().slice(0, 4)"
                    :key="v.id"
                    class="vaccine-dropdown-item"
                    @click="selectVaccine(v)"
                  >
                    {{ v.antigen_name }} ({{ v.brand_name }})
                  </div>
                </div>
              </div>
              <small v-if="existingVaccines.length > 0 && unscheduledVaccines.length === 0" class="text-muted d-block mt-1">
                All vaccine types already have schedules configured.
              </small>
            </div>

            <div v-if="selectedVaccine">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Schedule Name *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="schedulingFields.name" 
                    required 
                    placeholder="e.g. NIP BCG Schedule" 
                  />
                  <small class="text-muted">A descriptive name for this schedule.</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Schedule Code</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="schedulingFields.code" 
                    placeholder="e.g. NIP-BCG-2025" 
                  />
                  <small class="text-muted">Optional code for reference.</small>
                </div>
              </div>

              <div class="row g-3 mt-1">
                <div class="col-md-4">
                  <label class="form-label">Total Doses *</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    v-model.number="schedulingFields.total_doses" 
                    min="1" 
                    required 
                    placeholder="e.g. 3" 
                  />
                  <small class="text-muted">How many doses in this series?</small>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Concurrent Allowed</label>
                  <select class="form-select" v-model="schedulingFields.concurrent_allowed">
                    <option :value="true">Yes</option>
                    <option :value="false">No</option>
                  </select>
                  <small class="text-muted">Can this vaccine be given with others?</small>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Catch-up Strategy</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="schedulingFields.catchup_strategy" 
                    placeholder="e.g. Give ASAP if missed" 
                  />
                </div>
              </div>

              <div class="row g-3 mt-1">
                <div class="col-md-6">
                  <label class="form-label">Minimum Age (days) *</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    v-model.number="schedulingFields.min_age_days" 
                    min="0" 
                    required 
                    placeholder="e.g. 0 for birth" 
                  />
                  <small class="text-muted">Earliest age (in days) for first dose.</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Maximum Age (days)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    v-model.number="schedulingFields.max_age_days" 
                    min="0" 
                    placeholder="e.g. 365 for 1 year" 
                  />
                  <small class="text-muted">Latest age (optional).</small>
                </div>
              </div>

              <div class="mb-3 mt-2">
                <label class="form-label">Notes</label>
                <textarea 
                  class="form-control" 
                  v-model="schedulingFields.notes" 
                  placeholder="Any extra info or instructions"
                  rows="3"
                ></textarea>
              </div>

              <hr />
              
              <h6 class="mb-3">
                <i class="bi bi-list-ol me-2"></i>Dose Schedule 
                <span class="text-muted">(Configure each dose)</span>
              </h6>

              <div v-if="schedulingFields.doses.length === 0" class="alert alert-info">
                Enter a value in <strong>Total Doses</strong> to create per-dose panels.
              </div>

              <div v-else class="border rounded p-3 mb-3 bg-light">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <strong>Dose {{ currentDoseIndex + 1 }} of {{ schedulingFields.total_doses }}</strong>
                    <div class="text-muted">Use Prev/Next or pick a dose below to navigate</div>
                  </div>
                  <div>
                    <button 
                      type="button"
                      class="btn btn-sm btn-outline-secondary me-2" 
                      @click="prevDose" 
                      :disabled="currentDoseIndex === 0"
                    >
                      &laquo; Prev
                    </button>
                    <button 
                      type="button"
                      class="btn btn-sm btn-outline-secondary" 
                      @click="nextDose" 
                      :disabled="currentDoseIndex >= schedulingFields.total_doses - 1"
                    >
                      Next &raquo;
                    </button>
                  </div>
                </div>

                <div class="mb-2">
                  <div class="btn-group" role="group">
                    <button 
                      v-for="n in schedulingFields.total_doses" 
                      :key="n" 
                      type="button" 
                      class="btn btn-sm" 
                      :class="currentDoseIndex === (n-1) ? 'btn-primary' : 'btn-outline-secondary'" 
                      @click="goToDose(n-1)"
                    >
                      Dose {{ n }}
                    </button>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-md-2">
                    <label class="form-label">Dose # *</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="schedulingFields.doses[currentDoseIndex].dose_number" 
                      min="1" 
                      required 
                    />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Due After Days *</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="schedulingFields.doses[currentDoseIndex].due_after_days" 
                      min="0" 
                      required 
                      placeholder="e.g. 0, 42"
                    />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Min Interval</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="schedulingFields.doses[currentDoseIndex].min_interval_days" 
                      min="0" 
                      placeholder="e.g. 28"
                    />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Max Interval</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="schedulingFields.doses[currentDoseIndex].max_interval_days" 
                      min="0" 
                      placeholder="e.g. 90"
                    />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Min Other Vax</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="schedulingFields.doses[currentDoseIndex].min_interval_other_vax" 
                      min="0" 
                      placeholder="e.g. 14"
                    />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Requires Previous</label>
                    <select 
                      class="form-select" 
                      v-model="schedulingFields.doses[currentDoseIndex].requires_previous"
                    >
                      <option :value="true">Yes</option>
                      <option :value="false">No</option>
                    </select>
                  </div>
                </div>

                <div class="row g-3 mt-1">
                  <div class="col-md-2">
                    <label class="form-label">Skippable</label>
                    <select 
                      class="form-select" 
                      v-model="schedulingFields.doses[currentDoseIndex].skippable"
                    >
                      <option :value="true">Yes</option>
                      <option :value="false">No</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Grace Period</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="schedulingFields.doses[currentDoseIndex].grace_period_days" 
                      min="0" 
                      placeholder="e.g. 7"
                    />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Absolute Latest</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model.number="schedulingFields.doses[currentDoseIndex].absolute_latest_days" 
                      min="0" 
                      placeholder="e.g. 180"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Notes</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      v-model="schedulingFields.doses[currentDoseIndex].notes" 
                      placeholder="Any special instructions"
                    />
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="handleCancel">
                  <i class="bi bi-x-circle me-2"></i>Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="submitting || !selectedVaccine">
                  <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-check-circle me-2"></i>
                  Save Schedule
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  }
}

const router = useRouter()
const { addToast } = useToast()

const existingVaccines = ref([])
const schedules = ref([])
const selectedVaccine = ref('')
const currentDoseIndex = ref(0)
const submitting = ref(false)

// Dropdown state
const vaccineSearch = ref('')
const dropdownOpen = ref(false)
const inputRef = ref(null)
const dropdownPosition = ref({})

const schedulingFields = ref({
  name: '',
  code: '',
  total_doses: 1,
  concurrent_allowed: false,
  catchup_strategy: '',
  min_age_days: 0,
  max_age_days: null,
  notes: '',
  doses: []
})

const goBack = () => {
  router.back()
}

onMounted(async () => {
  await Promise.all([fetchExistingVaccines(), fetchSchedules()])
})

watch(() => schedulingFields.value.total_doses, (newVal) => {
  ensureDosesCount(newVal)
})

const fetchExistingVaccines = async () => {
  try {
    const res = await api.get('/vaccines')
    // Normalize various API shapes: array, { data: array }, { data: { vaccines: [...] } }, or { vaccines: [...] }
    let raw = res.data?.data ?? res.data ?? []
    if (raw && typeof raw === 'object' && Array.isArray(raw.vaccines)) {
      raw = raw.vaccines
    }
    // If still not an array but is a single object, wrap it
    if (raw && !Array.isArray(raw) && typeof raw === 'object') {
      raw = [raw]
    }
    // Map and add a stable id alias
    existingVaccines.value = Array.isArray(raw)
      ? raw.map(v => ({ ...v, id: v.vaccine_id || v.id }))
      : []
  } catch (e) {
    console.error('Error fetching vaccines', e)
    addToast({ message: 'Error loading vaccines', type: 'error' })
  }
}

const fetchSchedules = async () => {
  try {
    const res = await api.get('/vaccines/schedules')
    const data = res.data?.data || res.data || []
    schedules.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Error fetching schedules', e)
    schedules.value = []
  }
}

// Vaccines without an existing schedule
const unscheduledVaccines = computed(() => {
  if (!Array.isArray(existingVaccines.value)) return []
  const scheduledIds = new Set(
    (schedules.value || []).map(s => s.vaccine_id || s.vaccine?.vaccine_id || s.vaccineId).filter(Boolean)
  )
  return existingVaccines.value
    .map(v => ({ ...v, id: v.vaccine_id || v.id }))
    .filter(v => !scheduledIds.has(v.id))
})

function openDropdown(event) {
  dropdownOpen.value = true
  if (inputRef.value) {
    const rect = inputRef.value.getBoundingClientRect()
    dropdownPosition.value = {
      position: 'fixed',
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      minWidth: `${rect.width}px`
    }
  }
}

function onVaccineInput() {
  dropdownOpen.value = true
  selectedVaccine.value = ''
}

function getFilteredVaccines() {
  if (!vaccineSearch.value || vaccineSearch.value.trim() === '') {
    return unscheduledVaccines.value
  }
  const search = vaccineSearch.value.toLowerCase()
  return unscheduledVaccines.value.filter(v =>
    v.antigen_name.toLowerCase().includes(search) ||
    v.brand_name.toLowerCase().includes(search)
  )
}

function selectVaccine(vaccine) {
  if (!vaccine) {
    selectedVaccine.value = ''
    vaccineSearch.value = ''
  } else {
    selectedVaccine.value = vaccine.id
    vaccineSearch.value = `${vaccine.antigen_name} (${vaccine.brand_name})`
  }
  dropdownOpen.value = false
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
    if (currentDoseIndex.value >= n) {
      currentDoseIndex.value = Math.max(0, n - 1)
    }
  }
  
  schedulingFields.value.doses = doses
}

function nextDose() {
  if (currentDoseIndex.value < schedulingFields.value.total_doses - 1) {
    currentDoseIndex.value++
  }
}

function prevDose() {
  if (currentDoseIndex.value > 0) {
    currentDoseIndex.value--
  }
}

function goToDose(i) {
  if (i >= 0 && i < schedulingFields.value.total_doses) {
    currentDoseIndex.value = i
  }
}

function buildPayload() {
  const sf = schedulingFields.value
  return {
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
      due_after_days: d.due_after_days === '' ? null : Number(d.due_after_days),
      min_interval_days: d.min_interval_days === '' ? null : Number(d.min_interval_days),
      max_interval_days: d.max_interval_days === '' ? null : Number(d.max_interval_days),
      min_interval_other_vax: d.min_interval_other_vax === '' ? null : Number(d.min_interval_other_vax),
      requires_previous: !!d.requires_previous,
      skippable: !!d.skippable,
      grace_period_days: d.grace_period_days === '' ? null : Number(d.grace_period_days),
      absolute_latest_days: d.absolute_latest_days === '' ? null : Number(d.absolute_latest_days),
      notes: d.notes || null
    }))
  }
}

const handleSubmit = async () => {
  if (!selectedVaccine.value) return
  
  submitting.value = true
  try {
    const payload = buildPayload()
    await api.post(`/vaccines/${selectedVaccine.value}/schedule`, payload)
    addToast({ message: 'Schedule created successfully!', type: 'success' })
    router.push('/admin/vaccines')
  } catch (error) {
    console.error('Error creating schedule:', error)
    addToast({ message: error.response?.data?.message || 'Error creating schedule', type: 'error' })
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/vaccines')
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

.vaccine-dropdown-wrapper {
  position: relative;
}

.vaccine-dropdown-menu {
  position: fixed;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  z-index: 9999;
  max-height: none;
  overflow: visible;
  min-width: 300px;
}

.vaccine-dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.95rem;
  white-space: nowrap;
}

.vaccine-dropdown-item:last-child {
  border-bottom: none;
}

.vaccine-dropdown-item:hover {
  background-color: #0d6efd;
  color: white;
}

.vaccine-dropdown-item:first-child {
  font-style: italic;
  color: #6c757d;
}

.vaccine-dropdown-item:first-child:hover {
  background-color: #e9ecef;
  color: #6c757d;
}
</style>
