<template>
  <HealthWorkerLayout>
    <!-- Search Bar Section -->
    <div class="search-section mb-3">
      <div class="d-flex gap-2 align-items-center">
        <div class="flex-grow-1">
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
        <AppButton
          variant="outline-secondary"
          icon="bi bi-sort-down"
          @click="toggleSort"
          class="compact-btn"
        >
          Sort
        </AppButton>
        <AppButton
          variant="info"
          icon="bi bi-camera"
          @click="openQrScanner"
          class="compact-btn"
        >
          Scan
        </AppButton>
        <AppButton
          variant="primary"
          @click="goToAddPatient"
          icon="bi bi-plus-circle"
          class="compact-btn"
        >
          + Add
        </AppButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading patients...</span>
      </div>
    </div>

    <!-- Patient Cards -->
    <div v-else class="patient-cards">
      <div 
        v-for="patient in paginatedPatients" 
        :key="patient.id"
        class="patient-card"
        @click="viewPatientDetail(patient)"
      >
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="card-title mb-1">{{ patient.childInfo.name }}</h6>
              <p class="card-subtitle mb-0">ID: {{ patient.id }}</p>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span :class="getStatusBadgeClass(getPatientStatus(patient))">
                {{ getPatientStatus(patient) }}
              </span>
              <i class="bi bi-chevron-right text-muted"></i>
            </div>
          </div>
        </div>
        
        <div class="card-body">
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Age</span>
              <span class="info-value">{{ calculateAge(patient.childInfo.birthDate, patient) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Sex</span>
              <span class="info-value">{{ patient.childInfo.sex }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Guardian</span>
              <span class="info-value">{{ patient.guardianInfo.name || patient.motherInfo.name || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Last Vaccine</span>
              <span class="info-value">{{ getLastVaccination(patient) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredPatients.length === 0" class="text-center py-5">
      <i class="bi bi-person-x text-muted mb-3" style="font-size: 4rem;"></i>
      <h4 class="text-muted">No patients found</h4>
      <p class="text-muted">Try adjusting your search criteria or add a new patient.</p>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && totalPages > 1" class="d-flex justify-content-center mt-4">
      <AppPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :items-per-page="itemsPerPage"
        @page-changed="changePage"
      />
    </div>




  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import AppCard from '@/components/ui/base/AppCard.vue'
import AppButton from '@/components/ui/base/AppButton.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const { addToast } = useToast()
const { confirm } = useConfirm()

const router = useRouter()

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
const itemsPerPage = ref(5) // Set to 5 items per page as requested
const totalItems = ref(0)
const totalPages = ref(0)

// View mode and filters
const sortOrder = ref('name') // 'name', 'age', 'date'
const sortDirection = ref('asc') // 'asc', 'desc'

// Remove modal states - we'll navigate to detail page instead

// Computed properties for pagination
const filteredPatients = computed(() => {
  let filtered = patients.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(patient => 
      patient.childInfo.name.toLowerCase().includes(query) ||
      patient.guardianInfo.name.toLowerCase().includes(query) ||
      patient.id.toString().includes(query)
    )
  }

  totalItems.value = filtered.length
  totalPages.value = Math.ceil(filtered.length / itemsPerPage.value)
  return filtered
})

const paginatedPatients = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return filteredPatients.value.slice(startIndex, endIndex)
})

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
  guardian_relationship: '', // New field for relationship
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

// Methods
const goToAddPatient = () => {
  router.push('/healthworker/patients/add')
}

const fetchPatients = async () => {
  try {
    loading.value = true
    // Fetch all patients for client-side pagination and filtering
    const response = await api.get('/patients')
    
    // Map backend data structure to frontend format
    const patientsData = response.data.data?.patients || response.data.data || []
    patients.value = patientsData.map(patient => ({
      id: patient.patient_id,
      patient_id: patient.patient_id,
      childInfo: {
        name: patient.full_name || `${patient.firstname} ${patient.surname}`.trim(),
        firstName: patient.firstname,
        middleName: patient.middlename,
        lastName: patient.surname,
        birthDate: patient.date_of_birth,
        sex: patient.sex,
        address: patient.address,
        barangay: patient.barangay,
        phoneNumber: patient.guardian_contact_number
      },
      motherInfo: {
        name: patient.mother_name,
        occupation: patient.mother_occupation,
        phone: patient.mother_contact_number
      },
      fatherInfo: {
        name: patient.father_name,
        occupation: patient.father_occupation,
        phone: patient.father_contact_number
      },
      guardianInfo: {
        id: patient.guardian_id,
        name: `${patient.guardian_firstname || ''} ${patient.guardian_surname || ''}`.trim(),
        contact_number: patient.guardian_contact_number,
        family_number: patient.guardian_family_number,
        relationship: patient.relationship_to_guardian
      },
      // Initialize empty vaccination history - will be populated by separate API call if needed
      vaccinationHistory: [],
      tags: patient.tags,
      dateRegistered: patient.date_registered,
      age_months: patient.age_months,
      age_days: patient.age_days
    }))

    // Client-side pagination - totals will be calculated in computed properties

  } catch (error) {
    console.error('Error fetching patients:', error)
    patients.value = []
  } finally {
    loading.value = false
  }
}

const fetchGuardians = async () => {
  try {
    const response = await api.get('/guardians')
    guardians.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error fetching guardians:', error)
    guardians.value = []
  }
}

const calculateAge = (birthDate, patient = null) => {
  // If patient object has pre-computed age from backend, use that
  if (patient && patient.age_months !== undefined && patient.age_days !== undefined) {
    const months = patient.age_months || 0
    const days = patient.age_days || 0
    
    // FIXED: Show age in years if >= 36 months, otherwise months and days
    if (months >= 36) {
      const years = Math.floor(months / 12)
      return `${years} year${years !== 1 ? 's' : ''}`
    } else {
      return `${months}m ${days}d`
    }
  }
  
  // Fallback to client-side calculation
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

  // FIXED: Show age in years if >= 36 months, otherwise months and days
  if (months >= 36) {
    const years = Math.floor(months / 12)
    return `${years} year${years !== 1 ? 's' : ''}`
  } else {
    const monthsPart = `${months}m`
    const daysPart = `${days}d`
    return `${monthsPart} ${daysPart}`
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
  const date = new Date(lastVaccination.dateAdministered).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  return `${lastVaccination.vaccineName} (${date})`
}

const getContact = (patient) => {
  // Prefer guardian contact if available
  if (patient.guardianInfo && patient.guardianInfo.contact_number) return patient.guardianInfo.contact_number
  if (patient.motherInfo && patient.motherInfo.phone) return patient.motherInfo.phone
  if (patient.fatherInfo && patient.fatherInfo.phone) return patient.fatherInfo.phone
  // Fallback to child phone or empty
  return patient.childInfo?.phoneNumber || 'N/A'
}

const changePage = (page) => {
  currentPage.value = page
}

const viewPatientDetail = (patient) => {
  router.push(`/healthworker/patients/${patient.patient_id}`)
}

const resetPagination = () => {
  currentPage.value = 1
}

const applyFilters = () => {
  currentPage.value = 1
  fetchPatients()
}

const toggleSort = () => {
  // Cycle through sort options: name -> age -> date -> name (desc) -> age (desc) -> date (desc)
  if (sortOrder.value === 'name' && sortDirection.value === 'asc') {
    sortOrder.value = 'age'
  } else if (sortOrder.value === 'age' && sortDirection.value === 'asc') {
    sortOrder.value = 'date'
  } else if (sortOrder.value === 'date' && sortDirection.value === 'asc') {
    sortOrder.value = 'name'
    sortDirection.value = 'desc'
  } else if (sortOrder.value === 'name' && sortDirection.value === 'desc') {
    sortOrder.value = 'age'
    sortDirection.value = 'desc'
  } else if (sortOrder.value === 'age' && sortDirection.value === 'desc') {
    sortOrder.value = 'date'
    sortDirection.value = 'desc'
  } else {
    sortOrder.value = 'name'
    sortDirection.value = 'asc'
  }
  
  // Apply sorting
  patients.value.sort((a, b) => {
    let comparison = 0
    
    if (sortOrder.value === 'name') {
      comparison = a.childInfo.name.localeCompare(b.childInfo.name)
    } else if (sortOrder.value === 'age') {
      const ageA = new Date(a.childInfo.birthDate)
      const ageB = new Date(b.childInfo.birthDate)
      comparison = ageB - ageA // Younger first for asc
    } else if (sortOrder.value === 'date') {
      const dateA = new Date(a.dateRegistered || 0)
      const dateB = new Date(b.dateRegistered || 0)
      comparison = dateB - dateA // Most recent first for asc
    }
    
    return sortDirection.value === 'desc' ? -comparison : comparison
  })
}

// Debounced search
let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    resetPagination()
  }, 500)
}

// Removed viewPatient and editPatient methods - navigation handled by viewPatientDetail

const deletePatient = async (patient) => {
  try {
    await confirm({
      title: 'Delete Patient Record',
      message: `Are you sure you want to delete patient record for ${patient.childInfo.name}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })
    
    try {
      await api.delete(`/patients/${patient.patient_id}`)
      await fetchPatients()
      addToast({ title: 'Deleted', message: 'Patient record deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Error deleting patient:', error)
      const errorMessage = error.response?.data?.message || 'Error deleting patient'
      addToast({ title: 'Error', message: errorMessage, type: 'error' })
    }
  } catch {
    // User cancelled
  }
}

const savePatient = async () => {
  try {
    saving.value = true
    
    // Prepare payload in backend-expected format
    const payload = {
      firstname: form.value.firstname,
      surname: form.value.surname,
      middlename: form.value.middlename,
      sex: form.value.sex,
      date_of_birth: form.value.date_of_birth,
      address: form.value.address,
      barangay: form.value.barangay,
      health_center: form.value.health_center,
      guardian_id: form.value.guardian_id,
      relationship_to_guardian: 'Child', // Default relationship
      mother_name: form.value.mother_name,
      mother_occupation: form.value.mother_occupation,
      mother_contact_number: form.value.mother_contact_number,
      father_name: form.value.father_name,
      father_occupation: form.value.father_occupation,
      father_contact_number: form.value.father_contact_number,
      family_number: form.value.family_number,
      tags: form.value.tags
    }

    // Include birth history for new patients
    if (!showEditModal.value) {
      payload.birthhistory = {
        birth_weight: form.value.birth_weight,
        birth_length: form.value.birth_length,
        place_of_birth: form.value.place_of_birth || form.value.date_of_birth,
        address_at_birth: form.value.address_at_birth,
        time_of_birth: form.value.time_of_birth || '00:00', // Required field
        attendant_at_birth: form.value.attendant_at_birth || 'Midwife', // Required field
        type_of_delivery: form.value.type_of_delivery || 'Normal', // Required field
        ballards_score: form.value.ballards_score,
        hearing_test_date: form.value.hearing_test_date,
        newborn_screening_date: form.value.newborn_screening_date,
        newborn_screening_result: form.value.newborn_screening_result
      }
    }
    
    if (showEditModal.value) {
      await api.put(`/patients/${form.value.patient_id}`, payload)
    } else {
      await api.post('/patients', payload)
    }
    
    closeModal()
    await fetchPatients()
  } catch (error) {
    console.error('Error saving patient:', error)
    const errorMessage = error.response?.data?.message || 'Error saving patient'
    alert(errorMessage)
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
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
  alert('Camera scanner opened! (Implement camera/QR scanner component here)')
}

const administerVaccine = (patient) => {
  // Open vaccine administration modal or inline form
  // For now, we'll show an alert with patient info
  alert(`Administer vaccine for: ${patient.childInfo.name} (ID: ${patient.patient_id})`)
  // TODO: Implement vaccine administration modal/form here
}

const getStatusBadgeClass = (status) => {
  const classes = {
    active: 'badge bg-success',
    pending: 'badge bg-warning text-dark',
    completed: 'badge bg-secondary'
  }
  return classes[status] || 'badge bg-secondary'
}

const getPatientStatusText = (status) => {
  const statusTexts = {
    active: 'Active',
    pending: 'Pending',
    completed: 'Completed'
  }
  return statusTexts[status] || 'Unknown'
}

const isDefaulter = (patient) => {
  // Check if patient has overdue schedules (missed vaccinations)
  if (!patient.patientSchedules || patient.patientSchedules.length === 0) {
    return false
  }
  
  const today = new Date()
  return patient.patientSchedules.some(schedule => {
    if (schedule.status === 'Missed' || schedule.status === 'Overdue') {
      return true
    }
    // Check if scheduled date is in the past and not completed
    if (schedule.scheduled_date && schedule.status !== 'Completed') {
      const scheduledDate = new Date(schedule.scheduled_date)
      return scheduledDate < today
    }
    return false
  })
}

const isDueToday = (patient) => {
  // Check if patient has schedules due today
  if (!patient.patientSchedules || patient.patientSchedules.length === 0) {
    return false
  }
  
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  return patient.patientSchedules.some(schedule => {
    return schedule.scheduled_date === today && schedule.status !== 'Completed'
  })
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

  // Auto-fill mother fields if relationship is "Mother"
  if (form.value.guardian_relationship === 'Mother') {
    form.value.mother_name = guardian.full_name
    form.value.mother_contact_number = guardian.contact_number
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
    
    // Auto-fill mother fields if relationship is "Mother"
    if (form.value.guardian_relationship === 'Mother' && selectedGuardian) {
      form.value.mother_name = selectedGuardian.full_name
      form.value.mother_contact_number = selectedGuardian.contact_number
    }
  } else {
    // Clear family number if no guardian selected
    form.value.family_number = ''
  }
})

// Watch for guardian relationship changes to handle auto-fill
watch(() => form.value.guardian_relationship, (newRelationship, oldRelationship) => {
  if (newRelationship === 'Mother' && form.value.guardian_id) {
    // Auto-fill mother fields when relationship changes to "Mother"
    const selectedGuardian = guardians.value.find(g => g.guardian_id === form.value.guardian_id)
    if (selectedGuardian) {
      form.value.mother_name = selectedGuardian.full_name
      form.value.mother_contact_number = selectedGuardian.contact_number
    }
  } else if (oldRelationship === 'Mother' && newRelationship !== 'Mother') {
    // Clear auto-filled mother fields when relationship changes away from "Mother"
    // Only clear if they were auto-filled (guardian name matches)
    const selectedGuardian = guardians.value.find(g => g.guardian_id === form.value.guardian_id)
    if (selectedGuardian && form.value.mother_name === selectedGuardian.full_name) {
      form.value.mother_name = ''
      form.value.mother_contact_number = ''
    }
  }
})

// Lifecycle
onMounted(() => {
  fetchPatients()
  fetchGuardians()
})
</script>

<style scoped>
.search-section {
  padding: 1rem 0;
}

.compact-btn {
  white-space: nowrap;
  min-width: 70px;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: #f8f9fa;
}
.patient-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.patient-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.patient-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #007bff;
}

.patient-card:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.card-body {
  padding: 1rem;
}

.card-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.card-subtitle {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 0;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: #2c3e50;
  font-weight: 600;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
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

/* Mobile optimizations */
@media (max-width: 576px) {
  .search-section .d-flex {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .search-section .flex-grow-1 {
    flex: 1 1 100%;
    margin-bottom: 0.5rem;
  }
  
  .compact-btn {
    flex: 1;
    min-width: 60px;
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
  }
  
  .card-header,
  .card-body {
    padding: 0.875rem;
  }
  
  .patient-card:active {
    background-color: rgba(0, 123, 255, 0.05);
  }
  
  .card-title {
    font-size: 0.95rem;
  }
  
  .patient-cards {
    gap: 0.75rem;
  }
  
  .info-grid {
    gap: 0.5rem;
  }
  
  .info-label,
  .info-value {
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) and (min-width: 577px) {
  .compact-btn {
    font-size: 0.8rem;
    padding: 0.3rem 0.6rem;
    min-width: 65px;
  }
}
</style>
