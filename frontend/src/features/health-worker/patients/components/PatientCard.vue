<template>
  <div 
    class="hw-patient-card" 
    @click="$emit('click', patient)"
  >
    <!-- Header -->
    <div class="card-header-section">
      <div class="header-content">
        <div class="patient-identity">
          <div class="patient-avatar">
            <i :class="`bi bi-person-${patient.childInfo.sex === 'Male' ? 'fill' : 'fill'}`" />
          </div>
          <div class="patient-info">
            <h6 class="card-title">
              {{ patient.childInfo.name }}
            </h6>
            <p class="card-subtitle">
              ID: {{ patient.patient_id || patient.id }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <span :class="statusBadgeClass">
            {{ statusText }}
          </span>
          <i class="bi bi-chevron-right text-muted" />
        </div>
      </div>
    </div>
    
    <!-- Body -->
    <div class="card-body">
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">Age</span>
          <span class="info-value">{{ age }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Sex</span>
          <span class="info-value">{{ patient.childInfo.sex }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guardian</span>
          <span class="info-value">{{ guardianName }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Last Vaccine</span>
          <span class="info-value">{{ lastVaccine }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  patient: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

// Calculate age
const age = computed(() => {
  if (props.patient.age_months !== undefined && props.patient.age_days !== undefined) {
    const months = props.patient.age_months || 0
    const days = props.patient.age_days || 0
    
    if (months >= 36) {
      const years = Math.floor(months / 12)
      return `${years} year${years !== 1 ? 's' : ''}`
    } else {
      return `${months}m ${days}d`
    }
  }
  return '—'
})

// Guardian name
const guardianName = computed(() => {
  return props.patient.guardianInfo?.name || 
         props.patient.motherInfo?.name || 
         'N/A'
})

// Last vaccination
const lastVaccine = computed(() => {
  if (!props.patient.vaccinationHistory || props.patient.vaccinationHistory.length === 0) {
    return 'None'
  }
  
  const lastVaccination = props.patient.vaccinationHistory[props.patient.vaccinationHistory.length - 1]
  const date = new Date(lastVaccination.dateAdministered).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  return `${lastVaccination.vaccineName} (${date})`
})

// Patient status
const status = computed(() => {
  if (!props.patient.vaccinationHistory || props.patient.vaccinationHistory.length === 0) {
    return 'pending'
  }
  
  const lastVaccination = props.patient.vaccinationHistory[props.patient.vaccinationHistory.length - 1]
  const lastVaccinationDate = new Date(lastVaccination.dateAdministered)
  const now = new Date()
  const daysSinceLastVaccination = (now - lastVaccinationDate) / (1000 * 60 * 60 * 24)
  
  if (daysSinceLastVaccination <= 30) {
    return 'active'
  } else if (daysSinceLastVaccination <= 90) {
    return 'completed'
  }
  
  return 'pending'
})

const statusBadgeClass = computed(() => {
  const classes = {
    active: 'badge bg-success',
    pending: 'badge bg-warning text-dark',
    completed: 'badge bg-secondary'
  }
  return classes[status.value] || 'badge bg-secondary'
})

const statusText = computed(() => {
  const texts = {
    active: 'Active',
    pending: 'Pending',
    completed: 'Completed'
  }
  return texts[status.value] || 'Unknown'
})
</script>

<style scoped>
.hw-patient-card {
  background: white;
  border: none;
  border-bottom: 1px solid #e9ecef;
  border-radius: 0;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
}

.hw-patient-card:hover {
  background: #f8f9fa;
}

.hw-patient-card:active {
  background: rgba(0, 123, 255, 0.05);
}

.card-header-section {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.patient-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.patient-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.patient-avatar i {
  font-size: 1.5rem;
  color: white;
}

.patient-info {
  flex: 1;
  min-width: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.card-body {
  padding: 1rem;
}

.card-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 1rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-subtitle {
  color: #6b7280;
  font-size: 0.8125rem;
  margin: 0.125rem 0 0;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: #2c3e50;
  font-weight: 600;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .card-header-section,
  .card-body {
    padding: 0.875rem 1rem;
  }
  
  .patient-avatar {
    width: 44px;
    height: 44px;
  }
  
  .patient-avatar i {
    font-size: 1.375rem;
  }
  
  .card-title {
    font-size: 0.9375rem;
  }
  
  .card-subtitle {
    font-size: 0.75rem;
  }
  
  .info-grid {
    gap: 0.5rem;
  }
  
  .info-label,
  .info-value {
    font-size: 0.8125rem;
  }
}
</style>
