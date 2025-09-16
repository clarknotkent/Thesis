<template>
  <ParentLayout>
    <div class="parent-dashboard">
      <!-- Welcome Section -->
      <div class="welcome-section mb-4">
        <AppCard class="parent-card bg-gradient-primary text-white">
          <div class="d-flex align-items-center">
            <div class="flex-grow-1">
              <h4 class="mb-1">Welcome back, {{ parentName }}!</h4>
              <p class="mb-0 opacity-75">Stay updated on {{ childName }}'s vaccination journey</p>
            </div>
            <i class="bi bi-heart-fill fs-1 opacity-50"></i>
          </div>
        </AppCard>
      </div>

      <!-- Child Quick Info -->
      <div class="child-quick-info mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-info text-white">
              <i class="bi bi-person me-2"></i>
              My Child
            </div>
          </template>
          <div class="d-flex align-items-center">
            <div class="child-avatar me-3">
              <i class="bi bi-person-circle fs-1 text-primary"></i>
            </div>
            <div class="flex-grow-1">
              <h5 class="mb-1 fw-bold">{{ childInfo.name }}</h5>
              <div class="parent-info-row">
                <div class="parent-info-item flex-grow-1 me-2">
                  <div class="parent-info-label">Age</div>
                  <div class="parent-info-value">{{ childInfo.age }} years</div>
                </div>
                <div class="parent-info-item flex-grow-1">
                  <div class="parent-info-label">Next Vaccine</div>
                  <div class="parent-info-value">{{ childInfo.nextVaccine }}</div>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Quick Stats -->
      <div class="row g-3 mb-4">
        <div class="col-4">
          <div class="parent-stat-card bg-success">
            <span class="parent-stat-number">{{ stats.completed }}</span>
            <span class="parent-stat-label">Completed</span>
          </div>
        </div>
        <div class="col-4">
          <div class="parent-stat-card bg-warning">
            <span class="parent-stat-number">{{ stats.upcoming }}</span>
            <span class="parent-stat-label">Upcoming</span>
          </div>
        </div>
        <div class="col-4">
          <div class="parent-stat-card bg-primary">
            <span class="parent-stat-number">{{ stats.total }}</span>
            <span class="parent-stat-label">Total</span>
          </div>
        </div>
      </div>

      <!-- Recent Vaccinations -->
      <div class="recent-vaccinations mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-success text-white">
              <i class="bi bi-check-circle me-2"></i>
              Recent Vaccinations
            </div>
          </template>
          <div v-if="recentVaccinations.length === 0" class="text-center py-3 text-muted">
            <i class="bi bi-calendar-x fs-2"></i>
            <p class="mb-0 mt-2">No recent vaccinations</p>
          </div>
          <div v-else>
            <div 
              v-for="vaccine in recentVaccinations" 
              :key="vaccine.id"
              class="d-flex align-items-center py-2 border-bottom last:border-0"
            >
              <div class="me-3">
                <i class="bi bi-check-circle-fill text-success fs-4"></i>
              </div>
              <div class="flex-grow-1">
                <div class="fw-bold">{{ vaccine.name }}</div>
                <small class="text-muted">{{ vaccine.date }}</small>
              </div>
              <span class="parent-status-completed">Completed</span>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Upcoming Appointments -->
      <div class="upcoming-appointments mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-warning text-dark">
              <i class="bi bi-calendar-event me-2"></i>
              Upcoming Appointments
            </div>
          </template>
          <div v-if="upcomingAppointments.length === 0" class="text-center py-3 text-muted">
            <i class="bi bi-calendar-plus fs-2"></i>
            <p class="mb-0 mt-2">No upcoming appointments</p>
          </div>
          <div v-else>
            <div 
              v-for="appointment in upcomingAppointments" 
              :key="appointment.id"
              class="d-flex align-items-center py-2 border-bottom last:border-0"
            >
              <div class="me-3">
                <i class="bi bi-calendar-event text-warning fs-4"></i>
              </div>
              <div class="flex-grow-1">
                <div class="fw-bold">{{ appointment.vaccine }}</div>
                <small class="text-muted">{{ appointment.date }} at {{ appointment.time }}</small>
              </div>
              <span class="parent-status-pending">{{ appointment.status }}</span>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions mb-4">
        <AppCard class="parent-card">
          <template #header>
            <div class="bg-primary text-white">
              <i class="bi bi-lightning me-2"></i>
              Quick Actions
            </div>
          </template>
          <div class="row g-2">
            <div class="col-6">
              <AppButton
                variant="outline-primary"
                class="w-100 parent-btn-action"
                :to="'/parent/child-info'"
                icon="bi bi-person"
              >
                View Child Info
              </AppButton>
            </div>
            <div class="col-6">
              <AppButton
                variant="outline-success"
                class="w-100 parent-btn-action"
                :to="'/parent/vaccination-schedule'"
                icon="bi bi-calendar-check"
              >
                View Schedule
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Emergency Contact -->
      <div class="emergency-contact">
        <AppCard class="parent-emergency-card">
          <div class="text-center">
            <i class="bi bi-telephone-fill fs-2 mb-2"></i>
            <h6 class="mb-1">Emergency Contact</h6>
            <p class="mb-2">Health Center Hotline</p>
            <a href="tel:+639171234567" class="btn btn-light btn-sm">
              <i class="bi bi-telephone me-1"></i>
              Call Now
            </a>
          </div>
        </AppCard>
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref } from 'vue'
import ParentLayout from '@/components/layout/ParentLayout.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const parentName = ref('Maria Cruz')
const childName = ref('Ethan')

const childInfo = ref({
  name: 'Ethan Cruz',
  age: 5,
  nextVaccine: 'COVID-19 Booster'
})

const stats = ref({
  completed: 8,
  upcoming: 2,
  total: 10
})

const recentVaccinations = ref([
  {
    id: 1,
    name: 'COVID-19 Vaccine',
    date: 'Aug 10, 2025'
  },
  {
    id: 2,
    name: 'Influenza Vaccine',
    date: 'Jul 15, 2025'
  }
])

const upcomingAppointments = ref([
  {
    id: 1,
    vaccine: 'COVID-19 Booster',
    date: 'Aug 25, 2025',
    time: '10:00 AM',
    status: 'Scheduled'
  },
  {
    id: 2,
    vaccine: 'Annual Check-up',
    date: 'Sep 5, 2025',
    time: '2:00 PM',
    status: 'Pending'
  }
])
</script>

<!-- Styles moved to src/assets/styles/parent.css for consistency -->
  font-size: 0.875rem;
  border-radius: 8px;
}

.child-avatar {
  display: flex;
  align-items: center;
<!-- Styles moved to src/assets/styles/parent.css for consistency -->
