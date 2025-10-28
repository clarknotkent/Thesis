<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/admin/dashboard">Dashboard</router-link></li>
          <li class="breadcrumb-item"><router-link to="/admin/patients">Patient Records</router-link></li>
          <li class="breadcrumb-item"><router-link :to="`/admin/patients/view/${patientId}`">Patient Details</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Vaccine Details</li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">
            <i class="bi bi-shield-check me-2"></i>{{ vaccineName }}
          </h2>
          <p class="text-muted mb-0">Detailed vaccination records for {{ patientName }}</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="goBack">
            <i class="bi bi-arrow-left me-2"></i>Back
          </button>
          <router-link to="/admin/dashboard" class="btn btn-outline-primary">
            <i class="bi bi-house me-2"></i>Home
          </router-link>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading vaccine details...</span>
        </div>
        <p class="text-muted mt-2">Loading vaccine details...</p>
      </div>

      <!-- Vaccine Details Card -->
      <div v-else class="card shadow">
        <div class="card-header py-3 bg-primary text-white">
          <h5 class="m-0 fw-bold">
            <i class="bi bi-clipboard-data me-2"></i>{{ vaccineName }} - Vaccination Records
          </h5>
        </div>
        <div class="card-body p-4">
          <!-- Summary Info -->
          <div class="row mb-4">
            <div class="col-md-6">
              <div class="info-box">
                <label class="text-muted small">Disease Prevented</label>
                <p class="fw-bold mb-0">{{ diseasePrevented }}</p>
              </div>
            </div>
            <div class="col-md-6">
              <div class="info-box">
                <label class="text-muted small">Total Doses Administered</label>
                <p class="fw-bold mb-0">{{ doses.length }}</p>
              </div>
            </div>
          </div>

          <!-- Doses Table -->
          <div class="table-responsive">
            <table class="table table-bordered table-hover">
              <thead class="table-light">
                <tr>
                  <th style="width: 8%;">Dose</th>
                  <th style="width: 12%;">Date Administered<br><small class="text-muted">MM/DD/YYYY</small></th>
                  <th style="width: 10%;">Age at Administration</th>
                  <th style="width: 12%;">Batch Number</th>
                  <th style="width: 13%;">Administered By</th>
                  <th style="width: 10%;">Site</th>
                  <th style="width: 12%;">Facility</th>
                  <th style="width: 8%;">Status</th>
                  <th style="width: 15%;">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(dose, index) in sortedDoses" :key="index">
                  <td class="text-center">
                    <span class="badge bg-secondary">Dose {{ dose.doseNumber }}</span>
                  </td>
                  <td>{{ formatShortDate(dose.administeredDate) }}</td>
                  <td>{{ dose.ageAtAdministration }}</td>
                  <td>
                    <span class="badge bg-info text-dark">{{ dose.batchNumber }}</span>
                  </td>
                  <td>{{ dose.administeredBy }}</td>
                  <td>{{ dose.site }}</td>
                  <td>{{ dose.facility }}</td>
                  <td>
                    <span :class="['badge', getStatusBadgeClass(dose.status)]">
                      {{ dose.status }}
                    </span>
                  </td>
                  <td>
                    <small>{{ dose.remarks }}</small>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-if="doses.length === 0" class="text-center py-5">
            <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
            <p class="text-muted mt-3">No vaccination records found for this vaccine</p>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { addToast } = useToast()

const patientId = ref(route.params.patientId)
const vaccineName = ref(route.query.vaccine || 'Vaccine')
const patientName = ref('')
const diseasePrevented = ref('—')
const doses = ref([])
const loading = ref(true)

const sortedDoses = computed(() => {
  return [...doses.value].sort((a, b) => {
    const doseA = typeof a.doseNumber === 'number' ? a.doseNumber : parseInt(a.doseNumber) || 0
    const doseB = typeof b.doseNumber === 'number' ? b.doseNumber : parseInt(b.doseNumber) || 0
    return doseA - doseB
  })
})

const goBack = () => {
  router.back()
}

const formatShortDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

const getStatusBadgeClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'completed' || s === 'administered') return 'bg-success'
  if (s === 'scheduled' || s === 'pending') return 'bg-warning'
  if (s === 'missed' || s === 'overdue') return 'bg-danger'
  return 'bg-secondary'
}

const deriveSite = (v) => {
  const remarks = v?.remarks || v?.notes || ''
  if (remarks) {
    const m = remarks.match(/(?:site|injection site)\s*[:\-]\s*([^;,.\n]+)/i)
    if (m && m[1]) return m[1].trim()
    if (/deltoid|thigh|vastus|buttock|arm|left|right|intramuscular|subcutaneous/i.test(remarks)) return remarks
  }
  return v?.site || v?.site_of_administration || v?.siteOfAdministration || '—'
}

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

const fetchVaccineDetails = async () => {
  try {
    loading.value = true
    
    // Fetch patient data
    const response = await api.get(`/patients/${patientId.value}`)
    const patientData = response.data.data || response.data
    
    // Set patient name
    patientName.value = `${patientData.firstname || ''} ${patientData.middlename || ''} ${patientData.surname || ''}`.trim()
    
    // Extract vaccination history
    let vax = patientData.vaccinationHistory || patientData.vaccination_history || patientData.immunizations || patientData.immunizationHistory || []

    // Fallback to dedicated endpoint if needed
    if (!Array.isArray(vax) || vax.length === 0) {
      try {
        const vaccRes = await api.get('/immunizations', { params: { patient_id: patientId.value, limit: 200 } })
        vax = vaccRes.data?.data || vaccRes.data?.items || vaccRes.data || []
      } catch (e) {
        vax = []
      }
    }

    // Filter for the specific vaccine
    const filteredVaccinations = Array.isArray(vax) ? vax.filter(v => {
      const vName = v.vaccine_antigen_name || v.vaccineName || v.antigen_name || v.antigenName || ''
      return vName === vaccineName.value
    }) : []

    // Fetch inventory data to get batch numbers
    let inventoryMap = {}
    try {
      const inventoryResponse = await api.get('/vaccines/inventory')
      const inventoryItems = inventoryResponse.data?.data || inventoryResponse.data || []
      
      // Create a map of inventory_id to batch/lot number
      if (Array.isArray(inventoryItems)) {
        inventoryItems.forEach(item => {
          const id = item.inventory_id || item.id
          const batchNo = item.lot_number || item.batch_number || item.lotNumber || item.batchNumber
          if (id && batchNo) {
            inventoryMap[id] = batchNo
          }
        })
      }
    } catch (e) {
      console.error('Error fetching inventory for batch numbers:', e)
    }

    // Process doses
    doses.value = filteredVaccinations.map(vaccination => {
      if (!diseasePrevented.value || diseasePrevented.value === '—') {
        diseasePrevented.value = vaccination.disease_prevented || '—'
      }
      
      // Get batch number from inventory using inventory_id
      const inventoryId = vaccination.inventory_id || vaccination.inventoryId
      let batchNumber = '—'
      
      if (inventoryId && inventoryMap[inventoryId]) {
        batchNumber = inventoryMap[inventoryId]
      } else {
        // Fallback to direct batch number field if available
        batchNumber = vaccination.batch_number || vaccination.batchNumber || vaccination.lot_number || vaccination.lotNumber || '—'
      }
      
      return {
        doseNumber: vaccination.dose_number || vaccination.doseNumber || vaccination.dose || '—',
        administeredDate: vaccination.administered_date || vaccination.date_administered || vaccination.dateAdministered,
        ageAtAdministration: vaccination.age_at_administration || vaccination.ageAtAdministration || '—',
        batchNumber: batchNumber,
        administeredBy: vaccination.administered_by_name || vaccination.administeredBy || vaccination.health_worker_name || 'Taken Outside',
        site: deriveSite(vaccination),
        facility: deriveFacility(vaccination),
        status: vaccination.status || 'Completed',
        remarks: vaccination.remarks || vaccination.notes || '—'
      }
    })

  } catch (error) {
    console.error('Error fetching vaccine details:', error)
    addToast({
      title: 'Error',
      message: 'Failed to load vaccine details',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchVaccineDetails()
})
</script>

<style scoped>
.info-box {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #0d6efd;
}

.table {
  font-size: 0.9rem;
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
  vertical-align: middle;
  border: 1px solid #dee2e6;
}

.table tbody tr:hover {
  background-color: rgba(13, 110, 253, 0.05);
}
</style>
