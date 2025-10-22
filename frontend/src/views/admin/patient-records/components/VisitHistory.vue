<template>
  <div class="visit-history">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading medical history...</span>
      </div>
      <p class="text-muted mt-3">Loading medical history...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!visits || visits.length === 0" class="text-center py-5">
      <i class="bi bi-clipboard-x text-muted" style="font-size: 3rem;"></i>
      <p class="text-muted mt-3">No medical records found</p>
    </div>

    <!-- Medical History Table -->
    <div v-else class="table-responsive">
      <table class="table table-hover table-striped">
        <thead>
          <tr>
            <th>Checkup Date</th>
            <th>Recorded By</th>
            <th>Services</th>
            <th>Immunizations</th>
            <th>Vitals</th>
            <th>Findings</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="visit in sortedVisits" :key="visit.visit_id || visit.id">
            <td>
              <i class="bi bi-calendar-event me-1"></i>
              {{ formatDate(visit.visit_date) }}
            </td>
            <td>
              <i class="bi bi-person-badge me-1"></i>
              {{ visit.recorded_by || getWorkerName(visit) }}
            </td>
            <td>
              <div class="d-flex flex-column gap-1">
                <span v-if="visit.service_rendered" class="services-badge" :title="visit.service_rendered">
                  {{ visit.service_rendered }}
                </span>
                <div class="d-flex gap-1">
                  <span v-if="visit.vitamina_given" class="badge bg-warning text-dark">Vitamin A</span>
                  <span v-if="visit.deworming_given" class="badge bg-success">Deworming</span>
                </div>
              </div>
              <span v-if="!visit.service_rendered && !visit.vitamina_given && !visit.deworming_given" class="text-muted">—</span>
            </td>
            <td>
              <div v-if="Array.isArray(visit.immunizations_given) && visit.immunizations_given.length > 0">
                <small class="d-block" v-for="(im, idx) in visit.immunizations_given" :key="idx">
                  <i class="bi bi-syringe me-1"></i>{{ im.antigen_name }} <span v-if="im.dose_number">(Dose {{ im.dose_number }})</span>
                </small>
              </div>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <div v-if="hasVitals(visit)" class="vitals-info">
                <small class="d-block" v-if="getVitals(visit).height_length">
                  <i class="bi bi-arrows-vertical me-1"></i>{{ getVitals(visit).height_length }} cm
                </small>
                <small class="d-block" v-if="getVitals(visit).weight">
                  <i class="bi bi-speedometer me-1"></i>{{ getVitals(visit).weight }} kg
                </small>
                <small class="d-block" v-if="getVitals(visit).temperature">
                  <i class="bi bi-thermometer me-1"></i>{{ getVitals(visit).temperature }}°C
                </small>
                <small class="d-block" v-if="getVitals(visit).respiration_rate">
                  <i class="bi bi-wind me-1"></i>{{ getVitals(visit).respiration_rate }} bpm
                </small>
                <small class="d-block" v-if="getVitals(visit).muac">
                  <i class="bi bi-activity me-1"></i>{{ getVitals(visit).muac }} cm MUAC
                </small>
              </div>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <span v-if="visit.findings" class="text-truncate" :title="visit.findings">
                {{ truncateText(visit.findings, 80) }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Info -->
    <div v-if="visits && visits.length > 0" class="text-muted small mt-3">
      Showing {{ visits.length }} visit{{ visits.length !== 1 ? 's' : '' }}
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

const visits = ref([])
const loading = ref(true)

const sortedVisits = computed(() => {
  if (!visits.value || visits.value.length === 0) return []
  return [...visits.value].sort((a, b) => {
    const dateA = new Date(a.visit_date)
    const dateB = new Date(b.visit_date)
    return dateB - dateA // Sort descending (most recent first)
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

const getWorkerName = (visit) => {
  // visits_view exposes recorded_by (users.full_name)
  if (visit.recorded_by) return visit.recorded_by
  // Fallbacks for any legacy shapes
  if (visit.health_worker_name) return visit.health_worker_name
  if (visit.healthWorkerName) return visit.healthWorkerName
  if (visit.worker_name) return visit.worker_name
  if (visit.workerName) return visit.workerName
  if (visit.worker) {
    if (typeof visit.worker === 'string') return visit.worker
    if (visit.worker.name) return visit.worker.name
    if (visit.worker.username) return visit.worker.username
  }
  return '—'
}

const getVitals = (visit) => {
  // visits_view returns vital_signs object
  return visit.vital_signs || {}
}

const hasVitals = (visit) => {
  const v = getVitals(visit)
  return v && (v.height_length || v.weight || v.temperature || v.respiration_rate || v.muac)
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const fetchVisits = async () => {
  try {
    loading.value = true
    const pageSize = 200
    let page = 1
    let collected = []
    let totalPages = 1
    do {
      const resp = await api.get(`/visits?patient_id=${props.patientId}&page=${page}&limit=${pageSize}`)
      const raw = resp.data
      let batch = []
      if (Array.isArray(raw)) batch = raw
      else if (Array.isArray(raw?.data)) batch = raw.data
      else if (Array.isArray(raw?.items)) batch = raw.items
      else if (Array.isArray(raw?.visits)) batch = raw.visits
      else if (Array.isArray(raw?.data?.items)) batch = raw.data.items
      collected = collected.concat((batch || []).filter(v => v && (v.visit_date || v.visitDate)))
      totalPages = Number(raw?.totalPages || raw?.data?.totalPages || 1)
      page += 1
    } while (page <= totalPages)
    visits.value = collected
  } catch (err) {
    console.error('Error fetching medical history:', err)
    visits.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchVisits()
})
</script>

<style scoped>
.visit-history {
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

.vitals-info small {
  line-height: 1.4;
}

.services-badge {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
