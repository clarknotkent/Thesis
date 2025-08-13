<template>
  <div class="card shadow" :class="cardClasses">
    <div v-if="title || $slots.header" class="card-header py-3" :class="headerClasses">
      <div v-if="title" class="d-flex justify-content-between align-items-center">
        <h6 class="m-0 font-weight-bold text-primary">{{ title }}</h6>
        <slot name="actions" />
      </div>
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: null
  },
  noPadding: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md'
  }
})

const cardClasses = computed(() => {
  const classes = []
  if (props.size === 'sm') classes.push('mb-2')
  else classes.push('mb-4')
  return classes.join(' ')
})

const headerClasses = computed(() => {
  return props.noPadding ? 'py-2' : 'py-3'
})
</script>
