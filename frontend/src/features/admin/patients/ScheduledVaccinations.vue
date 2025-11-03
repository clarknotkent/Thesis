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
                  <span :class="['badge', 'dose-badge', getDoseBadgeClass(dose.doseNumber)]" style="min-width: 60px;">Dose {{ dose.doseNumber }}</span>
                    <div class="flex-grow-1" v-if="!editForm.doses[index]?.readonly">
                      <DateInput
                        v-model="editForm.doses[index].scheduledDate"
                        :required="true"
                        placeholder="MM/DD/YYYY"
                      />
                    </div>
                    <div v-else class="flex-grow-1 d-flex align-items-center">
                      <span class="text-muted small me-2">Completed</span>
                      <span class="small">{{ formatShortDate(dose.scheduledDate) }}</span>
                    </div>
                </div>
              </div>
              <div v-else class="d-flex flex-wrap gap-2 justify-content-center">
                <div 
                  v-for="(dose, index) in group.doses" 
                  :key="index"
                  class="dose-box-small"
                   :class="[getDoseColorClass(dose.doseNumber), getDoseBoxClass(dose)]"
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
import api from '@/services/offlineAPI'
import DateInput from '@/components/ui/form/DateInput.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const { addToast } = useToast()
const { confirm } = useConfirm()

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
      // Use the canonical patientschedule primary key; fall back defensively
      scheduleId: schedule.patient_schedule_id || schedule.patientScheduleId || schedule.schedule_id || schedule.id,
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
    doseNumber: dose.doseNumber,
    readonly: isDoseCompleted(dose.status)
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

    // Resolve numeric user id (backend expects bigint) from stored user info
    let p_user_id = undefined
    try {
      const raw = localStorage.getItem('userInfo') || localStorage.getItem('authUser')
      if (raw) {
        const u = JSON.parse(raw)
        p_user_id = u?.user_id || u?.id || undefined
      }
    } catch {}
    if (!p_user_id) {
      const uidStr = localStorage.getItem('userId') || localStorage.getItem('user_id')
      const asNum = uidStr ? Number(uidStr) : NaN
      if (!Number.isNaN(asNum)) p_user_id = asNum
    }

    // Prepare a buffer of only the doses that actually changed and are editable
    const changedQueue = editForm.value.doses
      .map((d, idx) => ({
        ...d,
        _originalDate: group.doses[idx]?.scheduledDate || null,
        _index: idx
      }))
      .filter(d => !d.readonly)
      .filter(d => {
        const newISO = formatDateForAPI(d.scheduledDate)
        const origISO = formatDateForAPI(d._originalDate)
        return !!newISO && newISO !== origISO
      })

    // Process sequentially (dose 1 then 2 then 3), to respect server rule checks order
    let successCount = 0
    for (const dose of changedQueue) {
      const newISO = formatDateForAPI(dose.scheduledDate)
      const origISO = formatDateForAPI(dose._originalDate)
      const payload = {
        p_patient_schedule_id: dose.scheduleId,
        p_new_scheduled_date: newISO,
        p_user_id,
        cascade: false,
        debug: false
      }
      console.log('[ScheduledVaccinations] Rescheduling (manual-reschedule):', payload)
      try {
        const resp = await api.post('/immunizations/manual-reschedule', payload)
        const body = resp?.data || {}
        if (body?.warning) {
          try {
            await confirm({
              title: 'Cascade effects detected',
              message: `${body.warning}\n\nContinue and cascade related schedule adjustments?`,
              variant: 'warning',
              confirmText: 'Continue',
              cancelText: 'Cancel'
            })
            // If confirmed, apply cascade for this dose
            const cascadeResp = await api.post('/immunizations/manual-reschedule', { ...payload, cascade: true })
            if (cascadeResp?.data?.data) successCount += 1
          } catch {
            // Cancelled: revert this dose (no cascade)
            if (origISO) {
              try {
                await api.post('/immunizations/manual-reschedule', {
                  p_patient_schedule_id: dose.scheduleId,
                  p_new_scheduled_date: origISO,
                  p_user_id,
                  cascade: false
                })
              } catch (revertErr) {
                console.warn('[ScheduledVaccinations] Revert failed:', revertErr)
              }
            }
          }
        } else {
          // No warning, consider updated
          successCount += 1
        }
      } catch (doseErr) {
        console.error('[ScheduledVaccinations] Failed updating a dose:', doseErr)
        // Continue to next dose; overall error toast is shown below
      }
    }

    const editedCount = successCount
    addToast({
      title: 'Success',
      message: editedCount > 0
        ? `${group.vaccineName} — ${editedCount} dose${editedCount>1?'s':''} updated`
        : 'No changes to save',
      type: editedCount > 0 ? 'success' : 'info'
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
  } else if (statusLower.includes('rescheduled')) {
    return 'dose-rescheduled'
  } else if (statusLower.includes('overdue')) {
    return 'dose-overdue'
  } else if (statusLower.includes('missed')) {
    return 'dose-missed'
  } else if (statusLower.includes('due') || statusLower.includes('upcoming')) {
    return 'dose-upcoming'
  } else {
    return 'dose-pending'
  }
}

const getStatusBadgeClass = (status) => {
  if (!status) return 'bg-primary'
  const s = String(status).toLowerCase()

  // Normalized explicit mappings
  if (s === 'scheduled') return 'bg-primary'
  if (s === 'rescheduled') return 'bg-orange'
  if (s === 'overdue') return 'bg-overdue'
  if (s === 'missed') return 'bg-danger'
  if (s === 'pending') return 'bg-warning text-dark'

  // Common synonyms/variants
  if (s.includes('completed') || s.includes('administered')) return 'bg-success'
  if (s.includes('overdue') || s.includes('missed')) return 'bg-danger'
  if (s.includes('due') || s.includes('upcoming')) return 'bg-warning text-dark'

  // Fallback
  return 'bg-secondary'
}

// Dose color helpers (1: white, 2: light brown, 3: dark brown)
const getDoseColorClass = (doseNumber) => {
  const n = Number(doseNumber)
  if (n === 1) return 'dose-color-1'
  if (n === 2) return 'dose-color-2'
  if (n === 3) return 'dose-color-3'
  return 'dose-color-1'
}

const getDoseBadgeClass = (doseNumber) => {
  const n = Number(doseNumber)
  if (n === 1) return 'dose-badge-1'
  if (n === 2) return 'dose-badge-2'
  if (n === 3) return 'dose-badge-3'
  return 'dose-badge-1'
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

// Helper: determine if a dose is completed/administered
const isDoseCompleted = (status) => {
  if (!status) return false
  const s = String(status).toLowerCase()
  return s.includes('completed') || s.includes('administered')
}
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
  border-color: #ff1000;
  background-color: #fef5f6;
}

.dose-missed {
  border-color: #dc3545;
  background-color: #fef5f6;
}

.dose-overdue .dose-number {
  color: #ff1000;
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
.dose-completed { border-color: #198754; background-color: #f0f9f4; }
.dose-completed .dose-number-small { color: #198754; }
.dose-completed .dose-date-small { color: #198754; }

.dose-rescheduled { border-color: #fd7e14; background-color: rgba(253, 125, 20, 0.053); }
.dose-rescheduled .dose-number-small { color: #fd7e14; }
.dose-rescheduled .dose-date-small { color: #fd7e14; }

.dose-missed { border-color: #dc3545; background-color: rgba(220, 53, 70, 0.153); }
.dose-missed .dose-number-small { color: #dc3545; }
.dose-missed .dose-date-small { color: #dc3545; }

.dose-overdue { border-color: #ff1000; background-color: #ff11001f; }
.dose-overdue .dose-number-small { color: #ff1000; }
.dose-overdue .dose-date-small { color: #ff1000; }

.dose-pending { border-color: #0d6efd; background-color: rgba(13, 109, 253, 0.089); }
.dose-pending .dose-number-small { color: #0d6efd; }
.dose-pending .dose-date-small { color: #0d6efd; }

.dose-upcoming { border-color: #ffc107; background-color: rgba(255, 193, 7, 0.15); }
.dose-upcoming .dose-number-small { color: #ffc107; }
.dose-upcoming .dose-date-small { color: #ffc107; }

/* Dose number color scheme - backgrounds handled by status classes */

/* Dose badge styling in edit mode */
.dose-badge { border: 1px solid rgba(0,0,0,0.1); }
.dose-badge-1 { background-color: #f2e4d5; color: #000; }
.dose-badge-2 { background-color: #c79a6a; color: #fff; }
.dose-badge-3 { background-color: #8b4513; color: #fff; }

/* Orange badge for Rescheduled */
.bg-orange { background-color: #fd7e14 !important; color: #fff !important; }

.bg-overdue { background-color: #ff1000 !important; color: #fff !important; }
</style>
