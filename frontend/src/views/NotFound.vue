<template>
  <div class="not-found">
    <div class="icon">
      😕
    </div>
    <h1>Page not Found</h1>
    <p class="subtitle">
      The page you're looking for doesn't exist or you don't have permission to view it.
    </p>
    <div class="actions">
      <button
        class="btn"
        @click="goBack"
      >
        <i class="bi bi-arrow-left" />
        Go Back
      </button>
      <button
        class="btn primary"
        @click="goHome"
      >
        <i class="bi bi-house" />
        Go to Home
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.replace('/')
}

const goHome = () => {
  // Try role-aware home paths; fall back to landing
  const role = (localStorage.getItem('userRole') || '').toLowerCase()
  if (role === 'admin') return router.replace('/admin/dashboard')
  if (role === 'healthstaff') return router.replace('/healthworker/dashboard')
  if (role === 'guardian' || role === 'parent') return router.replace('/parent/home')
  return router.replace('/')
}
</script>

<style scoped>
.not-found {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}
.icon { font-size: 3rem; margin-bottom: 0.5rem; }
h1 { margin: 0.25rem 0 0.5rem; font-size: 1.75rem; color: #111827; }
.subtitle { color: #6b7280; max-width: 560px; }
.actions { display: flex; gap: .75rem; margin-top: 1.25rem; }
.btn { display: inline-flex; align-items: center; gap: .5rem; padding: .6rem 1rem; border-radius: .5rem; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; }
.btn:hover { background: #f9fafb; }
.btn.primary { border-color: #2563eb; background: #2563eb; color: #fff; }
.btn.primary:hover { background: #1d4ed8; }
</style>
