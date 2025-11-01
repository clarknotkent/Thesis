<template>
  <div class="medical-history">
    <MedicalHistoryTable
      :visits="sortedVisits"
      :loading="loading"
      :format-date="formatDate"
      :get-worker-name="getWorkerName"
      :get-vitals="getVitals"
      :has-vitals="hasVitals"
      :truncate-text="truncateText"
      @select-visit="openVisitDetails"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMedicalHistory } from '@/composables/useMedicalHistory'
import MedicalHistoryTable from './components/MedicalHistoryTable.vue'

const router = useRouter()

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  }
})

const {
  sortedVisits,
  loading,
  fetchVisits,
  formatDate,
  getWorkerName,
  getVitals,
  hasVitals,
  truncateText
} = useMedicalHistory(props.patientId)

const openVisitDetails = (visit) => {
  const id = String(visit.visit_id || visit.id || '')
  if (!id) return
  // Navigate to admin visit summary page (by named route to avoid path typos and name collisions)
  router.push({
    name: 'AdminVisitSummary',
    params: { patientId: String(props.patientId), visitId: id }
  })
}

onMounted(() => {
  fetchVisits()
})
</script>

<style scoped>
.medical-history {
  min-height: 200px;
}
</style>
