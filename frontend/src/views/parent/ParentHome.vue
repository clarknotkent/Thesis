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
    
    console.log('🚀 Starting fetchDashboardStats')
    console.log('🔐 User info:', userInfo.value)
    console.log('🌐 Navigator online:', navigator.onLine)
    
    // NETWORK-FIRST: If online, fetch from API directly (fast)
    if (navigator.onLine) {
      console.log('🌐 Fetching fresh data from API (online)')
      try {
        const response = await api.get('/parent/children')
        const freshChildren = response.data?.data || response.data || []
        
        // Update UI with fresh data
        children.value = freshChildren
        stats.value.totalChildren = freshChildren.length
        
        let dueCount = 0
        let completedCount = 0
        
        freshChildren.forEach(child => {
          if (child.vaccinationSummary) {
            completedCount += child.vaccinationSummary.completed || 0
            const pending = (child.vaccinationSummary.total || 0) - (child.vaccinationSummary.completed || 0)
            dueCount += pending > 0 ? pending : 0
          }
        })
        
        stats.value.dueVaccines = dueCount
        stats.value.completedVaccines = completedCount
        
        console.log('✅ Dashboard updated with fresh data')
      } catch (apiError) {
        console.error('❌ Failed to fetch from API:', apiError)
        // Fall through to offline fallback
      }
    }
    
    // OFFLINE FALLBACK: If offline or API failed, use IndexedDB
    if (!navigator.onLine || children.value.length === 0) {
      console.log('📴 Loading from IndexedDB cache')
      try {
        let cachedChildren = await db.patients.toArray()
        console.log('� IndexedDB check - found', cachedChildren.length, 'children')
        
        if (cachedChildren.length > 0) {
          console.log('� Using cached children')
          children.value = cachedChildren
          stats.value.totalChildren = cachedChildren.length
          
          // Calculate stats from cached data
          let dueCount = 0
          let completedCount = 0
          
          cachedChildren.forEach(child => {
            if (child.vaccinationSummary) {
              completedCount += child.vaccinationSummary.completed || 0
              const pending = (child.vaccinationSummary.total || 0) - (child.vaccinationSummary.completed || 0)
              dueCount += pending > 0 ? pending : 0
            }
          })
          
          stats.value.dueVaccines = dueCount
          stats.value.completedVaccines = completedCount
        } else {
          throw new Error('No cached children found')
        }
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
    console.log('🏁 Finished fetchDashboardStats - loading:', loading.value, 'children count:', children.value.length)
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
