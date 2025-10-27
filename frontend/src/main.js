import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import our custom styles (includes Bootstrap)
import './assets/styles/index.css'

// Import Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { Dropdown } from 'bootstrap'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

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
