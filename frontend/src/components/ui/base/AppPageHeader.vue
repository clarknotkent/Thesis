<template>
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h1 class="h3 mb-0 text-gray-800">
        <slot name="icon" />{{ title }}
      </h1>
      <p
        v-if="subtitle"
        class="text-muted mb-0"
      >
        {{ subtitle }}
      </p>
    </div>
    <div class="d-flex gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: null
  }
})
</script>
