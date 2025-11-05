<template>
  <div id="app">
    <OfflineBanner />
    <router-view />
  </div>
</template>

<script setup>
// Main App Component for Healthcare Management System
import OfflineBanner from '@/components/system/OfflineBanner.vue'
</script>

<!-- Styles moved to src/assets/styles/global.css for consistency -->
