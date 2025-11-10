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
            User Details
          </li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-person-circle me-2" />User Details
          </h1>
          <p class="text-muted mb-0">
            View user account information
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

      <!-- User Details -->
      <div
        v-else-if="userData"
        class="row"
      >
        <div class="col-lg-8">
          <!-- User Information Card -->
          <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 class="m-0 fw-bold text-primary">
                User Information
              </h6>
              <span
                class="badge"
                :class="statusBadgeClass"
              >
                {{ userData.status }}
              </span>
            </div>
            <div class="card-body">
              <UserForm
                :initial-data="userData"
                :read-only="true"
                mode="edit"
              />
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <!-- Account Stats -->
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 fw-bold text-primary">
                Account Stats
              </h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <small class="text-muted d-block">Role</small>
                <span
                  class="badge role-badge"
                  :class="roleBadgeClass"
                >
                  {{ roleDisplayName }}
                </span>
              </div>
              <div
                v-if="userData.lastLogin"
                class="mb-3"
              >
                <small class="text-muted d-block">Last Login</small>
                <strong>{{ formatDate(userData.lastLogin) }}</strong>
              </div>
              <div
                v-if="userData.createdAt"
                class="mb-3"
              >
                <small class="text-muted d-block">Account Created</small>
                <strong>{{ formatDate(userData.createdAt) }}</strong>
              </div>
            </div>
          </div>

          <!-- Actions Card -->
          <div class="card shadow">
            <div class="card-header py-3">
              <h6 class="m-0 fw-bold text-primary">
                Actions
              </h6>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <router-link 
                  :to="`/admin/users/edit/${userId}`"
                  class="btn btn-primary"
                >
                  <i class="bi bi-pencil me-2" />Edit User
                </router-link>
                <button 
                  class="btn btn-warning"
                  @click="openPasswordModal"
                >
                  <i class="bi bi-key me-2" />Reset Password
                </button>
                <button 
                  v-if="userData?.status !== 'archived'"
                  class="btn btn-danger"
                  @click="openDeleteModal"
                >
                  <i class="bi bi-trash me-2" />Delete User
                </button>
                <button
                  v-else-if="userData?.status === 'archived'"
                  class="btn btn-success"
                  @click="openRestoreModal"
                >
                  <i class="bi bi-arrow-counterclockwise me-2" />Restore User
                </button>
              </div>
              
              <div
                v-if="isAdmin"
                class="alert alert-warning mt-3 mb-0 small"
              >
                <i class="bi bi-exclamation-triangle me-1" />
                Admin accounts cannot be deleted
              </div>
            </div>
          </div>
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

      <!-- Password Reset Modal -->
      <AppModal
        :show="showPasswordModal"
        title="Reset Password"
        @close="closePasswordModal"
      >
        <p>Reset password for user "{{ userFullName }}"?</p>
        <div class="mb-3">
          <label class="form-label">New Password</label>
          <input
            v-model="newPassword"
            type="password"
            class="form-control"
            placeholder="Enter new password"
          >
        </div>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button
            class="btn btn-secondary"
            @click="closePasswordModal"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="resettingPassword"
            @click="submitPasswordReset"
          >
            <i class="bi bi-key me-1" />
            {{ resettingPassword ? 'Resetting...' : 'Reset Password' }}
          </button>
        </div>
      </AppModal>

      <!-- Delete Confirmation Modal -->
      <AppModal
        :show="showDeleteModal"
        title="Confirm Delete"
        @close="closeDeleteModal"
      >
        <p>Are you sure you want to delete the user "{{ userFullName }}"?</p>
        <p class="text-danger small">
          This action cannot be undone.
        </p>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button
            class="btn btn-secondary"
            @click="closeDeleteModal"
          >
            Cancel
          </button>
          <button
            class="btn btn-danger"
            :disabled="deleting"
            @click="performDelete"
          >
            <i class="bi bi-trash me-1" />
            {{ deleting ? 'Deleting...' : 'Delete User' }}
          </button>
        </div>
      </AppModal>

      <!-- Restore Confirmation Modal -->
      <AppModal
        :show="showRestoreModal"
        title="Confirm Restore"
        @close="closeRestoreModal"
      >
        <p>Restore the user "{{ userFullName }}"?</p>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button
            class="btn btn-secondary"
            @click="closeRestoreModal"
          >
            Cancel
          </button>
          <button
            class="btn btn-success"
            :disabled="restoring"
            @click="performRestore"
          >
            <i class="bi bi-arrow-counterclockwise me-1" />
            {{ restoring ? 'Restoring...' : 'Restore User' }}
          </button>
        </div>
      </AppModal>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import AppModal from '@/components/ui/base/AppModal.vue'
import UserForm from '@/features/admin/user-management/UserForm.vue'
import { getUser, deleteUser, resetPassword, restoreUser } from '@/services/users'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const userData = ref(null)
const loading = ref(true)
const userId = computed(() => route.params.id)
const showPasswordModal = ref(false)
const newPassword = ref('')
const resettingPassword = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)
const showRestoreModal = ref(false)
const restoring = ref(false)

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
      username: user.username || '',
      email: user.email || '',
      role: user.role || '',
    // prefer new hs_type field, but fall back to older names for compatibility
      hsType: user.hs_type || user.hsType || user.hw_type || user.hwType || '',
    status: user.is_deleted ? 'archived' : (user.status || 'active'),
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
    addToast({ title: 'Error', message: 'Error loading user data', type: 'error' })
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
  const s = String(userData.value.status || '').toLowerCase()
  if (s === 'active') return 'bg-success'
  if (s === 'inactive') return 'bg-secondary'
  if (s === 'archived') return 'bg-dark'
  return 'bg-secondary'
})

const roleBadgeClass = computed(() => {
  if (!userData.value) return 'role-healthstaff'
  const role = (userData.value.role || '').toLowerCase().replace(/[-\s]+/g,'_')
  if (role === 'admin') return 'role-admin'
  if (role === 'parent' || role === 'guardian') return 'role-parent'
  if (role === 'health_worker' || role === 'healthstaff' || role === 'health_staff') return 'role-healthstaff'
  return 'role-healthstaff'
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

// Robust admin detection to cover variants like 'Admin', 'administrator', 'super admin'
const isAdmin = computed(() => {
  const raw = (userData.value?.role || '').toString().toLowerCase().trim()
  const norm = raw.replace(/[-\s]+/g, '_')
  return norm === 'admin' || norm === 'administrator' || norm === 'super_admin' || norm === 'superadmin'
})

const openPasswordModal = () => {
  newPassword.value = ''
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  newPassword.value = ''
}

const submitPasswordReset = async () => {
  if (!newPassword.value) return
  resettingPassword.value = true
  try {
    const res = await resetPassword(userId.value, newPassword.value)
    closePasswordModal()
    const msg = (res && (res.message || res.msg)) || 'Password reset successfully!'
    addToast({ title: 'Success', message: msg, type: 'success' })
  } catch (error) {
    console.error('Error resetting password:', error)
    const msg = error?.response?.data?.message || error?.message || 'Error resetting password.'
    addToast({ title: 'Error', message: msg, type: 'error' })
  } finally {
    resettingPassword.value = false
  }
}

const userFullName = computed(() => {
  if (!userData.value) return ''
  return `${userData.value.firstName || ''} ${userData.value.lastName || ''}`.trim()
})

const openDeleteModal = () => {
  if (isAdmin.value) {
    addToast({ title: 'Not allowed', message: 'Admin accounts cannot be deleted.', type: 'error' })
    return
  }
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const performDelete = async () => {
  deleting.value = true
  try {
    await deleteUser(userId.value)
    addToast({ title: 'Success', message: 'User deleted successfully!', type: 'success' })
    router.push('/admin/users')
  } catch (error) {
    console.error('Error deleting user:', error)
    const msg = error?.response?.data?.message || error?.message || 'Error deleting user'
    addToast({ title: 'Error', message: msg, type: 'error' })
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

const openRestoreModal = () => {
  showRestoreModal.value = true
}

const closeRestoreModal = () => {
  showRestoreModal.value = false
}

const performRestore = async () => {
  restoring.value = true
  try {
    const res = await restoreUser(userId.value)
    const msg = (res && (res.message || res.msg)) || 'User restored successfully!'
    addToast({ title: 'Success', message: msg, type: 'success' })
    await fetchUserData()
  } catch (error) {
    console.error('Error restoring user:', error)
    const msg = error?.response?.data?.message || error?.message || 'Failed to restore user.'
    addToast({ title: 'Error', message: msg, type: 'error' })
  } finally {
    restoring.value = false
    showRestoreModal.value = false
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

.badge { text-transform: capitalize; }
</style>
