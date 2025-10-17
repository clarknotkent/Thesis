<template>
  <div class="scheduled-vaccinations">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading scheduled vaccinations...</span>
      </div>
      <p class="text-muted mt-3">Loading scheduled vaccinations...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!schedules || schedules.length === 0" class="text-center py-5">
      <i class="bi bi-calendar-x text-muted" style="font-size: 3rem;"></i>
      <p class="text-muted mt-3">No scheduled vaccinations found</p>
    </div>

    <!-- Scheduled Vaccinations Table -->
    <div v-else class="table-responsive">
      <table class="table table-hover table-striped">
        <thead>
          <tr>
            <th>Vaccine Name</th>
            <th>Scheduled Date</th>
            <th>Dose Number</th>
            <th>Status</th>
            <th>Days Overdue</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="schedule in sortedSchedules" :key="schedule.patient_schedule_id || schedule.id">
            <td>
              <strong>{{ schedule.antigen_name || schedule.vaccine_name || schedule.vaccineName || '—' }}</strong>
            </td>
            <td>
              {{ formatDateWithTime(schedule.scheduled_date || schedule.scheduledDate) }}
            </td>
            <td class="text-center">{{ schedule.dose_number || schedule.doseNumber || '—' }}</td>
            <td>
              <span :class="['badge', getStatusBadgeClass(schedule.status)]">
                {{ formatStatus(schedule.status) }}
              </span>
            </td>
            <td class="text-center">
              <span v-if="schedule.days_overdue > 0" 
                    class="text-danger fw-bold">
                {{ schedule.days_overdue }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>{{ schedule.notes || schedule.remarks || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  }
})

const schedules = ref([])
const loading = ref(true)

const sortedSchedules = computed(() => {
  if (!schedules.value || schedules.value.length === 0) return []
  
  return [...schedules.value].sort((a, b) => {
    const dateA = new Date(a.scheduled_date || a.scheduledDate)
    const dateB = new Date(b.scheduled_date || b.scheduledDate)
    return dateA - dateB // Sort ascending (nearest date first)
  })
})

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateWithTime = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const dateStr = date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  return `${dateStr} at ${timeStr}`
}

const getStatusBadgeClass = (status) => {
  if (!status) return 'bg-primary'
  
  const statusLower = status.toLowerCase()
  
  if (statusLower.includes('completed') || statusLower.includes('administered')) {
    return 'bg-success'
  } else if (statusLower.includes('overdue') || statusLower.includes('missed')) {
    return 'bg-danger'
  } else if (statusLower.includes('due') || statusLower.includes('upcoming')) {
    return 'bg-warning'
  } else {
    return 'bg-primary' // Default for 'scheduled'
  }
}

const formatStatus = (status) => {
  if (!status) return 'Scheduled'
  // Capitalize first letter of each word
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const fetchSchedules = async () => {
  try {
    loading.value = true
    const response = await api.get(`/patients/${props.patientId}`)
    
    console.log('Patient data response:', response.data)
    
    // Try different possible field names for scheduled vaccinations
    schedules.value = response.data.nextScheduledVaccinations || 
                      response.data.scheduled_vaccinations || 
                      response.data.scheduledVaccinations ||
                      []
    
    console.log('Scheduled vaccinations found:', schedules.value)
  } catch (err) {
    console.error('Error fetching scheduled vaccinations:', err)
    schedules.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSchedules()
})
</script>

<style scoped>
.scheduled-vaccinations {
  min-height: 200px;
}

.table {
  font-size: 0.9rem;
}

.table thead th {
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.table tbody tr:hover {
  background-color: rgba(0, 123, 255, 0.05);
}
</style>
