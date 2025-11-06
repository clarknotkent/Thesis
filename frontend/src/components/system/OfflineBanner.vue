<template>
  <transition name="slide-down">
    <div
      v-if="visible"
      class="offline-banner"
      :class="isOffline ? 'offline' : 'online'"
    >
      <div class="banner-content">
        <i
          v-if="isOffline"
          class="bi bi-wifi-off me-2"
        />
        <i
          v-else
          class="bi bi-wifi me-2"
        />
        <span v-if="isOffline">You're offline. Some features are unavailable.</span>
        <span v-else>Back online.</span>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)
const isOffline = ref(!navigator.onLine)
let hideTimer = null

function showBrief() {
  clearTimeout(hideTimer)
  visible.value = true
  hideTimer = setTimeout(() => { visible.value = false }, 2500)
}

function onOnline() {
  isOffline.value = false
  showBrief()
}

function onOffline() {
  isOffline.value = true
  showBrief()
}

onMounted(() => {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  if (isOffline.value) {
    showBrief()
  }
})

onUnmounted(() => {
  window.removeEventListener('online', onOnline)
  window.removeEventListener('offline', onOffline)
  clearTimeout(hideTimer)
})
</script>

<style scoped>
.offline-banner {
  position: fixed;
  top: var(--app-navbar-height, 56px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000 !important;
  max-width: 640px;
  width: calc(100% - 2rem);
  margin: 0.5rem auto;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  font-size: 0.95rem;
}
.offline-banner.offline { background: #fff7ed; color: #7c2d12; border: 1px solid #fdba74; }
.offline-banner.online { background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; }
.banner-content { display: flex; align-items: center; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 200ms ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translate(-50%, -10px); }
</style>
