import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useActivityLogStore = defineStore('activityLog', () => {
  const selectedLog = ref(null)

  const setSelectedLog = (log) => {
    selectedLog.value = log || null
  }

  const clearSelectedLog = () => {
    selectedLog.value = null
  }

  return { selectedLog, setSelectedLog, clearSelectedLog }
})
