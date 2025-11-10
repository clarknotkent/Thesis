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
                @change="fetchUsers"
              >
              <label
                class="form-check-label small"
                for="showDeletedSwitch"
              >Show Deleted</label>
            </div>
            <button
              class="btn btn-primary ms-2"
              @click="openUserModal()"
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
                        :title="isAdminRole(user.role) ? 'Admin accounts cannot be deleted' : ''"
                        @click="confirmDeleteUser(user)"
                      >
                        <i class="bi bi-trash me-1" />Delete
                      </button>
                      <button
                        v-else-if="user.status === 'archived'"
                        class="btn btn-sm btn-outline-success"
                        title="Restore User"
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

      <!-- User Modal -->
      <div
        class="modal fade"
        :class="{ show: showUserModal }"
        :style="{ display: showUserModal ? 'block' : 'none' }"
        tabindex="-1"
      >
        <div
          class="modal-dialog modal-dialog-scrollable"
          style="max-width: 75vw; width: 75vw;"
        >
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-person-circle me-2" />
                {{ isEditing ? 'Edit User' : 'Add New User' }}
              </h5>
              <button
                type="button"
                class="btn-close"
                @click="closeUserModal"
              />
            </div>
            <div class="modal-body px-4">
              <form
                id="user-form"
                @submit.prevent="saveUser"
              >
                <!-- Personal Information -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-person-fill me-2" />Personal Information
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">First Name: <span class="text-danger">*</span></label>
                        <input
                          v-model="userForm.firstName"
                          type="text"
                          class="form-control"
                          required
                        >
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Middle Name:</label>
                        <input
                          v-model="userForm.middleName"
                          type="text"
                          class="form-control"
                        >
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Last Name: <span class="text-danger">*</span></label>
                        <input
                          v-model="userForm.lastName"
                          type="text"
                          class="form-control"
                          required
                        >
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Sex: <span class="text-danger">*</span></label>
                        <select
                          v-model="userForm.sex"
                          class="form-select"
                          required
                        >
                          <option value="">
                            Select Sex
                          </option>
                          <option value="Male">
                            Male
                          </option>
                          <option value="Female">
                            Female
                          </option>
                          <option value="Other">
                            Other
                          </option>
                        </select>
                      </div>
                      <div class="col-xl-3 col-lg-4 col-md-6">
                        <label class="form-label">Birthdate:</label>
                        <DateInput 
                          v-model="userForm.birthdate"
                          :max="maxBirthdate"
                        />
                      </div>
                      <div class="col-xl-9 col-lg-8 col-md-6">
                        <label class="form-label">Address:</label>
                        <input
                          v-model="userForm.address"
                          type="text"
                          class="form-control"
                          placeholder="House/Street, Barangay, City/Municipality, Province"
                        >
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Account Information -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-person-circle me-2" />Account Information
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-6 col-lg-6 col-md-6">
                        <label class="form-label">Username or Email: <span class="text-danger">*</span></label>
                        <input
                          v-model="userForm.userIdentifier"
                          type="text"
                          class="form-control"
                          required
                        >
                      </div>
                      <div
                        v-if="!isEditing"
                        class="col-xl-3 col-lg-3 col-md-6"
                      >
                        <label class="form-label">Password: <span class="text-danger">*</span></label>
                        <input
                          v-model="userForm.password"
                          type="password"
                          class="form-control"
                          :required="!isEditing"
                        >
                      </div>
                      <div class="col-xl-3 col-lg-3 col-md-6">
                        <label class="form-label">Status:</label>
                        <select
                          v-model="userForm.status"
                          class="form-select"
                        >
                          <option value="active">
                            Active
                          </option>
                          <option value="inactive">
                            Inactive
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Role & Professional Information -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-briefcase me-2" />Role & Professional Information
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-4 col-lg-4 col-md-6">
                        <label class="form-label">Role: <span class="text-danger">*</span></label>
                        <select
                          v-model="userForm.role"
                          class="form-select"
                          required
                        >
                          <option value="">
                            Select Role
                          </option>
                          <option value="admin">
                            Admin
                          </option>
                          <option value="health_worker">
                            Health Worker
                          </option>
                          <option value="parent">
                            Parent
                          </option>
                        </select>
                      </div>
                      <div
                        v-if="userForm.role === 'health_worker'"
                        class="col-xl-4 col-lg-4 col-md-6"
                      >
                        <label class="form-label">Health Worker Type: <span class="text-danger">*</span></label>
                        <select
                          v-model="userForm.hwType"
                          class="form-select"
                          required
                        >
                          <option value="">
                            Select Type
                          </option>
                          <option value="nurse">
                            Nurse
                          </option>
                          <option value="nutritionist">
                            Nutritionist
                          </option>
                          <option value="bhs">
                            Barangay Health Staff
                          </option>
                        </select>
                      </div>
                      <div
                        v-if="(userForm.role === 'health_worker' || userForm.role === 'admin') && isEditing"
                        class="col-xl-4 col-lg-4 col-md-6"
                      >
                        <label class="form-label">Employee ID:</label>
                        <input
                          v-model="userForm.employeeId"
                          type="text"
                          class="form-control"
                          readonly
                        >
                      </div>
                      <div
                        v-if="(userForm.role === 'health_worker' && ['nurse','nutritionist'].includes(userForm.hwType)) || userForm.role === 'admin'"
                        class="col-xl-6 col-lg-6 col-md-6"
                      >
                        <label class="form-label">PRC License Number:</label>
                        <input
                          v-model="userForm.licenseNumber"
                          type="text"
                          class="form-control"
                        >
                      </div>
                      <div
                        v-if="userForm.role === 'parent'"
                        class="col-xl-6 col-lg-6 col-md-6"
                      >
                        <label class="form-label">Contact Number:</label>
                        <input
                          v-model="userForm.contactNumber"
                          type="tel"
                          class="form-control"
                        >
                      </div>
                      <div
                        v-if="userForm.role !== 'parent'"
                        class="col-xl-6 col-lg-6 col-md-6"
                      >
                        <label class="form-label">Contact Number:</label>
                        <input
                          v-model="userForm.contactNumber"
                          type="tel"
                          class="form-control"
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeUserModal"
              >
                <i class="bi bi-x-circle me-2" />Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="saving"
                form="user-form"
              >
                <span
                  v-if="saving"
                  class="spinner-border spinner-border-sm me-2"
                />
                <i
                  v-else
                  class="bi bi-check-circle me-2"
                />
                {{ saving ? 'Saving...' : (isEditing ? 'Update User' : 'Create User') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Backdrop -->
      <div
        v-if="showUserModal"
        class="modal-backdrop fade show"
      />

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
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import AppSpinner from '@/components/ui/base/AppSpinner.vue'
import AppPagination from '@/components/ui/base/AppPagination.vue'
import AppModal from '@/components/ui/base/AppModal.vue'
import api from '@/services/api'
import { listUsers as apiListUsers, createUser as apiCreateUser, updateUser as apiUpdateUser, deleteUser as apiDeleteUser, getUser as apiGetUser, restoreUser as apiRestoreUser, resetPassword as apiResetPassword } from '@/services/users'
import DateInput from '@/components/ui/form/DateInput.vue'
import { formatPHDateTime, utcToPH } from '@/utils/dateUtils'
import { useToast } from '@/composables/useToast'

// Backend-driven; remove mock data

// Reactive data
const users = ref([])
const recentActivity = ref([])
const loading = ref(false)
const saving = ref(false)
// Date picker ref
const datePickerBirthdate = ref(null)
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

// Modal states
const showUserModal = ref(false)
const showDeleteModal = ref(false)
const showPasswordModal = ref(false)
const isEditing = ref(false)
const userToDelete = ref(null)
const userToResetPassword = ref(null)
const newPassword = ref('')
const { addToast } = useToast()

// Form data
const userForm = ref({
  id: '',
  firstName: '',
  lastName: '',
  middleName: '',
  userIdentifier: '',
  role: '',
  hwType: '',
  status: 'active',
  password: '',
  licenseNumber: '',
  employeeId: '',
  contactNumber: '',
  sex: '',
  birthdate: '',
  address: ''
})

// Max birthdate: today in ISO format (YYYY-MM-DD)
const maxBirthdate = computed(() => {
  const today = new Date()
  const phTime = new Date(today.toLocaleString('en-PH', { timeZone: 'Asia/Manila' }))
  const yyyy = phTime.getFullYear()
  const mm = String(phTime.getMonth() + 1).padStart(2, '0')
  const dd = String(phTime.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
})

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
    // Fetch all active users to count by role
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
    // When "Show Archived" is ON, request only archived users.
    // Otherwise, request all non-archived (active + inactive).
    const status = showDeleted.value ? 'archived' : 'not_archived'
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
        // Frontend-controlled PH timezone display for last login
        lastLoginDisplay: rawLast ? formatDatePH(rawLast) : 'Never'
      }
    })
    // Sort so inactive users appear at the end (but remain visible), preserving numeric id order otherwise
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

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page
    fetchUsers()
  }
}

const openUserModal = async (user = null) => {
  if (user) {
    isEditing.value = true
    try {
      const full = await apiGetUser(user.id)
      userForm.value = {
        id: full.user_id || user.id,
        firstName: full.firstname || user.firstName || '',
        lastName: full.surname || user.lastName || '',
        middleName: full.middlename || user.middleName || '',
        userIdentifier: full.username || full.email || '',
        role: mapBackendRoleToOption(full.role || user.role || ''),
        hwType: full.hw_type || '',
        status: full.is_deleted ? 'archived' : (full.status || user.status || 'active'),
        password: '',
        licenseNumber: full.professional_license_no || user.licenseNumber || '',
        employeeId: full.employee_id || user.employeeId || '',
        phoneNumber: full.contact_number || user.phone || '',
        contactNumber: full.contact_number || user.contactNumber || '',
        sex: full.sex || user.sex || '',
        birthdate: formatForInput(full.birthdate || user.birthdate) || '',
        address: full.address || user.address || ''
      }
    } catch (e) {
      console.error('Failed to fetch full user details', e)
      // Fallback to provided user object
      userForm.value = {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        userIdentifier: user.username || user.email || '',
        hwType: user.hwType || '',
        status: user.status,
        password: '',
        licenseNumber: user.licenseNumber || '',
        employeeId: user.employeeId || '',
        contactNumber: user.contactNumber || user.phone || '',
        sex: user.sex || '',
        birthdate: user.birthdate || '',
        address: user.address || ''
      }
    }
  } else {
    isEditing.value = false
    userForm.value = {
      id: '',
      firstName: '',
      lastName: '',
      middleName: '',
      userIdentifier: '',
      role: '',
      hwType: '',
      status: 'active',
      password: '',
      licenseNumber: '',
      employeeId: '',
      contactNumber: '',
      sex: '',
      birthdate: '',
      address: ''
    }
  }
  showUserModal.value = true
}

const closeUserModal = () => {
  showUserModal.value = false
  userForm.value = {
    id: '',
    firstName: '',
    lastName: '',
    middleName: '',
    userIdentifier: '',
    role: '',
    hwType: '',
    status: 'active',
    password: '',
    licenseNumber: '',
    employeeId: '',
    contactNumber: '',
    sex: '',
    birthdate: '',
    address: ''
  }
}

const saveUser = async () => {
  saving.value = true
  try {
    // Detect if userIdentifier is email or username
    let username = ''
    let email = ''
    if (userForm.value.userIdentifier.includes('@')) {
      // User entered an email - use it as-is, extract username from before @
      email = userForm.value.userIdentifier
      username = userForm.value.userIdentifier.split('@')[0]
    } else {
      // User entered a username - append @immunizeme.com to create email
      username = userForm.value.userIdentifier
      email = `${userForm.value.userIdentifier}@immunizeme.com`
    }

    const payload = {
      username: username,
      email: email,
      role: userForm.value.role,
      firstname: userForm.value.firstName,
      middlename: userForm.value.middleName || null,
      surname: userForm.value.lastName,
      password: userForm.value.password,
      contact_number: userForm.value.contactNumber || null,
      status: userForm.value.status,
      sex: userForm.value.sex || 'Other',
      birthdate: convertToISODate(userForm.value.birthdate) || userForm.value.birthdate || null,
      address: userForm.value.address || null,
      professional_license_no: (userForm.value.role === 'health_worker' || userForm.value.role === 'admin') ? (userForm.value.licenseNumber || null) : null,
      // employee_id is autogenerated for admin and health_worker roles when creating new users
      ...(isEditing.value || userForm.value.role !== 'admin' && userForm.value.role !== 'health_worker' ? { employee_id: userForm.value.employeeId || null } : {})
    }
    if (userForm.value.role === 'health_worker') {
      payload.hw_type = userForm.value.hwType || null
      // if bhw, remove license
      if (payload.hw_type === 'bhs') {
        payload.professional_license_no = null
      }
    } else {
      payload.hw_type = null
    }
    if (isEditing.value) {
      await apiUpdateUser(userForm.value.id, payload)
    } else {
      await apiCreateUser(payload)
    }
    closeUserModal()
    await fetchUserStats()
    await fetchUsers()
    await fetchRecentActivity()
    addToast({
      title: 'Success',
      message: isEditing.value ? 'User updated successfully!' : 'User created successfully!',
      type: 'success'
    })
  } catch (error) {
    console.error('Error saving user:', error)
    const data = error?.response?.data
    let msg = 'Error saving user. Please try again.'
    if (data) {
      if (typeof data.error === 'string') msg = data.error
      else if (typeof data.message === 'string') msg = data.message
      else if (data.error?.message) msg = data.error.message
      else if (data.message?.message) msg = data.message.message
      else msg = JSON.stringify(data)
    } else if (error?.message) {
      msg = error.message
    }
    addToast({ title: 'Error', message: msg || 'Error saving user.', type: 'error' })
  } finally {
    saving.value = false
  }
}

const confirmDeleteUser = (user) => {
  // Prevent deletes with clear feedback rather than disabling the button
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
}

const updatePassword = async () => {
  if (!userToResetPassword.value || !newPassword.value) return
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
  if (r === 'parent' || r === 'guardian') return 'role-parent'
  if (r === 'health_worker' || r === 'healthstaff' || r === 'health_staff') return 'role-healthstaff'
  return 'role-healthstaff'
}

const getRoleDisplayName = (role) => {
  switch (role) {
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

// Date formatting and validation methods
const formatForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${yyyy}`
}

const _validateAndFormatDate = (fieldName) => {
  if (!userForm.value[fieldName]) return
  
  // Handle various input formats and convert to MM/DD/YYYY
  const dateStr = userForm.value[fieldName].trim()
  let date = null
  
  // Try parsing MM/DD/YYYY format
  if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [month, day, year] = dateStr.split('/')
    date = new Date(year, month - 1, day)
  }
  // Try parsing DD/MM/YYYY format (convert to MM/DD/YYYY)
  else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const parts = dateStr.split('/')
    // Assume DD/MM/YYYY if day > 12 or month <= 12
    if (parseInt(parts[0]) > 12 || parseInt(parts[1]) <= 12) {
      const [day, month, year] = parts
      date = new Date(year, month - 1, day)
    }
  }
  // Try parsing YYYY-MM-DD format
  else if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    date = new Date(dateStr)
  }
  
  if (date && !isNaN(date.getTime())) {
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const yyyy = date.getFullYear()
    userForm.value[fieldName] = `${mm}/${dd}/${yyyy}`
  }
}

const _openDatePicker = (fieldName) => {
  const datePickerEl = datePickerBirthdate.value
  if (datePickerEl) {
    // Set the current value in ISO format for the date picker
    const isoDate = convertToISODate(userForm.value[fieldName])
    if (isoDate) {
      datePickerEl.value = isoDate
    }
    // Trigger the date picker
    datePickerEl.showPicker()
  }
}

const _onDatePickerChange = (fieldName, event) => {
  const isoDate = event.target.value
  if (isoDate) {
    // Convert from ISO (YYYY-MM-DD) to MM/DD/YYYY for display
    const phDate = utcToPH(isoDate + 'T00:00:00Z')
    const mm = String(phDate.month() + 1).padStart(2, '0')
    const dd = String(phDate.date()).padStart(2, '0')
    const yyyy = phDate.year()
    userForm.value[fieldName] = `${mm}/${dd}/${yyyy}`
  }
}

const convertToISODate = (mmddyyyy) => {
  if (!mmddyyyy) return null
  const [month, day, year] = mmddyyyy.split('/')
  if (!month || !day || !year) return null
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

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
</style>
