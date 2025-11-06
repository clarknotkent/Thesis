<template>
  <div class="d-flex justify-content-center align-items-center py-5">
    <div
      class="spinner-border text-primary"
      role="status"
    >
      <span class="visually-hidden">Loading...</span>
    </div>
    <span
      v-if="text"
      class="ms-3 text-muted"
    >{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: 'Loading...'
  }
})
</script>

<style scoped>
.spinner-border {
  width: 2rem;
  height: 2rem;
}
</style>
