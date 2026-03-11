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
                    <i class="bi bi-calendar-range me-1" />
                    Daily Capacity
                  </label>
                  <input
                    v-model.number="editedCapacity.dailyCapacity"
                    type="number"
                    class="form-control"
                    min="0"
                    :disabled="!isEditing"
                  >
                  <small class="text-muted">Current: {{ day.totalBooked }} booked</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">
                    <i class="bi bi-shield me-1" />
                    Buffer Slots (Reschedules)
                  </label>
                  <input
                    v-model.number="editedCapacity.bufferSlots"
                    type="number"
                    class="form-control"
                    min="0"
                    max="5"
                    :disabled="!isEditing"
                  >
                  <small class="text-muted">Reserved for missed/rescheduled appointments</small>
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
                Daily Utilization
              </h6>
              <div class="stat-card daily">
                <div class="stat-icon">
                  <i class="bi bi-calendar-range" />
                </div>
                <div class="stat-content">
                  <div class="stat-label">
                    Total Appointments
                  </div>
                  <div class="stat-value">
                    {{ day.totalBooked }} / {{ day.dailyCapacity || day.totalCapacity }}
                  </div>
                  <div class="progress mt-2">
                    <div
                      class="progress-bar"
                      :class="getProgressBarClass(dailyUtilization)"
                      :style="{ width: dailyUtilization + '%' }"
                    />
                  </div>
                  <small class="text-muted">{{ dailyUtilization.toFixed(0) }}% utilized</small>
                </div>
              </div>
            </div>

            <!-- Time Block Breakdown -->
            <div
              v-if="day.blocks && day.blocks.length > 0"
              class="block-breakdown mb-4"
            >
              <h6 class="fw-bold mb-3">
                <i class="bi bi-clock me-2" />
                Time Blocks (3 patients per block)
              </h6>
              <div class="block-list">
                <div
                  v-for="block in day.blocks"
                  :key="block.time"
                  class="block-item"
                  :class="getBlockHeatmapClass(block.booked, block.capacity)"
                  @click="selectTimeBlock(block.time)"
                >
                  <div class="block-time">
                    {{ formatBlockLabel(block.time) }}
                  </div>
                  <div class="block-count">
                    {{ block.booked }}/{{ block.capacity }}
                  </div>
                  <div class="block-bar">
                    <div
                      class="block-bar-fill"
                      :style="{ width: (block.capacity > 0 ? (block.booked / block.capacity) * 100 : 0) + '%' }"
                    />
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
                    :class="{ active: activeTab === 'All' }"
                    @click="activeTab = 'All'; loadPatients()"
                  >
                    <i class="bi bi-list me-1" />
                    All ({{ day.totalBooked }})
                  </button>
                </li>
                <li
                  v-for="block in timeBlockTabs"
                  :key="block.time"
                  class="nav-item"
                >
                  <button
                    class="nav-link"
                    :class="{ active: activeTab === block.time }"
                    @click="activeTab = block.time; loadPatients()"
                  >
                    {{ block.shortLabel }} ({{ block.booked }})
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

const TIME_BLOCK_LABELS = {
  '07:30': '7:30 – 8:30 AM',
  '08:30': '8:30 – 9:30 AM',
  '09:30': '9:30 – 10:30 AM',
  '10:30': '10:30 – 11:30 AM',
  '11:30': '11:30 AM – 12:30 PM',
  '12:30': '12:30 – 1:30 PM',
  '13:30': '1:30 – 2:30 PM',
  '14:30': '2:30 – 3:30 PM',
  '15:30': '3:30 – 4:30 PM',
}

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
const activeTab = ref('All')
const patients = ref([])

const editedCapacity = ref({
  dailyCapacity: props.day.dailyCapacity || props.day.totalCapacity || 27,
  bufferSlots: props.day.bufferSlots ?? 1,
  notes: props.day.notes
})

const dailyUtilization = computed(() => {
  const cap = props.day.dailyCapacity || props.day.totalCapacity || 27
  return cap > 0 ? (props.day.totalBooked / cap) * 100 : 0
})

const timeBlockTabs = computed(() => {
  if (!props.day.blocks || props.day.blocks.length === 0) return []
  return props.day.blocks
    .filter(b => b.booked > 0)
    .map(b => ({
      time: b.time,
      shortLabel: formatBlockShort(b.time),
      booked: b.booked
    }))
})

function formatBlockLabel(time) {
  return TIME_BLOCK_LABELS[time] || time
}

function formatBlockShort(time) {
  const hour = parseInt(time.split(':')[0])
  const min = time.split(':')[1]
  if (hour < 12) return `${hour}:${min}`
  if (hour === 12) return `12:${min}`
  return `${hour - 12}:${min}`
}

function getBlockHeatmapClass(booked, capacity) {
  if (booked <= 0) return 'block-empty'
  if (booked >= capacity) return 'block-full'
  if (booked >= 2) return 'block-high'
  return 'block-low'
}

function selectTimeBlock(time) {
  activeTab.value = time
  loadPatients()
}

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
    dailyCapacity: props.day.dailyCapacity || props.day.totalCapacity || 27,
    bufferSlots: props.day.bufferSlots ?? 1,
    notes: props.day.notes
  }
}

function cancelEditing() {
  isEditing.value = false
  editedCapacity.value = {
    dailyCapacity: props.day.dailyCapacity || props.day.totalCapacity || 27,
    bufferSlots: props.day.bufferSlots ?? 1,
    notes: props.day.notes
  }
}

async function saveCapacity() {
  saving.value = true
  try {
    await updateCapacityLimits(
      props.day.date,
      editedCapacity.value.dailyCapacity,
      editedCapacity.value.bufferSlots,
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
    const slot = activeTab.value === 'All' ? null : activeTab.value
    patients.value = await getScheduledPatients(props.day.date, slot)
  } catch (error) {
    // Fallback to offline data if API fails
    if (props.day.patients && Array.isArray(props.day.patients)) {
      patients.value = props.day.patients.filter(p => {
        if (activeTab.value === 'All') return true
        return (p.timeSlot || p.timeBlock) === activeTab.value
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
    activeTab.value = 'All'
    loadPatients()
  }
})

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

.stat-card.daily {
  border-left-color: #1976d2;
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

/* Time Block Breakdown */
.block-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.block-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e9ecef;
}

.block-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.block-item.block-empty {
  background: #f8f9fa;
}

.block-item.block-low {
  background: #f1f8e9;
  border-color: #c8e6c9;
}

.block-item.block-high {
  background: #fff8e1;
  border-color: #ffe082;
}

.block-item.block-full {
  background: #ffebee;
  border-color: #ef9a9a;
}

.block-time {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
  min-width: 140px;
}

.block-count {
  font-size: 0.85rem;
  font-weight: 700;
  min-width: 40px;
  text-align: center;
}

.block-bar {
  flex: 1;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.block-bar-fill {
  height: 100%;
  background: #1976d2;
  border-radius: 3px;
  transition: width 0.3s;
}

.block-item.block-full .block-bar-fill {
  background: #ef4444;
}

.block-item.block-high .block-bar-fill {
  background: #ff9800;
}

.block-item.block-low .block-bar-fill {
  background: #4caf50;
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
