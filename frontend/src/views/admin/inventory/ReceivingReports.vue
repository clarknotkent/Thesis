<template>
  <AdminLayout>
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Receiving Reports</h1>
          <p class="text-muted mb-0">Record deliveries and convert to inventory</p>
        </div>
        <div>
          <button class="btn btn-primary" @click="goToCreate">New Receiving Report</button>
        </div>
      </div>

      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 fw-bold text-primary">Reports</h6>
          <div class="d-flex align-items-center gap-2">
            <input class="form-control" placeholder="Search RR-..." v-model="search" @input="fetchList" style="max-width: 240px;" />
            <select class="form-select" v-model="status" @change="fetchList" style="max-width: 180px;">
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button class="btn btn-outline-secondary" @click="fetchList" title="Refresh"><i class="bi bi-arrow-clockwise"></i></button>
          </div>
        </div>
        <div class="card-body">
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status" />
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover table-striped">
              <thead class="table-light">
                <tr>
                  <th>Report #</th>
                  <th>Delivery Date</th>
                  <th>Delivered By</th>
                  <th>Received By</th>
                  <th>Total Items</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in list.items" :key="r.report_id" @click="goToView(r)" style="cursor:pointer;">
                  <td class="fw-semibold">{{ r.report_number }}</td>
                  <td>{{ formatDate(r.delivery_date) }}</td>
                  <td>{{ r.delivered_by }}</td>
                  <td>{{ r.received_by_name || '-' }}</td>
                  <td>{{ r.total_items || 0 }}</td>
                  <td>{{ r.total_quantity || 0 }}</td>
                  <td>
                    <span class="badge" :class="badgeClass(r.status)">{{ r.status }}</span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click.stop="goToView(r)"><i class="bi bi-eye"></i></button>
                      <button class="btn btn-outline-success" :disabled="r.status!=='DRAFT'" @click.stop="goToComplete(r)"><i class="bi bi-check2-circle"></i></button>
                      <button class="btn btn-outline-danger" :disabled="r.status!=='DRAFT'" @click.stop="goToCancel(r)"><i class="bi bi-x-circle"></i></button>
                    </div>
                  </td>
                </tr>
                <tr v-if="(list.items||[]).length===0">
                  <td colspan="8" class="text-center text-muted py-4">No receiving reports found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- All modals removed in favor of page-based flows -->
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { addToast } = useToast()

const loading = ref(false)
const list = ref({ items: [], totalCount: 0, totalPages: 0 })
const status = ref('')
const search = ref('')

import { useRouter } from 'vue-router'
const router = useRouter()

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : ''
const badgeClass = (s) => ({ DRAFT: 'bg-secondary', COMPLETED: 'bg-success', CANCELLED: 'bg-danger' }[s] || 'bg-secondary')

async function fetchList() {
  loading.value = true
  try {
    const { data } = await api.get('/receiving-reports', { params: { status: status.value, search: search.value, page: 1, limit: 20 } })
    list.value = data.data || data
  } catch (e) {
    console.error('Failed to load receiving reports', e)
    list.value = { items: [], totalCount: 0, totalPages: 0 }
  } finally {
    loading.value = false
  }
}

function goToCreate() { router.push({ name: 'ReceivingReportNew' }) }
function goToView(r) { router.push({ name: 'ReceivingReportView', params: { id: r.report_id } }) }
function goToComplete(r) { router.push({ name: 'ReceivingReportView', params: { id: r.report_id }, query: { action: 'complete' } }) }
function goToCancel(r) { router.push({ name: 'ReceivingReportView', params: { id: r.report_id }, query: { action: 'cancel' } }) }

onMounted(async () => {
  await fetchList()
})
// Helpers
</script>

<style scoped>
/* Tweak table cell spacing */
table td, table th { vertical-align: middle; }
 </style>
