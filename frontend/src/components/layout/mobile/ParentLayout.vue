<template>
  <div class="parent-layout mobile-first">
    <!-- Fixed Header: Blue TopBar -->
    <ParentTopBar :title="title" />

    <!-- Scrollable Content Area -->
    <main class="main-content mobile-main">
      <div class="parent-content mobile-content">
        <slot />
      </div>
    </main>

    <!-- Fixed Bottom Navigation -->
    <ParentBottomNavbar />

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup>
import ParentTopBar from './ParentTopBar.vue'
import ParentBottomNavbar from './ParentBottomNavbar.vue'
import ToastContainer from '@/components/ui/feedback/ToastContainer.vue'

defineProps({
  title: {
    type: String,
    default: null
  }
})
</script>

<style scoped>
.parent-layout.mobile-first {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
}

.mobile-main {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  padding: 0 8px;
  /* Padding bottom to prevent content from being hidden behind bottom navbar */
  padding-bottom: 70px;
}

.mobile-content {
  padding: 0;
  max-width: 100%;
  margin: 0 auto;
  min-height: 100%;
  background: #ffffff;
}

/* Tablets */
@media (min-width: 768px) {
  .mobile-content {
    max-width: 1200px;
  }
}

/* Desktop */
@media (min-width: 992px) {
  .mobile-content {
    max-width: 1400px;
  }
}

/* Large Desktop */
@media (min-width: 1400px) {
  .mobile-content {
    max-width: 1600px;
  }
}
</style>
