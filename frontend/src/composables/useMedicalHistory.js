import { ref, computed } from 'vue'
import api from '@/services/offlineAPI'

/**
 * Composable for managing medical history data and operations
 * @param {String|Number} patientId - The patient's ID
 */
export function useMedicalHistory(patientId) {
  const visits = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Sorted visits in descending order (most recent first)
   */
  const sortedVisits = computed(() => {
    if (!visits.value || visits.value.length === 0) return []
    return [...visits.value].sort((a, b) => {
      const dateA = new Date(a.visit_date)
      const dateB = new Date(b.visit_date)
      return dateB - dateA
    })
  })

  /**
   * Fetch all visits for a patient
   * Handles pagination automatically
   */
  const fetchVisits = async (id = patientId) => {
    if (!id) {
      error.value = 'Patient ID is required'
      return
    }

    try {
      loading.value = true
      error.value = null
      const pageSize = 200
      let page = 1
      let collected = []
      let totalPages = 1

      do {
        const resp = await api.get(`/visits?patient_id=${id}&page=${page}&limit=${pageSize}`)
        const raw = resp.data
        
        // Handle different response structures
        let batch = []
        if (Array.isArray(raw)) batch = raw
        else if (Array.isArray(raw?.data)) batch = raw.data
        else if (Array.isArray(raw?.items)) batch = raw.items
        else if (Array.isArray(raw?.visits)) batch = raw.visits
        else if (Array.isArray(raw?.data?.items)) batch = raw.data.items

        collected = collected.concat(
          (batch || []).filter(v => v && (v.visit_date || v.visitDate))
        )

        totalPages = Number(raw?.totalPages || raw?.data?.totalPages || 1)
        page += 1
      } while (page <= totalPages)

      visits.value = collected
    } catch (err) {
      console.error('Error fetching medical history:', err)
      error.value = err.message || 'Failed to load medical history'
      visits.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Format date to Philippine locale
   */
  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleDateString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (e) {
      return String(dateString)
    }
  }

  /**
   * Get health worker name from visit data
   */
  const getWorkerName = (visit) => {
    if (!visit) return '—'
    
    // visits_view exposes recorded_by (users.full_name)
    if (visit.recorded_by) return visit.recorded_by
    
    // Fallbacks for any legacy shapes
    if (visit.health_worker_name) return visit.health_worker_name
    if (visit.healthWorkerName) return visit.healthWorkerName
    if (visit.worker_name) return visit.worker_name
    if (visit.workerName) return visit.workerName
    
    if (visit.worker) {
      if (typeof visit.worker === 'string') return visit.worker
      if (visit.worker.name) return visit.worker.name
      if (visit.worker.username) return visit.worker.username
    }
    
    return '—'
  }

  /**
   * Extract vitals from visit data
   * Supports multiple response structures
   */
  const getVitals = (visit) => {
    if (!visit) return null

    // Support multiple shapes from visits_view:
    // 1) Nested vital_signs object
    if (visit.vital_signs) return visit.vital_signs

    // 2) Top-level columns: height_length, weight, temperature, respiration_rate, muac
    return {
      height_length: visit?.height_length ?? visit?.height ?? null,
      weight: visit?.weight ?? null,
      temperature: visit?.temperature ?? null,
      respiration_rate: visit?.respiration_rate ?? visit?.respiration ?? null,
      muac: visit?.muac ?? null
    }
  }

  /**
   * Check if visit has any vital signs recorded
   */
  const hasVitals = (visit) => {
    const v = getVitals(visit)
    return !!(v && (v.height_length || v.weight || v.temperature || v.respiration_rate || v.muac))
  }

  /**
   * Get a specific vital sign value
   */
  const getVitalSign = (visit, key) => {
    if (!visit) return null

    const vitals = visit.vitals || visit.vital_signs || visit.vitalSigns
    if (!vitals) return null

    if (Array.isArray(vitals)) {
      const found = vitals.find(x => x.name === key || x.key === key || x.type === key)
      return found ? found.value : null
    }

    return vitals[key] || vitals[key.replace('_', '')] || null
  }

  /**
   * Check if visit has any vital signs (alternative structure)
   */
  const hasVitalSigns = (visit) => {
    if (!visit) return false
    const vitals = visit.vitals || visit.vital_signs || visit.vitalSigns || []
    return Array.isArray(vitals) 
      ? vitals.length > 0 
      : Boolean(Object.keys(vitals || {}).length)
  }

  /**
   * Truncate text to specified length
   */
  const truncateText = (text, maxLength) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return {
    // State
    visits,
    loading,
    error,
    sortedVisits,

    // Methods
    fetchVisits,
    formatDate,
    getWorkerName,
    getVitals,
    hasVitals,
    getVitalSign,
    hasVitalSigns,
    truncateText
  }
}
