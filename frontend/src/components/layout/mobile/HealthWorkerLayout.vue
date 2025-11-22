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
      @update:search-query="$emit('update:searchQuery', $event)"
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
      :confirm-text="confirmState.confirmText"
      :cancel-text="confirmState.cancelText"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

    <!-- Push Permission Modal -->
    <PushPermissionModal
      :show="showPushPermissionModal"
      @close="handlePushModalClose"
      @enabled="handlePushEnabled"
      @dismissed="handlePushDismissed"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import MobileHeader from './MobileHeader.vue'
import MobileBottomNavbar from './MobileBottomNavbar.vue'
import ToastContainer from '@/components/ui/feedback/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'
import PushPermissionModal from '@/components/ui/modals/PushPermissionModal.vue'
import { useAuth } from '@/composables/useAuth'
import { useConfirm } from '@/composables/useConfirm'
import { useOfflineBHS } from '@/composables/useOfflineBHS'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { usePushNotifications } from '@/composables/usePushNotifications'
import { onMounted } from 'vue'

defineProps({
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
const { isOnline } = useOnlineStatus()
const { prefetchAndCacheData } = useOfflineBHS()
const { isSupported, permission, isSubscribed, subscribe } = usePushNotifications()

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

const showPushPermissionModal = ref(false)

// Prefetch BHS data when online
onMounted(async () => {
  if (isOnline.value) {
    console.log('🚀 Checking BHS data prefetch status...')
    try {
      await prefetchAndCacheData()
      console.log('✅ BHS data prefetch check completed')
    } catch (error) {
      console.error('❌ BHS data prefetch check failed:', error)
    }
  }

  // Re-subscribe to push if permission already granted but not subscribed
  // This handles user switching - update subscription with current user ID
  if (isSupported.value && permission.value === 'granted' && !isSubscribed.value) {
    console.log('🔄 Re-subscribing push notifications for current user...')
    try {
      await subscribe()
      console.log('✅ Push subscription updated for current user')
    } catch (error) {
      console.error('❌ Failed to update push subscription:', error)
    }
  }

  // Check if we should show push permission modal
  const userId = userInfo.value?.user_id || userInfo.value?.id
  const hasAskedBefore = localStorage.getItem(`push_permission_asked_${userId}`)

  if (isSupported.value && permission.value === 'default' && !hasAskedBefore && !isSubscribed.value) {
    // Show modal after a short delay for better UX
    setTimeout(() => {
      showPushPermissionModal.value = true
    }, 3000)
  }
})

const handlePushModalClose = () => {
  showPushPermissionModal.value = false
}

const handlePushEnabled = () => {
  const userId = userInfo.value?.user_id || userInfo.value?.id
  localStorage.setItem(`push_permission_asked_${userId}`, 'true')
  console.log('✅ Push notifications enabled')
}

const handlePushDismissed = () => {
  const userId = userInfo.value?.user_id || userInfo.value?.id
  localStorage.setItem(`push_permission_asked_${userId}`, 'true')
  console.log('ℹ️ Push permission dismissed')
}
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
  padding: 0;
  margin: 0;
}

.mobile-content {
  padding: 0;
  max-width: 100%;
  width: 100%;
  margin: 0;
  min-height: 100%;
  background: #ffffff;
  /* Add bottom padding for comfortable scrolling */
  padding-bottom: 80px;
}
</style>
