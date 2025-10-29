<template>
  <nav class="mobile-top-bar navbar navbar-expand-lg navbar-dark navbar-custom">
    <div class="container-fluid">
      <a class="navbar-brand fw-bold" href="#">
        <i class="bi bi-shield-check me-2"></i>
        {{ title || 'My Health Portal' }}
      </a>

      <div class="navbar-nav ms-auto d-flex flex-row">
        <!-- Notifications -->
        <router-link 
          to="/parent/notifications" 
          class="nav-link position-relative me-3"
          aria-label="Notifications"
        >
          <i class="bi bi-bell"></i>
          <span v-if="notificationCount > 0" class="badge bg-danger position-absolute top-0 start-100 translate-middle">
            {{ notificationCount }}
          </span>
        </router-link>

        <!-- Messages -->
        <router-link 
          to="/parent/messages" 
          class="nav-link position-relative"
          aria-label="Messages"
        >
          <i class="bi bi-chat-dots"></i>
          <span v-if="messageCount > 0" class="badge bg-danger position-absolute top-0 start-100 translate-middle">
            {{ messageCount }}
          </span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  title: {
    type: String,
    default: null
  }
})

// TODO: Connect to actual notification/message API
const notificationCount = ref(0)
const messageCount = ref(0)
</script>

<style scoped>
.mobile-top-bar {
  background-color: #007bff !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 56px;
  padding: 0.5rem 0;
  position: relative;
}

.navbar-brand {
  font-size: 1.1rem;
  font-weight: 600;
  color: white !important;
}

.navbar-brand i {
  font-size: 1.2rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 1.1rem;
  padding: 0.5rem 0.75rem !important;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link i {
  font-size: 1.2rem;
}

.badge {
  font-size: 0.6em;
  padding: 0.25em 0.5em;
  min-width: 1.5em;
  height: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .navbar-brand {
    font-size: 1rem;
  }
  
  .navbar-brand i {
    font-size: 1.1rem;
  }
  
  .nav-link {
    font-size: 1rem;
    padding: 0.4rem 0.6rem !important;
  }
  
  .nav-link i {
    font-size: 1.1rem;
  }
  
  .badge {
    font-size: 0.55em;
  }
}
</style>
