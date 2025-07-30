// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import { pwaState } from './pwa-state'

// Listen for the PWA install prompt event right away
window.addEventListener('beforeinstallprompt', () => {
  pwaState.isInstallable = true
}, { once: true })

createApp(App).mount('#app')