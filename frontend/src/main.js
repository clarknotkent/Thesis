import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import our custom styles (includes Bootstrap)
import './assets/styles/index.css'

// Import Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { Dropdown } from 'bootstrap'

// Import offline functionality
import { initializeOffline } from './offlineInit'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

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
			const instance = Dropdown.getOrCreateInstance(el)
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

// Initialize offline functionality (IndexedDB + sync)
initializeOffline().then(() => {
	console.log('🚀 App ready with offline support')
}).catch((error) => {
	console.error('Failed to initialize offline support:', error)
})
