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
          <li class="breadcrumb-item active">Edit Stock</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-pencil me-2"></i>Edit Inventory Details
          </h1>
          <p class="text-muted mb-0">Update vaccine stock information</p>
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
      <div v-else-if="inventoryData" class="card shadow">
        <div class="card-body p-4">
          <StockForm
            :initial-data="inventoryData"
            :vaccines="vaccines"
            :is-editing="true"
            submit-label="Update Stock"
            :submitting="submitting"
            @submit="handleSubmit"
            @cancel="handleCancel"
          />

          <!-- Stock Adjustment Section (Only when editing) -->
          <div class="border-top pt-4 mt-4">
            <h6 class="text-primary fw-bold mb-3">
              <i class="bi bi-arrow-left-right me-2"></i>Stock Adjustment
            </h6>
            <div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              To adjust stock levels, use the <router-link :to="`/admin/vaccines/adjust/${$route.params.id}`" class="alert-link">Adjust Stock</router-link> page.
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
import AdminLayout from '@/components/layout/AdminLayout.vue'
import StockForm from './components/StockForm.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const vaccines = ref([])
const inventoryData = ref(null)
const loading = ref(true)
const submitting = ref(false)

const goBack = () => {
  router.back()
}

onMounted(async () => {
  await Promise.all([fetchVaccines(), fetchInventory()])
})

const fetchVaccines = async () => {
  try {
    const response = await api.get('/vaccines')
    console.log('Vaccines API response:', response.data)
    
    // Handle different response structures
    let vaccineData = response.data.data || response.data
    
    // Ensure we have an array
    if (Array.isArray(vaccineData)) {
      vaccines.value = vaccineData
    } else if (vaccineData && typeof vaccineData === 'object' && Array.isArray(vaccineData.vaccines)) {
      vaccines.value = vaccineData.vaccines
    } else {
      console.error('Unexpected vaccines data structure:', vaccineData)
      vaccines.value = []
      addToast('Error loading vaccines: unexpected data format', 'error')
    }
    
    console.log('Vaccines array set to:', vaccines.value)
  } catch (error) {
    console.error('Error fetching vaccines:', error)
    addToast('Error loading vaccines', 'error')
    vaccines.value = [] // Ensure it's always an array
  }
}

const fetchInventory = async () => {
  try {
    const id = route.params.id
    const response = await api.get(`/vaccines/inventory/${id}`)
    const data = response.data.data || response.data
    
    // Backend returns nested vaccinemaster object
    const vaccine = data.vaccinemaster || {}
    
    // Map API response to form structure
    inventoryData.value = {
      vaccine_id: data.vaccine_id,
      brandName: vaccine.brand_name || data.brand_name || data.brandName,
      manufacturer: vaccine.manufacturer || data.manufacturer,
      quantity: data.current_stock_level || data.quantity || data.stock_level,
      lotNumber: data.lot_number || data.lotNumber,
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

const handleSubmit = async (formData) => {
  submitting.value = true
  try {
    const id = route.params.id
    await api.put(`/vaccines/inventory/${id}`, formData)
    addToast('Stock updated successfully!', 'success')
    router.push('/admin/vaccines')
  } catch (error) {
    console.error('Error updating stock:', error)
    const errorMessage = error.response?.data?.message || 'Error updating stock. Please try again.'
    addToast(errorMessage, 'error')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/vaccines')
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
</style>
