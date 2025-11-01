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
          <li class="breadcrumb-item active">Add Stock</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-plus-circle me-2"></i>Add New Stock
          </h1>
          <p class="text-muted mb-0">Add a new batch of vaccine stock to inventory</p>
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

      <!-- Form Card -->
      <div class="card shadow">
        <div class="card-body p-4">
          <StockForm
            :vaccines="vaccines"
            submit-label="Add Stock"
            :submitting="submitting"
            @submit="handleSubmit"
            @cancel="handleCancel"
          />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import StockForm from '@/features/admin/inventory/components/StockForm.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { addToast } = useToast()

const vaccines = ref([])
const submitting = ref(false)

const goBack = () => {
  router.back()
}

onMounted(async () => {
  await fetchVaccines()
})

const fetchVaccines = async () => {
  try {
    const response = await api.get('/vaccines')
    
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
  } catch (error) {
    console.error('Error fetching vaccines:', error)
    addToast('Error loading vaccines', 'error')
    vaccines.value = [] // Ensure it's always an array
  }
}

const handleSubmit = async (formData) => {
  submitting.value = true
  try {
    await api.post('/vaccines/inventory', formData)
    addToast('Stock added successfully!', 'success')
    router.push('/admin/vaccines')
  } catch (error) {
    console.error('Error adding stock:', error)
    const errorMessage = error.response?.data?.message || 'Error adding stock. Please try again.'
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
