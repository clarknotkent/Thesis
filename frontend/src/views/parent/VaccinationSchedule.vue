<template>
  <ParentLayout>
    <div class="vaccination-schedule">
      <!-- Schedule Overview -->
      <div class="schedule-overview mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-primary text-white">
              <i class="bi bi-calendar-check me-2"></i>
              Vaccination Schedule Overview
            </div>
          </template>
          <div class="row g-3 text-center">
            <div class="col-4">
              <div class="parent-stat-card bg-success">
                <span class="parent-stat-number">{{ scheduleStats.completed }}</span>
                <span class="parent-stat-label">Completed</span>
              </div>
            </div>
            <div class="col-4">
              <div class="parent-stat-card bg-warning">
                <span class="parent-stat-number">{{ scheduleStats.upcoming }}</span>
                <span class="parent-stat-label">Upcoming</span>
              </div>
            </div>
            <div class="col-4">
              <div class="parent-stat-card bg-danger">
                <span class="parent-stat-number">{{ scheduleStats.overdue }}</span>
                <span class="parent-stat-label">Overdue</span>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs mb-4">
        <div class="btn-group w-100" role="group">
          <input type="radio" class="btn-check" name="scheduleFilter" id="all" v-model="activeFilter" value="all" checked>
          <label class="btn btn-outline-primary" for="all">All</label>

          <input type="radio" class="btn-check" name="scheduleFilter" id="completed" v-model="activeFilter" value="completed">
          <label class="btn btn-outline-success" for="completed">Completed</label>

          <input type="radio" class="btn-check" name="scheduleFilter" id="upcoming" v-model="activeFilter" value="upcoming">
          <label class="btn btn-outline-warning" for="upcoming">Upcoming</label>

          <input type="radio" class="btn-check" name="scheduleFilter" id="overdue" v-model="activeFilter" value="overdue">
          <label class="btn btn-outline-danger" for="overdue">Overdue</label>
        </div>
      </div>

      <!-- Vaccination Timeline -->
      <div class="vaccination-timeline">
        <div class="parent-timeline">
          <div 
            v-for="vaccine in filteredVaccinations" 
            :key="vaccine.id"
            class="parent-timeline-item"
            :class="vaccine.status"
          >
            <AppCard class="parent-card">
              <div class="d-flex align-items-start">
                <div class="vaccine-icon me-3">
                  <i 
                    :class="getVaccineIcon(vaccine.status)" 
                    :style="{ color: getStatusColor(vaccine.status) }"
                    style="font-size: 1.5rem;"
                  ></i>
                </div>
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="fw-bold mb-0">{{ vaccine.name }}</h6>
                    <span :class="getStatusBadgeClass(vaccine.status)">
                      {{ vaccine.status.charAt(0).toUpperCase() + vaccine.status.slice(1) }}
                    </span>
                  </div>
                  
                  <div class="vaccine-details">
                    <div class="row g-2 mb-2">
                      <div class="col-6">
                        <small class="text-muted">Recommended Age:</small>
                        <div class="fw-semibold">{{ vaccine.recommendedAge }}</div>
                      </div>
                      <div class="col-6">
                        <small class="text-muted">{{ vaccine.status === 'completed' ? 'Date Given:' : 'Due Date:' }}</small>
                        <div class="fw-semibold">{{ vaccine.date }}</div>
                      </div>
                    </div>
                    
                    <div v-if="vaccine.status === 'completed'" class="completion-info">
                      <div class="row g-2">
                        <div class="col-6">
                          <small class="text-muted">Batch Number:</small>
                          <div class="fw-semibold">{{ vaccine.batchNumber }}</div>
                        </div>
                        <div class="col-6">
                          <small class="text-muted">Health Worker:</small>
                          <div class="fw-semibold">{{ vaccine.healthWorker }}</div>
                        </div>
                      </div>
                      <div v-if="vaccine.notes" class="mt-2">
                        <small class="text-muted">Notes:</small>
                        <div class="fw-semibold">{{ vaccine.notes }}</div>
                      </div>
                    </div>
                    
                    <div v-else-if="vaccine.status === 'upcoming'" class="upcoming-info">
                      <div class="d-flex align-items-center justify-content-between">
                        <div>
                          <small class="text-muted">{{ getDaysUntilDue(vaccine.date) }}</small>
                        </div>
                        <AppButton
                          size="sm"
                          variant="outline-primary"
                          @click="scheduleAppointment(vaccine)"
                          icon="bi bi-calendar-plus"
                        >
                          Schedule
                        </AppButton>
                      </div>
                    </div>
                    
                    <div v-else-if="vaccine.status === 'overdue'" class="overdue-info">
                      <div class="d-flex align-items-center justify-content-between">
                        <div>
                          <small class="text-danger">{{ getDaysOverdue(vaccine.date) }}</small>
                        </div>
                        <AppButton
                          size="sm"
                          variant="danger"
                          @click="scheduleUrgent(vaccine)"
                          icon="bi bi-exclamation-triangle"
                        >
                          Schedule Now
                        </AppButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AppCard>
          </div>
        </div>
      </div>

      <!-- Next Appointment Card -->
      <div v-if="nextAppointment" class="next-appointment mb-4">
        <AppCard class="parent-card border-primary">
          <template #header>
            <div class="bg-primary text-white">
              <i class="bi bi-calendar-event me-2"></i>
              Next Appointment
            </div>
          </template>
          <div class="text-center">
            <h5 class="fw-bold text-primary">{{ nextAppointment.vaccine }}</h5>
            <p class="mb-2">{{ nextAppointment.date }} at {{ nextAppointment.time }}</p>
            <p class="text-muted mb-3">{{ nextAppointment.location }}</p>
            <div class="d-grid gap-2 d-md-flex justify-content-md-center">
              <AppButton
                variant="primary"
                @click="reschedule"
                icon="bi bi-calendar-event"
              >
                Reschedule
              </AppButton>
              <AppButton
                variant="outline-danger"
                @click="cancelAppointment"
                icon="bi bi-x-circle"
              >
                Cancel
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Emergency Contact -->
      <div class="emergency-contact">
        <AppCard class="parent-emergency-card text-center">
          <i class="bi bi-question-circle-fill fs-3 mb-2"></i>
          <h6 class="mb-2">Have Questions About Vaccinations?</h6>
          <p class="mb-3">Contact our health center for guidance</p>
          <AppButton
            variant="light"
            size="sm"
            href="tel:+639171234567"
            icon="bi bi-telephone"
          >
            Call Health Center
          </AppButton>
        </AppCard>
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import ParentLayout from '@/components/layout/ParentLayout.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const activeFilter = ref('all')

const scheduleStats = ref({
  completed: 8,
  upcoming: 2,
  overdue: 0
})

const nextAppointment = ref({
  vaccine: 'COVID-19 Booster',
  date: 'August 25, 2025',
  time: '10:00 AM',
  location: 'Manila Health Center'
})

const vaccinations = ref([
  {
    id: 1,
    name: 'COVID-19 Vaccine (1st Dose)',
    status: 'completed',
    recommendedAge: '5+ years',
    date: 'Jul 10, 2025',
    batchNumber: 'PF20250710',
    healthWorker: 'Nurse Ana Santos',
    notes: 'No adverse reactions observed'
  },
  {
    id: 2,
    name: 'Influenza Vaccine',
    status: 'completed',
    recommendedAge: '6 months+',
    date: 'Jun 15, 2025',
    batchNumber: 'SF20250615',
    healthWorker: 'Dr. Juan dela Cruz'
  },
  {
    id: 3,
    name: 'COVID-19 Booster',
    status: 'upcoming',
    recommendedAge: '5+ years',
    date: 'Aug 25, 2025'
  },
  {
    id: 4,
    name: 'MMR Vaccine',
    status: 'completed',
    recommendedAge: '12-15 months',
    date: 'May 20, 2025',
    batchNumber: 'MK20250520',
    healthWorker: 'Nurse Maria Lopez'
  },
  {
    id: 5,
    name: 'Varicella Vaccine',
    status: 'upcoming',
    recommendedAge: '12-18 months',
    date: 'Sep 5, 2025'
  }
])

const filteredVaccinations = computed(() => {
  if (activeFilter.value === 'all') {
    return vaccinations.value
  }
  return vaccinations.value.filter(vaccine => vaccine.status === activeFilter.value)
})

const getVaccineIcon = (status) => {
  const icons = {
    completed: 'bi bi-check-circle-fill',
    upcoming: 'bi bi-clock-fill',
    overdue: 'bi bi-exclamation-triangle-fill'
  }
  return icons[status] || 'bi bi-circle'
}

const getStatusColor = (status) => {
  const colors = {
    completed: '#28a745',
    upcoming: '#ffc107',
    overdue: '#dc3545'
  }
  return colors[status] || '#6c757d'
}

const getStatusBadgeClass = (status) => {
  const classes = {
    completed: 'parent-status-completed',
    upcoming: 'parent-status-pending',
    overdue: 'parent-status-overdue'
  }
  return classes[status] || 'badge bg-secondary'
}

const getDaysUntilDue = (dueDate) => {
  const due = new Date(dueDate)
  const today = new Date()
  const diffTime = due - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays > 0) return `Due in ${diffDays} days`
  return 'Overdue'
}

const getDaysOverdue = (dueDate) => {
  const due = new Date(dueDate)
  const today = new Date()
  const diffTime = today - due
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Overdue by 1 day'
  return `Overdue by ${diffDays} days`
}

const { addToast } = useToast()

const scheduleAppointment = (vaccine) => {
  addToast({ title: 'Info', message: `Scheduling appointment for ${vaccine.name}...`, type: 'info' })
}

const scheduleUrgent = (vaccine) => {
  addToast({ title: 'Info', message: `Scheduling urgent appointment for ${vaccine.name}...`, type: 'info' })
}

const reschedule = () => {
  addToast({ title: 'Info', message: 'Rescheduling appointment...', type: 'info' })
}

const cancelAppointment = () => {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    nextAppointment.value = null
    addToast({ title: 'Cancelled', message: 'Appointment cancelled', type: 'success' })
  }
}
</script>

<!-- Styles moved to src/assets/styles/parent.css for consistency -->
