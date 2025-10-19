<template>
  <AdminLayout>
    <div class="container-fluid py-3">
      <div class="d-flex align-items-center mb-3">
        <h3 class="mb-0">
          <i class="bi bi-info-circle me-2"></i>
          Activity Log Details
        </h3>
        <button class="btn btn-outline-secondary ms-auto" @click="$router.back()">Back</button>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="!log" class="alert alert-warning">
        Log not found or inaccessible.
      </div>

      <div v-else class="card shadow-sm">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <strong>Timestamp:</strong><br>
              <span class="text-muted">{{ formatDatePH(log.timestamp) }}</span>
            </div>
            <div class="col-md-6">
              <strong>User:</strong><br>
              <span class="text-muted">{{ log.userFullName }} ({{ log.userRole }})</span>
            </div>
            <div class="col-md-6">
              <strong>Action:</strong><br>
              <span class="badge" :class="getActionBadgeClass(log.action)">{{ log.action }}</span>
            </div>
            <div class="col-md-6">
              <strong>Status:</strong><br>
              <span class="badge" :class="log.status === 'success' ? 'bg-success' : 'bg-danger'">{{ log.status }}</span>
            </div>
            <div class="col-md-6">
              <strong>IP Address:</strong><br>
              <code>{{ log.ipAddress }}</code>
            </div>
            <div class="col-md-6">
              <strong>User Agent:</strong><br>
              <small class="text-muted">{{ log.userAgent || 'Not available' }}</small>
            </div>
            <div class="col-12">
              <strong>Resource:</strong><br>
              <span class="text-muted">{{ log.resource }}</span>
            </div>
            <div class="col-12" v-if="log.description">
              <strong>Description:</strong><br>
              <p class="text-muted">{{ log.description }}</p>
            </div>
            <div class="col-12" v-if="log.metadata">
              <strong>Additional Data:</strong><br>
              <pre class="bg-light p-3 rounded"><code>{{ formatJSON(log.metadata) }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import api from '@/services/api'
import { formatPHDateTime } from '@/utils/dateUtils'

const route = useRoute()
const loading = ref(true)
const log = ref(null)

const formatDatePH = (date) => {
  if (!date) return '-'
  return formatPHDateTime(date)
}

const formatJSON = (obj) => {
  try {
    return typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

const getActionBadgeClass = (action) => {
  switch ((action || '').toLowerCase()) {
    case 'login': return 'bg-success'
    case 'logout': return 'bg-info'
    case 'create': return 'bg-primary'
    case 'update': return 'bg-warning text-dark'
    case 'delete': return 'bg-danger'
    case 'view': return 'bg-secondary'
    default: return 'bg-light text-dark'
  }
}

const normalizeLog = (raw) => ({
  id: raw.log_id || raw.id,
  timestamp: raw.timestamp,
  userId: raw.user_id,
  userFullName: raw.display_user_name || raw.user_fullname || raw.username || 'Unknown User',
  userRole: raw.user_role || 'Unknown',
  action: raw.display_action || raw.description || raw.action_type || 'Unknown Action',
  resource: raw.resource || raw.table_name || 'System',
  ipAddress: raw.ip_address || 'N/A',
  status: raw.status || (raw.success ? 'success' : 'failed'),
  userAgent: raw.user_agent,
  description: raw.full_description || raw.details,
  metadata: raw.metadata || raw.additional_data
})

onMounted(async () => {
  loading.value = true
  try {
    const id = route.params.id
    // Prefer a single log endpoint; fallback to list and filter when necessary
    try {
      const res = await api.get(`/activity-logs/${id}`)
      const data = res.data?.data || res.data
      log.value = data ? normalizeLog(data) : null
    } catch {
      // fallback: fetch list page and find
      const listRes = await api.get('/activity-logs', { params: { page: 1, limit: 1, id } })
      const items = listRes.data?.data?.items || listRes.data?.items || listRes.data || []
      log.value = items.length ? normalizeLog(items[0]) : null
    }
  } finally {
    loading.value = false
  }
})
</script>
