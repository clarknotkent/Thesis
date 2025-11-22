/**
 * Push Notification Service
 * 
 * Handles Web Push API integration for browser notifications.
 * Manages subscriptions, permissions, and communication with backend.
 */

import api from './api'

// VAPID public key from backend (will be set via environment variable)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDSKidBgAXI62NU1T0Y9eQCaWkGp3ZYFGBkJJbC5FO-o'

/**
 * Convert base64 URL-safe string to Uint8Array
 * Required for VAPID key format
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Check if Push API is supported
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window
}

/**
 * Get current notification permission
 */
export function getPermission() {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/**
 * Request notification permission
 */
export async function requestPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported')
    return 'unsupported'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    console.log(`🔔 Notification permission: ${permission}`)
    return permission
  } catch (error) {
    console.error('Failed to request permission:', error)
    return 'denied'
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeUser() {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported')
  }

  try {
    // Request permission first
    const permission = await requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready
    console.log('✅ Service worker ready')

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      console.log('📱 Already subscribed to push notifications')
      return subscription
    }

    // Subscribe to push notifications
    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    })

    console.log('✅ Push subscription created:', subscription)
    
    // Send subscription to backend
    await sendSubscriptionToBackend(subscription)
    
    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    throw error
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeUser() {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      await subscription.unsubscribe()
      console.log('✅ Unsubscribed from push notifications')
      
      // Remove subscription from backend
      await removeSubscriptionFromBackend(subscription)
      
      return true
    }
    
    return false
  } catch (error) {
    console.error('Failed to unsubscribe:', error)
    return false
  }
}

/**
 * Get current subscription
 */
export async function getSubscription() {
  if (!isPushSupported()) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription
  } catch (error) {
    console.error('Failed to get subscription:', error)
    return null
  }
}

/**
 * Send subscription to backend
 */
async function sendSubscriptionToBackend(subscription) {
  try {
    const response = await api.post('/notifications/subscribe-push', {
      subscription: subscription.toJSON()
    })
    console.log('✅ Subscription sent to backend:', response.data)
    return response.data
  } catch (error) {
    console.error('Failed to send subscription to backend:', error)
    throw error
  }
}

/**
 * Remove subscription from backend
 */
async function removeSubscriptionFromBackend(subscription) {
  try {
    await api.post('/notifications/unsubscribe-push', {
      subscription: subscription.toJSON()
    })
    console.log('✅ Subscription removed from backend')
  } catch (error) {
    console.error('Failed to remove subscription from backend:', error)
  }
}

/**
 * Check if user is subscribed
 */
export async function isSubscribed() {
  const subscription = await getSubscription()
  return subscription !== null
}

/**
 * Show a local notification (for testing)
 */
export async function showLocalNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted')
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    await registration.showNotification(title, {
      body: options.body || '',
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/icon-96x96.png',
      tag: options.tag || 'local-notification',
      requireInteraction: options.requireInteraction || false,
      data: options.data || {},
      ...options
    })
    
    console.log('✅ Local notification shown')
  } catch (error) {
    console.error('Failed to show notification:', error)
  }
}
