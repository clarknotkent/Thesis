<template>
  <div class="search-container mb-4">
    <div class="input-group mb-3">
      <span class="input-group-text">
        <i class="bi bi-search" />
      </span>
      <input 
        type="text" 
        class="form-control" 
        placeholder="Search vaccines..."
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      >
      <select 
        class="form-select search-filter" 
        :value="statusFilter"
        @change="$emit('update:statusFilter', $event.target.value)"
      >
        <option value="">
          All Status
        </option>
        <option value="Available">
          Available
        </option>
        <option value="Low Stock">
          Low Stock
        </option>
        <option value="Out of Stock">
          Out of Stock
        </option>
        <option value="Expiring Soon">
          Expiring Soon
        </option>
        <option value="Expired">
          Expired
        </option>
      </select>
    </div>
    
    <!-- NIP Filter Toggle Button -->
    <div class="d-flex justify-content-center">
      <button 
        class="btn filter-toggle-btn"
        :class="{
          'btn-primary': nipFilter === 'nip',
          'btn-info': nipFilter === 'other', 
          'btn-outline-secondary': nipFilter === 'all'
        }"
        @click="$emit('toggle-nip-filter')"
      >
        <i
          :class="getNipFilterIcon()"
          class="me-2"
        />
        {{ getNipFilterText() }}
        <i class="bi bi-arrow-repeat ms-2" />
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  statusFilter: {
    type: String,
    default: ''
  },
  nipFilter: {
    type: String,
    default: 'all'
  }
})

defineEmits(['update:modelValue', 'update:statusFilter', 'toggle-nip-filter'])

const getNipFilterText = () => {
  switch (props.nipFilter) {
    case 'nip': return 'NIP Only'
    case 'other': return 'Other Vaccines'
    default: return 'All Vaccines'
  }
}

const getNipFilterIcon = () => {
  switch (props.nipFilter) {
    case 'nip': return 'bi-shield-check'
    case 'other': return 'bi-capsule'
    default: return 'bi-collection'
  }
}
</script>

<style scoped>
.search-container {
  padding: 0.5rem 0;
}

.search-filter {
  max-width: 140px;
  border-left: 0;
}

.filter-toggle-btn {
  border-radius: 1.5rem;
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.filter-toggle-btn:active {
  transform: translateY(0);
}

.filter-toggle-btn i:last-child {
  opacity: 0.7;
  font-size: 0.85rem;
}

@media (max-width: 576px) {
  .search-filter {
    max-width: 120px;
  }
  
  .filter-toggle-btn {
    padding: 0.4rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
