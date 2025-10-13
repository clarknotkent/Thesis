<template>
  <div class="health-worker-layout mobile-first">
    <TopNavbar 
      :user-role="userRole || 'Health Worker'" 
      :user-name="userName || 'Health Worker'"
    />

    <main class="main-content mobile-main">
      <div class="health-worker-content mobile-content">
        <slot />
      </div>
    </main>

    <BottomNavbar />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TopNavbar from './TopNavbar.vue'
import BottomNavbar from './BottomNavbar.vue'
import { useAuth } from '@/composables/useAuth'

const { userInfo, getRole } = useAuth()

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
  if (role === 'healthworker') return 'Health Worker'
  if (role === 'admin') return 'Administrator'
  if (role === 'parent') return 'Parent'
  return role
})
</script>

<style scoped>
.health-worker-layout.mobile-first {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 80px; /* Space for bottom navbar - mobile */
}

.mobile-main {
  margin-top: 56px; /* Height of TopNavbar - mobile */
  margin-left: 0;
  min-height: calc(100vh - 56px - 80px);
  width: 100%;
}

.mobile-content {
  padding: 0.75rem 1rem;
  max-width: 100%;
  margin: 0 auto;
}

/* Larger mobile screens */
@media (min-width: 480px) {
  .mobile-content {
    padding: 1.25rem;
  }
}

/* Tablets */
@media (min-width: 768px) {
  .health-worker-layout.mobile-first {
    padding-bottom: 88px; /* Larger bottom navbar */
  }
  
  .mobile-main {
    margin-top: 56px;
    min-height: calc(100vh - 56px - 88px);
  }
  
  .mobile-content {
    padding: 1.5rem 2rem;
    max-width: 1200px;
  }
}

/* Desktop */
@media (min-width: 992px) {
  .health-worker-layout.mobile-first {
    padding-bottom: 96px; /* Even larger bottom navbar for desktop */
  }
  
  .mobile-main {
    margin-top: 64px; /* Larger TopNavbar height */
    min-height: calc(100vh - 64px - 96px);
  }
  
  .mobile-content {
    padding: 2rem 3rem;
    max-width: 1400px;
  }
}

/* Large Desktop */
@media (min-width: 1400px) {
  .health-worker-layout.mobile-first {
    padding-bottom: 104px; /* Maximum bottom navbar size */
  }
  
  .mobile-main {
    margin-top: 72px; /* Maximum TopNavbar height */
    min-height: calc(100vh - 72px - 104px);
  }
  
  .mobile-content {
    padding: 2.5rem 4rem;
    max-width: 1600px;
  }
}
</style>
