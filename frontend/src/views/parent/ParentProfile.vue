<template>
  <ParentLayout title="My Profile">
    <div class="profile-container">
      <!-- Profile Header -->
      <ProfileHeader 
        :user-info="mergedUserInfo" 
        :role="guardianRole"
      />

      <!-- Profile Menu -->
      <ProfileMenu 
        :menu-items="menuItems"
        @menu-click="handleMenuClick"
      />

      <!-- Footer -->
      <div class="profile-footer">
        <p>ImmunizeMe Parent Portal v1.0.0</p>
      </div>

      <!-- Profile View Modal -->
      <ProfileViewModal
        v-if="showEdit"
        :user-info="mergedUserInfo"
        @close="showEdit = false"
        @edit-form="openEditForm"
        @change-password="openChangePwd"
        @logout="confirmLogout"
      />

      <!-- Edit Profile Form Modal -->
      <EditProfileModal
        v-if="showEditForm"
        :form="form"
        :saving="saving"
        @close="closeEditForm"
        @save="saveEdit"
      />

      <!-- Change Password Modal -->
      <ChangePasswordModal
        v-if="showPwd"
        :changing="changingPwd"
        @close="closeChangePwd"
        @save="saveChangePwd"
      />
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import ProfileHeader from '@/features/parent/profile/components/ProfileHeader.vue'
import ProfileMenu from '@/features/parent/profile/components/ProfileMenu.vue'
import ProfileViewModal from '@/features/parent/profile/components/ProfileViewModal.vue'
import EditProfileModal from '@/features/parent/profile/components/EditProfileModal.vue'
import ChangePasswordModal from '@/features/parent/profile/components/ChangePasswordModal.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import db from '@/services/offline/db'
import api from '@/services/api'

const router = useRouter()
const { userInfo, logout: authLogout, updateUserInfo } = useAuth()
const { addToast } = useToast()

// Menu configuration
const menuItems = [
  {
    id: 'profile',
    title: 'Profile',
    subtitle: 'View and edit your profile information',
    icon: 'bi bi-person'
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'App preferences and configurations',
    icon: 'bi bi-gear'
  },
  {
    id: 'logout',
    title: 'Logout',
    subtitle: 'Sign out of your account',
    icon: 'bi bi-box-arrow-right',
    variant: 'danger'
  }
]

// State
const showEdit = ref(false)
const showEditForm = ref(false)
const showPwd = ref(false)
const saving = ref(false)
const changingPwd = ref(false)
const guardian = ref(null)

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

// Computed
const mergedUserInfo = computed(() => {
  return {
    ...(userInfo.value || {}),
    ...(guardian.value || {})
  }
})

const guardianRole = computed(() => guardian.value?.relationship_type || 'Parent')

// Methods
const loadGuardian = async () => {
  try {
    // Read from local Dexie database (offline-first)
    const profile = await db.guardian_profile.get(1)
    guardian.value = profile || null
  } catch (e) {
    console.warn('Failed to load guardian profile:', e?.message || e)
  }
}

const handleMenuClick = (menuId) => {
  switch (menuId) {
    case 'profile':
      openEdit()
      break
    case 'settings':
      openSettings()
      break
    case 'logout':
      logout()
      break
  }
}

const openEdit = () => {
  const u = userInfo.value || {}
  const g = guardian.value || {}
  form.value = {
    firstname: u.firstname || u.first_name || '',
    middlename: u.middlename || u.middle_name || '',
    surname: u.surname || u.last_name || '',
    email: u.email || '',
    contact_number: u.contact_number || u.phone || '',
    alternative_contact_number: g.alternative_contact_number || '',
    occupation: g.occupation || '',
    address: u.address || ''
  }
  showEdit.value = true
}

const openEditForm = () => {
  showEdit.value = false
  showEditForm.value = true
}

const closeEditForm = () => {
  showEditForm.value = false
  showEdit.value = true
}

const openSettings = () => {
  addToast({ 
    title: 'Settings', 
    message: 'Settings page coming soon', 
    type: 'info' 
  })
}

const confirmLogout = () => {
  showEdit.value = false
  logout()
}

const logout = async () => {
  try {
    await authLogout()
    router.push('/auth/login')
  } catch (error) {
    console.error('Logout error:', error)
    router.push('/auth/login')
  }
}

const saveEdit = async (formData) => {
  try {
    saving.value = true
    await api.put('/parent/profile', formData)
    
    // Update local user info
    const merged = { ...(userInfo.value || {}), ...formData }
    updateUserInfo(merged)
    
    // Refresh guardian data
    await loadGuardian()
    
    addToast({ 
      title: 'Saved', 
      message: 'Profile updated successfully', 
      type: 'success' 
    })
    
    showEditForm.value = false
    showEdit.value = false
  } catch (e) {
    console.error('Failed to update profile', e)
    addToast({ 
      title: 'Error', 
      message: e.response?.data?.message || 'Failed to update profile', 
      type: 'error' 
    })
  } finally {
    saving.value = false
  }
}

const openChangePwd = () => {
  showEdit.value = false
  showPwd.value = true
}

const closeChangePwd = () => {
  showPwd.value = false
}

const saveChangePwd = async (pwdData) => {
  try {
    changingPwd.value = true
    const uid = userInfo.value?.user_id || userInfo.value?.id
    
    if (!uid) throw new Error('Missing user id')
    
    await api.post(`/users/${uid}/reset-password`, { 
      newPassword: pwdData.next 
    })
    
    addToast({ 
      title: 'Success', 
      message: 'Password changed successfully', 
      type: 'success' 
    })
    
    closeChangePwd()
  } catch (e) {
    console.error('Failed to change password', e)
    const msg = e?.response?.data?.message || e?.message || 'Failed to change password'
    addToast({ 
      title: 'Error', 
      message: msg, 
      type: 'error' 
    })
  } finally {
    changingPwd.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadGuardian()
})
</script>

<style scoped>
.profile-container {
  padding: 1rem;
  min-height: calc(100vh - 56px - 70px);
  background-color: #f8f9fa;
}

.profile-footer {
  text-align: center;
  padding: 2rem 1rem;
  color: #6c757d;
  font-size: 0.875rem;
}

.profile-footer p {
  margin: 0;
}

@media (max-width: 576px) {
  .profile-container {
    padding: 0.75rem;
  }

  .profile-footer {
    padding: 1.5rem 0.875rem;
    font-size: 0.8125rem;
  }
}
</style>
