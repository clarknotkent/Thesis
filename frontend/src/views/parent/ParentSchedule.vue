<template>
  <ParentLayout title="My Schedule">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading children...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="bi bi-exclamation-triangle error-icon"></i>
      <p class="error-text">{{ error }}</p>
      <button class="retry-button" @click="fetchChildren">
        <i class="bi bi-arrow-clockwise"></i>
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="children.length === 0" class="empty-state">
      <i class="bi bi-people empty-icon"></i>
      <h3 class="empty-title">No Children Found</h3>
      <p class="empty-text">
        You don't have any registered children yet. Please contact your health worker to register your child.
      </p>
    </div>

    <!-- Children List -->
    <div v-else class="schedule-container">
      <div class="section-header">
        <h5 class="section-title">My Family's Schedule</h5>
        <p class="section-subtitle">Tap on a child to view their vaccination schedule</p>
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
    
    // Use the parent-specific endpoint that handles auth internally
    const response = await api.get('/parent/children')
    const patients = response.data?.data || []
    
    // The backend already formats the data, so we can use it directly
    children.value = patients.map(child => ({
      id: child.id || child.patient_id,
      name: child.name || child.full_name,
      age: child.age,
      status: child.nextVaccine || 'No upcoming vaccines',
      raw: child // Keep raw data for debugging
    }))
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
