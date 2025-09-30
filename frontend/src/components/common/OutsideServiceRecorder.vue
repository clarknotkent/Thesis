<template>
  <div class="p-3">
    <form @submit.prevent="saveRecord">
      <!-- Patient selection -->
      <div class="mb-3">
        <label class="form-label">Patient *</label>
        <select class="form-select" v-model="patientId" :disabled="lockPatient" required>
          <option value="">Select patient</option>
          <option v-for="p in patients" :key="p.id" :value="p.id">{{ p.childInfo.name }}</option>
        </select>
      </div>

      <!-- Optional vitals -->
      <h6 class="mb-2">Vital Signs (optional)</h6>
      <div class="row g-3 mb-3">
        <div class="col-md-3">
          <label class="form-label">Temperature (°C)</label>
          <input type="number" step="0.1" class="form-control" v-model.number="vitals.temperature">
        </div>
        <div class="col-md-3">
          <label class="form-label">MUAC (cm)</label>
          <input type="number" step="0.1" class="form-control" v-model.number="vitals.muac">
        </div>
        <div class="col-md-3">
          <label class="form-label">Respiration</label>
          <input type="number" class="form-control" v-model.number="vitals.respiration">
        </div>
        <div class="col-md-3">
          <label class="form-label">Weight (kg)</label>
          <input type="number" step="0.01" class="form-control" v-model.number="vitals.weight">
        </div>
        <div class="col-md-3">
          <label class="form-label">Height (cm)</label>
          <input type="number" step="0.1" class="form-control" v-model.number="vitals.height">
        </div>
      </div>

      <!-- Service actions -->
      <div class="mb-3">
        <label class="form-label">Add Services</label>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-primary" @click="openVaccineModal"><i class="bi bi-shield-plus"></i> Vaccine</button>
          <button type="button" class="btn btn-outline-secondary" @click="openDewormModal"><i class="bi bi-bug"></i> Deworming</button>
          <button type="button" class="btn btn-outline-warning" @click="openVitAModal"><i class="bi bi-capsule"></i> Vitamin A</button>
        </div>
      </div>

      <!-- Buffered services -->
      <div v-if="buffer.length" class="mb-3">
        <label class="form-label">Buffered Services</label>
        <ul class="list-group">
          <li v-for="(s, i) in buffer" :key="i" class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{{ s.kind }}</strong>
              <span class="text-muted ms-2">{{ s.summary }}</span>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="buffer.splice(i,1)"><i class="bi bi-x"></i></button>
          </li>
        </ul>
      </div>

      <div class="text-end">
        <button type="submit" class="btn btn-primary" :disabled="saving || !patientId">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
          Save Record
        </button>
      </div>
    </form>

    <!-- Vaccine modal (Outside: catalog-based, no inventory) -->
    <div class="modal fade" :class="{ show: showVaccine }" :style="{ display: showVaccine ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-shield-plus me-2"></i>Add Vaccination Record (Outside)</h5>
            <button type="button" class="btn-close" @click="showVaccine = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="addVaccineToBuffer">
              <div class="mb-3">
                <label class="form-label">Vaccine *</label>
                <select class="form-select" v-model="vaccForm.vaccineId" @change="onCatalogSelect" required>
                  <option value="">Select a vaccine</option>
                  <option v-for="v in vaccineCatalog" :key="v.vaccine_id" :value="v.vaccine_id">{{ v.antigen_name }}</option>
                </select>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Dose *</label>
                  <select class="form-select" v-model="vaccForm.doseNumber" required>
                    <option value="">Select dose</option>
                    <option v-for="d in availableDoses" :key="d" :value="d">Dose {{ d }}</option>
                  </select>
                  <div v-if="autoSelectHint" class="form-text text-success">{{ autoSelectHint }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Date *</label>
                  <input type="date" class="form-control" v-model="vaccForm.dateAdministered" required>
                </div>
                <div class="col-md-12">
                  <label class="form-label">Health Worker *</label>
                  <select class="form-select" v-model="vaccForm.healthWorkerId" required>
                    <option value="">Select health worker</option>
                    <option v-for="hw in nurses" :key="hw.id" :value="hw.id">{{ hw.name }} ({{ hw.hw_type }})</option>
                  </select>
                </div>
                <div class="col-md-12">
                  <label class="form-label">Remarks</label>
                  <input type="text" class="form-control" v-model="vaccForm.remarks" placeholder="Optional notes">
                </div>
              </div>
              <div class="text-end mt-3">
                <button type="button" class="btn btn-secondary me-2" @click="showVaccine = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showVaccine" class="modal-backdrop fade show" @click="showVaccine=false"></div>

    <!-- Deworm modal (Outside) -->
    <div class="modal fade" :class="{ show: showDeworm }" :style="{ display: showDeworm ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-bug me-2"></i>Add Deworming (Outside)</h5>
            <button type="button" class="btn-close" @click="showDeworm = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="addDewormToBuffer">
              <div class="mb-3">
                <label class="form-label">Date *</label>
                <input type="date" class="form-control" v-model="dewForm.date" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Health Worker *</label>
                <select class="form-select" v-model="dewForm.healthWorkerId" required>
                  <option value="">Select health worker</option>
                  <option v-for="hw in nurses" :key="hw.id" :value="hw.id">{{ hw.name }} ({{ hw.hw_type }})</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Remarks</label>
                <input type="text" class="form-control" v-model="dewForm.remarks">
              </div>
              <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" @click="showDeworm=false">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showDeworm" class="modal-backdrop fade show" @click="showDeworm=false"></div>

    <!-- Vitamin A modal (Outside) -->
    <div class="modal fade" :class="{ show: showVitA }" :style="{ display: showVitA ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-capsule me-2"></i>Add Vitamin A (Outside)</h5>
            <button type="button" class="btn-close" @click="showVitA = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="addVitAToBuffer">
              <div class="mb-3">
                <label class="form-label">Date *</label>
                <input type="date" class="form-control" v-model="vitAForm.date" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Health Worker *</label>
                <select class="form-select" v-model="vitAForm.healthWorkerId" required>
                  <option value="">Select health worker</option>
                  <option v-for="hw in nurses" :key="hw.id" :value="hw.id">{{ hw.name }} ({{ hw.hw_type }})</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Remarks</label>
                <input type="text" class="form-control" v-model="vitAForm.remarks">
              </div>
              <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" @click="showVitA=false">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showVitA" class="modal-backdrop fade show" @click="showVitA=false"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
const { addToast } = useToast()

const props = defineProps({
  initialPatientId: { type: [String, Number], default: '' },
  lockPatient: { type: Boolean, default: false }
})

const emit = defineEmits(['saved', 'close'])

const patients = ref([])
const nurses = ref([])
const vaccineCatalog = ref([])
const availableDoses = ref([1,2,3,4,5])
const autoSelectHint = ref('')

const patientId = ref('')
const saving = ref(false)
const vitals = ref({ temperature: '', muac: '', respiration: '', weight: '', height: '' })
const buffer = ref([])

// Modal states
const showVaccine = ref(false)
const showDeworm = ref(false)
const showVitA = ref(false)

// Forms for each modal
const vaccForm = ref({ vaccineId: '', doseNumber: '', dateAdministered: new Date().toISOString().split('T')[0], healthWorkerId: '', remarks: '' })
const dewForm = ref({ date: new Date().toISOString().split('T')[0], healthWorkerId: '', remarks: '' })
const vitAForm = ref({ date: new Date().toISOString().split('T')[0], healthWorkerId: '', remarks: '' })

const fetchPatients = async () => {
  try {
    const res = await api.get('/patients')
    const payload = res.data?.data || {}
    const list = payload.patients || payload.items || payload || []
    patients.value = list.map(p => ({ id: p.patient_id || p.id, childInfo: { name: [p.firstname, p.middlename, p.surname].filter(Boolean).join(' ').trim() } }))
  } catch (err) {
    patients.value = []
  }
}

const fetchNurses = async () => {
  try {
    const res = await api.get('/health-workers')
    let list = []
    if (res.data?.data?.healthWorkers && Array.isArray(res.data.data.healthWorkers)) list = res.data.data.healthWorkers
    else if (Array.isArray(res.data)) list = res.data
    else if (res.data?.data && Array.isArray(res.data.data)) list = res.data.data
    else if (res.data?.users && Array.isArray(res.data.users)) list = res.data.users
    else if (res.data?.healthWorkers && Array.isArray(res.data.healthWorkers)) list = res.data.healthWorkers
    nurses.value = list.filter(hw => {
      const t = hw.hw_type || hw.role || hw.type || ''
      return t.toLowerCase().includes('nurse') || t.toLowerCase().includes('nutritionist')
    }).map(hw => ({ id: hw.user_id || hw.id || hw.health_worker_id, name: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname, hw_type: hw.hw_type || hw.role || hw.type }))
  } catch (err) {
    nurses.value = []
  }
}

const fetchVaccineCatalog = async () => {
  try {
    const response = await api.get('/vaccines');
    const list = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
    vaccineCatalog.value = list.map(v => ({ vaccine_id: v.vaccine_id || v.id, antigen_name: v.antigen_name || v.name || '' }));
  } catch (_) {
    vaccineCatalog.value = []
  }
}

const openVaccineModal = () => {
  if (!patientId.value) return addToast({ title:'Validation', message:'Select patient first', type:'error' })
  vaccForm.value = { vaccineId:'', doseNumber:'', dateAdministered: new Date().toISOString().split('T')[0], healthWorkerId:'', remarks:'' }
  availableDoses.value = [1,2,3,4,5]
  autoSelectHint.value = ''
  showVaccine.value = true
}
const openDewormModal = () => {
  if (!patientId.value) return addToast({ title:'Validation', message:'Select patient first', type:'error' })
  dewForm.value = { date: new Date().toISOString().split('T')[0], healthWorkerId:'', remarks:'' }
  showDeworm.value = true
}
const openVitAModal = () => {
  if (!patientId.value) return addToast({ title:'Validation', message:'Select patient first', type:'error' })
  vitAForm.value = { date: new Date().toISOString().split('T')[0], healthWorkerId:'', remarks:'' }
  showVitA.value = true
}

const onCatalogSelect = async () => {
  const vid = vaccForm.value.vaccineId
  if (!vid) { availableDoses.value=[1,2,3,4,5]; autoSelectHint.value=''; return }
  try {
    const res = await api.get(`/patients/${patientId.value}/smart-doses`, { params: { vaccine_id: vid } })
    const data = res.data?.data || res.data || {}
    const doses = Array.isArray(data.available_doses) ? data.available_doses : (Array.isArray(data.doses) ? data.doses : [])
    availableDoses.value = doses.length ? doses : [1,2,3,4,5]
    if (data.auto_select) { vaccForm.value.doseNumber = data.auto_select; autoSelectHint.value = `Auto-selected Dose ${data.auto_select} based on schedule` }
    else if (doses.length === 1) { vaccForm.value.doseNumber = doses[0]; autoSelectHint.value = `Auto-selected Dose ${doses[0]} (only remaining)` }
    else { autoSelectHint.value='' }
  } catch (_) {
    availableDoses.value=[1,2,3,4,5]; autoSelectHint.value=''
  }
}

const addVaccineToBuffer = () => {
  if (!vaccForm.value.vaccineId || !vaccForm.value.doseNumber || !vaccForm.value.dateAdministered || !vaccForm.value.healthWorkerId) return
  buffer.value.push({
    kind: 'Immunization',
    summary: `Vaccine ${vaccForm.value.vaccineId} • Dose ${vaccForm.value.doseNumber} • ${vaccForm.value.dateAdministered}`,
    api: '/immunizations',
    body: (ctx) => ({ patient_id: ctx.patientId, vaccine_id: vaccForm.value.vaccineId, dose_number: vaccForm.value.doseNumber, administered_date: vaccForm.value.dateAdministered, administered_by: vaccForm.value.healthWorkerId, remarks: vaccForm.value.remarks || '', outside: true, ...(hasVitals() ? { vitals: ctx.vitals } : {}) })
  })
  showVaccine.value = false
}

const addDewormToBuffer = () => {
  if (!dewForm.value.date || !dewForm.value.healthWorkerId) return
  buffer.value.push({
    kind: 'Deworming',
    summary: `Deworming • ${dewForm.value.date}`,
    api: '/deworming',
    body: (ctx) => ({ patient_id: ctx.patientId, administered_date: dewForm.value.date, administered_by: dewForm.value.healthWorkerId, remarks: dewForm.value.remarks || '', outside: true, ...(hasVitals() ? { vitals: ctx.vitals } : {}) })
  })
  showDeworm.value = false
}

const addVitAToBuffer = () => {
  if (!vitAForm.value.date || !vitAForm.value.healthWorkerId) return
  buffer.value.push({
    kind: 'Vitamin A',
    summary: `Vitamin A • ${vitAForm.value.date}`,
    api: '/vitamina',
    body: (ctx) => ({ patient_id: ctx.patientId, administered_date: vitAForm.value.date, administered_by: vitAForm.value.healthWorkerId, remarks: vitAForm.value.remarks || '', outside: true, ...(hasVitals() ? { vitals: ctx.vitals } : {}) })
  })
  showVitA.value = false
}

const hasVitals = () => {
  const v = vitals.value || {}
  return [v.temperature, v.muac, v.respiration, v.weight, v.height].some(x => x !== '' && x !== null && typeof x !== 'undefined')
}

const saveRecord = async () => {
  try {
    if (!patientId.value) return addToast({ title:'Validation', message:'Select patient', type:'error' })
    if (buffer.value.length === 0) return addToast({ title:'Validation', message:'Add at least one service', type:'error' })
    saving.value = true
    // Persist buffered services sequentially (could be parallel)
    for (const item of buffer.value) {
      const body = item.body({ patientId: patientId.value, vitals: vitals.value })
      await api.post(item.api, body)
    }
    addToast({ title:'Saved', message:'Record saved successfully', type:'success' })
    emit('saved')
  } catch (err) {
    addToast({ title:'Error', message: err?.response?.data?.message || 'Failed to save record', type:'error' })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchPatients()
  fetchNurses()
  fetchVaccineCatalog()
  if (props.initialPatientId) patientId.value = String(props.initialPatientId)
})
</script>

<style scoped>
.modal.show { background-color: rgba(0,0,0,0.5); }
</style>
