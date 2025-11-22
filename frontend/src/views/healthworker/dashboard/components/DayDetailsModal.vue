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
              <div class="row g-3">
                <div class="col-6">
                  <div class="capacity-card am">
                    <i class="bi bi-sunrise" />
                    <div class="capacity-info">
                      <div class="capacity-label">Morning</div>
                      <div class="capacity-value">{{ day.amBooked }}/{{ day.amCapacity }}</div>
                      <div class="progress mt-2">
                        <div
                          class="progress-bar bg-warning"
                          :style="{ width: amUtilization + '%' }"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="capacity-card pm">
                    <i class="bi bi-sunset" />
                    <div class="capacity-info">
                      <div class="capacity-label">Afternoon</div>
                      <div class="capacity-value">{{ day.pmBooked }}/{{ day.pmCapacity }}</div>
                      <div class="progress mt-2">
                        <div
                          class="progress-bar bg-info"
                          :style="{ width: pmUtilization + '%' }"
                        />
                      </div>
                    </div>
                  </div>
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
                    :class="{ active: activeTab === 'AM' }"
                    @click="activeTab = 'AM'"
                  >
                    <i class="bi bi-sunrise me-1" />
                    AM ({{ day.amBooked }})
                  </button>
                </li>
                <li class="nav-item">
                  <button
                    class="nav-link"
                    :class="{ active: activeTab === 'PM' }"
                    @click="activeTab = 'PM'"
                  >
                    <i class="bi bi-sunset me-1" />
                    PM ({{ day.pmBooked }})
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

.capacity-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border-left: 4px solid;
}

.capacity-card.am {
  border-left-color: #ffc107;
}

.capacity-card.pm {
  border-left-color: #0dcaf0;
}

.capacity-card i {
  font-size: 1.5rem;
  color: #6c757d;
}

.capacity-info {
  flex: 1;
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
