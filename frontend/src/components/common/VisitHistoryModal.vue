<template>
  <div class="modal fade" :class="{ show: show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-clock-history me-2"></i>Visit History</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
          </div>

          <div v-else>
            <div v-if="visits.length === 0" class="text-center text-muted py-4">No visits found for this patient.</div>
            <div v-else class="list-group">
              <button v-for="v in visits" :key="v.visit_id" type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-start" @click="selectVisit(v)">
                <div>
                  <div class="fw-semibold">{{ formatDate(v.visit_date) }} - {{ v.visit_type || v.service_rendered || 'Visit' }}</div>
                  <div class="text-muted small">Recorded by: {{ v.recorded_by || v.recorded_by_name || v.recorded_by_user || '' }}</div>
                </div>
                <small class="text-muted">{{ v.findings ? (v.findings.length > 30 ? v.findings.substring(0,30) + '...' : v.findings) : '' }}</small>
              </button>
            </div>

            <div v-if="selected" class="card mt-3">
              <div class="card-body">
                <h6 class="card-title">Visit Details</h6>
                <div class="row g-2">
                  <div class="col-md-4"><strong>Date:</strong><div class="text-muted">{{ formatDate(selected.visit_date) }}</div></div>
                  <div class="col-md-4"><strong>Recorded By:</strong><div class="text-muted">{{ selected.recorded_by_name || selected.recorded_by || '' }}</div></div>
                  <div class="col-md-4"><strong>Service Rendered:</strong><div class="text-muted">{{ selected.service_rendered || selected.visit_type || '' }}</div></div>
                </div>
                <hr />
                <div>
                  <h6><i class="bi bi-heart-pulse me-2"></i>Vital Signs</h6>
                  <div v-if="hasVitalSigns(selected)" class="table-responsive">
                    <table class="table table-sm table-bordered">
                      <tbody>
                        <tr v-if="getVitalSign(selected, 'temperature')">
                          <td class="fw-semibold"><i class="bi bi-thermometer me-2"></i>Temperature</td>
                          <td>{{ getVitalSign(selected, 'temperature') }}°C</td>
                        </tr>
                        <tr v-if="getVitalSign(selected, 'weight')">
                          <td class="fw-semibold"><i class="bi bi-speedometer2 me-2"></i>Weight</td>
                          <td>{{ getVitalSign(selected, 'weight') }} kg</td>
                        </tr>
                        <tr v-if="getVitalSign(selected, 'height_length') || getVitalSign(selected, 'height')">
                          <td class="fw-semibold"><i class="bi bi-rulers me-2"></i>Height/Length</td>
                          <td>{{ getVitalSign(selected, 'height_length') || getVitalSign(selected, 'height') }} cm</td>
                        </tr>
                        <tr v-if="getVitalSign(selected, 'muac')">
                          <td class="fw-semibold"><i class="bi bi-circle me-2"></i>MUAC</td>
                          <td>{{ getVitalSign(selected, 'muac') }} cm</td>
                        </tr>
                        <tr v-if="getVitalSign(selected, 'blood_pressure') || getVitalSign(selected, 'bp')">
                          <td class="fw-semibold"><i class="bi bi-activity me-2"></i>Blood Pressure</td>
                          <td>{{ getVitalSign(selected, 'blood_pressure') || getVitalSign(selected, 'bp') }}</td>
                        </tr>
                        <tr v-if="getVitalSign(selected, 'pulse') || getVitalSign(selected, 'heart_rate')">
                          <td class="fw-semibold"><i class="bi bi-heart me-2"></i>Pulse/Heart Rate</td>
                          <td>{{ getVitalSign(selected, 'pulse') || getVitalSign(selected, 'heart_rate') }} bpm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else class="text-muted small">No vital signs recorded for this visit.</div>
                </div>
                <div class="mt-3">
                  <h6><i class="bi bi-shield-check me-2"></i>Services / Immunizations Given</h6>
                  <div v-if="(selected.immunizations_given && selected.immunizations_given.length) || (selected.immunizations && selected.immunizations.length)">
                    <ul>
                      <li v-for="im in (selected.immunizations_given || selected.immunizations || [])" :key="im.immunization_id || im.vaccine_id">
                        <strong>{{ im.vaccineName || im.antigen_name || im.vaccine_name || im.name }}</strong>
                        <div class="small text-muted">Dose: {{ im.dose_number || im.doseNumber || im.dose || '-' }} | Lot: {{ im.lot_number || im.lot || im.batch_number || '' }}</div>
                      </li>
                    </ul>
                  </div>
                  <div v-else class="text-muted small">No immunizations or services recorded for this visit.</div>
                </div>
                <div class="mt-3">
                  <h6><i class="bi bi-clipboard-data me-2"></i>Findings / Remarks</h6>
                  <div class="p-2 bg-light rounded">
                    <div class="small">{{ selected.findings || selected.remarks || selected.notes || 'No findings or remarks recorded for this visit.' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="show" class="modal-backdrop fade show"></div>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '@/services/api'

const props = defineProps({
  show: { type: Boolean, default: false },
  patientId: { type: [String, Number], default: null }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const visits = ref([])
const selected = ref(null)

watch(() => props.show, (v) => { if (v && props.patientId) fetchVisits() })

const fetchVisits = async () => {
  loading.value = true
  visits.value = []
  selected.value = null
  try {
    const res = await api.get('/visits', { params: { patient_id: props.patientId } })
    visits.value = res.data?.items || res.data?.data || res.data || []
  } catch (err) {
    console.error('Error fetching visits', err)
    visits.value = []
  } finally {
    loading.value = false
  }
}

const selectVisit = async (v) => {
  selected.value = null
  try {
    const res = await api.get(`/visits/${v.visit_id || v.visitId || v.id}`)
    selected.value = res.data || res.data?.data || v
  } catch (err) {
    console.error('Error fetching visit details', err)
    selected.value = v
  }
}

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const hasVitalSigns = (visit) => {
  if (!visit) return false
  const vitals = visit.vital_signs || visit.vitals || visit.vitals_json || {}
  
  // Handle both object and array formats
  if (Array.isArray(vitals) && vitals.length > 0) {
    return Object.keys(vitals[0]).length > 0
  }
  
  return vitals && typeof vitals === 'object' && Object.keys(vitals).length > 0
}

const getVitalSign = (visit, key) => {
  if (!visit) return null
  const vitals = visit.vital_signs || visit.vitals || visit.vitals_json || {}
  
  // Handle array format (get first item)
  if (Array.isArray(vitals) && vitals.length > 0) {
    return vitals[0][key] || null
  }
  
  // Handle object format
  return vitals[key] || null
}
</script>

<style scoped>
.modal.show { background-color: rgba(0,0,0,0.45); }
pre { white-space: pre-wrap; word-break: break-word; }
</style>
