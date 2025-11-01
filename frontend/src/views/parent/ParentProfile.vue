<template>
  <ParentLayout>
    <div class="profile-container">
      <div class="profile-header">
        <div class="profile-avatar">
          <i class="bi bi-person-circle"></i>
        </div>
        <h4 class="profile-name">{{ userName || 'Parent' }}</h4>
        <p class="profile-role">Parent Account</p>
      </div>

      <div class="profile-content">
        <div class="info-section">
          <h6 class="section-title">Account Information</h6>
          <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">{{ userEmail || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Phone:</span>
            <span class="info-value">{{ userPhone || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Alt. Phone:</span>
            <span class="info-value">{{ altPhone || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Occupation:</span>
            <span class="info-value">{{ guardianOccupation || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Member Since:</span>
            <span class="info-value">{{ memberSince || 'N/A' }}</span>
          </div>
        </div>

        <div class="actions-section">
          <button class="btn btn-outline-primary w-100 mb-2" @click="openEdit">
            <i class="bi bi-pencil me-2"></i>Edit Profile
          </button>
          <button class="btn btn-outline-secondary w-100 mb-2" @click="openChangePwd">
            <i class="bi bi-key me-2"></i>Change Password
          </button>
          <button class="btn btn-outline-danger w-100" @click="logout">
            <i class="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </div>
      </div>

      <!-- Edit Profile Modal -->
      <div class="modal fade show" tabindex="-1" style="display: block;" v-if="showEdit">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Profile</h5>
              <button type="button" class="btn-close" @click="closeEdit"></button>
            </div>
            <div class="modal-body">
              <div class="row g-2">
                <div class="col-6">
                  <label class="form-label">First Name</label>
                  <input v-model="form.firstname" type="text" class="form-control" />
                </div>
                <div class="col-6">
                  <label class="form-label">Last Name</label>
                  <input v-model="form.surname" type="text" class="form-control" />
                </div>
                <div class="col-12">
                  <label class="form-label">Middle Name</label>
                  <input v-model="form.middlename" type="text" class="form-control" />
                </div>
                <div class="col-12">
                  <label class="form-label">Email</label>
                  <input v-model="form.email" type="email" class="form-control" />
                </div>
                <div class="col-12">
                  <label class="form-label">Phone</label>
                  <input v-model="form.contact_number" type="tel" class="form-control" />
                </div>
                <div class="col-12">
                  <label class="form-label">Alternative Phone</label>
                  <input v-model="form.alternative_contact_number" type="tel" class="form-control" />
                </div>
                <div class="col-12">
                  <label class="form-label">Occupation</label>
                  <input v-model="form.occupation" type="text" class="form-control" />
                </div>
                <div class="col-12">
                  <label class="form-label">Address</label>
                  <input v-model="form.address" type="text" class="form-control" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeEdit">Cancel</button>
              <button class="btn btn-primary" :disabled="saving" @click="saveEdit">
                <i v-if="saving" class="bi bi-hourglass-split fa-spin me-1"></i>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showEdit" class="modal-backdrop fade show"></div>

      <!-- Change Password Modal -->
      <div class="modal fade show" tabindex="-1" style="display: block;" v-if="showPwd">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Change Password</h5>
              <button type="button" class="btn-close" @click="closeChangePwd"></button>
            </div>
            <div class="modal-body">
              <div class="mb-2">
                <label class="form-label">Current Password</label>
                <input v-model="pwd.current" type="password" class="form-control" />
              </div>
              <div class="mb-2">
                <label class="form-label">New Password</label>
                <input v-model="pwd.next" type="password" class="form-control" />
                <small class="text-muted">Minimum 8 characters</small>
              </div>
              <div class="mb-2">
                <label class="form-label">Confirm New Password</label>
                <input v-model="pwd.confirm" type="password" class="form-control" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeChangePwd">Cancel</button>
              <button class="btn btn-primary" :disabled="changingPwd" @click="saveChangePwd">
                <i v-if="changingPwd" class="bi bi-hourglass-split fa-spin me-1"></i>
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showPwd" class="modal-backdrop fade show"></div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const router = useRouter()
const { userInfo, logout: authLogout, updateUserInfo } = useAuth()
const { addToast } = useToast()

// Edit profile modal state
const showEdit = ref(false)
const saving = ref(false)
const form = ref({
  firstname: '',
  middlename: '',
  surname: '',
  email: '',
  contact_number: '',
  alternative_contact_number: '',
  occupation: '',
  address: ''
})

// Guardian profile (includes occupation and alternative_contact_number)
const guardian = ref(null)

const loadGuardian = async () => {
  try {
    const { data } = await api.get('/parent/profile')
    const g = data?.data || data
    guardian.value = g || null
  } catch (e) {
    // Non-blocking for page
    console.warn('Failed to load guardian profile:', e?.message || e)
  }
}

const openEdit = () => {
  const u = userInfo.value || {}
  form.value = {
    firstname: u.firstname || u.first_name || '',
    middlename: u.middlename || u.middle_name || '',
    surname: u.surname || u.last_name || '',
    email: u.email || '',
    contact_number: u.contact_number || u.phone || '',
    alternative_contact_number: guardian.value?.alternative_contact_number || '',
    occupation: guardian.value?.occupation || '',
    address: u.address || ''
  }
  showEdit.value = true
}
const closeEdit = () => { showEdit.value = false }

const saveEdit = async () => {
  try {
    saving.value = true
    const payload = { ...form.value }
    await api.put('/parent/profile', payload)
    // Merge into local userInfo for immediate UI reflection
    const merged = { ...(userInfo.value || {}), ...payload }
    updateUserInfo(merged)
    // Refresh guardian fields for display
    await loadGuardian()
    addToast({ title: 'Saved', message: 'Profile updated successfully', type: 'success' })
    showEdit.value = false
  } catch (e) {
    console.error('Failed to update profile', e)
    addToast({ title: 'Error', message: 'Failed to update profile', type: 'error' })
  } finally {
    saving.value = false
  }
}

// Change password modal state
const showPwd = ref(false)
const changingPwd = ref(false)
const pwd = ref({ current: '', next: '', confirm: '' })
const openChangePwd = () => { showPwd.value = true }
const closeChangePwd = () => { showPwd.value = false; pwd.value = { current: '', next: '', confirm: '' } }

const saveChangePwd = async () => {
  const { current, next, confirm } = pwd.value
  if (!current || !next || !confirm) {
    return addToast({ title: 'Incomplete', message: 'Please fill in all password fields', type: 'warning' })
  }
  if (next !== confirm) {
    return addToast({ title: 'Mismatch', message: 'New passwords do not match', type: 'warning' })
  }
  if (String(next).length < 8) {
    return addToast({ title: 'Weak password', message: 'New password must be at least 8 characters', type: 'warning' })
  }
  try {
    changingPwd.value = true
    // Directly use the stable users reset-password endpoint (skip /auth route entirely)
    const uid = userInfo.value?.user_id || userInfo.value?.id
    if (!uid) throw new Error('Missing user id')
    await api.post(`/users/${uid}/reset-password`, { newPassword: next })
    addToast({ title: 'Success', message: 'Password changed successfully', type: 'success' })
    return closeChangePwd()
  } catch (e) {
    console.error('Failed to change password', e)
    const msg = e?.response?.data?.message || e?.message || 'Failed to change password'
    addToast({ title: 'Error', message: msg, type: 'error' })
  } finally {
    changingPwd.value = false
  }
}

const userName = computed(() => {
  if (userInfo.value) {
    if (userInfo.value.full_name) return userInfo.value.full_name
    if (userInfo.value.name) return userInfo.value.name
    if (userInfo.value.firstname && userInfo.value.lastname) {
      return `${userInfo.value.firstname} ${userInfo.value.lastname}`
    }
  }
  return null
})

const userEmail = computed(() => {
  return userInfo.value?.email || null
})

const userPhone = computed(() => {
  return userInfo.value?.phone || userInfo.value?.contact_number || null
})

const altPhone = computed(() => guardian.value?.alternative_contact_number || '')
const guardianOccupation = computed(() => guardian.value?.occupation || '')

const memberSince = computed(() => {
  if (userInfo.value?.created_at) {
    const date = new Date(userInfo.value.created_at)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  return null
})

const logout = () => {
  authLogout()
  router.push('/auth/login')
}

onMounted(() => {
  loadGuardian()
})
</script>

<style scoped>
.profile-container {
  padding: 1rem;
  min-height: calc(100vh - 56px - 70px);
}

.profile-header {
  text-align: center;
  padding: 2rem 1rem;
  background: #007bff;
  color: white;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.profile-avatar {
  margin-bottom: 1rem;
}

.profile-avatar i {
  font-size: 4rem;
  opacity: 0.9;
}

.profile-name {
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.profile-role {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.profile-content {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.info-section {
  margin-bottom: 2rem;
}

.section-title {
  margin-bottom: 1rem;
  font-weight: 600;
  color: #333;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f1f3f4;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f3f4;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #6c757d;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.actions-section {
  margin-top: 1.5rem;
}

@media (max-width: 576px) {
  .profile-container {
    padding: 0.75rem;
  }

  .profile-header {
    padding: 1.5rem 1rem;
  }

  .profile-avatar i {
    font-size: 3rem;
  }

  .profile-content {
    padding: 1rem;
  }
}
</style>
