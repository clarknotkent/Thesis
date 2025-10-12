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
          <AppButton variant="outline-primary" icon="bi-file-medical" class="ms-2" @click="openAddRecord()">
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
            @page-changed="changePage"
          />
        </div>
      </div>

      <!-- Patient Detail Modal -->
      <PatientDetailModal
        :show="showViewModal"
        :patient-id="selectedPatientId"
        @close="showViewModal = false"
        @open-add-patient-record="onOpenAddPatientRecord"
      />

      <!-- Unified Add Record Modal (Outside or In-facility) -->
      <AdminAddRecordModal
        :show="showAddRecord"
        :initial-patient-id="selectedPatientId"
        :initial-visit-id="selectedVisitId"
        :lock-patient-when-prefilled="Boolean(selectedPatientId)"
        :default-outside-mode="addRecordOutsideMode"
        @close="closeAddRecordModal"
        @saved="onVisitSaved"
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
                        <DateInput v-model="form.date_of_birth" />
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
                          <input type="text" class="form-control" v-model="form.mother_name" list="parentNames" placeholder="Type to search existing guardians..." required @change="onParentNameSelected('mother')">
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
                          <input type="text" class="form-control" v-model="form.father_name" list="parentNames" placeholder="Type to search existing guardians..." @change="onParentNameSelected('father')">
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
                <!-- Shared datalist for parent names -->
                <datalist id="parentNames">
                  <option v-for="g in guardians" :key="g.guardian_id" :value="g.full_name"></option>
                </datalist>

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
                        <DateInput v-model="form.hearing_test_date" />
                      </div>
                      <div class="col-xl-4 col-lg-4 col-md-6">
                        <label class="form-label">Newborn Screening Date:</label>
                        <DateInput v-model="form.newborn_screening_date" />
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
        :default-outside="vaccinationOutsideMode"
        @close="closeVaccinationEditor"
        @update="fetchPatients"
        @vaccinations-collected="handleVaccinationsCollected"
        @open-add-patient-record="onOpenAddPatientRecord"
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
import AdminAddRecordModal from '@/components/common/AdminAddRecordModal.vue'
import api from '@/services/api'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { useToast } from '@/composables/useToast'
import DateInput from '@/components/common/DateInput.vue'

// Reactive data
const loading = ref(true)
const saving = ref(false)
const patients = ref([])
const guardians = ref([])
// (Legacy native date picker refs removed; using shared DateInput component instead)
// Guardian search functionality
const guardianSearchTerm = ref('')
const showGuardianDropdown = ref(false)
const selectedGuardianName = ref('')
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedGender = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(5) // Set to 5 items per page as requested
const totalItems = ref(0)
const totalPages = ref(0)

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const showVaccinationEditor = ref(false)
const showVisitModal = ref(false) // legacy; retained for compatibility
const showAddRecord = ref(false)
const selectedPatientId = ref(null)
const selectedPatientData = ref(null)
const selectedVisitId = ref(null)
const vaccinationVisitContext = ref(false) // Whether vaccination editor is opened from visit context
const collectedVaccinationsForVisit = ref([]) // Store vaccinations collected during visit
const vaccinationOutsideMode = ref(true) // default to outside mode unless in-facility is chosen
const addRecordOutsideMode = ref(true)

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
  selectedPatientId.value = patient.id
  showViewModal.value = true
}

const editVaccinations = (patient) => {
  // New flow: remove prompt. Open Vaccination editor directly.
  // Inside the editor: clicking "Add Vaccination Record" will first show a Visit picker for in-facility,
  // and there will be a separate "Outside Record" button to go straight to outside mode.
  selectedPatientId.value = patient.id
  vaccinationVisitContext.value = false
  // Default to in-facility context (not outside) so user can pick a visit or switch to outside in the editor
  vaccinationOutsideMode.value = false
  showVaccinationEditor.value = true
}

const openVaccinationFromVisit = (patientId, patientData = null) => {
  selectedPatientId.value = patientId
  selectedPatientData.value = patientData
  vaccinationVisitContext.value = true
  vaccinationOutsideMode.value = false
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

const onOpenAddPatientRecord = ({ outside, visitId, patientId }) => {
  addRecordOutsideMode.value = outside
  if (visitId) {
    selectedVisitId.value = visitId
  }
  if (patientId) {
    selectedPatientId.value = patientId
  }
  showAddRecord.value = true
}

const onVisitSaved = () => {
  // Reset collected vaccinations after visit is saved
  collectedVaccinationsForVisit.value = []
  fetchPatients() // Refresh patient list
}

const closeAddRecordModal = () => {
  showAddRecord.value = false
  // Reset selections when modal closes
  selectedPatientId.value = null
  selectedVisitId.value = null
  addRecordOutsideMode.value = false
}

const openAddRecord = (patient = null) => {
  console.log('🚀 [PATIENT_RECORDS] openAddRecord called with patient:', {
    patient,
    patientId: patient?.id,
    patientName: patient ? `${patient.childInfo?.name}` : 'No patient provided'
  })
  // This opens the unified modal with Outside toggle by default
  selectedPatientId.value = patient?.id || ''
  console.log('📝 [PATIENT_RECORDS] Setting selectedPatientId to:', selectedPatientId.value)
  showAddRecord.value = true
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
    // If guardian exists on record, fetch guardian to display name and family number
    if (form.value.guardian_id) {
      try {
        const gRes = await api.get(`/guardians/${form.value.guardian_id}`)
        const g = gRes.data?.data
        if (g) {
          const fullName = [g.surname, g.firstname, g.middlename].filter(Boolean).join(', ').replace(', ', ', ').trim()
          selectedGuardianName.value = fullName || selectedGuardianName.value
          if (g.family_number) form.value.family_number = g.family_number
        }
      } catch (e) {
        // non-fatal if guardian fetch fails
        console.warn('Could not fetch guardian details for edit:', e?.message || e)
      }
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

  // If relationship is already chosen, auto-fill parent fields accordingly
  const rel = (form.value.relationship_to_guardian || '').toLowerCase()
  if (rel === 'mother') {
    form.value.mother_name = guardian.full_name || form.value.mother_name
    if (guardian.contact_number) form.value.mother_contact_number = guardian.contact_number
  } else if (rel === 'father') {
    form.value.father_name = guardian.full_name || form.value.father_name
    if (guardian.contact_number) form.value.father_contact_number = guardian.contact_number
  }
}

const hideGuardianDropdown = () => {
  setTimeout(() => {
    showGuardianDropdown.value = false
  }, 200) // Small delay to allow click events on dropdown items
}

// When selecting a parent name from datalist, auto-fill contact and link guardian if exact match
const onParentNameSelected = (which) => {
  const name = which === 'mother' ? (form.value.mother_name || '').trim() : (form.value.father_name || '').trim()
  if (!name) return
  // Find exact match by full_name
  const match = guardians.value.find(g => (g.full_name || '').toLowerCase() === name.toLowerCase())
  if (match) {
    if (which === 'mother') {
      if (match.contact_number) form.value.mother_contact_number = match.contact_number
    } else if (which === 'father') {
      if (match.contact_number) form.value.father_contact_number = match.contact_number
    }
    // If no guardian selected yet, set this guardian
    if (!form.value.guardian_id) {
      selectGuardian(match)
    }
  }
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

// Watch relationship changes to auto-fill respective parent details from guardian
watch(() => form.value.relationship_to_guardian, (newRel) => {
  const rel = (newRel || '').toLowerCase()
  if (!form.value.guardian_id) return
  const g = guardians.value.find(x => x.guardian_id === form.value.guardian_id)
  if (!g) return
  if (rel === 'mother') {
    form.value.mother_name = g.full_name || form.value.mother_name
    if (g.contact_number) form.value.mother_contact_number = g.contact_number
  } else if (rel === 'father') {
    form.value.father_name = g.full_name || form.value.father_name
    if (g.contact_number) form.value.father_contact_number = g.contact_number
  }
})

// Lifecycle
onMounted(() => {
  fetchPatients()
  fetchGuardians()
  // If editing and guardian_id is present, try to set the visible name and family number
  setTimeout(() => {
    if (form.value.guardian_id && Array.isArray(guardians.value) && guardians.value.length) {
      const g = guardians.value.find(x => x.guardian_id === form.value.guardian_id)
      if (g) {
        selectedGuardianName.value = g.full_name
        if (g.family_number) form.value.family_number = g.family_number
        // Also auto-fill parent fields based on relationship
        const rel = (form.value.relationship_to_guardian || '').toLowerCase()
        if (rel === 'mother') {
          form.value.mother_name = g.full_name || form.value.mother_name
          if (g.contact_number) form.value.mother_contact_number = g.contact_number
        } else if (rel === 'father') {
          form.value.father_name = g.full_name || form.value.father_name
          if (g.contact_number) form.value.father_contact_number = g.contact_number
        }
      }
    }
  }, 0)
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
