<template>
  <teleport to="body">
    <div
      v-if="show"
      class="modal fade show d-block"
      tabindex="-1"
      @click.self="$emit('close')"
    >
      <div class="modal-dialog modal-dialog-scrollable">
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
            <!-- Capacity Summary -->
            <div class="capacity-summary mb-4">
              <h6 class="fw-bold mb-3">
                <i class="bi bi-pie-chart me-2" />
                Capacity Overview
              </h6>
              <div class="daily-utilization-card">
                <div class="d-flex align-items-center gap-3">
                  <i class="bi bi-calendar-check fs-3 text-primary" />
                  <div class="flex-grow-1">
                    <div class="capacity-label">
                      Daily Utilization
                    </div>
                    <div class="capacity-value">
                      {{ day.totalBooked }}/{{ day.dailyCapacity || 27 }}
                    </div>
                    <div class="progress mt-2">
                      <div
                        class="progress-bar"
                        :class="utilizationBarClass"
                        :style="{ width: dailyUtilization + '%' }"
                      />
                    </div>
                  </div>
                  <div class="utilization-percent">
                    {{ Math.round(dailyUtilization) }}%
                  </div>
                </div>
              </div>
            </div>

            <!-- Time Block Breakdown -->
            <div class="block-breakdown mb-4">
              <h6 class="fw-bold mb-3">
                <i class="bi bi-clock-history me-2" />
                Time Block Breakdown
              </h6>
              <div class="block-list">
                <div
                  v-for="block in timeBlocks"
                  :key="block.slot"
                  class="block-item"
                  :class="block.heatmapClass"
                >
                  <span class="block-time">{{ block.label }}</span>
                  <div class="block-bar-container">
                    <div
                      class="block-bar"
                      :style="{ width: block.percentage + '%' }"
                    />
                  </div>
                  <span class="block-count">{{ block.booked }}/{{ block.capacity }}</span>
                </div>
              </div>
            </div>

            <!-- Patient List Tabs -->
            <div class="patient-list-section">
              <h6 class="fw-bold mb-3">
                <i class="bi bi-people me-2" />
                Scheduled Patients
              </h6>

              <!-- Time Slot Tabs -->
              <ul class="nav nav-pills mb-3">
                <li class="nav-item">
                  <button
                    class="nav-link"
                    :class="{ active: activeTab === 'All' }"
                    @click="activeTab = 'All'"
                  >
                    All ({{ day.totalBooked || 0 }})
                  </button>
                </li>
                <li
                  v-for="block in occupiedBlocks"
                  :key="block.slot"
                  class="nav-item"
                >
                  <button
                    class="nav-link"
                    :class="{ active: activeTab === block.slot }"
                    @click="activeTab = block.slot"
                  >
                    {{ block.shortLabel }} ({{ block.booked }})
                  </button>
                </li>
              </ul>

              <!-- Loading State -->
              <div
                v-if="loadingPatients"
                class="text-center py-4"
              >
                <div
                  class="spinner-border spinner-border-sm text-primary"
                  role="status"
                >
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>

              <!-- Patient Cards -->
              <div
                v-else-if="patients.length > 0"
                class="patients-grid"
              >
                <div
                  v-for="patient in patients"
                  :key="patient.patient_schedule_id"
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
                          {{ patient.patient.age }}
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

              <!-- Empty State -->
              <div
                v-else
                class="text-center py-4 text-muted"
              >
                <i class="bi bi-calendar-x fs-1 mb-2" />
                <p class="mb-0">
                  No patients scheduled for this slot
                </p>
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
  day: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const { getScheduledPatients } = useCapacity()
const { addToast } = useToast()

const loadingPatients = ref(false)
const activeTab = ref('All')
const patients = ref([])

const TIME_BLOCK_LABELS = {
  '07:30': '7:30 – 8:30 AM',
  '08:30': '8:30 – 9:30 AM',
  '09:30': '9:30 – 10:30 AM',
  '10:30': '10:30 – 11:30 AM',
  '11:30': '11:30 AM – 12:30 PM',
  '12:30': '12:30 – 1:30 PM',
  '13:30': '1:30 – 2:30 PM',
  '14:30': '2:30 – 3:30 PM',
  '15:30': '3:30 – 4:30 PM'
}

const TIME_BLOCK_SHORT_LABELS = {
  '07:30': '7:30 AM',
  '08:30': '8:30 AM',
  '09:30': '9:30 AM',
  '10:30': '10:30 AM',
  '11:30': '11:30 AM',
  '12:30': '12:30 PM',
  '13:30': '1:30 PM',
  '14:30': '2:30 PM',
  '15:30': '3:30 PM'
}

const ALL_SLOTS = ['07:30','08:30','09:30','10:30','11:30','12:30','13:30','14:30','15:30']
const PATIENTS_PER_BLOCK = 3

const dailyUtilization = computed(() => {
  const cap = props.day.dailyCapacity || 27
  return cap > 0 ? (props.day.totalBooked / cap) * 100 : 0
})

const utilizationBarClass = computed(() => {
  const pct = dailyUtilization.value
  if (pct >= 100) return 'bg-danger'
  if (pct >= 80) return 'bg-warning'
  if (pct >= 50) return 'bg-info'
  return 'bg-success'
})

const timeBlocks = computed(() => {
  const blocks = props.day.blocks || []
  return ALL_SLOTS.map(slot => {
    const block = blocks.find(b => b.time_slot === slot)
    const booked = block ? block.booked : 0
    const capacity = PATIENTS_PER_BLOCK
    const pct = (booked / capacity) * 100
    let heatmapClass = 'block-empty'
    if (pct >= 100) heatmapClass = 'block-full'
    else if (pct >= 67) heatmapClass = 'block-high'
    else if (pct > 0) heatmapClass = 'block-low'
    return {
      slot,
      label: TIME_BLOCK_LABELS[slot],
      shortLabel: TIME_BLOCK_SHORT_LABELS[slot],
      booked,
      capacity,
      percentage: Math.min(pct, 100),
      heatmapClass
    }
  })
})

const occupiedBlocks = computed(() => {
  return timeBlocks.value.filter(b => b.booked > 0)
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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

async function loadPatients() {
  loadingPatients.value = true
  try {
    // Check if we're offline or have local data readily available
    if (!navigator.onLine) {
      console.log('📴 [BHS Modal] Offline - using local patient data')
      if (props.day.patients && Array.isArray(props.day.patients)) {
        patients.value = props.day.patients.filter(p => {
          if (activeTab.value === 'All') return true
          return p.timeSlot === activeTab.value
        })
      } else {
        patients.value = []
      }
    } else {
      // Try API first (online mode)
      try {
        patients.value = await getScheduledPatients(props.day.date, activeTab.value)
      } catch (error) {
        // Fallback to offline data if API fails
        console.log('⚠️ [BHS Modal] API failed, using offline patient data')
        if (props.day.patients && Array.isArray(props.day.patients)) {
          patients.value = props.day.patients.filter(p => {
            if (activeTab.value === 'All') return true
            return p.timeSlot === activeTab.value
          })
        } else {
          addToast('Failed to load patient list', 'error')
          patients.value = []
        }
      }
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
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

.capacity-summary {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.daily-utilization-card {
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.capacity-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.capacity-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.utilization-percent {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.block-breakdown {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.block-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.block-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.375rem 0.5rem;
  border-radius: 6px;
  background: white;
  border: 1px solid #e9ecef;
}

.block-item.block-full {
  border-left: 3px solid #b71c1c;
}

.block-item.block-high {
  border-left: 3px solid #f44336;
}

.block-item.block-low {
  border-left: 3px solid #4caf50;
}

.block-item.block-empty {
  border-left: 3px solid #e0e0e0;
}

.block-time {
  font-size: 0.75rem;
  font-weight: 600;
  color: #333;
  min-width: 130px;
}

.block-bar-container {
  flex: 1;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.block-bar {
  height: 100%;
  background: #4caf50;
  border-radius: 3px;
  transition: width 0.3s;
}

.block-item.block-high .block-bar {
  background: #f44336;
}

.block-item.block-full .block-bar {
  background: #b71c1c;
}

.block-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  min-width: 30px;
  text-align: right;
}

.patient-list-section {
  margin-top: 1.5rem;
}

.nav-pills .nav-link {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.patients-grid {
  display: grid;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.patient-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.2s;
  border: 1px solid #e9ecef;
}

.patient-card:hover {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.patient-avatar {
  font-size: 2rem;
  color: #6c757d;
}

.patient-name {
  font-weight: 600;
  color: #333;
}

.patient-age {
  font-size: 0.75rem;
}

.patient-details {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.patient-details .badge {
  font-size: 0.75rem;
}

.progress {
  height: 6px;
  border-radius: 3px;
}
</style>
