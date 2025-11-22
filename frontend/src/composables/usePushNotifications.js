/**
 * usePushNotifications Composable
 * 
 * Vue composable for managing push notification subscriptions.
 * Provides reactive state and methods for handling push notifications.
 */

import { ref, computed, onMounted } from 'vue'
import {
  isPushSupported as checkPushSupport,
  getPermission,
  requestPermission,
  subscribeUser,
  unsubscribeUser,
  getSubscription,
  isSubscribed as checkIsSubscribed,
  showLocalNotification
} from '@/services/pushNotifications'

export function usePushNotifications() {
  // State
  const isSupported = ref(false)
  const permission = ref('default')
  const isSubscribed = ref(false)
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const canSubscribe = computed(() => {
    return isSupported.value && permission.value === 'granted'
  })

  const needsPermission = computed(() => {
    return isSupported.value && permission.value === 'default'
  })

  const permissionDenied = computed(() => {
    return permission.value === 'denied'
  })

  /**
   * Initialize push notification state
   */
  const initialize = async () => {
    isSupported.value = checkPushSupport()
    
    if (!isSupported.value) {
      console.warn('Push notifications not supported on this browser')
      return
    }

    permission.value = getPermission()
    
    if (permission.value === 'granted') {
      isSubscribed.value = await checkIsSubscribed()
    }

    console.log('🔔 Push notification state:', {
      isSupported: isSupported.value,
      permission: permission.value,
      isSubscribed: isSubscribed.value
    })
  }

  /**
   * Subscribe to push notifications
   */
  const subscribe = async () => {
    if (!isSupported.value) {
      error.value = 'Push notifications not supported'
      return false
    }

    loading.value = true
    error.value = null

    try {
      // Request permission
      const perm = await requestPermission()
      permission.value = perm

      if (perm !== 'granted') {
        error.value = 'Permission denied'
        return false
      }

      // Subscribe
      await subscribeUser()
      isSubscribed.value = true

      console.log('✅ Successfully subscribed to push notifications')
      return true
    } catch (err) {
      console.error('Failed to subscribe:', err)
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = async () => {
    loading.value = true
    error.value = null

    try {
      const success = await unsubscribeUser()
      if (success) {
        isSubscribed.value = false
        console.log('✅ Successfully unsubscribed from push notifications')
      }
      return success
    } catch (err) {
      console.error('Failed to unsubscribe:', err)
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Get current subscription
   */
  const getCurrentSubscription = async () => {
    try {
      return await getSubscription()
    } catch (err) {
      console.error('Failed to get subscription:', err)
      return null
    }
  }

  /**
   * Show a test notification
   */
  const showTestNotification = async () => {
    try {
      await showLocalNotification('Test Notification', {
        body: 'Push notifications are working! 🎉',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: 'test-notification'
      })
      return true
    } catch (err) {
      console.error('Failed to show test notification:', err)
      return false
    }
  }

  // Initialize on mount
  onMounted(() => {
    initialize()
  })

  return {
    // State
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,

    // Computed
    canSubscribe,
    needsPermission,
    permissionDenied,

    // Methods
    initialize,
    subscribe,
    unsubscribe,
    getCurrentSubscription,
    showTestNotification
  }
}
