<template>
  <HealthWorkerLayout>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- 2x2 Gallery Grid -->
    <div v-if="!loading" class="dashboard-gallery">
      <div class="row g-3">
        <!-- Total Patients -->
        <div class="col-6">
          <StatsCard
            title="Total Patients"
            :value="stats.totalPatients"
            icon-class="bi-people-fill"
            bg-class="bg-primary text-white"
          />
        </div>

        <!-- Today's Appointments -->
        <div class="col-6">
          <StatsCard
            title="Today's Appointments"
            :value="stats.todaysAppointments"
            icon-class="bi-calendar-check-fill"
            bg-class="bg-info text-white"
          />
        </div>

        <!-- Notifications -->
        <div class="col-6">
          <StatsCard
            title="Notifications"
            :value="stats.notifications"
            icon-class="bi-bell-fill"
            bg-class="bg-warning text-white"
          />
        </div>

        <!-- New Messages -->
        <div class="col-6">
          <StatsCard
            title="New Messages"
            :value="stats.newMessages"
            icon-class="bi-chat-dots-fill"
            bg-class="bg-success text-white"
          />
        </div>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import { StatsCard } from '@/features/health-worker/dashboard'
import api from '@/services/api'

const loading = ref(true)
const stats = ref({
  totalPatients: 0,
  todaysAppointments: 0,
  notifications: 0,
  newMessages: 0
})

const fetchDashboardStats = async () => {
  try {
    loading.value = true
    
    // Fetch total patients
    const patientsResponse = await api.get('/patients')
    const patients = patientsResponse.data?.data || patientsResponse.data || []
    stats.value.totalPatients = patients.length
    
    // Fetch today's appointments (visits for today)
    const today = new Date().toISOString().split('T')[0]
    try {
      const appointmentsResponse = await api.get(`/visits?date=${today}`)
      const appointments = appointmentsResponse.data?.data || appointmentsResponse.data || []
      stats.value.todaysAppointments = appointments.length
    } catch (error) {
      console.warn('Could not fetch appointments:', error)
      stats.value.todaysAppointments = 0
    }
    
    // Fetch notifications
    try {
      const notificationsResponse = await api.get('/notifications?unread=true')
      const notifications = notificationsResponse.data?.data || notificationsResponse.data || []
      stats.value.notifications = notifications.length
    } catch (error) {
      console.warn('Could not fetch notifications:', error)
      stats.value.notifications = 0
    }
    
    // Fetch unread messages
    try {
      const messagesResponse = await api.get('/messages?unread=true')
      const messages = messagesResponse.data?.data || messagesResponse.data || []
      stats.value.newMessages = messages.length
    } catch (error) {
      console.warn('Could not fetch messages:', error)
      stats.value.newMessages = 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Keep default values (0s) if main request fails
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardStats()
})
</script>

<style scoped>
.dashboard-gallery {
  padding: 0.5rem 0;
}
</style>
