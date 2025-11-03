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
          <li class="breadcrumb-item active">Add Vaccine Type</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-plus-square me-2"></i>Add New Vaccine Type
          </h1>
          <p class="text-muted mb-0">Create a new vaccine type with initial stock</p>
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
          <VaccineForm
            submit-label="Add Vaccine Type"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import VaccineForm from '@/features/admin/inventory/components/VaccineForm.vue'
import api from '@/services/offlineAPI'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { addToast } = useToast()

const submitting = ref(false)

const goBack = () => {
  router.back()
}

const handleSubmit = async (formData) => {
  submitting.value = true
  try {
    await api.post('/vaccines', formData)
    addToast('Vaccine type added successfully!', 'success')
    router.push('/admin/vaccines')
  } catch (error) {
    console.error('Error adding vaccine type:', error)
    const errorMessage = error.response?.data?.message || 'Error adding vaccine type. Please try again.'
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
