<template>
  <div
    class="scheduled-vaccine-card"
    :class="{ 'clickable': editable }"
    role="button"
    :aria-disabled="!editable"
    @click="handleClick"
  >
    <div class="card-content">
      <!-- Vaccine Icon and Name -->
      <div class="vaccine-header">
        <div class="vaccine-icon-container">
          <i class="bi bi-calendar-check vaccine-icon" />
        </div>
        <div class="vaccine-info">
          <h3 class="vaccine-name">
            {{ vaccineName }}
          </h3>
          <span class="dose-badge">{{ doseLabel }}</span>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Scheduled Date</span>
          <span class="detail-value">{{ formattedDate }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span :class="['status-badge', statusClass]">{{ status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  vaccineName: {
    type: String,
    required: true
  },
  // whether this schedule can be edited (clickable)
  editable: {
    type: Boolean,
    default: true
  },
  dose: {
    type: [String, Number],
    default: ''
  },
  scheduledDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'Scheduled'
  }
})

const doseLabel = computed(() => {
  if (!props.dose) return 'Dose'
  return `Dose ${props.dose}`
})

const formattedDate = computed(() => {
  if (!props.scheduledDate) return '—'
  return new Date(props.scheduledDate).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const statusClass = computed(() => {
  const status = props.status?.toLowerCase() || ''
  if (status === 'completed' || status === 'administered') return 'status-completed'
  if (status === 'due') return 'status-due'
  if (status === 'overdue') return 'status-overdue'
  if (status === 'scheduled') return 'status-scheduled'
  if (status === 'rescheduled') return 'status-rescheduled'
  return 'status-pending'
})

const emit = defineEmits(['select'])

const handleClick = () => {
  if (!props.editable) return
  emit('select')
}
</script>

<style scoped>
.scheduled-vaccine-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Vaccine Header */
.vaccine-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.vaccine-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.vaccine-icon {
  font-size: 1.5rem;
  color: #ffffff;
}

.vaccine-info {
  flex: 1;
  min-width: 0;
}

.vaccine-name {
  font-size: 1.0625rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.dose-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Details Grid */
.details-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
  text-align: right;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.status-due {
  background: #fef3c7;
  color: #92400e;
}

.status-overdue {
  background: #fee2e2;
  color: #991b1b;
}

.status-scheduled {
  background: #dbeafe;
  color: #1e40af;
}

.status-rescheduled {
  background: #e0e7ff;
  color: #4338ca;
}

.status-pending {
  background: #f3f4f6;
  color: #4b5563;
}

.scheduled-vaccine-card.clickable {
  cursor: pointer;
  transition: transform 0.08s ease-in-out, box-shadow 0.08s;
}
.scheduled-vaccine-card.clickable:active {
  transform: translateY(1px);
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .card-content {
    padding: 1rem;
  }

  .vaccine-name {
    font-size: 1rem;
  }

  .vaccine-icon-container {
    width: 42px;
    height: 42px;
  }

  .vaccine-icon {
    font-size: 1.25rem;
  }

  .detail-label,
  .detail-value {
    font-size: 0.8125rem;
  }
}
</style>
