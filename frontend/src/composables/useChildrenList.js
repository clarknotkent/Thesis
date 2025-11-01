/**
 * Shared Children List Composable
 * Used by ParentRecords.vue and ParentSchedule.vue
 * Eliminates duplicate fetch/map logic
 */

import { ref } from 'vue'
import api from '@/services/api'
import { normalizeChildData } from './useParentData'

export function useChildrenList() {
  const loading = ref(true)
  const error = ref(null)
  const children = ref([])

  /**
   * Fetch children from the parent/children endpoint
   */
  const fetchChildren = async () => {
    try {
      loading.value = true
      error.value = null
      
      // Use the parent-specific endpoint that handles auth internally
      const response = await api.get('/parent/children')
      const patients = response.data?.data || response.data || []
      
      // Normalize the data using useParentData helpers
      children.value = patients.map(child => normalizeChildData(child))
    } catch (err) {
      console.error('Error fetching children:', err)
      error.value = err.response?.data?.message || 'Failed to load children. Please try again later.'
      children.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh children data
   */
  const refetch = async () => {
    await fetchChildren()
  }

  /**
   * Clear children data
   */
  const clear = () => {
    children.value = []
    error.value = null
    loading.value = false
  }

  return {
    loading,
    error,
    children,
    fetchChildren,
    refetch,
    clear
  }
}
