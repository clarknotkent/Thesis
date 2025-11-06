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
          <li class="breadcrumb-item active">Add New User</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-person-plus me-2"></i>Add New User
          </h1>
          <p class="text-muted mb-0">Create a new user account</p>
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

      <!-- Form Card -->
      <div class="card shadow">
        <div class="card-body p-4">
          <UserForm
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
import UserForm from '@/features/admin/user-management/UserForm.vue'
import { createUser } from '@/services/users'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { addToast } = useToast()

const submitting = ref(false)

const goBack = () => {
  router.back()
}

const handleCancel = () => {
  router.back()
}

const handleSubmit = async (formData) => {
  submitting.value = true
  try {
    // Map form data to API payload
    const payload = {
      firstname: formData.firstName,
      middlename: formData.middleName || null,
      surname: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      hs_type: formData.hsType || formData.hwType || null,
      status: formData.status,
      // Backend expects professional_license_no
      professional_license_no: formData.licenseNumber || null,
      employee_id: formData.employeeId || null,
      contact_number: formData.contactNumber || null,
      sex: formData.sex || null,
      birthdate: formData.birthdate || null,
      address: (formData.address && formData.address.trim()) ? formData.address : 'address not given'
    }

    await createUser(payload)
    addToast({ title: 'Success', message: 'User created successfully!', type: 'success' })
    router.push('/admin/users')
  } catch (error) {
    console.error('Error creating user:', error)
    const errorMessage = error.response?.data?.message || 'Error creating user'
    addToast({ title: 'Error', message: errorMessage, type: 'error' })
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

.border-left-primary {
  border-left: 4px solid #4e73df;
}
</style>
