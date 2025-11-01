<template>
  <div class="medical-history-card" @click="handleNavigate">
    <!-- Card Header (Always Visible - Collapsed State) -->
    <div class="card-header">
      <div class="header-content">
        <div class="header-icon">
          <i class="bi bi-clipboard2-pulse"></i>
        </div>
        <div class="header-info">
          <h3 class="visit-date">{{ formattedDate }}</h3>
          <p class="service-type">{{ serviceRendered }}</p>
        </div>
      </div>
      <div class="chevron-icon">
        <i class="bi bi-chevron-right"></i>
      </div>
    </div>

    <!-- Brief Summary (Always Visible) -->
    <div class="card-preview">
      <!-- Recorded By -->
      <div class="preview-item">
        <i class="bi bi-person-badge"></i>
        <span :title="displayedRecordedBy" :aria-label="`Recorded by ${displayedRecordedBy}`">{{ displayedRecordedBy || '—' }}</span>
      </div>

      <!-- Summary -->
      <div class="preview-item">
        <i class="bi bi-info-circle"></i>
        <span>
          <span v-if="hasVitals">{{ vitalsSummary }}</span>
          <span v-if="hasVitals && hasImmunizations"> • </span>
          <span v-if="hasImmunizations">{{ immunizationsSummary }}</span>
          <span v-if="!hasVitals && !hasImmunizations">No additional details</span>
        </span>
      </div>

      <!-- Tap Hint -->
      <div class="tap-hint">
        <span>Tap to view full visit summary</span>
        <i class="bi bi-chevron-right"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  visitDate: {
    type: String,
    required: true
  },
  visitId: {
    type: [String, Number],
    required: true
  },
  serviceRendered: {
    type: String,
    default: 'General Checkup'
  },
  recordedBy: {
    type: String,
    default: '—'
  },
  recorded_by: {
    type: String,
    default: ''
  },
  vitals: {
    type: Object,
    default: () => ({})
  },
  immunizations: {
    type: Array,
    default: () => []
  },
  findings: {
    type: String,
    default: ''
  },
  initialExpanded: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: [String, Number],
    required: true
  }
})

const router = useRouter()

const formattedDate = computed(() => {
  if (!props.visitDate) return '—'
  return new Date(props.visitDate).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const hasVitals = computed(() => {
  return Object.keys(props.vitals).some(key => props.vitals[key])
})

const hasImmunizations = computed(() => {
  return props.immunizations && props.immunizations.length > 0
})

const vitalsSummary = computed(() => {
  const vitalsCount = Object.keys(props.vitals).filter(key => props.vitals[key]).length
  return `${vitalsCount} vital${vitalsCount !== 1 ? 's' : ''} recorded`
})

const immunizationsSummary = computed(() => {
  const count = props.immunizations?.length || 0
  return `${count} vaccine${count !== 1 ? 's' : ''} administered`
})

const displayedRecordedBy = computed(() => {
  // Accept either camelCase `recordedBy` or snake_case `recorded_by` from parent
  return props.recordedBy || props.recorded_by || '—'
})

const handleNavigate = () => {
  router.push(`/parent/records/${props.patientId}/visit/${props.visitId}`)
}
</script>

<style scoped>
.medical-history-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.medical-history-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.medical-history-card:active {
  transform: translateY(0);
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.625rem;
  flex-shrink: 0;
}

.header-icon i {
  font-size: 1.5rem;
  color: #ffffff;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.visit-date {
  font-size: 1.0625rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.service-type {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 500;
}

.chevron-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #ffffff;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.chevron-icon i {
  font-size: 1.25rem;
}

.medical-history-card:hover .chevron-icon {
  transform: translateX(4px);
}

/* Card Preview */
.card-preview {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  background: #ffffff;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.preview-item i {
  font-size: 1rem;
  color: #007bff;
  flex-shrink: 0;
}

.preview-item span {
  flex: 1;
  line-height: 1.5;
}

/* Tap Hint */
.tap-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f0f7ff;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #007bff;
  font-weight: 500;
  margin-top: 0.5rem;
}

.tap-hint i {
  font-size: 1rem;
  transition: transform 0.2s ease;
}

.medical-history-card:hover .tap-hint i {
  transform: translateX(4px);
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .card-header {
    padding: 1rem;
  }

  .card-preview {
    padding: 1rem;
  }

  .visit-date {
    font-size: 1rem;
  }

  .service-type {
    font-size: 0.8125rem;
  }

  .header-icon {
    width: 36px;
    height: 36px;
  }

  .header-icon i {
    font-size: 1.25rem;
  }

  .preview-item {
    font-size: 0.8125rem;
  }

  .tap-hint {
    font-size: 0.8125rem;
    padding: 0.625rem 0.875rem;
  }
}
</style>
