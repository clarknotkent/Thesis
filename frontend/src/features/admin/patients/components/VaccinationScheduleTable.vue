<template>
  <div class="mt-4">
    <h6 class="fw-bold mb-3">
      Upcoming Scheduled Vaccinations
    </h6>
    <div
      v-if="upcomingSchedules.length > 0"
      class="table-responsive"
    >
      <table class="table table-bordered">
        <thead class="table-light">
          <tr>
            <th>Vaccine Name</th>
            <th>Scheduled Date</th>
            <th>Dose Number</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(vaccine, index) in upcomingSchedules"
            :key="index"
          >
            <td class="fw-semibold">
              {{ vaccine.vaccineName || 'Unknown' }}
            </td>
            <td>
              <div
                v-if="editingScheduleIndex !== index"
                class="d-flex align-items-center"
              >
                {{ formatDate(vaccine.scheduledDate) || 'N/A' }}
                <button 
                  class="btn btn-sm btn-outline-primary ms-2" 
                  title="Reschedule" 
                  @click="$emit('start-edit', vaccine, index)"
                >
                  <i class="bi bi-calendar" />
                </button>
              </div>
              <div
                v-else
                class="d-flex align-items-center"
              >
                <input 
                  type="date" 
                  class="form-control form-control-sm me-2" 
                  :value="newScheduleDate" 
                  :min="getMinDate(vaccine)"
                  @input="$emit('update:newScheduleDate', $event.target.value)" 
                >
                <button 
                  class="btn btn-sm btn-success me-1" 
                  :disabled="saving" 
                  @click="$emit('save', vaccine)"
                >
                  <i class="bi bi-check" />
                </button>
                <button 
                  class="btn btn-sm btn-secondary" 
                  @click="$emit('cancel-edit')"
                >
                  <i class="bi bi-x" />
                </button>
              </div>
            </td>
            <td>{{ vaccine.doseNumber || 'N/A' }}</td>
            <td>
              <span
                class="badge"
                :class="getStatusBadgeClass(vaccine.status)"
              >
                {{ vaccine.status || 'Unknown' }}
              </span>
              <span
                v-if="computeDaysOverdue(vaccine) > 0"
                class="badge bg-danger ms-2"
              >
                {{ computeDaysOverdue(vaccine) }}d overdue
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-else
      class="alert alert-info"
    >
      <i class="bi bi-info-circle me-2" />
      No upcoming scheduled vaccinations found for this patient.
      <br><small>This could mean all recommended vaccinations have been completed, or schedule data is not available.</small>
    </div>
  </div>
</template>

<script setup>
defineProps({
  upcomingSchedules: {
    type: Array,
    required: true
  },
  editingScheduleIndex: {
    type: Number,
    required: true
  },
  newScheduleDate: {
    type: String,
    default: ''
  },
  saving: {
    type: Boolean,
    default: false
  },
  formatDate: {
    type: Function,
    required: true
  },
  getStatusBadgeClass: {
    type: Function,
    required: true
  },
  computeDaysOverdue: {
    type: Function,
    required: true
  },
  getMinDate: {
    type: Function,
    required: true
  }
});

defineEmits(['start-edit', 'save', 'cancel-edit', 'update:newScheduleDate']);
</script>
