<template>
  <div class="children-section">
    <h5 class="section-title">My Children</h5>
    <div v-if="children.length === 0" class="empty-state">
      <i class="bi bi-info-circle"></i>
      <p>No children found. Please contact your health center to link your children to your account.</p>
    </div>
    <div v-else class="children-list">
      <div v-for="child in children" :key="child.patient_id || child.id" class="child-card">
        <div class="child-header">
          <i class="bi bi-person-circle child-avatar"></i>
          <div class="child-info">
            <h6 class="child-name">{{ getChildName(child) }}</h6>
            <p class="child-dob">Born: {{ formatDate(getChildDOB(child)) }}</p>
          </div>
        </div>
        <div class="child-stats">
          <div class="stat-item">
            <span class="stat-label">Age</span>
            <span class="stat-value">{{ calculateAge(getChildDOB(child)) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Completed</span>
            <span class="stat-value text-success">{{ getCompletedCount(child) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Pending</span>
            <span class="stat-value text-warning">{{ getPendingCount(child) }}</span>
          </div>
        </div>
        <div v-if="child.nextVaccination" class="next-vaccine">
          <i class="bi bi-calendar-event text-primary"></i>
          <span class="next-vaccine-text">Next: <strong>{{ child.nextVaccination.name }}</strong> on {{ formatDate(child.nextVaccination.date) }}</span>
        </div>
        <div v-else class="next-vaccine all-caught-up">
          <i class="bi bi-check-circle text-success"></i>
          <span class="next-vaccine-text">All caught up!</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate, calculateAge } from '@/composables/useDateFormat'
import { getChildName, getChildDOB, getCompletedCount, getPendingCount } from '@/composables/useParentData'

defineProps({
  children: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.children-section {
  margin-top: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-state i {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #6b7280;
  font-size: 0.9375rem;
  margin: 0;
}

.children-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.child-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.child-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.child-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  padding: 1.25rem;
  border-radius: 12px 12px 0 0;
  margin: -1.25rem -1.25rem 1rem -1.25rem;
}

.child-avatar {
  font-size: 3rem;
  color: white;
}

.child-info {
  flex: 1;
}

.child-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.25rem 0;
}

.child-dob {
  font-size: 0.875rem;
  color: white;
  margin: 0;
  opacity: 0.95;
}

.child-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.stat-value.text-success {
  color: #10b981;
}

.stat-value.text-warning {
  color: #f59e0b;
}

.next-vaccine {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #eff6ff;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.next-vaccine.all-caught-up {
  background: #f0fdf4;
  border-left-color: #10b981;
}

.next-vaccine i {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.next-vaccine-text {
  font-size: 0.875rem;
  color: #374151;
  flex: 1;
}

.text-primary {
  color: #3b82f6;
}

.text-success {
  color: #10b981;
}
</style>
