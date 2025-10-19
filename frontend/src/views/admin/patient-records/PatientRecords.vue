<template>
  <AdminLayout>
    <div class="container-fluid">
      <ToastContainer />
      <AppPageHeader 
        title="Patient Records" 
        subtitle="Manage patient information and vaccination history"
      >
        <template #actions>
          <router-link to="/admin/patients/add" class="btn btn-primary">
            <i class="bi bi-plus-circle me-2"></i>Add New Patient
          </router-link>
          <AppButton variant="outline-primary" icon="bi-file-medical" class="ms-2" @click="() => openAddRecord()">
            Add Patient Record
          </AppButton>
        </template>
      </AppPageHeader>

      <!-- Search & Filter -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Search patients..."
                  v-model="searchQuery"
                  @input="debouncedSearch"
                >
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="selectedStatus" @change="applyFilters">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="due">Vaccination Due</option>
                <option value="completed">Up to Date</option>
                <option value="fic">FIC (Fully Immunized Child)</option>
                <option value="cic">CIC (Completely Immunized Child)</option>
                <option value="defaulter">Defaulter</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="selectedGender" @change="applyFilters">
                <option value="">All Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-secondary w-100" @click="resetFilters">
                <i class="bi bi-arrow-clockwise"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading patients...</span>
        </div>
      </div>

      <!-- Patient List -->
      <div v-if="!loading" class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 fw-bold text-primary">Patient List</h6>
          <div class="d-flex align-items-center gap-2">
            <small class="text-muted">
              {{ totalItems }} total patients
              <span v-if="totalPages > 1">
                (Page {{ currentPage }} of {{ totalPages }})
              </span>
            </small>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" @click="exportData" title="Export">
                <i class="bi bi-download"></i>
              </button>
              <button class="btn btn-outline-primary" @click="printData" title="Print">
                <i class="bi bi-printer"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Patient ID</th>
                  <th>Child Name</th>
                  <th>Sex</th>
                  <th>Birth Date</th>
                  <th>Age</th>
                  <th>Mother</th>
                  <th>Contact</th>
                  <th>Last Vaccination</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="patient in patients" :key="patient.id">
                  <td class="fw-semibold text-primary">{{ patient.id }}</td>
                  <td class="fw-semibold">{{ patient.childInfo.name }}</td>
                  <td>{{ patient.childInfo.sex }}</td>
                  <td>{{ formatDate(patient.childInfo.birthDate) }}</td>
                  <td>{{ calculateAge(patient.childInfo.birthDate) }}</td>
                  <td>{{ patient.motherInfo.name }}</td>
                  <td>
                    <span v-if="patient.guardian_contact_number || patient.childInfo.phoneNumber">
                      <i class="bi bi-telephone me-1"></i>{{ patient.guardian_contact_number || patient.childInfo.phoneNumber }}
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td>
                    <span v-if="patient.lastVaccination" class="text-muted">
                      {{ formatDate(patient.lastVaccination) }}
                    </span>
                    <span v-else class="text-warning">No records</span>
                  </td>
                  <td>
                    <div class="d-flex gap-2">
                      <router-link 
                        :to="`/admin/patients/view/${patient.id}`"
                        class="btn btn-sm btn-primary"
                      >
                        <i class="bi bi-eye me-1"></i>View
                      </router-link>
                      <button 
                        class="btn btn-sm btn-danger" 
                        @click="deletePatient(patient)"
                      >
                        <i class="bi bi-trash me-1"></i>Delete
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="patients.length === 0">
                  <td colspan="9" class="text-center text-muted py-4">
                    No patients found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Pagination -->
        <div class="card-footer" v-if="totalPages > 1">
          <AppPagination
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-items="totalItems"
            :items-per-page="itemsPerPage"
            @page-changed="changePage"
          />
        </div>
      </div>

  <!-- Navigation: View patient and Add record actions now open pages -->

  <!-- Page-only flow: no modals -->
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppPagination from '@/components/common/AppPagination.vue'
// Page-only flow: remove modal components
// AdminAddRecordModal is now used as a standalone page via route '/admin/patients/add-record'
import api from '@/services/api'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const { addToast } = useToast()
const { confirm } = useConfirm()

const router = useRouter()

// Reactive data
const loading = ref(true)
const patients = ref([])
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedGender = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(5) // Set to 5 items per page as requested
const totalItems = ref(0)
const totalPages = ref(0)

// Methods
const fetchPatients = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value
    }
    
    if (searchQuery.value) params.search = searchQuery.value
    if (selectedStatus.value) params.status = selectedStatus.value
    if (selectedGender.value) {
      // Send both gender and sex to handle API variants
      params.gender = selectedGender.value
      params.sex = selectedGender.value
    }

    const response = await api.get('/patients', { params })
    const payload = response.data?.data || {}
    const list = payload.patients || payload.items || payload || []

    patients.value = list.map(p => ({
      id: p.patient_id || p.id,
      childInfo: {
        name: [p.firstname, p.middlename, p.surname].filter(Boolean).join(' ').trim(),
        sex: p.sex || p.gender || '',
        birthDate: p.date_of_birth || p.birth_date || '',
        phoneNumber: p.contact_number || '',
        address: {
          street: p.address || '',
          barangay: p.barangay || '',
          municipality: p.municipality || '',
          province: p.province || '',
          zipCode: p.zip_code || ''
        }
      },
      motherInfo: {
        name: p.mother_name || '',
      },
      guardian_contact_number: p.guardian_contact_number || p.guardian?.contact_number || '',
      family_number: p.guardian_family_number || p.family_number || '',
      lastVaccination: p.last_vaccination_date || null
    }))

  // Prefer server-provided totalCount/totalPages. Only fallback to local count as last resort.
  const totalCount = (payload && (payload.totalCount ?? response.data?.total)) ?? patients.value.length
  totalItems.value = Number(totalCount)
  totalPages.value = Math.ceil((Number(totalCount) || 0) / Number(itemsPerPage.value))

  } catch (error) {
    console.error('Error fetching patients:', error)
    patients.value = []
    totalItems.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
}

const calculateAge = (birthDate) => {
  if (!birthDate) return '—'
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return '—'
  const today = new Date()
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  let days = today.getDate() - birth.getDate()
  if (days < 0) {
    months -= 1
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) months = 0
  if (days < 0) days = 0
  // Show years if 36 months or more
  if (months >= 36) {
    const years = Math.floor(months / 12)
    const remMonths = months % 12
    return remMonths > 0 ? `${years}y ${remMonths}m` : `${years}y`
  }
  return `${months}m ${days}d`
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Manila'
    })
  } catch {
    return new Date(dateString).toLocaleDateString()
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page
    fetchPatients()
  }
}

const applyFilters = () => {
  currentPage.value = 1
  fetchPatients()
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = ''
  selectedGender.value = ''
  currentPage.value = 1
  fetchPatients()
}

// Debounced search
let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchPatients()
  }, 500)
}

const viewPatient = (patient) => {
  router.push({ name: 'ViewPatient', params: { id: patient.id } })
}

const editVaccinations = (patient) => {
  // Navigate to the vaccination editor page for the selected patient
  router.push({ name: 'PatientVaccinations', params: { id: patient.id }, query: { visitContext: false, outside: false } })
}

const openVaccinationFromVisit = (patientId, patientData = null) => {
  // Open vaccination editor page with visit context
  router.push({ name: 'PatientVaccinations', params: { id: patientId }, query: { visitContext: true, outside: false } })
}

// Removed modal handlers; pages handle their own flows

const openAddRecord = (patient = null) => {
  // Navigate to the add-record page and pass patientId as query if provided
  router.push({ name: 'AddPatientRecord', query: { patientId: patient?.id || '' } })
}

const deletePatient = async (patient) => {
  const patientName = patient.childInfo?.name || 'this patient'
  
  try {
    await confirm({
      title: 'Delete Patient Record',
      message: `Are you sure you want to delete the patient record for "${patientName}"?\n\nThis action cannot be undone and will permanently remove all vaccination history and related data.`,
      variant: 'danger',
      confirmText: 'Delete Patient',
      cancelText: 'Cancel'
    })
    
    try {
      const response = await api.delete(`/patients/${patient.id}`)
      
      if (response.data.success) {
        // Show success toast
        addToast({ title: 'Deleted', message: `Patient record for "${patientName}" has been successfully deleted.`, type: 'success' })

        // Refresh the patient list
        await fetchPatients()
        
        // If we're on the last page and it's now empty, go to previous page
        if (patients.value.length === 0 && currentPage.value > 1) {
          currentPage.value = currentPage.value - 1
          await fetchPatients()
        }
      } else {
        throw new Error(response.data.message || 'Failed to delete patient')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while deleting the patient'
      addToast({ title: 'Error', message: `Failed to delete patient: ${errorMessage}`, type: 'error' })
    }
  } catch {
    // User cancelled
  }
}


const exportData = () => {
  console.log('Exporting data...')
  // Implement export functionality
}

const printData = () => {
  window.print()
}


// Lifecycle
onMounted(() => {
  fetchPatients()
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: #f8f9fa;
}

.text-gray-800 {
  color: #5a5c69 !important;
}

.btn-group .btn {
  border-radius: 0.25rem;
  margin-right: 0.125rem;
}

.btn-group .btn:last-child {
  margin-right: 0;
}
</style>
