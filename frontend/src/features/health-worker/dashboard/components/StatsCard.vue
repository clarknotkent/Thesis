<template>
  <div
    :class="['stats-card', bgClass]"
    @click="$emit('click')"
  >
    <div class="stats-card-content">
      <i :class="['bi', iconClass, 'stats-icon']" />
      <h6 class="stats-title">
        {{ title }}
      </h6>
      <h2 class="stats-value">
        {{ value }}
      </h2>
    </div>
  </div>
</template>

<script setup>
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

defineEmits(['click'])
</script>

<style scoped>
.stats-card {
  border-radius: 12px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  min-height: 160px;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.stats-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
}

.stats-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.9;
}

.stats-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  opacity: 0.95;
}

.stats-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

/* Solid background colors - NO GRADIENTS */
.bg-primary {
  background-color: #2563eb !important;
  color: white !important;
}

.bg-info {
  background-color: #06b6d4 !important;
  color: white !important;
}

.bg-warning {
  background-color: #f59e0b !important;
  color: white !important;
}

.bg-success {
  background-color: #10b981 !important;
  color: white !important;
}

.bg-danger {
  background-color: #ef4444 !important;
  color: white !important;
}

.bg-secondary {
  background-color: #6b7280 !important;
  color: white !important;
}

@media (max-width: 576px) {
  .stats-card {
    padding: 1.5rem 1rem;
    min-height: 140px;
  }
  
  .stats-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }
  
  .stats-title {
    font-size: 0.75rem;
  }
  
  .stats-value {
    font-size: 2rem;
  }
}
</style>
