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
      <table class="table table-bordered">
        <thead class="table-light">
          <tr>
            <th style="width: 25%;" class="text-center">Vaccine</th>
            <th style="width: 10%;" class="text-center">Doses</th>
            <th style="width: 40%;" class="text-center">Date of Vaccine<br><small class="text-muted">MM/DD/YYYY</small></th>
            <th style="width: 10%;" class="text-center">Status</th>
            <th style="width: 15%;" class="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in groupedVaccines" :key="group.vaccineName">
            <td class="text-center align-middle">
              <strong>{{ group.vaccineName }}</strong>
              <div v-if="group.scheduleInfo" class="text-muted small mt-1">
                {{ group.scheduleInfo }}
              </div>
            </td>
            <td class="text-center align-middle">
              <strong>{{ group.totalDoses }}</strong>
            </td>
            <td class="text-center align-middle">
              <div v-if="editingGroup && editingGroup.vaccineName === group.vaccineName">
                <div 
                  v-for="(dose, index) in group.doses" 
                  :key="index"
                  class="d-flex align-items-center justify-content-center gap-2 mb-2"
                >
                  <span class="badge bg-secondary" style="min-width: 60px;">Dose {{ dose.doseNumber }}</span>
                  <div class="flex-grow-1">
                    <DateInput
                      v-model="editForm.doses[index].scheduledDate"
                      :required="true"
                      placeholder="MM/DD/YYYY"
                    />
                  </div>
                </div>
              </div>
              <div v-else class="d-flex flex-wrap gap-2 justify-content-center">
                <div 
                  v-for="(dose, index) in group.doses" 
                  :key="index"
                  class="dose-box-small"
                  :class="getDoseBoxClass(dose)"
                >
                  <div class="dose-number-small">Dose {{ dose.doseNumber }}</div>
                  <div class="dose-date-small">{{ formatShortDate(dose.scheduledDate) }}</div>
                  <div v-if="dose.daysOverdue > 0" class="text-danger" style="font-size: 0.65rem; margin-top: 2px;">
                    {{ dose.daysOverdue }}d overdue
                  </div>
                </div>
              </div>
            </td>
            <td class="text-center align-middle">
              <div class="d-flex flex-column gap-1">
                <div v-for="(dose, index) in group.doses" :key="index" class="text-center">
                  <small><strong>Dose {{ dose.doseNumber }}:</strong></small>
                  <span :class="['badge', 'badge-sm', 'ms-1', getStatusBadgeClass(dose.status)]">
                    {{ formatStatus(dose.status) }}
                  </span>
                </div>
              </div>
            </td>
            <td class="align-middle text-center">
              <div v-if="editingGroup && editingGroup.vaccineName === group.vaccineName" class="btn-group btn-group-sm">
                <button 
                  class="btn btn-success"
                  @click="saveEdit(group)"
                  :disabled="saving"
                >
                  <i class="bi bi-check-lg me-1"></i>Save
                </button>
                <button 
                  class="btn btn-secondary"
                  @click="cancelEdit"
                  :disabled="saving"
                >
                  <i class="bi bi-x-lg me-1"></i>Cancel
                </button>
              </div>
              <button 
                v-else
                class="btn btn-sm btn-outline-primary"
                @click="startEdit(group)"
                :disabled="!!editingGroup"
              >
                <i class="bi bi-pencil me-1"></i>Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import DateInput from '@/components/common/DateInput.vue'
import { useToast } from '@/composables/useToast'

const { addToast } = useToast()

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  }
})

const schedules = ref([])
const loading = ref(true)
const editingGroup = ref(null)
const editForm = ref({
  doses: []
})
const saving = ref(false)

const sortedSchedules = computed(() => {
  if (!schedules.value || schedules.value.length === 0) return []
  
  return [...schedules.value].sort((a, b) => {
    const dateA = new Date(a.scheduled_date || a.scheduledDate)
    const dateB = new Date(b.scheduled_date || b.scheduledDate)
    return dateA - dateB // Sort ascending (nearest date first)
  })
})

const groupedVaccines = computed(() => {
  if (!schedules.value || schedules.value.length === 0) return []
  
  // Group schedules by vaccine name
  const groups = {}
  
  schedules.value.forEach(schedule => {
    const vaccineName = schedule.antigen_name || schedule.vaccine_name || schedule.vaccineName || 'Unknown Vaccine'
    
    if (!groups[vaccineName]) {
      groups[vaccineName] = {
        vaccineName,
        doses: [],
        scheduleInfo: schedule.schedule_info || schedule.scheduleInfo || ''
      }
    }
    
    groups[vaccineName].doses.push({
      scheduleId: schedule.schedule_id || schedule.id,
      doseNumber: schedule.dose_number || schedule.doseNumber || '—',
      scheduledDate: schedule.scheduled_date || schedule.scheduledDate,
      status: schedule.status,
      daysOverdue: schedule.days_overdue || schedule.daysOverdue || 0,
      notes: schedule.notes || schedule.remarks || schedule.note || schedule.remark || schedule.comment || schedule.description || ''
    })
  })
  
  // Convert to array and sort doses within each group
  return Object.values(groups).map(group => {
    // Sort doses by dose number
    group.doses.sort((a, b) => {
      const doseA = typeof a.doseNumber === 'number' ? a.doseNumber : parseInt(a.doseNumber) || 0
      const doseB = typeof b.doseNumber === 'number' ? b.doseNumber : parseInt(b.doseNumber) || 0
      return doseA - doseB
    })
    
    group.totalDoses = group.doses.length
    return group
  }).sort((a, b) => {
    // Sort groups by the earliest scheduled date
    const dateA = new Date(a.doses[0]?.scheduledDate || 0)
    const dateB = new Date(b.doses[0]?.scheduledDate || 0)
    return dateA - dateB
  })
})

const startEdit = (group) => {
  editingGroup.value = group
  // Initialize edit form with all doses
  editForm.value.doses = group.doses.map(dose => ({
    scheduleId: dose.scheduleId,
    scheduledDate: formatShortDate(dose.scheduledDate),
    doseNumber: dose.doseNumber
  }))
}

const cancelEdit = () => {
  editingGroup.value = null
  editForm.value.doses = []
}

const formatDateForAPI = (dateString) => {
  if (!dateString) return ''
  try {
    // DateInput outputs MM/DD/YYYY, convert to YYYY-MM-DD for API
    const parts = dateString.split('/')
    if (parts.length === 3) {
      const [month, day, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    // If already in another format, try to parse it
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    return dateString
  }
}

const saveEdit = async (group) => {
  try {
    saving.value = true

    // Update all doses for this vaccine group
    const updatePromises = editForm.value.doses.map(async (dose) => {
      const updateData = {
        scheduled_date: formatDateForAPI(dose.scheduledDate)
      }

      console.log('Updating schedule:', dose.scheduleId, updateData)
      return api.put(`/schedules/${dose.scheduleId}`, updateData)
    })

    await Promise.all(updatePromises)

    addToast({
      title: 'Success',
      message: `${group.vaccineName} schedule(s) updated successfully`,
      type: 'success'
    })

    // Refresh schedules to get updated status
    await fetchSchedules()
    
    // Clear editing state
    cancelEdit()

  } catch (err) {
    console.error('Error updating schedules:', err)
    const errorMessage = err.response?.data?.message || 'Failed to update schedules. Please try again.'
    addToast({
      title: 'Error',
      message: errorMessage,
      type: 'error'
    })
  } finally {
    saving.value = false
  }
}

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

const formatShortDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

const getDoseBoxClass = (dose) => {
  if (!dose.status) return 'dose-pending'
  
  const statusLower = dose.status.toLowerCase()
  
  if (statusLower.includes('completed') || statusLower.includes('administered')) {
    return 'dose-completed'
  } else if (statusLower.includes('overdue') || statusLower.includes('missed')) {
    return 'dose-overdue'
  } else if (statusLower.includes('due') || statusLower.includes('upcoming')) {
    return 'dose-upcoming'
  } else {
    return 'dose-pending'
  }
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

    const pd = response.data?.data || response.data || {}
    // Try different possible field names for scheduled vaccinations
    let sched = pd.nextScheduledVaccinations || pd.scheduled_vaccinations || pd.scheduledVaccinations || pd.schedules || []

    // Some APIs wrap in an object
    if (!Array.isArray(sched) && typeof sched === 'object' && sched !== null) {
      // Common wrappers: { items: [...] } or { data: [...] }
      sched = sched.items || sched.data || []
    }

    // Fallback: query a dedicated endpoint if exists (optional)
    if (!Array.isArray(sched)) sched = []
    schedules.value = sched
    
    console.log('📅 [ScheduledVaccinations] Raw schedule data:', schedules.value)
    if (schedules.value.length > 0) {
      console.log('📅 [ScheduledVaccinations] First schedule item fields:', Object.keys(schedules.value[0]))
      console.log('📅 [ScheduledVaccinations] First schedule item:', schedules.value[0])
    }
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
  margin-bottom: 0;
}

.table thead th {
  background-color: #f8f9fa;
  font-weight: 600;
  border: 1px solid #dee2e6;
  padding: 12px;
  vertical-align: middle;
}

.table tbody td {
  padding: 12px;
  vertical-align: top;
  border: 1px solid #dee2e6;
}

.dose-box {
  border: 2px solid #dee2e6;
  border-radius: 6px;
  padding: 10px;
  min-width: 110px;
  text-align: center;
  background-color: #fff;
  transition: all 0.2s ease;
}

.dose-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dose-number {
  font-weight: bold;
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 4px;
}

.dose-date {
  font-size: 0.85rem;
  font-weight: 500;
  color: #212529;
  margin-bottom: 6px;
}

.dose-status {
  margin-top: 6px;
}

.dose-status .badge {
  font-size: 0.7rem;
  padding: 2px 6px;
}

.dose-overdue {
  margin-top: 4px;
  font-size: 0.75rem;
}

/* Status-based styling */
.dose-completed {
  border-color: #198754;
  background-color: #f0f9f4;
}

.dose-completed .dose-number {
  color: #198754;
}

.dose-overdue {
  border-color: #dc3545;
  background-color: #fef5f6;
}

.dose-overdue .dose-number {
  color: #dc3545;
}

.dose-upcoming {
  border-color: #ffc107;
  background-color: #fffbf0;
}

.dose-upcoming .dose-number {
  color: #ffc107;
}

.dose-pending {
  border-color: #0d6efd;
  background-color: #f0f5ff;
}

.dose-pending .dose-number {
  color: #0d6efd;
}

.badge-sm {
  font-size: 0.7rem;
  padding: 2px 6px;
}

.dose-box-small {
  border: 2px solid #dee2e6;
  border-radius: 4px;
  padding: 6px 8px;
  min-width: 90px;
  text-align: center;
  background-color: #fff;
  transition: all 0.2s ease;
}

.dose-box-small:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.dose-number-small {
  font-weight: bold;
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 2px;
}

.dose-date-small {
  font-size: 0.75rem;
  font-weight: 500;
  color: #212529;
}

/* Status-based styling */
.dose-completed {
  border-color: #198754;
  background-color: #f0f9f4;
}

.dose-completed .dose-number-small {
  color: #198754;
}

.dose-overdue {
  border-color: #dc3545;
  background-color: #fef5f6;
}

.dose-overdue .dose-number-small {
  color: #dc3545;
}

.dose-pending {
  border-color: #0d6efd;
  background-color: #f0f5ff;
}

.dose-pending .dose-number-small {
  color: #0d6efd;
}

.dose-upcoming {
  border-color: #ffc107;
  background-color: #fffbf0;
}

.dose-upcoming .dose-number-small {
  color: #ffc107;
}
</style>
