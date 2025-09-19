// Background Sync Worker for PWA
// This handles automatic syncing when connection is restored

import { offlineStorage } from './offlineStorage.js'

class BackgroundSyncManager {
  constructor() {
    this.syncInterval = null
    this.isRegistered = false
    this.setupBackgroundSync()
  }

  async setupBackgroundSync() {
    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register('background-sync')
        console.log('✅ Background sync registered')
        this.isRegistered = true
      } catch (error) {
        console.warn('❌ Background sync not supported:', error)
        this.setupFallbackSync()
      }
    } else {
      console.warn('⚠️ Background sync not supported, using fallback')
      this.setupFallbackSync()
    }

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())

    // Setup periodic sync check
    this.startPeriodicSync()
  }

  setupFallbackSync() {
    // Fallback for browsers that don't support background sync
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          await offlineStorage.triggerSync()
        } catch (error) {
          console.error('Periodic sync failed:', error)
        }
      }
    }, 30000) // Try to sync every 30 seconds when online
  }

  handleOnline() {
    console.log('📶 Connection restored - triggering sync')
    this.triggerImmediateSync()
  }

  handleOffline() {
    console.log('📵 Connection lost - entering offline mode')
  }

  async triggerImmediateSync() {
    try {
      await offlineStorage.triggerSync()
      this.notifyUser('✅ Data synced successfully!')
    } catch (error) {
      console.error('Immediate sync failed:', error)
      this.notifyUser('⚠️ Sync failed, will retry later')
    }
  }

  startPeriodicSync() {
    // Check sync status every 5 minutes
    setInterval(async () => {
      if (navigator.onLine) {
        const syncStatus = await offlineStorage.getSyncStatus()
        if (syncStatus.totalUnsynced > 0) {
          console.log(`📊 ${syncStatus.totalUnsynced} items pending sync`)
          await offlineStorage.triggerSync()
        }
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  notifyUser(message) {
    // Show notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Healthcare Management System', {
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png'
      })
    }

    // Also log to console
    console.log(message)

    // Dispatch custom event for UI components
    window.dispatchEvent(new CustomEvent('sync-status', {
      detail: { message, timestamp: new Date() }
    }))
  }

  // Manual sync trigger
  async manualSync() {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline')
    }

    this.notifyUser('🔄 Starting manual sync...')
    await this.triggerImmediateSync()
  }

  // Get sync statistics
  async getSyncInfo() {
    const syncStatus = await offlineStorage.getSyncStatus()
    return {
      ...syncStatus,
      isOnline: navigator.onLine,
      backgroundSyncSupported: this.isRegistered,
      lastCheck: new Date()
    }
  }

  // Stop all sync operations (for cleanup)
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
  }
}

// Create singleton instance
export const backgroundSync = new BackgroundSyncManager()

// Service Worker message handler for background sync
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'BACKGROUND_SYNC') {
      console.log('📥 Background sync message received')
      offlineStorage.triggerSync()
    }
  })
}

export default backgroundSync