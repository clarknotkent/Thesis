<template>
  <ParentLayout title="My Records">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger m-3" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="dependents.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <i class="bi bi-folder"></i>
      </div>
      <h5 class="empty-state-title">No Records Found</h5>
      <p class="empty-state-text">
        You don't have any registered dependents yet. Please contact your health worker to register your child.
      </p>
    </div>

    <!-- Dependents List -->
    <div v-else class="records-container">
      <div class="section-header">
        <h5 class="section-title">My Family's Records</h5>
        <p class="section-subtitle">Tap on a child to view their health records</p>
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
import api from '@/services/api'

const loading = ref(true)
const error = ref(null)
const dependents = ref([])

const fetchDependents = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Use the parent-specific endpoint that handles auth internally
    const response = await api.get('/parent/children')
    const patients = response.data?.data || response.data || []
    
    // The backend already formats the data, so we can use it directly
    dependents.value = patients.map(child => ({
      id: child.id || child.patient_id,
      name: child.name || child.full_name,
      age: child.age,
      status: child.nextVaccine || 'No upcoming vaccines',
      raw: child // Keep raw data for debugging
    }))
  } catch (err) {
    console.error('Error fetching dependents:', err)
    error.value = 'Failed to load dependents. Please try again later.'
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
