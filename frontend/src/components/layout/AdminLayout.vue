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
import { ref, provide, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useConfirm } from '@/composables/useConfirm'
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const { confirmState, handleConfirm, handleCancel } = useConfirm()

const sidebarOpen = ref(true)
const { userInfo } = useAuth()

// Provide admin role context to child components
provide('isAdmin', true)

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

@media (max-width: 991px) {
  .admin-layout .main-content {
    margin-left: 0 !important;
    margin-top: 0 !important;
    padding: 1rem !important;
  }
}
</style>
