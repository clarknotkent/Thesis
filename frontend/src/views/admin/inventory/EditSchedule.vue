<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav
        aria-label="breadcrumb"
        class="mb-3"
      >
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">
              Admin
            </router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/admin/vaccines">
              Vaccine Inventory
            </router-link>
          </li>
          <li class="breadcrumb-item active">
            Edit Schedule
          </li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-pencil me-2" />Edit Vaccine Schedule
          </h1>
          <p class="text-muted mb-0">
            Modify vaccination schedule and dosage timeline
          </p>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-secondary"
            @click="goBack"
          >
            <i class="bi bi-arrow-left me-2" />Back
          </button>
          <router-link
            to="/admin/vaccines"
            class="btn btn-outline-primary"
          >
            <i class="bi bi-house me-2" />Home
          </router-link>
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
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Form Card -->
      <div
        v-else-if="scheduleLoaded"
        class="card shadow"
      >
        <div class="card-body p-4">
          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label class="form-label">Vaccine Type *</label>
              <input 
                type="text" 
                class="form-control" 
                :value="selectedVaccine.antigen_name + ' (' + selectedVaccine.brand_name + ')'" 
                readonly
                disabled
              >
            </div>

            <div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Schedule Name *</label>
                  <input 
                    v-model="schedulingFields.name" 
                    type="text" 
                    class="form-control" 
                    required 
                    placeholder="e.g. NIP BCG Schedule" 
                  >
                  <small class="text-muted">A descriptive name for this schedule.</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Schedule Code</label>
                  <input 
                    v-model="schedulingFields.code" 
                    type="text" 
                    class="form-control" 
                    placeholder="e.g. NIP-BCG-2025" 
                  >
                  <small class="text-muted">Optional code for reference.</small>
                </div>
              </div>

              <div class="row g-3 mt-1">
                <div class="col-md-4">
                  <label class="form-label">Total Doses *</label>
                  <input 
                    v-model.number="schedulingFields.total_doses" 
                    type="number" 
                    class="form-control" 
                    min="1" 
                    required 
                    placeholder="e.g. 3" 
                  >
                  <small class="text-muted">How many doses in this series?</small>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Concurrent Allowed</label>
                  <select
                    v-model="schedulingFields.concurrent_allowed"
                    class="form-select"
                  >
                    <option :value="true">
                      Yes
                    </option>
                    <option :value="false">
                      No
                    </option>
                  </select>
                  <small class="text-muted">Can this vaccine be given with others?</small>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Catch-up Strategy</label>
                  <input 
                    v-model="schedulingFields.catchup_strategy" 
                    type="text" 
                    class="form-control" 
                    placeholder="e.g. Give ASAP if missed" 
                  >
                </div>
              </div>

              <div class="row g-3 mt-1">
                <div class="col-md-6">
                  <label class="form-label">Minimum Age (days) *</label>
                  <input 
                    v-model.number="schedulingFields.min_age_days" 
                    type="number" 
                    class="form-control" 
                    min="0" 
                    required 
                    placeholder="e.g. 0 for birth" 
                  >
                  <small class="text-muted">Earliest age (in days) for first dose.</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Maximum Age (days)</label>
                  <input 
                    v-model.number="schedulingFields.max_age_days" 
                    type="number" 
                    class="form-control" 
                    min="0" 
                    placeholder="e.g. 365 for 1 year" 
                  >
                  <small class="text-muted">Latest age (optional).</small>
                </div>
              </div>

              <div class="mb-3 mt-2">
                <label class="form-label">Notes</label>
                <textarea 
                  v-model="schedulingFields.notes" 
                  class="form-control" 
                  placeholder="Any extra info or instructions"
                  rows="3"
                />
              </div>

              <hr>
              
              <h6 class="mb-3">
                <i class="bi bi-list-ol me-2" />Dose Schedule 
                <span class="text-muted">(Configure each dose)</span>
              </h6>

              <div
                v-if="schedulingFields.doses.length === 0"
                class="alert alert-info"
              >
                Enter a value in <strong>Total Doses</strong> to create per-dose panels.
              </div>

              <div
                v-else
                class="border rounded p-3 mb-3 bg-light"
              >
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <strong>Dose {{ currentDoseIndex + 1 }} of {{ schedulingFields.total_doses }}</strong>
                    <div class="text-muted">
                      Use Prev/Next or pick a dose below to navigate
                    </div>
                  </div>
                  <div>
                    <button 
                      type="button"
                      class="btn btn-sm btn-outline-secondary me-2" 
                      :disabled="currentDoseIndex === 0" 
                      @click="prevDose"
                    >
                      &laquo; Prev
                    </button>
                    <button 
                      type="button"
                      class="btn btn-sm btn-outline-secondary" 
                      :disabled="currentDoseIndex >= schedulingFields.total_doses - 1" 
                      @click="nextDose"
                    >
                      Next &raquo;
                    </button>
                  </div>
                </div>

                <div class="mb-2">
                  <div
                    class="btn-group"
                    role="group"
                  >
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
                      v-model.number="schedulingFields.doses[currentDoseIndex].dose_number" 
                      type="number" 
                      class="form-control" 
                      min="1" 
                      required 
                    >
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Due After Days *</label>
                    <input 
                      v-model.number="schedulingFields.doses[currentDoseIndex].due_after_days" 
                      type="number" 
                      class="form-control" 
                      min="0" 
                      required 
                      placeholder="e.g. 0, 42"
                    >
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Min Interval</label>
                    <input 
                      v-model.number="schedulingFields.doses[currentDoseIndex].min_interval_days" 
                      type="number" 
                      class="form-control" 
                      min="0" 
                      placeholder="e.g. 28"
                    >
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Max Interval</label>
                    <input 
                      v-model.number="schedulingFields.doses[currentDoseIndex].max_interval_days" 
                      type="number" 
                      class="form-control" 
                      min="0" 
                      placeholder="e.g. 90"
                    >
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Min Other Vax</label>
                    <input 
                      v-model.number="schedulingFields.doses[currentDoseIndex].min_interval_other_vax" 
                      type="number" 
                      class="form-control" 
                      min="0" 
                      placeholder="e.g. 14"
                    >
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Requires Previous</label>
                    <select 
                      v-model="schedulingFields.doses[currentDoseIndex].requires_previous" 
                      class="form-select"
                    >
                      <option :value="true">
                        Yes
                      </option>
                      <option :value="false">
                        No
                      </option>
                    </select>
                  </div>
                </div>

                <div class="row g-3 mt-1">
                  <div class="col-md-2">
                    <label class="form-label">Skippable</label>
                    <select 
                      v-model="schedulingFields.doses[currentDoseIndex].skippable" 
                      class="form-select"
                    >
                      <option :value="true">
                        Yes
                      </option>
                      <option :value="false">
                        No
                      </option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Grace Period</label>
                    <input 
                      v-model.number="schedulingFields.doses[currentDoseIndex].grace_period_days" 
                      type="number" 
                      class="form-control" 
                      min="0" 
                      placeholder="e.g. 7"
                    >
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Absolute Latest</label>
                    <input 
                      v-model.number="schedulingFields.doses[currentDoseIndex].absolute_latest_days" 
                      type="number" 
                      class="form-control" 
                      min="0" 
                      placeholder="e.g. 180"
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Notes</label>
                    <input 
                      v-model="schedulingFields.doses[currentDoseIndex].notes" 
                      type="text" 
                      class="form-control" 
                      placeholder="Any special instructions"
                    >
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="handleCancel"
                >
                  <i class="bi bi-x-circle me-2" />Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="submitting"
                >
                  <span
                    v-if="submitting"
                    class="spinner-border spinner-border-sm me-2"
                  />
                  <i
                    v-else
                    class="bi bi-check-circle me-2"
                  />
                  Update Schedule
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else
        class="alert alert-danger"
      >
        <i class="bi bi-exclamation-circle me-2" />
        Failed to load schedule data. <router-link to="/admin/vaccines">
          Go back to inventory
        </router-link>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const loading = ref(true)
const scheduleLoaded = ref(false)
const existingVaccines = ref([])
const selectedVaccine = ref('')
const currentDoseIndex = ref(0)
const submitting = ref(false)
const scheduleId = computed(() => route.params.id)

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
  await Promise.all([fetchExistingVaccines(), fetchSchedule()])
})

watch(() => schedulingFields.value.total_doses, (newVal) => {
  ensureDosesCount(newVal)
})

const fetchExistingVaccines = async () => {
  try {
    const res = await api.get('/vaccines')
    const data = res.data?.data || res.data || []
    // Normalize id alias so the disabled select binds properly to selectedVaccine (v.id)
    existingVaccines.value = Array.isArray(data)
      ? data.map(v => ({ ...v, id: v.vaccine_id || v.id }))
      : []
  } catch (e) {
    console.error('Error fetching vaccines', e)
  addToast({ title: 'Error', message: 'Error loading vaccines', type: 'error' })
  }
}

const fetchSchedule = async () => {
  try {
    const id = scheduleId.value
    const res = await api.get(`/vaccines/schedules/${id}`)
    const data = res.data?.data || res.data
    
    if (!data) {
      scheduleLoaded.value = false
      return
    }

    // Set selected vaccine
    selectedVaccine.value = data.vaccine

    // Map dose data
    const rawDoses = Array.isArray(data.schedule_doses)
      ? data.schedule_doses
      : (Array.isArray(data.doses) ? data.doses : [])

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
      name: data.name || '',
      code: data.code || '',
      total_doses: Number(data.total_doses) || mappedDoses.length || 1,
      concurrent_allowed: !!data.concurrent_allowed,
      catchup_strategy: data.catchup_strategy || '',
      min_age_days: data.min_age_days != null ? Number(data.min_age_days) : 0,
      max_age_days: data.max_age_days != null ? Number(data.max_age_days) : null,
      notes: data.notes || '',
      doses: mappedDoses
    }

    ensureDosesCount(schedulingFields.value.total_doses)
    scheduleLoaded.value = true
  } catch (error) {
    console.error('Error fetching schedule:', error)
  addToast({ title: 'Error', message: 'Error loading schedule data', type: 'error' })
    scheduleLoaded.value = false
  } finally {
    loading.value = false
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
  // Accept either vaccine_id (preferred) or id fallback; deref ref correctly
  const v = selectedVaccine?.value || {}
  const vid = v.vaccine_id || v.id
  if (!vid) {
  addToast({ title: 'Error', message: 'Missing vaccine identifier for this schedule.', type: 'error' })
    return
  }

  submitting.value = true
  try {
    const payload = buildPayload()
    const res = await api.put(`/vaccines/${vid}/schedule`, payload)
    // Prefer server message when provided; fallback to default
  const okMsg = (res?.data?.message ? String(res.data.message).trim() : '') || 'Schedule updated successfully!'
  addToast({ title: 'Success', message: okMsg, type: 'success' })
    router.push('/admin/vaccines')
  } catch (error) {
    console.error('Error updating schedule:', error)
  const errMsg = (error?.response?.data?.message ? String(error.response.data.message).trim() : '') || 'Error updating schedule'
  addToast({ title: 'Error', message: errMsg, type: 'error' })
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.back()
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
</style>
