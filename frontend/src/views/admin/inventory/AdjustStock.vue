<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">Admin</router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/admin/vaccines">Vaccine Inventory</router-link>
          </li>
          <li class="breadcrumb-item active">Adjust Stock</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-arrow-left-right me-2"></i>Adjust Stock
          </h1>
          <p class="text-muted mb-0">Adjust vaccine stock quantity</p>
        </div>
        <div class="d-flex gap-2">
          <button @click="goBack" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>Back
          </button>
          <router-link to="/admin/vaccines" class="btn btn-outline-primary">
            <i class="bi bi-house me-2"></i>Home
          </router-link>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Form Card -->
      <div v-else-if="inventoryData" class="row">
        <div class="col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 fw-bold text-primary">Current Stock Information</h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <div class="form-text">Vaccine</div>
                <div class="fw-semibold fs-5">{{ inventoryData.vaccineName }}</div>
              </div>
              <div class="mb-3">
                <div class="form-text">Current Quantity</div>
                <div class="fw-semibold fs-3 text-primary">{{ inventoryData.quantity }} doses</div>
              </div>
              <div class="mb-3">
                <div class="form-text">Lot Number</div>
                <div class="fw-semibold">{{ inventoryData.lotNumber || inventoryData.batchNo || '-' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card shadow">
            <div class="card-header py-3">
              <h6 class="m-0 fw-bold text-primary">Stock Adjustment</h6>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleSubmit">
                <div class="mb-3">
                  <label class="form-label">Transaction Type <span class="text-danger">*</span></label>
                  <select class="form-select" v-model="adjustForm.type" required>
                    <option value="">-- Select Type --</option>
                    <option value="ADJUST">ADJUST (Set to exact quantity)</option>
                    <option value="RETURN">RETURN (Remove from stock)</option>
                    <option value="EXPIRED">EXPIRED (Mark as expired)</option>
                  </select>
                  <div class="form-text" v-if="adjustForm.type === 'ADJUST'">
                    ADJUST sets the stock to the exact quantity you enter.
                  </div>
                  <div class="form-text" v-else-if="adjustForm.type === 'RETURN'">
                    RETURN reduces the current stock by the quantity entered.
                  </div>
                  <div class="form-text" v-else-if="adjustForm.type === 'EXPIRED'">
                    EXPIRED removes expired stock from inventory.
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Quantity <span class="text-danger">*</span></label>
                  <input 
                    type="number" 
                    min="0" 
                    class="form-control" 
                    v-model.number="adjustForm.quantity" 
                    required 
                    placeholder="Enter quantity"
                  />
                  <div class="form-text">
                    <span v-if="adjustForm.type === 'ADJUST'">
                      New stock level will be: <strong>{{ adjustForm.quantity || 0 }}</strong> doses
                    </span>
                    <span v-else-if="adjustForm.type === 'RETURN' && adjustForm.quantity">
                      Stock after return: <strong>{{ Math.max(0, inventoryData.quantity - adjustForm.quantity) }}</strong> doses
                    </span>
                    <span v-else-if="adjustForm.type === 'EXPIRED' && adjustForm.quantity">
                      Stock after removal: <strong>{{ Math.max(0, inventoryData.quantity - adjustForm.quantity) }}</strong> doses
                    </span>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Note (Optional)</label>
                  <textarea 
                    class="form-control" 
                    rows="3" 
                    v-model="adjustForm.note" 
                    placeholder="Reason or remarks for this adjustment"
                  ></textarea>
                </div>

                <div class="alert alert-warning">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  <strong>Warning:</strong> This action will update the inventory stock level and cannot be undone.
                </div>

                <div class="d-flex justify-content-end gap-2">
                  <router-link to="/admin/vaccines" class="btn btn-secondary">
                    <i class="bi bi-x-circle me-2"></i>Cancel
                  </router-link>
                  <button type="submit" class="btn btn-primary" :disabled="submitting">
                    <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-check-circle me-2"></i>
                    Apply Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="alert alert-danger">
        <i class="bi bi-exclamation-circle me-2"></i>
        Failed to load inventory data. <router-link to="/admin/vaccines">Go back to inventory</router-link>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import api from '@/services/offlineAPI'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()
const { confirm } = useConfirm()

const inventoryData = ref(null)
const loading = ref(true)
const submitting = ref(false)

const goBack = () => {
  router.back()
}

const adjustForm = ref({
  type: '',
  quantity: 0,
  note: ''
})

onMounted(async () => {
  await fetchInventoryData()
})

const fetchInventoryData = async () => {
  try {
    const id = route.params.id
    const response = await api.get(`/vaccines/inventory/${id}`)
    const data = response.data.data || response.data
    
    // Backend returns nested vaccinemaster object
    const vaccine = data.vaccinemaster || {}
    
    inventoryData.value = {
      id: data.inventory_id || data.id,
      vaccineName: vaccine.antigen_name || data.vaccine_name,
      brandName: vaccine.brand_name || data.brand_name,
      manufacturer: vaccine.manufacturer || data.manufacturer,
      lotNumber: data.lot_number || data.lotNumber,
      currentStock: data.current_stock_level || data.quantity || 0,
      expirationDate: data.expiration_date || data.expirationDate,
      storageLocation: data.storage_location || data.storageLocation
    }
  } catch (error) {
    console.error('Error fetching inventory data:', error)
    addToast('Error loading inventory data', 'error')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!adjustForm.value.type || adjustForm.value.quantity === 0) {
    addToast('Please select transaction type and enter quantity', 'warning')
    return
  }

  const confirmed = await confirm({
    title: 'Confirm Stock Adjustment',
    message: `Are you sure you want to ${adjustForm.value.type.toLowerCase()} the stock?`,
    variant: 'warning'
  })

  if (!confirmed) return

  submitting.value = true
  try {
    const id = route.params.id
    await api.post(`/vaccines/inventory/${id}/adjust`, adjustForm.value)
    addToast('Stock adjusted successfully!', 'success')
    router.push('/admin/vaccines')
  } catch (error) {
    console.error('Error adjusting stock:', error)
    const errorMessage = error.response?.data?.message || 'Error adjusting stock. Please try again.'
    addToast(errorMessage, 'error')
  } finally {
    submitting.value = false
  }
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

.form-text {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.fw-semibold {
  font-weight: 600;
}
</style>
