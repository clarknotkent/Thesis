<template>
  <nav class="navbar navbar-expand-lg navbar-dark navbar-custom fixed-top">
    <div class="container-fluid">
      <a class="navbar-brand fw-bold" href="#">
        <i class="bi bi-shield-check me-2"></i>
        ImmunizeMe {{ userRole }}
      </a>

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
              class="nav-link dropdown-toggle"
              href="#"
              id="navbarDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-person-circle me-1"></i>
              {{ userName }}
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
import { computed } from 'vue'
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
