/**
 * Global Notification Store
 * 
 * Centralized state management for notifications across the app.
 * Handles unread count, app badge updates, and real-time syncing.
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { notificationAPI } from '@/services/api'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const lastFetchTime = ref(null)
  
  // Computed
  const hasUnread = computed(() => unreadCount.value > 0)
  const badgeText = computed(() => {
    if (unreadCount.value === 0) return ''
    if (unreadCount.value > 99) return '99+'
    return unreadCount.value.toString()
  })

  // Check if Badging API is supported
  const isBadgingSupported = 'setAppBadge' in navigator

  /**
   * Update the app icon badge
   * Uses the Browser Badging API (supported on Android Chrome, Edge, Samsung Internet)
   */
  const updateAppBadge = (count = null) => {
    const badgeCount = count !== null ? count : unreadCount.value

    if (!isBadgingSupported) {
      console.log('📛 Badging API not supported on this browser')
      return
    }

    try {
      if (badgeCount > 0) {
        navigator.setAppBadge(badgeCount)
        console.log(`📛 App badge set to: ${badgeCount}`)
      } else {
        navigator.clearAppBadge()
        console.log('📛 App badge cleared')
      }
    } catch (error) {
      console.error('Failed to update app badge:', error)
    }
  }

  /**
   * Fetch unread notification count from API
   */
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getMyNotifications({ 
        unreadOnly: true, 
        limit: 1 
      })
      
      const data = response?.data?.data || response?.data || []
      
      // Try to get count from response
      if (typeof response?.data?.count === 'number') {
        unreadCount.value = response.data.count
      } else if (typeof response?.data?.totalUnread === 'number') {
        unreadCount.value = response.data.totalUnread
      } else if (Array.isArray(data)) {
        // Fallback: fetch all unread and count them
        const allUnread = await notificationAPI.getMyNotifications({ 
          unreadOnly: true, 
          limit: 100 
        })
        const unreadArray = allUnread?.data?.data || allUnread?.data || []
        unreadCount.value = Array.isArray(unreadArray) ? unreadArray.length : 0
      }
      
      lastFetchTime.value = new Date()
      console.log(`📬 Unread count fetched: ${unreadCount.value}`)
      
      // Update app badge
      updateAppBadge()
      
      return unreadCount.value
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
      return 0
    }
  }

  /**
   * Fetch all notifications
   */
  const fetchNotifications = async (params = {}) => {
    loading.value = true
    try {
      const response = await notificationAPI.getMyNotifications(params)
      const data = response?.data?.data || response?.data || []
      
      notifications.value = Array.isArray(data) ? data : []
      
      // Update unread count
      const unread = notifications.value.filter(n => !n.read_at && !n.read)
      unreadCount.value = unread.length
      
      updateAppBadge()
      
      return notifications.value
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark notification as read
   */
  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId)
      
      // Update local state
      const notification = notifications.value.find(n => n.id === notificationId || n.notification_id === notificationId)
      if (notification) {
        notification.read = true
        notification.read_at = new Date().toISOString()
      }
      
      // Decrement unread count
      if (unreadCount.value > 0) {
        unreadCount.value--
        updateAppBadge()
      }
      
      return true
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      // Mark all unread notifications
      const unreadNotifications = notifications.value.filter(n => !n.read_at && !n.read)
      
      for (const notification of unreadNotifications) {
        const id = notification.id || notification.notification_id
        await notificationAPI.markAsRead(id)
        notification.read = true
        notification.read_at = new Date().toISOString()
      }
      
      unreadCount.value = 0
      updateAppBadge()
      
      return true
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      return false
    }
  }

  /**
   * Delete a notification
   */
  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId)
      
      // Remove from local state
      const index = notifications.value.findIndex(
        n => n.id === notificationId || n.notification_id === notificationId
      )
      
      if (index !== -1) {
        const wasUnread = !notifications.value[index].read_at && !notifications.value[index].read
        notifications.value.splice(index, 1)
        
        if (wasUnread && unreadCount.value > 0) {
          unreadCount.value--
          updateAppBadge()
        }
      }
      
      return true
    } catch (error) {
      console.error('Failed to delete notification:', error)
      return false
    }
  }

  /**
   * Increment unread count (called when new notification arrives)
   */
  const incrementUnread = (amount = 1) => {
    unreadCount.value += amount
    updateAppBadge()
  }

  /**
   * Decrement unread count
   */
  const decrementUnread = (amount = 1) => {
    unreadCount.value = Math.max(0, unreadCount.value - amount)
    updateAppBadge()
  }

  /**
   * Reset unread count
   */
  const resetUnread = () => {
    unreadCount.value = 0
    updateAppBadge()
  }

  /**
   * Start polling for notifications
   */
  let pollInterval = null
  const startPolling = (intervalMs = 30000) => {
    if (pollInterval) return // Already polling
    
    console.log(`🔄 Starting notification polling (${intervalMs}ms)`)
    
    // Initial fetch
    fetchUnreadCount()
    
    // Set up interval
    pollInterval = setInterval(() => {
      fetchUnreadCount()
    }, intervalMs)
  }

  /**
   * Stop polling
   */
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
      console.log('🛑 Stopped notification polling')
    }
  }

  // Watch unread count changes to update badge
  watch(unreadCount, (newCount) => {
    updateAppBadge(newCount)
  })

  return {
    // State
    notifications,
    unreadCount,
    loading,
    lastFetchTime,
    
    // Computed
    hasUnread,
    badgeText,
    isBadgingSupported,
    
    // Actions
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    incrementUnread,
    decrementUnread,
    resetUnread,
    updateAppBadge,
    startPolling,
    stopPolling
  }
})
