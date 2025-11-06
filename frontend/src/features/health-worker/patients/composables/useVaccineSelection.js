/**
 * Composable for managing vaccine selection logic in immunization forms
 * Handles inventory-based vaccines (in-facility) and catalog vaccines (outside facility)
 */
import { ref, computed } from 'vue'
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
  // Cache for remaining dose availability per vaccine_id
  const remainingCache = ref({})

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
  const fetchVaccineInventory = async (patientId = null) => {
    try {
      const params = {}
      if (showNipOnly.value) params.is_nip = true
      const response = await api.get('/vaccines/inventory', { params })
      const raw = response.data?.data || response.data || []

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // helper to get patient's existing vaccines
      const { vaccineIds: _vaccineIds, antigenNames: _antigenNames } = patientId ? await fetchPatientImmunizations(patientId) : { vaccineIds: new Set(), antigenNames: new Set() }

      const mapped = (Array.isArray(raw) ? raw : []).map(v => {
        const exp = v.expiration_date || v.expiry_date || null
        const antigen = v.vaccinemaster?.antigen_name || v.vaccine?.antigen_name || v.antigen_name || 'Unknown'
        const manufacturer = v.vaccinemaster?.manufacturer || v.vaccine?.manufacturer || v.manufacturer || ''
        const disease = v.vaccinemaster?.disease_prevented || v.vaccine?.disease_prevented || v.disease_prevented || ''
        const stock = v.current_stock_level ?? v.current_stock ?? v.quantity ?? 0
        const isNip = !!(v.vaccinemaster?.is_nip || v.vaccine?.is_nip || v.is_nip || v.isNip)
        return {
          inventory_id: v.inventory_id || v.id,
          vaccine_id: v.vaccinemaster?.vaccine_id || v.vaccine_id || v.vaccine?.vaccine_id,
          antigen_name: antigen,
          disease_prevented: disease,
          manufacturer,
          lot_number: v.lot_number || v.batch_number || '',
          expiration_date: exp || '',
          current_stock_level: stock,
          isExpired: exp ? new Date(exp).setHours(0,0,0,0) < today.getTime() : false,
          is_nip: isNip
        }
      })

      let result = mapped

      // Filter out vaccines fully completed (no remaining doses) using smart-doses endpoint
      if (patientId) {
        result = await filterByRemainingDoses(patientId, result)
      }

      vaccineOptions.value = result
    } catch (error) {
      console.error('Error fetching vaccine inventory:', error)
      vaccineOptions.value = []
    }
  }

  /**
   * Fetch vaccine catalog (outside facility vaccines)
   * Optionally exclude vaccines the patient already has (by id or antigen name)
   */
  const fetchVaccineCatalog = async (patientId = null) => {
    try {
      const params = {}
      if (showNipOnly.value) params.is_nip = true

      const response = await api.get('/vaccines', { params })
      // Response may be in various shapes; normalize like in faith
      let payload = response.data?.data || response.data || []
      if (payload && typeof payload === 'object' && Array.isArray(payload.vaccines)) {
        payload = payload.vaccines
      }

      const list = Array.isArray(payload) ? payload : []

      const { vaccineIds: _vaccineIds, antigenNames: _antigenNames } = patientId ? await fetchPatientImmunizations(patientId) : { vaccineIds: new Set(), antigenNames: new Set() }

      const mapped = list.map(v => ({
        vaccine_id: v.vaccine_id || v.id,
        antigen_name: v.antigen_name || v.name || 'Unknown',
        disease_prevented: v.disease_prevented || '',
        manufacturer: v.manufacturer || '',
        is_nip: !!(v.is_nip || v.isNip)
      }))

      let result = mapped

      // Filter out vaccines fully completed (no remaining doses) using smart-doses endpoint
      if (patientId) {
        result = await filterByRemainingDoses(patientId, result)
      }

      vaccineCatalog.value = result
    } catch (error) {
      console.error('Error fetching vaccine catalog:', error)
      vaccineCatalog.value = []
    }
  }

  // Helper: for a list of vaccine entries, keep only those with remaining doses
  const filterByRemainingDoses = async (patientId, list) => {
    try {
      const unique = Array.from(new Set(list.map(v => v.vaccine_id).filter(Boolean)))
      // Limit checks to first 30 unique vaccines to bound network calls
      const toCheck = unique.slice(0, 30)

      // Fetch remaining info for those not in cache
      for (const vid of toCheck) {
        if (remainingCache.value[vid] === undefined) {
          try {
            const res = await api.get(`/patients/${patientId}/smart-doses`, { params: { vaccine_id: vid } })
            const data = res.data?.data || res.data || {}
            const remaining = Array.isArray(data.available_doses) ? data.available_doses.length : 0
            remainingCache.value[vid] = remaining > 0
          } catch (e) {
            console.warn('smart-doses check failed for vaccine', vid, e?.response?.data || e.message)
            // If we fail to check, keep it visible rather than accidentally hiding
            remainingCache.value[vid] = true
          }
        }
      }

      // Filter the list: only vaccines with remaining doses or unknown (default true above)
      return list.filter(v => {
        const vid = v.vaccine_id
        const hasRemaining = remainingCache.value[vid]
        return hasRemaining !== false
      })
    } catch (err) {
      console.error('filterByRemainingDoses error:', err)
      return list
    }
  }

  /**
   * Fetch patient's existing immunizations (returns sets of vaccine_ids and antigen names)
   */
  const fetchPatientImmunizations = async (patientId) => {
    try {
      if (!patientId) return { vaccineIds: new Set(), antigenNames: new Set() }
      const immRes = await api.get('/immunizations', { params: { patient_id: patientId, limit: 1000 } })
      const immData = immRes.data?.data || immRes.data || []
      const vaccineIds = new Set()
      const antigenNames = new Set()
      if (Array.isArray(immData)) {
        immData.forEach(i => {
          if (i.vaccine_id) vaccineIds.add(String(i.vaccine_id))
          const name = i.vaccine_name || i.antigen_name || i.vaccine_antigen_name || i.vaccineName || ''
          if (name) antigenNames.add(String(name).toLowerCase())
        })
      }
      return { vaccineIds, antigenNames }
    } catch (e) {
      return { vaccineIds: new Set(), antigenNames: new Set() }
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
   * Refresh vaccine sources based on current mode
   */
  const refreshVaccineSources = async (patientId = null) => {
    if (outsideMode.value) {
      await fetchVaccineCatalog(patientId)
    } else {
      await fetchVaccineInventory(patientId)
    }
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
  const onOutsideToggle = async (patientId = null) => {
    clearVaccineSelection()
    vaccineSearchTerm.value = ''
    await refreshVaccineSources(patientId)
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
  filterByRemainingDoses,
    refreshVaccineSources,
    onVaccineSearch,
    selectVaccine,
    clearVaccineSelection,
    onOutsideToggle,
    closeVaccineDropdown,
    resetServiceForm
  }
}
