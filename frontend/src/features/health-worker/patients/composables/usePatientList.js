/**
 * Composable for managing patient list with pagination, search, and filtering
 * Handles patient data fetching and transformation
 */
import { ref, computed } from 'vue'
import api from '@/services/api'

export function usePatientList() {
  // State
  const loading = ref(true)
  const patients = ref([])
  const currentPage = ref(1)
  const itemsPerPage = ref(20)
  const totalItems = ref(0)
  const totalPages = ref(0)

  // Sorting
  const sortOrder = ref('name') // 'name', 'age', 'date'
  const sortDirection = ref('asc') // 'asc', 'desc'

  // Computed
  const paginatedPatients = computed(() => {
    // Backend returns already-paginated items
    return patients.value || []
  })

  /**
   * Transform backend patient data to frontend format
   */
  const transformPatientData = (patient) => ({
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
    vaccinationHistory: [],
    tags: patient.tags,
    dateRegistered: patient.date_registered,
    age_months: patient.age_months,
    age_days: patient.age_days
  })

  /**
   * Enrich patient with last vaccination record
   */
  const enrichWithLastVaccination = async (patient) => {
    try {
      const res = await api.get('/immunizations', {
        params: {
          patient_id: patient.patient_id,
          sort: 'administered_date:desc',
          limit: 1
        }
      })
      const items = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      const last = items && items.length > 0 ? items[0] : null
      
      if (last) {
        const vaccineName = last.vaccine_antigen_name || last.vaccine_name || last.antigen_name || last.antigenName || last.vaccineName || 'Unknown Vaccine'
        const dateAdministered = last.administered_date || last.date_administered || last.dateAdministered || null
        patient.vaccinationHistory = [{ vaccineName, dateAdministered }]
      }
    } catch (e) {
      // Non-blocking; leave vaccinationHistory empty on error
    }
  }

  /**
   * Enrich all patients with vaccination history (with limited concurrency)
   */
  const enrichPatientsWithVaccinations = async (patientList) => {
    const concurrency = 8
    const queue = patientList.slice() // copy
    
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length) {
        const next = queue.shift()
        // eslint-disable-next-line no-await-in-loop
        await enrichWithLastVaccination(next)
      }
    })
    
    await Promise.all(workers)
  }

  /**
   * Fetch patients with filters and pagination
   */
  const fetchPatients = async (searchQuery = '', activeFilters = {}) => {
    try {
      loading.value = true
      
      // Build query parameters
      const params = {
        page: currentPage.value,
        limit: itemsPerPage.value,
        search: searchQuery || undefined
      }

      // Add filter parameters
      if (activeFilters.ageRanges?.length > 0) {
        params.age_ranges = activeFilters.ageRanges.join(',')
      }
      if (activeFilters.gender) {
        params.gender = activeFilters.gender
      }
      if (activeFilters.statuses?.length > 0) {
        params.statuses = activeFilters.statuses.join(',')
      }
      if (activeFilters.barangay) {
        params.barangay = activeFilters.barangay
      }

      // Make API request
      const response = await api.get('/patients', { params })
      const payload = response.data?.data || response.data || {}
      const patientsData = payload.patients || payload.items || payload || []

      // Transform patient data
      patients.value = (patientsData || []).map(transformPatientData)

      // Update totals from server
      totalItems.value = payload.totalCount || payload.total || patients.value.length
      totalPages.value = payload.totalPages || Math.ceil((totalItems.value || 0) / itemsPerPage.value)

      // Enrich with vaccination history
      try {
        await enrichPatientsWithVaccinations(patients.value)
      } catch (_) {
        // Ignore enrichment errors
      }

    } catch (error) {
      console.error('Error fetching patients:', error)
      patients.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Change page and refetch
   */
  const changePage = (page, searchQuery = '', activeFilters = {}) => {
    currentPage.value = page
    fetchPatients(searchQuery, activeFilters)
  }

  /**
   * Reset pagination to first page
   */
  const resetPagination = () => {
    currentPage.value = 1
  }

  /**
   * Toggle sort order
   */
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
      
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  }

  return {
    // State
    loading,
    patients,
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    sortOrder,
    sortDirection,
    
    // Computed
    paginatedPatients,
    
    // Methods
    fetchPatients,
    changePage,
    resetPagination,
    toggleSort,
    enrichWithLastVaccination
  }
}
