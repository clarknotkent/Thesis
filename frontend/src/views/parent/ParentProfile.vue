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
            <span class="info-label">Member Since:</span>
            <span class="info-value">{{ memberSince || 'N/A' }}</span>
          </div>
        </div>

        <div class="actions-section">
          <button class="btn btn-outline-primary w-100 mb-2">
            <i class="bi bi-pencil me-2"></i>Edit Profile
          </button>
          <button class="btn btn-outline-secondary w-100 mb-2">
            <i class="bi bi-key me-2"></i>Change Password
          </button>
          <button class="btn btn-outline-danger w-100" @click="logout">
            <i class="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </div>
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { userInfo, logout: authLogout } = useAuth()

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
