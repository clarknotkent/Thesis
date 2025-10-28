<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': !sidebarOpen }">
    <Navbar 
      user-role="Admin" 
      :user-name="userName"
      @toggle-sidebar="toggleSidebar" 
    />
    
    <Sidebar 
      :is-open="sidebarOpen"
      user-role="admin"
    />

    <main class="main-content">
      <slot />
    </main>

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

  <!-- RightSidebar and toggle button removed for UX improvement -->
  </div>
</template>

<script setup>
import { ref, provide, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useConfirm } from '@/composables/useConfirm'
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'
import ToastContainer from '@/components/ui/feedback/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'

const { confirmState, handleConfirm, handleCancel } = useConfirm()

const sidebarOpen = ref(true)
const { userInfo } = useAuth()

// Provide admin role context to child components
provide('isAdmin', true)

// Auto-collapse sidebar on smaller screens
onMounted(() => {
  const handleResize = () => {
    // On mobile/tablet, default to closed
    // On desktop, keep current state (allow user to toggle)
    if (window.innerWidth < 992) {
      sidebarOpen.value = false
    }
    // Don't force open on desktop - respect user's toggle preference
  }
  
  // Initial check
  handleResize()
  
  // Listen for window resize
  window.addEventListener('resize', handleResize)
  
  // Cleanup
  return () => window.removeEventListener('resize', handleResize)
})

// Get user's actual name from auth
const userName = computed(() => {
  if (!userInfo.value) return 'Admin User'
  
  const { firstname, middlename, surname, name } = userInfo.value
  
  // Try to construct full name from parts
  if (firstname || surname) {
    return [firstname, middlename, surname].filter(Boolean).join(' ').trim() || 'Admin User'
  }
  
  // Fallback to 'name' field if available
  return name || 'Admin User'
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-layout .main-content {
  flex: 1;
  margin-left: 250px !important;
  margin-top: 70px !important;
  padding: 1rem !important;
  background-color: #f8f9fa;
  transition: margin-left 0.3s ease;
  min-height: calc(100vh - 70px);
}

/* Adjust main content when sidebar is collapsed */
.admin-layout.sidebar-collapsed .main-content {
  margin-left: 0 !important;
}

/* Tablet and smaller desktop screens */
@media (max-width: 991px) {
  .admin-layout .main-content {
    margin-left: 0 !important;
    margin-top: 60px !important;
    padding: 1rem !important;
    min-height: calc(100vh - 60px);
  }
  
  /* Sidebar becomes overlay on smaller screens */
  .admin-layout.sidebar-collapsed .main-content {
    margin-left: 0 !important;
  }
}

/* Mobile screens */
@media (max-width: 768px) {
  .admin-layout .main-content {
    margin-top: 56px !important;
    padding: 0.75rem !important;
    min-height: calc(100vh - 56px);
  }
}
</style>
