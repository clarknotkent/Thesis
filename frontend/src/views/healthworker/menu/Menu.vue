<template>
  <HealthWorkerLayout>
    <div class="menu-container">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-avatar">
          <i class="bi bi-person-circle" />
        </div>
        <div class="profile-info">
          <h4 class="profile-name">
            {{ userName || 'Health Staff' }}
          </h4>
          <p class="profile-role">
            {{ userRole || 'Health Staff' }}
          </p>
          <p class="profile-id">
            ID: {{ userId || 'HW-001' }}
          </p>
        </div>
      </div>

      <!-- Menu Options -->
      <div class="menu-options">
        <router-link
          to="/healthworker/profile"
          class="menu-item"
        >
          <div class="menu-icon">
            <i class="bi bi-person" />
          </div>
          <div class="menu-content">
            <h6 class="menu-title">
              Profile
            </h6>
            <p class="menu-description">
              View and edit your profile information
            </p>
          </div>
          <div class="menu-arrow">
            <i class="bi bi-chevron-right" />
          </div>
        </router-link>

        <router-link
          to="/healthworker/settings"
          class="menu-item"
        >
          <div class="menu-icon">
            <i class="bi bi-gear" />
          </div>
          <div class="menu-content">
            <h6 class="menu-title">
              Settings
            </h6>
            <p class="menu-description">
              App preferences and configurations
            </p>
          </div>
          <div class="menu-arrow">
            <i class="bi bi-chevron-right" />
          </div>
        </router-link>

        <div
          class="menu-item logout-item"
          @click="logout"
        >
          <div class="menu-icon">
            <i class="bi bi-box-arrow-right" />
          </div>
          <div class="menu-content">
            <h6 class="menu-title">
              Logout
            </h6>
            <p class="menu-description">
              Sign out of your account
            </p>
          </div>
          <div class="menu-arrow">
            <i class="bi bi-chevron-right" />
          </div>
        </div>
      </div>

      <!-- App Info -->
      <div class="app-info">
        <p class="text-muted text-center">
          ImmunizeMe Health Worker v1.0.0
        </p>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { userInfo, getRole, logout: authLogout } = useAuth()

const userName = computed(() => {
  if (userInfo.value) {
    // Try different possible name formats
    if (userInfo.value.full_name) return userInfo.value.full_name
    if (userInfo.value.name) return userInfo.value.name
    if (userInfo.value.firstname && userInfo.value.lastname) {
      return `${userInfo.value.firstname} ${userInfo.value.lastname}`
    }
    if (userInfo.value.firstName && userInfo.value.lastName) {
      return `${userInfo.value.firstName} ${userInfo.value.lastName}`
    }
    if (userInfo.value.email) return userInfo.value.email
  }
  return null
})

const userRole = computed(() => {
  const role = getRole()
  if (role === 'healthworker' || role === 'health_staff' || role === 'health-staff') return 'Health Staff'
  if (role === 'admin') return 'Administrator'
  if (role === 'parent') return 'Parent'
  return role
})

const userId = computed(() => {
  if (userInfo.value) {
    return userInfo.value.id || userInfo.value.user_id || userInfo.value.userId
  }
  return null
})

const logout = async () => {
  if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
    alert('You are offline. Logout is disabled to preserve your offline data. Please reconnect to log out.')
    return
  }
  await authLogout()
  router.push('/auth/login')
}
</script>

<style scoped>
.menu-container {
  max-width: 100%;
  margin: 0 auto;
}

.back-button-container {
  margin-bottom: 1rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #007bff;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0;
  cursor: pointer;
  transition: color 0.2s ease;
}

.back-button:hover {
  color: #0056b3;
}

.back-button i {
  font-size: 1rem;
}

.profile-header {
  background: #007bff;
  color: white;
  padding: 2rem 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);
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

.profile-role,
.profile-id {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.menu-options {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  text-decoration: none;
  color: inherit;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.menu-item:hover {
  background-color: #f8f9fa;
  text-decoration: none;
  color: inherit;
}

.menu-item:last-child {
  border-bottom: none;
}

.logout-item {
  color: #dc3545;
}

.logout-item:hover {
  background-color: #fff5f5;
  color: #dc3545;
}

.menu-icon {
  width: 40px;
  height: 40px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: #6c757d;
  font-size: 1.2rem;
}

.logout-item .menu-icon {
  background: #fff5f5;
  color: #dc3545;
}

.menu-content {
  flex: 1;
  min-width: 0;
}

.menu-title {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #333;
}

.logout-item .menu-title {
  color: #dc3545;
}

.menu-description {
  margin: 0;
  font-size: 0.8rem;
  color: #6c757d;
  line-height: 1.3;
}

.menu-arrow {
  color: #6c757d;
  font-size: 0.9rem;
}

.app-info {
  padding: 1rem;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .profile-header {
    padding: 1.5rem 1rem;
  }
  
  .profile-avatar i {
    font-size: 3rem;
  }
  
  .profile-name {
    font-size: 1.25rem;
  }
  
  .menu-item {
    padding: 0.875rem;
  }
  
  .menu-icon {
    width: 35px;
    height: 35px;
    font-size: 1rem;
    margin-right: 0.75rem;
  }
  
  .menu-title {
    font-size: 0.9rem;
  }
  
  .menu-description {
    font-size: 0.75rem;
  }
}
</style>