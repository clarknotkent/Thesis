<template>
  <ParentLayout title="Home">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else class="dashboard-container">
      <div class="welcome-header">
        <h4 class="welcome-title">Welcome, {{ parentName }}!</h4>
        <p class="welcome-subtitle">Here's your family's health summary</p>
      </div>
      
      <SummaryCards 
        :totalChildren="stats.totalChildren"
        :dueVaccines="stats.dueVaccines"
        :completedVaccines="stats.completedVaccines"
      />
      
      <ChildrenList :children="children" />
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import SummaryCards from '@/features/parent/home/components/SummaryCards.vue'
import ChildrenList from '@/features/parent/home/components/ChildrenList.vue'
import { useAuth } from '@/composables/useAuth'
import { formatDate, calculateAge } from '@/composables/useDateFormat'
import { getChildName, getChildDOB, getCompletedCount, getPendingCount } from '@/composables/useParentData'
import db from '@/services/offline/db-parent-portal'
import api from '@/services/api'

const { userInfo } = useAuth()

const loading = ref(true)
const children = ref([])
const stats = ref({
  totalChildren: 0,
  dueVaccines: 0,
  completedVaccines: 0,
  unreadMessages: 0
})

const parentName = computed(() => {
  const u = userInfo.value
  if (!u) return 'Parent'
  return u.firstname || u.first_name || u.name || 'Parent'
})

const fetchDashboardStats = async () => {
  try {
    loading.value = true

    // Helper: normalize schedule payloads of various shapes into triad counts
    const deriveStats = (payload) => {
      const statsObj = payload?.stats || payload?.scheduleStats
      if (statsObj && (statsObj.completed !== undefined)) return statsObj
      // Accept array payloads too
      let sched = []
      if (Array.isArray(payload)) sched = payload
      else if (Array.isArray(payload?.schedule)) sched = payload.schedule
      else sched = []
      const now = new Date()
      const normalized = sched.map((it) => {
        let status = it.status || (it.actual_date ? 'completed' : (() => {
          const d = it.scheduled_date || it.scheduledDate || it.date
          if (!d) return 'upcoming'
          const sd = new Date(d)
          return sd < now ? 'overdue' : 'upcoming'
        })())
        const s = String(status || '').toLowerCase()
        if (s === 'completed' || s === 'done') status = 'completed'
        else if (s === 'overdue') status = 'overdue'
        else if (['due','pending','scheduled','rescheduled','upcoming'].includes(s)) status = 'upcoming'
        if (!status) status = 'upcoming'
        return { ...it, status }
      })
      return {
        completed: normalized.filter(s => String(s.status).toLowerCase() === 'completed').length,
        upcoming: normalized.filter(s => ['upcoming','due','pending','scheduled','rescheduled'].includes(String(s.status).toLowerCase())).length,
        overdue: normalized.filter(s => String(s.status).toLowerCase() === 'overdue').length,
      }
    }

    // NETWORK-FIRST
    if (navigator.onLine) {
      try {
        const response = await api.get('/parent/children')
        const freshChildren = Array.isArray(response?.data) ? response.data : (response?.data?.data || [])
        children.value = freshChildren
        stats.value.totalChildren = freshChildren.length

        let dueCount = 0
        let completedCount = 0
        if (freshChildren.length) {
          try {
            const results = await Promise.all(
              freshChildren.map(async (c) => {
                const id = c?.id || c?.patient_id
                if (!id) return { completed: 0, upcoming: 0, overdue: 0 }
                try {
                  const res = await api.get(`/parent/children/${id}/schedule`)
                  const payload = res?.data?.data || res?.data || {}
                  return deriveStats(payload)
                } catch (_) {
                  return { completed: 0, upcoming: 0, overdue: 0 }
                }
              })
            )
            completedCount = results.reduce((sum, s) => sum + (s.completed || 0), 0)
            const upcomingTotal = results.reduce((sum, s) => sum + (s.upcoming || 0), 0)
            const overdueTotal = results.reduce((sum, s) => sum + (s.overdue || 0), 0)
            dueCount = upcomingTotal + overdueTotal
            children.value = children.value.map((c, i) => {
              const s = results[i] || { completed: 0, upcoming: 0, overdue: 0 }
              return {
                ...c,
                vaccinationSummary: {
                  completed: s.completed || 0,
                  total: (s.completed || 0) + (s.upcoming || 0) + (s.overdue || 0)
                }
              }
            })
          } catch (_) { /* ignore */ }
        }
        stats.value.dueVaccines = dueCount
        stats.value.completedVaccines = completedCount
      } catch (_) { /* fall through */ }
    }

    // OFFLINE or API failed: read from IndexedDB directly
    if (!navigator.onLine || children.value.length === 0) {
      try {
        const cachedChildren = await db.patients.toArray()
        if (!cachedChildren.length) throw new Error('No cached children found')
        children.value = cachedChildren
        stats.value.totalChildren = cachedChildren.length

        let dueCount = 0
        let completedCount = 0
        const results = await Promise.all(
          cachedChildren.map(async (c) => {
            const id = c?.id || c?.patient_id
            if (!id) return { completed: 0, upcoming: 0, overdue: 0 }
            // Compute from cached schedules
            const sched = await db.patientschedule.where('patient_id').equals(Number(id)).toArray()
            return deriveStats({ schedule: sched })
          })
        )
        completedCount = results.reduce((sum, s) => sum + (s.completed || 0), 0)
        const upcomingTotal = results.reduce((sum, s) => sum + (s.upcoming || 0), 0)
        const overdueTotal = results.reduce((sum, s) => sum + (s.overdue || 0), 0)
        dueCount = upcomingTotal + overdueTotal
        children.value = cachedChildren.map((c, i) => {
          const s = results[i] || { completed: 0, upcoming: 0, overdue: 0 }
          return {
            ...c,
            vaccinationSummary: {
              completed: s.completed || 0,
              total: (s.completed || 0) + (s.upcoming || 0) + (s.overdue || 0)
            }
          }
        })
        stats.value.dueVaccines = dueCount
        stats.value.completedVaccines = completedCount
      } catch (dbError) {
        console.error('Failed to read from IndexedDB:', dbError)
        if (!navigator.onLine) {
          throw new Error('Unable to load data offline. Please connect to the internet.')
        }
      }
    }
  } catch (error) {
    console.error('💥 Error in fetchDashboardStats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardStats()
})
</script>

<style scoped>
.dashboard-container {
  background-color: #f8f9fa;
  min-height: calc(100vh - 56px - 70px);
  width: 100%;
  margin: 0 !important;
  padding: 0 !important;
}

.welcome-header {
  background: #2563eb;
  color: white;
  padding: 1.5rem 1rem;
  text-align: left;
  width: 100%;
  margin: 0 !important;
}

.welcome-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.welcome-subtitle {
  font-size: 0.85rem;
  opacity: 0.9;
  margin: 0;
}

/* Tablets and larger */
@media (min-width: 576px) {
  .welcome-header {
    padding: 2rem 1.5rem;
  }
  
  .welcome-title {
    font-size: 1.5rem;
  }
  
  .welcome-subtitle {
    font-size: 0.9rem;
  }
}

/* Very small screens (iPhone SE, etc.) */
@media (max-width: 375px) {
  .welcome-header {
    padding: 1.25rem 0.875rem;
  }
  
  .welcome-title {
    font-size: 1.125rem;
  }
  
  .welcome-subtitle {
    font-size: 0.8rem;
  }
}
</style>
