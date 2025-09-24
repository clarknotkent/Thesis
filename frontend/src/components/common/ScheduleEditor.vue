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
                      <input type="date" class="form-control form-control-sm" v-model="item._editedDate" />
                    </td>
                    <td>{{ item.dose_number || item.doseNumber }}</td>
                    <td>{{ item.status }}</td>
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
    vaccine_name: s.vaccine_name || s.vaccineName || vaccineLookup[s.vaccine_id] || vaccineLookup[s.vaccineId] || ''
  }))
}, { immediate: true })

watch(() => props.show, (v) => {
  if (v) {
    // ensure local copy is fresh
    scheduleData.value = (props.schedule || []).map(s => ({
      ...s,
      _editedDate: formatForInput(s.scheduledDate || s.scheduled_date),
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
  return `${yyyy}-${mm}-${dd}`
}

const resetItem = (item) => {
  item._editedDate = formatForInput(item.scheduledDate || item.scheduled_date)
}

const saveEdit = async (item) => {
  // send PUT to backend route for updating patientschedule row
  try {
    const payload = { scheduled_date: item._editedDate, updated_by: localStorage.getItem('userId') }
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
