<template>
  <ParentLayout title="My Records">
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

    <!-- Error State -->
    <div
      v-else-if="error"
      class="alert alert-danger m-3"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle me-2" />
      {{ error }}
    </div>

    <!-- Empty State -->
    <div
      v-else-if="dependents.length === 0"
      class="empty-state"
    >
      <div class="empty-state-icon">
        <i class="bi bi-folder" />
      </div>
      <h5 class="empty-state-title">
        No Records Found
      </h5>
      <p class="empty-state-text">
        You don't have any registered dependents yet. Please contact your health worker to register your child.
      </p>
    </div>

    <!-- Dependents List -->
    <div
      v-else
      class="records-container"
    >
      <div class="section-header">
        <h5 class="section-title">
          My Family's Records
        </h5>
        <p class="section-subtitle">
          Tap on a child to view their health records
        </p>
      </div>

      <div class="dependents-list">
        <DependentCard 
          v-for="dependent in dependents" 
          :key="dependent.id"
          :dependent="dependent"
          :link-to="`/parent/records/${dependent.id}`"
        />
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import DependentCard from '@/components/parent/DependentCard.vue'
import { useOfflineGuardian } from '@/composables/useOfflineGuardian'
import { useOffline } from '@/composables/useOffline'
import api from '@/services/api'

const { getCachedData } = useOfflineGuardian()
const { effectiveOnline } = useOffline()

const loading = ref(true)
const error = ref(null)
const dependents = ref([])

const fetchDependents = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Calculate numeric age from date_of_birth (for DependentCard component)
    const calculateNumericAge = (birthDate) => {
      if (!birthDate) return 0
      
      const birth = new Date(birthDate)
      const now = new Date()
      
      if (isNaN(birth.getTime())) return 0
      
      let years = now.getFullYear() - birth.getFullYear()
      let months = now.getMonth() - birth.getMonth()
      
      // Adjust if the day hasn't occurred yet this month
      if (now.getDate() < birth.getDate()) {
        months--
      }
      
      if (months < 0) {
        years--
        months += 12
      }
      
      // Return fractional age for infants (e.g., 0.5 for 6 months)
      if (years === 0) {
        return months / 12
      }
      
      return years
    }
    
    // Try to get cached data first (always attempt, regardless of network status)
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const guardianId = userInfo.id || userInfo.guardian_id || userInfo.userId || userInfo.user_id
    const cached = await getCachedData(guardianId)
    
    if (cached && cached.patients && cached.patients.length > 0) {
      dependents.value = cached.patients.map(child => {
        const birthDate = child.details?.dateOfBirth || child.details?.date_of_birth || child.details?.birthDate
        const calculatedAge = child.details?.age !== undefined ? child.details.age : calculateNumericAge(birthDate)
        
        return {
          id: child.id || child.patient_id,
          name: child.details?.name || child.details?.full_name,
          age: calculatedAge,
          status: child.details?.nextVaccine || 'No upcoming vaccines',
          raw: child.details
        }
      })
      console.log('✅ Records loaded from cache')
      
      // If offline, don't try to fetch fresh data
      if (!effectiveOnline.value) {
        console.log('📴 Offline mode - using cached data only')
        return
      }
    }

    // Try to fetch fresh data from API (only if online or no cached data)
    try {
      console.log('🌐 Fetching children data from API')
      const response = await api.get('/parent/children')
      const freshChildren = response.data?.data || response.data || []
      
      // Update UI with fresh data
      dependents.value = freshChildren.map(child => {
        const birthDate = child.dateOfBirth || child.date_of_birth || child.birthDate
        const calculatedAge = child.age !== undefined ? child.age : calculateNumericAge(birthDate)
        
        return {
          id: child.id || child.patient_id,
          name: child.name || child.full_name,
          age: calculatedAge,
          status: child.nextVaccine || 'No upcoming vaccines',
          raw: child
        }
      })
      
      console.log('✅ Records loaded successfully from API')
    } catch (apiError) {
      // If API call fails and we have cached data, keep using cached data
      if (cached && cached.patients && cached.patients.length > 0) {
        console.log('⚠️ API failed but cached data available - keeping cached data')
        return
      }
      
      // If no cached data and API fails, show error
      console.error('API call failed and no cached data available:', apiError)
      throw apiError
    }
    
  } catch (err) {
    console.error('Error fetching dependents:', err)
    
    // Check if it's a network error
    if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
      error.value = 'You appear to be offline. Please check your internet connection and try again.'
    } else {
      error.value = 'Failed to load dependents. Please try again later.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDependents()
})
</script>

<style scoped>
.records-container {
  padding: 1rem;
  min-height: calc(100vh - 56px - 70px); /* Account for header and footer */
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #333;
  font-size: 1.25rem;
}

.section-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #6c757d;
}

.dependents-list {
  margin-top: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  min-height: calc(100vh - 56px - 70px);
}

.empty-state-icon {
  width: 100px;
  height: 100px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.empty-state-icon i {
  font-size: 3rem;
  color: #6c757d;
}

.empty-state-title {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.empty-state-text {
  color: #6c757d;
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .records-container {
    padding: 0.75rem;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .section-subtitle {
    font-size: 0.8rem;
  }

  .empty-state {
    padding: 2rem 1.5rem;
  }

  .empty-state-icon {
    width: 80px;
    height: 80px;
    margin-bottom: 1rem;
  }

  .empty-state-icon i {
    font-size: 2.5rem;
  }

  .empty-state-title {
    font-size: 1.1rem;
  }

  .empty-state-text {
    font-size: 0.9rem;
  }
}
</style>
