import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import our custom styles (includes Bootstrap)
import './assets/styles/index.css'

// Import Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { Dropdown } from 'bootstrap'
// NOTE: chatOffline lazy-loaded to prevent ParentPortalOfflineDB from being created for admin users

// Ensure PWA service worker registration across dev/prod
// (vite-plugin-pwa will provide this virtual module)
// Note: Offline functionality is initialized dynamically after login
let registerSW
try {
	// dynamic import to avoid breaking non-PWA builds
	 
	registerSW = (await import('virtual:pwa-register')).registerSW
} catch (_) {}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// SECURITY: Wipe all offline databases if user is not authenticated
// This prevents leftover sensitive data from appearing on login/landing pages
;(async () => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.log('🔒 No active session detected - wiping all offline databases for security')
      
      // Dynamically import databases to avoid initialization if not needed
      const { db } = await import('./services/offline/db')
      const parentDb = (await import('./services/offline/db-parent-portal')).default
      
      await Promise.allSettled([
        db.delete().then(() => console.log('✅ Wiped StaffOfflineDB')),
        parentDb.delete().then(() => console.log('✅ Wiped ParentPortalOfflineDB'))
      ])
    }
  } catch (error) {
    console.warn('⚠️ Database cleanup skipped:', error.message)
  }
})()

// Set up offline route error handler
window.__showOfflineRouteError = () => {
  // Dynamic import to avoid circular dependency
  import('./composables/useToast').then(({ addToast }) => {
    addToast({
      title: 'Page Not Available Offline',
      message: 'This page hasn\'t been cached yet. Please visit it while online first, then it will work offline.',
      type: 'warning',
      timeout: 5000
    })
  }).catch(() => {
    // Fallback if toast fails
    console.warn('⚠️ Page not available offline - visit it while online first')
  })
}

// One-time role cache sanitizer to recover from malformed stored values
try {
	const rawRole = localStorage.getItem('userRole')
	if (rawRole) {
			const normalize = (r) => {
			const s = (r || '').toString().toLowerCase()
				if (['health_staff', 'health-worker', 'health_worker', 'health staff', 'healthworker'].includes(s)) return 'healthstaff'
			if (['guardian', 'parent'].includes(s)) return 'guardian'
			if (['admin', 'administrator', 'system admin'].includes(s)) return 'admin'
			return s
		}
		let val = rawRole
		if (rawRole === '[object Object]') val = ''
		else if (/^[\[{]/.test(rawRole)) {
			try {
				const parsed = JSON.parse(rawRole)
				val = parsed?.role || parsed?.name || parsed
			} catch { /* ignore */ }
		}
		const fixed = normalize(val)
		if (fixed && fixed !== rawRole) localStorage.setItem('userRole', fixed)
	}
} catch { /* ignore */ }

// Ensure dropdowns are initialized after route changes and initial mount
const initDropdowns = () => {
	const toggles = document.querySelectorAll('[data-bs-toggle="dropdown"]')
	console.log('Initializing dropdowns, found:', toggles.length)
  toggles.forEach((el, index) => {
    try {
      const _instance = Dropdown.getOrCreateInstance(el)
      console.log(`Dropdown ${index} initialized:`, el.id || el)
    } catch (e) {
      console.error('Error initializing dropdown:', e)
    }
  })
}

router.afterEach(() => {
	// Wait for DOM updates
	nextTick(() => initDropdowns())
})

app.mount('#app')

// Initial hydration
nextTick(() => initDropdowns())

// Register the service worker (dev/prod) but DON'T initialize offline yet
// Offline functionality will be initialized after user login
try {
  if (registerSW) {
    const _updateSW = registerSW({ 
      immediate: true,
      onRegistered(registration) {
        console.log('✅ Service Worker registered successfully')
        
        // Expose update function globally for debugging
        window.__updateServiceWorker = async () => {
          if (registration && registration.waiting) {
            console.log('🔄 Activating new service worker...')
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
            window.location.reload()
          } else {
            console.log('🔄 Checking for service worker updates...')
            await registration.update()
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' })
              window.location.reload()
            } else {
              console.log('✅ Service worker is up to date')
            }
          }
        }
        
        // Expose cache warming function for manual testing
        window.__warmCache = async () => {
          const { warmParentPortalCache } = await import('@/utils/cacheWarmer')
          return warmParentPortalCache()
        }
        
        // Expose cache status checker
        window.__checkCacheStatus = async () => {
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            console.log('� Available caches:', cacheNames)
            
            for (const cacheName of cacheNames) {
              const cache = await caches.open(cacheName)
              const keys = await cache.keys()
              console.log(`  ${cacheName}: ${keys.length} items`)
              
              // Show first 5 items as sample
              if (keys.length > 0) {
                console.log('  Sample cached items:')
                keys.slice(0, 5).forEach(req => {
                  console.log(`    - ${req.url}`)
                })
              }
            }
          }
        }
        
        // Expose idle prefetcher controls
        window.__startIdlePrefetch = async () => {
          const { initIdlePrefetcher, getParentPortalModules } = await import('@/utils/idlePrefetcher')
          initIdlePrefetcher(getParentPortalModules())
          console.log('⏱️ Idle prefetcher started')
        }
        
        window.__stopIdlePrefetch = async () => {
          const { stopIdlePrefetcher } = await import('@/utils/idlePrefetcher')
          stopIdlePrefetcher()
        }
        
        window.__prefetchParentData = async () => {
          console.log('🚀 Checking offline cache status...')
          try {
            const { getCacheStats } = await import('@/services/offline/offlineUtils')
            const stats = await getCacheStats()
            console.log('📊 Cache Statistics:', stats)
            console.log('💡 To populate cache, navigate to parent portal pages while online')
            return stats
          } catch (error) {
            console.error('❌ Failed to get cache stats:', error)
            return { error: error.message }
          }
        }
        
        window.__testOfflineRouting = async () => {
          console.log('🧪 Testing offline cache...')
          try {
            const { getCacheStats, _clearCache } = await import('@/services/offline/offlineUtils')
            const stats = await getCacheStats()
            console.log('✅ Offline cache stats:', stats)
            console.log('💡 Use clearCache() to clear all offline data')
            console.log('💡 Navigate to pages while online to populate cache automatically')
            return stats
          } catch (error) {
            console.error('❌ Cache check failed:', error)
            return { error: error.message }
          }
        }
        
        console.log('🛠️ Debug helpers available:')
        console.log('   - window.__updateServiceWorker() - Update and reload SW')
        console.log('   - window.__warmCache() - Pre-cache parent routes')
        console.log('   - window.__checkCacheStatus() - View cached resources')
        console.log('   - window.__startIdlePrefetch() - Start background prefetcher')
        console.log('   - window.__stopIdlePrefetch() - Stop background prefetcher')
        console.log('   - window.__prefetchParentData() - Check offline cache stats')
        console.log('   - window.__testOfflineRouting() - Test component prefetch for offline use')
      },
      onRegisterError(error) {
        console.error('❌ Service Worker registration error:', error);
      },
      onNeedRefresh() {
        console.log('🔄 New service worker available. Call window.__updateServiceWorker() to update.')
      }
    })
	}
} catch (_) {}

// Initialize chat offline syncing (flush queued messages when back online)
// Lazy-loaded to prevent ParentPortalOfflineDB from being created for admin users
;(async () => {
  try {
    const { initializeChatOfflineSync } = await import('@/services/offline/chatOffline')
    initializeChatOfflineSync()
  } catch (_) {}
})()
