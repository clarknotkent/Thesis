<template>
  <button 
    :class="buttonClasses" 
    :disabled="disabled || loading"
    :type="type"
    @click="$emit('click', $event)"
  >
    <i
      v-if="loading"
      class="bi bi-arrow-clockwise me-2 spin"
    />
    <i
      v-else-if="icon"
      :class="`bi ${icon} me-2`"
    />
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
</script>

<!-- Styles moved to src/assets/styles/components.css for consistency -->