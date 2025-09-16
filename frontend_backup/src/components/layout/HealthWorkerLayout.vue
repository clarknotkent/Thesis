<template>
  <div class="health-worker-layout">
    <Navbar 
      user-role="Health Worker" 
      user-name="Dr. Sarah Wilson"
      @toggle-sidebar="toggleSidebar" 
    />
    
    <Sidebar 
      :is-open="sidebarOpen"
      user-role="healthworker"
    />

    <main class="main-content">
      <div class="health-worker-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'

const sidebarOpen = ref(true)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<style>
/* HealthWorker styles imported globally in index.css */
</style>
