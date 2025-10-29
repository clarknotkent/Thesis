<template>
  <div class="schedule-card">
    <div class="card-content">
      <div class="date-section">
        <div class="date-badge" :class="statusClass">
          <div class="date-day">{{ formattedDay }}</div>
          <div class="date-month">{{ formattedMonth }}</div>
        </div>
      </div>
      <div class="vaccine-section">
        <h3 class="vaccine-name">{{ vaccineName }}</h3>
        <div class="vaccine-details">
          <div class="detail-item">
            <i class="bi bi-capsule"></i>
            <span>Dose {{ dose }}</span>
          </div>
          <div class="detail-item">
            <i class="bi bi-calendar-event"></i>
            <span>{{ fullFormattedDate }}</span>
          </div>
          <div v-if="recommendedAge" class="detail-item">
            <i class="bi bi-info-circle"></i>
            <span>Recommended: {{ recommendedAge }}</span>
          </div>
        </div>
        <div class="status-badge" :class="statusClass">
          {{ statusText }}
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
  dose: {
    type: [String, Number],
    default: 1
  },
  scheduledDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'upcoming'
  },
  recommendedAge: {
    type: String,
    default: ''
  }
})

const scheduleDate = computed(() => new Date(props.scheduledDate))

const formattedDay = computed(() => {
  return scheduleDate.value.getDate()
})

const formattedMonth = computed(() => {
  return scheduleDate.value.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
})

const fullFormattedDate = computed(() => {
  return scheduleDate.value.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const statusText = computed(() => {
  const status = (props.status || 'upcoming').toLowerCase()
  
  if (status === 'completed' || status === 'administered') return 'Completed'
  if (status === 'overdue') return 'Overdue'
  if (status === 'upcoming') {
    const today = new Date()
    const daysDiff = Math.ceil((scheduleDate.value - today) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0) return 'Today'
    if (daysDiff === 1) return 'Tomorrow'
    if (daysDiff > 0 && daysDiff <= 7) return `In ${daysDiff} days`
    return 'Upcoming'
  }
  
  return 'Scheduled'
})

const statusClass = computed(() => {
  const status = (props.status || 'upcoming').toLowerCase()
  
  if (status === 'completed' || status === 'administered') return 'status-completed'
  if (status === 'overdue') return 'status-overdue'
  
  // Check if today or soon
  const today = new Date()
  const daysDiff = Math.ceil((scheduleDate.value - today) / (1000 * 60 * 60 * 24))
  
  if (daysDiff === 0) return 'status-today'
  if (daysDiff > 0 && daysDiff <= 7) return 'status-soon'
  
  return 'status-upcoming'
})
</script>

<style scoped>
.schedule-card {
  background: #ffffff;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.schedule-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}

.date-section {
  flex-shrink: 0;
}

.date-badge {
  width: 70px;
  height: 70px;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.date-day {
  font-size: 1.75rem;
  line-height: 1;
  margin-bottom: 0.125rem;
}

.date-month {
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

.vaccine-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.vaccine-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vaccine-details {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.detail-item i {
  font-size: 1rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  align-self: flex-start;
}

/* Date Badge Status Colors */
.date-badge.status-completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.date-badge.status-overdue {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.date-badge.status-today {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.date-badge.status-soon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.date-badge.status-upcoming {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

/* Status Badge Colors */
.status-badge.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.status-overdue {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.status-today {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-soon {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.status-upcoming {
  background: #ede9fe;
  color: #5b21b6;
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .card-content {
    padding: 0.875rem;
  }

  .date-badge {
    width: 60px;
    height: 60px;
  }

  .date-day {
    font-size: 1.5rem;
  }

  .date-month {
    font-size: 0.6875rem;
  }

  .vaccine-name {
    font-size: 0.9375rem;
  }

  .detail-item {
    font-size: 0.75rem;
  }

  .detail-item i {
    font-size: 0.875rem;
  }

  .status-badge {
    font-size: 0.6875rem;
    padding: 0.25rem 0.625rem;
  }
}
</style>
