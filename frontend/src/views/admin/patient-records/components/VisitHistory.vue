<template>
  <div class="visit-history">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading visit history...</span>
      </div>
      <p class="text-muted mt-3">Loading visit history...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!visits || visits.length === 0" class="text-center py-5">
      <i class="bi bi-clipboard-x text-muted" style="font-size: 3rem;"></i>
      <p class="text-muted mt-3">No visit records found</p>
    </div>

    <!-- Visit History Table -->
    <div v-else class="table-responsive">
      <table class="table table-hover table-striped">
        <thead>
          <tr>
            <th>Visit Date</th>
            <th>Visit Type</th>
            <th>Health Worker</th>
            <th>Vitals</th>
            <th>Services</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="visit in sortedVisits" :key="visit.id">
            <td>
              <i class="bi bi-calendar-event me-1"></i>
              {{ formatDate(visit.visit_date || visit.visitDate) }}
            </td>
            <td>
              <span class="badge bg-info">
                {{ visit.visit_type || visit.visitType || 'General' }}
              </span>
            </td>
            <td>
              <i class="bi bi-person-badge me-1"></i>
              {{ getWorkerName(visit) }}
            </td>
            <td>
              <div v-if="hasVitals(visit)" class="vitals-info">
                <small class="d-block" v-if="visit.height">
                  <i class="bi bi-arrows-vertical me-1"></i>{{ visit.height }} cm
                </small>
                <small class="d-block" v-if="visit.weight">
                  <i class="bi bi-speedometer me-1"></i>{{ visit.weight }} kg
                </small>
                <small class="d-block" v-if="visit.temperature">
                  <i class="bi bi-thermometer me-1"></i>{{ visit.temperature }}°C
                </small>
              </div>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <span v-if="visit.services" class="services-badge">
                {{ visit.services }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <span v-if="visit.notes" class="text-truncate" :title="visit.notes">
                {{ truncateText(visit.notes, 50) }}
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
    const dateA = new Date(a.visit_date || a.visitDate)
    const dateB = new Date(b.visit_date || b.visitDate)
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
  // Try different possible field names
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

const hasVitals = (visit) => {
  return visit.height || visit.weight || visit.temperature
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const fetchVisits = async () => {
  try {
    loading.value = true
    const response = await api.get(`/visits?patient_id=${props.patientId}&limit=100`)
    
    // Handle both direct array and paginated response
    if (Array.isArray(response.data)) {
      visits.value = response.data
    } else if (response.data.data && Array.isArray(response.data.data)) {
      visits.value = response.data.data
    } else if (response.data.visits && Array.isArray(response.data.visits)) {
      visits.value = response.data.visits
    } else {
      visits.value = []
    }
  } catch (err) {
    console.error('Error fetching visit history:', err)
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
