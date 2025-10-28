<template>
  <HealthWorkerLayout
    :show-controls="true"
    :controls-props="{
      icon: 'folder',
      title: 'Patient Records',
      searchPlaceholder: 'Search by Nar...',
      searchQuery: searchQuery,
      hasActiveFilters: hasActiveFilters
    }"
    @filter="toggleFilters"
    @scan="openQrScanner"
    @add="goToAddPatient"
    @update:searchQuery="searchQuery = $event"
  >
    <!-- Filter Sheet -->
    <FilterSheet
      v-model:show="showFilterSheet"
      v-model="activeFilters"
      @apply="applyFilters"
    />

    <!-- Content wrapper -->
    <div class="page-content-wrapper">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading patients...</span>
        </div>
        <p class="loading-text">Loading patients...</p>
      </div>

      <!-- Patient List -->
      <div v-else-if="filteredPatients.length > 0" class="patient-list">
        <PatientListCard
          v-for="patient in paginatedPatients" 
          :key="patient.id"
          :patient="patient"
          @click="viewPatientDetail"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="bi bi-person-x empty-icon"></i>
        <h4 class="empty-title">No patients found</h4>
        <p class="empty-text">Try adjusting your search criteria or add a new patient.</p>
        <button class="btn btn-primary mt-3" @click="goToAddPatient">
          <i class="bi bi-plus-lg me-2"></i>Add New Patient
        </button>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && totalPages > 1" class="pagination-container">
        <AppPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :items-per-page="itemsPerPage"
          @page-changed="changePage"
        />
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import FilterSheet from '@/features/health-worker/patients/components/FilterSheet.vue'
import PatientListCard from '@/features/health-worker/patients/components/PatientListCard.vue'
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
const showFilterSheet = ref(false)
const activeFilters = ref({
  ageRanges: [],
  gender: '',
  statuses: [],
  barangay: ''
})
// Guardian search functionality
const guardianSearchTerm = ref('')
const showGuardianDropdown = ref(false)
const selectedGuardianName = ref('')
const searchQuery = ref('')
const selectedStatus = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(20) // Increased for better mobile experience
const totalItems = ref(0)
const totalPages = ref(0)

// View mode and filters
const sortOrder = ref('name') // 'name', 'age', 'date'
const sortDirection = ref('asc') // 'asc', 'desc'

// Remove modal states - we'll navigate to detail page instead

// Computed properties for pagination
const hasActiveFilters = computed(() => {
  return activeFilters.value.ageRanges.length > 0 ||
         activeFilters.value.gender !== '' ||
         activeFilters.value.statuses.length > 0 ||
         activeFilters.value.barangay !== ''
})

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

  // Apply active filters
  if (hasActiveFilters.value) {
    // Gender filter
    if (activeFilters.value.gender) {
      filtered = filtered.filter(patient => 
        patient.childInfo.sex === activeFilters.value.gender
      )
    }

    // Barangay filter
    if (activeFilters.value.barangay) {
      filtered = filtered.filter(patient => 
        patient.childInfo.barangay === activeFilters.value.barangay
      )
    }

    // Status filter
    if (activeFilters.value.statuses.length > 0) {
      // TODO: Implement status filtering based on patient vaccination history
    }

    // Age range filter
    if (activeFilters.value.ageRanges.length > 0) {
      filtered = filtered.filter(patient => {
        const ageMonths = patient.age_months || 0
        return activeFilters.value.ageRanges.some(range => {
          switch (range) {
            case '0-6months': return ageMonths <= 6
            case '6-12months': return ageMonths > 6 && ageMonths <= 12
            case '1-2years': return ageMonths > 12 && ageMonths <= 24
            case '2-5years': return ageMonths > 24 && ageMonths <= 60
            default: return true
          }
        })
      })
    }
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
const toggleFilters = () => {
  showFilterSheet.value = !showFilterSheet.value
}

const applyFilters = (filters) => {
  // Filters are already applied through v-model
  currentPage.value = 1
}

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

const changePage = (page) => {
  currentPage.value = page
}

const viewPatientDetail = (patient) => {
  router.push(`/healthworker/patients/${patient.patient_id}`)
}

const resetPagination = () => {
  currentPage.value = 1
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
.page-content-wrapper {
  padding: 20px;
  padding-bottom: 100px; /* Space for fixed bottom navbar (70-80px + extra buffer) */
  min-height: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
}

.loading-text {
  color: #6b7280;
  font-size: 0.9375rem;
  margin: 0;
}

.patient-list {
  background: #ffffff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  text-align: center;
  background: #ffffff;
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-title {
  color: #374151;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-text {
  color: #6b7280;
  font-size: 0.9375rem;
  margin-bottom: 0;
  max-width: 320px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .loading-container {
    padding: 3rem 1rem;
  }
  
  .empty-state {
    padding: 3rem 1rem;
  }
  
  .empty-icon {
    font-size: 3rem;
  }
  
  .empty-title {
    font-size: 1.125rem;
  }
  
  .empty-text {
    font-size: 0.875rem;
  }
  
  .pagination-container {
    padding: 1rem;
  }
}

/* Tablets and up */
@media (min-width: 768px) {
  /* No additional padding needed - flexbox handles layout */
}

/* Desktop */
@media (min-width: 992px) {
  /* No additional padding needed - flexbox handles layout */
}
</style>
