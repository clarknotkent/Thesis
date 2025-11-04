<template>
  <div class="tab-content">
    <!-- Patient QR Code Card -->
    <PatientQRCodeCard
      :patient="patient"
      :allow-refresh="false"
    />

    <!-- Patient Information Card -->
    <CollapsibleCard
      title="Child Information"
      icon="person-fill"
      :is-expanded="expandedCards.patientInfo"
      @toggle="expandedCards.patientInfo = !expandedCards.patientInfo"
    >
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Full Name</span>
          <span class="info-value">{{ patient?.childInfo?.name || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date of Birth</span>
          <span class="info-value">{{ formattedBirthDate }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Age</span>
          <span class="info-value">{{ age }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Sex</span>
          <span class="info-value">{{ patient?.childInfo?.sex || '—' }}</span>
        </div>
        <div class="info-item full-width">
          <span class="info-label">Address</span>
          <span class="info-value">{{ patient?.childInfo?.address || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Barangay</span>
          <span class="info-value">{{ patient?.childInfo?.barangay || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Contact Number</span>
          <span class="info-value">{{ patient?.childInfo?.phoneNumber || '—' }}</span>
        </div>
      </div>
    </CollapsibleCard>

    <!-- Guardian & Family Information Card -->
    <CollapsibleCard
      title="Guardian & Family Information"
      icon="people-fill"
      :is-expanded="expandedCards.guardianInfo"
      @toggle="expandedCards.guardianInfo = !expandedCards.guardianInfo"
    >
      <div class="info-grid">
        <div class="info-section-header">
          <i class="bi bi-person-badge"></i>
          <span>Guardian Information</span>
        </div>
        <div class="info-item">
          <span class="info-label">Guardian Name</span>
          <span class="info-value">{{ patient?.guardianInfo?.name || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Relationship</span>
          <span class="info-value">{{ patient?.guardianInfo?.relationship || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Guardian Contact</span>
          <span class="info-value">{{ patient?.guardianInfo?.contact_number || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Alt. Contact</span>
          <span class="info-value">{{ patient?.guardianInfo?.alternative_contact_number || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Guardian Occupation</span>
          <span class="info-value">{{ patient?.guardianInfo?.occupation || '—' }}</span>
        </div>
        <div class="info-section-header">
          <i class="bi bi-person-heart"></i>
          <span>Mother's Information</span>
        </div>
        <div class="info-item">
          <span class="info-label">Mother's Name</span>
          <span class="info-value">{{ patient?.motherInfo?.name || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Occupation</span>
          <span class="info-value">{{ patient?.motherInfo?.occupation || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Contact Number</span>
          <span class="info-value">{{ patient?.motherInfo?.phone || '—' }}</span>
        </div>
        <div class="info-section-header">
          <i class="bi bi-person-heart"></i>
          <span>Father's Information</span>
        </div>
        <div class="info-item">
          <span class="info-label">Father's Name</span>
          <span class="info-value">{{ patient?.fatherInfo?.name || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Occupation</span>
          <span class="info-value">{{ patient?.fatherInfo?.occupation || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Contact Number</span>
          <span class="info-value">{{ patient?.fatherInfo?.phone || '—' }}</span>
        </div>
      </div>
    </CollapsibleCard>

    <!-- Birth History Card -->
    <CollapsibleCard
      title="Birth History"
      icon="calendar-heart-fill"
      :is-expanded="expandedCards.birthHistory"
      @toggle="expandedCards.birthHistory = !expandedCards.birthHistory"
    >
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Birth Weight</span>
          <span class="info-value">{{ formattedBirthWeight }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Birth Length</span>
          <span class="info-value">{{ formattedBirthLength }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Place of Birth</span>
          <span class="info-value">{{ patient?.birthHistory?.place_of_birth || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Address at Birth</span>
          <span class="info-value">{{ patient?.birthHistory?.address_at_birth || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Time of Birth</span>
          <span class="info-value">{{ patient?.birthHistory?.time_of_birth || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Attendant at Birth</span>
          <span class="info-value">{{ patient?.birthHistory?.attendant_at_birth || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Type of Delivery</span>
          <span class="info-value">{{ patient?.birthHistory?.type_of_delivery || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Hearing Test Date</span>
          <span class="info-value">{{ formattedHearingTestDate }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Newborn Screening Date</span>
          <span class="info-value">{{ formattedNewbornScreeningDate }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Newborn Screening Result</span>
          <span class="info-value">{{ patient?.birthHistory?.newborn_screening_result || '—' }}</span>
        </div>
      </div>
    </CollapsibleCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PatientQRCodeCard from '@/features/health-worker/patients/components/PatientQRCodeCard.vue'
import CollapsibleCard from '@/features/health-worker/patients/components/CollapsibleCard.vue'
import { formatDate, calculateAge as calculateAgeUtil } from '@/composables/useDateFormat'

const props = defineProps({
  patient: {
    type: Object,
    required: true
  },
  expandedCards: {
    type: Object,
    required: true
  }
})

const age = computed(() => {
  const birthDate = props.patient?.childInfo?.birthDate
  if (!birthDate) return '—'
  
  const birth = new Date(birthDate)
  const now = new Date()
  
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  let days = now.getDate() - birth.getDate()
  
  if (days < 0) {
    months--
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, birth.getDate())
    days += Math.floor((now - prevMonth) / (1000 * 60 * 60 * 24))
  }
  
  if (months < 0) {
    years--
    months += 12
  }
  
  if (years > 0) {
    return `${years} year${years !== 1 ? 's' : ''}`
  } else if (months > 0) {
    return `${months} month${months !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}`
  } else {
    return `${days} day${days !== 1 ? 's' : ''}`
  }
})

const formattedBirthDate = computed(() => {
  return formatDate(props.patient?.childInfo?.birthDate)
})

const formattedHearingTestDate = computed(() => {
  return formatDate(props.patient?.birthHistory?.hearing_test_date)
})

const formattedNewbornScreeningDate = computed(() => {
  return formatDate(props.patient?.birthHistory?.newborn_screening_date)
})

const formattedBirthWeight = computed(() => {
  const weight = props.patient?.birthHistory?.birth_weight
  if (!weight) return '—'
  return `${weight} kg`
})

const formattedBirthLength = computed(() => {
  const length = props.patient?.birthHistory?.birth_length
  if (!length) return '—'
  return `${length} cm`
})
</script>

<style scoped>
.tab-content {
  padding: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #1f2937;
  font-weight: 400;
}

.info-section-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0 8px 0;
  margin-top: 8px;
  border-top: 1px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
}

.info-section-header:first-child {
  margin-top: 0;
  border-top: none;
  padding-top: 0;
}

.info-section-header i {
  font-size: 1.125rem;
  color: #6366f1;
}
</style>
