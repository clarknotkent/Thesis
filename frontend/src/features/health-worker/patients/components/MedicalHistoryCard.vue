<template>
  <div class="medical-history-card">
    <!-- Card Header (Always Visible - Collapsed State) -->
    <div
      class="card-header"
      @click="toggleExpanded"
    >
      <div class="header-content">
        <div class="header-icon">
          <i class="bi bi-clipboard2-pulse" />
        </div>
        <div class="header-info">
          <h3 class="visit-date">
            {{ formattedDate }}
          </h3>
          <p class="service-type">
            {{ serviceRendered }}
          </p>
        </div>
      </div>
      <div
        class="chevron-icon"
        :class="{ expanded: isExpanded }"
      >
        <i class="bi bi-chevron-down" />
      </div>
    </div>

    <!-- Card Body (Expanded State) -->
    <transition name="expand">
      <div
        v-if="isExpanded"
        class="card-body"
        @click="handleNavigate"
      >
        <!-- Tap to View Hint -->
        <div class="tap-hint">
          <i class="bi bi-hand-index" />
          <span>Tap to view full visit summary</span>
        </div>
        
        <!-- Recorded By -->
        <div class="info-section">
          <div class="section-label">
            <i class="bi bi-person-badge" />
            Recorded By
          </div>
          <div class="section-value">
            {{ recordedBy }}
          </div>
        </div>

        <!-- Findings -->
        <div
          v-if="findings"
          class="info-section"
        >
          <div class="section-label">
            <i class="bi bi-journal-medical" />
            Findings
          </div>
          <div class="findings-text">
            {{ findings }}
          </div>
        </div>

        <!-- Brief Summary -->
        <div class="info-section">
          <div class="section-label">
            <i class="bi bi-info-circle" />
            Summary
          </div>
          <div class="summary-text">
            <span v-if="hasVitals">{{ vitalsSummary }}</span>
            <span v-if="hasVitals && hasImmunizations"> • </span>
            <span v-if="hasImmunizations">{{ immunizationsSummary }}</span>
            <span v-if="!hasVitals && !hasImmunizations">No additional details recorded</span>
          </div>
        </div>

        <!-- Services Rendered Section -->
        <div
          v-if="serviceRendered && serviceRendered !== 'General Checkup'"
          class="info-section"
        >
          <div class="section-label">
            <i class="bi bi-clipboard-check" />
            Service Rendered
          </div>
          <div class="section-value">
            {{ serviceRendered }}
          </div>
        </div>

        <!-- Vitals Preview (if available) -->
        <div
          v-if="hasVitals"
          class="info-section"
        >
          <div class="section-label">
            <i class="bi bi-heart-pulse" />
            Vitals Recorded
          </div>
          <div class="vitals-preview">
            <span v-if="vitals.weight" class="vital-chip">Weight: {{ vitals.weight }} kg</span>
            <span v-if="vitals.height || vitals.height_length" class="vital-chip">Height: {{ vitals.height || vitals.height_length }} cm</span>
            <span v-if="vitals.temperature" class="vital-chip">Temp: {{ vitals.temperature }}°C</span>
            <span v-if="vitals.muac" class="vital-chip">MUAC: {{ vitals.muac }} cm</span>
          </div>
        </div>

        <!-- Immunizations Preview (if available) -->
        <div
          v-if="hasImmunizations"
          class="info-section"
        >
          <div class="section-label">
            <i class="bi bi-shield-check" />
            Vaccines Administered
          </div>
          <div class="immunizations-preview">
            <div
              v-for="(imm, idx) in immunizations.slice(0, 3)"
              :key="idx"
              class="imm-chip"
            >
              {{ imm.vaccineName || imm.antigen_name || 'Unknown' }}
              <span v-if="imm.dose_number" class="dose-num">Dose {{ imm.dose_number }}</span>
            </div>
            <div v-if="immunizations.length > 3" class="more-chip">
              +{{ immunizations.length - 3 }} more
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="!findings && !hasVitals && !hasImmunizations && (!serviceRendered || serviceRendered === 'General Checkup')"
          class="empty-details"
        >
          <i class="bi bi-info-circle" />
          <p>No additional details recorded for this visit.</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

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
  }
})

const isExpanded = ref(props.initialExpanded)

const emit = defineEmits(['navigate'])

const formattedDate = computed(() => {
  if (!props.visitDate) return '—'
  return new Date(props.visitDate).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const hasVitals = computed(() => {
  if (!props.vitals || typeof props.vitals !== 'object') return false
  const vitalKeys = ['weight', 'height', 'height_length', 'temperature', 'muac', 'respiration_rate', 'respiratory_rate']
  return vitalKeys.some(key => props.vitals[key])
})

const hasImmunizations = computed(() => {
  return props.immunizations && props.immunizations.length > 0
})

const vitalsSummary = computed(() => {
  if (!props.vitals || typeof props.vitals !== 'object') return '0 vitals recorded'
  const vitalKeys = ['weight', 'height', 'height_length', 'temperature', 'muac', 'respiration_rate', 'respiratory_rate']
  const vitalsCount = vitalKeys.filter(key => props.vitals[key]).length
  return `${vitalsCount} vital${vitalsCount !== 1 ? 's' : ''} recorded`
})

const immunizationsSummary = computed(() => {
  const count = props.immunizations?.length || 0
  return `${count} vaccine${count !== 1 ? 's' : ''} administered`
})

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const handleNavigate = () => {
  emit('navigate', props.visitId)
}
</script>

<style scoped>
.medical-history-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Card Header (Collapsed State) */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
}

.card-header:hover {
  background: linear-gradient(135deg, #0069d9 0%, #004494 100%);
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
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.chevron-icon i {
  font-size: 1.25rem;
}

.chevron-icon.expanded {
  transform: rotate(180deg);
}

/* Card Body (Expanded State) */
.card-body {
  padding: 1.5rem;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
  cursor: pointer;
  transition: background 0.2s;
}

.card-body:hover {
  background: #f9fafb;
}

.card-body:active {
  background: #f3f4f6;
}

/* Tap Hint */
.tap-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-radius: 0.5rem;
  border: 1px solid #7dd3fc;
  font-size: 0.875rem;
  color: #0369a1;
  font-weight: 600;
}

.tap-hint i {
  font-size: 1rem;
  color: #0284c7;
}

/* Expand Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
}

/* Info Section */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.section-label i {
  font-size: 1rem;
  color: #007bff;
}

.section-value {
  font-size: 0.9375rem;
  color: #1f2937;
  padding-left: 1.5rem;
}

/* Vitals Grid */
.vitals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding-left: 1.5rem;
}

.vital-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.vital-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.vital-value {
  font-size: 0.9375rem;
  color: #1f2937;
  font-weight: 600;
}

/* Immunizations List */
.immunizations-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding-left: 1.5rem;
}

.immunization-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f0f9ff;
  border-radius: 0.5rem;
  border: 1px solid #bae6fd;
}

.imm-vaccine {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
}

.imm-dose {
  font-size: 0.75rem;
  color: #0369a1;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  background: #e0f2fe;
  border-radius: 0.375rem;
}

/* Findings Text */
.findings-text {
  font-size: 0.9375rem;
  color: #1f2937;
  line-height: 1.6;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border-left: 3px solid #007bff;
  margin-left: 1.5rem;
}

/* Summary Text */
.summary-text {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
  padding-left: 1.5rem;
}

/* Vitals Preview */
.vitals-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-left: 1.5rem;
}

.vital-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: #0369a1;
  font-weight: 500;
}

/* Immunizations Preview */
.immunizations-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-left: 1.5rem;
}

.imm-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: #15803d;
  font-weight: 500;
}

.dose-num {
  padding: 0.125rem 0.375rem;
  background: #dcfce7;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.more-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

/* Empty State */
.empty-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #9ca3af;
  text-align: center;
}

.empty-details i {
  font-size: 2rem;
  color: #d1d5db;
}

.empty-details p {
  margin: 0;
  font-size: 0.875rem;
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .card-header {
    padding: 1rem;
  }

  .card-body {
    padding: 1rem;
    gap: 1.25rem;
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

  .vitals-grid {
    grid-template-columns: 1fr;
  }

  .section-label {
    font-size: 0.8125rem;
  }

  .section-value,
  .findings-text {
    font-size: 0.875rem;
  }
}
</style>
