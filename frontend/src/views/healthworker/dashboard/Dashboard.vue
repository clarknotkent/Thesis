<template>
  <HealthWorkerLayout
    :show-controls="true"
    :controls-props="{
      icon: 'house-door',
      title: 'Dashboard',
      searchPlaceholder: 'Search records...',
      searchQuery: searchQuery,
      showFilterButton: false
    }"
    @scan="openQrScanner"
    @add="goToAddPatient"
    @update:search-query="handleSearch"
  >
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

    <!-- Dashboard Content -->
    <div
      v-if="!loading"
      class="dashboard-content"
    >
      <!-- Offline Indicator -->
      <div
        v-if="!effectiveOnline"
        class="alert alert-warning d-flex align-items-center mb-3 mx-3 mt-3"
        role="alert"
      >
        <i class="bi bi-wifi-off me-2" />
        <div>
          <strong>Offline Mode</strong> - Showing cached dashboard statistics. Data may not be current.
        </div>
      </div>

      <!-- Today's Appointments Card -->
      <div class="px-3 pt-3">
        <TodaysAppointmentsCard
          :appointments="todaysAppointmentsList"
          :loading="appointmentsLoading"
          :total-count="stats.todaysAppointments"
        />
      </div>

      <!-- Weekly Calendar -->
      <div class="px-3 pt-3 pb-3">
        <WeeklyCalendarWidget />
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import TodaysAppointmentsCard from './components/TodaysAppointmentsCard.vue'
import WeeklyCalendarWidget from './components/WeeklyCalendarWidget.vue'
import api from '@/services/api'
import { db } from '@/services/offline/db'
import { useOffline } from '@/composables/useOffline'
import { useCapacity } from '@/composables/useCapacity'

const router = useRouter()
const { effectiveOnline } = useOffline()
const { getCapacityRange } = useCapacity()

const loading = ref(true)
const appointmentsLoading = ref(true)
const searchQuery = ref('')
const todaysAppointmentsList = ref([])
const stats = ref({
  totalPatients: 0,
  todaysAppointments: 0,
  notifications: 0,
  newMessages: 0
})

function openQrScanner() {
  router.push({ name: 'HealthWorkerQRScanner' })
}

function goToAddPatient() {
  router.push({ name: 'HealthWorkerAddPatient' })
}

function handleSearch(query) {
  searchQuery.value = query
  if (query.trim()) {
    router.push({ name: 'HealthWorkerPatients', query: { search: query } })
  }
}

const fetchDashboardStats = async () => {
  try {
    loading.value = true

    if (effectiveOnline.value) {
      // Fetch today's scheduled appointments count via capacity API
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      try {
        const capacityResult = await getCapacityRange(todayStr, todayStr)
        const todayData = capacityResult.find(c => c.date === todayStr)
        if (todayData) {
          stats.value.todaysAppointments = (todayData.am_booked || 0) + (todayData.pm_booked || 0)
          todaysAppointmentsList.value = todayData.patients || []
        }
      } catch {
        stats.value.todaysAppointments = 0
        todaysAppointmentsList.value = []
      }
    } else {
      // OFFLINE: Load from cache
      try {
        if (!db.isOpen()) {
          await db.open()
        }

        const today = new Date().toISOString().split('T')[0]
        const allSchedules = await db.patientschedule.toArray()
        const allPatients = await db.patients.toArray()

        const patientMap = {}
        allPatients.forEach(p => {
          patientMap[p.patient_id] = p
        })

        const todaySchedules = allSchedules.filter(s => {
          if (s.is_deleted) return false
          if (!s.scheduled_date) return false
          const status = (s.status || '').toLowerCase()
          if (status === 'completed' || status === 'missed') return false
          return s.scheduled_date === today
        })

        stats.value.todaysAppointments = todaySchedules.length

        todaysAppointmentsList.value = todaySchedules.map(schedule => {
          const patient = patientMap[schedule.patient_id] || {}
          return {
            patient_schedule_id: schedule.patient_schedule_id,
            patient_id: schedule.patient_id,
            status: schedule.status,
            timeSlot: schedule.time_slot || 'AM',
            patient: {
              name: patient.full_name || [patient.firstname, patient.surname].filter(Boolean).join(' ') || 'Unknown'
            },
            vaccine: {
              name: schedule.antigen_name || 'Vaccination'
            }
          }
        })
      } catch {
        stats.value.todaysAppointments = 0
        todaysAppointmentsList.value = []
      }
    }
  } catch {
    // Keep defaults
  } finally {
    loading.value = false
    appointmentsLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardStats()
})
</script>

<style scoped>
.dashboard-content {
  padding: 0;
}
</style>
