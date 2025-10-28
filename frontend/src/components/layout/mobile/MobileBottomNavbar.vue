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
        <div class="nav-icon" :class="{ 'icon-with-menu': item.isMenu }">
          <i :class="item.icon"></i>
          <i v-if="item.isMenu" class="menu-overlay bi bi-three-dots"></i>
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
    name: 'dashboard',
    path: '/healthworker/dashboard',
    label: 'Home',
    icon: 'bi bi-house-fill'
  },
  {
    name: 'patients',
    path: '/healthworker/patients',
    label: 'Patients',
    icon: 'bi bi-people-fill'
  },
  {
    name: 'inventory',
    path: '/healthworker/inventory',
    label: 'Stock',
    icon: 'bi bi-box-seam-fill'
  },
  {
    name: 'profile',
    path: '/healthworker/menu',
    label: 'Profile',
    icon: 'bi bi-person-circle',
    isMenu: true
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
  z-index: 1000;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.bottom-nav-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0 max(8px, env(safe-area-inset-bottom));
  max-width: 100%;
  margin: 0 auto;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #6b7280;
  transition: all 0.2s ease;
  padding: 6px 12px;
  border-radius: 8px;
  min-width: 60px;
  flex: 1;
  max-width: 80px;
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

/* Profile icon with menu overlay */
.icon-with-menu {
  position: relative;
}

.menu-overlay {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 8px !important;
  background: #6b7280;
  color: white;
  border-radius: 50%;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
}

.bottom-nav-item.active .menu-overlay {
  background: #007bff;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .bottom-nav-item {
    min-width: 55px;
    max-width: 75px;
    padding: 4px 8px;
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
