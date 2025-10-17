<template>
  <nav class="navbar navbar-expand-lg navbar-dark navbar-custom fixed-top">
    <div class="container-fluid d-flex align-items-center">
      <div class="navbar-brand fw-bold d-flex align-items-center">
        <button 
          v-if="userRole.toLowerCase() === 'admin'"
          class="btn btn-link sidebar-toggle-icon p-0 me-2"
          @click="toggleSidebar"
          aria-label="Toggle sidebar"
        >
          <i class="bi bi-shield-check"></i>
        </button>
        <i v-else class="bi bi-shield-check me-2"></i>
        <span>ImmunizeMe {{ userRole }}</span>
      </div>

      <button
        class="navbar-toggler sidebar-toggle"
        type="button"
        @click="toggleSidebar"
        aria-label="Toggle sidebar"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <!-- User Menu -->
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle d-flex align-items-center"
              href="#"
              id="navbarDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-person-circle me-2"></i>
              <span>{{ userName }}</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <a class="dropdown-item" href="#">
                  <i class="bi bi-person me-2"></i>Profile
                </a>
              </li>
              <li>
                <a class="dropdown-item" href="#">
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { logout as doLogout } from '@/services/auth'

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

const logout = () => {
  doLogout()
  router.push('/auth/login')
}

const toggleSidebar = () => {
  emit('toggle-sidebar')
}
</script>

<style scoped>
/* Desktop-only Admin Navbar - Scoped styles with high specificity */
nav.navbar-custom {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  min-height: 70px;
  height: 70px;
  padding: 0;
  display: flex;
  align-items: center;
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
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  border-radius: 0.5rem;
  margin-top: 0.5rem;
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
}

.sidebar-toggle-icon:hover {
  color: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
  text-decoration: none;
  background: transparent;
}

.sidebar-toggle-icon:focus {
  box-shadow: none;
  outline: none;
  background: transparent;
}

.sidebar-toggle-icon i {
  font-size: 1.5rem;
  line-height: 70px;
}

.cursor-pointer {
  cursor: pointer;
}

/* Admin navbar is desktop-only - hide on mobile/tablet */
@media (max-width: 991px) {
  nav.navbar {
    display: none !important;
  }
}
</style>
