<template>
  <div>
    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-5"
    >
      <div
        class="spinner-border text-primary"
        role="status"
      >
        <span class="visually-hidden">Loading vaccination history...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="vaccinations.length === 0"
      class="text-center py-5"
    >
      <i class="bi bi-shield-x display-1 text-muted" />
      <p class="text-muted mt-3">
        No vaccination records found
      </p>
    </div>

    <!-- Vaccination Table -->
    <div v-else>
      <div class="mb-3 d-flex justify-content-between align-items-center">
        <h6 class="mb-0 text-primary">
          <i class="bi bi-list-check me-2" />Vaccination Records
        </h6>
        <div class="d-flex gap-2 align-items-center">
          <span class="badge bg-info">{{ vaccinations.length }} Record(s)</span>
          <button
            class="btn btn-sm btn-outline-primary"
            :disabled="loading"
            @click="refreshHistory"
          >
            <i class="bi bi-arrow-clockwise me-1" />
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-bordered">
          <thead class="table-light">
            <tr>
              <th
                style="width: 20%;"
                class="text-center"
              >
                Vaccine Name
              </th>
              <th
                style="width: 15%;"
                class="text-center"
              >
                Disease Prevented
              </th>
              <th
                style="width: 8%;"
                class="text-center"
              >
                Doses
              </th>
              <th
                style="width: 25%;"
                class="text-center"
              >
                Date Administered<br><small class="text-muted">MM/DD/YYYY</small>
              </th>
              <th
                style="width: 15%;"
                class="text-center"
              >
                Age at Administration
              </th>
              <th
                style="width: 10%;"
                class="text-center"
              >
                Status
              </th>
              <th
                style="width: 7%;"
                class="text-center"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="group in groupedVaccinations"
              :key="group.vaccineName"
            >
              <td class="text-center align-middle">
                <strong>{{ group.vaccineName }}</strong>
              </td>
              <td class="text-center align-middle">
                <small>{{ group.diseasePrevented }}</small>
              </td>
              <td class="text-center align-middle">
                <strong>{{ group.totalDoses }}</strong>
              </td>
              <td class="text-center align-middle">
                <div class="d-flex flex-wrap gap-2 justify-content-center">
                  <div 
                    v-for="(dose, index) in group.doses" 
                    :key="index"
                    class="dose-box-small"
                    :class="getDoseBoxClass(dose)"
                  >
                    <div class="dose-number-small">
                      Dose {{ dose.doseNumber }}
                    </div>
                    <div class="dose-date-small">
                      {{ formatShortDate(dose.administeredDate) }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="p-0 align-middle">
                <!-- Single dose: Display directly -->
                <div
                  v-if="group.totalDoses === 1"
                  class="px-3 py-2 text-center"
                >
                  <small>{{ group.doses[0].ageAtAdministration || '—' }}</small>
                </div>
                <!-- Multiple doses: Display with dividers -->
                <div v-else>
                  <div 
                    v-for="(dose, index) in group.doses" 
                    :key="index"
                    class="dose-row-cell px-3 py-2 text-center"
                    :class="{ 'border-bottom': index < group.doses.length - 1 }"
                  >
                    <small><strong>Dose {{ dose.doseNumber }}:</strong> {{ dose.ageAtAdministration || '—' }}</small>
                  </div>
                </div>
              </td>
              <td class="p-0 align-middle">
                <!-- Single dose: Display directly -->
                <div
                  v-if="group.totalDoses === 1"
                  class="px-3 py-2 text-center"
                >
                  <span :class="['badge', 'badge-sm', getStatusBadgeClass(group.doses[0].status)]">
                    {{ group.doses[0].status || 'Completed' }}
                  </span>
                </div>
                <!-- Multiple doses: Display with dividers -->
                <div v-else>
                  <div 
                    v-for="(dose, index) in group.doses" 
                    :key="index"
                    class="dose-row-cell px-3 py-2 text-center"
                    :class="{ 'border-bottom': index < group.doses.length - 1 }"
                  >
                    <span :class="['badge', 'badge-sm', getStatusBadgeClass(dose.status)]">
                      {{ dose.status || 'Completed' }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="text-center align-middle">
                <div class="d-flex flex-column gap-2">
                  <button 
                    class="btn btn-sm btn-primary"
                    title="View Details"
                    @click="viewVaccineDetails(group)"
                  >
                    <i class="bi bi-eye me-1" />View
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-primary"
                    :disabled="isOffline"
                    :title="isOffline ? 'Edit All Doses (Disabled offline)' : 'Edit All Doses'"
                    @click="isOffline ? null : editVaccineRecords(group)"
                  >
                    <i class="bi bi-pencil me-1" />Edit
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'
import { adminDB } from '@/services/offline/adminOfflineDB'

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  }
})

const router = useRouter()
const { addToast } = useToast()
const { isOffline, fetchPatientById } = useOfflineAdmin()

const vaccinations = ref([])
const loading = ref(true)

const groupedVaccinations = computed(() => {
  if (!vaccinations.value || vaccinations.value.length === 0) return []
  
  const groups = {}
  
  vaccinations.value.forEach(vaccination => {
    const vaccineName = vaccination.vaccine_antigen_name || vaccination.vaccineName || vaccination.antigen_name || vaccination.antigenName || 'Unknown Vaccine'
    
    if (!groups[vaccineName]) {
      groups[vaccineName] = {
        vaccineName,
        diseasePrevented: vaccination.disease_prevented || '—',
        doses: [],
        rawRecords: []
      }
    }
    
    groups[vaccineName].doses.push({
      doseNumber: vaccination.dose_number || vaccination.doseNumber || vaccination.dose || '—',
      administeredDate: vaccination.administered_date || vaccination.date_administered || vaccination.dateAdministered,
      ageAtAdministration: vaccination.age_at_administration || vaccination.ageAtAdministration || '—',
      status: vaccination.status || 'Completed',
      administeredBy: vaccination.administered_by_name || vaccination.administeredBy || vaccination.health_worker_name || 'Taken Outside',
      site: deriveSite(vaccination),
      facility: deriveFacility(vaccination),
      remarks: vaccination.remarks || vaccination.notes || '—'
    })
    
    groups[vaccineName].rawRecords.push(vaccination)
  })
  
  // Convert to array and sort
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
    // Sort by earliest administered date instead of predefined order
    const dateA = new Date(a.doses[0]?.administeredDate || 0)
    const dateB = new Date(b.doses[0]?.administeredDate || 0)
    return dateA - dateB
  })
})

const formatShortDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

const getDoseBoxClass = (dose) => {
  if (!dose.status) return 'dose-completed'
  
  const statusLower = dose.status.toLowerCase()
  
  if (statusLower.includes('completed') || statusLower.includes('administered')) {
    return 'dose-completed'
  } else if (statusLower.includes('overdue') || statusLower.includes('missed')) {
    return 'dose-overdue'
  } else if (statusLower.includes('scheduled') || statusLower.includes('pending')) {
    return 'dose-pending'
  } else {
    return 'dose-completed'
  }
}

const getStatusBadgeClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'completed' || s === 'administered') return 'bg-success'
  if (s === 'scheduled' || s === 'pending') return 'bg-warning'
  if (s === 'missed' || s === 'overdue') return 'bg-danger'
  return 'bg-secondary'
}

const viewVaccineDetails = (group) => {
  // Navigate to vaccine details page
  router.push({
    name: 'VaccineDetails',
    params: {
      patientId: props.patientId
    },
    query: {
      vaccine: group.vaccineName
    }
  })
}

const editVaccineRecords = (group) => {
  // Navigate to the consolidated edit page for all doses of this vaccine
  router.push({
    name: 'EditVaccineRecords',
    params: { 
      patientId: props.patientId,
      vaccine: group.vaccineName
    },
    query: {
      vaccine: group.vaccineName
    }
  })
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

    // Offline-first: check dedicated immunizations table (prefetched at login)
    try {
      const offlineRows = await adminDB.immunizations.where('patient_id').equals(String(props.patientId)).toArray()
      if (offlineRows && offlineRows.length) {
        vaccinations.value = offlineRows
        console.log('✅ Loaded vaccination history from immunizations table:', offlineRows.length, 'records')
        return
      }
    } catch (e) {
      console.warn('⚠️ Immunizations table lookup failed:', e.message)
    }

    // Secondary offline legacy cache (embedded patient record)
    try {
      const patientData = await fetchPatientById(props.patientId)
      if (patientData && Array.isArray(patientData.vaccinationHistory) && patientData.vaccinationHistory.length) {
        vaccinations.value = patientData.vaccinationHistory
        console.log('✅ Loaded vaccination history from embedded patient cache:', patientData.vaccinationHistory.length, 'records')
        return
      }
    } catch (cacheError) {
      console.warn('⚠️ Embedded cache lookup failed:', cacheError.message)
    }

    // Online path (only if not offline)
    if (!isOffline.value) {
      const response = await api.get(`/patients/${props.patientId}`)
      const patientData = response.data.data || response.data
      let vax = patientData.vaccinationHistory || patientData.vaccination_history || patientData.immunizations || patientData.immunizationHistory || []

      if (!Array.isArray(vax) || !vax.length) {
        // Dedicated endpoint fallback
        try {
          const vaccRes = await api.get('/immunizations', { params: { patient_id: props.patientId, limit: 200 } })
          vax = vaccRes.data?.data || vaccRes.data?.items || vaccRes.data || []
        } catch (e) {
          vax = []
        }
      }

      vaccinations.value = Array.isArray(vax) ? vax : []
      console.log('📥 Loaded vaccination history from API:', vaccinations.value.length, 'records')
    } else {
      vaccinations.value = []
      console.log('📴 Offline; no vaccination history cached for patient')
    }
  } catch (error) {
    console.error('Error fetching vaccination history:', error)
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_INTERNET_DISCONNECTED') {
      try {
        console.log('🌐 Network error, retrying embedded cache...')
        const patientData = await fetchPatientById(props.patientId)
        if (patientData && Array.isArray(patientData.vaccinationHistory)) {
          vaccinations.value = patientData.vaccinationHistory
          console.log('✅ Recovered vaccination history from embedded patient cache after network error')
          return
        }
      } catch (cacheError) {
        console.warn('⚠️ Cache fallback also failed:', cacheError.message)
      }
    }
    addToast({ title: 'Error', message: 'Failed to load vaccination history', type: 'error' })
  } finally {
    loading.value = false
  }
}

const refreshHistory = async () => {
  await fetchVaccinationHistory()
  addToast({ title: 'Refreshed', message: 'Vaccination history updated', type: 'success' })
}

onMounted(() => {
  fetchVaccinationHistory()
})

// Automatically refresh when component becomes active (e.g., after editing a visit)
onActivated(() => {
  fetchVaccinationHistory()
})
</script>

<style scoped>
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
.dose-completed {
  border-color: #198754;
  background-color: #f0f9f4;
}

.dose-completed .dose-number-small {
  color: #198754;
}

.dose-overdue {
  border-color: #dc3545;
  background-color: #fef5f6;
}

.dose-overdue .dose-number-small {
  color: #dc3545;
}

.dose-pending {
  border-color: #0d6efd;
  background-color: #f0f5ff;
}

.dose-pending .dose-number-small {
  color: #0d6efd;
}

.badge-sm {
  font-size: 0.7rem;
  padding: 2px 6px;
}

/* Dose row styling with edge-to-edge dividers */
.dose-row-cell {
  position: relative;
}

.dose-row-cell.border-bottom {
  border-bottom: 1px solid #dee2e6;
}
</style>
