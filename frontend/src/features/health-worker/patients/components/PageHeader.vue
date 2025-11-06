<template>
  <div class="page-header">
    <!-- Page Title Bar -->
    <div class="page-title-bar">
      <i :class="`bi bi-${icon}`" />
      <h1 class="page-title">
        {{ title }}
      </h1>
    </div>

    <!-- Action Toolbar -->
    <div class="action-toolbar">
      <button 
        class="toolbar-btn filter-btn"
        :class="{ active: hasActiveFilters }"
        @click="$emit('filter')"
      >
        <i class="bi bi-funnel" />
      </button>

      <div class="search-container">
        <i class="bi bi-search search-icon" />
        <input
          type="text"
          class="search-input"
          :placeholder="searchPlaceholder"
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
        >
      </div>

      <button 
        class="toolbar-btn scan-btn"
        @click="$emit('scan')"
      >
        <i class="bi bi-qr-code-scan" />
      </button>

      <button 
        class="toolbar-btn add-btn"
        @click="$emit('add')"
      >
        <i class="bi bi-plus-lg" />
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: 'folder'
  },
  title: {
    type: String,
    required: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  },
  searchQuery: {
    type: String,
    default: ''
  },
  hasActiveFilters: {
    type: Boolean,
    default: false
  }
})

defineEmits(['filter', 'scan', 'add', 'update:searchQuery'])
</script>

<style scoped>
.page-header {
  background: #ffffff;
  position: fixed;
  top: 56px; /* Below TopNavbar */
  left: 0;
  right: 0;
  z-index: 900;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.page-title-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1rem 0.75rem;
  background: #ffffff;
}

.page-title-bar i {
  font-size: 1.5rem;
  color: #007bff;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.action-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem 1rem;
}

.toolbar-btn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  color: #6b7280;
  font-size: 1.25rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.toolbar-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
  color: #374151;
}

.toolbar-btn:active {
  transform: scale(0.95);
}

.filter-btn.active {
  background: #007bff;
  border-color: #007bff;
  color: #ffffff;
}

.add-btn {
  background: #007bff;
  border-color: #007bff;
  color: #ffffff;
}

.add-btn:hover {
  background: #0056b3;
  border-color: #0056b3;
  color: #ffffff;
}

.search-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #9ca3af;
  font-size: 1rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 1rem 0 2.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f9fafb;
  font-size: 0.9375rem;
  color: #1f2937;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:focus {
  outline: none;
  background: #ffffff;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

/* Mobile optimization */
@media (max-width: 576px) {
  .page-title-bar {
    padding: 0.875rem 1rem 0.625rem;
  }

  .page-title {
    font-size: 1.125rem;
  }

  .action-toolbar {
    gap: 0.375rem;
    padding: 0.625rem 1rem 0.875rem;
  }

  .toolbar-btn {
    width: 40px;
    height: 40px;
    font-size: 1.125rem;
  }

  .search-input {
    height: 40px;
    font-size: 0.875rem;
  }
}
</style>
