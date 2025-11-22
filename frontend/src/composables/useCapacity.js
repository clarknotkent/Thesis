import { ref } from 'vue'
import api from '@/services/api'

export function useCapacity() {
  const loading = ref(false)
  const error = ref(null)

  /**
   * Get capacity for a specific date
   */
  const getCapacityForDate = async (date) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/capacity/date/${date}`)
      return response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch capacity'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get capacity for a date range
   */
  const getCapacityRange = async (startDate, endDate) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/capacity/range', {
        params: { start: startDate, end: endDate }
      })
      return response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch capacity range'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update capacity limits for a date
   */
  const updateCapacityLimits = async (date, amCapacity, pmCapacity, notes = null) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.put('/capacity/limits', {
        date,
        amCapacity,
        pmCapacity
      })
      
      // Update notes separately if provided
      if (notes !== null) {
        await api.put('/api/capacity/notes', {
          date,
          notes
        })
      }
      
      return response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update capacity'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get available time slot for a date
   */
  const getAvailableSlot = async (date) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/capacity/available-slot/${date}`)
      return response.data.data.slot
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get available slot'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Find next available date and slot
   */
  const findNextAvailable = async (startDate) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/capacity/next-available', {
        params: { start: startDate }
      })
      return response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to find next available slot'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get list of patients scheduled for a date/slot
   */
  const getScheduledPatients = async (date, slot = null) => {
    loading.value = true
    error.value = null
    try {
      const url = slot 
        ? `/capacity/patients/${date}/${slot}`
        : `/capacity/patients/${date}`
      
      const response = await api.get(url)
      return response.data.data.patients
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch scheduled patients'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get capacity statistics for a date range
   */
  const getCapacityStats = async (startDate, endDate) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/capacity/stats', {
        params: { start: startDate, end: endDate }
      })
      return response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch capacity stats'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Recalculate capacity from actual schedules
   */
  const recalculateCapacity = async (date) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/capacity/recalculate/${date}`)
      return response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to recalculate capacity'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    getCapacityForDate,
    getCapacityRange,
    updateCapacityLimits,
    getAvailableSlot,
    findNextAvailable,
    getScheduledPatients,
    getCapacityStats,
    recalculateCapacity
  }
}
