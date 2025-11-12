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

// Load cache debug helpers (available in console as window.checkCache(), etc.)
if (import.meta.env.DEV) {
  import('./services/offline/cacheDebugHelper').catch(() => {})
}

// SECURITY: Wipe all offline databases if user is not authenticated
// This prevents leftover sensitive data from appearing on login/landing pages
// NOTE: Parent portal offline functionality has been removed - only staff offline DB remains
;(async () => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.log('🔒 No active session detected - wiping offline database for security')
      
      // Dynamically import staff database to avoid initialization if not needed
      const { db } = await import('./services/offline/db')
      
      await db.delete().then(() => console.log('✅ Wiped StaffOfflineDB'))
    }
  } catch (error) {
    console.warn('⚠️ Database cleanup skipped:', error.message)
  }
})()

// Set up offline route error handler
window.__showOfflineRouteError = () => {
  // Pages will now gracefully handle offline state without blocking navigation
  console.log('ℹ️ Offline navigation attempted - continuing without toast notification')
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
        
        // Auto-warm cache for parent routes when online
        if (navigator.onLine) {
          // Delay cache warming to avoid blocking initial app load
          setTimeout(async () => {
            try {
              console.log('🔥 Auto-warming parent portal cache...')
              const { warmParentPortalCache } = await import('@/utils/cacheWarmer')
              const result = await warmParentPortalCache()
              console.log(`✅ Cache warming complete: ${result.successful}/${result.total} components cached`)
            } catch (error) {
              console.warn('⚠️ Cache warming failed:', error.message)
            }
          }, 2000) // Wait 2 seconds after app load
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
          console.log('❌ Parent offline functionality has been removed')
          return { error: 'Parent offline functionality removed - online only mode' }
        }
        
        window.__testOfflineRouting = async () => {
          console.log('❌ Parent offline functionality has been removed')
          return { error: 'Parent offline functionality removed - online only mode' }
        }
        
        console.log('🛠️ Debug helpers available:')
        console.log('   - window.__updateServiceWorker() - Update and reload SW')
        console.log('   - window.__checkCacheStatus() - View cached resources')
        console.log('   - window.__startIdlePrefetch() - Start background prefetcher')
        console.log('   - window.__stopIdlePrefetch() - Stop background prefetcher')
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

// Parent chat offline sync removed - online only mode
