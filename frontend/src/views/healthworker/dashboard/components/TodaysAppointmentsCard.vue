<template>
  <div class="todays-appointments-card">
    <!-- Header -->
    <div class="appointments-header">
      <div class="header-left">
        <i class="bi bi-calendar-check-fill header-icon" />
        <h5 class="header-title">
          Today's Appointments
        </h5>
      </div>
      <span class="appointment-count-badge">
        {{ totalCount }}
      </span>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-3"
    >
      <div
        class="spinner-border spinner-border-sm text-primary"
        role="status"
      >
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Appointment List -->
    <div
      v-else-if="visibleAppointments.length > 0"
      class="appointments-list"
    >
      <div
        v-for="appointment in visibleAppointments"
        :key="appointment.patient_schedule_id || appointment.patient_id"
        class="appointment-item"
        :class="{ 'past': appointment.isPast }"
      >
        <div class="appointment-time">
          {{ appointment.displayTime }}
        </div>
        <div class="appointment-info">
          <span class="patient-name">{{ appointment.patientName }}</span>
          <span class="vaccine-name">{{ appointment.vaccineName }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="empty-state"
    >
      <i class="bi bi-calendar-x" />
      <p>No appointments scheduled for today</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  appointments: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  totalCount: {
    type: Number,
    default: 0
  }
})

const TIME_BLOCK_SHORT_LABELS = {
  '07:30': '7:30 AM',
  '08:30': '8:30 AM',
  '09:30': '9:30 AM',
  '10:30': '10:30 AM',
  '11:30': '11:30 AM',
  '12:30': '12:30 PM',
  '13:30': '1:30 PM',
  '14:30': '2:30 PM',
  '15:30': '3:30 PM'
}

const visibleAppointments = computed(() => {
  if (!props.appointments || props.appointments.length === 0) return []

  const now = new Date()

  // Map appointments with display info
  const mapped = props.appointments.map(apt => {
    const timeSlot = apt.timeSlot || apt.time_slot || ''
    const displayTime = TIME_BLOCK_SHORT_LABELS[timeSlot] || timeSlot || 'Scheduled'
    // Parse hour from slot to determine if past
    const slotHour = parseInt(timeSlot?.split(':')[0], 10) || 0
    const isPast = slotHour > 0 && now.getHours() > slotHour

    return {
      ...apt,
      displayTime,
      isPast,
      sortKey: timeSlot || '99:99',
      patientName: apt.patient?.name || 'Unknown',
      vaccineName: apt.vaccine?.name || 'Vaccination'
    }
  })

  // Sort by time slot ascending, past ones last
  mapped.sort((a, b) => {
    if (a.isPast !== b.isPast) return a.isPast ? 1 : -1
    return a.sortKey.localeCompare(b.sortKey)
  })

  // Show first 3
  return mapped.slice(0, 3)
})
</script>

<style scoped>
.todays-appointments-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.appointments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.5rem;
  color: #007bff;
}

.header-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.appointment-count-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  background: #007bff;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 50%;
  padding: 0 0.5rem;
}

.appointments-list {
  padding: 0.5rem 0;
}

.appointment-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f9fafb;
  transition: background 0.2s ease;
}

.appointment-item:last-child {
  border-bottom: none;
}

.appointment-item:hover {
  background: #f9fafb;
}

.appointment-item.past {
  opacity: 0.5;
}

.appointment-time {
  flex-shrink: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #007bff;
  min-width: 80px;
}

.appointment-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.patient-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vaccine-name {
  font-size: 0.8125rem;
  color: #6b7280;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: #9ca3af;
}

.empty-state i {
  font-size: 2rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}
</style>
