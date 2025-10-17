<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading vaccination history...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="vaccinations.length === 0" class="text-center py-5">
      <i class="bi bi-shield-x display-1 text-muted"></i>
      <p class="text-muted mt-3">No vaccination records found</p>
    </div>

    <!-- Vaccination Table -->
    <div v-else>
      <div class="mb-3 d-flex justify-content-between align-items-center">
        <h6 class="mb-0 text-primary">
          <i class="bi bi-list-check me-2"></i>Vaccination Records
        </h6>
        <span class="badge bg-info">{{ vaccinations.length }} Record(s)</span>
      </div>

      <div class="table-responsive">
        <table class="table table-hover table-striped">
          <thead class="table-light">
            <tr>
              <th>Date</th>
              <th>Vaccine Name</th>
              <th>Dose</th>
              <th>Batch Number</th>
              <th>Administered By</th>
              <th>Site</th>
              <th>Route</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="vaccination in sortedVaccinations" :key="vaccination.id">
              <td>
                <small>{{ formatDate(vaccination.date_administered || vaccination.dateAdministered) }}</small>
              </td>
              <td class="fw-semibold">
                {{ vaccination.vaccine_name || vaccination.vaccineName || 'Unknown' }}
              </td>
              <td>
                <span v-if="vaccination.dose_number || vaccination.doseNumber" class="badge bg-secondary">
                  Dose {{ vaccination.dose_number || vaccination.doseNumber }}
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <small>{{ vaccination.batch_number || vaccination.batchNumber || '—' }}</small>
              </td>
              <td>
                <small>{{ vaccination.administered_by || vaccination.administeredBy || '—' }}</small>
              </td>
              <td>
                <small>{{ vaccination.site || '—' }}</small>
              </td>
              <td>
                <small>{{ vaccination.route || '—' }}</small>
              </td>
              <td>
                <span 
                  class="badge" 
                  :class="getStatusBadgeClass(vaccination.status)"
                >
                  {{ vaccination.status || 'Completed' }}
                </span>
              </td>
              <td>
                <small class="text-muted">{{ vaccination.remarks || vaccination.notes || '—' }}</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  }
})

const { addToast } = useToast()

const vaccinations = ref([])
const loading = ref(true)

const sortedVaccinations = computed(() => {
  return [...vaccinations.value].sort((a, b) => {
    const dateA = new Date(a.date_administered || a.dateAdministered)
    const dateB = new Date(b.date_administered || b.dateAdministered)
    return dateB - dateA // Most recent first
  })
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusBadgeClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'completed' || s === 'administered') return 'bg-success'
  if (s === 'scheduled' || s === 'pending') return 'bg-warning'
  if (s === 'missed' || s === 'overdue') return 'bg-danger'
  return 'bg-secondary'
}

const fetchVaccinationHistory = async () => {
  try {
    loading.value = true
    
    // Fetch from the patient detail endpoint which includes vaccination history
    const response = await api.get(`/patients/${props.patientId}`)
    const patientData = response.data.data || response.data
    
    // Extract vaccination history from patient data
    vaccinations.value = patientData.vaccinationHistory || patientData.vaccination_history || []
  } catch (error) {
    console.error('Error fetching vaccination history:', error)
    addToast({
      title: 'Error',
      message: 'Failed to load vaccination history',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchVaccinationHistory()
})
</script>

<style scoped>
.table {
  font-size: 0.9rem;
}

.table thead th {
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table tbody tr {
  transition: background-color 0.2s;
}

.table tbody tr:hover {
  background-color: rgba(13, 110, 253, 0.05);
}
</style>
