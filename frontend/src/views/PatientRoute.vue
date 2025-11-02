<template>
  <div class="qr-redirect">
    <p>Loading patient details…</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRole, isAuthenticated, getUserId, getUser } from '@/services/auth'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const id = route.params.id
  // If not authenticated, send to login with redirect back
  if (!isAuthenticated()) {
    return router.replace({ path: '/auth/login', query: { redirect: route.fullPath } })
  }

  // Normalize helper for this component
  const normalize = (r) => {
    const s = (r || '').toString().toLowerCase()
    if (s === 'health_staff' || s === 'health-worker' || s === 'health_worker' || s === 'health staff' || s === 'healthworker') return 'healthstaff'
    if (s === 'guardian' || s === 'parent') return 'guardian'
    return s
  }

  let role = (getRole() || '')
  let normalized = normalize(role)
  // Debug logging
  try {
    const storedRole = typeof localStorage !== 'undefined' ? localStorage.getItem('userRole') : null
    const u = getUser()
    const name = [u?.firstname, u?.surname].filter(Boolean).join(' ')
    console.debug('[PatientRoute] role:', role, 'normalized:', normalized, 'patientId:', id)
    console.debug('[PatientRoute] stored userRole:', storedRole)
    console.debug('[PatientRoute] user (from storage):', { id: u?.user_id || u?.id, name, role: u?.role })
  } catch {}

  // If role is still missing/unknown, try to fetch current user via token-derived id
  const knownRoles = ['admin', 'healthstaff', 'guardian']
  if (!normalized || !knownRoles.includes(normalized)) {
    try {
      const uid = getUserId()
      console.debug('[PatientRoute] attempting role recovery via /users/:id; userId:', uid)
      if (uid) {
        const resp = await api.get(`/users/${uid}`)
        const serverRole = resp?.data?.role || resp?.data?.user?.role
        const serverUser = resp?.data?.user || resp?.data
        try {
          const serverName = [serverUser?.firstname, serverUser?.surname].filter(Boolean).join(' ')
          console.debug('[PatientRoute] server user:', { id: serverUser?.user_id || serverUser?.id, name: serverName, role: serverUser?.role })
        } catch {}
        const recovered = normalize(serverRole)
        if (recovered) {
          try { localStorage.setItem('userRole', recovered) } catch {}
          role = recovered
          normalized = recovered
          console.debug('[PatientRoute] recovered role from server:', serverRole, '->', recovered)
        }
      }
    } catch (e) {
      try { console.warn('[PatientRoute] role recovery failed:', e?.response?.status || e?.message || e) } catch {}
    }
  }

  // If still unknown, force login (lets guard rebuild session)
  if (!normalized || !knownRoles.includes(normalized)) {
    try { console.warn('[PatientRoute] Unknown or missing role after recovery; redirecting to login') } catch {}
    return router.replace({ path: '/auth/login', query: { redirect: route.fullPath } })
  }

  // Forward to the appropriate details page by role
  if (normalized === 'admin') {
    return router.replace({ name: 'ViewPatient', params: { id } })
  }
  if (normalized === 'healthstaff') {
    return router.replace({ name: 'PatientDetail', params: { id } })
  }
  if (normalized === 'parent' || normalized === 'guardian') {
    // Parents can only view their own child. Verify ownership first.
    try {
      await api.get(`/parent/children/${id}`)
      // If request succeeds, the child belongs to this parent
      try { console.debug('[PatientRoute] Parent owns child; opening dependent details') } catch {}
      return router.replace({ name: 'ParentDependentDetails', params: { id } })
    } catch (e) {
      try { console.warn('[PatientRoute] Parent does not own child or request failed:', e?.response?.status) } catch {}
      // Not their child or not accessible; show a Not Found page
      return router.replace({ path: '/not-found' })
    }
  }
  // Fallback: send to landing
  return router.replace('/')
})
</script>

<style scoped>
.qr-redirect { padding: 24px; text-align: center; color: #555; }
</style>
