<template>
  <nav class="mobile-bottom-navbar">
    <div class="bottom-nav-container">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        class="bottom-nav-item"
        :class="{ active: isActiveRoute(item.path) }"
      >
        <div class="nav-icon">
          <i :class="item.icon" />
        </div>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  {
    name: 'home',
    path: '/parent/home',
    label: 'Home',
    icon: 'bi bi-house-fill'
  },
  {
    name: 'records',
    path: '/parent/records',
    label: 'Records',
    icon: 'bi bi-folder-fill'
  },
  {
    name: 'schedule',
    path: '/parent/schedule',
    label: 'Schedule',
    icon: 'bi bi-calendar-check-fill'
  },
  {
    name: 'profile',
    path: '/parent/profile',
    label: 'Profile',
    icon: 'bi bi-person-circle'
  }
]

const isActiveRoute = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style scoped>
.mobile-bottom-navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  padding: 0;
  z-index: 1020;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  height: 70px;
  min-height: 70px;
  max-height: 70px;
}

.bottom-nav-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  padding: 8px 0 max(8px, env(safe-area-inset-bottom));
  max-width: 100%;
  margin: 0 auto;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #6b7280;
  transition: all 0.2s ease;
  padding: 6px 12px;
  border-radius: 8px;
  min-width: 60px;
  flex: 1;
  max-width: 100px;
  height: 54px;
}

.bottom-nav-item:hover {
  color: #374151;
  background-color: #f3f4f6;
  text-decoration: none;
}

.bottom-nav-item.active {
  color: #007bff;
  background-color: #eff6ff;
}

.nav-icon {
  font-size: 22px;
  margin-bottom: 4px;
  transition: transform 0.2s ease;
  line-height: 1;
}

.bottom-nav-item.active .nav-icon {
  transform: scale(1.1);
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom-nav-item.active .nav-label {
  font-weight: 600;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .bottom-nav-item {
    min-width: 50px;
    max-width: 85px;
    padding: 4px 6px;
  }
  
  .nav-icon {
    font-size: 20px;
    margin-bottom: 2px;
  }
  
  .nav-label {
    font-size: 9px;
  }
}
</style>
