<template>
  <AdminLayout>
    <div class="container-fluid">
      <ToastContainer />
      <AppPageHeader 
        title="Patient Records" 
        subtitle="Manage patient information and vaccination history"
      >
        <template #actions>
          <AppButton variant="primary" icon="bi-plus-circle" @click="showAddModal = true">
            Add New Patient
          </AppButton>
          <AppButton variant="outline-primary" icon="bi-file-medical" class="ms-2" @click="showVisitModal = true">
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
              <td>{{ patient.guardian_contact_number }}</td>
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

      <!-- Visit Editor Modal -->
      <VisitEditor
        :show="showVisitModal"
        :collected-vaccinations="collectedVaccinationsForVisit"
        @close="showVisitModal = false"
        @saved="onVisitSaved"
        @update-collected-vaccinations="handleVaccinationsCollected"
      />

      <!-- Add/Edit Modal -->
      <div class="modal fade" :class="{ show: showAddModal || showEditModal }" :style="{ display: (showAddModal || showEditModal) ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog modal-dialog-scrollable" style="max-width: 75vw; width: 75vw;">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-person-circle me-2"></i>
                {{ showEditModal ? 'Edit Patient' : 'Add New Patient' }}
              </h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body px-4">
              <form id="patient-form" @submit.prevent="savePatient">
                <!-- Patient Basic Information -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-person-fill me-2"></i>Patient Information
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">First Name: <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" v-model="form.firstname" required>
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Middle Name:</label>
                        <input type="text" class="form-control" v-model="form.middlename">
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Surname: <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" v-model="form.surname" required>
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Sex: <span class="text-danger">*</span></label>
                        <select class="form-select" v-model="form.sex" required>
                          <option value="">Select Sex</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Date of Birth: <span class="text-danger">*</span></label>
                        <div class="input-group">
                          <input 
                            type="text" 
                            class="form-control" 
                            v-model="form.date_of_birth" 
                            placeholder="MM/DD/YYYY"
                            @blur="validateAndFormatDate('date_of_birth')"
                            required
                          />
                          <button 
                            class="btn btn-outline-secondary" 
                            type="button"
                            @click="openDatePicker('date_of_birth')"
                            title="Select date"
                          >
                            <i class="bi bi-calendar3"></i>
                          </button>
                          <input 
                            type="date" 
                            ref="datePickerBirth"
                            style="position: absolute; visibility: hidden; pointer-events: none;"
                            @change="onDatePickerChange('date_of_birth', $event)"
                          />
                        </div>
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Barangay: <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" v-model="form.barangay" required>
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Health Center: <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" v-model="form.health_center" required>
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Address: <span class="text-danger">*</span></label>
                        <textarea class="form-control" rows="2" v-model="form.address" required></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Guardian & Family Information -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-people-fill me-2"></i>Guardian & Family Information
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-4 col-lg-6 col-md-6">
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
                          <div v-if="showGuardianDropdown && filteredGuardians.length > 0" class="dropdown-menu show w-100 position-absolute" style="max-height: 300px; overflow-y: auto; z-index: 1000;">
                            <div v-for="guardian in filteredGuardians" :key="guardian.guardian_id" class="dropdown-item cursor-pointer d-flex justify-content-between align-items-center" @mousedown="selectGuardian(guardian)">
                              <div>
                                <strong>{{ guardian.full_name }}</strong>
                                <br>
                                <small class="text-muted">📞 {{ guardian.contact_number || 'No contact' }} | 👥 Family: {{ guardian.family_number || 'N/A' }}</small>
                              </div>
                              <span class="badge bg-primary">Guardian</span>
                            </div>
                          </div>
                          <div v-if="showGuardianDropdown && guardianSearchTerm && filteredGuardians.length === 0" class="dropdown-menu show w-100 position-absolute" style="z-index: 1000;">
                            <div class="dropdown-item-text text-muted text-center py-3">
                              <i class="bi bi-search"></i>
                              No guardians found matching "{{ guardianSearchTerm }}"
                            </div>
                          </div>
                        </div>
                        <input type="hidden" v-model="form.guardian_id" required>
                      </div>
                      <div class="col-xl-4 col-lg-6 col-md-6">
                        <label class="form-label">Relationship to Guardian: <span class="text-danger">*</span></label>
                        <select class="form-select" v-model="form.relationship_to_guardian" required>
                          <option value="">Select relationship</option>
                          <option value="Mother">Mother</option>
                          <option value="Father">Father</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div class="col-xl-4 col-lg-6 col-md-6">
                        <label class="form-label">Family Number:</label>
                        <div class="input-group">
                          <input type="text" class="form-control" v-model="form.family_number" readonly placeholder="Auto-generated from selected guardian" />
                          <span v-if="form.family_number" class="input-group-text bg-success text-white" title="Auto-populated from guardian"><i class="bi bi-check-circle"></i></span>
                        </div>
                        <div class="form-text text-muted">Auto-generated from selected guardian.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Parent Information -->
                <div class="row g-4 mb-4">
                  <div class="col-xl-6 col-lg-6 col-md-6">
                    <div class="p-3 border-start border-primary border-3 h-100">
                      <h6 class="text-primary fw-bold mb-3">Mother's Information</h6>
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
                  </div>
                  <div class="col-xl-6 col-lg-6 col-md-6">
                    <div class="p-3 border-start border-info border-3 h-100">
                      <h6 class="text-info fw-bold mb-3">Father's Information</h6>
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
                </div>

                <!-- Birth History -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-heart-pulse me-2"></i>Birth History
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Time of Birth: <span class="text-danger">*</span></label>
                        <input type="time" class="form-control" v-model="form.time_of_birth" required>
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Attendant at Birth: <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" v-model="form.attendant_at_birth" required>
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Type of Delivery: <span class="text-danger">*</span></label>
                        <select class="form-select" v-model="form.type_of_delivery" required>
                          <option value="">Select delivery type</option>
                          <option value="Normal">Normal</option>
                          <option value="Cesarean">Cesarean</option>
                          <option value="Assisted">Assisted</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Birth Weight (kg):</label>
                        <input type="number" step="0.1" class="form-control" v-model="form.birth_weight">
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Birth Length (cm):</label>
                        <input type="number" step="0.1" class="form-control" v-model="form.birth_length">
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Place of Birth:</label>
                        <input type="text" class="form-control" v-model="form.place_of_birth">
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Ballard's Score:</label>
                        <input type="number" class="form-control" v-model="form.ballards_score">
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Address at Birth:</label>
                        <input type="text" class="form-control" v-model="form.address_at_birth">
                      </div>
                    </div>
                    <div class="row g-4 mt-2">
                      <div class="col-xl-4 col-lg-4 col-md-6">
                        <label class="form-label">Hearing Test Date:</label>
                        <div class="input-group">
                          <input 
                            type="text" 
                            class="form-control" 
                            v-model="form.hearing_test_date" 
                            placeholder="MM/DD/YYYY"
                            @blur="validateAndFormatDate('hearing_test_date')"
                          />
                          <button 
                            class="btn btn-outline-secondary" 
                            type="button"
                            @click="openDatePicker('hearing_test_date')"
                            title="Select date"
                          >
                            <i class="bi bi-calendar3"></i>
                          </button>
                          <input 
                            type="date" 
                            ref="datePickerHearing"
                            style="position: absolute; visibility: hidden; pointer-events: none;"
                            @change="onDatePickerChange('hearing_test_date', $event)"
                          />
                        </div>
                      </div>
                      <div class="col-xl-4 col-lg-4 col-md-6">
                        <label class="form-label">Newborn Screening Date:</label>
                        <div class="input-group">
                          <input 
                            type="text" 
                            class="form-control" 
                            v-model="form.newborn_screening_date" 
                            placeholder="MM/DD/YYYY"
                            @blur="validateAndFormatDate('newborn_screening_date')"
                          />
                          <button 
                            class="btn btn-outline-secondary" 
                            type="button"
                            @click="openDatePicker('newborn_screening_date')"
                            title="Select date"
                          >
                            <i class="bi bi-calendar3"></i>
                          </button>
                          <input 
                            type="date" 
                            ref="datePickerScreening"
                            style="position: absolute; visibility: hidden; pointer-events: none;"
                            @change="onDatePickerChange('newborn_screening_date', $event)"
                          />
                        </div>
                      </div>
                      <div class="col-xl-4 col-lg-4 col-md-6">
                        <label class="form-label">Newborn Screening Result:</label>
                        <input type="text" class="form-control" v-model="form.newborn_screening_result">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Additional Information -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-clipboard-heart me-2"></i>Additional Information
                    </h6>
                    <div class="row g-4">
                      <div class="col-12">
                        <label class="form-label">Tags (comma-separated):</label>
                        <input type="text" class="form-control" v-model="form.tags" placeholder="e.g. high-risk, malnourished, premature">
                        <div class="form-text">Use tags to categorize or flag special conditions</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Vaccinations & Schedules removed from Add/Edit modal per UX request -->

              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                <i class="bi bi-x-circle me-2"></i>Close
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving" form="patient-form">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check-circle me-2"></i>
                {{ showEditModal ? 'Update' : 'Add' }} Patient
              </button>
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
        :patient-data="selectedPatientData"
        :visit-context="vaccinationVisitContext"
        @close="closeVaccinationEditor"
        @update="fetchPatients"
        @vaccinations-collected="handleVaccinationsCollected"
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
import VisitEditor from '@/components/common/VisitEditor.vue'
import api from '@/services/api'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { useToast } from '@/composables/useToast'

// Reactive data
const loading = ref(true)
const saving = ref(false)
const patients = ref([])
const guardians = ref([])
// Date picker refs
const datePickerBirth = ref(null)
const datePickerHearing = ref(null)
const datePickerScreening = ref(null)
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
const showVisitModal = ref(false)
const selectedPatientId = ref(null)
const selectedPatientData = ref(null)
const vaccinationVisitContext = ref(false) // Whether vaccination editor is opened from visit context
const collectedVaccinationsForVisit = ref([]) // Store vaccinations collected during visit

// Toasts
const { addToast } = useToast();

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
  relationship_to_guardian: '',
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
      guardian_contact_number: p.guardian_contact_number || p.guardian?.contact_number || '',
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

const openVaccinationFromVisit = (patientId, patientData = null) => {
  selectedPatientId.value = patientId
  selectedPatientData.value = patientData
  vaccinationVisitContext.value = true
  collectedVaccinationsForVisit.value = [] // Reset collected vaccinations
  showVaccinationEditor.value = true
}

const handleVaccinationsCollected = (vaccinations) => {
  // Replace the collected vaccinations with the updated array
  collectedVaccinationsForVisit.value = [...vaccinations]
  console.log('Vaccinations collected for visit:', collectedVaccinationsForVisit.value)
}

const closeVaccinationEditor = () => {
  showVaccinationEditor.value = false
  vaccinationVisitContext.value = false
}

const onVisitSaved = () => {
  // Reset collected vaccinations after visit is saved
  collectedVaccinationsForVisit.value = []
  fetchPatients() // Refresh patient list
}

const editPatient = async (patient) => {
  try {
    // Fetch patient details from backend
    const response = await api.get(`/patients/${patient.id}`)
    const p = response.data?.data || {}
    
    // Map backend patient object to the flat form fields used by savePatient()
    form.value = {
      id: p.patient_id || p.id,
      patient_id: p.patient_id || p.id,
      surname: p.surname || p.lastname || p.family_name || '',
      firstname: p.firstname || p.given_name || '',
      middlename: p.middlename || p.middle_name || '',
      sex: p.sex || p.gender || '',
      date_of_birth: formatForInput(p.date_of_birth || p.birth_date) || '',
      address: p.address || '',
      barangay: p.barangay || '',
      health_center: p.health_center || p.clinic || '',
      mother_name: p.mother_name || '',
      mother_occupation: p.mother_occupation || '',
      mother_contact_number: p.mother_phone || p.mother_contact_number || '',
      father_name: p.father_name || '',
      father_occupation: p.father_occupation || '',
      father_contact_number: p.father_phone || p.father_contact_number || '',
      guardian_id: p.guardian_id || null,
      family_number: p.family_number || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
      relationship_to_guardian: p.relationship_to_guardian || '',
      birth_weight: p.birth_weight || p.birthWeight || '',
      birth_length: p.birth_length || p.birthLength || '',
      place_of_birth: p.place_of_birth || p.birth_place || '',
      // Birth history fields
      time_of_birth: (p.medical_history && (p.medical_history.time_of_birth || p.medical_history.timeOfBirth)) || p.time_of_birth || '',
      attendant_at_birth: (p.medical_history && (p.medical_history.attendant_at_birth || p.medical_history.attendantAtBirth)) || p.attendant_at_birth || '',
      type_of_delivery: (p.medical_history && (p.medical_history.type_of_delivery || p.medical_history.typeOfDelivery)) || p.type_of_delivery || '',
      ballards_score: (p.medical_history && (p.medical_history.ballards_score || p.medical_history.ballardsScore)) || p.ballards_score || '',
      hearing_test_date: formatForInput((p.medical_history && (p.medical_history.hearing_test_date || p.medical_history.hearingTestDate)) || p.hearing_test_date) || '',
      newborn_screening_date: formatForInput((p.medical_history && (p.medical_history.newborn_screening_date || p.medical_history.newbornScreeningDate)) || p.newborn_screening_date) || '',
      newborn_screening_result: (p.medical_history && (p.medical_history.newborn_screening_result || p.medical_history.newbornScreeningResult)) || p.newborn_screening_result || '',
      address_at_birth: (p.medical_history && (p.medical_history.address_at_birth || p.medical_history.addressAtBirth)) || p.address_at_birth || ''
    }
    showEditModal.value = true;
  } catch (error) {
    console.error('Error fetching full patient details for edit:', error);
    // show toast instead of alert
    addToast({ title: 'Error', message: 'Failed to load complete patient data for editing. Please try again.', type: 'error' });
    
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
  }
}

const savePatient = async () => {
  try {
    saving.value = true
    
    // Validate required fields (always required)
    if (!form.value.surname || !form.value.firstname || !form.value.sex || !form.value.date_of_birth || !form.value.mother_name || !form.value.guardian_id || !form.value.relationship_to_guardian) {
      addToast({ title: 'Validation', message: 'Please fill in all required fields marked with *', type: 'error' })
      return
    }

    // On patient creation, require critical birth history fields
    if (!showEditModal.value) {
      if (!form.value.time_of_birth || !form.value.attendant_at_birth || !form.value.type_of_delivery) {
        addToast({ title: 'Validation', message: 'Please provide required birth history: Time of Birth, Attendant at Birth, and Type of Delivery', type: 'error' })
        return
      }
    }
    
    // Prepare patient data using the flat form structure
    const patientData = {
      surname: form.value.surname,
      firstname: form.value.firstname,
      middlename: form.value.middlename,
      sex: form.value.sex,
      date_of_birth: convertToISODate(form.value.date_of_birth) || form.value.date_of_birth,
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
  relationship_to_guardian: form.value.relationship_to_guardian,
      tags: form.value.tags,
      birth_weight: form.value.birth_weight,
      birth_length: form.value.birth_length,
      place_of_birth: form.value.place_of_birth,
      address_at_birth: form.value.address_at_birth,
      birthhistory: {
        birth_weight: form.value.birth_weight,
        birth_length: form.value.birth_length,
        place_of_birth: form.value.place_of_birth,
        address_at_birth: form.value.address_at_birth,
        time_of_birth: form.value.time_of_birth,
        attendant_at_birth: form.value.attendant_at_birth,
        type_of_delivery: form.value.type_of_delivery,
        ballards_score: form.value.ballards_score,
        hearing_test_date: convertToISODate(form.value.hearing_test_date) || form.value.hearing_test_date,
        newborn_screening_date: convertToISODate(form.value.newborn_screening_date) || form.value.newborn_screening_date,
        newborn_screening_result: form.value.newborn_screening_result
      }
    }
    
    // We don't include vaccination history and scheduled vaccinations in the edit form
    // as they are typically managed through a separate interface by health workers
    
    let response
    if (showEditModal.value && form.value.id) {
      // Update existing patient
      response = await api.put(`/patients/${form.value.id}`, patientData)
      if (response.data.success) {
        addToast({ title: 'Saved', message: 'Patient information updated successfully!', type: 'success' })
      }
    } else {
      // Create new patient
      response = await api.post('/patients', patientData)
      if (response.data.success) {
        addToast({ title: 'Saved', message: 'New patient added successfully!', type: 'success' })
      }
    }
    
    closeModal()
    await fetchPatients()
    
  } catch (error) {
    console.error('Error saving patient:', error)
  const errorMessage = error.response?.data?.message || error.message || 'An error occurred while saving the patient'
  addToast({ title: 'Error', message: `Failed to save patient: ${errorMessage}`, type: 'error' })
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
    relationship_to_guardian: '',
    birth_weight: '',
    birth_length: '',
    place_of_birth: '',
    // Birth history defaults
    time_of_birth: '',
    attendant_at_birth: '',
    type_of_delivery: '',
    ballards_score: '',
    hearing_test_date: '',
    newborn_screening_date: '',
    newborn_screening_result: '',
    address_at_birth: ''
  }

  // Also clear birthhistory fields
  form.value.time_of_birth = ''
  form.value.attendant_at_birth = ''
  form.value.type_of_delivery = ''
  form.value.ballards_score = ''
  form.value.hearing_test_date = ''
  form.value.newborn_screening_date = ''
  form.value.newborn_screening_result = ''
  form.value.address_at_birth = ''
  
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

// Date formatting and validation methods
const formatForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${yyyy}`
}

const validateAndFormatDate = (fieldName) => {
  if (!form.value[fieldName]) return
  
  // Handle various input formats and convert to MM/DD/YYYY
  let dateStr = form.value[fieldName].trim()
  let date = null
  
  // Try parsing MM/DD/YYYY format
  if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [month, day, year] = dateStr.split('/')
    date = new Date(year, month - 1, day)
  }
  // Try parsing DD/MM/YYYY format (convert to MM/DD/YYYY)
  else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const parts = dateStr.split('/')
    // Assume DD/MM/YYYY if day > 12 or month <= 12
    if (parseInt(parts[0]) > 12 || parseInt(parts[1]) <= 12) {
      const [day, month, year] = parts
      date = new Date(year, month - 1, day)
    }
  }
  // Try parsing YYYY-MM-DD format
  else if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    date = new Date(dateStr)
  }
  
  if (date && !isNaN(date.getTime())) {
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const yyyy = date.getFullYear()
    form.value[fieldName] = `${mm}/${dd}/${yyyy}`
  }
}

const openDatePicker = (fieldName) => {
  const refMap = {
    'date_of_birth': datePickerBirth,
    'hearing_test_date': datePickerHearing, 
    'newborn_screening_date': datePickerScreening
  }
  
  const datePickerEl = refMap[fieldName].value
  if (datePickerEl) {
    // Set the current value in ISO format for the date picker
    const isoDate = convertToISODate(form.value[fieldName])
    if (isoDate) {
      datePickerEl.value = isoDate
    }
    // Trigger the date picker
    datePickerEl.showPicker()
  }
}

const onDatePickerChange = (fieldName, event) => {
  const isoDate = event.target.value
  if (isoDate) {
    // Convert from ISO (YYYY-MM-DD) to MM/DD/YYYY for display
    const date = new Date(isoDate)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const yyyy = date.getFullYear()
    form.value[fieldName] = `${mm}/${dd}/${yyyy}`
  }
}

const convertToISODate = (mmddyyyy) => {
  if (!mmddyyyy) return null
  const [month, day, year] = mmddyyyy.split('/')
  if (!month || !day || !year) return null
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
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
