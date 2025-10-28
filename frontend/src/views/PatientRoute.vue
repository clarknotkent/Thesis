<template>
  <div class="qr-redirect">
    <p>Loading patient details…</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRole, isAuthenticated } from '@/services/auth'

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const id = route.params.id
  // If not authenticated, send to login with redirect back
  if (!isAuthenticated()) {
    return router.replace({ path: '/auth/login', query: { redirect: route.fullPath } })
  }

  const role = (getRole() || '').toLowerCase()
  const normalized = role === 'health_staff' ? 'healthworker' : role

  // Forward to the appropriate details page by role
  if (normalized === 'admin') {
    return router.replace({ name: 'ViewPatient', params: { id } })
  }
  if (normalized === 'healthworker' || normalized === 'health-worker') {
    return router.replace({ name: 'PatientDetail', params: { id } })
  }
  if (normalized === 'parent') {
    // Parents don't have direct access to arbitrary patient details; send to dashboard
    return router.replace({ name: 'ParentDashboard' })
  }
  // Fallback
  return router.replace('/')
})
</script>

<style scoped>
.qr-redirect { padding: 24px; text-align: center; color: #555; }
</style>
