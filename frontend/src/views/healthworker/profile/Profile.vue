<template>
  <HealthWorkerLayout :show-controls="true" :controls-props="{ icon: 'person', title: 'My Profile' }">
    <div class="page-content-wrapper">
      <div v-if="loading" class="text-center py-4">Loading profile…</div>

      <div v-else class="card p-3">
        <div class="d-flex align-items-center gap-3 mb-3">
          <img :src="profile.avatar || '/default-avatar.png'" alt="avatar" class="rounded-circle" style="width:72px;height:72px;object-fit:cover;" />
          <div>
            <h5 class="mb-0">{{ profile.fullName || profile.firstname || 'Health Staff' }}</h5>
            <small class="text-muted">{{ getRoleText(profile.role) }}</small>
          </div>
        </div>

        <div class="list-group list-group-flush">
          <div class="list-group-item d-flex justify-content-between">
            <div>
              <div class="small text-muted">Email</div>
              <div>{{ profile.email || '—' }}</div>
            </div>
            <div>
              <div class="small text-muted">Contact</div>
              <div>{{ profile.contact_number || '—' }}</div>
            </div>
          </div>

          <div class="list-group-item">
            <div class="small text-muted">Employee / ID</div>
            <div>{{ profile.employee_id || '—' }}</div>
          </div>

          <div class="list-group-item">
            <div class="small text-muted">Address</div>
            <div>{{ profile.address || '—' }}</div>
          </div>

          <div class="list-group-item">
            <div class="small text-muted">Member Since</div>
            <div>{{ formatDate(profile.created_at || profile.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUser } from '@/services/auth'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import api from '@/services/api'

const loading = ref(true)
const profile = ref({})

const fetchProfile = async () => {
  try {
    loading.value = true
    const res = await api.get('/profile')
    const data = res.data?.data || res.data || {}
    profile.value = {
      fullName: data.full_name || `${data.firstname || ''} ${data.surname || ''}`.trim(),
      firstname: data.firstname,
      surname: data.surname,
      email: data.email,
      role: data.role,
      avatar: data.avatar || null,
      contact_number: data.contact_number || data.phone || null,
      employee_id: data.employee_id || data.user_code || null,
      address: data.address || null,
      created_at: data.created_at || data.createdAt || null
    }
  } catch (e) {
    // Fallback to locally stored user (auth) if API not available
    console.warn('Failed to load profile from API, falling back to local user:', e?.message || e)
    const local = getUser()
    if (local) {
      profile.value = {
        fullName: local.full_name || `${local.firstname || ''} ${local.surname || ''}`.trim(),
        firstname: local.firstname,
        surname: local.surname,
        email: local.email,
        role: local.role || local.user_role,
        avatar: local.avatar || null,
        contact_number: local.contact_number || local.phone || null,
        employee_id: local.employee_id || local.user_code || null,
        address: local.address || null,
        created_at: local.created_at || local.createdAt || null
      }
    } else {
      profile.value = {}
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (d) => {
  if (!d) return 'Unknown'
  try { return new Date(d).toLocaleDateString() } catch { return String(d) }
}

const getRoleText = (r) => {
  if (!r) return 'User'
  const s = String(r).toLowerCase()
  if (s.includes('health')) return 'Health Staff'
  if (s.includes('admin')) return 'Administrator'
  if (s.includes('parent') || s.includes('guardian')) return 'Parent'
  return r
}

onMounted(fetchProfile)
</script>

<style scoped>
.page-content-wrapper { padding: 16px; }
.card { background: #fff; }
</style>
