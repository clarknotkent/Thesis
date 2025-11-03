<template>
  <div v-if="!isOnline" class="queued-hint d-flex align-items-center mt-2" :class="variantClass">
    <i class="bi bi-cloud-upload me-2"></i>
    <span class="small">{{ message }}</span>
    <span v-if="pendingSyncCount > 0" class="badge bg-warning text-dark ms-2">{{ pendingClamped }}</span>
  </div>
  <div v-else-if="isSyncing" class="queued-hint d-flex align-items-center mt-2 text-warning">
    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
    <span class="small">Syncing pending changes…</span>
  </div>
  <div v-else class="queued-hint d-flex align-items-center mt-2 text-muted">
    <i class="bi bi-clock-history me-2"></i>
    <span class="small">Last sync: {{ formattedLastSyncTime }}</span>
  </div>
  
</template>

<script setup>
import { computed } from 'vue'
import { useOffline } from '@/composables/useOffline'

const props = defineProps({
  message: {
    type: String,
    default: 'This action will be queued and synced later.'
  },
  variant: {
    type: String,
    default: 'info' // info | muted
  }
})

const { isOnline, isSyncing, pendingSyncCount, formattedLastSyncTime } = useOffline()

const pendingClamped = computed(() => {
  const n = Number(pendingSyncCount.value || 0)
  return n > 99 ? '99+' : `${n}`
})

const variantClass = computed(() => {
  return props.variant === 'info' ? 'text-primary' : 'text-muted'
})
</script>

<style scoped>
.queued-hint {
  line-height: 1.25;
}
</style>
