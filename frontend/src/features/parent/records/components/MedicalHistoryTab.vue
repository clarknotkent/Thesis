<template>
  <div class="tab-content">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <div class="spinner" />
      <p>Loading medical history...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="medicalHistory.length === 0"
      class="empty-state"
    >
      <i class="bi bi-clipboard2-pulse empty-icon" />
      <p class="empty-text">
        No medical history found
      </p>
    </div>

    <!-- Medical History List -->
    <div
      v-else
      class="history-list"
    >
      <ParentMedicalHistoryCard
        v-for="(visit, index) in medicalHistory"
        :key="visit.visit_id || index"
        :visit-id="visit.visit_id"
        :visit-date="visit.visit_date"
        :service-rendered="visit.service_rendered || 'General Checkup'"
        :recorded-by="visit.recorded_by || visit.recorded_by_name || visit.recorded_by_user || visit.health_worker_name || '—'"
        :vitals="{
          weight: visit.weight,
          height: visit.height,
          temperature: visit.temperature,
          heart_rate: visit.heart_rate,
          respiratory_rate: visit.respiratory_rate,
          blood_pressure: visit.blood_pressure
        }"
        :immunizations="visit.immunizations || []"
        :findings="visit.findings"
        :initial-expanded="index === 0"
        :patient-id="patientId"
      />
    </div>
  </div>
</template>

<script setup>
import ParentMedicalHistoryCard from '@/components/parent/ParentMedicalHistoryCard.vue'

defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  medicalHistory: {
    type: Array,
    required: true
  },
  patientId: {
    type: [String, Number],
    required: true
  }
})
</script>

<style scoped>
.tab-content {
  padding: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
