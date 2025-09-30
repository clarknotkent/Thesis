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
              <div class="fw-semibold">{{ getContact(patient) }}</div>
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
              <!-- Patient Basic Information -->
              <h6 class="text-primary mb-3">Patient Information</h6>
              <div class="row g-3 mb-4">
                <div class="col-md-4">
                  <label for="surname" class="form-label">Surname *</label>
                  <input type="text" class="form-control" id="surname" v-model="form.surname" required>
                </div>
                <div class="col-md-4">
                  <label for="firstname" class="form-label">First Name *</label>
                  <input type="text" class="form-control" id="firstname" v-model="form.firstname" required>
                </div>
                <div class="col-md-4">
                  <label for="middlename" class="form-label">Middle Name</label>
                  <input type="text" class="form-control" id="middlename" v-model="form.middlename">
                </div>
                <div class="col-md-6">
                  <label for="sex" class="form-label">Sex *</label>
                  <select class="form-select" id="sex" v-model="form.sex" required>
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label for="date_of_birth" class="form-label">Date of Birth *</label>
                  <input type="date" class="form-control" id="date_of_birth" v-model="form.date_of_birth" required>
                </div>
                <div class="col-12">
                  <label for="address" class="form-label">Address *</label>
                  <textarea class="form-control" id="address" rows="2" v-model="form.address" required></textarea>
                </div>
                <div class="col-md-6">
                  <label for="barangay" class="form-label">Barangay *</label>
                  <input type="text" class="form-control" id="barangay" v-model="form.barangay" required>
                </div>
                <div class="col-md-6">
                  <label for="health_center" class="form-label">Health Center</label>
                  <input type="text" class="form-control" id="health_center" v-model="form.health_center">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="guardian_id">Guardian: <span class="text-danger">*</span></label>
                  <div class="position-relative">
                    <input
                      type="text"
                      class="form-control"
                      v-model="guardianSearchTerm"
                      @focus="showGuardianDropdown = true"
                      @blur="hideGuardianDropdown"
                      :placeholder="selectedGuardianName || 'Search and select guardian...'"
                      autocomplete="off"
                    />
                    <div
                      v-if="showGuardianDropdown && filteredGuardians.length > 0"
                      class="dropdown-menu show w-100 position-absolute"
                      style="max-height: 300px; overflow-y: auto; z-index: 1000;"
                    >
                      <div
                        v-for="guardian in filteredGuardians"
                        :key="guardian.guardian_id"
                        class="dropdown-item cursor-pointer d-flex justify-content-between align-items-center"
                        @mousedown="selectGuardian(guardian)"
                      >
                        <div>
                          <strong>{{ guardian.full_name }}</strong>
                          <br>
                          <small class="text-muted">
                            📞 {{ guardian.contact_number || 'No contact' }} | 
                            👥 Family: {{ guardian.family_number || 'N/A' }}
                          </small>
                        </div>
                        <span class="badge bg-primary">Guardian</span>
                      </div>
                    </div>
                    <div
                      v-if="showGuardianDropdown && guardianSearchTerm && filteredGuardians.length === 0"
                      class="dropdown-menu show w-100 position-absolute"
                      style="z-index: 1000;"
                    >
                      <div class="dropdown-item-text text-muted text-center py-3">
                        <i class="bi bi-search"></i>
                        No guardians found matching "{{ guardianSearchTerm }}"
                      </div>
                    </div>
                  </div>
                  <input type="hidden" v-model="form.guardian_id" required>
                </div>
                <div class="col-md-6">
                  <label for="family_number" class="form-label">Family Number</label>
                  <div class="input-group">
                    <input 
                      type="text" 
                      class="form-control" 
                      id="family_number" 
                      v-model="form.family_number"
                      :readonly="form.guardian_id && guardians.find(g => g.guardian_id === form.guardian_id)?.family_number"
                    >
                    <span 
                      v-if="form.guardian_id && guardians.find(g => g.guardian_id === form.guardian_id)?.family_number" 
                      class="input-group-text bg-success text-white"
                      title="Auto-populated from guardian"
                    >
                      <i class="bi bi-check-circle"></i>
                    </span>
                  </div>
                  <div class="form-text text-success" v-if="form.guardian_id && guardians.find(g => g.guardian_id === form.guardian_id)?.family_number">
                    Auto-populated from selected guardian
                  </div>
                </div>
              </div>

              <!-- Parent Information -->
              <h6 class="text-primary mb-3">Parent Information</h6>
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label for="mother_name" class="form-label">Mother's Name *</label>
                  <input type="text" class="form-control" id="mother_name" v-model="form.mother_name" required>
                </div>
                <div class="col-md-6">
                  <label for="mother_occupation" class="form-label">Mother's Occupation</label>
                  <input type="text" class="form-control" id="mother_occupation" v-model="form.mother_occupation">
                </div>
                <div class="col-md-12">
                  <label for="mother_contact_number" class="form-label">Mother's Contact Number</label>
                  <input type="tel" class="form-control" id="mother_contact_number" v-model="form.mother_contact_number">
                </div>
                <div class="col-md-6">
                  <label for="father_name" class="form-label">Father's Name</label>
                  <input type="text" class="form-control" id="father_name" v-model="form.father_name">
                </div>
                <div class="col-md-6">
                  <label for="father_occupation" class="form-label">Father's Occupation</label>
                  <input type="text" class="form-control" id="father_occupation" v-model="form.father_occupation">
                </div>
                <div class="col-md-12">
                  <label for="father_contact_number" class="form-label">Father's Contact Number</label>
                  <input type="tel" class="form-control" id="father_contact_number" v-model="form.father_contact_number">
                </div>
              </div>

              <!-- Additional Information -->
              <h6 class="text-primary mb-3">Additional Information</h6>
              <div class="row g-3 mb-4">
                <div class="col-12">
                  <label for="tags" class="form-label">Tags (comma-separated)</label>
                  <input type="text" class="form-control" id="tags" v-model="form.tags" placeholder="e.g. high-risk, malnourished, etc.">
                </div>
              </div>

              <!-- Birth History (optional for newborn onboarding) -->
              <h6 class="text-primary mb-3">Birth History (optional)</h6>
              <div class="row g-3 mb-4">
                <div class="col-md-4">
                  <label for="time_of_birth" class="form-label">Time of Birth</label>
                  <input type="time" class="form-control" id="time_of_birth" v-model="form.time_of_birth">
                </div>
                <div class="col-md-4">
                  <label for="attendant_at_birth" class="form-label">Attendant at Birth</label>
                  <input type="text" class="form-control" id="attendant_at_birth" v-model="form.attendant_at_birth">
                </div>
                <div class="col-md-4">
                  <label for="type_of_delivery" class="form-label">Type of Delivery</label>
                  <input type="text" class="form-control" id="type_of_delivery" v-model="form.type_of_delivery">
                </div>

                <div class="col-md-4">
                  <label for="birth_weight" class="form-label">Birth Weight (kg)</label>
                  <input type="number" step="0.01" class="form-control" id="birth_weight" v-model="form.birth_weight">
                </div>
                <div class="col-md-4">
                  <label for="birth_length" class="form-label">Birth Length (cm)</label>
                  <input type="number" step="0.1" class="form-control" id="birth_length" v-model="form.birth_length">
                </div>
                <div class="col-md-4">
                  <label for="place_of_birth" class="form-label">Place of Birth</label>
                  <input type="text" class="form-control" id="place_of_birth" v-model="form.place_of_birth">
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
import { ref, computed, onMounted, watch } from 'vue'
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
const guardians = ref([])
// Guardian search functionality
const guardianSearchTerm = ref('')
const showGuardianDropdown = ref(false)
const selectedGuardianName = ref('')
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
  patient_id: null,
  surname: '',
  firstname: '',
  middlename: '',
  sex: '',
  date_of_birth: '',
  address: '',
  barangay: '',
  health_center: '',
  mother_name: '',
  mother_occupation: '',
  mother_contact_number: '',
  father_name: '',
  father_occupation: '',
  father_contact_number: '',
  guardian_id: null,
  family_number: '',
  tags: '',
  // Birth history (optional onboarding fields)
  birth_weight: null,
  birth_length: null,
  place_of_birth: null,
  address_at_birth: null,
  time_of_birth: null,
  attendant_at_birth: null,
  type_of_delivery: null,
  ballards_score: null,
  hearing_test_date: null,
  newborn_screening_date: null,
  newborn_screening_result: null
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

const fetchGuardians = async () => {
  try {
    const response = await api.get('/guardians')
    guardians.value = response.data.data || []
  } catch (error) {
    console.error('Error fetching guardians:', error)
    guardians.value = []
  }
}

const calculateAge = (birthDate) => {
  if (!birthDate) return '—'
  const birth = new Date(birthDate)
  const today = new Date()
  if (isNaN(birth.getTime())) return '—'

  // Compute months and days difference
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  let days = today.getDate() - birth.getDate()

  if (days < 0) {
    months -= 1
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0) // last day of previous month
    days += prevMonth.getDate()
  }

  if (months < 0) months = 0
  if (days < 0) days = 0

  const monthsPart = `${months}m`
  const daysPart = `${days}d`
  return `${monthsPart} ${daysPart}`
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
  const date = new Date(lastVaccination.dateAdministered).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  return `${lastVaccination.vaccineName} (${date})`
}

const getContact = (patient) => {
  // Prefer guardian contact if available in patient payload
  if (patient.guardianInfo && patient.guardianInfo.contact_number) return patient.guardianInfo.contact_number
  if (patient.motherInfo && patient.motherInfo.phone) return patient.motherInfo.phone
  if (patient.fatherInfo && patient.fatherInfo.phone) return patient.fatherInfo.phone
  // Fallback to child phone or empty
  return patient.childInfo?.phoneNumber || ''
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
      // Prepare payload: include birthhistory nested object for onboarding
      const payload = { ...form.value }
      // Ensure place_of_birth defaults to date_of_birth when not provided
      const placeOfBirth = form.value.place_of_birth || form.value.date_of_birth || null
      payload.birthhistory = {
        birth_weight: form.value.birth_weight,
        birth_length: form.value.birth_length,
        place_of_birth: placeOfBirth,
        address_at_birth: form.value.address_at_birth,
        time_of_birth: form.value.time_of_birth,
        attendant_at_birth: form.value.attendant_at_birth,
        type_of_delivery: form.value.type_of_delivery,
        ballards_score: form.value.ballards_score,
        hearing_test_date: form.value.hearing_test_date,
        newborn_screening_date: form.value.newborn_screening_date,
        newborn_screening_result: form.value.newborn_screening_result
      }

      // If front-end knows current user id (optional global), include created_by for audit
      if (window?.APP_USER_ID) payload.birthhistory.created_by = window.APP_USER_ID

      await api.post('/patients', payload)
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
    patient_id: null,
    surname: '',
    firstname: '',
    middlename: '',
    sex: '',
    date_of_birth: '',
    address: '',
    barangay: '',
    health_center: '',
    mother_name: '',
    mother_occupation: '',
    mother_contact_number: '',
    father_name: '',
    father_occupation: '',
    father_contact_number: '',
    guardian_id: null,
    family_number: '',
    tags: '',
    birth_weight: null,
    birth_length: null,
    place_of_birth: null,
    address_at_birth: null,
    time_of_birth: null,
    attendant_at_birth: null,
    type_of_delivery: null,
    ballards_score: null,
    hearing_test_date: null,
    newborn_screening_date: null,
    newborn_screening_result: null
  }
  
  // Reset guardian search fields
  guardianSearchTerm.value = ''
  selectedGuardianName.value = ''
  showGuardianDropdown.value = false
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

// Guardian search computed property
const filteredGuardians = computed(() => {
  if (!guardianSearchTerm.value) {
    return guardians.value
  }
  
  const searchTerm = guardianSearchTerm.value.toLowerCase()
  return guardians.value.filter(guardian => {
    return (
      guardian.full_name?.toLowerCase().includes(searchTerm) ||
      guardian.surname?.toLowerCase().includes(searchTerm) ||
      guardian.firstname?.toLowerCase().includes(searchTerm) ||
      guardian.middlename?.toLowerCase().includes(searchTerm) ||
      guardian.contact_number?.includes(searchTerm) ||
      guardian.family_number?.toLowerCase().includes(searchTerm)
    )
  })
})

// Guardian selection methods
const selectGuardian = (guardian) => {
  form.value.guardian_id = guardian.guardian_id
  selectedGuardianName.value = guardian.full_name
  guardianSearchTerm.value = ''
  showGuardianDropdown.value = false
  
  // Auto-populate family number
  if (guardian.family_number) {
    form.value.family_number = guardian.family_number
  }
}

const hideGuardianDropdown = () => {
  setTimeout(() => {
    showGuardianDropdown.value = false
  }, 200) // Small delay to allow click events on dropdown items
}

// Watch for guardian selection to auto-populate family number
watch(() => form.value.guardian_id, (newGuardianId) => {
  if (newGuardianId) {
    const selectedGuardian = guardians.value.find(g => g.guardian_id === newGuardianId)
    if (selectedGuardian && selectedGuardian.family_number) {
      form.value.family_number = selectedGuardian.family_number
    }
  } else {
    // Clear family number if no guardian selected
    form.value.family_number = ''
  }
})

// Lifecycle
onMounted(() => {
  fetchPatients()
  fetchGuardians()
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: #f8f9fa;
}
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
