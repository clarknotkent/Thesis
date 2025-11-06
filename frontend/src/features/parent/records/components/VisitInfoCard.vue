<template>
  <div class="info-card">
    <div class="card-header primary">
      <i class="bi bi-clipboard-data" />
      <h2>Visit Information</h2>
    </div>
    <div class="card-body">
      <div class="info-item">
        <div class="info-icon">
          <i class="bi bi-person-circle text-primary" />
        </div>
        <div class="info-content">
          <span class="info-label">Patient</span>
          <span class="info-value">{{ patientName }}</span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon">
          <i class="bi bi-calendar-event text-success" />
        </div>
        <div class="info-content">
          <span class="info-label">Visit Date</span>
          <span class="info-value">{{ formattedVisitDate }}</span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon">
          <i class="bi bi-person-badge text-info" />
        </div>
        <div class="info-content">
          <span class="info-label">Health Staff</span>
          <span class="info-value">{{ healthStaffName }}</span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon">
          <i :class="hasOutsideServices ? 'bi bi-house-door text-warning' : 'bi bi-building text-secondary'" />
        </div>
        <div class="info-content">
          <span class="info-label">Service Location</span>
          <span :class="hasOutsideServices ? 'badge bg-warning text-dark' : 'badge bg-secondary'">
            {{ hasOutsideServices ? 'Outside Facility' : 'In-Facility' }}
          </span>
        </div>
      </div>
      <div
        v-if="findings"
        class="info-item findings"
      >
        <div class="info-icon">
          <i class="bi bi-journal-text text-info" />
        </div>
        <div class="info-content">
          <span class="info-label">Clinical Findings</span>
          <p class="findings-text">
            {{ findings }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  patientName: {
    type: String,
    required: true
  },
  formattedVisitDate: {
    type: String,
    required: true
  },
  healthStaffName: {
    type: String,
    required: true
  },
  hasOutsideServices: {
    type: Boolean,
    default: false
  },
  findings: {
    type: String,
    default: ''
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

.card-header.primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
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

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item.findings {
  flex-direction: column;
  align-items: flex-start;
}

.info-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 8px;
}

.info-icon i {
  font-size: 1.25rem;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  color: #111827;
  font-weight: 500;
}

.findings-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
  margin: 8px 0 0 0;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #6366f1;
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

.bg-secondary {
  background-color: #6b7280;
}

.text-dark {
  color: #111827;
}

.text-primary {
  color: #6366f1;
}

.text-success {
  color: #10b981;
}

.text-info {
  color: #3b82f6;
}

.text-warning {
  color: #f59e0b;
}
</style>
