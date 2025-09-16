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
                <!-- Child Information -->
                <div class="mb-4">
                  <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-person-fill text-primary me-2"></i>
                    <h6 class="text-primary fw-bold mb-0">Child Information</h6>
                  </div>
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label">Full Name:</label>
                      <input type="text" class="form-control" v-model="form.childInfo.name" required>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Sex:</label>
                      <select class="form-select" v-model="form.childInfo.sex" required>
                        <option value="">Select Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Birth Date:</label>
                      <input type="date" class="form-control" v-model="form.childInfo.birthDate" required>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Birth Weight (kg):</label>
                      <input type="number" step="0.1" class="form-control" v-model="form.childInfo.birthWeightKg">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Birth Length (cm):</label>
                      <input type="number" step="0.1" class="form-control" v-model="form.childInfo.birthLengthCm">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Place of Birth:</label>
                      <input type="text" class="form-control" v-model="form.childInfo.placeOfBirth">
                    </div>
                    <div class="col-md-8">
                      <label class="form-label">Address:</label>
                      <textarea class="form-control" rows="1" v-model="addressString" required></textarea>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Phone Number:</label>
                      <input type="tel" class="form-control" v-model="form.childInfo.phoneNumber" required>
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
                        <label class="form-label">Name:</label>
                        <input type="text" class="form-control" v-model="form.motherInfo.name" required>
                      </div>
                      <div class="col-6">
                        <label class="form-label">Age:</label>
                        <input type="number" class="form-control" v-model="form.motherInfo.age" min="15" max="60">
                      </div>
                      <div class="col-6">
                        <label class="form-label">Education:</label>
                        <select class="form-select" v-model="form.motherInfo.educationLevel">
                          <option value="">Select</option>
                          <option value="Elementary Graduate">Elementary</option>
                          <option value="High School Graduate">High School</option>
                          <option value="College Graduate">College</option>
                          <option value="Vocational Graduate">Vocational</option>
                        </select>
                      </div>
                      <div class="col-12">
                        <label class="form-label">Occupation:</label>
                        <input type="text" class="form-control" v-model="form.motherInfo.occupation">
                      </div>
                      <div class="col-12">
                        <label class="form-label">Phone:</label>
                        <input type="tel" class="form-control" v-model="form.motherInfo.phoneNumber">
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
                        <input type="text" class="form-control" v-model="form.fatherInfo.name">
                      </div>
                      <div class="col-6">
                        <label class="form-label">Age:</label>
                        <input type="number" class="form-control" v-model="form.fatherInfo.age" min="15" max="80">
                      </div>
                      <div class="col-6">
                        <label class="form-label">Education:</label>
                        <select class="form-select" v-model="form.fatherInfo.educationLevel">
                          <option value="">Select</option>
                          <option value="Elementary Graduate">Elementary</option>
                          <option value="High School Graduate">High School</option>
                          <option value="College Graduate">College</option>
                          <option value="Vocational Graduate">Vocational</option>
                        </select>
                      </div>
                      <div class="col-12">
                        <label class="form-label">Occupation:</label>
                        <input type="text" class="form-control" v-model="form.fatherInfo.occupation">
                      </div>
                      <div class="col-12">
                        <label class="form-label">Phone:</label>
                        <input type="tel" class="form-control" v-model="form.fatherInfo.phoneNumber">
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Medical History -->
                <div class="mb-4">
                  <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-clipboard-heart text-primary me-2"></i>
                    <h6 class="text-primary fw-bold mb-0">Medical History</h6>
                  </div>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Birth Complications:</label>
                      <input type="text" class="form-control" v-model="form.medicalHistory.birthComplications">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Allergies:</label>
                      <input type="text" class="form-control" v-model="form.medicalHistory.allergies">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Chronic Conditions:</label>
                      <input type="text" class="form-control" v-model="form.medicalHistory.chronicConditions">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Nutritional Status:</label>
                      <select class="form-select" v-model="form.medicalHistory.nutritionalStatus">
                        <option value="">Select Status</option>
                        <option value="Normal">Normal</option>
                        <option value="Underweight">Underweight</option>
                        <option value="Overweight">Overweight</option>
                        <option value="Stunted">Stunted</option>
                        <option value="Wasted">Wasted</option>
                      </select>
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
import { ref, computed, onMounted } from 'vue'
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
  childInfo: {
    name: '',
    sex: '',
    birthDate: '',
    phoneNumber: '',
    birthWeightKg: '',
    birthLengthCm: '',
    placeOfBirth: '',
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
    occupation: '',
    phoneNumber: ''
  },
  fatherInfo: {
    name: '',
    age: null,
    educationLevel: '',
    occupation: '',
    phoneNumber: ''
  },
  medicalHistory: {
    birthComplications: '',
    allergies: '',
    chronicConditions: '',
    nutritionalStatus: ''
  },
  vaccinationHistory: [],
  nextScheduledVaccinations: []
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
    patients.value = response.data.data.map(patient => ({
      ...patient,
      lastVaccination: patient.vaccinationHistory?.length > 0 
        ? patient.vaccinationHistory[patient.vaccinationHistory.length - 1].dateAdministered 
        : null
    }))

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
    // First fetch complete patient details to ensure we have all data
    const response = await api.get(`/patients/${patient.id}/details`);
    const fullPatientData = response.data.data;
    
    // Deep copy the complete patient data to the form
    form.value = {
      id: fullPatientData.id,
      childInfo: {
        name: fullPatientData.childInfo.name || '',
        sex: fullPatientData.childInfo.sex || '',
        birthDate: fullPatientData.childInfo.birthDate || '',
        phoneNumber: fullPatientData.childInfo.phoneNumber || '',
        birthWeightKg: fullPatientData.childInfo.birthWeightKg || '',
        birthLengthCm: fullPatientData.childInfo.birthLengthCm || '',
        placeOfBirth: fullPatientData.childInfo.placeOfBirth || '',
        address: {
          street: fullPatientData.childInfo.address?.street || '',
          barangay: fullPatientData.childInfo.address?.barangay || '',
          municipality: fullPatientData.childInfo.address?.municipality || '',
          province: fullPatientData.childInfo.address?.province || '',
          zipCode: fullPatientData.childInfo.address?.zipCode || ''
        }
      },
      motherInfo: {
        name: fullPatientData.motherInfo?.name || '',
        age: fullPatientData.motherInfo?.age || null,
        educationLevel: fullPatientData.motherInfo?.educationLevel || '',
        occupation: fullPatientData.motherInfo?.occupation || '',
        phoneNumber: fullPatientData.motherInfo?.phoneNumber || ''
      },
      fatherInfo: {
        name: fullPatientData.fatherInfo?.name || '',
        age: fullPatientData.fatherInfo?.age || null,
        educationLevel: fullPatientData.fatherInfo?.educationLevel || '',
        occupation: fullPatientData.fatherInfo?.occupation || '',
        phoneNumber: fullPatientData.fatherInfo?.phoneNumber || ''
      },
      medicalHistory: {
        birthComplications: fullPatientData.medicalHistory?.birthComplications || '',
        allergies: fullPatientData.medicalHistory?.allergies || '',
        chronicConditions: fullPatientData.medicalHistory?.chronicConditions || '',
        nutritionalStatus: fullPatientData.medicalHistory?.nutritionalStatus || ''
      },
      vaccinationHistory: fullPatientData.vaccinationHistory || [],
      nextScheduledVaccinations: fullPatientData.nextScheduledVaccinations || []
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
    if (!form.value.childInfo.name || !form.value.childInfo.sex || !form.value.childInfo.birthDate || !form.value.motherInfo.name) {
      alert('Please fill in all required fields marked with *')
      return
    }
    
    // Prepare complete patient data
    const patientData = {
      childInfo: { ...form.value.childInfo },
      motherInfo: { ...form.value.motherInfo },
      fatherInfo: { ...form.value.fatherInfo },
      medicalHistory: { ...form.value.medicalHistory }
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
    childInfo: {
      name: '',
      sex: '',
      birthDate: '',
      phoneNumber: '',
      birthWeightKg: '',
      birthLengthCm: '',
      placeOfBirth: '',
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
      occupation: '',
      phoneNumber: ''
    },
    fatherInfo: {
      name: '',
      age: null,
      educationLevel: '',
      occupation: '',
      phoneNumber: ''
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
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
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
