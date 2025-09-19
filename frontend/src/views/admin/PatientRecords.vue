<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <AppPageHeader 
        title="Patient Records" 
        subtitle="Manage patient information and vaccination history"
      >
        <template #actions>
          <AppButton variant="primary" icon="bi-plus-circle" @click="showAddModal = true">
            Add New Patient
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
            <small class="text-muted">{{ totalItems }} patients</small>
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
                  <td>{{ patient.childInfo.phoneNumber }}</td>
                  <td>
                    <span v-if="patient.lastVaccination" class="text-muted">
                      {{ formatDate(patient.lastVaccination) }}
                    </span>
                    <span v-else class="text-warning">No records</span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button 
                        class="btn btn-outline-primary" 
                        @click="viewPatient(patient)"
                        title="View Details"
                      >
                        <i class="bi bi-eye"></i>
                      </button>
                      <button 
                        class="btn btn-outline-success" 
                        @click="editPatient(patient)"
                        title="Edit"
                      >
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button 
                        class="btn btn-outline-info" 
                        @click="editVaccinations(patient)"
                        title="Edit Vaccinations"
                      >
                        <i class="bi bi-shield"></i>
                      </button>
                      <button 
                        class="btn btn-outline-danger" 
                        @click="deletePatient(patient)"
                        title="Delete"
                      >
                        <i class="bi bi-trash"></i>
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
            @page-change="changePage"
          />
        </div>
      </div>

      <!-- Patient Detail Modal -->
      <PatientDetailModal
        :show="showViewModal"
        :patient-id="selectedPatientId"
        @close="showViewModal = false"
      />

      <!-- Add/Edit Modal -->
      <div class="modal fade" :class="{ show: showAddModal || showEditModal }" :style="{ display: (showAddModal || showEditModal) ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-person-circle me-2"></i>
                {{ showEditModal ? 'Edit Patient' : 'Add New Patient' }}
              </h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body pb-0">
              <form @submit.prevent="savePatient">
                <!-- Patient Basic Information -->
                <div class="mb-4">
                  <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-person-fill text-primary me-2"></i>
                    <h6 class="text-primary fw-bold mb-0">Patient Information</h6>
                  </div>
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label">Surname: <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" v-model="form.surname" required>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">First Name: <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" v-model="form.firstname" required>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Middle Name:</label>
                      <input type="text" class="form-control" v-model="form.middlename">
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Sex: <span class="text-danger">*</span></label>
                      <select class="form-select" v-model="form.sex" required>
                        <option value="">Select Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Date of Birth: <span class="text-danger">*</span></label>
                      <input type="date" class="form-control" v-model="form.date_of_birth" required>
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Birth Weight (kg):</label>
                      <input type="number" step="0.1" class="form-control" v-model="form.birth_weight">
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Birth Length (cm):</label>
                      <input type="number" step="0.1" class="form-control" v-model="form.birth_length">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Place of Birth:</label>
                      <input type="text" class="form-control" v-model="form.place_of_birth">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Barangay: <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" v-model="form.barangay" required>
                    </div>
                    <div class="col-md-8">
                      <label class="form-label">Address: <span class="text-danger">*</span></label>
                      <textarea class="form-control" rows="2" v-model="form.address" required></textarea>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Health Center:</label>
                      <input type="text" class="form-control" v-model="form.health_center">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Guardian: <span class="text-danger">*</span></label>
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
                      <label class="form-label">Family Number:</label>
                      <div class="input-group">
                        <input 
                          type="text" 
                          class="form-control" 
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
                </div>

                <!-- Parent Information -->
                <div class="row mb-4">
                  <!-- Mother Information -->
                  <div class="col-md-6">
                    <div class="d-flex align-items-center mb-2">
                      <i class="bi bi-person-heart text-primary me-2"></i>
                      <h6 class="text-primary fw-bold mb-0">Mother's Information</h6>
                    </div>
                    <div class="row g-3">
                      <div class="col-12">
                        <label class="form-label">Name: <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" v-model="form.mother_name" required>
                      </div>
                      <div class="col-12">
                        <label class="form-label">Occupation:</label>
                        <input type="text" class="form-control" v-model="form.mother_occupation">
                      </div>
                      <div class="col-12">
                        <label class="form-label">Contact Number:</label>
                        <input type="tel" class="form-control" v-model="form.mother_contact_number">
                      </div>
                    </div>
                  </div>
                  
                  <!-- Father Information -->
                  <div class="col-md-6">
                    <div class="d-flex align-items-center mb-2">
                      <i class="bi bi-person-check text-primary me-2"></i>
                      <h6 class="text-primary fw-bold mb-0">Father's Information</h6>
                    </div>
                    <div class="row g-3">
                      <div class="col-12">
                        <label class="form-label">Name:</label>
                        <input type="text" class="form-control" v-model="form.father_name">
                      </div>
                      <div class="col-12">
                        <label class="form-label">Occupation:</label>
                        <input type="text" class="form-control" v-model="form.father_occupation">
                      </div>
                      <div class="col-12">
                        <label class="form-label">Contact Number:</label>
                        <input type="tel" class="form-control" v-model="form.father_contact_number">
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Additional Information -->
                <div class="mb-4">
                  <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-clipboard-heart text-primary me-2"></i>
                    <h6 class="text-primary fw-bold mb-0">Additional Information</h6>
                  </div>
                  <div class="row g-3">
                    <div class="col-12">
                      <label class="form-label">Tags (comma-separated):</label>
                      <input type="text" class="form-control" v-model="form.tags" placeholder="e.g. high-risk, malnourished, premature">
                      <div class="form-text">Use tags to categorize or flag special conditions</div>
                    </div>
                  </div>
                </div>
                
                <!-- Vaccination Data (Read-only info) -->
                <div class="mb-2 text-center text-muted small" v-if="showEditModal">
                  <i class="bi bi-info-circle me-1"></i>
                  Vaccination records can only be updated by healthcare providers during a vaccination visit.
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
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
      <div v-if="showAddModal || showEditModal || showViewModal || showVaccinationEditor" class="modal-backdrop fade show"></div>

      <!-- Vaccination Record Editor -->
      <VaccinationRecordEditor
        :show="showVaccinationEditor"
        :patient-id="selectedPatientId"
        @close="showVaccinationEditor = false"
        @update="fetchPatients"
      />
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import PatientDetailModal from '@/components/common/PatientDetailModal.vue'
import VaccinationRecordEditor from '@/components/common/VaccinationRecordEditor.vue'
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
const selectedGender = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const showVaccinationEditor = ref(false)
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
  // Additional fields for birth history
  birth_weight: '',
  birth_length: '',
  place_of_birth: ''
})

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
    if (selectedGender.value) params.gender = selectedGender.value

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
      lastVaccination: p.last_vaccination_date || null
    }))

    const totalCount = payload.totalCount || response.data?.total || patients.value.length
    totalItems.value = totalCount
    totalPages.value = Math.ceil(totalCount / itemsPerPage.value)

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

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const changePage = (page) => {
  currentPage.value = page
  fetchPatients()
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
  selectedPatientId.value = patient.id
  showViewModal.value = true
}

const editVaccinations = (patient) => {
  selectedPatientId.value = patient.id
  showVaccinationEditor.value = true
}

const editPatient = async (patient) => {
  try {
    // Fetch patient details from backend
    const response = await api.get(`/patients/${patient.id}`)
    const p = response.data?.data || {}
    
    // Deep copy the complete patient data to the form
    form.value = {
      id: p.patient_id || p.id,
      childInfo: {
        name: [p.firstname, p.middlename, p.surname].filter(Boolean).join(' ').trim(),
        sex: p.sex || p.gender || '',
        birthDate: p.date_of_birth || p.birth_date || '',
        phoneNumber: p.contact_number || '',
        birthWeightKg: p.birth_weight || '',
        birthLengthCm: p.birth_height || '',
        placeOfBirth: p.birth_place || '',
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
        phoneNumber: p.mother_phone || ''
      },
      fatherInfo: {
        name: p.father_name || '',
        phoneNumber: p.father_phone || ''
      },
      medicalHistory: {
        birthComplications: p.birth_complications || '',
        allergies: (p.allergies || []).join(', '),
        chronicConditions: (p.chronic_conditions || []).join(', '),
        nutritionalStatus: p.nutritional_status || ''
      },
      vaccinationHistory: p.vaccinations || [],
      nextScheduledVaccinations: p.next_scheduled || []
    }
    showEditModal.value = true;
  } catch (error) {
    console.error('Error fetching full patient details for edit:', error);
    alert('Failed to load complete patient data for editing. Please try again.');
    
    // Fallback to basic edit with available data
    form.value = {
      id: patient.id,
      childInfo: {
        name: patient.childInfo.name || '',
        sex: patient.childInfo.sex || '',
        birthDate: patient.childInfo.birthDate || '',
        phoneNumber: patient.childInfo.phoneNumber || '',
        address: {
          street: patient.childInfo.address?.street || '',
          barangay: patient.childInfo.address?.barangay || '',
          municipality: patient.childInfo.address?.municipality || '',
          province: patient.childInfo.address?.province || '',
          zipCode: patient.childInfo.address?.zipCode || ''
        }
      },
      motherInfo: {
        name: patient.motherInfo?.name || '',
        age: patient.motherInfo?.age || null,
        educationLevel: patient.motherInfo?.educationLevel || '',
        occupation: patient.motherInfo?.occupation || ''
      },
      fatherInfo: {
        name: patient.fatherInfo?.name || '',
        age: patient.fatherInfo?.age || null,
        educationLevel: patient.fatherInfo?.educationLevel || '',
        occupation: patient.fatherInfo?.occupation || ''
      },
      medicalHistory: {
        birthComplications: '',
        allergies: '',
        chronicConditions: '',
        nutritionalStatus: ''
      },
      vaccinationHistory: [],
      nextScheduledVaccinations: []
    }
    showEditModal.value = true;
  }
}

const deletePatient = async (patient) => {
  const patientName = patient.childInfo?.name || 'this patient'
  const confirmMessage = `Are you sure you want to delete the patient record for "${patientName}"?\n\nThis action cannot be undone and will permanently remove all vaccination history and related data.`
  
  if (confirm(confirmMessage)) {
    try {
      const response = await api.delete(`/patients/${patient.id}`)
      
      if (response.data.success) {
        // Show success message
        alert(`Patient record for "${patientName}" has been successfully deleted.`)
        
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
      alert(`Failed to delete patient: ${errorMessage}`)
    }
  }
}

const savePatient = async () => {
  try {
    saving.value = true
    
    // Validate required fields
    if (!form.value.surname || !form.value.firstname || !form.value.sex || !form.value.date_of_birth || !form.value.mother_name) {
      alert('Please fill in all required fields marked with *')
      return
    }
    
    // Prepare patient data using the flat form structure
    const patientData = {
      surname: form.value.surname,
      firstname: form.value.firstname,
      middlename: form.value.middlename,
      sex: form.value.sex,
      date_of_birth: form.value.date_of_birth,
      address: form.value.address,
      barangay: form.value.barangay,
      health_center: form.value.health_center,
      mother_name: form.value.mother_name,
      mother_occupation: form.value.mother_occupation,
      mother_contact_number: form.value.mother_contact_number,
      father_name: form.value.father_name,
      father_occupation: form.value.father_occupation,
      father_contact_number: form.value.father_contact_number,
      guardian_id: form.value.guardian_id,
      family_number: form.value.family_number,
      tags: form.value.tags,
      birth_weight: form.value.birth_weight,
      birth_length: form.value.birth_length,
      place_of_birth: form.value.place_of_birth
    }
    
    // We don't include vaccination history and scheduled vaccinations in the edit form
    // as they are typically managed through a separate interface by health workers
    
    let response
    if (showEditModal.value && form.value.id) {
      // Update existing patient
      response = await api.put(`/patients/${form.value.id}`, patientData)
      if (response.data.success) {
        alert('Patient information updated successfully!')
      }
    } else {
      // Create new patient
      response = await api.post('/patients', patientData)
      if (response.data.success) {
        alert('New patient added successfully!')
      }
    }
    
    closeModal()
    await fetchPatients()
    
  } catch (error) {
    console.error('Error saving patient:', error)
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred while saving the patient'
    alert(`Failed to save patient: ${errorMessage}`)
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  saving.value = false
  
  // Reset form to initial state
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
    birth_weight: '',
    birth_length: '',
    place_of_birth: ''
  }
  
  // Reset guardian search fields
  guardianSearchTerm.value = ''
  selectedGuardianName.value = ''
  showGuardianDropdown.value = false
}

const exportData = () => {
  console.log('Exporting data...')
  // Implement export functionality
}

const printData = () => {
  window.print()
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
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

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
