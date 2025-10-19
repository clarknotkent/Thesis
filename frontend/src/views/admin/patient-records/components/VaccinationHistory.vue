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
              <th>Vaccine Name</th>
              <th>Disease Prevented</th>
              <th>Dose</th>
              <th>Date Administered</th>
              <th>Age at Administration</th>
              <th>Administered By</th>
              <th>Site</th>
              <th>Facility</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="vaccination in sortedVaccinations" :key="vaccination.id">
              <td class="fw-semibold">
                {{ vaccination.vaccine_antigen_name || vaccination.vaccineName || vaccination.antigen_name || vaccination.antigenName || 'Unknown' }}
              </td>
              <td>
                <small>{{ vaccination.disease_prevented || vaccination.lotNumber || vaccination.batch_number || vaccination.batchNumber || '—' }}</small>
              </td>
              <td>
                <span v-if="vaccination.dose_number || vaccination.doseNumber || vaccination.dose" class="badge bg-secondary">
                  Dose {{ vaccination.dose_number || vaccination.doseNumber || vaccination.dose }}
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <small>{{ formatDate(vaccination.administered_date || vaccination.date_administered || vaccination.dateAdministered) }}</small>
              </td>
              <td>
                <small>{{ vaccination.age_at_administration || '—' }}</small>
              </td>
              <td>
                <small>{{
                  vaccination.administered_by_name ||
                  vaccination.administeredBy ||
                  vaccination.health_worker_name ||
                  vaccination.healthWorkerName ||
                  vaccination.worker_name ||
                  vaccination.workerName ||
                  vaccination.recorded_by_name ||
                  'Taken Outside'
                }}</small>
              </td>
              <td>
                <small>{{ deriveSite(vaccination) }}</small>
              </td>
              <td>
                <small>{{ deriveFacility(vaccination) }}</small>
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
    const aDate = a.administered_date || a.date_administered || a.dateAdministered
    const bDate = b.administered_date || b.date_administered || b.dateAdministered
    const dateA = aDate ? new Date(aDate) : 0
    const dateB = bDate ? new Date(bDate) : 0
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

// Derive site: per requirement, always derive from remarks if present
const deriveSite = (v) => {
  const remarks = v?.remarks || v?.notes || ''
  if (remarks) {
    // Try to extract site after keywords like 'site:' or 'Site:'
    const m = remarks.match(/(?:site|injection site)\s*[:\-]\s*([^;,.\n]+)/i)
    if (m && m[1]) return m[1].trim()
    // Fallback: if remarks look like "Left deltoid" etc., use full remarks
    if (/deltoid|thigh|vastus|buttock|arm|left|right|intramuscular|subcutaneous/i.test(remarks)) return remarks
  }
  // Otherwise fallback to explicit fields if provided
  return v?.site || v?.site_of_administration || v?.siteOfAdministration || '—'
}

// Facility: when outside is true, show 'Outside', otherwise use facility fields
const deriveFacility = (v) => {
  const isOutside = !!(v?.immunization_outside || v?.is_outside || v?.isOutside || v?.outside_immunization)
  if (isOutside) return 'Outside'
  return (
    v?.immunization_facility_name ||
    v?.facility_name ||
    v?.facilityName ||
    v?.health_center ||
    v?.healthCenter ||
    '—'
  )
}

const fetchVaccinationHistory = async () => {
  try {
    loading.value = true
    
    // Fetch from the patient detail endpoint which includes vaccination history
    const response = await api.get(`/patients/${props.patientId}`)
    const patientData = response.data.data || response.data
    
    // Extract vaccination history from patient data
    let vax = patientData.vaccinationHistory || patientData.vaccination_history || patientData.immunizations || patientData.immunizationHistory || []

    // If patient payload doesn't include history, fallback to dedicated endpoint
    if (!Array.isArray(vax) || vax.length === 0) {
      try {
        const vaccRes = await api.get('/immunizations', { params: { patient_id: props.patientId, limit: 200 } })
        vax = vaccRes.data?.data || vaccRes.data?.items || vaccRes.data || []
      } catch (e) {
        // ignore, keep empty
        vax = []
      }
    }

    vaccinations.value = Array.isArray(vax) ? vax : []
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
