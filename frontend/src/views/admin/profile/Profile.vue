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
            Profile
          </li>
        </ol>
      </nav>

      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-person-circle me-2" />Profile Settings
          </h1>
          <p class="text-muted mb-0">
            Manage your account information and preferences
          </p>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-primary"
            @click="editMode = !editMode"
          >
            <i class="bi bi-pencil me-2" />{{ editMode ? 'Cancel Edit' : 'Edit Profile' }}
          </button>
          <button
            v-if="editMode"
            class="btn btn-primary"
            :disabled="saving"
            @click="saveProfile"
          >
            <span
              v-if="saving"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-check-circle me-2"
            />
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Profile Overview -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-start border-primary border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-primary text-uppercase mb-1">
                    Account Status
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ profile.status || 'Active' }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-shield-check text-primary"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-success border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-success text-uppercase mb-1">
                    Member Since
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ formatMemberSince(profile.createdAt) }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-calendar-check text-success"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-info border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-info text-uppercase mb-1">
                    Last Login
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ formatLastLogin(profile.lastLogin) }}
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-clock text-info"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-start border-warning border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col me-2">
                  <div class="text-xs fw-bold text-warning text-uppercase mb-1">
                    Profile Score
                  </div>
                  <div class="h5 mb-0 fw-bold text-gray-800">
                    {{ profileCompleteness }}%
                  </div>
                </div>
                <div class="col-auto">
                  <i
                    class="bi bi-graph-up text-warning"
                    style="font-size: 2rem;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Information -->
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 fw-bold text-primary">
            <i class="bi bi-person-circle me-2" />
            Personal Information
          </h6>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <!-- Profile Picture -->
            <div class="col-md-12 text-center mb-4">
              <div class="position-relative d-inline-block">
                <img 
                  :src="profile.avatar || '/default-avatar.png'" 
                  alt="Profile Picture" 
                  class="rounded-circle border shadow"
                  style="width: 120px; height: 120px; object-fit: cover;"
                >
                <button 
                  v-if="editMode" 
                  class="btn btn-primary btn-sm position-absolute bottom-0 end-0 rounded-circle"
                  style="width: 35px; height: 35px;"
                  title="Change Profile Picture"
                  @click="$refs.fileInput.click()"
                >
                  <i class="bi bi-camera" />
                </button>
                <input 
                  ref="fileInput" 
                  type="file" 
                  class="d-none" 
                  accept="image/*" 
                  @change="handleAvatarChange"
                >
              </div>
            </div>

            <!-- Basic Information -->
            <div class="col-xl-4 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">First Name:</label>
              <input 
                v-model="profileForm.firstName" 
                type="text" 
                class="form-control" 
                :readonly="!editMode"
                :class="{ 'form-control-plaintext border-0': !editMode }"
              >
            </div>
            <div class="col-xl-4 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Middle Name:</label>
              <input 
                v-model="profileForm.middleName" 
                type="text" 
                class="form-control" 
                :readonly="!editMode"
                :class="{ 'form-control-plaintext border-0': !editMode }"
              >
            </div>
            <div class="col-xl-4 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Last Name:</label>
              <input 
                v-model="profileForm.lastName" 
                type="text" 
                class="form-control" 
                :readonly="!editMode"
                :class="{ 'form-control-plaintext border-0': !editMode }"
              >
            </div>
            <div class="col-xl-4 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Email Address:</label>
              <input 
                v-model="profileForm.email" 
                type="email" 
                class="form-control" 
                :readonly="!editMode"
                :class="{ 'form-control-plaintext border-0': !editMode }"
              >
            </div>
            <div class="col-xl-4 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Sex:</label>
              <select 
                v-if="editMode" 
                v-model="profileForm.sex" 
                class="form-select"
                :disabled="!editMode"
              >
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
              <input 
                v-else
                type="text" 
                class="form-control-plaintext border-0" 
                :value="profileForm.sex" 
                readonly
              >
            </div>
            <div class="col-xl-4 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Birthdate:</label>
              <div v-if="editMode">
                <DateInput v-model="profileForm.birthdate" />
              </div>
              <input 
                v-else
                type="text" 
                class="form-control-plaintext border-0" 
                :value="profileForm.birthdate" 
                readonly
              >
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">Address:</label>
              <input 
                v-model="profileForm.address" 
                type="text" 
                class="form-control" 
                :readonly="!editMode"
                :class="{ 'form-control-plaintext border-0': !editMode }"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Professional Information -->
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 fw-bold text-primary">
            <i class="bi bi-briefcase me-2" />
            Professional Information
          </h6>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <div class="col-xl-4 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Role:</label>
              <input 
                type="text" 
                class="form-control-plaintext border-0" 
                :value="getRoleDisplayName(profile.role)" 
                readonly
              >
            </div>
            <div
              v-if="profile.role === 'health_staff' || profile.role === 'HealthStaff'"
              class="col-xl-4 col-lg-6 col-md-6"
            >
              <label class="form-label fw-semibold">Health Staff Type:</label>
              <input 
                type="text" 
                class="form-control-plaintext border-0" 
                :value="getHsTypeDisplayName(profile.hsType || profile.hwType)" 
                readonly
              >
            </div>
            <div class="col-xl-4 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Employee ID:</label>
              <input 
                v-model="profileForm.employeeId" 
                type="text" 
                class="form-control" 
                :readonly="!editMode"
                :class="{ 'form-control-plaintext border-0': !editMode }"
              >
            </div>
            <div
              v-if="profile.role === 'health_staff' || profile.role === 'admin'"
              class="col-xl-6 col-lg-6 col-md-6"
            >
              <label class="form-label fw-semibold">PRC License Number:</label>
              <input 
                v-model="profileForm.licenseNumber" 
                type="text" 
                class="form-control" 
                :readonly="!editMode"
                :class="{ 'form-control-plaintext border-0': !editMode }"
              >
            </div>
            <div class="col-xl-6 col-lg-6 col-md-6">
              <label class="form-label fw-semibold">Contact Number:</label>
              <input 
                v-model="profileForm.contactNumber" 
                type="tel" 
                class="form-control" 
                :readonly="!editMode"
                :class="{ 'form-control-plaintext border-0': !editMode }"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 fw-bold text-primary">
            <i class="bi bi-shield-lock me-2" />
            Security Settings
          </h6>
        </div>
        <div class="card-body">
          <div class="row g-4">
            <div class="col-12">
              <button
                class="btn btn-outline-warning"
                @click="showPasswordModal = true"
              >
                <i class="bi bi-key me-2" />
                Change Password
              </button>
              <small class="text-muted ms-3">Last changed: {{ formatDate(profile.passwordChangedAt) || 'Never' }}</small>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="twoFactorAuth" 
                  v-model="profileForm.twoFactorEnabled" 
                  class="form-check-input" 
                  type="checkbox"
                  :disabled="!editMode"
                >
                <label
                  class="form-check-label"
                  for="twoFactorAuth"
                >
                  Enable Two-Factor Authentication
                </label>
              </div>
            </div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input 
                  id="emailNotifications" 
                  v-model="profileForm.emailNotifications" 
                  class="form-check-input" 
                  type="checkbox"
                  :disabled="!editMode"
                >
                <label
                  class="form-check-label"
                  for="emailNotifications"
                >
                  Receive email notifications
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Change Password Modal -->
      <div
        class="modal fade"
        :class="{ show: showPasswordModal }"
        :style="{ display: showPasswordModal ? 'block' : 'none' }"
        tabindex="-1"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-key me-2" />
                Change Password
              </h5>
              <button
                type="button"
                class="btn-close"
                @click="closePasswordModal"
              />
            </div>
            <div class="modal-body">
              <form @submit.prevent="changePassword">
                <div class="mb-3">
                  <label class="form-label">Current Password:</label>
                  <input 
                    v-model="passwordForm.currentPassword" 
                    type="password" 
                    class="form-control" 
                    required
                  >
                </div>
                <div class="mb-3">
                  <label class="form-label">New Password:</label>
                  <input 
                    v-model="passwordForm.newPassword" 
                    type="password" 
                    class="form-control" 
                    required
                    minlength="8"
                  >
                  <div class="form-text">
                    Password must be at least 8 characters long.
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Confirm New Password:</label>
                  <input 
                    v-model="passwordForm.confirmPassword" 
                    type="password" 
                    class="form-control" 
                    required
                  >
                  <div
                    v-if="passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword"
                    class="text-danger small"
                  >
                    Passwords do not match
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closePasswordModal"
              >
                <i class="bi bi-x-circle me-2" />Cancel
              </button>
              <button 
                type="button" 
                class="btn btn-primary" 
                :disabled="changingPassword || passwordForm.newPassword !== passwordForm.confirmPassword" 
                @click="changePassword"
              >
                <span
                  v-if="changingPassword"
                  class="spinner-border spinner-border-sm me-2"
                />
                <i
                  v-else
                  class="bi bi-check-circle me-2"
                />
                {{ changingPassword ? 'Changing...' : 'Change Password' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Backdrop -->
      <div
        v-if="showPasswordModal"
        class="modal-backdrop fade show"
      />
    </div>
  </AdminLayout>
</template>

<script setup>
import { addToast } from '@/composables/useToast'
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import api from '@/services/api'
import DateInput from '@/components/ui/form/DateInput.vue'

// Reactive data
const loading = ref(true)
const saving = ref(false)
const changingPassword = ref(false)
const editMode = ref(false)
const showPasswordModal = ref(false)

// DateInput handles date selection; no native date refs needed

// Profile data
const profile = ref({
  id: '',
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  role: '',
  hsType: '',
  status: 'Active',
  createdAt: '',
  lastLogin: '',
  avatar: '',
  sex: '',
  birthdate: '',
  address: '',
  employeeId: '',
  licenseNumber: '',
  contactNumber: '',
  twoFactorEnabled: false,
  emailNotifications: true,
  passwordChangedAt: ''
})

const profileForm = ref({ ...profile.value })

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Computed properties
const profileCompleteness = computed(() => {
  const fields = [
    profile.value.firstName,
    profile.value.lastName,
    profile.value.email,
    profile.value.sex,
    profile.value.birthdate,
    profile.value.address,
    profile.value.contactNumber
  ]
  
  if (profile.value.role === 'health_staff' || String(profile.value.role).toLowerCase().includes('health') || profile.value.role === 'admin') {
    fields.push(profile.value.employeeId, profile.value.licenseNumber)
  }
  
  const completedFields = fields.filter(field => field && field.trim() !== '').length
  return Math.round((completedFields / fields.length) * 100)
})

// Methods
const fetchProfile = async () => {
  try {
    loading.value = true
    const response = await api.get('/profile')
    const data = response.data?.data || response.data
    
    profile.value = {
      id: data.user_id || data.id,
      firstName: data.firstname || '',
      lastName: data.surname || '',
      middleName: data.middlename || '',
      email: data.email || '',
      role: data.role || '',
      hsType: data.hs_type || data.hsType || data.hw_type || data.hwType || '',
      status: data.status || 'Active',
      createdAt: data.created_at || data.createdAt || '',
      lastLogin: data.last_login || data.lastLogin || '',
      avatar: data.avatar || '',
      sex: data.sex || '',
      birthdate: formatForInput(data.birthdate) || '',
      address: data.address || '',
      employeeId: data.employee_id || '',
      licenseNumber: data.professional_license_no || '',
      contactNumber: data.contact_number || '',
      twoFactorEnabled: data.two_factor_enabled || false,
      emailNotifications: data.email_notifications !== false,
      passwordChangedAt: data.password_changed_at || ''
    }
    
    profileForm.value = { ...profile.value }
  } catch (error) {
    console.error('Error fetching profile:', error)
    alert('Error loading profile information.')
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  try {
    saving.value = true
    
    const payload = {
      firstname: profileForm.value.firstName,
      surname: profileForm.value.lastName,
      middlename: profileForm.value.middleName,
      email: profileForm.value.email,
      sex: profileForm.value.sex,
      birthdate: convertToISODate(profileForm.value.birthdate) || profileForm.value.birthdate,
      address: profileForm.value.address,
      employee_id: profileForm.value.employeeId,
      professional_license_no: profileForm.value.licenseNumber,
      contact_number: profileForm.value.contactNumber,
      two_factor_enabled: profileForm.value.twoFactorEnabled,
      email_notifications: profileForm.value.emailNotifications
    }
    
    await api.put('/profile', payload)
    
    profile.value = { ...profileForm.value }
    editMode.value = false
    addToast({ title: 'Success', message: 'Profile updated successfully', type: 'success' })
    
  } catch (error) {
    console.error('Error saving profile:', error)
    alert('Error updating profile. Please try again.')
  } finally {
    saving.value = false
  }
}

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('avatar', file)
  
  try {
    const response = await api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    profile.value.avatar = response.data.avatarUrl
    profileForm.value.avatar = response.data.avatarUrl
    alert('Profile picture updated successfully!')
    
  } catch (error) {
    console.error('Error uploading avatar:', error)
    alert('Error uploading profile picture. Please try again.')
  }
}

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('Passwords do not match!')
    return
  }
  
  try {
    changingPassword.value = true
    
    await api.post('/profile/change-password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    
    closePasswordModal()
    addToast({ title: 'Success', message: 'Password changed successfully', type: 'success' })
    
  } catch (error) {
    console.error('Error changing password:', error)
    alert(error.response?.data?.message || 'Error changing password. Please try again.')
  } finally {
    changingPassword.value = false
  }
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

// Date formatting methods
const formatForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${yyyy}`
}

const convertToISODate = (mmddyyyy) => {
  if (!mmddyyyy) return null
  const [month, day, year] = mmddyyyy.split('/')
  if (!month || !day || !year) return null
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatMemberSince = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short'
  })
}

const formatLastLogin = (dateString) => {
  if (!dateString) return 'Never'
  const now = new Date()
  const date = new Date(dateString)
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  return date.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' })
}

const getRoleDisplayName = (role) => {
  const r = String(role || '').toLowerCase()
  if (r.includes('health')) return 'Health Staff'
  if (r === 'parent' || r === 'guardian') return 'Parent'
  if (r === 'admin' || r === 'administrator') return 'Administrator'
  return role || 'Unknown'
}

const getHsTypeDisplayName = (hsType) => {
  switch (hsType) {
    case 'nurse': return 'Nurse'
    case 'nutritionist': return 'Nutritionist'
    case 'bhs': return 'Barangay Health Staff'
    default: return hsType || 'Unknown'
  }
}

// Lifecycle
onMounted(() => {
  fetchProfile()
})
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

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.border-start {
  border-left: 0.25rem solid !important;
}

.text-gray-800 {
  color: #5a5c69 !important;
}

.form-control-plaintext {
  background-color: transparent !important;
}
</style>


