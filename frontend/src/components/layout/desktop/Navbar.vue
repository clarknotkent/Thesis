<template>
  <nav class="navbar navbar-expand-lg navbar-dark navbar-custom fixed-top">
    <div class="container-fluid d-flex align-items-center">
      <div class="navbar-brand fw-bold d-flex align-items-center">
        <button 
          class="btn btn-link sidebar-toggle-icon p-0 me-2"
          @click="toggleSidebar"
          aria-label="Toggle sidebar"
        >
          <i class="bi bi-shield-check"></i>
        </button>
        <span>ImmunizeMe {{ userRole }}</span>
      </div>

      <div class="navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <!-- User Menu -->
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle d-flex align-items-center cursor-pointer"
              href="#"
              id="navbarDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              @click.prevent="toggleDropdown"
            >
              <i class="bi bi-person-circle me-2"></i>
              <span>{{ userName }}</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end" :class="{ 'show': dropdownOpen }">
              <li>
                <a class="dropdown-item cursor-pointer" @click="goToProfile">
                  <i class="bi bi-person me-2"></i>Profile
                </a>
              </li>
              <li>
                <a class="dropdown-item cursor-pointer" @click="goToSettings">
                  <i class="bi bi-gear me-2"></i>Settings
                </a>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a class="dropdown-item cursor-pointer" @click="logout">
                  <i class="bi bi-box-arrow-right me-2"></i>Logout
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { logout as doLogout } from '@/services/auth'
import { useOffline } from '@/composables/useOffline'

const props = defineProps({
  userRole: {
    type: String,
    default: 'Admin'
  },
  userName: {
    type: String,
    default: 'Admin User'
  }
})

const emit = defineEmits(['toggle-sidebar'])
const router = useRouter()
const dropdownOpen = ref(false)
const { isOnline } = useOffline()

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = (e) => {
  if (!e.target.closest('.dropdown')) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

const logout = async () => {
  dropdownOpen.value = false
  try {
    if (!isOnline.value) {
      alert('You are offline. Logout is disabled to preserve your offline data. Please reconnect to the internet to log out.')
      return
    }
    await doLogout()
    router.push('/auth/login')
  } catch (error) {
    console.error('Logout error:', error)
    // Force logout even if API call fails
    // If we are offline, do NOT clear local data; keep user in app
    if (navigator.onLine !== false) {
      localStorage.clear()
      router.push('/auth/login')
    }
  }
}

const goToProfile = () => {
  dropdownOpen.value = false
  router.push('/admin/profile')
}

const goToSettings = () => {
  dropdownOpen.value = false
  router.push('/admin/settings')
}

const toggleSidebar = () => {
  emit('toggle-sidebar')
}
</script>

<style scoped>
/* Desktop-only Admin Navbar - Scoped styles with high specificity */
nav.navbar-custom {
  background: #007bff;
  min-height: 70px;
  height: 70px;
  padding: 0;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

nav.navbar-custom .container-fluid {
  display: flex;
  align-items: center;
  height: 70px;
  padding: 0 1rem;
  margin: 0;
}

nav.navbar-custom .navbar-brand {
  display: flex;
  align-items: center;
  height: 70px;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  padding: 0;
  line-height: 70px;
}

nav.navbar-custom .navbar-brand i {
  font-size: 1.5rem;
  line-height: 70px;
}

nav.navbar-custom .navbar-brand span {
  line-height: 70px;
}

nav.navbar-custom .navbar-nav {
  display: flex;
  align-items: center;
  height: 70px;
  margin: 0;
}

nav.navbar-custom .nav-item {
  display: flex;
  align-items: center;
  height: 70px;
  position: relative;
}

nav.navbar-custom .nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  padding: 0 1rem;
  line-height: 70px;
  height: 70px;
}

nav.navbar-custom .nav-link i {
  font-size: 1.25rem;
  line-height: 70px;
  margin-right: 0.5rem;
}

nav.navbar-custom .nav-link span {
  line-height: 70px;
}

nav.navbar-custom .dropdown-menu {
  border: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border-radius: 0.75rem;
  margin-top: 0.5rem;
  animation: slideDown 0.3s ease;
  padding: 0.5rem 0;
  min-width: 200px;
  background-color: #ffffff;
  position: absolute;
  top: 100%;
  right: 0;
  left: auto;
  transform-origin: top right;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

nav.navbar-custom .dropdown-item {
  padding: 0.75rem 1.5rem;
  transition: all 0.2s ease;
  color: #495057;
  font-weight: 500;
  display: flex;
  align-items: center;
}

nav.navbar-custom .dropdown-item:hover {
  background-color: #007bff;
  color: white;
}

nav.navbar-custom .dropdown-item:active {
  background-color: #0056b3;
  color: white;
}

nav.navbar-custom .dropdown-item i {
  font-size: 1.1rem;
  width: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

nav.navbar-custom .dropdown-divider {
  margin: 0.5rem 0;
  border-top-color: #e9ecef;
}

nav.navbar-custom .nav-link.dropdown-toggle {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
}

nav.navbar-custom .nav-link.dropdown-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Sidebar toggle icon button (Admin only) */
.sidebar-toggle-icon {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  outline: none;
  box-shadow: none;
  padding: 0.25rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle-icon:hover {
  color: rgba(255, 255, 255, 0.9);
  transform: scale(1.1);
  text-decoration: none;
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-toggle-icon:active {
  transform: scale(0.95);
}

.sidebar-toggle-icon:focus {
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
  outline: none;
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-toggle-icon i {
  font-size: 1.5rem;
  line-height: 70px;
}

.cursor-pointer {
  cursor: pointer;
}

.dropdown-item.cursor-pointer {
  cursor: pointer;
}

/* Responsive adjustments for smaller screens */
@media (max-width: 991px) {
  nav.navbar-custom {
    min-height: 60px;
    height: 60px;
  }
  
  nav.navbar-custom .container-fluid {
    height: 60px;
  }
  
  nav.navbar-custom .navbar-brand {
    font-size: 1.1rem;
    height: 60px;
    line-height: 60px;
  }
  
  nav.navbar-custom .navbar-brand i,
  nav.navbar-custom .navbar-brand span {
    line-height: 60px;
  }
  
  nav.navbar-custom .nav-item,
  nav.navbar-custom .nav-link {
    height: 60px;
    line-height: 60px;
  }
  
  nav.navbar-custom .nav-link i,
  nav.navbar-custom .nav-link span {
    line-height: 60px;
  }
  
  .sidebar-toggle-icon i {
    line-height: 60px;
  }
  
  /* Show hamburger menu on smaller screens */
  nav.navbar-custom .navbar-toggler {
    display: block;
  }
}

@media (max-width: 768px) {
  nav.navbar-custom {
    min-height: 56px;
    height: 56px;
  }
  
  nav.navbar-custom .container-fluid {
    height: 56px;
    padding: 0 0.75rem;
  }
  
  nav.navbar-custom .navbar-brand {
    font-size: 1rem;
    height: 56px;
    line-height: 56px;
  }
  
  nav.navbar-custom .navbar-brand i {
    font-size: 1.25rem;
  }
  
  nav.navbar-custom .navbar-brand span {
    display: none; /* Hide "ImmunizeMe Admin" text on very small screens */
  }
  
  nav.navbar-custom .nav-item,
  nav.navbar-custom .nav-link {
    height: 56px;
    line-height: 56px;
    padding: 0 0.75rem;
  }
  
  nav.navbar-custom .nav-link i {
    font-size: 1.1rem;
  }
  
  nav.navbar-custom .nav-link span {
    font-size: 0.85rem;
  }
  
  .sidebar-toggle-icon i {
    font-size: 1.25rem;
    line-height: 56px;
  }
}
</style>
