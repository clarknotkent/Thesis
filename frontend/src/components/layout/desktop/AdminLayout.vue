<template>
  <div
    class="admin-layout"
    :class="{ 'sidebar-collapsed': !sidebarOpen }"
  >
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
      :confirm-text="confirmState.confirmText"
      :cancel-text="confirmState.cancelText"
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
import { useToast } from '@/composables/useToast'
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'
import ToastContainer from '@/components/ui/feedback/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'

const { confirmState, handleConfirm, handleCancel } = useConfirm()
const { addToast } = useToast()

const sidebarOpen = ref(true)
const { userInfo } = useAuth()

// Provide admin role context to child components
provide('isAdmin', true)

// Auto-collapse sidebar on smaller screens
onMounted(async () => {
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

// Prefetch admin data for offline access (only once per session)
const prefetchAdminData = async () => {
  try {
    // Check if data is already cached and fresh
    const { isAdminDataCached, getAdminCacheTimestamp } = await import('@/services/offline/adminOfflinePrefetch')
    
    const isCached = await isAdminDataCached()
    const lastCacheTime = await getAdminCacheTimestamp()
    
    // If data is cached and less than 24 hours old, skip prefetching
    if (isCached && lastCacheTime) {
      const cacheAge = Date.now() - new Date(lastCacheTime).getTime()
      const oneDay = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      
      if (cacheAge < oneDay) {
        console.log('✅ [AdminLayout] Admin data already cached and fresh, skipping prefetch')
        return
      }
    }
    
    // Data is not cached or stale, proceed with prefetching
    console.log('📥 [AdminLayout] Admin data not cached or stale, starting prefetch...')
    
    const { prefetchAdminData: prefetch } = await import('@/services/offline/adminOfflinePrefetch')
    await prefetch()
    
    console.log('✅ [AdminLayout] Admin data cached successfully')
    
    // Show success toast notification when offline mode is ready
    addToast({
      title: 'Offline Mode Ready',
      message: 'All admin data has been cached for offline access.',
      type: 'success',
      timeout: 5000
    })
  } catch (error) {
    console.error('❌ [AdminLayout] Failed to prefetch admin data:', error)
    
    // Show error toast if prefetching failed
    addToast({
      title: 'Offline Mode Error',
      message: 'Failed to cache data for offline access. Some features may be limited.',
      type: 'error',
      timeout: 7000
    })
  }
}

// Initialize prefetching when admin layout is first loaded
let prefetchInitialized = false
if (!prefetchInitialized) {
  prefetchInitialized = true
  prefetchAdminData()
}

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
