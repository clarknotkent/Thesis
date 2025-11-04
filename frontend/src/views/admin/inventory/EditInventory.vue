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
          <li class="breadcrumb-item active">Edit Inventory</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-pencil-square me-2"></i>Edit Inventory
          </h1>
          <p class="text-muted mb-0">Update vaccine details and adjust stock levels</p>
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

      <!-- Two Column Layout -->
      <div v-else class="row g-4">
        <!-- Left Column: Edit Vaccine Details -->
        <div class="col-md-6">
          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">
                <i class="bi bi-info-circle me-2"></i>Vaccine Details
              </h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="updateVaccineDetails">
                <!-- Vaccine Name (Read-only) -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Vaccine Name</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    :value="inventoryData.vaccineName" 
                    readonly
                    disabled
                  >
                </div>

                <!-- Manufacturer -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Manufacturer</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="detailsForm.manufacturer"
                    list="manufacturerList"
                  >
                  <datalist id="manufacturerList">
                    <option value="Sanofi Pasteur"></option>
                    <option value="Pfizer"></option>
                    <option value="Moderna"></option>
                    <option value="AstraZeneca"></option>
                    <option value="Johnson & Johnson"></option>
                    <option value="Sinovac"></option>
                    <option value="GSK"></option>
                  </datalist>
                </div>

                <!-- Lot Number -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Lot Number</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="detailsForm.lotNumber"
                  >
                </div>

                <!-- Expiration Date -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Expiration Date</label>
                  <DateInput
                    v-model="detailsForm.expirationDate"
                    placeholder="Select expiration date"
                  />
                </div>

                <!-- Storage Location -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Storage Location</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="detailsForm.storageLocation"
                    list="storageList"
                  >
                  <datalist id="storageList">
                    <option value="Storage A"></option>
                    <option value="Storage B"></option>
                    <option value="Cold Storage 1"></option>
                    <option value="Cold Storage 2"></option>
                    <option value="Refrigerator 1"></option>
                    <option value="Refrigerator 2"></option>
                  </datalist>
                </div>

                <!-- Current Stock (Read-only) -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Current Stock Level</label>
                  <div class="alert alert-info mb-0">
                    <strong class="fs-4">{{ inventoryData.currentStock }}</strong> doses
                    <small class="d-block text-muted mt-1">Use the Stock Adjustment panel to modify quantity</small>
                  </div>
                </div>

                <button 
                  type="submit" 
                  class="btn btn-primary w-100"
                  :disabled="submittingDetails"
                >
                  <span v-if="submittingDetails">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </span>
                  <span v-else>
                    <i class="bi bi-check-circle me-2"></i>Save Details
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Right Column: Stock Adjustment -->
        <div class="col-md-6">
          <div class="card shadow">
            <div class="card-header bg-warning text-dark">
              <h5 class="mb-0">
                <i class="bi bi-arrow-left-right me-2"></i>Stock Adjustment
              </h5>
            </div>
            <div class="card-body">
              <!-- Current Stock Info -->
              <div class="alert alert-light border mb-3">
                <small class="text-muted d-block">Current Stock</small>
                <strong class="fs-4 text-primary">{{ inventoryData.currentStock }}</strong> doses
              </div>

              <form @submit.prevent="handleAdjustStock">
                <!-- Transaction Type -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Transaction Type <span class="text-danger">*</span></label>
                  <select 
                    class="form-select" 
                    v-model="adjustForm.type"
                    required
                  >
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

                <!-- Quantity -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Quantity <span class="text-danger">*</span></label>
                  <input 
                    type="number" 
                    min="0"
                    class="form-control" 
                    v-model.number="adjustForm.quantity"
                    placeholder="Enter quantity"
                    required
                  >
                  <div class="form-text">
                    <span v-if="adjustForm.type === 'ADJUST'">
                      New stock level will be: <strong>{{ adjustForm.quantity || 0 }}</strong> doses
                    </span>
                    <span v-else-if="adjustForm.type === 'RETURN' && adjustForm.quantity">
                      Stock after return: <strong>{{ Math.max(0, inventoryData.currentStock - adjustForm.quantity) }}</strong> doses
                    </span>
                    <span v-else-if="adjustForm.type === 'EXPIRED' && adjustForm.quantity">
                      Stock after removal: <strong>{{ Math.max(0, inventoryData.currentStock - adjustForm.quantity) }}</strong> doses
                    </span>
                  </div>
                </div>

                <!-- Notes -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Note (Optional)</label>
                  <textarea 
                    class="form-control" 
                    v-model="adjustForm.note"
                    rows="3"
                    placeholder="Reason or remarks for this adjustment"
                  ></textarea>
                </div>

                <!-- Warning -->
                <div class="alert alert-warning">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  <strong>Warning:</strong> This action will update the inventory stock level and cannot be undone.
                </div>

                <button 
                  type="submit" 
                  class="btn btn-warning w-100"
                  :disabled="submittingAdjust || !adjustForm.type || adjustForm.quantity === 0"
                >
                  <span v-if="submittingAdjust">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Adjusting...
                  </span>
                  <span v-else>
                    <i class="bi bi-check-circle me-2"></i>Apply Adjustment
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import DateInput from '@/components/ui/form/DateInput.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()
const { confirm } = useConfirm()

const inventoryData = ref({
  vaccineName: '',
  currentStock: 0
})
const loading = ref(true)
const submittingDetails = ref(false)
const submittingAdjust = ref(false)

const goBack = () => {
  router.back()
}

const detailsForm = ref({
  manufacturer: '',
  lotNumber: '',
  expirationDate: '',
  storageLocation: ''
})

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
    
    const vaccine = data.vaccinemaster || {}
    
    inventoryData.value = {
      id: data.inventory_id || data.id,
      vaccine_id: data.vaccine_id,
      vaccineName: vaccine.antigen_name || data.vaccine_name,
      brandName: vaccine.brand_name || data.brand_name,
      manufacturer: vaccine.manufacturer || data.manufacturer,
      lotNumber: data.lot_number || data.lotNumber,
      currentStock: data.current_stock_level || data.quantity || 0,
      expirationDate: data.expiration_date || data.expirationDate,
      storageLocation: data.storage_location || data.storageLocation
    }
    
    // Populate details form
    detailsForm.value = {
      manufacturer: inventoryData.value.manufacturer,
      lotNumber: inventoryData.value.lotNumber,
      expirationDate: inventoryData.value.expirationDate,
      storageLocation: inventoryData.value.storageLocation
    }
  } catch (error) {
    console.error('Error fetching inventory data:', error)
    addToast('Error loading inventory data', 'error')
  } finally {
    loading.value = false
  }
}

const updateVaccineDetails = async () => {
  submittingDetails.value = true
  try {
    const id = route.params.id
    const payload = {
      vaccine_id: inventoryData.value.vaccine_id,
      lot_number: detailsForm.value.lotNumber,
      expiration_date: detailsForm.value.expirationDate,
      storage_location: detailsForm.value.storageLocation
    }
    
    await api.put(`/vaccines/inventory/${id}`, payload)
    addToast('Vaccine details updated successfully!', 'success')
    
    // Refresh data
    await fetchInventoryData()
  } catch (error) {
    console.error('Error updating details:', error)
    const errorMessage = error.response?.data?.message || 'Error updating details. Please try again.'
    addToast(errorMessage, 'error')
  } finally {
    submittingDetails.value = false
  }
}

const handleAdjustStock = async () => {
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

  submittingAdjust.value = true
  try {
    const id = route.params.id
    await api.post(`/vaccines/inventory/${id}/adjust`, adjustForm.value)
    addToast('Stock adjusted successfully!', 'success')
    
    // Reset form
    adjustForm.value = {
      type: '',
      quantity: 0,
      note: ''
    }
    
    // Refresh data
    await fetchInventoryData()
  } catch (error) {
    console.error('Error adjusting stock:', error)
    const errorMessage = error.response?.data?.message || 'Error adjusting stock. Please try again.'
    addToast(errorMessage, 'error')
  } finally {
    submittingAdjust.value = false
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

.card-header {
  font-weight: 600;
}
</style>
