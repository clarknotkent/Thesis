<template>
  <header class="mobile-header">
    <!-- Blue TopBar -->
    <MobileTopBar 
      :user-role="userRole" 
      :user-name="userName"
    />

    <!-- White ControlsCard -->
    <MobileControlsCard
      v-if="showControls"
      v-bind="controlsProps"
      @filter="$emit('filter')"
      @scan="$emit('scan')"
      @add="$emit('add')"
      @update:searchQuery="$emit('update:searchQuery', $event)"
    />
  </header>
</template>

<script setup>
import MobileTopBar from './MobileTopBar.vue'
import MobileControlsCard from './MobileControlsCard.vue'

defineProps({
  userRole: {
    type: String,
    default: 'Health Staff'
  },
  userName: {
    type: String,
    default: ''
  },
  showControls: {
    type: Boolean,
    default: false
  },
  controlsProps: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['filter', 'scan', 'add', 'update:searchQuery'])
</script>

<style scoped>
.mobile-header {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: transparent;
  flex-shrink: 0;
}
</style>
