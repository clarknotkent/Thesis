<template>
  <ParentLayout title="My Schedule">
    <!-- Fixed Header Section -->
    <div class="schedule-details-header-section">
      <div class="header-bar">
        <button class="back-button" @click="goBack">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h1 class="page-title">{{ pageTitle }}</h1>
        <!-- Empty spacer for alignment -->
        <div class="header-spacer"></div>
      </div>
    </div>

    <!-- Content wrapper -->
    <div class="page-content-wrapper">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading vaccination schedule...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <i class="bi bi-exclamation-triangle error-icon"></i>
        <p class="error-text">{{ error }}</p>
        <button class="retry-button" @click="fetchSchedule">
          <i class="bi bi-arrow-clockwise"></i>
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="schedules.length === 0" class="empty-state">
        <i class="bi bi-calendar-check empty-icon"></i>
        <h3 class="empty-title">No Scheduled Vaccinations</h3>
        <p class="empty-text">
          There are no vaccinations scheduled for {{ childName }} at this time.
        </p>
      </div>

      <!-- Schedule List -->
      <div v-else class="schedule-content">
        <!-- Child Info Summary -->
        <div class="child-info-card">
          <div class="info-icon">
            <i class="bi bi-person-circle"></i>
          </div>
          <div class="info-details">
            <h3 class="child-name">{{ childName }}</h3>
            <p class="schedule-count">{{ schedules.length }} scheduled vaccination{{ schedules.length !== 1 ? 's' : '' }}</p>
          </div>
        </div>

        <!-- Schedule Cards -->
        <div class="schedule-list">
          <ScheduleCard
            v-for="schedule in schedules"
            :key="schedule.id"
            :vaccine-name="schedule.vaccineName"
            :dose="schedule.dose"
            :scheduled-date="schedule.scheduledDate"
            :status="schedule.status"
            :recommended-age="schedule.recommendedAge"
          />
        </div>
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import ScheduleCard from '@/components/parent/ScheduleCard.vue'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref(null)
const childName = ref('')
const schedules = ref([])

// Extract short name (first + last name only)
const shortName = computed(() => {
  if (!childName.value) return ''
  const parts = childName.value.trim().split(' ')
  if (parts.length <= 2) return childName.value // Already short
  // Return first and last name only
  return `${parts[0]} ${parts[parts.length - 1]}`
})

const pageTitle = computed(() => {
  return shortName.value ? `${shortName.value}'s Schedule` : 'Schedule'
})

const goBack = () => {
  router.back()
}

const fetchSchedule = async () => {
  try {
    loading.value = true
    error.value = null
    
    const childId = route.params.id
    
    if (!childId) {
      error.value = 'Invalid child ID'
      return
    }
    
    try {
      // NETWORK-FIRST: Try API if online
      if (navigator.onLine) {
        console.log('🌐 Fetching schedule from API (online)')
        const response = await api.get(`/parent/children/${childId}/schedule`)
        const data = response.data?.data || {}
        
        childName.value = data.childName || 'Child'
        
        const scheduleData = data.schedule || []
        
        // Format and sort schedules
        schedules.value = scheduleData.map(item => ({
          id: item.id || item.patient_schedule_id,
          vaccineName: item.name || item.vaccine_name || 'Unknown Vaccine',
          dose: item.doseNumber || item.dose_number || 1,
          scheduledDate: item.scheduledDate || item.scheduled_date,
          status: item.status || 'upcoming',
          recommendedAge: item.recommendedAge || ''
        })).sort((a, b) => {
          // Sort by date (soonest first)
          const dateA = new Date(a.scheduledDate)
          const dateB = new Date(b.scheduledDate)
          return dateA - dateB
        })
        
        console.log(`✅ Loaded ${schedules.value.length} schedule items`)
      } else {
        throw new Error('Offline - will use cache')
      }
    } catch (apiError) {
      // OFFLINE FALLBACK: Load from IndexedDB
      console.log('📴 Offline or API failed - loading from IndexedDB')
      try {
        const db = (await import('@/services/offline/db')).default
        
        // Get patient info
        const patient = await db.patients.get(Number(childId))
        if (patient) {
          childName.value = patient.full_name || patient.name || 'Child'
        }
        
        // Get schedules from patientschedule table
        const cachedSchedules = await db.patientschedule
          .where('patient_id')
          .equals(Number(childId))
          .toArray()
        
        console.log(`📦 Found ${cachedSchedules.length} cached schedules`)
        
        if (cachedSchedules.length > 0) {
          schedules.value = cachedSchedules.map(item => ({
            id: item.patient_schedule_id || item.id,
            vaccineName: item.vaccine_name || 'Unknown Vaccine',
            dose: item.dose_number || 1,
            scheduledDate: item.scheduled_date,
            status: item.status || 'upcoming',
            recommendedAge: ''
          })).sort((a, b) => {
            const dateA = new Date(a.scheduledDate)
            const dateB = new Date(b.scheduledDate)
            return dateA - dateB
          })
        } else {
          error.value = 'No vaccination schedule found offline'
        }
      } catch (dbError) {
        console.error('Failed to load from cache:', dbError)
        error.value = 'No vaccination schedule available offline'
      }
    }
    
  } catch (err) {
    console.error('Error fetching schedule:', err)
    const status = err?.response?.status
    if (status === 403 || status === 404) {
      // Child not accessible or missing -> Not Found page
      return router.replace('/not-found')
    }
    error.value = 'Failed to load vaccination schedule. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSchedule()
})
</script>

<style scoped>
/* Fixed Header Section */
.schedule-details-header-section {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  flex-shrink: 0;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  height: 57px;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #374151;
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.back-button:hover {
  background: #f3f4f6;
}

.back-button:active {
  background: #e5e7eb;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 0.5rem;
}

.header-spacer {
  width: 40px;
}

/* Page Content */
.page-content-wrapper {
  padding: 1.25rem;
  padding-bottom: 100px;
  min-height: 100%;
  background: #f3f4f6;
}

.schedule-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Child Info Card */
.child-info-card {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.info-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon i {
  font-size: 2rem;
}

.info-details {
  flex: 1;
}

.child-name {
  font-size: 1.375rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.schedule-count {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
}

/* Schedule List */
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-state p {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
}

.error-text {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #0056b3;
}

.retry-button i {
  font-size: 1rem;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.empty-icon {
  font-size: 5rem;
  color: #9ca3af;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.empty-text {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
  max-width: 400px;
  line-height: 1.6;
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .page-content-wrapper {
    padding: 1rem;
    padding-bottom: 100px;
  }

  .page-title {
    font-size: 1rem;
  }

  .back-button {
    width: 36px;
    height: 36px;
    font-size: 1.125rem;
  }

  .child-info-card {
    padding: 1.25rem;
  }

  .info-icon {
    width: 50px;
    height: 50px;
  }

  .info-icon i {
    font-size: 1.75rem;
  }

  .child-name {
    font-size: 1.125rem;
  }

  .schedule-count {
    font-size: 0.8125rem;
  }
}
</style>
