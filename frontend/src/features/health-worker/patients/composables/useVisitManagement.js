/**
 * Composable for managing visit creation and selection in immunization records
 * Handles both creating new visits and attaching to existing visits
 */
import { ref, watch } from 'vue'
import api from '@/services/api'

export function useVisitManagement(formData) {
  // Visit selection state
  const visitMode = ref('new') // 'new' | 'existing'
  const availableVisits = ref([])
  const existingVisitId = ref('')
  const vitalsReadOnly = ref(false)
  const hideVitals = ref(false)

  /**
   * Load visits for a specific patient
   */
  const loadVisitsForPatient = async (patientId) => {
    if (!patientId) return
    
    try {
      const res = await api.get('/visits', { 
        params: { 
          patient_id: patientId, 
          page: 1, 
          limit: 10 
        } 
      })
      const payload = res.data?.items || res.data?.data?.items || res.data?.data || res.data || []
      const list = Array.isArray(payload) ? payload : (Array.isArray(payload.items) ? payload.items : [])
      availableVisits.value = list
    } catch (e) {
      console.error('Error loading visits:', e)
      availableVisits.value = []
    }
  }

  /**
   * Ensure visits are loaded when needed
   */
  const ensureVisitsLoaded = async (patientId) => {
    if (visitMode.value === 'existing' && availableVisits.value.length === 0) {
      await loadVisitsForPatient(patientId)
    }
  }

  /**
   * Format date for display
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const year = date.getFullYear()
      return `${month}/${day}/${year}`
    } catch {
      return dateStr
    }
  }

  /**
   * Watch selected existing visit and prefill/hide vitals accordingly
   */
  const setupVisitWatcher = () => {
    watch(existingVisitId, (newId) => {
      if (!newId) {
        // reset behavior when no visit selected
        vitalsReadOnly.value = false
        hideVitals.value = false
        return
      }

      const visit = availableVisits.value.find(v => String(v.visit_id) === String(newId))
      if (!visit) {
        vitalsReadOnly.value = false
        hideVitals.value = false
        return
      }

      // attempt to find vitals inside visit object in several possible shapes
      const v = visit.vitals || visit.vitalsigns || visit.vitals_data || visit.vitals_json || null
      
      if (v && (v.temperature !== undefined || v.muac !== undefined || v.weight !== undefined || v.height !== undefined || v.respiration !== undefined)) {
        // Prefill known vitals and make readonly
        if (formData?.value?.vitals) {
          formData.value.vitals.temperature = v.temperature ?? v.temp ?? formData.value.vitals.temperature
          formData.value.vitals.muac = v.muac ?? formData.value.vitals.muac
          formData.value.vitals.respiration = v.respiration ?? formData.value.vitals.respiration
          formData.value.vitals.weight = v.weight ?? formData.value.vitals.weight
          formData.value.vitals.height = v.height ?? formData.value.vitals.height
        }
        vitalsReadOnly.value = true
        hideVitals.value = false
      } else {
        // No vitals recorded on selected visit — hide vitals input
        if (formData?.value?.vitals) {
          formData.value.vitals = { 
            temperature: '', 
            muac: '', 
            respiration: '', 
            weight: '', 
            height: '' 
          }
        }
        vitalsReadOnly.value = false
        hideVitals.value = true
      }
    })
  }

  /**
   * Reset visit selection state
   */
  const resetVisitSelection = () => {
    visitMode.value = 'new'
    existingVisitId.value = ''
    vitalsReadOnly.value = false
    hideVitals.value = false
  }

  return {
    // State
    visitMode,
    availableVisits,
    existingVisitId,
    vitalsReadOnly,
    hideVitals,
    
    // Methods
    loadVisitsForPatient,
    ensureVisitsLoaded,
    formatDate,
    setupVisitWatcher,
    resetVisitSelection
  }
}
