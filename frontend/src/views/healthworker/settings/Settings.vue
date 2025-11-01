<template>
  <HealthWorkerLayout :show-controls="true" :controls-props="{ icon: 'gear', title: 'Settings' }">
    <div class="page-content-wrapper">
      <div class="card p-3">
        <h5 class="mb-3">General Settings (Dummy)</h5>

        <div class="form-check form-switch mb-2">
          <input class="form-check-input" type="checkbox" id="notify" v-model="settings.receiveNotifications">
          <label class="form-check-label" for="notify">Receive notifications</label>
        </div>

        <div class="form-check form-switch mb-2">
          <input class="form-check-input" type="checkbox" id="dark" v-model="settings.darkMode">
          <label class="form-check-label" for="dark">Enable dark mode</label>
        </div>

        <div class="mb-3">
          <label class="form-label">Preferred language</label>
          <select class="form-select" v-model="settings.language">
            <option value="en">English</option>
            <option value="tl">Tagalog</option>
          </select>
        </div>

        <div class="d-flex gap-2">
          <button class="btn btn-primary" @click="save">Save (dummy)</button>
          <button class="btn btn-outline-secondary" @click="reset">Reset</button>
        </div>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { addToast } from '@/composables/useToast'
import { ref } from 'vue'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'

const defaultSettings = () => ({ receiveNotifications: true, darkMode: false, language: 'en' })
const settings = ref(defaultSettings())

const save = () => {
  // Dummy save - persist to localStorage for demo
  try {
    localStorage.setItem('hw_settings', JSON.stringify(settings.value))
    addToast({ title: 'Success', message: 'Settings saved', type: 'success' })
  } catch (e) {
    console.warn('Failed to save settings locally', e)
  }
}

const reset = () => {
  settings.value = defaultSettings()
}

// Load persisted if present
try {
  const s = localStorage.getItem('hw_settings')
  if (s) settings.value = JSON.parse(s)
} catch {}
</script>

<style scoped>
.page-content-wrapper { padding: 16px; }
.card { background: #fff; }
</style>


