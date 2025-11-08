<template>
  <div class="info-card">
    <div class="card-header info">
      <i class="bi bi-calendar-check" />
      <h2>Dose {{ doseNumber }}</h2>
      <span :class="['status-badge-small', statusClass]">
        {{ status || 'Completed' }}
      </span>
    </div>
    <div class="card-body">
      <div class="detail-item">
        <span class="detail-label">Date Administered</span>
        <span class="detail-value">{{ formattedDate }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Age at Administration</span>
        <span class="detail-value">{{ ageAtAdministration || '—' }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Administered By</span>
        <span class="detail-value">{{ administeredBy }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Facility</span>
        <span class="detail-value">{{ facility }}</span>
      </div>
      <div
        v-if="site"
        class="detail-item"
      >
        <span class="detail-label">Site</span>
        <span class="detail-value">{{ site }}</span>
      </div>
      <div
        v-if="batchNumber"
        class="detail-item"
      >
        <span class="detail-label">Batch Number</span>
        <span class="detail-value">
          <span class="batch-badge">{{ batchNumber }}</span>
        </span>
      </div>
      <div
        v-if="isOutside !== undefined"
        class="detail-item"
      >
        <span class="detail-label">Location Type</span>
        <span class="detail-value">
          <span :class="isOutside ? 'location-badge outside' : 'location-badge'">
            {{ isOutside ? 'Outside Facility' : 'In-Facility' }}
          </span>
        </span>
      </div>
      <div
        v-if="remarks"
        class="detail-item remarks-item"
      >
        <span class="detail-label">Remarks</span>
        <span class="detail-value remarks-text">{{ remarks }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  doseNumber: {
    type: [String, Number],
    required: true
  },
  status: {
    type: String,
    default: 'Completed'
  },
  statusClass: {
    type: String,
    default: 'status-completed'
  },
  formattedDate: {
    type: String,
    required: true
  },
  ageAtAdministration: {
    type: String,
    default: '—'
  },
  administeredBy: {
    type: String,
    required: true
  },
  facility: {
    type: String,
    required: true
  },
  site: {
    type: String,
    default: ''
  },
  batchNumber: {
    type: String,
    default: ''
  },
  isOutside: {
    type: Boolean,
    default: undefined
  },
  remarks: {
    type: String,
    default: ''
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

.card-header.info {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
}

.card-header i {
  font-size: 1.5rem;
}

.card-header h2 {
  font-size: 1.125rem;
  margin: 0;
  flex: 1;
}

.status-badge-small {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-completed {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-scheduled {
  background: #dbeafe;
  color: #1e40af;
}

.status-default {
  background: #f3f4f6;
  color: #6b7280;
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

.batch-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  color: #374151;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  border: 1px solid #e5e7eb;
}

.location-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
}

.location-badge.outside {
  background: #fef3c7;
  color: #92400e;
}

.remarks-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.remarks-text {
  text-align: left;
  color: #6b7280;
  font-weight: 400;
  font-style: italic;
  line-height: 1.5;
}
</style>
