/**
 * Composable for managing patient search and filtering
 * Handles search query, filter state, and guardian lookup
 */
import { ref, computed } from 'vue'
import api from '@/services/api'

export function usePatientSearch() {
  // Search state
  const searchQuery = ref('')
  const showFilterSheet = ref(false)
  const activeFilters = ref({
    ageRanges: [],
    gender: '',
    statuses: [],
    barangay: ''
  })

  // Guardian search
  const guardians = ref([])
  const guardianSearchTerm = ref('')
  const showGuardianDropdown = ref(false)
  const selectedGuardianName = ref('')

  // Computed
  const hasActiveFilters = computed(() => {
    return activeFilters.value.ageRanges.length > 0 ||
           activeFilters.value.gender !== '' ||
           activeFilters.value.statuses.length > 0 ||
           activeFilters.value.barangay !== ''
  })

  /**
   * Fetch guardians for dropdown
   */
  const fetchGuardians = async () => {
    try {
      const response = await api.get('/guardians')
      guardians.value = response.data.data || response.data || []
    } catch (error) {
      console.error('Error fetching guardians:', error)
      guardians.value = []
    }
  }

  /**
   * Toggle filter sheet visibility
   */
  const toggleFilters = () => {
    showFilterSheet.value = !showFilterSheet.value
  }

  /**
   * Apply filters and close sheet
   */
  const applyFilters = () => {
    showFilterSheet.value = false
  }

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    activeFilters.value = {
      ageRanges: [],
      gender: '',
      statuses: [],
      barangay: ''
    }
  }

  /**
   * Reset search and filters
   */
  const resetSearch = () => {
    searchQuery.value = ''
    clearFilters()
  }

  /**
   * Set guardian search term
   */
  const setGuardianSearch = (term) => {
    guardianSearchTerm.value = term
    showGuardianDropdown.value = true
  }

  /**
   * Select a guardian
   */
  const selectGuardian = (guardian) => {
    selectedGuardianName.value = `${guardian.firstname} ${guardian.surname}`
    guardianSearchTerm.value = selectedGuardianName.value
    showGuardianDropdown.value = false
    return guardian.id
  }

  /**
   * Clear guardian selection
   */
  const clearGuardianSelection = () => {
    guardianSearchTerm.value = ''
    selectedGuardianName.value = ''
    showGuardianDropdown.value = false
  }

  return {
    // State
    searchQuery,
    showFilterSheet,
    activeFilters,
    guardians,
    guardianSearchTerm,
    showGuardianDropdown,
    selectedGuardianName,
    
    // Computed
    hasActiveFilters,
    
    // Methods
    fetchGuardians,
    toggleFilters,
    applyFilters,
    clearFilters,
    resetSearch,
    setGuardianSearch,
    selectGuardian,
    clearGuardianSelection
  }
}
