<template>
  <div class="admin-layout">
    <Navbar 
      user-role="Admin" 
      user-name="Admin User"
      @toggle-sidebar="toggleSidebar" 
    />
    
    <Sidebar 
      :is-open="sidebarOpen"
      user-role="admin"
    />

    <main class="main-content">
      <slot />
    </main>

  <!-- RightSidebar and toggle button removed for UX improvement -->
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'
const sidebarOpen = ref(true)

// Provide admin role context to child components
provide('isAdmin', true)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}
</script>
