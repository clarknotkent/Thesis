<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav
        aria-label="breadcrumb"
        class="mb-3"
      >
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">
              Admin
            </router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/admin/vaccines">
              Vaccine Inventory
            </router-link>
          </li>
          <li class="breadcrumb-item active">
            Transaction History
          </li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-clock-history me-2" />Inventory Transaction History
          </h1>
          <p
            v-if="inventoryData"
            class="text-muted mb-0"
          >
            {{ inventoryData.vaccineName }}
          </p>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-secondary"
            @click="goBack"
          >
            <i class="bi bi-arrow-left me-2" />Back
          </button>
          <router-link
            to="/admin/vaccines"
            class="btn btn-outline-primary"
          >
            <i class="bi bi-house me-2" />Home
          </router-link>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- History Table -->
      <div
        v-else
        class="card shadow"
      >
        <div class="card-header py-3">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="m-0 fw-bold text-primary">
              Transaction History
            </h6>
            <span class="text-muted">{{ history.length }} transactions</span>
          </div>
        </div>
        <div class="card-body">
          <div
            v-if="history.length === 0"
            class="text-center py-5 text-muted"
          >
            <i class="bi bi-inbox fs-1 d-block mb-3" />
            <p>No transaction history found</p>
          </div>
          <div
            v-else
            class="table-responsive"
          >
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Quantity Change</th>
                  <th>Before</th>
                  <th>After</th>
                  <th>User</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in history"
                  :key="item.id"
                >
                  <td>{{ formatDateOnly(item.timestamp) }}</td>
                  <td>{{ formatTimeOnly(item.timestamp) }}</td>
                  <td>
                    <span
                      class="badge"
                      :class="getTypeBadgeClass(item.type)"
                    >
                      {{ item.type }}
                    </span>
                  </td>
                  <td>
                    <span :class="getQuantityClass(item.quantityChange)">
                      {{ formatQuantityChange(item.quantityChange) }}
                    </span>
                  </td>
                  <td>{{ displayNumber(item.quantityBefore) }}</td>
                  <td>{{ displayNumber(item.quantityAfter) }}</td>
                  <td>{{ item.userName || 'System' }}</td>
                  <td>
                    <small class="text-muted">{{ item.note || '-' }}</small>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import { useToast } from '@/composables/useToast'
import { formatPHDate } from '@/utils/dateUtils'
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'

// Offline-aware helpers
const { fetchInventoryById, fetchInventoryTransactions, isOffline } = useOfflineAdmin()

const route = useRoute()
const router = useRouter()
const { addToast } = useToast()

const inventoryData = ref(null)
const history = ref([])
const loading = ref(true)
const offlineBannerShown = ref(false)

const goBack = () => {
  router.back()
}

onMounted(async () => {
  await Promise.all([fetchInventoryData(), fetchHistory()])
  if (isOffline.value && !offlineBannerShown.value) {
    addToast({ title: 'Offline', message: 'Showing cached transaction history', type: 'warning' })
    offlineBannerShown.value = true
  }
})

const fetchInventoryData = async () => {
  try {
    const id = route.params.id
    const inv = await fetchInventoryById(id)
    const data = inv?.data || inv || {}
    const vaccine = data.vaccinemaster || data.vaccine || {}
    inventoryData.value = {
      vaccineName: vaccine.antigen_name || vaccine.brand_name || data.vaccine_name || data.antigen_name || 'Unknown Vaccine'
    }
  } catch (error) {
    console.error('Error fetching inventory data:', error)
    addToast({ title: 'Error', message: 'Error loading inventory data', type: 'error' })
  }
}

const fetchHistory = async () => {
  try {
    const id = route.params.id
    const resp = await fetchInventoryTransactions({ inventory_id: id, limit: 100 })
    const source = resp?.data?.data || resp?.data || resp || []
    const transactions = Array.isArray(source) ? source : (source.transactions || [])

    history.value = transactions.map(item => {
      const type = (item.transaction_type || item.type || '').toUpperCase()
      const rawQty = Number(item.quantity_delta ?? item.quantity ?? item.quantity_change ?? item.quantityChange ?? 0)
      const negativeTypes = ['ISSUE', 'OUTBOUND', 'EXPIRED', 'USE', 'DISPENSE', 'STOCK_OUT', 'RETURN']
      const signedQty = negativeTypes.includes(type) ? -Math.abs(rawQty) : Math.abs(rawQty)
      const after = Number(item.balance_after ?? item.quantity_after ?? item.quantityAfter ?? NaN)
      const before = Number.isFinite(after) && Number.isFinite(signedQty) ? after - signedQty : null
      return {
        id: item.transaction_id || item.id,
        timestamp: item.created_at || item.date || item.timestamp,
        type: type || 'UNKNOWN',
        quantityChange: signedQty,
        quantityBefore: Number.isFinite(before) ? before : null,
        quantityAfter: Number.isFinite(after) ? after : null,
        userName: item.performed_by || item.user_name || item.userName || 'SYSTEM',
        note: item.remarks || item.note || item.notes || item.description || null
      }
    })

    // If offline limit the history to most recent 50
    if (isOffline.value && history.value.length > 50) {
      history.value = history.value.slice(0, 50)
    }
  } catch (error) {
    console.error('Error fetching history:', error)
    addToast({ title: 'Error', message: 'Error loading transaction history', type: 'error' })
  } finally {
    loading.value = false
  }
}

const formatDateOnly = (date) => {
  if (!date) return '-'
  return formatPHDate(date, 'MMM DD, YYYY')
}

const formatTimeOnly = (date) => {
  if (!date) return '-'
  return formatPHDate(date, 'hh:mm A')
}

const formatQuantityChange = (change) => {
  if (!change) return '0'
  const num = Number(change)
  return num > 0 ? `+${num}` : String(num)
}

const getQuantityClass = (change) => {
  const num = Number(change)
  if (num > 0) return 'text-success fw-bold'
  if (num < 0) return 'text-danger fw-bold'
  return 'text-muted'
}

const getTypeBadgeClass = (type) => {
  switch (type?.toUpperCase()) {
    case 'ADD':
    case 'RECEIVE':
    case 'STOCK_IN':
      return 'bg-success'
    case 'ADJUST':
      return 'bg-primary'
    case 'USE':
    case 'DISPENSE':
    case 'STOCK_OUT':
      return 'bg-info'
    case 'RETURN':
      return 'bg-warning text-dark'
    case 'EXPIRED':
    case 'DISPOSE':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}

const displayNumber = (v) => {
  return v === 0 ? '0' : (v ?? '-')
}
</script>

<style scoped>
.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin: 0;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
}

.breadcrumb-item a {
  color: #4e73df;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #6c757d;
}

.text-gray-800 {
  color: #5a5c69 !important;
}

.table th {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
