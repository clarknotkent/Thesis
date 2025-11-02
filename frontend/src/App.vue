<template>
  <div id="app">
    <router-view />
    <!-- Offline status indicator -->
    <OfflineIndicator v-if="isAuthenticated" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import OfflineIndicator from '@/components/ui/feedback/OfflineIndicator.vue';

// Main App Component for Healthcare Management System

// Show offline indicator only when user is authenticated
const isAuthenticated = computed(() => !!localStorage.getItem('authToken'));
</script>

<!-- Styles moved to src/assets/styles/global.css for consistency -->
