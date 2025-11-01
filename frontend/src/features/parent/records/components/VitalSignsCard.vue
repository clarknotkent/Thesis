<template>
  <div class="info-card">
    <div class="card-header info">
      <i class="bi bi-heart-pulse"></i>
      <h2>Vital Signs</h2>
    </div>
    <div class="card-body">
      <div class="vitals-grid">
        <div v-if="vitals.temperature" class="vital-box">
          <div class="vital-icon">
            <i class="bi bi-thermometer-half text-danger"></i>
          </div>
          <div class="vital-content">
            <span class="vital-label">Temperature</span>
            <span class="vital-value">{{ vitals.temperature }}°C</span>
          </div>
        </div>
        <div v-if="vitals.weight" class="vital-box">
          <div class="vital-icon">
            <i class="bi bi-speedometer2 text-primary"></i>
          </div>
          <div class="vital-content">
            <span class="vital-label">Weight</span>
            <span class="vital-value">{{ vitals.weight }} kg</span>
          </div>
        </div>
        <div v-if="vitals.height" class="vital-box">
          <div class="vital-icon">
            <i class="bi bi-arrows-vertical text-info"></i>
          </div>
          <div class="vital-content">
            <span class="vital-label">Height</span>
            <span class="vital-value">{{ vitals.height }} cm</span>
          </div>
        </div>
        <div v-if="vitals.muac" class="vital-box">
          <div class="vital-icon">
            <i class="bi bi-rulers text-warning"></i>
          </div>
          <div class="vital-content">
            <span class="vital-label">MUAC</span>
            <span class="vital-value">{{ vitals.muac }} cm</span>
          </div>
        </div>
        <div v-if="vitals.respiration" class="vital-box">
          <div class="vital-icon">
            <i class="bi bi-lungs text-success"></i>
          </div>
          <div class="vital-content">
            <span class="vital-label">Respiration</span>
            <span class="vital-value">{{ vitals.respiration }} /min</span>
          </div>
        </div>
        <div v-if="vitals.heart_rate" class="vital-box">
          <div class="vital-icon">
            <i class="bi bi-heart text-danger"></i>
          </div>
          <div class="vital-content">
            <span class="vital-label">Heart Rate</span>
            <span class="vital-value">{{ vitals.heart_rate }} bpm</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  vitals: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.info-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  color: #ffffff;
  font-weight: 600;
}

.card-header.info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.card-header i {
  font-size: 1.25rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.card-body {
  padding: 16px;
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.vital-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.vital-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 8px;
}

.vital-icon i {
  font-size: 1.25rem;
}

.vital-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vital-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.vital-value {
  font-size: 0.9375rem;
  color: #111827;
  font-weight: 600;
}

.text-danger {
  color: #ef4444;
}

.text-primary {
  color: #6366f1;
}

.text-info {
  color: #3b82f6;
}

.text-warning {
  color: #f59e0b;
}

.text-success {
  color: #10b981;
}

@media (max-width: 480px) {
  .vitals-grid {
    grid-template-columns: 1fr;
  }
}
</style>
