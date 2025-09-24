<template>
  <div class="modal fade" :class="{ show: show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Visit History</h5>
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
                  <h6>Vital Signs</h6>
                  <pre class="small bg-light p-2">{{ prettyVitals(selected.vital_signs || selected.vitals || selected.vitals_json || {}) }}</pre>
                </div>
                <div class="mt-3">
                  <h6>Services / Immunizations Given</h6>
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
                  <h6>Findings / Remarks</h6>
                  <div class="small text-muted">{{ selected.findings || selected.remarks || selected.notes || '—' }}</div>
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

const formatDate = (d) => { if (!d) return ''; return new Date(d).toLocaleString() }

const prettyVitals = (v) => {
  try { return JSON.stringify(v, null, 2) } catch(e){ return String(v) }
}
</script>

<style scoped>
.modal.show { background-color: rgba(0,0,0,0.45); }
pre { white-space: pre-wrap; word-break: break-word; }
</style>
