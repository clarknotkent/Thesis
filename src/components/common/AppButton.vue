<template>
  <button 
    :class="buttonClasses" 
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
    :type="type"
  >
    <i v-if="loading" class="bi bi-arrow-clockwise me-2 spin" aria-hidden="true"></i>
    <i v-else-if="icon" :class="iconClass" aria-hidden="true"></i>
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'outline-primary', 'outline-secondary', 'outline-success', 'outline-danger', 'outline-warning', 'outline-info', 'outline-light', 'outline-dark'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'button'
  },
  block: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const buttonClasses = computed(() => {
  const classes = [`btn btn-${props.variant}`]
  
  if (props.size !== 'md') {
    classes.push(`btn-${props.size}`)
  }
  
  if (props.block) {
    classes.push('w-100')
  }
  
  return classes.join(' ')
})

const iconClass = computed(() => {
  // Accept icon prop in multiple forms: 'bi bi-plus', 'bi-plus', 'plus'
  if (!props.icon) return ''

  const raw = props.icon.trim()

  // If already contains 'bi ' or starts with 'bi-', keep as-is but ensure spacing for me-2
  if (/\bbi\b/.test(raw)) {
    return `${raw} me-2`
  }

  // If starts with 'bi-', prepend 'bi '
  if (/^bi-/.test(raw)) {
    return `bi ${raw} me-2`
  }

  // If just a name like 'plus-circle', create full class
  if (!/\bbi-/.test(raw) && !/\bbi\b/.test(raw)) {
    return `bi bi-${raw} me-2`
  }

  return `${raw} me-2`
})
</script>

<style scoped>
.spin {
  animation: spin 1s linear infinite;
}
  .btn i {
    vertical-align: middle;
  }
  
  .btn.icon-only {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>