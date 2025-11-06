<template>
  <ParentLayout title="My Schedule">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <div class="spinner" />
      <p>Loading children...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="error-state"
    >
      <i class="bi bi-exclamation-triangle error-icon" />
      <p class="error-text">
        {{ error }}
      </p>
      <button
        class="retry-button"
        @click="fetchChildren"
      >
        <i class="bi bi-arrow-clockwise" />
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="children.length === 0"
      class="empty-state"
    >
      <i class="bi bi-people empty-icon" />
      <h3 class="empty-title">
        No Children Found
      </h3>
      <p class="empty-text">
        You don't have any registered children yet. Please contact your health worker to register your child.
      </p>
    </div>

    <!-- Children List -->
    <div
      v-else
      class="schedule-container"
    >
      <div class="section-header">
        <h5 class="section-title">
          My Family's Schedule
        </h5>
        <p class="section-subtitle">
          Tap on a child to view their vaccination schedule
        </p>
      </div>

      <div class="children-list">
        <DependentCard
          v-for="child in children"
          :key="child.id"
          :dependent="child"
          :link-to="`/parent/schedule/${child.id}`"
        />
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import DependentCard from '@/components/parent/DependentCard.vue'
import db from '@/services/offline/db-parent-portal'
import api from '@/services/api'

const router = useRouter()

const loading = ref(true)
const error = ref(null)
const children = ref([])
const unreadNotifications = ref(0)
const unreadMessages = ref(0)

const fetchChildren = async () => {
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
    
    // NETWORK-FIRST: If online, fetch from API directly (fast)
    if (navigator.onLine) {
      console.log('🌐 Fetching fresh children data from API (online)')
      try {
        const response = await api.get('/parent/children')
        const freshChildren = response.data?.data || response.data || []
        
        // Update UI with fresh data
        children.value = freshChildren.map(child => {
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
        
        console.log('✅ Schedule updated with fresh data')
      } catch (apiError) {
        console.error('Failed to fetch from API:', apiError)
        // Fall through to offline fallback
      }
    }
    
    // OFFLINE FALLBACK: If offline or API failed, use IndexedDB
    if (!navigator.onLine || children.value.length === 0) {
      console.log('📴 Loading from IndexedDB cache')
      try {
        const cachedChildren = await db.patients.toArray()
        
        if (cachedChildren.length > 0) {
          console.log('📦 Found children in IndexedDB cache')
          
          children.value = cachedChildren.map(child => {
            const birthDate = child.date_of_birth || child.birthDate
            const calculatedAge = calculateNumericAge(birthDate)
            
            return {
              id: child.id || child.patient_id,
              name: child.name || child.full_name,
              age: calculatedAge,
              status: child.nextVaccine || 'No upcoming vaccines',
              raw: child
            }
          })
        } else {
          throw new Error('No cached children found')
        }
      } catch (dbError) {
        console.error('Failed to read from IndexedDB:', dbError)
        if (!navigator.onLine) {
          error.value = 'Unable to load schedule offline. Please connect to the internet.'
        }
      }
    }
  } catch (err) {
    console.error('Error fetching children:', err)
    error.value = 'Failed to load children. Please try again later.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchChildren()
})
</script>

<style scoped>
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

/* Schedule Container */
.schedule-container {
  padding: 1.25rem;
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #1f2937;
  font-size: 1.25rem;
}

.section-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.children-list {
  margin-top: 1rem;
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .schedule-container {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.125rem;
  }

  .section-subtitle {
    font-size: 0.8125rem;
  }
}
</style>
