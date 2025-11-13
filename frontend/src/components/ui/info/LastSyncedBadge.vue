<template>
  <span
    v-if="display"
    class="badge rounded-pill bg-light text-muted border align-middle"
    :title="`Last synced: ${display}`"
  >
    <i class="bi bi-cloud-check me-1" />
    Last synced: {{ display }}
    <span
      v-if="offline"
      class="ms-2 text-danger"
    >(offline)</span>
  </span>
  <span
    v-else
    class="badge rounded-pill bg-light text-muted border align-middle"
  >
    <i class="bi bi-cloud-arrow-down me-1" />
    Not synced yet
    <span
      v-if="offline"
      class="ms-2 text-danger"
    >(offline)</span>
  </span>
</template>

<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import { getLastSyncDisplay } from '@/services/offline/readThroughCache'

const props = defineProps({
  cacheKey: { type: String, required: true },
})

const display = ref(null)
const offline = ref(false)

const update = () => {
  display.value = getLastSyncDisplay(props.cacheKey)
  offline.value = typeof navigator !== 'undefined' ? !navigator.onLine : false
}

onMounted(() => {
  update()
  if (typeof window !== 'undefined') {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  }
})

watchEffect(() => {
  // refresh anytime cacheKey changes
  display.value = getLastSyncDisplay(props.cacheKey)
})
</script>

<style scoped>
.badge {
  font-weight: 500;
}
</style>
