<template>
  <div class="profile-menu">
    <div 
      v-for="item in menuItems" 
      :key="item.id"
      class="menu-item"
      :class="{ 'logout': item.variant === 'danger' }"
      @click="$emit('menu-click', item.id)"
    >
      <div class="menu-icon">
        <i :class="item.icon" />
      </div>
      <div class="menu-content">
        <h6 class="menu-title">
          {{ item.title }}
        </h6>
        <p class="menu-subtitle">
          {{ item.subtitle }}
        </p>
      </div>
      <i class="bi bi-chevron-right menu-arrow" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  menuItems: {
    type: Array,
    required: true,
    validator: (items) => {
      return items.every(item => 
        item.id && item.title && item.subtitle && item.icon
      )
    }
  }
})

defineEmits(['menu-click'])
</script>

<style scoped>
.profile-menu {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1rem;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f1f3f4;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #f8f9fa;
}

.menu-item.logout {
  color: #dc3545;
}

.menu-item.logout .menu-icon {
  background-color: #fee;
  color: #dc3545;
}

.menu-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: #f0f8ff;
  color: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon i {
  font-size: 1.25rem;
}

.menu-content {
  flex: 1;
  min-width: 0;
}

.menu-title {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.menu-item.logout .menu-title {
  color: #dc3545;
}

.menu-subtitle {
  margin: 0;
  font-size: 0.8125rem;
  color: #6c757d;
  line-height: 1.3;
}

.menu-arrow {
  color: #9ca3af;
  font-size: 1.125rem;
  flex-shrink: 0;
}

@media (max-width: 576px) {
  .menu-item {
    padding: 0.875rem;
  }

  .menu-icon {
    width: 42px;
    height: 42px;
  }

  .menu-icon i {
    font-size: 1.125rem;
  }

  .menu-title {
    font-size: 0.9375rem;
  }

  .menu-subtitle {
    font-size: 0.75rem;
  }
}
</style>
