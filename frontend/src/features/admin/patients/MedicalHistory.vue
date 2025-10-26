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
  // Navigate to visit summary page
  router.push(`/admin/patients/${props.patientId}/visits/${id}`)
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
