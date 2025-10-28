<template>
  <AppCard :class="['hw-gallery-card', 'h-100', bgClass]">
    <div class="text-center">
      <i :class="['bi', iconClass, 'hw-gallery-icon']"></i>
      <h6 class="mb-1">{{ title }}</h6>
      <h3 class="fw-bold mb-0">{{ value }}</h3>
    </div>
  </AppCard>
</template>

<script setup>
import AppCard from '@/components/ui/base/AppCard.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  iconClass: {
    type: String,
    required: true
  },
  bgClass: {
    type: String,
    default: 'bg-primary text-white'
  }
})
</script>

<style scoped>
.hw-gallery-card {
  cursor: default;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hw-gallery-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.hw-gallery-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  display: block;
}

@media (max-width: 576px) {
  .hw-gallery-icon {
    font-size: 2rem;
  }
  
  h6 {
    font-size: 0.875rem;
  }
  
  h3 {
    font-size: 1.5rem;
  }
}
</style>
