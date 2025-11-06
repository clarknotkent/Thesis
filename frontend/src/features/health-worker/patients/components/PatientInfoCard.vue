<template>
  <div class="detail-card mb-3">
    <div class="card-header">
      <div class="d-flex justify-content-between align-items-center">
        <h6 class="patient-title mb-0">
          {{ patient.childInfo.name }}
        </h6>
        <span
          class="badge status-badge"
          :class="getStatusBadgeClass(status)"
        >
          {{ status }}
        </span>
      </div>
    </div>
    <div class="card-body">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Patient ID</span>
          <span class="info-value">{{ patient.id }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Age</span>
          <span class="info-value">{{ age }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Sex</span>
          <span class="info-value">{{ patient.childInfo.sex }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Birth Date</span>
          <span class="info-value">{{ formatDate(patient.childInfo.birthDate) }}</span>
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
  
  if (!props.patient.childInfo.birthDate) return '—'
  const birth = new Date(props.patient.childInfo.birthDate)
  const today = new Date()
  if (isNaN(birth.getTime())) return '—'

  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  let days = today.getDate() - birth.getDate()

  if (days < 0) {
    months -= 1
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += prevMonth.getDate()
  }

  if (months < 0) months = 0
  if (days < 0) days = 0

  if (months >= 36) {
    const years = Math.floor(months / 12)
    return `${years} year${years !== 1 ? 's' : ''}`
  } else {
    return `${months}m ${days}d`
  }
})

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

const formatDate = (dateString) => {
  if (!dateString) return 'Not specified'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusBadgeClass = (status) => {
  const classes = {
    active: 'bg-success',
    pending: 'bg-warning text-dark',
    completed: 'bg-secondary'
  }
  return classes[status] || 'bg-secondary'
}
</script>

<style scoped>
.detail-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e9ecef;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.card-body {
  padding: 1rem;
}

.patient-title {
  font-weight: 600;
  color: #2c3e50;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

@media (max-width: 576px) {
  .card-body, .card-header {
    padding: 0.75rem;
  }
  
  .info-value {
    font-size: 0.95rem;
  }
  
  .patient-title {
    font-size: 1rem;
  }
}

@media (min-width: 576px) {
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
