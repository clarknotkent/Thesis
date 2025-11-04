<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/admin/dashboard">Admin</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Vaccine Inventory</li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="mb-4">
        <h2 class="mb-1">
          <i class="bi bi-capsule me-2"></i>Vaccine Inventory Management
        </h2>
        <p class="text-muted mb-0">Manage vaccine stock, receiving reports, and schedules</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading inventory data...</span>
        </div>
        <p class="text-muted mt-2">Loading inventory information...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger">
        <i class="bi bi-exclamation-circle me-2"></i>
        {{ error }}
      </div>

      <!-- Inventory Summary Cards -->
      <div v-if="!loading" class="row g-3 mb-4">
        <!-- Total Types -->
        <div class="col-md-3">
          <div class="card border border-primary border-3 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-primary text-uppercase mb-1">Total Types</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.totalTypes }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-collection text-primary" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Doses -->
        <div class="col-md-3">
          <div class="card border border-success border-3 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-success text-uppercase mb-1">Total Doses</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.totalDoses }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-capsule text-success" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Low Stock -->
        <div class="col-md-3">
          <div class="card border border-warning border-3 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-warning text-uppercase mb-1">Low Stock</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.lowStock }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Expiring Soon -->
        <div class="col-md-3">
          <div class="card border border-danger border-3 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-danger text-uppercase mb-1">Expiring Soon</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.expiringSoon }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-calendar-x text-danger" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Management with Tabs -->
      <div v-if="!loading && !error" class="row">
        <!-- Main Content with Tabs -->
        <div class="col-lg-12 mb-4">
          <div class="card shadow">
            <div class="card-header py-3 bg-white">
              <!-- Tabs Navigation -->
              <ul class="nav nav-tabs card-header-tabs">
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'stock' }"
                    @click="activeTab = 'stock'"
                  >
                    <i class="bi bi-capsule me-2"></i>Vaccine Stock
                  </button>
                </li>
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'receiving' }"
                    @click="activeTab = 'receiving'"
                  >
                    <i class="bi bi-box-seam me-2"></i>Receiving Reports
                  </button>
                </li>
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'schedule' }"
                    @click="activeTab = 'schedule'"
                  >
                    <i class="bi bi-calendar-check me-2"></i>Vaccine Schedule
                  </button>
                </li>
              </ul>
            </div>
            <div class="card-body p-4">
              <!-- Vaccine Stock Tab -->
              <div v-if="activeTab === 'stock'">
                <VaccineStockSection @refresh="loadInventoryData" />
              </div>

              <!-- Receiving Reports Tab -->
              <div v-if="activeTab === 'receiving'">
                <ReceivingReportsSection @refresh="loadInventoryData" />
              </div>

              <!-- Vaccine Schedule Tab -->
              <div v-if="activeTab === 'schedule'">
                <VaccineScheduleSection @refresh="loadScheduleData" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import VaccineStockSection from '@/features/admin/inventory/components/VaccineStockSection.vue'
import ReceivingReportsSection from '@/features/admin/inventory/components/ReceivingReportsSection.vue'
import VaccineScheduleSection from '@/features/admin/inventory/components/VaccineScheduleSection.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const activeTab = ref('stock')
const loading = ref(true)
const error = ref(null)

const stats = ref({
  totalTypes: 0,
  totalDoses: 0,
  lowStock: 0,
  expiringSoon: 0
})

// Handle hash navigation
onMounted(() => {
  const hash = route.hash.replace('#', '')
  if (hash && ['stock', 'receiving', 'schedule'].includes(hash)) {
    activeTab.value = hash
  }
  
  loadInventoryData()
})

// Update URL hash when tab changes
watch(activeTab, (newTab) => {
  router.replace({ hash: `#${newTab}` })
})

const loadInventoryData = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Use the exact same logic as VaccineInventory.vue
    const response = await api.get('/vaccines/inventory')
    const items = response.data?.data || response.data || []
    
    // Defensive: filter out any soft-deleted items if backend ever returns them
    const filteredItems = Array.isArray(items) ? items.filter(v => v && v.is_deleted !== true) : []
    
    const vaccines = filteredItems.map(v => {
      const qty = (v.current_stock_level ?? v.quantity ?? 0)
      // Derive status considering expiry first, then quantity
      const exp = v.expiration_date || v.expiry_date || null
      const now = new Date()
      let status = v.status || null
      if (exp) {
        const d = new Date(exp)
        if (!isNaN(d)) {
          const in30 = new Date(now.getTime() + 30*24*60*60*1000)
          if (d < now) status = 'Expired'
          else if (d >= now && d <= in30) status = 'Expiring Soon'
        }
      }
      if (!status) status = (qty > 0 ? (qty < 10 ? 'Low Stock' : 'Available') : 'Out of Stock')
      return {
        id: v.inventory_id || v.id,
        vaccine_id: v.vaccinemaster?.vaccine_id || v.vaccine_id || v.vaccine?.vaccine_id,
        vaccineName: v.vaccinemaster?.antigen_name || v.vaccine?.antigen_name || v.antigen_name || '',
        brandName: v.vaccinemaster?.brand_name || v.vaccine?.brand_name || v.brand_name || '',
        manufacturer: v.vaccinemaster?.manufacturer || v.vaccine?.manufacturer || v.manufacturer || '',
        category: v.vaccinemaster?.category || v.category || '',
        batchNo: v.lot_number || v.batch_number || '',
        expiryDate: v.expiration_date || v.expiry_date || '',
        storageLocation: v.storage_location || v.storageLocation || '',
        quantity: qty,
        status
      }
    })
    
    // Get existing vaccine types
    const vaccineTypesResponse = await api.get('/vaccines')
    let raw = vaccineTypesResponse.data?.data || vaccineTypesResponse.data || []
    if (raw && typeof raw === 'object' && Array.isArray(raw.vaccines)) {
      raw = raw.vaccines
    }
    const existingVaccines = Array.isArray(raw) ? raw : []
    
    // Calculate stats using the same logic as VaccineInventory.vue
    const activeVaccines = vaccines.filter(v => !v.is_deleted)
    const totalTypes = new Set(existingVaccines.map(v => v.antigen_name + '|' + v.brand_name)).size
    const totalDoses = activeVaccines.reduce((sum, v) => sum + (v.quantity || 0), 0)
    const lowStock = activeVaccines.filter(v => (v.quantity || 0) > 0 && (v.quantity || 0) < 10).length
    const expiringSoon = activeVaccines.filter(v => {
      if (!v.expiryDate) return false
      const d = new Date(v.expiryDate)
      const now = new Date()
      const in30 = new Date(now.getTime() + 30*24*60*60*1000)
      return d >= now && d <= in30
    }).length
    
    stats.value = { totalTypes, totalDoses, lowStock, expiringSoon }
    
    console.debug('[InventoryOverview] fetched', items.length, 'inventory items, calculated stats:', stats.value)
  } catch (err) {
    console.error('Error loading inventory data:', err)
    error.value = 'Failed to load inventory data. Please try again.'
    addToast({ message: 'Error loading inventory data', type: 'error' })
    stats.value = { totalTypes: 0, totalDoses: 0, lowStock: 0, expiringSoon: 0 }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Stats Cards Styling */
.border-start {
  border-left: 0.25rem solid !important;
}

.text-gray-800 {
  color: #5a5c69 !important;
}

.text-xs {
  font-size: 0.7rem;
}

.shadow {
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15) !important;
}

/* Tabs Styling */
.nav-tabs {
  border-bottom: none;
}

.nav-tabs .nav-link {
  color: #6c757d;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
  background-color: transparent;
}

.nav-tabs .nav-link:hover {
  color: #0d6efd;
  border-bottom-color: #dee2e6;
  background-color: transparent;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  background-color: transparent;
  border-bottom: 3px solid #0d6efd;
  font-weight: 600;
}

.card-header-tabs {
  margin-bottom: -0.75rem;
}

.card-header {
  background-color: white !important;
  border-bottom: 1px solid #dee2e6;
}

.bg-light {
  background-color: #f8f9fa !important;
}

.rounded {
  border-radius: 0.5rem !important;
}
</style>
