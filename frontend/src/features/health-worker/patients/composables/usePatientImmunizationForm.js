/**
 * Composable for managing patient immunization record form data
 * Handles form state, patient loading, and service management
 */
import { ref, computed } from 'vue'
import api from '@/services/api'
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
   */
  const fetchPatients = async () => {
    try {
      loading.value = true
      const response = await api.get('/patients')
      patients.value = response.data.data || response.data || []
      
      // Find and set the current patient
      if (formData.value.patient_id) {
        currentPatient.value = patients.value.find(p => p.id === formData.value.patient_id)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      throw new Error('Failed to load patients. Please refresh the page.')
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch current patient by ID
   */
  const fetchCurrentPatient = async () => {
    if (!formData.value.patient_id) return
    
    try {
      loading.value = true
      const response = await api.get(`/patients/${formData.value.patient_id}`)
      currentPatient.value = response.data.data || response.data
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
      services: addedServices.value.map(s => ({
        inventory_id: s.inventoryId,
        vaccine_id: s.vaccineId,
        vaccine_name: s.vaccineName,
        disease_prevented: s.diseasePrevented,
        dose_number: s.doseNumber,
        date_administered: s.dateAdministered,
        age_at_admin: s.ageAtAdmin,
        manufacturer: s.manufacturer,
        lot_number: s.lotNumber,
        site: s.site,
        health_staff: s.healthStaff,
        facility_name: s.facilityName,
        outside_facility: s.outsideFacility,
        remarks: s.remarks
      }))
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
