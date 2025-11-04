<template>
  <div class="parent-layout mobile-first">
    <!-- Fixed Header: Blue TopBar -->
    <ParentTopBar :title="title" />

    <!-- Scrollable Content Area -->
    <main class="parent-main-wrapper">
      <div class="parent-main-content">
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
  width: 100vw;
  background-color: #f8f9fa;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.parent-main-wrapper {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  padding: 0;
  margin: 0;
  -webkit-overflow-scrolling: touch;
  background-color: #f8f9fa;
}

.parent-main-content {
  padding: 0;
  width: 100%;
  max-width: 100%;
  margin: 0;
  min-height: calc(100vh - 56px - 70px);
  background: transparent;
  /* Add bottom padding for comfortable scrolling */
  padding-bottom: 80px;
}
</style>
