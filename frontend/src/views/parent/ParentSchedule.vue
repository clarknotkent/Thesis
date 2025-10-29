<template>
  <div class="parent-schedule-layout">
    <!-- Fixed Top Bar -->
    <div class="top-bar">
      <h1 class="page-title">My Family's Schedule</h1>
      <div class="icon-group">
        <button class="icon-button" @click="goToNotifications" aria-label="Notifications">
          <i class="bi bi-bell"></i>
          <span v-if="unreadNotifications > 0" class="badge-dot"></span>
        </button>
        <button class="icon-button" @click="goToMessages" aria-label="Messages">
          <i class="bi bi-chat-dots"></i>
          <span v-if="unreadMessages > 0" class="badge-dot"></span>
        </button>
      </div>
    </div>

    <!-- Scrollable Content Area -->
    <div class="content-area">
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
          <h5 class="section-title">Select a Child</h5>
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
    </div>

    <!-- Fixed Bottom Navigation Bar -->
    <ParentBottomNavbar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ParentBottomNavbar from '@/components/layout/mobile/ParentBottomNavbar.vue'
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

const goToNotifications = () => {
  router.push('/parent/notifications')
}

const goToMessages = () => {
  router.push('/parent/messages')
}

onMounted(() => {
  fetchChildren()
})
</script>

<style scoped>
.parent-schedule-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f3f4f6;
}

/* Fixed Top Bar */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.icon-group {
  display: flex;
  gap: 0.75rem;
}

.icon-button {
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.icon-button:active {
  background: rgba(255, 255, 255, 0.4);
}

.icon-button i {
  font-size: 1.25rem;
}

.badge-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

/* Scrollable Content Area */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px; /* Padding for bottom navbar */
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
  .top-bar {
    padding: 0.875rem 1rem;
  }

  .page-title {
    font-size: 1.125rem;
  }

  .icon-button {
    width: 36px;
    height: 36px;
  }

  .icon-button i {
    font-size: 1.125rem;
  }

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

<style scoped>
.parent-schedule-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f3f4f6;
}

/* Fixed Top Bar */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.icon-group {
  display: flex;
  gap: 0.75rem;
}

.icon-button {
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.icon-button:active {
  background: rgba(255, 255, 255, 0.4);
}

.icon-button i {
  font-size: 1.25rem;
}

.badge-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

/* Scrollable Content Area */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px; /* Padding for bottom navbar */
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

/* Schedule Container */
.schedule-container {
  padding: 1.25rem;
}

/* Stats Summary */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.stat-icon.upcoming {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-icon.overdue {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  -webkit-overflow-scrolling: touch;
}

.filter-tabs::-webkit-scrollbar {
  display: none;
}

.filter-tab {
  padding: 0.5rem 1rem;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-tab:hover {
  border-color: #d1d5db;
}

.filter-tab.active {
  background: #007bff;
  border-color: #007bff;
  color: #ffffff;
}

/* Schedule List */
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .top-bar {
    padding: 0.875rem 1rem;
  }

  .page-title {
    font-size: 1.125rem;
  }

  .icon-button {
    width: 36px;
    height: 36px;
  }

  .icon-button i {
    font-size: 1.125rem;
  }

  .schedule-container {
    padding: 1rem;
  }

  .stats-summary {
    gap: 0.5rem;
  }

  .stat-card {
    padding: 0.75rem;
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 1.125rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.6875rem;
  }

  .filter-tab {
    padding: 0.375rem 0.875rem;
    font-size: 0.8125rem;
  }
}
</style>
