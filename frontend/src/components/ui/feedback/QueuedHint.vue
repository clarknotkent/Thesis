<template>
  <div v-if="!isOnline" class="queued-hint d-flex align-items-center mt-2" :class="variantClass">
    <i class="bi bi-wifi-off me-2"></i>
    <span class="small">{{ message }}</span>
  </div>
  <div v-else class="queued-hint d-flex align-items-center mt-2 text-success">
    <i class="bi bi-wifi me-2"></i>
    <span class="small">Connected - Data caches automatically</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOffline } from '@/composables/useOffline'

const props = defineProps({
  message: {
    type: String,
    default: 'You are currently offline. Changes will be available when you reconnect.'
  },
  variant: {
    type: String,
    default: 'warning' // warning | muted
  }
})

const { isOnline } = useOffline()

const variantClass = computed(() => {
  return props.variant === 'warning' ? 'text-warning' : 'text-muted'
})
</script>

<style scoped>
.queued-hint {
  line-height: 1.25;
}
</style>
