<template>
  <div class="search-row d-flex align-items-center gap-3 mb-4 flex-wrap">
    <!-- Search input grows to fill available space -->
    <div class="input-wrap min-w-0">
      <div class="input-group">
        <span class="input-group-text bg-light border-end-0">
          <i class="bi bi-search"></i>
        </span>
        <input
          :value="searchQuery"
          @input="onInput($event.target.value)"
          type="text"
          class="form-control border-start-0"
          :placeholder="effectivePlaceholder"
        />
      </div>
    </div>

    <!-- Filters: keep a sensible min width so they don't collapse too small -->
    <div class="filters d-flex align-items-center" v-if="filters && filters.length">
      <div v-for="filter in filters" :key="filter.key" class="filter-item" style="min-width:160px">
        <select
          v-model="localFilters[filter.key]"
          @change="onFilterChange(filter.key, $event.target.value)"
          class="form-select"
        >
          <option v-for="option in filter.options" :key="option.value" :value="option.value">
            {{ option.text || option.label || option.value }}
          </option>
        </select>
      </div>
    </div>

    <!-- Actions: Filter button and optional Scan QR stay to the right and don't grow -->
    <div class="actions d-flex align-items-center ms-auto gap-2">
      <AppButton variant="primary" @click="applyFilters">
        Filter
      </AppButton>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import AppButton from './AppButton.vue'

import { reactive, toRefs } from 'vue'

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  // accept either 'searchPlaceholder' or 'placeholder' for flexibility
  searchPlaceholder: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  filters: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:searchQuery', 'filter-change', 'apply-filters', 'search'])

// local copy of filter values
const localFilters = reactive({})
props.filters.forEach(f => {
  localFilters[f.key] = f.options && f.options[0] ? f.options[0].value : ''
})

const onInput = (val) => {
  emit('update:searchQuery', val)
  emit('search', val, { ...localFilters })
}

const effectivePlaceholder = props.placeholder || props.searchPlaceholder

const onFilterChange = (key, value) => {
  localFilters[key] = value
  emit('filter-change', key, value)
  emit('search', props.searchQuery, { ...localFilters })
}

const applyFilters = () => {
  emit('apply-filters')
  emit('search', props.searchQuery, { ...localFilters })
}

</script>
