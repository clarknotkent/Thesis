/**
 * Composable for managing vaccine selection logic in immunization forms
 * Handles inventory-based vaccines (in-facility) and catalog vaccines (outside facility)
 */
import { ref, computed, watch } from 'vue'
import api from '@/services/api'

export function useVaccineSelection() {
  // Vaccine sources
  const vaccineOptions = ref([]) // inventory-based (in-facility)
  const vaccineCatalog = ref([]) // catalog (outside)
  
  // Search and filter state
  const vaccineSearchTerm = ref('')
  const showVaccineDropdown = ref(false)
  const showNipOnly = ref(false)
  const outsideMode = ref(false)
  const availableDoses = ref([1, 2, 3, 4, 5])
  const autoSelectHint = ref('')

  // Service form state
  const serviceForm = ref({
    inventoryId: '',
    vaccineId: '',
    vaccineName: '',
    diseasePrevented: '',
    doseNumber: '',
    dateAdministered: '',
    ageAtAdmin: '',
    manufacturer: '',
    lotNumber: '',
    site: '',
    healthStaff: '',
    facilityName: '',
    outsideFacility: false,
    remarks: ''
  })

  // Computed: Filter vaccines by NIP and search term
  const filteredVaccineOptions = computed(() => {
    const source = outsideMode.value ? vaccineCatalog.value : vaccineOptions.value
    let filtered = [...source]

    // Local NIP filter
    if (showNipOnly.value) {
      filtered = filtered.filter(v => !!(v.is_nip || v.isNIP))
    }

    // When outside mode is on, deduplicate by antigen name (case-insensitive)
    if (outsideMode.value) {
      const seen = new Set()
      filtered = filtered.filter(v => {
        const key = String(v.antigen_name || '').trim().toLowerCase()
        if (!key) return false
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    // Filter by search term
    if (vaccineSearchTerm.value && vaccineSearchTerm.value.trim() !== '') {
      const q = vaccineSearchTerm.value.toLowerCase().trim()
      filtered = filtered.filter(v => {
        const antigenMatch = (v.antigen_name || '').toLowerCase().includes(q)
        const lotMatch = (v.lot_number || '').toLowerCase().includes(q)
        const diseaseMatch = (v.disease_prevented || '').toLowerCase().includes(q)
        const manufMatch = (v.manufacturer || '').toLowerCase().includes(q)
        return antigenMatch || lotMatch || diseaseMatch || manufMatch
      })
    }

    return filtered.slice(0, 20)
  })

  /**
   * Fetch vaccine inventory (in-facility vaccines)
   */
  const fetchVaccineInventory = async () => {
    try {
      const params = {}
      if (showNipOnly.value) params.is_nip = 1

      const response = await api.get('/vaccine-inventory', { params })
      const data = response.data?.data || response.data || []
      
      vaccineOptions.value = Array.isArray(data) ? data : []
      
      // Mark expired vaccines
      const now = new Date()
      vaccineOptions.value.forEach(v => {
        v.isExpired = v.expiry_date && new Date(v.expiry_date) < now
      })
    } catch (error) {
      console.error('Error fetching vaccine inventory:', error)
      vaccineOptions.value = []
    }
  }

  /**
   * Fetch vaccine catalog (outside facility vaccines)
   */
  const fetchVaccineCatalog = async () => {
    try {
      const params = {}
      if (showNipOnly.value) params.is_nip = 1

      const response = await api.get('/vaccines', { params })
      vaccineCatalog.value = response.data?.data || response.data || []
    } catch (error) {
      console.error('Error fetching vaccine catalog:', error)
      vaccineCatalog.value = []
    }
  }

  /**
   * Refresh vaccine sources based on current mode
   */
  const refreshVaccineSources = async () => {
    if (outsideMode.value) {
      await fetchVaccineCatalog()
    } else {
      await fetchVaccineInventory()
    }
  }

  /**
   * Handle vaccine search input
   */
  const onVaccineSearch = () => {
    showVaccineDropdown.value = true
    
    // Clear selection if user is modifying the search term
    if (serviceForm.value.inventoryId) {
      const selectedVaccine = outsideMode.value
        ? vaccineCatalog.value.find(v => v.vaccine_id === serviceForm.value.vaccineId)
        : vaccineOptions.value.find(v => v.inventory_id === serviceForm.value.inventoryId)
      const expectedText = selectedVaccine 
        ? `${selectedVaccine.antigen_name}${outsideMode.value ? '' : ' - ' + (selectedVaccine.manufacturer || '')}`
        : ''
      
      if (vaccineSearchTerm.value !== expectedText) {
        clearVaccineSelection()
      }
    }
  }

  /**
   * Handle vaccine selection from dropdown
   */
  const selectVaccine = async (vaccine, updateSmartDosesFn) => {
    if (!outsideMode.value && vaccine.isExpired) return

    if (outsideMode.value) {
      // Outside mode: only antigen name shown and record flagged outside
      vaccineSearchTerm.value = `${vaccine.antigen_name}`
      serviceForm.value.inventoryId = ''
      serviceForm.value.vaccineId = vaccine.vaccine_id
      serviceForm.value.vaccineName = vaccine.antigen_name
      serviceForm.value.diseasePrevented = vaccine.disease_prevented || ''
      serviceForm.value.manufacturer = ''
      serviceForm.value.lotNumber = ''
      serviceForm.value.outsideFacility = true
      if (updateSmartDosesFn) await updateSmartDosesFn(vaccine.vaccine_id)
    } else {
      // In-facility mode: use inventory
      vaccineSearchTerm.value = `${vaccine.antigen_name} - ${vaccine.manufacturer || ''}`
      serviceForm.value.inventoryId = vaccine.inventory_id
      serviceForm.value.vaccineId = vaccine.vaccine_id
      serviceForm.value.vaccineName = vaccine.antigen_name
      serviceForm.value.diseasePrevented = vaccine.disease_prevented || ''
      serviceForm.value.manufacturer = vaccine.manufacturer || ''
      serviceForm.value.lotNumber = vaccine.lot_number || ''
      serviceForm.value.outsideFacility = false
      if (updateSmartDosesFn) await updateSmartDosesFn(vaccine.vaccine_id)
    }

    showVaccineDropdown.value = false
  }

  /**
   * Clear vaccine selection
   */
  const clearVaccineSelection = () => {
    serviceForm.value.inventoryId = ''
    serviceForm.value.vaccineId = ''
    serviceForm.value.vaccineName = ''
    serviceForm.value.diseasePrevented = ''
    serviceForm.value.manufacturer = ''
    serviceForm.value.lotNumber = ''
  }

  /**
   * Toggle outside mode
   */
  const onOutsideToggle = async () => {
    clearVaccineSelection()
    vaccineSearchTerm.value = ''
    await refreshVaccineSources()
  }

  /**
   * Close dropdown when clicking outside
   */
  const closeVaccineDropdown = (event) => {
    if (!event.target.closest('.vaccine-search-wrapper')) {
      showVaccineDropdown.value = false
    }
  }

  /**
   * Reset service form to initial state
   */
  const resetServiceForm = (defaultDate = '') => {
    serviceForm.value = {
      inventoryId: '',
      vaccineId: '',
      vaccineName: '',
      diseasePrevented: '',
      doseNumber: '',
      dateAdministered: defaultDate,
      ageAtAdmin: '',
      manufacturer: '',
      lotNumber: '',
      site: '',
      healthStaff: '',
      facilityName: '',
      outsideFacility: false,
      remarks: ''
    }
    vaccineSearchTerm.value = ''
    autoSelectHint.value = ''
  }

  return {
    // State
    vaccineOptions,
    vaccineCatalog,
    vaccineSearchTerm,
    showVaccineDropdown,
    showNipOnly,
    outsideMode,
    availableDoses,
    autoSelectHint,
    serviceForm,
    
    // Computed
    filteredVaccineOptions,
    
    // Methods
    fetchVaccineInventory,
    fetchVaccineCatalog,
    refreshVaccineSources,
    onVaccineSearch,
    selectVaccine,
    clearVaccineSelection,
    onOutsideToggle,
    closeVaccineDropdown,
    resetServiceForm
  }
}
