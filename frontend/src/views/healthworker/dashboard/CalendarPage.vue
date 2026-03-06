<template>
  <HealthWorkerLayout>
    <div class="calendar-page">
      <div class="calendar-page-header">
        <button
          class="back-btn"
          @click="goBack"
        >
          <i class="bi bi-arrow-left" />
        </button>
        <h4 class="page-title">
          Vaccination Calendar
        </h4>
      </div>

      <div class="calendar-placeholder">
        <i class="bi bi-calendar3 placeholder-icon" />
        <h5>Full Calendar View</h5>
        <p class="placeholder-text">
          The full scheduling calendar will be displayed here.
        </p>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'

const router = useRouter()

function goBack() {
  router.push({ name: 'HealthWorkerDashboard' })
}
</script>

<style scoped>
.calendar-page {
  padding: 1rem;
}

.calendar-page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e5e7eb;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.calendar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: #f9fafb;
  border-radius: 16px;
  border: 2px dashed #d1d5db;
  text-align: center;
  color: #6b7280;
}

.placeholder-icon {
  font-size: 4rem;
  color: #007bff;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.calendar-placeholder h5 {
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.5rem;
}

.placeholder-text {
  font-size: 0.9375rem;
  margin: 0;
}
</style>
