<template>
  <div class="info-card">
    <div class="card-header primary">
      <i class="bi bi-shield-fill-check" />
      <h2>Vaccine Information</h2>
    </div>
    <div class="card-body">
      <div class="detail-item">
        <span class="detail-label">Vaccine Name</span>
        <span class="detail-value">{{ vaccineName }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Disease Prevented</span>
        <span class="detail-value">{{ diseasePrevented || '—' }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Total Doses Administered</span>
        <span class="detail-value">
          <span class="dose-badge">{{ totalDoses }} {{ totalDoses === 1 ? 'Dose' : 'Doses' }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  vaccineName: {
    type: String,
    required: true
  },
  diseasePrevented: {
    type: String,
    default: '—'
  },
  totalDoses: {
    type: Number,
    required: true
  }
})
</script>

<style scoped>
.info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1rem;
  overflow: hidden;
}

.card-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: white;
}

.card-header.primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.card-header i {
  font-size: 1.5rem;
}

.card-header h2 {
  font-size: 1.125rem;
  margin: 0;
  flex: 1;
}

.card-body {
  padding: 1.25rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.875rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  flex-shrink: 0;
  margin-right: 1rem;
}

.detail-value {
  font-size: 0.9375rem;
  color: #111827;
  font-weight: 500;
  text-align: right;
  flex: 1;
}

.dose-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
