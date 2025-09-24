<template>
  <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index:2000;">
    <div v-for="t in toasts" :key="t.id" class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <strong class="me-auto">{{ t.title }}</strong>
        <small class="text-muted">{{ t.time }}</small>
        <button type="button" class="btn-close ms-2 mb-1" aria-label="Close" @click="dismiss(t.id)"></button>
      </div>
      <div class="toast-body">{{ t.message }}</div>
    </div>
  </div>
</template>

<script>
import { useToast } from '../../composables/useToast';

export default {
  name: 'ToastContainer',
  setup() {
    const { toasts, dismiss } = useToast();
    return { toasts, dismiss };
  }
};
</script>

<style scoped>
.toast-container { max-width: 360px; }
.toast { margin-bottom: 0.5rem; }
</style>
