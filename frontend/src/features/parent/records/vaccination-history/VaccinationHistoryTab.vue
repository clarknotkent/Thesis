<template>
  <div class="tab-content">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-container"
    >
      <div
        class="spinner-border text-primary"
        role="status"
      >
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Vaccination Accordion List -->
    <div
      v-else-if="groupedVaccinations.length > 0"
      class="vaccination-accordion-list"
    >
      <ParentVaccinationRecordCard
        v-for="(group, index) in groupedVaccinations"
        :key="group.vaccineName"
        :vaccine-name="group.vaccineName"
        :doses="group.doses"
        :initial-expanded="index === 0"
        :patient-id="patientId"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="empty-state"
    >
      <i class="bi bi-shield-exclamation empty-icon" />
      <h4 class="empty-title">
        No Vaccination Records
      </h4>
      <p class="empty-text">
        This child has no vaccination history yet.
      </p>
    </div>
  </div>
</template>

<script setup>
import ParentVaccinationRecordCard from '@/components/parent/ParentVaccinationRecordCard.vue'

defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  groupedVaccinations: {
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

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.vaccination-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}
</style>
