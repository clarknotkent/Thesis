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
          <li class="breadcrumb-item active">User Details</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-person-circle me-2"></i>User Details
          </h1>
          <p class="text-muted mb-0">View user account information</p>
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

      <!-- User Details -->
      <div v-else-if="userData" class="row">
        <div class="col-lg-8">
          <!-- User Information Card -->
          <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 class="m-0 fw-bold text-primary">User Information</h6>
              <span class="badge" :class="statusBadgeClass">
                {{ userData.status }}
              </span>
            </div>
            <div class="card-body">
              <UserForm
                :initial-data="userData"
                :read-only="true"
              />
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <!-- Account Stats -->
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 fw-bold text-primary">Account Stats</h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <small class="text-muted d-block">Role</small>
                <span class="badge" :class="roleBadgeClass">
                  {{ roleDisplayName }}
                </span>
              </div>
              <div class="mb-3" v-if="userData.lastLogin">
                <small class="text-muted d-block">Last Login</small>
                <strong>{{ formatDate(userData.lastLogin) }}</strong>
              </div>
              <div class="mb-3" v-if="userData.createdAt">
                <small class="text-muted d-block">Account Created</small>
                <strong>{{ formatDate(userData.createdAt) }}</strong>
              </div>
            </div>
          </div>

          <!-- Actions Card -->
          <div class="card shadow">
            <div class="card-header py-3">
              <h6 class="m-0 fw-bold text-primary">Actions</h6>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <router-link 
                  :to="`/admin/users/edit/${userId}`"
                  class="btn btn-primary"
                >
                  <i class="bi bi-pencil me-2"></i>Edit User
                </router-link>
                <button 
                  class="btn btn-warning"
                  @click="handleResetPassword"
                >
                  <i class="bi bi-key me-2"></i>Reset Password
                </button>
                <button 
                  class="btn btn-danger"
                  @click="handleDelete"
                  :disabled="userData?.role === 'admin'"
                >
                  <i class="bi bi-trash me-2"></i>Delete User
                </button>
              </div>
              
              <div v-if="userData?.role === 'admin'" class="alert alert-warning mt-3 mb-0 small">
                <i class="bi bi-exclamation-triangle me-1"></i>
                Admin accounts cannot be deleted
              </div>
            </div>
          </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import UserForm from './components/UserForm.vue'
import { getUser, deleteUser, resetPassword } from '@/services/users'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()
const { confirm } = useConfirm()

const userData = ref(null)
const loading = ref(true)
const userId = computed(() => route.params.id)

onMounted(async () => {
  await fetchUserData()
})

const goBack = () => {
  router.back()
}

const fetchUserData = async () => {
  try {
    const id = userId.value
    const response = await getUser(id)
    const user = response.user || response
    
    // Map backend fields to display structure
    userData.value = {
      id: user.id || user.user_id,
      firstName: user.firstname || user.firstName || '',
      middleName: user.middlename || user.middleName || '',
      lastName: user.surname || user.lastName || '',
      email: user.email || '',
      role: user.role || '',
      // prefer new hs_type field, but fall back to older names for compatibility
      hsType: user.hs_type || user.hsType || user.hw_type || user.hwType || '',
      status: user.status || 'active',
      licenseNumber: user.professional_license_no || user.license_number || user.licenseNumber || '',
      employeeId: user.employee_id || user.employeeId || '',
      phoneNumber: user.phone_number || user.phoneNumber || '',
      contactNumber: user.contact_number || user.contactNumber || '',
      sex: user.sex || '',
      birthdate: user.birthdate || '',
      address: user.address || '',
      lastLogin: user.last_login || user.lastLogin || null,
      createdAt: user.created_at || user.createdAt || null
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    addToast('Error loading user data', 'error')
    userData.value = null
  } finally {
    loading.value = false
  }
}

const roleDisplayName = computed(() => {
  if (!userData.value) return ''
  const role = userData.value.role
  if (role === 'health_staff' || role === 'healthstaff' || role === 'health worker' || role === 'health_worker' || role === 'Health Staff' || role === 'HealthStaff') {
    const hsType = userData.value.hsType
    if (hsType) {
      // display 'Barangay Health Staff' for 'bhs' or capitalize other types
      if (hsType.toLowerCase() === 'bhs' || hsType.toLowerCase() === 'bhw') {
  return 'Health Staff (Barangay Health Staff)'
      }
      return `Health Staff (${hsType.charAt(0).toUpperCase() + hsType.slice(1)})`
    }
    return 'Health Staff'
  }
  if (role === 'admin') return 'Admin'
  if (role === 'parent') return 'Parent'
  return role
})

const statusBadgeClass = computed(() => {
  if (!userData.value) return 'bg-secondary'
  return userData.value.status === 'active' ? 'bg-success' : 'bg-secondary'
})

const roleBadgeClass = computed(() => {
  if (!userData.value) return 'bg-secondary'
  const role = userData.value.role
  if (role === 'admin') return 'bg-danger'
  if (role === 'health_worker' || role === 'health_staff' || role === 'HealthStaff') return 'bg-primary'
  if (role === 'parent') return 'bg-info'
  return 'bg-secondary'
})

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleResetPassword = async () => {
  const confirmed = await confirm(
    'Reset Password',
    'Are you sure you want to reset this user\'s password? A new password will be generated.'
  )
  
  if (!confirmed) return
  
  try {
    const newPassword = prompt('Enter new password:')
    if (!newPassword) return
    
    await resetPassword(userId.value, newPassword)
    addToast('Password reset successfully!', 'success')
  } catch (error) {
    console.error('Error resetting password:', error)
    addToast('Error resetting password', 'error')
  }
}

const handleDelete = async () => {
  const userName = `${userData.value.firstName} ${userData.value.lastName}`
  const confirmed = await confirm(
    'Delete User',
    `Are you sure you want to delete ${userName}? This action cannot be undone.`
  )
  
  if (!confirmed) return
  
  try {
    await deleteUser(userId.value)
    addToast('User deleted successfully!', 'success')
    router.push('/admin/users')
  } catch (error) {
    console.error('Error deleting user:', error)
    addToast('Error deleting user', 'error')
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

.badge {
  text-transform: capitalize;
}
</style>
