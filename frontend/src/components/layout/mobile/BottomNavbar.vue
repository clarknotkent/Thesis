<template>
  <nav class="bottom-navbar">
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
import { computed } from 'vue'
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
.bottom-navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  padding: 0;
  z-index: 1000;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.bottom-nav-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0 max(8px, env(safe-area-inset-bottom));
  max-width: 600px;
  margin: 0 auto;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #6c757d;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 8px;
  min-width: 60px;
  flex: 1;
  max-width: 80px;
}

.bottom-nav-item:hover {
  color: #495057;
  background-color: #e9ecef;
  text-decoration: none;
  transform: translateY(-1px);
}

.bottom-nav-item.active {
  color: #007bff;
  background-color: #e3f2fd;
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 2px;
  transition: transform 0.2s ease;
}

.bottom-nav-item.active .nav-icon {
  transform: scale(1.05);
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
  background: #6c757d;
  color: white;
  border-radius: 50%;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #f8f9fa;
}

.bottom-nav-item.active .menu-overlay {
  background: #007bff;
}

/* Tablet and Desktop Scaling */
@media (min-width: 768px) {
  .bottom-navbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #f8f9fa;
    border-top: 1px solid #dee2e6;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .bottom-nav-container {
    max-width: 800px;
    padding: 12px 0;
  }
  
  .bottom-nav-item {
    min-width: 80px;
    max-width: 120px;
    padding: 8px 12px;
    border-radius: 12px;
  }
  
  .nav-icon {
    font-size: 24px;
    margin-bottom: 4px;
  }
  
  .nav-label {
    font-size: 12px;
  }
}

/* Large Desktop Scaling */
@media (min-width: 1200px) {
  .bottom-navbar {
    background: #ffffff;
    border-top: 2px solid #007bff;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  }
  
  .bottom-nav-container {
    max-width: 1000px;
    padding: 16px 0;
  }
  
  .bottom-nav-item {
    min-width: 100px;
    max-width: 140px;
    padding: 12px 16px;
    border-radius: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .bottom-nav-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
    background-color: rgba(0, 123, 255, 0.1);
  }
  
  .bottom-nav-item.active {
    background: #007bff;
    color: white;
    box-shadow: 0 4px 16px rgba(0, 123, 255, 0.4);
  }
  
  .bottom-nav-item.active .menu-overlay {
    background: rgba(255, 255, 255, 0.9);
    color: #007bff;
  }
  
  .nav-icon {
    font-size: 28px;
    margin-bottom: 6px;
  }
  
  .nav-label {
    font-size: 14px;
    font-weight: 500;
  }
  
  .bottom-nav-item.active .nav-label {
    font-weight: 600;
    color: white;
  }
}
</style>