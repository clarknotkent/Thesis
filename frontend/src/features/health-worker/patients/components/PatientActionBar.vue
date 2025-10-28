<template>
  <div class="hw-action-bar">
    <div class="d-flex gap-2 align-items-center">
      <button
        class="btn btn-outline-secondary compact-btn"
        @click="$emit('sort')"
      >
        <i class="bi bi-sort-down"></i>
        Sort
      </button>
      <button
        class="btn btn-info compact-btn"
        @click="$emit('scan')"
      >
        <i class="bi bi-camera"></i>
        Scan
      </button>
      <button
        class="btn btn-primary compact-btn"
        @click="$emit('add')"
      >
        <i class="bi bi-plus-circle"></i>
        + Add
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['sort', 'scan', 'add'])
</script>

<style scoped>
.hw-action-bar {
  margin-bottom: 1rem;
}

.compact-btn {
  white-space: nowrap;
  min-width: 70px;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  flex: 1;
}

.compact-btn i {
  font-size: 1rem;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .compact-btn {
    font-size: 0.8rem;
    padding: 0.3rem 0.6rem;
    min-width: 60px;
  }
  
  .compact-btn i {
    font-size: 0.95rem;
  }
}

@media (max-width: 768px) and (min-width: 577px) {
  .compact-btn {
    font-size: 0.8rem;
    padding: 0.3rem 0.6rem;
    min-width: 65px;
  }
}
</style>
