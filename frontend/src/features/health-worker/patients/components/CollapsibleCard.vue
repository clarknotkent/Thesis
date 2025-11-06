<template>
  <div class="collapsible-card">
    <button
      class="card-header"
      @click="$emit('toggle')"
    >
      <div class="header-left">
        <i :class="`bi bi-${icon}`" />
        <h3 class="card-title">
          {{ title }}
        </h3>
      </div>
      <i :class="['bi', isExpanded ? 'bi-chevron-up' : 'bi-chevron-down', 'toggle-icon']" />
    </button>
    <transition name="expand">
      <div
        v-if="isExpanded"
        class="card-content"
      >
        <slot />
      </div>
    </transition>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'info-circle-fill'
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle'])
</script>

<style scoped>

.collapsible-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: #ffffff;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-header:hover {
  background: #f9fafb;
}

.card-header:active {
  background: #f3f4f6;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-left i {
  font-size: 1.375rem;
  color: #007bff;
}

.card-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  text-align: left;
}

.toggle-icon {
  font-size: 1.375rem;
  color: #6b7280;
  transition: transform 0.3s ease;
}

.card-content {
  padding: 1.5rem;
  background: #ffffff;
}

/* Expand/Collapse Animation */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 2000px;
  opacity: 1;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .card-header {
    padding: 1rem 1.25rem;
  }
  
  .card-title {
    font-size: 1rem;
  }
  
  .header-left i {
    font-size: 1.25rem;
  }
  
  .toggle-icon {
    font-size: 1.25rem;
  }
  
  .card-content {
    padding: 1.25rem;
  }
}
</style>
