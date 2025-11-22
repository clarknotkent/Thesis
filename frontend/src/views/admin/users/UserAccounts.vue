<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Offline Indicator Banner -->
      <div
        v-if="isOffline"
        class="alert alert-warning d-flex align-items-center mb-3"
        role="alert"
      >
        <i class="bi bi-wifi-off me-2 fs-5" />
        <div>
          <strong>Offline Mode</strong> - You're viewing cached user data. User management actions are disabled until you reconnect.
        </div>
      </div>

      <!-- Caching Progress Banner -->
      <div
        v-if="isCaching"
        class="alert alert-info d-flex align-items-center mb-3"
        role="alert"
      >
        <div
          class="spinner-border spinner-border-sm me-2"
          role="status"
        >
          <span class="visually-hidden">Caching...</span>
        </div>
        <div>
          <strong>Caching user data...</strong> Saving user accounts for offline access.
        </div>
      </div>
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
          <li
            class="breadcrumb-item active"
            aria-current="page"
          >
            User Accounts
          </li>
        </ol>
      </nav>

      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-person-circle me-2" />User Accounts
          </h1>
          <p class="text-muted mb-0">
            Manage system users and permissions
          </p>
        </div>
      </div>

      <!-- User Stats -->
      <div class="row g-3 mb-4">
        <!-- Total Users -->
        <div class="col-md">
          <div class="card border border-primary border-3 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-primary text-uppercase mb-1">
                    Total Users
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ userStats.total }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-people text-primary"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Admins -->
        <div class="col-md">
          <div
            class="card border border-3 shadow h-100 py-2"
            style="border-color: #601FC2 !important;"
          >
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div
                    class="text-xs fw-bold text-uppercase mb-1"
                    style="color: #601FC2;"
                  >
                    Admins
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ userStats.admins }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-person-lock"
                    style="font-size: 2rem; color: #601FC2;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Staff -->
        <div class="col-md">
          <div
            class="card border border-3 shadow h-100 py-2"
            style="border-color: #00B2E3 !important;"
          >
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div
                    class="text-xs fw-bold text-uppercase mb-1"
                    style="color: #00B2E3;"
                  >
                    Staff
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ userStats.healthWorkers }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-person-badge"
                    style="font-size: 2rem; color: #00B2E3;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Guardians -->
        <div class="col-md">
          <div
            class="card border border-3 shadow h-100 py-2"
            style="border-color: #BC4E1E !important;"
          >
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div
                    class="text-xs fw-bold text-uppercase mb-1"
                    style="color: #BC4E1E;"
                  >
                    Guardians
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ userStats.parents }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-person-vcard"
                    style="font-size: 2rem; color: #BC4E1E;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Management -->
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 fw-bold text-primary">
            User List
          </h6>
          <div class="d-flex gap-2 align-items-center">
            <div
              class="input-group"
              style="width: 250px;"
            >
              <input 
                v-model="searchQuery" 
                type="text" 
                class="form-control"
                placeholder="Search users..."
                @input="handleSearch"
              >
              <button
                class="btn btn-outline-primary"
                type="button"
              >
                <i class="bi bi-search" />
              </button>
            </div>
            <div class="btn-group btn-group-sm ms-2">
              <button 
                class="btn btn-outline-primary"
                :class="{ active: activeFilter === 'all' }"
                @click="setFilter('all')"
              >
                All
              </button>
              <button 
                class="btn btn-outline-primary"
                :class="{ active: activeFilter === 'admin' }"
                @click="setFilter('admin')"
              >
                Admins
              </button>
              <button 
                class="btn btn-outline-primary"
                :class="{ active: activeFilter === 'health_worker' }"
                @click="setFilter('health_worker')"
              >
                Staff
              </button>
              <button 
                class="btn btn-outline-primary"
                :class="{ active: activeFilter === 'parent' }"
                @click="setFilter('parent')"
              >
                Guardians
              </button>
            </div>
            <div class="form-check form-switch ms-2">
              <input
                id="showDeletedSwitch"
                v-model="showDeleted"
                class="form-check-input"
                type="checkbox"
                :disabled="isOffline"
                @change="handleShowDeletedChange"
              >
              <label
                class="form-check-label small"
                for="showDeletedSwitch"
              >Show Deleted</label>
            </div>
            <button
              class="btn btn-primary ms-2"
              :disabled="isOffline"
              @click="handleAddUserClick"
            >
              <i class="bi bi-plus-circle me-2" />Add New User
            </button>
          </div>
        </div>
        <div class="card-body">
          <AppSpinner v-if="loading" />
          <div
            v-else
            class="table-responsive"
          >
            <table class="table table-hover table-bordered">
              <thead class="table-light">
                <tr>
                  <th class="text-center">
                    ID
                  </th>
                  <th class="text-center">
                    Name
                  </th>
                  <th class="text-center">
                    Username
                  </th>
                  <th class="text-center">
                    Role
                  </th>
                  <th class="text-center">
                    Status
                  </th>
                  <th class="text-center">
                    Last Login
                  </th>
                  <th class="text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in users"
                  :key="user.id"
                  :class="{ 'table-secondary': user.status === 'inactive' }"
                >
                  <td class="text-center align-middle fw-semibold text-primary">
                    {{ user.id }}
                  </td>
                  <td class="text-center align-middle fw-semibold">
                    {{ user.name }}
                  </td>
                  <td class="text-center align-middle">
                    {{ user.username }}
                  </td>
                  <td class="text-center align-middle">
                    <span
                      class="badge role-badge"
                      :class="getRoleBadgeClass(user.role)"
                    >
                      {{ getRoleDisplayName(user.role) }}
                    </span>
                  </td>
                  <td class="text-center align-middle">
                    <span
                      class="badge"
                      :class="statusBadgeClass(user.status)"
                    >
                      {{ user.status }}
                    </span>
                  </td>
                  <td class="text-center align-middle">
                    {{ user.lastLoginDisplay }}
                  </td>
                  <td class="text-center align-middle">
                    <div class="d-flex gap-2 justify-content-center">
                      <router-link 
                        :to="`/admin/users/view/${user.id}`"
                        class="btn btn-sm btn-outline-primary"
                        title="View Details"
                      >
                        <i class="bi bi-eye me-1" />View
                      </router-link>
                      <button 
                        v-if="user.status !== 'archived'"
                        class="btn btn-sm btn-outline-danger" 
                        :disabled="isOffline"
                        :title="isAdminRole(user.role) ? 'Admin accounts cannot be deleted' : isOffline ? 'Cannot delete users while offline' : ''"
                        @click="confirmDeleteUser(user)"
                      >
                        <i class="bi bi-trash me-1" />Delete
                      </button>
                      <button
                        v-else-if="user.status === 'archived'"
                        class="btn btn-sm btn-outline-success"
                        :disabled="isOffline"
                        :title="isOffline ? 'Cannot restore users while offline' : 'Restore User'"
                        @click="openRestoreModal(user)"
                      >
                        <i class="bi bi-arrow-counterclockwise me-1" />Restore
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div
              v-if="users.length === 0"
              class="text-center py-4"
            >
              <i
                class="bi bi-person-x text-muted"
                style="font-size: 3rem;"
              />
              <p class="text-muted mt-2">
                {{ showDeleted ? 'No deleted users found' : 'No users found' }}
              </p>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <AppPagination
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-items="totalItems"
            :items-per-page="itemsPerPage"
            @page-changed="goToPage"
          />
        </div>
      </div>

      <!-- Recent Activity table removed as requested -->

      <!-- Add/Edit user moved to its own page (AddUser.vue/EditUser.vue). Modal removed. -->

      <!-- Delete Confirmation Modal -->
      <AppModal
        :show="showDeleteModal"
        title="Confirm Delete"
        @close="closeDeleteModal"
      >
        <p>Are you sure you want to delete the user "{{ userToDelete?.name }}"?</p>
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
            @click="deleteUser"
          >
            <i class="bi bi-trash me-1" />
            {{ deleting ? 'Deleting...' : 'Delete User' }}
          </button>
        </div>
      </AppModal>

      <!-- Password Reset Modal -->
      <AppModal
        :show="showPasswordModal"
        title="Reset Password"
        @close="closePasswordModal"
      >
        <p>Reset password for user "{{ userToResetPassword?.name }}"?</p>
        <div class="mb-3">
          <label class="form-label">New Password <span class="text-danger">*</span></label>
          <div class="position-relative">
            <input
              v-model="newPassword"
              :type="showResetPassword ? 'text' : 'password'"
              class="form-control pe-5"
              placeholder="Enter new password"
              minlength="8"
            >
            <button
              type="button"
              class="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted"
              style="border: none; background: transparent; padding: 0 10px; z-index: 10;"
              @click="showResetPassword = !showResetPassword"
            >
              <i :class="showResetPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" />
            </button>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Confirm Password <span class="text-danger">*</span></label>
          <div class="position-relative">
            <input
              v-model="confirmPassword"
              :type="showConfirmResetPassword ? 'text' : 'password'"
              class="form-control pe-5"
              :class="{ 'is-invalid': newPassword && confirmPassword && newPassword !== confirmPassword }"
              placeholder="Confirm new password"
              minlength="8"
            >
            <button
              type="button"
              class="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted"
              style="border: none; background: transparent; padding: 0 10px; z-index: 10;"
              @click="showConfirmResetPassword = !showConfirmResetPassword"
            >
              <i :class="showConfirmResetPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" />
            </button>
          </div>
          <div
            v-if="newPassword && confirmPassword && newPassword !== confirmPassword"
            class="invalid-feedback d-block"
          >
            Passwords do not match
          </div>
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
            :disabled="resettingPassword || (newPassword && confirmPassword && newPassword !== confirmPassword)"
            @click="updatePassword"
          >
            <i class="bi bi-key me-1" />
            {{ resettingPassword ? 'Resetting...' : 'Reset Password' }}
          </button>
        </div>
      </AppModal>

      <!-- Restore Confirmation Modal -->
      <AppModal
        :show="showRestoreModal"
        title="Confirm Restore"
        @close="closeRestoreModal"
      >
        <p>Restore the user "{{ userToRestore?.name }}"?</p>
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
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import AppSpinner from '@/components/ui/base/AppSpinner.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import AppModal from '@/components/ui/base/AppModal.vue'
import api from '@/services/api'
import { listUsers as apiListUsers, deleteUser as apiDeleteUser, restoreUser as apiRestoreUser, resetPassword as apiResetPassword } from '@/services/users'
import { formatPHDateTime, utcToPH } from '@/utils/dateUtils'
import { useToast } from '@/composables/useToast'
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'

// Backend-driven; remove mock data

// Reactive data
const users = ref([])
const recentActivity = ref([])
const loading = ref(false)
// Removed modal-based create/edit state; add/edit now handled on dedicated pages
const deleting = ref(false)
const resettingPassword = ref(false)
const restoring = ref(false)
const showRestoreModal = ref(false)
const userToRestore = ref(null)
const searchQuery = ref('')
const activeFilter = ref('all')
const showDeleted = ref(false)
const currentUserId = ref('1') // This would come from auth context

// Statistics for all users (not just current page)
const allUserStats = ref({
  total: 0,
  admins: 0,
  healthWorkers: 0,
  parents: 0
})

// Pagination state (simplified)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const itemsPerPage = 5

// Modal states (only for delete/reset/restore)
const showDeleteModal = ref(false)
const showPasswordModal = ref(false)
const userToDelete = ref(null)
const userToResetPassword = ref(null)
const newPassword = ref('')
const confirmPassword = ref('')
const showResetPassword = ref(false)
const showConfirmResetPassword = ref(false)
const { addToast } = useToast()
const { isOffline, isCaching, fetchUsers: fetchUsersOffline } = useOfflineAdmin()
const router = useRouter()

// Add/Edit user form moved to AddUser.vue/EditUser.vue

// Computed properties
const userStats = computed(() => ({
  total: allUserStats.value.total,
  admins: allUserStats.value.admins,
  healthWorkers: allUserStats.value.healthWorkers,
  parents: allUserStats.value.parents
}))

// Fetch user statistics for all users (not paginated)
const fetchUserStats = async () => {
  try {
    if (isOffline.value) {
      // Use cached data when offline
      console.log('📊 Fetching user statistics from cached data')
      const result = await fetchUsersOffline({ role: '', search: '' })
      
      if (result.fromCache && result.data?.users) {
        const cachedUsers = result.data.users.filter(u => !u.is_deleted && u.status !== 'archived')
        allUserStats.value = {
          total: cachedUsers.length,
          admins: cachedUsers.filter(u => u.role === 'Admin').length,
          healthWorkers: cachedUsers.filter(u => u.role === 'HealthStaff').length,
          parents: cachedUsers.filter(u => u.role === 'Guardian').length
        }
      } else {
        console.warn('Failed to fetch user statistics from cache')
        allUserStats.value = { total: 0, admins: 0, healthWorkers: 0, parents: 0 }
      }
      return
    }

    // Online mode - fetch from API
    const { users: allUsers } = await apiListUsers({
      page: 1,
      limit: 10000, // Large number to get all users
      search: '',
      role: '',
      status: 'not_archived'
    })
    
    allUserStats.value = {
      total: allUsers.length,
      admins: allUsers.filter(u => u.role === 'Admin').length,
      healthWorkers: allUsers.filter(u => u.role === 'Health Staff').length,
      parents: allUsers.filter(u => u.role === 'Parent').length
    }
  } catch (error) {
    console.error('Failed to fetch user statistics:', error)
    allUserStats.value = { total: 0, admins: 0, healthWorkers: 0, parents: 0 }
  }
}

// Methods
const mapBackendRoleToOption = (role) => {
  // Normalize any incoming backend role string to frontend option tokens
  if (!role) return ''
  let r = String(role).toLowerCase().trim()
  // Unify separators
  r = r.replace(/[-\s]+/g, '_') // "health worker" / "health-worker" -> health_worker
  // Handle common variants
  if (r === 'health_worker' || r === 'healthworker') return 'health_worker'
  if (r === 'guardian' || r === 'parent') return 'parent'
  if (r === 'admin') return 'admin'
  return r
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const role = activeFilter.value !== 'all' ? activeFilter.value : ''
    const status = showDeleted.value ? 'archived' : 'not_archived'
    
    // Try online first
    if (!isOffline.value) {
      try {
        const { users: rows, pagination } = await apiListUsers({
          page: currentPage.value,
          limit: itemsPerPage,
          search: searchQuery.value,
          role,
          status
        })
        
        const mapped = rows.map(u => {
          const rawLast = u.lastLogin || u.last_login || null
          return {
            id: u.id,
            name: u.name || [u.firstname, u.surname].filter(Boolean).join(' '),
            username: u.username,
            role: mapBackendRoleToOption(u.role),
            hwType: u.hw_type || '',
            status: u.status || 'active',
            lastLogin: rawLast,
            lastLoginDisplay: rawLast ? formatDatePH(rawLast) : 'Never'
          }
        })
        
        // Sort so inactive users appear at the end
        const weight = (s) => (String(s).toLowerCase() === 'inactive' ? 1 : 0)
        users.value = mapped.sort((a, b) => {
          const wa = weight(a.status), wb = weight(b.status)
          if (wa !== wb) return wa - wb
          const ia = Number(a.id) || 0
          const ib = Number(b.id) || 0
          return ia - ib
        })
        
        totalItems.value = pagination?.totalItems || rows.length
        totalPages.value = pagination?.totalPages || Math.ceil(totalItems.value / itemsPerPage)
        return
      } catch (onlineError) {
        console.warn('Online user fetch failed, trying offline:', onlineError.message)
      }
    }

    // Fallback to offline
    console.log('👥 Fetching users from cached data')
    let mappedRole = role
    if (role === 'admin') mappedRole = 'Admin'
    else if (role === 'health_worker') mappedRole = 'Health Staff'
    else if (role === 'parent') mappedRole = 'Parent'
    
    const params = {
      role: mappedRole || undefined,
      search: searchQuery.value || undefined
    }
    
    const result = await fetchUsersOffline(params)
    
    if (result.fromCache && result.data?.users) {
      const cachedUsers = result.data.users
      
      // Additional safety filter for deleted users (should not be needed if prefetch works correctly)
      const safeFilteredUsers = cachedUsers.filter(u => !u.is_deleted)
      
      // Apply status filter to cached data
      let filteredUsers = safeFilteredUsers
      if (status === 'archived') {
        filteredUsers = safeFilteredUsers.filter(u => u.status === 'archived' || u.is_deleted)
      } else {
        filteredUsers = safeFilteredUsers.filter(u => !u.is_deleted && u.status !== 'archived')
      }
      
      // Apply search filter
      if (params.search) {
        filteredUsers = filteredUsers.filter(u =>
          u.name?.toLowerCase().includes(params.search.toLowerCase()) ||
          u.username?.toLowerCase().includes(params.search.toLowerCase())
        )
      }
      
      // Apply pagination
      const startIndex = (currentPage.value - 1) * itemsPerPage
      const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)
      
      const mapped = paginatedUsers.map(u => ({
        id: u.user_id || u.id,
        name: u.name || [u.firstname, u.surname].filter(Boolean).join(' '),
        username: u.username,
        role: mapBackendRoleToOption(u.role),
        hwType: u.hw_type || '',
        status: u.status || 'active',
        lastLogin: u.last_login || null,
        lastLoginDisplay: u.last_login ? formatDatePH(u.last_login) : 'Never'
      }))
      
      users.value = mapped
      totalItems.value = filteredUsers.length
      totalPages.value = Math.ceil(filteredUsers.length / itemsPerPage)
    } else {
      throw new Error('Failed to fetch users from cache')
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    users.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

const fetchRecentActivity = async () => {
  try {
    if (isOffline.value) {
      // Activity logs are not cached offline
      console.log('📋 Activity logs not available in offline mode')
      recentActivity.value = []
      return
    }

    // Online mode - fetch from API
    const { data } = await api.get('/activity-logs', { params: { page: 1, limit: 7 } })
    recentActivity.value = (data.items || []).map(r => ({
      id: r.log_id || r.id,
      timestamp: r.timestamp,
      // Provide a frontend PH-formatted string for direct binding if desired
      timestampDisplay: r.timestamp ? formatDatePH(r.timestamp) : 'Never',
      userFullName: r.display_user_name || r.user_fullname || r.username || r.user_id,
      action: r.display_action || r.description || r.action_type,
      ipAddress: r.ip_address || ''
    }))
  } catch (error) {
    console.error('Error fetching activity:', error)
    recentActivity.value = []
  }
}

const setFilter = (filter) => {
  activeFilter.value = filter
  currentPage.value = 1
  fetchUsers()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

const handleShowDeletedChange = () => {
  if (isOffline.value) {
    addToast({ 
      title: 'Offline Mode', 
      message: 'Cannot toggle deleted users view while offline.', 
      type: 'warning' 
    })
    // Reset the checkbox
    showDeleted.value = false
    return
  }
  fetchUsers()
}

const handleAddUserClick = () => {
  if (isOffline.value) {
    addToast({ 
      title: 'Offline Mode', 
      message: 'Cannot add new users while offline. Please reconnect to continue.', 
      type: 'warning' 
    })
    return
  }
  // Navigate to add user page
  router.push('/admin/users/add')
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page
    fetchUsers()
  }
}

// Add/Edit user create/update now handled in dedicated pages

const confirmDeleteUser = (user) => {
  // Prevent deletes with clear feedback rather than disabling the button
  if (isOffline.value) {
    addToast({ title: 'Offline Mode', message: 'Cannot delete users while offline.', type: 'warning' })
    return
  }
  if (isAdminRole(user.role)) {
    addToast({ title: 'Not allowed', message: 'Admin accounts cannot be deleted.', type: 'error' })
    return
  }
  if (user.id === currentUserId.value) {
    addToast({ title: 'Not allowed', message: 'You cannot delete your own account.', type: 'error' })
    return
  }
  userToDelete.value = user
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  userToDelete.value = null
}

const deleteUser = async () => {
  if (!userToDelete.value) return
  
  deleting.value = true
  try {
    await apiDeleteUser(userToDelete.value.id)
    closeDeleteModal()
    await fetchUserStats()
    await fetchUsers()
    await fetchRecentActivity()
    addToast({ title: 'Success', message: 'User deleted successfully!', type: 'success' })
  } catch (error) {
    console.error('Error deleting user:', error)
    addToast({ title: 'Error', message: 'Error deleting user. Please try again.', type: 'error' })
  } finally {
    deleting.value = false
  }
}

const _resetPassword = (user) => {
  userToResetPassword.value = user
  newPassword.value = ''
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  userToResetPassword.value = null
  newPassword.value = ''
  confirmPassword.value = ''
  showResetPassword.value = false
  showConfirmResetPassword.value = false
}

const updatePassword = async () => {
  if (!userToResetPassword.value || !newPassword.value) return
  if (newPassword.value !== confirmPassword.value) {
    addToast({ title: 'Error', message: 'Passwords do not match', type: 'error' })
    return
  }
  resettingPassword.value = true
  try {
    const res = await apiResetPassword(userToResetPassword.value.id, newPassword.value)
    closePasswordModal()
    await fetchRecentActivity()
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

const openRestoreModal = (user) => {
  if (isOffline.value) {
    addToast({ title: 'Offline Mode', message: 'Cannot restore users while offline.', type: 'warning' })
    return
  }
  userToRestore.value = user
  showRestoreModal.value = true
}

const closeRestoreModal = () => {
  showRestoreModal.value = false
  userToRestore.value = null
}

const performRestore = async () => {
  if (!userToRestore.value) return
  restoring.value = true
  try {
    const res = await apiRestoreUser(userToRestore.value.id)
    closeRestoreModal()
    await fetchUserStats()
    await fetchUsers()
    await fetchRecentActivity()
    const msg = (res && (res.message || res.msg)) || 'User restored successfully!'
    addToast({ title: 'Success', message: msg, type: 'success' })
  } catch (e) {
    console.error('Restore failed', e)
    const msg = e?.response?.data?.message || e?.message || 'Failed to restore user.'
    addToast({ title: 'Error', message: msg, type: 'error' })
  } finally {
    restoring.value = false
  }
}

const getRoleBadgeClass = (role) => {
  const r = (role || '').toLowerCase().replace(/[-\s]+/g,'_')
  if (r === 'admin') return 'role-admin'
  if (r === 'super_admin' || r === 'superadmin') return 'role-superadmin'
  if (r === 'parent' || r === 'guardian') return 'role-parent'
  if (r === 'health_worker' || r === 'healthstaff' || r === 'health_staff') return 'role-healthstaff'
  return 'role-healthstaff'
}

const getRoleDisplayName = (role) => {
  switch (role) {
    case 'super_admin': return 'Super Admin'
    case 'superadmin': return 'Super Admin'
    case 'health_worker': return 'Health Worker'
    case 'parent': return 'Guardian'
    case 'admin': return 'Admin'
    default: {
      // Fallback: attempt to prettify unforeseen variants
      if (!role) return ''
      return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    }
  }
}

// Status badge helper
const statusBadgeClass = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'active') return 'bg-success'
  if (s === 'inactive') return 'bg-secondary'
  if (s === 'archived') return 'bg-dark'
  return 'bg-secondary'
}

// Explicit PH timezone formatting (treat timezone-less ISO as UTC -> PH)
const formatDatePH = (date) => {
  if (!date) return 'Never'
  // If string looks like ISO but without timezone (e.g., 2025-10-24T05:12:33.123456), treat as UTC
  if (typeof date === 'string') {
    const hasTz = /[zZ]|[+\-]\d{2}:?\d{2}$/.test(date)
    const looksIso = /^\d{4}-\d{2}-\d{2}T/.test(date)
    if (!hasTz && looksIso) {
      try {
        return utcToPH(date + 'Z').format('MMM DD, YYYY hh:mm A')
      } catch (_) {
        // fall through to default formatter
      }
    }
  }
  return formatPHDateTime(date)
}

// Date input helpers removed with modal

// Lifecycle
onMounted(() => {
  fetchUserStats()
  fetchUsers()
  fetchRecentActivity()
})

// Normalize role and detect admin variants for consistent UI behavior
const isAdminRole = (role) => {
  const raw = (role || '').toString().toLowerCase().trim()
  const norm = raw.replace(/[-\s]+/g, '_')
  return norm === 'admin' || norm === 'administrator' || norm === 'super_admin' || norm === 'superadmin'
}
</script>

<style scoped>
/* Breadcrumb Styling */
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

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.text-gray-800 {
  color: #5a5c69 !important;
}

.btn-group .btn {
  border-radius: 0.25rem;
  margin-right: 0.125rem;
}

.btn-group .btn:last-child {
  margin-right: 0;
}

/* Role Badge Styling */
.role-badge {
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
}

.role-superadmin {
  background-color: #000000 !important;
  color: white !important;
}
</style>
