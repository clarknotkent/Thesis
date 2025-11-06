<template>
  <div class="info-card">
    <div class="card-header success">
      <i class="bi bi-shield-fill-check" />
      <h2>Services Provided</h2>
    </div>
    <div class="card-body">
      <div
        v-for="(service, idx) in services"
        :key="idx"
        class="service-item"
      >
        <div class="service-header">
          <i class="bi bi-syringe-fill service-icon" />
          <span class="service-name">{{ service.vaccine_name || service.antigen_name }}</span>
        </div>
        <div class="service-details">
          <div class="service-detail">
            <span class="detail-label">Dose</span>
            <span class="detail-value">{{ service.dose_number }}</span>
          </div>
          <div
            v-if="service.outside"
            class="service-detail"
          >
            <span class="badge bg-warning text-dark">Outside Facility</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  services: {
    type: Array,
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

.card-header.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

.service-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 3px solid #10b981;
}

.service-item:last-child {
  margin-bottom: 0;
}

.service-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.service-icon {
  color: #10b981;
  font-size: 1.125rem;
}

.service-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
}

.service-details {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.service-detail {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
  padding: 2px 8px;
  background: #ffffff;
  border-radius: 4px;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bg-warning {
  background-color: #fbbf24;
}

.text-dark {
  color: #111827;
}
</style>
