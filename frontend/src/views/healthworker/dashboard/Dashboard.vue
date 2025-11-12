<template>
  <HealthWorkerLayout>
    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-5"
    >
      <div
        class="spinner-border text-primary"
        role="status"
      >
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- 2x2 Gallery Grid -->
    <div
      v-if="!loading"
      class="dashboard-gallery"
    >
      <!-- Offline Indicator -->
      <div
        v-if="!effectiveOnline"
        class="alert alert-warning d-flex align-items-center mb-3"
        role="alert"
      >
        <i class="bi bi-wifi-off me-2" />
        <div>
          <strong>Offline Mode</strong> - Showing cached dashboard statistics. Data may not be current.
        </div>
      </div>

      <div class="row g-3">
        <!-- Total Patients -->
        <div class="col-6">
          <StatsCard
            title="Total Patients"
            :value="stats.totalPatients"
            icon-class="bi-people-fill"
            bg-class="bg-primary"
          />
        </div>

        <!-- Today's Appointments -->
        <div class="col-6">
          <StatsCard
            title="Today's Appointments"
            :value="stats.todaysAppointments"
            icon-class="bi-calendar-check-fill"
            bg-class="bg-info"
          />
        </div>

        <!-- Notifications -->
        <div class="col-6">
          <StatsCard
            title="Notifications"
            :value="stats.notifications"
            icon-class="bi-bell-fill"
            bg-class="bg-warning"
          />
        </div>

        <!-- New Messages -->
        <div class="col-6">
          <StatsCard
            title="New Messages"
            :value="stats.newMessages"
            icon-class="bi-chat-dots-fill"
            bg-class="bg-success"
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
import { db } from '@/services/offline/db'
import { useOffline } from '@/composables/useOffline'

const { effectiveOnline } = useOffline()

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

    console.log('📊 Fetching dashboard stats - Online mode:', effectiveOnline.value)

    if (effectiveOnline.value) {
      // ONLINE: Fetch from API
      console.log('🌐 Fetching dashboard stats from API...')

      // Fetch total patients
      const patientsResponse = await api.get('/patients', { params: { limit: 1, page: 1 } })
      const patientsData = patientsResponse.data?.data || patientsResponse.data || {}
      stats.value.totalPatients = patientsData.totalCount || patientsData.patients?.length || 0

      // Fetch today's appointments (visits for today)
      const today = new Date().toISOString().split('T')[0]
      try {
        const appointmentsResponse = await api.get('/visits', { params: { limit: 1000 } }) // Fetch recent visits
        const allVisits = appointmentsResponse.data?.items || appointmentsResponse.data || []
        // Filter for today's visits client-side since API doesn't support date filtering
        const todaysVisits = allVisits.filter(visit => {
          const visitDate = new Date(visit.visit_date).toISOString().split('T')[0]
          return visitDate === today
        })
        stats.value.todaysAppointments = todaysVisits.length
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

      // Fetch unread messages - use simple count from conversations
      try {
        const conversationsResponse = await api.get('/conversations', { params: { limit: 50 } })
        const conversations = conversationsResponse.data?.items || conversationsResponse.data || []
        
        // Simple approach: count conversations as proxy for unread messages
        // In a real implementation, you'd have an unread count API endpoint
        const messageCount = conversations.length > 0 ? Math.min(conversations.length, 10) : 0
        stats.value.newMessages = isNaN(messageCount) ? 0 : messageCount
        
        console.log('📨 New messages count:', stats.value.newMessages, 'from', conversations.length, 'conversations')
      } catch (error) {
        console.warn('Could not fetch messages count:', error)
        stats.value.newMessages = 0
      }

      console.log('✅ Dashboard stats fetched from API')

    } else {
      // OFFLINE: Load from cache
      console.log('📴 Loading dashboard stats from cache...')

      try {
        // Ensure database is open
        if (!db.isOpen()) {
          await db.open()
        }

        // Total patients from cache
        try {
          stats.value.totalPatients = await db.patients.count()
          console.log('👥 Total patients from cache:', stats.value.totalPatients)
        } catch (patientError) {
          console.error('❌ Error counting patients from cache:', patientError)
          stats.value.totalPatients = 0
        }

        // Today's appointments from cached visits
        const today = new Date().toISOString().split('T')[0]
        try {
          console.log('📅 Loading visits from cache for dashboard...')
          // Filter visits with valid dates and count today's visits
          const allVisits = await db.visits.toArray()
          console.log('📅 Loaded', allVisits.length, 'visits from cache')
          
          const todaysVisits = allVisits.filter(visit => {
            if (!visit.visit_date) {
              console.log('⚠️ Visit missing visit_date:', visit.visit_id)
              return false
            }
            try {
              const visitDate = new Date(visit.visit_date).toISOString().split('T')[0]
              return visitDate === today
            } catch (error) {
              console.log('⚠️ Invalid visit_date format for visit', visit.visit_id, ':', visit.visit_date, error)
              return false // Invalid date format
            }
          }).length
          stats.value.todaysAppointments = todaysVisits
          console.log('📅 Found', todaysVisits, 'appointments for today')
        } catch (visitError) {
          console.error('❌ Error loading visits from cache in Dashboard:', visitError)
          console.error('❌ Visit error details:', {
            message: visitError.message,
            name: visitError.name,
            stack: visitError.stack
          })
          // Keep default values (0s) if cache fails
          stats.value.todaysAppointments = 0
        }

        // Unread notifications from cache
        // NOTE: Skipping notifications in offline mode - real-time feature
        stats.value.notifications = 0
        console.log('📴 Skipping notifications in offline mode')

        // Unread messages from cache (messages not marked as read)
        // NOTE: Skipping messages in offline mode - real-time feature
        stats.value.newMessages = 0
        console.log('📴 Skipping messages in offline mode')

        console.log('✅ Dashboard stats loaded from cache')

      } catch (cacheError) {
        console.error('❌ Error loading from cache:', cacheError)
        // Keep default values (0s) if cache fails
      }
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

// Utility function to clear corrupted database tables
const _clearCorruptedDashboardTables = async () => {
  try {
    console.log('🗑️ Clearing corrupted dashboard-related tables...')
    
    // Clear tables that might be causing issues
    await db.visits.clear()
    await db.notifications.clear()
    await db.messages.clear()
    await db.conversations.clear()
    
    console.log('✅ Dashboard tables cleared successfully')
  } catch (error) {
    console.error('❌ Failed to clear dashboard tables:', error)
  }
}
</script>

<style scoped>
.dashboard-gallery {
  padding: 0.5rem 0;
}
</style>
