<template>
  <AdminLayout>
    <div class="container-fluid py-3">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/admin/dashboard">Dashboard</router-link></li>
          <li class="breadcrumb-item"><router-link to="/admin/patients">Patient Records</router-link></li>
          <li class="breadcrumb-item"><router-link :to="`/admin/patients/${patientId}`">Patient Details</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Edit Vaccination Record</li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="d-flex align-items-center mb-4">
        <div>
          <h3 class="mb-1">
            <i class="bi bi-pencil-square me-2"></i>Edit Vaccination Record
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
        <p class="text-muted mt-3">Loading vaccination record...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger">
        <i class="bi bi-exclamation-circle me-2"></i>
        {{ error }}
      </div>

      <!-- Edit Form -->
      <div v-else-if="vaccinationRecord" class="card shadow-sm">
        <div class="card-body p-4">
          <form @submit.prevent="saveVaccinationRecord">
            <div class="row g-3">
              <!-- Vaccine Name -->
              <div class="col-md-6">
                <label class="form-label">Vaccine Name: <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="form.vaccineName"
                  readonly
                  disabled
                >
                <small class="text-muted">Vaccine name cannot be changed</small>
              </div>

              <!-- Dose Number -->
              <div class="col-md-6">
                <label class="form-label">Dose Number: <span class="text-danger">*</span></label>
                <input 
                  type="number" 
                  class="form-control" 
                  v-model="form.doseNumber"
                  min="1"
                  required
                >
              </div>

              <!-- Date Administered -->
              <div class="col-md-6">
                <label class="form-label">Date Administered: <span class="text-danger">*</span></label>
                <DateInput
                  v-model="form.dateAdministered"
                  :required="true"
                  @update:modelValue="calculateAge"
                />
              </div>

              <!-- Age at Administration -->
              <div class="col-md-6">
                <label class="form-label">Age at Administration:</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="form.ageAtAdministration"
                  readonly
                >
                <small class="text-muted">Automatically calculated from date administered</small>
              </div>

              <!-- Administered By -->
              <div class="col-md-6">
                <label class="form-label">Administered By: <span class="text-danger">*</span></label>
                <SearchableSelect
                  v-model="form.administeredBy"
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
                  v-model="form.siteOfAdministration"
                  placeholder="e.g., Left deltoid, Right thigh"
                >
              </div>

              <!-- Facility Name -->
              <div class="col-md-6">
                <label class="form-label">Facility Name:</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="form.facilityName"
                >
              </div>

              <!-- Status -->
              <div class="col-md-6">
                <label class="form-label">Status:</label>
                <select class="form-select" v-model="form.status">
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
                  v-model="form.remarks"
                  rows="3"
                  placeholder="Additional notes or observations"
                ></textarea>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex justify-content-end gap-2 mt-4">
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
                  <i class="bi bi-check-circle me-2"></i>Save Changes
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
const recordId = computed(() => route.params.recordId)

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const patientData = ref(null)
const vaccinationRecord = ref(null)
const healthWorkers = ref([])

const form = ref({
  vaccineName: '',
  doseNumber: '',
  dateAdministered: '',
  ageAtAdministration: '',
  administeredBy: '',
  siteOfAdministration: '',
  facilityName: '',
  status: 'Completed',
  remarks: ''
})

const isFormValid = computed(() => {
  return form.value.vaccineName && 
         form.value.doseNumber && 
         form.value.dateAdministered && 
         form.value.administeredBy
})

const goBack = () => {
  router.push({ 
    name: 'ViewPatient', 
    params: { id: patientId.value },
    hash: '#vaccinations'
  })
}

const calculateAge = () => {
  if (!form.value.dateAdministered || !patientData.value?.date_of_birth) {
    return
  }

  const birthDate = new Date(patientData.value.date_of_birth)
  const adminDate = new Date(form.value.dateAdministered)
  
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

  form.value.ageAtAdministration = parts.join(', ') || '0 days'
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

const fetchVaccinationRecord = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch patient data first
    await fetchPatientData()
    await fetchHealthWorkers()

    // Fetch the specific vaccination record
    const response = await api.get(`/immunizations/${recordId.value}`)
    const record = response.data.data || response.data

    vaccinationRecord.value = record

    // Populate form with existing data
    form.value = {
      vaccineName: record.vaccine_antigen_name || record.vaccineName || record.antigen_name || '',
      doseNumber: record.dose_number || record.doseNumber || record.dose || '',
      dateAdministered: formatDateForInput(record.administered_date || record.date_administered || record.dateAdministered),
      ageAtAdministration: record.age_at_administration || record.ageAtAdministration || '',
      administeredBy: record.administered_by || record.administered_by_id || record.healthWorkerId || '',
      siteOfAdministration: deriveSite(record),
      facilityName: deriveFacility(record),
      status: record.status || 'Completed',
      remarks: record.remarks || record.notes || ''
    }

    // Calculate age if not already set
    if (!form.value.ageAtAdministration) {
      calculateAge()
    }

  } catch (err) {
    console.error('Error fetching vaccination record:', err)
    error.value = 'Failed to load vaccination record. Please try again.'
    addToast({
      title: 'Error',
      message: error.value,
      type: 'error'
    })
  } finally {
    loading.value = false
  }
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

const saveVaccinationRecord = async () => {
  try {
    saving.value = true

    // Prepare remarks - keep site info in remarks if present
    const remarksWithSite = form.value.siteOfAdministration 
      ? `${form.value.remarks || ''} (Site: ${form.value.siteOfAdministration})`.trim()
      : form.value.remarks || ''

    // Prepare the updated data
    const updateData = {
      administered_date: formatDateForAPI(form.value.dateAdministered),
      dose_number: parseInt(form.value.doseNumber),
      site_of_administration: form.value.siteOfAdministration || null,
      administered_by: form.value.administeredBy,
      facility_name: form.value.facilityName || null,
      remarks: remarksWithSite
    }

    console.log('Updating immunization:', recordId.value, updateData)

    // Update the vaccination record
    await api.put(`/immunizations/${recordId.value}`, updateData)

    addToast({
      title: 'Success',
      message: 'Vaccination record updated successfully',
      type: 'success'
    })

    // Navigate back to patient details
    goBack()

  } catch (err) {
    console.error('Error saving vaccination record:', err)
    const errorMessage = err.response?.data?.message || 'Failed to update vaccination record. Please try again.'
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
  fetchVaccinationRecord()
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
</style>
