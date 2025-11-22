<template>
  <div class="parent-layout mobile-first">
    <!-- Fixed Header: Blue TopBar -->
    <ParentTopBar :title="title" />

    <!-- Scrollable Content Area -->
    <main class="parent-main-wrapper">
      <div class="parent-main-content">
        <slot />
      </div>
    </main>

    <!-- Fixed Bottom Navigation -->
    <ParentBottomNavbar />

    <!-- Toast Notifications -->
    <ToastContainer />

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
import { ref, onMounted } from 'vue'
import ParentTopBar from './ParentTopBar.vue'
import ParentBottomNavbar from './ParentBottomNavbar.vue'
import ToastContainer from '@/components/ui/feedback/ToastContainer.vue'
import PushPermissionModal from '@/components/ui/modals/PushPermissionModal.vue'
import { usePushNotifications } from '@/composables/usePushNotifications'
import { useAuth } from '@/composables/useAuth'

defineProps({
  title: {
    type: String,
    default: null
  }
})

const showPushPermissionModal = ref(false)
const { isSupported, permission, isSubscribed, subscribe } = usePushNotifications()

// Check if we should show push permission modal
onMounted(async () => {
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

  // Only show modal if:
  // 1. Push is supported
  // 2. Permission not yet decided
  // 3. User hasn't been asked before (check localStorage with user-specific key)
  const { userInfo } = useAuth()
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
  const { userInfo } = useAuth()
  const userId = userInfo.value?.user_id || userInfo.value?.id
  localStorage.setItem(`push_permission_asked_${userId}`, 'true')
  console.log('✅ Push notifications enabled')
}

const handlePushDismissed = () => {
  const { userInfo } = useAuth()
  const userId = userInfo.value?.user_id || userInfo.value?.id
  localStorage.setItem(`push_permission_asked_${userId}`, 'true')
  console.log('ℹ️ Push permission dismissed')
}
</script>

<style scoped>
.parent-layout.mobile-first {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #f8f9fa;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.parent-main-wrapper {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  padding: 0;
  margin: 0;
  -webkit-overflow-scrolling: touch;
  background-color: #f8f9fa;
}

.parent-main-content {
  padding: 0;
  width: 100%;
  max-width: 100%;
  margin: 0;
  min-height: calc(100vh - 56px - 70px);
  background: transparent;
  /* Add bottom padding for comfortable scrolling */
  padding-bottom: 80px;
}
</style>
