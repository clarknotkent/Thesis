<template>
  <HealthWorkerLayout>
    <AppPageHeader
      title="Patient Records"
      subtitle="Search and manage patient information"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <AppButton
          variant="primary"
          @click="showAddModal = true"
          icon="bi bi-plus-circle"
        >
          New Patient
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Search Section -->
    <AppCard class="hw-search-section mb-4">
      <div class="d-flex align-items-center gap-2">
        <div class="flex-grow-1">
          <div class="input-group">
            <span class="input-group-text">
              <i class="bi bi-search"></i>
            </span>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search by child name, ID, or parent details..."
              v-model="searchQuery"
              @input="debouncedSearch"
            >
          </div>
        </div>
        <select class="form-select" style="max-width: 150px;" v-model="selectedStatus" @change="applyFilters">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <AppButton
          variant="info"
          icon="bi bi-qr-code-scan"
          @click="openQrScanner"
        >
          Scan QR
        </AppButton>
      </div>
    </AppCard>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading patients...</span>
      </div>
    </div>

    <!-- Patient List -->
    <div v-else class="row g-3">
      <div class="col-lg-6" v-for="patient in patients" :key="patient.id">
        <AppCard class="hw-patient-card h-100">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="card-title mb-1 fw-bold">
                {{ patient.childInfo.name }}
                <span class="badge bg-info ms-2">Child</span>
              </h5>
              <p class="text-muted mb-0">ID: {{ patient.id }}</p>
            </div>
            <span :class="getStatusBadgeClass(getPatientStatus(patient))">
              {{ getPatientStatus(patient) }}
            </span>
          </div>
          
          <div class="row g-2 mb-3">
            <div class="col-6">
              <small class="text-muted">Age:</small>
              <div class="fw-semibold">{{ calculateAge(patient.childInfo.birthDate) }}</div>
            </div>
            <div class="col-6">
              <small class="text-muted">Sex:</small>
              <div class="fw-semibold">{{ patient.childInfo.sex }}</div>
            </div>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <small class="text-muted">Parent:</small>
              <div class="fw-semibold">{{ patient.motherInfo.name }}</div>
            </div>
            <div class="col-6">
              <small class="text-muted">Contact:</small>
              <div class="fw-semibold">{{ patient.childInfo.phoneNumber }}</div>
            </div>
          </div>

          <div class="mb-3">
            <small class="text-muted">Last Vaccine:</small>
            <div class="fw-semibold">{{ getLastVaccination(patient) }}</div>
          </div>

          <div class="d-grid gap-2 d-md-flex">
            <AppButton
              variant="primary"
              @click="viewPatient(patient)"
              icon="bi bi-eye"
              class="flex-fill"
            >
              View Details
            </AppButton>
            <AppButton
              variant="success"
              @click="editPatient(patient)"
              icon="bi bi-pencil"
              class="flex-fill"
            >
              Edit
            </AppButton>
            <AppButton
              variant="outline-danger"
              @click="deletePatient(patient)"
              icon="bi bi-trash"
              class="flex-fill"
            >
              Delete
            </AppButton>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && patients.length === 0" class="text-center py-5">
      <i class="bi bi-person-x text-muted mb-3" style="font-size: 4rem;"></i>
      <h4 class="text-muted">No patients found</h4>
      <p class="text-muted">Try adjusting your search criteria or add a new patient.</p>
      <AppButton
        variant="primary"
        size="lg"
        @click="showAddModal = true"
        icon="bi bi-plus-circle"
        class="btn-hw-primary"
      >
        Add New Patient
      </AppButton>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="d-flex justify-content-center mt-4">
      <AppPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :items-per-page="itemsPerPage"
        @page-change="changePage"
      />
    </div>

    <!-- Patient Detail Modal -->
    <PatientDetailModal
      :show="showViewModal"
      :patient-id="selectedPatientId"
      @close="showViewModal = false"
    />

    <!-- Add/Edit Patient Modal -->
    <div class="modal fade" :class="{ show: showAddModal || showEditModal }" :style="{ display: (showAddModal || showEditModal) ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ showEditModal ? 'Edit Patient' : 'Add New Patient' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="savePatient">
              <!-- Child Information -->
              <h6 class="text-primary mb-3">Child Information</h6>
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label for="childName" class="form-label">Full Name *</label>
                  <input type="text" class="form-control" id="childName" v-model="form.childInfo.name" required>
                </div>
                <div class="col-md-6">
                  <label for="childSex" class="form-label">Sex *</label>
                  <select class="form-select" id="childSex" v-model="form.childInfo.sex" required>
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label for="birthDate" class="form-label">Birth Date *</label>
                  <input type="date" class="form-control" id="birthDate" v-model="form.childInfo.birthDate" required>
                </div>
                <div class="col-md-6">
                  <label for="phoneNumber" class="form-label">Contact Number *</label>
                  <input type="tel" class="form-control" id="phoneNumber" v-model="form.childInfo.phoneNumber" required>
                </div>
                <div class="col-12">
                  <label for="address" class="form-label">Address *</label>
                  <textarea class="form-control" id="address" rows="2" v-model="addressString" required></textarea>
                </div>
              </div>

              <!-- Mother Information -->
              <h6 class="text-primary mb-3">Mother's Information</h6>
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label for="motherName" class="form-label">Full Name *</label>
                  <input type="text" class="form-control" id="motherName" v-model="form.motherInfo.name" required>
                </div>
                <div class="col-md-6">
                  <label for="motherAge" class="form-label">Age</label>
                  <input type="number" class="form-control" id="motherAge" v-model="form.motherInfo.age" min="15" max="60">
                </div>
                <div class="col-md-6">
                  <label for="motherEducation" class="form-label">Education Level</label>
                  <select class="form-select" id="motherEducation" v-model="form.motherInfo.educationLevel">
                    <option value="">Select Education Level</option>
                    <option value="Elementary Graduate">Elementary Graduate</option>
                    <option value="High School Graduate">High School Graduate</option>
                    <option value="College Graduate">College Graduate</option>
                    <option value="Vocational Graduate">Vocational Graduate</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label for="motherOccupation" class="form-label">Occupation</label>
                  <input type="text" class="form-control" id="motherOccupation" v-model="form.motherInfo.occupation">
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                  {{ showEditModal ? 'Update' : 'Add' }} Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div v-if="showAddModal || showEditModal || showViewModal" class="modal-backdrop fade show"></div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import PatientDetailModal from '@/components/common/PatientDetailModal.vue'
import api from '@/services/api'

// Reactive data
const loading = ref(true)
const saving = ref(false)
const patients = ref([])
const searchQuery = ref('')
const selectedStatus = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const selectedPatientId = ref(null)

// Form data
const form = ref({
  id: null,
  childInfo: {
    name: '',
    sex: '',
    birthDate: '',
    phoneNumber: '',
    address: {
      street: '',
      barangay: '',
      municipality: '',
      province: '',
      zipCode: ''
    }
  },
  motherInfo: {
    name: '',
    age: null,
    educationLevel: '',
    occupation: ''
  },
  fatherInfo: {
    name: '',
    age: null,
    educationLevel: '',
    occupation: ''
  }
})

const addressString = computed({
  get() {
    const addr = form.value.childInfo.address
    if (!addr.street && !addr.barangay && !addr.municipality) return ''
    return `${addr.street}, ${addr.barangay}, ${addr.municipality}, ${addr.province} ${addr.zipCode}`.trim()
  },
  set(value) {
    const parts = value.split(',').map(p => p.trim())
    form.value.childInfo.address = {
      street: parts[0] || '',
      barangay: parts[1] || '',
      municipality: parts[2] || '',
      province: parts[3] || '',
      zipCode: parts[4] || ''
    }
  }
})

const breadcrumbs = [
  { text: 'Health Worker', href: '/healthworker/dashboard' },
  { text: 'Patient Records', active: true }
]

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

    const response = await api.get('/patients', { params })
    patients.value = response.data.data || []

    if (response.data.pagination) {
      totalItems.value = response.data.pagination.totalItems
      totalPages.value = response.data.pagination.totalPages
    } else {
      totalItems.value = patients.value.length
      totalPages.value = Math.ceil(totalItems.value / itemsPerPage.value)
    }

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
  const birth = new Date(birthDate)
  const today = new Date()
  const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  
  if (ageInMonths < 12) {
    return `${ageInMonths} months`
  } else {
    const years = Math.floor(ageInMonths / 12)
    const months = ageInMonths % 12
    return months > 0 ? `${years}y ${months}m` : `${years} years`
  }
}

const getPatientStatus = (patient) => {
  // Determine status based on vaccination history
  if (!patient.vaccinationHistory || patient.vaccinationHistory.length === 0) {
    return 'pending'
  }
  
  // Check if patient has recent vaccinations
  const lastVaccination = patient.vaccinationHistory[patient.vaccinationHistory.length - 1]
  const lastVaccinationDate = new Date(lastVaccination.dateAdministered)
  const now = new Date()
  const daysSinceLastVaccination = (now - lastVaccinationDate) / (1000 * 60 * 60 * 24)
  
  if (daysSinceLastVaccination <= 30) {
    return 'active'
  } else if (daysSinceLastVaccination <= 90) {
    return 'completed'
  }
  
  return 'pending'
}

const getLastVaccination = (patient) => {
  if (!patient.vaccinationHistory || patient.vaccinationHistory.length === 0) {
    return 'None'
  }
  
  const lastVaccination = patient.vaccinationHistory[patient.vaccinationHistory.length - 1]
  const date = new Date(lastVaccination.dateAdministered).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  return `${lastVaccination.vaccineName} (${date})`
}

const changePage = (page) => {
  currentPage.value = page
  fetchPatients()
}

const applyFilters = () => {
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
  selectedPatientId.value = patient.id
  showViewModal.value = true
}

const editPatient = (patient) => {
  form.value = { ...patient }
  showEditModal.value = true
}

const deletePatient = async (patient) => {
  if (confirm(`Are you sure you want to delete patient record for ${patient.childInfo.name}?`)) {
    try {
      await api.delete(`/patients/${patient.id}`)
      await fetchPatients()
    } catch (error) {
      console.error('Error deleting patient:', error)
      alert('Error deleting patient')
    }
  }
}

const savePatient = async () => {
  try {
    saving.value = true
    
    if (showEditModal.value) {
      await api.put(`/patients/${form.value.id}`, form.value)
    } else {
      await api.post('/patients', form.value)
    }
    
    closeModal()
    await fetchPatients()
  } catch (error) {
    console.error('Error saving patient:', error)
    alert('Error saving patient')
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  form.value = {
    id: null,
    childInfo: {
      name: '',
      sex: '',
      birthDate: '',
      phoneNumber: '',
      address: {
        street: '',
        barangay: '',
        municipality: '',
        province: '',
        zipCode: ''
      }
    },
    motherInfo: {
      name: '',
      age: null,
      educationLevel: '',
      occupation: ''
    },
    fatherInfo: {
      name: '',
      age: null,
      educationLevel: '',
      occupation: ''
    }
  }
}

const openQrScanner = () => {
  alert('QR Code Scanner opened! (Implement modal or scanner component here)')
}

const getStatusBadgeClass = (status) => {
  const classes = {
    active: 'badge bg-success',
    pending: 'badge bg-warning text-dark',
    completed: 'badge bg-secondary'
  }
  return classes[status] || 'badge bg-secondary'
}

// Lifecycle
onMounted(() => {
  fetchPatients()
})
</script>

<style scoped>
.hw-patient-card {
  border: 1px solid #e3e6f0;
  border-radius: 0.35rem;
  transition: all 0.3s;
}

.hw-patient-card:hover {
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
  transform: translateY(-2px);
}

.btn-hw-primary {
  background-color: #1cc88a;
  border-color: #1cc88a;
  color: white;
}

.btn-hw-primary:hover {
  background-color: #17a673;
  border-color: #17a673;
  color: white;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.card-title {
  color: #5a5c69;
}

.text-muted {
  color: #858796 !important;
}

.fw-semibold {
  font-weight: 600;
}

.btn-group .btn {
  border-radius: 0.25rem;
  margin-right: 0.125rem;
}

.btn-group .btn:last-child {
  margin-right: 0;
}

@media (max-width: 768px) {
  .col-lg-6 {
    margin-bottom: 1rem;
  }
  
  .d-md-flex {
    flex-direction: column;
  }
  
  .flex-fill {
    width: 100%;
    margin-bottom: 0.5rem;
  }
  
  .flex-fill:last-child {
    margin-bottom: 0;
  }
}
</style>
