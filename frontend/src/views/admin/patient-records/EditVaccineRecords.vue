<template>
  <AdminLayout>
    <div class="container-fluid py-3">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/admin/dashboard">Dashboard</router-link></li>
          <li class="breadcrumb-item"><router-link to="/admin/patients">Patient Records</router-link></li>
          <li class="breadcrumb-item"><router-link :to="`/admin/patients/${patientId}`">Patient Details</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Edit Vaccination Records</li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="d-flex align-items-center mb-4">
        <div>
          <h3 class="mb-1">
            <i class="bi bi-pencil-square me-2"></i>{{ vaccineName }} - Vaccination Records
          </h3>
          <p class="text-muted mb-0" v-if="patientData">
            Patient: <strong>{{ patientData.firstname }} {{ patientData.surname }}</strong>
          </p>
        </div>
        <button class="btn btn-outline-secondary ms-auto" @click="goBack">
          <i class="bi bi-arrow-left me-2"></i>Back
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted mt-3">Loading vaccination records...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger">
        <i class="bi bi-exclamation-circle me-2"></i>
        {{ error }}
      </div>

      <!-- Edit Form -->
      <div v-else class="card shadow-sm">
        <div class="card-body p-4">
          <!-- Vaccine Info Card -->
          <div class="alert alert-info mb-4">
            <div class="row">
              <div class="col-md-6">
                <strong>Disease Prevented:</strong> {{ diseasePrevented }}
              </div>
              <div class="col-md-6">
                <strong>Total Doses Administered:</strong> {{ doseRecords.length }}
              </div>
            </div>
          </div>

          <!-- Dose Records -->
          <form @submit.prevent="saveAllRecords">
            <div v-for="(dose, index) in doseRecords" :key="dose.id" class="dose-card mb-4">
              <div class="dose-header">
                <span class="badge bg-primary">Dose {{ dose.doseNumber }}</span>
              </div>
              
              <div class="row g-3 mt-2">
                <!-- Date Administered -->
                <div class="col-md-6">
                  <label class="form-label">Date Administered: <span class="text-danger">*</span></label>
                  <DateInput
                    v-model="dose.dateAdministered"
                    :required="true"
                    @update:modelValue="calculateAge(index)"
                  />
                </div>

                <!-- Age at Administration -->
                <div class="col-md-6">
                  <label class="form-label">Age at Administration:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="dose.ageAtAdministration"
                    readonly
                  >
                  <small class="text-muted">Automatically calculated</small>
                </div>

                <!-- Administered By -->
                <div class="col-md-6">
                  <label class="form-label">Administered By: <span class="text-danger">*</span></label>
                  <SearchableSelect
                    v-model="dose.administeredBy"
                    :options="healthWorkers"
                    placeholder="Select health worker"
                    label-key="name"
                    value-key="user_id"
                    :required="true"
                  />
                </div>

                <!-- Site of Administration -->
                <div class="col-md-6">
                  <label class="form-label">Site of Administration:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="dose.siteOfAdministration"
                    placeholder="e.g., Left deltoid, Right thigh"
                  >
                </div>

                <!-- Facility Name -->
                <div class="col-md-6">
                  <label class="form-label">Facility Name:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="dose.facilityName"
                  >
                </div>

                <!-- Status -->
                <div class="col-md-6">
                  <label class="form-label">Status:</label>
                  <select class="form-select" v-model="dose.status">
                    <option value="Completed">Completed</option>
                    <option value="Administered">Administered</option>
                    <option value="Pending">Pending</option>
                    <option value="Missed">Missed</option>
                  </select>
                </div>

                <!-- Remarks -->
                <div class="col-12">
                  <label class="form-label">Remarks:</label>
                  <textarea 
                    class="form-control" 
                    v-model="dose.remarks"
                    rows="2"
                    placeholder="Additional notes or observations"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button 
                type="button" 
                class="btn btn-outline-secondary"
                @click="goBack"
                :disabled="saving"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="saving || !isFormValid"
              >
                <span v-if="saving">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving...
                </span>
                <span v-else>
                  <i class="bi bi-check-circle me-2"></i>Save All Changes
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import DateInput from '@/components/common/DateInput.vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const patientId = computed(() => route.params.patientId)
const vaccineName = computed(() => route.query.vaccine || 'Vaccine')

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const patientData = ref(null)
const healthWorkers = ref([])
const doseRecords = ref([])
const diseasePrevented = ref('—')

const isFormValid = computed(() => {
  return doseRecords.value.every(dose => 
    dose.dateAdministered && 
    dose.administeredBy
  )
})

const goBack = () => {
  router.push({ 
    name: 'ViewPatient', 
    params: { id: patientId.value },
    hash: '#vaccinations'
  })
}

const calculateAge = (index) => {
  const dose = doseRecords.value[index]
  if (!dose.dateAdministered || !patientData.value?.date_of_birth) {
    return
  }

  const birthDate = new Date(patientData.value.date_of_birth)
  const adminDate = new Date(dose.dateAdministered)
  
  let years = adminDate.getFullYear() - birthDate.getFullYear()
  let months = adminDate.getMonth() - birthDate.getMonth()
  let days = adminDate.getDate() - birthDate.getDate()

  if (days < 0) {
    months--
    const prevMonth = new Date(adminDate.getFullYear(), adminDate.getMonth(), 0)
    days += prevMonth.getDate()
  }

  if (months < 0) {
    years--
    months += 12
  }

  const parts = []
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`)
  if (days > 0 && years === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)

  dose.ageAtAdministration = parts.join(', ') || '0 days'
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}/${year}`
  } catch (e) {
    return ''
  }
}

const formatDateForAPI = (dateString) => {
  if (!dateString) return ''
  try {
    // DateInput outputs MM/DD/YYYY, convert to YYYY-MM-DD for API
    const parts = dateString.split('/')
    if (parts.length === 3) {
      const [month, day, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    // If already in another format, try to parse it
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    return dateString
  }
}

const deriveSite = (record) => {
  const remarks = record?.remarks || record?.notes || ''
  if (remarks) {
    const match = remarks.match(/(?:site|injection site)\s*[:\-]\s*([^;,.\n]+)/i)
    if (match && match[1]) return match[1].trim()
    if (/deltoid|thigh|vastus|buttock|arm|left|right|intramuscular|subcutaneous/i.test(remarks)) {
      return remarks
    }
  }
  return record?.site || record?.site_of_administration || record?.siteOfAdministration || ''
}

const deriveFacility = (record) => {
  const isOutside = !!(record?.immunization_outside || record?.is_outside || record?.isOutside || record?.outside_immunization)
  if (isOutside) return 'Outside'
  return (
    record?.immunization_facility_name ||
    record?.facility_name ||
    record?.facilityName ||
    record?.health_center ||
    record?.healthCenter ||
    ''
  )
}

const fetchPatientData = async () => {
  try {
    const response = await api.get(`/patients/${patientId.value}`)
    patientData.value = response.data.data || response.data
  } catch (err) {
    console.error('Error fetching patient data:', err)
  }
}

const fetchHealthWorkers = async () => {
  try {
    const response = await api.get('/users', { params: { role: 'health_worker' } })
    const data = response.data.data || response.data.users || response.data || []
    healthWorkers.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error fetching health workers:', err)
    healthWorkers.value = []
  }
}

const fetchVaccinationRecords = async () => {
  try {
    loading.value = true
    error.value = null

    await fetchPatientData()
    await fetchHealthWorkers()

    // Fetch patient's vaccination history
    const response = await api.get(`/patients/${patientId.value}`)
    const patient = response.data.data || response.data
    
    let vaccinations = patient.vaccinationHistory || patient.vaccination_history || patient.immunizations || []

    // If not in patient payload, fetch from immunizations endpoint
    if (!Array.isArray(vaccinations) || vaccinations.length === 0) {
      try {
        const vaccRes = await api.get('/immunizations', { params: { patient_id: patientId.value, limit: 200 } })
        vaccinations = vaccRes.data?.data || vaccRes.data?.items || vaccRes.data || []
      } catch (e) {
        vaccinations = []
      }
    }

    // Filter vaccinations by vaccine name
    const filteredVaccinations = vaccinations.filter(v => {
      const vName = v.vaccine_antigen_name || v.vaccineName || v.antigen_name || v.antigenName || ''
      return vName === vaccineName.value
    })

    if (filteredVaccinations.length === 0) {
      error.value = 'No vaccination records found for this vaccine'
      return
    }

    // Set disease prevented from first record
    diseasePrevented.value = filteredVaccinations[0].disease_prevented || '—'

    // Sort by dose number
    filteredVaccinations.sort((a, b) => {
      const doseA = typeof a.dose_number === 'number' ? a.dose_number : parseInt(a.dose_number || a.doseNumber || a.dose) || 0
      const doseB = typeof b.dose_number === 'number' ? b.dose_number : parseInt(b.dose_number || b.doseNumber || b.dose) || 0
      return doseA - doseB
    })

    // Map to editable records
    doseRecords.value = filteredVaccinations.map(record => ({
      id: record.immunization_id || record.id,
      doseNumber: record.dose_number || record.doseNumber || record.dose || '',
      dateAdministered: formatDateForInput(record.administered_date || record.date_administered || record.dateAdministered),
      ageAtAdministration: record.age_at_administration || record.ageAtAdministration || '',
      administeredBy: record.administered_by || record.administered_by_id || record.healthWorkerId || '',
      siteOfAdministration: deriveSite(record),
      facilityName: deriveFacility(record),
      status: record.status || 'Completed',
      remarks: record.remarks || record.notes || ''
    }))

    // Calculate ages if not set
    doseRecords.value.forEach((dose, index) => {
      if (!dose.ageAtAdministration) {
        calculateAge(index)
      }
    })

  } catch (err) {
    console.error('Error fetching vaccination records:', err)
    error.value = 'Failed to load vaccination records. Please try again.'
    addToast({
      title: 'Error',
      message: error.value,
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const saveAllRecords = async () => {
  try {
    saving.value = true

    // Update each dose record
    const updatePromises = doseRecords.value.map(async (dose) => {
      // Prepare remarks - keep site info in remarks if present
      const remarksWithSite = dose.siteOfAdministration 
        ? `${dose.remarks || ''} (Site: ${dose.siteOfAdministration})`.trim()
        : dose.remarks || ''

      const updateData = {
        administered_date: formatDateForAPI(dose.dateAdministered),
        dose_number: parseInt(dose.doseNumber),
        site_of_administration: dose.siteOfAdministration || null,
        administered_by: dose.administeredBy,
        facility_name: dose.facilityName || null,
        remarks: remarksWithSite
      }

      // Only include status if it's a valid value
      if (dose.status) {
        updateData.status = dose.status
      }

      console.log('Updating immunization:', dose.id, updateData)
      return api.put(`/immunizations/${dose.id}`, updateData)
    })

    await Promise.all(updatePromises)

    addToast({
      title: 'Success',
      message: `All ${doseRecords.value.length} vaccination record(s) updated successfully`,
      type: 'success'
    })

    // Navigate back to patient details
    goBack()

  } catch (err) {
    console.error('Error saving vaccination records:', err)
    const errorMessage = err.response?.data?.message || 'Failed to update vaccination records. Please try again.'
    addToast({
      title: 'Error',
      message: errorMessage,
      type: 'error'
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchVaccinationRecords()
})
</script>

<style scoped>
.card {
  border: none;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.text-danger {
  color: #dc3545;
}

.dose-card {
  background-color: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.dose-card:hover {
  border-color: #0d6efd;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.15);
}

.dose-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #dee2e6;
}

.dose-header .badge {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}
</style>
