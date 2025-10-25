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
          <li class="breadcrumb-item active">Edit Vaccine Type</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-pencil-square me-2"></i>Edit Vaccine Type
          </h1>
          <p class="text-muted mb-0">Update vaccine type information</p>
        </div>
        <router-link to="/admin/vaccines" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-2"></i>Back to Inventory
        </router-link>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Form Card -->
      <div v-else-if="vaccineData" class="card shadow">
        <div class="card-body p-4">
          <VaccineForm
            :initial-data="vaccineData"
            :is-editing="true"
            submit-label="Save Changes"
            :submitting="submitting"
            @submit="handleSubmit"
            @cancel="handleCancel"
          />
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="alert alert-danger">
        <i class="bi bi-exclamation-circle me-2"></i>
        Failed to load vaccine data. <router-link to="/admin/vaccines">Go back to inventory</router-link>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import VaccineForm from '@/features/inventory/components/VaccineForm.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const vaccineData = ref(null)
const loading = ref(true)
const submitting = ref(false)

onMounted(async () => {
  await fetchVaccineData()
})

const fetchVaccineData = async () => {
  try {
    const id = route.params.id
    const response = await api.get(`/vaccines/${id}`)
    const data = response.data.data || response.data
    
    // Map API response to form structure
    vaccineData.value = {
      antigen_name: data.antigen_name,
      brand_name: data.brand_name,
      manufacturer: data.manufacturer,
      disease_prevented: data.disease_prevented,
      category: data.category || 'VACCINE',
      vaccine_type: data.vaccine_type || '',
      is_nip: data.is_nip || false
      // Note: No initial stock fields when editing
    }
  } catch (error) {
    console.error('Error fetching vaccine data:', error)
    addToast('Error loading vaccine data', 'error')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (formData) => {
  submitting.value = true
  try {
    const id = route.params.id
    // Remove stock-related fields if they exist (shouldn't be in edit mode)
    const { lot_number, expiration_date, stock_level, storage_location, ...vaccineUpdateData } = formData
    
    await api.put(`/vaccines/${id}`, vaccineUpdateData)
    addToast('Vaccine type updated successfully!', 'success')
    router.push('/admin/vaccines')
  } catch (error) {
    console.error('Error updating vaccine type:', error)
    const errorMessage = error.response?.data?.message || 'Error updating vaccine type. Please try again.'
    addToast(errorMessage, 'error')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.back()
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
