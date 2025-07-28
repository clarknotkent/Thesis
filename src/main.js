// src/main.js
import { createApp } from 'vue'

// Import Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import App from './App.vue'
import { pwaState } from './pwa-state' // Import our new state

// Listen for the PWA install prompt event right away
window.addEventListener('beforeinstallprompt', () => {
  // Update the shared state when the event is fired
  pwaState.isInstallable = true
}, { once: true })


createApp(App).mount('#app')