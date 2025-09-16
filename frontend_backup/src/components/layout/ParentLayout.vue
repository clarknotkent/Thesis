<template>
  <div class="parent-layout">
    <!-- Mobile Header -->
    <header class="parent-header bg-primary text-white p-3 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center">
        <i class="bi bi-shield-check fs-4 me-2"></i>
        <h5 class="mb-0">ImmunizeMe</h5>
      </div>
      <div class="dropdown">
        <button class="btn btn-link text-white" type="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-circle fs-4"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><h6 class="dropdown-header">Parent Portal</h6></li>
          <li><router-link class="dropdown-item" to="/parent/profile">Profile</router-link></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" @click="logout">Logout</a></li>
        </ul>
      </div>
    </header>

    <!-- Main Content -->
    <main class="parent-main">
      <slot />
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav class="parent-bottom-nav bg-white border-top">
      <div class="d-flex">
        <router-link 
          to="/parent/dashboard" 
          class="nav-item flex-fill text-center p-3"
          :class="{ 'active': $route.path === '/parent/dashboard' }"
        >
          <i class="bi bi-house d-block fs-5"></i>
          <small>Dashboard</small>
        </router-link>
        <router-link 
          to="/parent/child-info" 
          class="nav-item flex-fill text-center p-3"
          :class="{ 'active': $route.path === '/parent/child-info' }"
        >
          <i class="bi bi-person d-block fs-5"></i>
          <small>My Child</small>
        </router-link>
        <router-link 
          to="/parent/vaccination-schedule" 
          class="nav-item flex-fill text-center p-3"
          :class="{ 'active': $route.path === '/parent/vaccination-schedule' }"
        >
          <i class="bi bi-calendar-check d-block fs-5"></i>
          <small>Schedule</small>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = () => {
  // Handle logout logic
  router.push('/auth/login')
}
</script>

<!-- Styles moved to src/assets/styles/parent.css for consistency -->
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.parent-main {
  flex: 1;
  padding: 1rem;
  padding-bottom: 80px; /* Space for bottom nav */
  background-color: #f8f9fa;
}

.parent-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
}

.nav-item {
  color: #6c757d;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: #007bff;
  background-color: #f8f9fa;
}

.nav-item.active {
  color: #007bff;
  background-color: #e3f2fd;
}

.nav-item small {
  font-size: 0.75rem;
<!-- Styles moved to src/assets/styles/parent.css for consistency -->
