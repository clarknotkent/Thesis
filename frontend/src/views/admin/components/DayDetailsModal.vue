<template>
  <teleport to="body">
    <div
      v-if="show"
      class="modal fade show d-block"
      tabindex="-1"
      @click.self="$emit('close')"
    >
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-calendar-day me-2" />
              {{ formatDate(day.date) }}
              <span
                v-if="day.isToday"
                class="badge bg-primary ms-2"
              >Today</span>
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="$emit('close')"
            />
          </div>

          <div class="modal-body">
            <!-- Capacity Settings -->
            <div class="capacity-settings mb-4">
              <h6 class="fw-bold mb-3">
                <i class="bi bi-sliders me-2" />
                Capacity Settings
              </h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">
                    <i class="bi bi-sunrise me-1" />
                    AM Capacity
                  </label>
                  <input
                    v-model.number="editedCapacity.amCapacity"
                    type="number"
                    class="form-control"
                    min="0"
                    :disabled="!isEditing"
                  >
                  <small class="text-muted">Current: {{ day.amBooked }} booked</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">
                    <i class="bi bi-sunset me-1" />
                    PM Capacity
                  </label>
                  <input
                    v-model.number="editedCapacity.pmCapacity"
                    type="number"
                    class="form-control"
                    min="0"
                    :disabled="!isEditing"
                  >
                  <small class="text-muted">Current: {{ day.pmBooked }} booked</small>
                </div>
                <div class="col-12">
                  <label class="form-label">
                    <i class="bi bi-sticky me-1" />
                    Notes
                  </label>
                  <textarea
                    v-model="editedCapacity.notes"
                    class="form-control"
                    rows="2"
                    :disabled="!isEditing"
                    placeholder="Add notes for this day..."
                  />
                </div>
              </div>

              <div class="mt-3">
                <button
                  v-if="!isEditing"
                  class="btn btn-primary btn-sm"
                  @click="startEditing"
                >
                  <i class="bi bi-pencil me-1" />
                  Edit Capacity
                </button>
                <div
                  v-else
                  class="d-flex gap-2"
                >
                  <button
                    class="btn btn-success btn-sm"
                    :disabled="saving"
                    @click="saveCapacity"
                  >
                    <i class="bi bi-check-lg me-1" />
                    Save Changes
                  </button>
                  <button
                    class="btn btn-secondary btn-sm"
                    :disabled="saving"
                    @click="cancelEditing"
                  >
                    <i class="bi bi-x-lg me-1" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <!-- Utilization Summary -->
            <div class="utilization-summary mb-4">
              <h6 class="fw-bold mb-3">
                <i class="bi bi-graph-up me-2" />
                Utilization
              </h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="stat-card am">
                    <div class="stat-icon">
                      <i class="bi bi-sunrise" />
                    </div>
                    <div class="stat-content">
                      <div class="stat-label">
                        AM Appointments
                      </div>
                      <div class="stat-value">
                        {{ day.amBooked }} / {{ day.amCapacity }}
                      </div>
                      <div class="progress mt-2">
                        <div
                          class="progress-bar"
                          :class="getProgressBarClass(amUtilization)"
                          :style="{ width: amUtilization + '%' }"
                        />
                      </div>
                      <small class="text-muted">{{ amUtilization.toFixed(0) }}% utilized</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="stat-card pm">
                    <div class="stat-icon">
                      <i class="bi bi-sunset" />
                    </div>
                    <div class="stat-content">
                      <div class="stat-label">
                        PM Appointments
                      </div>
                      <div class="stat-value">
                        {{ day.pmBooked }} / {{ day.pmCapacity }}
                      </div>
                      <div class="progress mt-2">
                        <div
                          class="progress-bar"
                          :class="getProgressBarClass(pmUtilization)"
                          :style="{ width: pmUtilization + '%' }"
                        />
                      </div>
                      <small class="text-muted">{{ pmUtilization.toFixed(0) }}% utilized</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Patient Lists -->
            <div class="patient-lists">
              <h6 class="fw-bold mb-3">
                <i class="bi bi-people me-2" />
                Scheduled Patients
              </h6>

              <ul
                class="nav nav-tabs mb-3"
                role="tablist"
              >
                <li class="nav-item">
                  <button
                    class="nav-link"
                    :class="{ active: activeTab === 'AM' }"
                    @click="activeTab = 'AM'; loadPatients()"
                  >
                    <i class="bi bi-sunrise me-1" />
                    AM ({{ day.amBooked }})
                  </button>
                </li>
                <li class="nav-item">
                  <button
                    class="nav-link"
                    :class="{ active: activeTab === 'PM' }"
                    @click="activeTab = 'PM'; loadPatients()"
                  >
                    <i class="bi bi-sunset me-1" />
                    PM ({{ day.pmBooked }})
                  </button>
                </li>
              </ul>

              <div
                v-if="loadingPatients"
                class="text-center py-3"
              >
                <div
                  class="spinner-border spinner-border-sm text-primary"
                  role="status"
                >
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>

              <div
                v-else-if="patients.length === 0"
                class="text-center text-muted py-3"
              >
                <i class="bi bi-inbox fs-3 d-block mb-2" />
                <p class="mb-0">
                  No patients scheduled for {{ activeTab }}
                </p>
              </div>

              <div
                v-else
                class="patient-list"
              >
                <div
                  v-for="patient in patients"
                  :key="patient.scheduleId"
                  class="patient-card"
                >
                  <div class="patient-info">
                    <div class="d-flex align-items-center mb-2">
                      <div class="patient-avatar me-2">
                        <i class="bi bi-person-circle" />
                      </div>
                      <div>
                        <div class="patient-name">
                          {{ patient.patient.name }}
                        </div>
                        <div class="patient-age text-muted">
                          <i class="bi bi-calendar3 me-1" />
                          {{ calculateAge(patient.patient.dateOfBirth) }}
                        </div>
                      </div>
                    </div>
                    <div class="patient-details">
                      <span class="badge bg-primary me-2">
                        <i class="bi bi-syringe me-1" />
                        {{ patient.vaccine.name }}
                      </span>
                      <span class="badge bg-info text-dark me-2">
                        Dose {{ patient.doseNumber }}
                      </span>
                      <span
                        class="badge"
                        :class="getStatusBadgeClass(patient.status)"
                      >
                        {{ patient.status }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="$emit('close')"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="show"
      class="modal-backdrop fade show"
    />
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCapacity } from '@/composables/useCapacity'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  show: Boolean,
  day: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'capacity-updated'])

const { updateCapacityLimits, getScheduledPatients } = useCapacity()
const { addToast } = useToast()

const isEditing = ref(false)
const saving = ref(false)
const loadingPatients = ref(false)
const activeTab = ref('AM')
const patients = ref([])

const editedCapacity = ref({
  amCapacity: props.day.amCapacity,
  pmCapacity: props.day.pmCapacity,
  notes: props.day.notes
})

const amUtilization = computed(() => {
  return props.day.amCapacity > 0 ? (props.day.amBooked / props.day.amCapacity) * 100 : 0
})

const pmUtilization = computed(() => {
  return props.day.pmCapacity > 0 ? (props.day.pmBooked / props.day.pmCapacity) * 100 : 0
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getProgressBarClass(percent) {
  if (percent >= 100) return 'bg-danger'
  if (percent >= 80) return 'bg-warning'
  return 'bg-success'
}

function getStatusBadgeClass(status) {
  const statusMap = {
    'Scheduled': 'bg-success',
    'Due': 'bg-warning',
    'Overdue': 'bg-danger',
    'Rescheduled': 'bg-secondary'
  }
  return statusMap[status] || 'bg-secondary'
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 'Age unknown'
  
  const birth = new Date(dateOfBirth)
  const today = new Date()
  
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  
  if (months < 0) {
    years--
    months += 12
  }
  
  if (years > 0) {
    return `${years} year${years !== 1 ? 's' : ''} old`
  } else if (months > 0) {
    return `${months} month${months !== 1 ? 's' : ''} old`
  } else {
    const days = Math.floor((today - birth) / (1000 * 60 * 60 * 24))
    return `${days} day${days !== 1 ? 's' : ''} old`
  }
}

function startEditing() {
  isEditing.value = true
  editedCapacity.value = {
    amCapacity: props.day.amCapacity,
    pmCapacity: props.day.pmCapacity,
    notes: props.day.notes
  }
}

function cancelEditing() {
  isEditing.value = false
  editedCapacity.value = {
    amCapacity: props.day.amCapacity,
    pmCapacity: props.day.pmCapacity,
    notes: props.day.notes
  }
}

async function saveCapacity() {
  saving.value = true
  try {
    await updateCapacityLimits(
      props.day.date,
      editedCapacity.value.amCapacity,
      editedCapacity.value.pmCapacity,
      editedCapacity.value.notes
    )
    
    addToast('Capacity settings updated successfully', 'success')
    isEditing.value = false
    emit('capacity-updated')
  } catch (error) {
    console.error('Failed to update capacity:', error)
    addToast('Failed to update capacity settings', 'error')
  } finally {
    saving.value = false
  }
}

async function loadPatients() {
  loadingPatients.value = true
  try {
    // Try API first (online mode)
    patients.value = await getScheduledPatients(props.day.date, activeTab.value)
  } catch (error) {
    // Fallback to offline data if API fails (network error, 503, 500, etc.)
    if (props.day.patients && Array.isArray(props.day.patients)) {
      console.log('📦 Using offline patient data as fallback')
      // Filter by active tab (AM/PM) - offline data uses 'timeSlot' property
      patients.value = props.day.patients.filter(p => {
        if (activeTab.value === 'All') return true
        return p.timeSlot === activeTab.value
      })
    } else {
      addToast('Failed to load patient list', 'error')
      patients.value = []
    }
  } finally {
    loadingPatients.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadPatients()
  }
})

// Re-filter when tab changes
watch(() => activeTab.value, () => {
  if (props.show) {
    loadPatients()
  }
})
</script>

<style scoped>
.stat-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
  border-left: 4px solid;
}

.stat-card.am {
  border-left-color: #ffc107;
}

.stat-card.pm {
  border-left-color: #0dcaf0;
}

.stat-icon {
  font-size: 2rem;
  color: #6c757d;
  display: flex;
  align-items: center;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
}

.patient-card {
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.patient-card:hover {
  background: #f8f9fa;
  border-color: #0d6efd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.patient-avatar {
  font-size: 2rem;
  color: #6c757d;
}

.patient-name {
  font-weight: 600;
  font-size: 1rem;
  color: #212529;
}

.patient-age {
  font-size: 0.875rem;
}

.patient-details {
  font-size: 0.875rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
