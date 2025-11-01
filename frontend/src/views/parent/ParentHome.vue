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
    const childrenResponse = await api.get('/parent/children')
    const childrenData = childrenResponse.data?.data || []
    children.value = childrenData
    stats.value.totalChildren = childrenData.length
    
    let dueCount = 0
    let completedCount = 0
    
    childrenData.forEach(child => {
      if (child.vaccinationSummary) {
        completedCount += child.vaccinationSummary.completed || 0
        const pending = (child.vaccinationSummary.total || 0) - (child.vaccinationSummary.completed || 0)
        dueCount += pending > 0 ? pending : 0
      }
    })
    
    stats.value.dueVaccines = dueCount
    stats.value.completedVaccines = completedCount
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
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
}

.welcome-header {
  background: #2563eb;
  color: white;
  padding: 1.5rem 1rem;
  text-align: left;
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
