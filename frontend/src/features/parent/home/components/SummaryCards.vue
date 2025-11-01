<template>
  <div class="summary-cards">
    <div class="summary-card">
      <div class="card-icon bg-primary">
        <i class="bi bi-people-fill"></i>
      </div>
      <div class="card-content">
        <div class="card-value">{{ totalChildren }}</div>
        <div class="card-label">My Children</div>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon bg-info">
        <i class="bi bi-calendar-check-fill"></i>
      </div>
      <div class="card-content">
        <div class="card-value">{{ dueVaccines }}</div>
        <div class="card-label">Due Vaccines</div>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon bg-success">
        <i class="bi bi-check-circle-fill"></i>
      </div>
      <div class="card-content">
        <div class="card-value">{{ completedVaccines }}</div>
        <div class="card-label">Completed</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalChildren: {
    type: Number,
    required: true
  },
  dueVaccines: {
    type: Number,
    required: true
  },
  completedVaccines: {
    type: Number,
    required: true
  }
})
</script>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
}

.card-icon.bg-primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.card-icon.bg-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.card-icon.bg-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.card-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

@media (max-width: 480px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
