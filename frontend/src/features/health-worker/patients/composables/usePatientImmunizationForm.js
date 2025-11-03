/**
 * Composable for managing patient immunization record form data
 * Handles form state, patient loading, and service management
 * 
 * OFFLINE-FIRST ARCHITECTURE:
 * All immunization saves go to local Dexie database first, then sync to Supabase via syncService
 */
import { ref, computed } from 'vue'
import api from '@/services/offlineAPI'
import db from '@/services/offline/db'
import { getCurrentPHDate } from '@/utils/dateUtils'
import { getUser, getUserId, getRole } from '@/services/auth'

export function usePatientImmunizationForm(patientId) {
  // Loading states
  const loading = ref(false)
  const submitting = ref(false)

  // Patient data
  const patients = ref([])
  const currentPatient = ref(null)

  // Current user context
  const currentUser = ref(getUser())
  const currentUserId = ref(getUserId())
  const currentRole = ref(getRole())
  const hsType = computed(() => String(currentUser.value?.hs_type || currentUser.value?.type || '').toLowerCase())
  const isBHS = computed(() => hsType.value === 'bhs')
  const isNurseOrNutritionist = computed(() => ['nurse', 'nutritionist'].some(t => hsType.value.includes(t)))

  // Service form state
  const showServiceForm = ref(false)
  const addedServices = ref([])
  const editingServiceIndex = ref(null)

  // Form data
  const formData = ref({
    patient_id: patientId || '',
    vitals: {
      temperature: '',
      muac: '',
      respiration: '',
      weight: '',
      height: ''
    },
    findings: '',
    service_rendered: ''
  })

  /**
   * Fetch all patients
   * OFFLINE-FIRST: Read from local Dexie database
   */
  const fetchPatients = async () => {
    try {
      loading.value = true
      // Read from Dexie patients table
      const localPatients = await db.patients.toArray()
      patients.value = localPatients || []
      
      // Find and set the current patient
      if (formData.value.patient_id) {
        currentPatient.value = patients.value.find(p => p.id === formData.value.patient_id)
      }
      
      console.log('✅ Loaded patients from Dexie:', patients.value.length)
    } catch (error) {
      console.error('Error fetching patients:', error)
      throw new Error('Failed to load patients. Please refresh the page.')
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch current patient by ID
   * OFFLINE-FIRST: Read from local Dexie database
   */
  const fetchCurrentPatient = async () => {
    if (!formData.value.patient_id) return
    
    try {
      loading.value = true
      // Query Dexie patients table by ID
      const patient = await db.patients.get(formData.value.patient_id)
      currentPatient.value = patient || null
      
      if (!patient) {
        throw new Error('Patient not found in local database')
      }
      
      console.log('✅ Loaded patient from Dexie:', patient.id)
    } catch (error) {
      console.error('Error fetching patient:', error)
      throw new Error('Failed to load patient information.')
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle service form visibility
   */
  const toggleServiceForm = () => {
    showServiceForm.value = !showServiceForm.value
  }

  /**
   * Add service to the list
   */
  const addService = (service) => {
    if (editingServiceIndex.value !== null) {
      // Update existing service
      addedServices.value[editingServiceIndex.value] = { ...service }
      editingServiceIndex.value = null
    } else {
      // Add new service
      addedServices.value.push({ ...service })
    }
    
    // Update service_rendered summary
    updateServiceRendered()
  }

  /**
   * Edit an existing service
   */
  const editService = (index) => {
    editingServiceIndex.value = index
    showServiceForm.value = true
    return addedServices.value[index]
  }

  /**
   * Remove a service from the list
   */
  const removeService = (index) => {
    addedServices.value.splice(index, 1)
    updateServiceRendered()
  }

  /**
   * Update service_rendered summary based on added services
   */
  const updateServiceRendered = () => {
    const vaccines = addedServices.value
      .map(s => `${s.vaccineName}${s.doseNumber ? ` (Dose ${s.doseNumber})` : ''}`)
      .join(', ')
    
    formData.value.service_rendered = vaccines || 'Immunization'
  }

  /**
   * Update findings based on added services
   */
  const updateFindings = () => {
    if (addedServices.value.length === 0) {
      formData.value.findings = ''
      return
    }

    const findingsList = addedServices.value.map(s => {
      let finding = `Administered ${s.vaccineName}`
      if (s.doseNumber) finding += ` (Dose ${s.doseNumber})`
      if (s.site) finding += ` at ${s.site}`
      if (s.dateAdministered) finding += ` on ${s.dateAdministered}`
      return finding
    })

    formData.value.findings = findingsList.join('. ') + '.'
  }

  /**
   * Validate form data before submission
   */
  const validateForm = () => {
    const errors = []

    // Validate patient selection
    if (!formData.value.patient_id) {
      errors.push('Please select a patient')
    }

    // Validate services
    if (addedServices.value.length === 0) {
      errors.push('Please add at least one vaccine service')
    }

    // Validate each service
    addedServices.value.forEach((service, index) => {
      if (!service.vaccineId) {
        errors.push(`Service ${index + 1}: Vaccine is required`)
      }
      if (!service.dateAdministered) {
        errors.push(`Service ${index + 1}: Date administered is required`)
      }
      // If service is in-facility, require an inventory/lot selection
      const isOutside = !!(service.outsideFacility || service.outside_facility)
      if (!isOutside && !(service.inventoryId || service.inventory_id)) {
        errors.push(`Service ${index + 1}: Lot / inventory selection is required for in-facility vaccines`)
      }
    })

    return errors
  }

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    formData.value = {
      patient_id: patientId || '',
      vitals: {
        temperature: '',
        muac: '',
        respiration: '',
        weight: '',
        height: ''
      },
      findings: '',
      service_rendered: ''
    }
    addedServices.value = []
    editingServiceIndex.value = null
    showServiceForm.value = false
  }

  /**
   * Prepare form data for submission
   */
  const prepareSubmissionData = (visitId = null) => {
    return {
      patient_id: formData.value.patient_id,
      visit_id: visitId,
      vitals: formData.value.vitals,
      findings: formData.value.findings,
      service_rendered: formData.value.service_rendered,
      services: addedServices.value.map(s => {
        // Normalize and convert empty strings to null where appropriate
        const outsideFacility = !!(s.outsideFacility || s.outside_facility)
        // If outside facility, force inventory fields to null
        const inventoryIdRaw = s.inventoryId || s.inventory_id || null
        const inventoryId = outsideFacility ? null : inventoryIdRaw
        // Vaccine ID is required in both modes (outside: must still reference vaccine master)
        const vaccineId = (s.vaccineId || s.vaccine_id) ? Number(s.vaccineId || s.vaccine_id) : null
        const doseNumber = s.doseNumber ? Number(s.doseNumber) : null
        // Ensure date is in YYYY-MM-DD format if possible
        let dateAdmin = s.dateAdministered || s.date_administered || null
        if (dateAdmin) {
          try {
            const d = new Date(dateAdmin)
            if (!isNaN(d.getTime())) dateAdmin = d.toISOString().slice(0,10)
          } catch (e) {
            // leave as-is
          }
        }

        return {
          // Fields expected by the backend (match faith/Thesis flow)
          inventory_id: inventoryId,
          vaccine_id: vaccineId,
          vaccine_name: s.vaccineName || s.vaccine_name || null,
          disease_prevented: s.diseasePrevented || s.disease_prevented || null,
          dose_number: doseNumber,
          // backend expects 'administered_date' for immunization
          administered_date: dateAdmin,
          // backend expects 'age_at_administration'
          age_at_administration: s.ageAtAdmin || s.age_at_admin || null,
          manufacturer: s.manufacturer || null,
          // Lot number can be provided for both modes (outside entries may carry external lot info)
          lot_number: s.lotNumber || s.lot_number || null,
          site: s.site || null,
          // who administered (use current user id by default)
          administered_by: currentUserId.value || s.healthStaff || s.administered_by || null,
          // Facility name (source facility for outside, internal for in-facility)
          facility_name: s.facilityName || s.facility_name || null,
          // keep a boolean 'outside' flag as faith uses
          outside: outsideFacility,
          // Auto-concatenate useful fields into remarks
          remarks: (() => {
            const base = s.remarks || s.note || ''
            const parts = []
            // Always add Lot and Manufacturer when provided
            const lot = s.lotNumber || s.lot_number
            if (lot) parts.push(`Lot: ${lot}`)
            const manuf = s.manufacturer
            if (manuf) parts.push(`Manufacturer: ${manuf}`)
            // Outside-specific context
            if (outsideFacility) {
              if (s.site) parts.push(`Site: ${s.site}`)
              const fac = s.facilityName || s.facility_name
              if (fac) parts.push(`Facility: ${fac}`)
              const adminName = s.healthStaff || s.administered_by_name
              if (adminName) parts.push(`Administered by: ${adminName}`)
            }
            if (base && parts.length) return `${base} | ${parts.join(' | ')}`
            if (!base && parts.length) return parts.join(' | ')
            return base || null
          })()
        }
      })
    }
  }

  return {
    // State
    loading,
    submitting,
    patients,
    currentPatient,
    currentUser,
    currentUserId,
    currentRole,
    formData,
    showServiceForm,
    addedServices,
    editingServiceIndex,
    
    // Computed
    hsType,
    isBHS,
    isNurseOrNutritionist,
    
    // Methods
    fetchPatients,
    fetchCurrentPatient,
    toggleServiceForm,
    addService,
    editService,
    removeService,
    updateServiceRendered,
    updateFindings,
    validateForm,
    resetForm,
    prepareSubmissionData
  }
}
