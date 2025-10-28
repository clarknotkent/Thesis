<template>
  <div class="health-worker-layout mobile-first">
    <!-- Fixed Header: Blue TopBar + White Controls (when needed) -->
    <MobileHeader
      :user-role="userRole"
      :user-name="userName"
      :show-controls="showControls"
      :controls-props="controlsProps"
      @filter="$emit('filter')"
      @scan="$emit('scan')"
      @add="$emit('add')"
      @update:searchQuery="$emit('update:searchQuery', $event)"
    />

    <!-- Scrollable Content Area -->
    <main class="main-content mobile-main">
      <div class="health-worker-content mobile-content">
        <slot />
      </div>
    </main>

    <!-- Fixed Bottom Navigation -->
    <MobileBottomNavbar />

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
import MobileHeader from './MobileHeader.vue'
import MobileBottomNavbar from './MobileBottomNavbar.vue'
import ToastContainer from '@/components/ui/feedback/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'
import { useAuth } from '@/composables/useAuth'
import { useConfirm } from '@/composables/useConfirm'

const props = defineProps({
  showControls: {
    type: Boolean,
    default: false
  },
  controlsProps: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['filter', 'scan', 'add', 'update:searchQuery'])

const { confirmState, handleConfirm, handleCancel } = useConfirm()

const { userInfo, getRole } = useAuth()

const userName = computed(() => {
  if (userInfo.value) {
    // Try different possible name formats
    if (userInfo.value.full_name) return userInfo.value.full_name
    if (userInfo.value.name) return userInfo.value.name
    if (userInfo.value.firstname && userInfo.value.lastname) {
      return `${userInfo.value.firstname} ${userInfo.value.lastname}`
    }
    if (userInfo.value.firstName && userInfo.value.lastName) {
      return `${userInfo.value.firstName} ${userInfo.value.lastName}`
    }
    if (userInfo.value.email) return userInfo.value.email
  }
  return null
})

const userRole = computed(() => {
  const role = getRole()
  if (role === 'healthworker' || role === 'health_staff' || role === 'health-staff') return 'Health Staff'
  if (role === 'admin') return 'Administrator'
  if (role === 'parent') return 'Parent'
  return role
})
</script>

<style scoped>
.health-worker-layout.mobile-first {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
}

.mobile-main {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
}

.mobile-content {
  padding: 0;
  max-width: 100%;
  margin: 0 auto;
  min-height: 100%;
}

/* Larger mobile screens */
@media (min-width: 480px) {
  .mobile-content {
    padding: 0;
  }
}

/* Tablets */
@media (min-width: 768px) {
  .mobile-content {
    padding: 0;
    max-width: 1200px;
  }
}

/* Desktop */
@media (min-width: 992px) {
  .mobile-content {
    padding: 0;
    max-width: 1400px;
  }
}

/* Large Desktop */
@media (min-width: 1400px) {
  .mobile-content {
    padding: 0;
    max-width: 1600px;
  }
}
</style>
