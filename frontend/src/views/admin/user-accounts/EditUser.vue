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
            <router-link to="/admin/users">User Accounts</router-link>
          </li>
          <li class="breadcrumb-item active">Edit User</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-pencil-square me-2"></i>Edit User
          </h1>
          <p class="text-muted mb-0">Update user account information</p>
        </div>
        <div class="d-flex gap-2">
          <button @click="goBack" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>Back
          </button>
          <router-link to="/admin/users" class="btn btn-outline-primary">
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
      <div v-else-if="userData" class="card shadow">
        <div class="card-body p-4">
          <UserForm
            :initial-data="userData"
            :is-editing="true"
            :submitting="submitting"
            @submit="handleSubmit"
            @cancel="handleCancel"
          />
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="alert alert-danger">
        <i class="bi bi-exclamation-circle me-2"></i>
        Failed to load user data. <router-link to="/admin/users">Go back to user list</router-link>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import UserForm from './components/UserForm.vue'
import { getUser, updateUser } from '@/services/users'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const userData = ref(null)
const loading = ref(true)
const submitting = ref(false)

onMounted(async () => {
  await fetchUserData()
})

const goBack = () => {
  router.back()
}

const handleCancel = () => {
  router.back()
}

const fetchUserData = async () => {
  try {
    const id = route.params.id
    const response = await getUser(id)
    const user = response.user || response
    
    // Map backend fields to form structure
    userData.value = {
      id: user.id || user.user_id,
      firstName: user.firstname || user.firstName || '',
      middleName: user.middlename || user.middleName || '',
      lastName: user.surname || user.lastName || '',
      email: user.email || '',
      role: user.role || '',
      hwType: user.hw_type || user.hwType || '',
      status: user.status || 'active',
      licenseNumber: user.license_number || user.licenseNumber || '',
      employeeId: user.employee_id || user.employeeId || '',
      phoneNumber: user.phone_number || user.phoneNumber || '',
      contactNumber: user.contact_number || user.contactNumber || '',
      sex: user.sex || '',
      birthdate: user.birthdate || '',
      address: user.address || ''
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    addToast('Error loading user data', 'error')
    userData.value = null
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (formData) => {
  submitting.value = true
  try {
    const id = route.params.id
    
    // Map form data to API payload
    const payload = {
      firstname: formData.firstName,
      middlename: formData.middleName || null,
      surname: formData.lastName,
      email: formData.email,
      role: formData.role,
      hw_type: formData.hwType || null,
      status: formData.status,
      license_number: formData.licenseNumber || null,
      employee_id: formData.employeeId || null,
      phone_number: formData.phoneNumber || null,
      contact_number: formData.contactNumber || null,
      sex: formData.sex || null,
      birthdate: formData.birthdate || null,
      address: formData.address || null
    }

    await updateUser(id, payload)
    addToast('User updated successfully!', 'success')
    router.push('/admin/users')
  } catch (error) {
    console.error('Error updating user:', error)
    const errorMessage = error.response?.data?.message || 'Error updating user'
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
</style>
