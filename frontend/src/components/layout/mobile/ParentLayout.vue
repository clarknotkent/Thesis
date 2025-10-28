<template>
  <div class="parent-layout">
    <!-- Mobile Header -->
    <header class="parent-header bg-primary text-white p-3 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center">
        <i class="bi bi-shield-check fs-4 me-2"></i>
        <h5 class="mb-0">ImmunizeMe</h5>
      </div>
      <div class="dropdown">
        <button class="btn btn-link text-white" type="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-circle fs-4"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><h6 class="dropdown-header">Parent Portal</h6></li>
          <li><router-link class="dropdown-item" to="/parent/profile">Profile</router-link></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" @click="logout">Logout</a></li>
        </ul>
      </div>
    </header>

    <!-- Main Content -->
    <main class="parent-main">
      <slot />
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav class="parent-bottom-nav bg-white border-top">
      <div class="d-flex">
        <router-link 
          to="/parent/dashboard" 
          class="nav-item flex-fill text-center p-3"
          :class="{ 'active': $route.path === '/parent/dashboard' }"
        >
          <i class="bi bi-house d-block fs-5"></i>
          <small>Dashboard</small>
        </router-link>
        <a 
          href="#" 
          class="nav-item flex-fill text-center p-3"
          :class="{ 'disabled': !hasChildId }"
          @click="navigateToChildInfo"
        >
          <i class="bi bi-person d-block fs-5"></i>
          <small>My Child</small>
        </a>
        <a 
          href="#" 
          class="nav-item flex-fill text-center p-3"
          :class="{ 'disabled': !hasChildId }"
          @click="navigateToVaccinationSchedule"
        >
          <i class="bi bi-calendar-check d-block fs-5"></i>
          <small>Schedule</small>
        </a>
      </div>
    </nav>

    <!-- Toast Notifications -->
    <ToastContainer />
    
    <!-- Global Confirm Dialog -->
    <ConfirmDialog 
      :show="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :variant="confirmState.variant"
      :confirmText="confirmState.confirmText"
      :cancelText="confirmState.cancelText"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ToastContainer from '@/components/ui/feedback/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'
import { useConfirm } from '@/composables/useConfirm'

const { confirmState, handleConfirm, handleCancel } = useConfirm()

const router = useRouter()
const route = useRoute()

// Check if current route has childId parameter
const hasChildId = computed(() => {
  return route.params.childId
})

// Get current childId from route
const currentChildId = computed(() => {
  return route.params.childId
})

const navigateToChildInfo = () => {
  if (hasChildId.value) {
    router.push(`/parent/child-info/${currentChildId.value}`)
  } else {
    // If no child selected, go back to dashboard
    router.push('/parent/dashboard')
  }
}

const navigateToVaccinationSchedule = () => {
  if (hasChildId.value) {
    router.push(`/parent/vaccination-schedule/${currentChildId.value}`)
  } else {
    // If no child selected, go back to dashboard
    router.push('/parent/dashboard')
  }
}

const logout = () => {
  // Handle logout logic
  router.push('/auth/login')
}
</script>

<!-- Styles moved to src/assets/styles/parent.css for consistency -->
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.parent-main {
  flex: 1;
  padding: 1rem;
  padding-bottom: 80px; /* Space for bottom nav */
  background-color: #f8f9fa;
}

.parent-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
}

.nav-item {
  color: #6c757d;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: #007bff;
  background-color: #f8f9fa;
}

.nav-item.active {
  color: #007bff;
  background-color: #e3f2fd;
}

.nav-item.disabled {
  color: #adb5bd !important;
  cursor: not-allowed;
  opacity: 0.6;
}

.nav-item.disabled:hover {
  color: #adb5bd !important;
  background-color: transparent !important;
}
<!-- Styles moved to src/assets/styles/parent.css for consistency -->
