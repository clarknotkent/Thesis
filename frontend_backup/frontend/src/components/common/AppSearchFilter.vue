<template>
  <div class="row g-3 mb-4">
    <div class="col-md-4">
      <div class="input-group">
        <span class="input-group-text bg-light border-end-0">
          <i class="bi bi-search"></i>
        </span>
        <input 
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          type="text" 
          class="form-control border-start-0" 
          :placeholder="searchPlaceholder"
        />
      </div>
    </div>
    <div v-for="filter in filters" :key="filter.key" class="col-md-3">
      <select 
        :value="filter.value"
        @change="$emit('filter-change', filter.key, $event.target.value)"
        class="form-select"
      >
        <option v-for="option in filter.options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    <div class="col-md-2">
      <AppButton variant="primary" block @click="$emit('apply-filters')">
        Filter
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import AppButton from './AppButton.vue'

defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  },
  filters: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update:searchQuery', 'filter-change', 'apply-filters'])
</script>
