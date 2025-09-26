<template>
  <div class="modal fade" :class="{ show: show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-calendar2-event me-2"></i>Patient Schedule</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted mt-2">Loading schedule...</p>
          </div>

          <div v-else>
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Vaccine</th>
                    <th>Scheduled Date</th>
                    <th>Dose</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in scheduleData" :key="item.patient_schedule_id">
                    <td>{{ item.vaccine_name || item.vaccineName }}</td>
                    <td>
                      <div class="input-group">
                        <input 
                          type="text" 
                          class="form-control form-control-sm" 
                          v-model="item._editedDate" 
                          placeholder="MM/DD/YYYY"
                          @blur="validateAndFormatDate(item)"
                          :id="`date-input-${item.patient_schedule_id}`"
                        />
                        <button 
                          class="btn btn-outline-secondary btn-sm" 
                          type="button"
                          @click="openDatePicker(item)"
                          title="Select date"
                        >
                          <i class="bi bi-calendar3"></i>
                        </button>
                        <input 
                          type="date" 
                          :ref="el => datePickerRefs[item.patient_schedule_id] = el"
                          style="position: absolute; visibility: hidden; pointer-events: none;"
                          @change="onDatePickerChange(item, $event)"
                        />
                      </div>
                    </td>
                    <td>{{ item.dose_number || item.doseNumber }}</td>
                    <td>
                      <select class="form-select form-select-sm" v-model="item._editedStatus">
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Missed">Missed</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Rescheduled">Rescheduled</option>
                      </select>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-primary me-2" @click="saveEdit(item)">Save</button>
                      <button class="btn btn-sm btn-outline-secondary" @click="resetItem(item)">Reset</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="scheduleData.length === 0" class="text-center text-muted py-4">
              No schedule items found for this patient.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { addToast } = useToast()

const props = defineProps({
  show: { type: Boolean, default: false },
  patientId: { type: [String, Number], required: true },
  schedule: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'updated'])

const loading = ref(false)
const scheduleData = ref([])
const datePickerRefs = ref({})

// Initialize vaccine lookup once to resolve vaccine names
let vaccineLookup = {}
const fetchVaccinesOnce = async () => {
  try {
    const res = await api.get('/vaccines')
    const list = res.data || []
    if (Array.isArray(list)) {
      list.forEach(v => {
        const id = v.vaccine_id || v.id
        vaccineLookup[id] = v.antigen_name || v.name || ''
      })
    }
  } catch (e) {
    // ignore errors here
  }
}
fetchVaccinesOnce()

// Initialize local editable copy and map vaccine names
watch(() => props.schedule, (val) => {
  scheduleData.value = (val || []).map(s => ({
    ...s,
    _editedDate: formatForInput(s.scheduledDate || s.scheduled_date),
    _editedStatus: s.status || 'Pending',
    vaccine_name: s.vaccine_name || s.vaccineName || vaccineLookup[s.vaccine_id] || vaccineLookup[s.vaccineId] || ''
  }))
}, { immediate: true })

watch(() => props.show, (v) => {
  if (v) {
    // ensure local copy is fresh
    scheduleData.value = (props.schedule || []).map(s => ({
      ...s,
      _editedDate: formatForInput(s.scheduledDate || s.scheduled_date),
      _editedStatus: s.status || 'Pending',
      vaccine_name: s.vaccine_name || s.vaccineName || vaccineLookup[s.vaccine_id] || vaccineLookup[s.vaccineId] || ''
    }))
  }
})

const formatForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${yyyy}`
}

const validateAndFormatDate = (item) => {
  if (!item._editedDate) return
  
  // Handle various input formats and convert to MM/DD/YYYY
  let dateStr = item._editedDate.trim()
  let date = null
  
  // Try parsing MM/DD/YYYY format
  if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [month, day, year] = dateStr.split('/')
    date = new Date(year, month - 1, day)
  }
  // Try parsing DD/MM/YYYY format (convert to MM/DD/YYYY)
  else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const parts = dateStr.split('/')
    // Assume DD/MM/YYYY if day > 12 or month <= 12
    if (parseInt(parts[0]) > 12 || parseInt(parts[1]) <= 12) {
      const [day, month, year] = parts
      date = new Date(year, month - 1, day)
    }
  }
  // Try parsing YYYY-MM-DD format
  else if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    date = new Date(dateStr)
  }
  
  if (date && !isNaN(date.getTime())) {
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const yyyy = date.getFullYear()
    item._editedDate = `${mm}/${dd}/${yyyy}`
  }
}

const resetItem = (item) => {
  item._editedDate = formatForInput(item.scheduledDate || item.scheduled_date)
  item._editedStatus = item.status || 'Pending'
}

const convertToISODate = (mmddyyyy) => {
  if (!mmddyyyy) return null
  const [month, day, year] = mmddyyyy.split('/')
  if (!month || !day || !year) return null
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

const openDatePicker = (item) => {
  const datePickerEl = datePickerRefs.value[item.patient_schedule_id]
  if (datePickerEl) {
    // Set the current value in ISO format for the date picker
    const isoDate = convertToISODate(item._editedDate)
    if (isoDate) {
      datePickerEl.value = isoDate
    }
    // Trigger the date picker
    datePickerEl.showPicker()
  }
}

const onDatePickerChange = (item, event) => {
  const isoDate = event.target.value
  if (isoDate) {
    // Convert from ISO (YYYY-MM-DD) to MM/DD/YYYY for display
    const date = new Date(isoDate)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const yyyy = date.getFullYear()
    item._editedDate = `${mm}/${dd}/${yyyy}`
  }
}

const saveEdit = async (item) => {
  // send PUT to backend route for updating patientschedule row
  try {
    const isoDate = convertToISODate(item._editedDate)
    if (!isoDate) {
      addToast({ title: 'Error', message: 'Please enter a valid date in MM/DD/YYYY format.', type: 'error' })
      return
    }
    
    const payload = { 
      scheduled_date: isoDate, 
      status: item._editedStatus,
      updated_by: localStorage.getItem('userId') 
    }
    await api.put(`/immunizations/schedule/${item.patient_schedule_id}`, payload)
    // emit update to parent and refresh local copy
    emit('updated')
  } catch (err) {
    console.error('Failed to save schedule edit', err)
    addToast({ title: 'Error', message: 'Failed to save schedule edit. See console for details.', type: 'error' })
  }
}
</script>

<style scoped>
.modal.show {
  display: block;
}
</style>
