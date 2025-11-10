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
            <router-link to="/admin/users">
              User Accounts
            </router-link>
          </li>
          <li class="breadcrumb-item active">
            Edit User
          </li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-pencil-square me-2" />Edit User
          </h1>
          <p class="text-muted mb-0">
            Update user account information
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
            to="/admin/users"
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

      <!-- Form Card -->
      <div
        v-else-if="userData"
        class="card shadow"
      >
        <div class="card-body p-4">
          <UserForm
            :initial-data="userData"
            :is-editing="true"
            :submitting="submitting"
            mode="edit"
            @submit="handleSubmit"
            @cancel="handleCancel"
          />
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else
        class="alert alert-danger"
      >
        <i class="bi bi-exclamation-circle me-2" />
        Failed to load user data. <router-link to="/admin/users">
          Go back to user list
        </router-link>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import UserForm from '@/features/admin/user-management/UserForm.vue'
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
      username: user.username || '',
      email: user.email || '',
      role: user.role || '',
      // prefer new hs_type but support older hw_type for compatibility
      hsType: user.hs_type || user.hsType || user.hw_type || user.hwType || '',
      status: user.status || 'active',
      licenseNumber: user.professional_license_no || user.license_number || user.licenseNumber || '',
      employeeId: user.employee_id || user.employeeId || '',
      contactNumber: user.contact_number || user.contactNumber || '',
      sex: user.sex || '',
      birthdate: user.birthdate || '',
      address: user.address || ''
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
  addToast({ title: 'Error', message: 'Error loading user data', type: 'error' })
    userData.value = null
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (formData) => {
  submitting.value = true
  try {
    const id = route.params.id

    // Map form data to API payload - use separate username and email fields
    const payload = {
      firstname: formData.firstName,
      middlename: formData.middleName || null,
      surname: formData.lastName,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      hs_type: formData.hsType || formData.hwType || null,
      status: formData.status,
      professional_license_no: formData.licenseNumber || null,
      employee_id: formData.employeeId || null,
      contact_number: formData.contactNumber || null,
      sex: formData.sex || null,
      birthdate: formData.birthdate || null,
      address: formData.address || null
    }

    await updateUser(id, payload)
    addToast({ title: 'Success', message: 'User updated successfully!', type: 'success' })
    router.push('/admin/users')
  } catch (error) {
    console.error('Error updating user:', error)
    const errorMessage = error.response?.data?.message || 'Error updating user'
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
</style>
