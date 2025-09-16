<template>
  <AdminLayout>
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">User Accounts</h1>
          <p class="text-muted mb-0">Manage system users and permissions</p>
        </div>
        <button class="btn btn-primary" @click="openUserModal()">
          <i class="bi bi-plus-circle me-2"></i>Add New User
        </button>
      </div>

        <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading users...</span>
        </div>
      </div>

      <!-- User Stats -->
      <div v-else class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Users
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ userStats.total }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-people text-primary" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Health Workers
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ userStats.health_workers }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-person-badge text-success" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Parents
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ userStats.parents }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-person-vcard text-info" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Admins
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ userStats.admins }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-person-lock text-warning" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Management -->
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <h6 class="m-0 font-weight-bold text-primary me-4">User List</h6>
            <div class="btn-group btn-group-sm">
              <button 
                class="btn btn-outline-primary"
                :class="{ active: activeFilter === 'all' }"
                @click="setFilter('all')"
              >All</button>
              <button 
                class="btn btn-outline-primary"
                :class="{ active: activeFilter === 'admin' }"
                @click="setFilter('admin')"
              >Admins</button>
              <button 
                class="btn btn-outline-primary"
                :class="{ active: activeFilter === 'health_worker' }"
                @click="setFilter('health_worker')"
              >Health Workers</button>
              <button 
                class="btn btn-outline-primary"
                :class="{ active: activeFilter === 'parent' }"
                @click="setFilter('parent')"
              >Parents</button>
            </div>
          </div>
          <div class="input-group w-25">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search users..."
              v-model="searchQuery"
              @input="handleSearch"
            >
            <button class="btn btn-primary" type="button">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <AppSpinner v-if="loading" />
          <div v-else class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="badge" :class="getRoleBadgeClass(user.role)">
                      {{ getRoleDisplayName(user.role) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="user.status === 'active' ? 'bg-success' : 'bg-secondary'">
                      {{ user.status }}
                    </span>
                  </td>
                  <td>{{ formatDate(user.lastLogin) }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click="editUser(user)" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-secondary" @click="resetPassword(user)" title="Reset Password">
                        <i class="bi bi-key"></i>
                      </button>
                      <button 
                        class="btn btn-outline-danger" 
                        @click="confirmDeleteUser(user)"
                        title="Delete"
                        :disabled="user.role === 'admin' && user.id === currentUserId"
                      >
                        <i class="bi bi-person-x"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="users.length === 0" class="text-center py-4">
              <i class="bi bi-person-x text-muted" style="font-size: 3rem;"></i>
              <p class="text-muted mt-2">No users found</p>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <AppPagination
            :currentPage="currentPage"
            :totalPages="totalPages"
            :totalItems="totalItems"
            :itemsPerPage="itemsPerPage"
            @page-changed="goToPage"
          />
        </div>
      </div>

      <!-- User Activity Log -->
      <div class="card shadow">
        <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">Recent Activity</h6>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="activity in recentActivity" :key="activity.id">
                  <td>{{ formatDate(activity.timestamp) }}</td>
                  <td>{{ activity.userName }}</td>
                  <td>{{ activity.action }}</td>
                  <td>{{ activity.ipAddress }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- User Modal -->
      <AppModal
        :show="showUserModal"
        :title="isEditing ? 'Edit User' : 'Add New User'"
        @close="closeUserModal"
      >
        <form @submit.prevent="saveUser">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">First Name *</label>
              <input
                type="text"
                class="form-control"
                v-model="userForm.firstName"
                required
              >
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Last Name *</label>
              <input
                type="text"
                class="form-control"
                v-model="userForm.lastName"
                required
              >
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Email Address *</label>
            <input
              type="email"
              class="form-control"
              v-model="userForm.email"
              required
            >
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Role *</label>
              <select class="form-select" v-model="userForm.role" required>
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="health_worker">Health Worker</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Status</label>
              <select class="form-select" v-model="userForm.status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div class="mb-3" v-if="!isEditing">
            <label class="form-label">Password *</label>
            <input
              type="password"
              class="form-control"
              v-model="userForm.password"
              :required="!isEditing"
            >
          </div>
          <div class="mb-3" v-if="userForm.role === 'health_worker'">
            <label class="form-label">License Number</label>
            <input
              type="text"
              class="form-control"
              v-model="userForm.licenseNumber"
            >
          </div>
          <div class="mb-3" v-if="userForm.role === 'parent'">
            <label class="form-label">Phone Number</label>
            <input
              type="tel"
              class="form-control"
              v-model="userForm.phoneNumber"
            >
          </div>
        </form>
        
        <!-- Modal Footer -->
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button class="btn btn-secondary" @click="closeUserModal">Cancel</button>
          <button class="btn btn-primary" @click="saveUser" :disabled="saving">
            <i class="bi bi-save me-1"></i>
            {{ saving ? 'Saving...' : (isEditing ? 'Update User' : 'Create User') }}
          </button>
        </div>
      </AppModal>

      <!-- Delete Confirmation Modal -->
      <AppModal
        :show="showDeleteModal"
        title="Confirm Delete"
        @close="closeDeleteModal"
      >
        <p>Are you sure you want to delete the user "{{ userToDelete?.name }}"?</p>
        <p class="text-danger small">This action cannot be undone.</p>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button class="btn btn-secondary" @click="closeDeleteModal">Cancel</button>
          <button class="btn btn-danger" @click="deleteUser" :disabled="deleting">
            <i class="bi bi-trash me-1"></i>
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
            type="password"
            class="form-control"
            v-model="newPassword"
            placeholder="Enter new password"
          >
        </div>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button class="btn btn-secondary" @click="closePasswordModal">Cancel</button>
          <button class="btn btn-primary" @click="updatePassword" :disabled="resettingPassword">
            <i class="bi bi-key me-1"></i>
            {{ resettingPassword ? 'Resetting...' : 'Reset Password' }}
          </button>
        </div>
      </AppModal>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import AppModal from '@/components/common/AppModal.vue'
import api from '@/services/api'

// Mock data to simulate backend
const allMockUsers = [
  {
    id: "1",
    firstName: "Admin",
    lastName: "User",
    name: "Admin User",
    email: "admin@immunizeme.com",
    role: "admin",
    status: "active",
    lastLogin: "2025-01-26T09:45:00Z",
    phone: "+63 917 123 4567"
  },
  {
    id: "2", 
    firstName: "Jane",
    lastName: "Smith",
    name: "Dr. Jane Smith",
    email: "jane.smith@immunizeme.com",
    role: "health_worker",
    status: "active",
    lastLogin: "2025-01-26T08:30:00Z",
    phone: "+63 918 234 5678",
    licenseNumber: "HW-12345"
  },
  {
    id: "3",
    firstName: "Mark",
    lastName: "Rodriguez",
    name: "Dr. Mark Rodriguez",
    email: "mark.rodriguez@immunizeme.com",
    role: "health_worker", 
    status: "active",
    lastLogin: "2025-01-25T14:20:00Z",
    phone: "+63 919 345 6789",
    licenseNumber: "HW-67890"
  },
  {
    id: "4",
    firstName: "Ana Maria",
    lastName: "Santos",
    name: "Ana Maria Santos",
    email: "ana.santos@example.com",
    role: "parent",
    status: "active",
    lastLogin: "2025-01-24T16:15:00Z",
    phone: "+63 917 123 4567"
  },
  {
    id: "5",
    firstName: "Roberto",
    lastName: "Santos", 
    name: "Roberto C. Santos", 
    email: "roberto.santos@example.com",
    role: "parent",
    status: "active",
    lastLogin: "2025-01-23T12:45:00Z",
    phone: "+63 919 876 5432"
  },
  {
    id: "6",
    firstName: "Carmen",
    lastName: "Reyes",
    name: "Carmen L. Reyes",
    email: "carmen.reyes@example.com", 
    role: "parent",
    status: "inactive",
    lastLogin: "2025-01-05T15:15:00Z",
    phone: "+63 916 555 7777"
  },
  {
    id: "7",
    firstName: "Sarah",
    lastName: "Lopez",
    name: "Dr. Sarah Lopez",
    email: "sarah.lopez@immunizeme.com",
    role: "health_worker",
    status: "active",
    lastLogin: "2025-01-26T07:30:00Z",
    phone: "+63 920 111 2222",
    licenseNumber: "HW-11111"
  },
  {
    id: "8",
    firstName: "Lisa",
    lastName: "Fernandez",
    name: "Nurse Lisa Fernandez",
    email: "lisa.fernandez@immunizeme.com",
    role: "health_worker",
    status: "active",
    lastLogin: "2025-01-25T16:00:00Z",
    phone: "+63 921 222 3333",
    licenseNumber: "HW-22222"
  },
  {
    id: "9",
    firstName: "Miguel",
    lastName: "Reyes",
    name: "Miguel A. Reyes",
    email: "miguel.reyes@example.com",
    role: "parent",
    status: "active", 
    lastLogin: "2025-01-22T10:30:00Z",
    phone: "+63 918 222 1111"
  },
  {
    id: "10",
    firstName: "Elena",
    lastName: "Cruz",
    name: "Elena Cruz",
    email: "elena.cruz@example.com",
    role: "parent",
    status: "active",
    lastLogin: "2025-01-21T14:20:00Z",
    phone: "+63 917 333 4444"
  },
  {
    id: "11",
    firstName: "Carlos",
    lastName: "Mendoza",
    name: "Dr. Carlos Mendoza",
    email: "carlos.mendoza@immunizeme.com",
    role: "health_worker",
    status: "active",
    lastLogin: "2025-01-26T06:45:00Z",
    phone: "+63 922 444 5555",
    licenseNumber: "HW-33333"
  },
  {
    id: "12",
    firstName: "Maria",
    lastName: "Garcia",
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    role: "parent",
    status: "inactive",
    lastLogin: "2025-01-10T11:30:00Z",
    phone: "+63 919 666 7777"
  }
]

// Reactive data
const users = ref([])
const recentActivity = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const resettingPassword = ref(false)
const searchQuery = ref('')
const activeFilter = ref('all')
const currentUserId = ref('1') // This would come from auth context

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

// Form data
const userForm = ref({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  status: 'active',
  password: '',
  licenseNumber: '',
  phoneNumber: ''
})

// Computed properties
const userStats = computed(() => {
  return {
    total: totalItems.value,
    admins: allMockUsers.filter(u => u.role === 'admin').length,
    healthWorkers: allMockUsers.filter(u => u.role === 'health_worker').length,
    parents: allMockUsers.filter(u => u.role === 'parent').length
  }
})

// Methods
const fetchUsers = async () => {
  loading.value = true
  try {
    // Simulate API call with mock data
    await new Promise(resolve => setTimeout(resolve, 300)) // Simulate network delay
    
    let filteredUsers = [...allMockUsers]
    
    // Apply role filter
    if (activeFilter.value !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === activeFilter.value)
    }

    // Apply search filter
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      )
    }

    // Calculate pagination
    totalItems.value = filteredUsers.length
    totalPages.value = Math.ceil(totalItems.value / itemsPerPage)
    
    // Ensure current page is valid
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = totalPages.value
    }
    if (currentPage.value < 1) {
      currentPage.value = 1
    }
    
    // Get current page items
    const startIndex = (currentPage.value - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    users.value = filteredUsers.slice(startIndex, endIndex)
    
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
    // Mock data for demo
    recentActivity.value = [
      {
        id: 1,
        timestamp: new Date('2025-01-26T09:45:00'),
        userName: 'Admin User',
        action: 'Logged in',
        ipAddress: '192.168.1.1'
      },
      {
        id: 2,
        timestamp: new Date('2025-01-26T09:30:00'),
        userName: 'Dr. Smith',
        action: 'Updated patient record',
        ipAddress: '192.168.1.5'
      },
      {
        id: 3,
        timestamp: new Date('2025-01-26T09:15:00'),
        userName: 'Dr. Wilson',
        action: 'Registered new vaccination',
        ipAddress: '192.168.1.10'
      }
    ]
  } catch (error) {
    console.error('Error fetching activity:', error)
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

const openUserModal = (user = null) => {
  if (user) {
    isEditing.value = true
    userForm.value = {
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
      status: user.status,
      password: '',
      licenseNumber: user.licenseNumber || '',
      phoneNumber: user.phone || ''
    }
  } else {
    isEditing.value = false
    userForm.value = {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      status: 'active',
      password: '',
      licenseNumber: '',
      phoneNumber: ''
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
    email: '',
    role: '',
    status: 'active',
    password: '',
    licenseNumber: '',
    phoneNumber: ''
  }
}

const saveUser = async () => {
  saving.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const userData = {
      id: isEditing.value ? userForm.value.id : String(allMockUsers.length + 1),
      firstName: userForm.value.firstName,
      lastName: userForm.value.lastName,
      name: `${userForm.value.firstName} ${userForm.value.lastName}`,
      email: userForm.value.email,
      role: userForm.value.role,
      status: userForm.value.status,
      lastLogin: new Date().toISOString(),
      phone: userForm.value.phoneNumber,
      licenseNumber: userForm.value.licenseNumber
    }

    if (isEditing.value) {
      // Update existing user in mock data
      const index = allMockUsers.findIndex(u => u.id === userForm.value.id)
      if (index !== -1) {
        allMockUsers[index] = { ...allMockUsers[index], ...userData }
      }
    } else {
      // Add new user to mock data
      allMockUsers.push(userData)
    }
    
    closeUserModal()
    await fetchUsers() // Refresh the current page
    alert(isEditing.value ? 'User updated successfully!' : 'User created successfully!')
  } catch (error) {
    console.error('Error saving user:', error)
    alert('Error saving user. Please try again.')
  } finally {
    saving.value = false
  }
}

const editUser = (user) => {
  openUserModal(user)
}

const confirmDeleteUser = (user) => {
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Remove from mock data
    const index = allMockUsers.findIndex(u => u.id === userToDelete.value.id)
    if (index !== -1) {
      allMockUsers.splice(index, 1)
    }
    
    closeDeleteModal()
    await fetchUsers() // Refresh the current page
    alert('User deleted successfully!')
  } catch (error) {
    console.error('Error deleting user:', error)
    alert('Error deleting user. Please try again.')
  } finally {
    deleting.value = false
  }
}

const resetPassword = (user) => {
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))
    
    closePasswordModal()
    alert('Password reset successfully!')
  } catch (error) {
    console.error('Error resetting password:', error)
    alert('Error resetting password. Please try again.')
  } finally {
    resettingPassword.value = false
  }
}

const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'admin': return 'bg-warning text-dark'
    case 'health_worker': return 'bg-success'
    case 'parent': return 'bg-info text-dark'
    default: return 'bg-secondary'
  }
}

const getRoleDisplayName = (role) => {
  switch (role) {
    case 'health_worker': return 'Health Worker'
    case 'parent': return 'Parent'
    case 'admin': return 'Admin'
    default: return role
  }
}

const formatDate = (date) => {
  if (!date) return 'Never'
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  fetchUsers()
  fetchRecentActivity()
})
</script>
