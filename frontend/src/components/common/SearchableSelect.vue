<template>
  <div class="searchable-select-wrapper" ref="wrapperRef">
    <div class="input-group">
      <input
        ref="inputRef"
        type="text"
        :class="inputClass"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        v-model="searchTerm"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        autocomplete="off"
      />
      <button
        v-if="!hideDropdownIcon"
        class="btn btn-outline-secondary dropdown-toggle"
        type="button"
        :disabled="disabled"
        @click="toggleDropdown"
        @mousedown.prevent
      ></button>
    </div>
    
    <!-- Dropdown List -->
    <div
      v-if="showDropdown"
      class="dropdown-list card shadow-sm"
      ref="dropdownRef"
    >
      <div v-if="filteredOptions.length > 0" class="list-group list-group-flush">
        <button
          v-for="(option, index) in filteredOptions"
          :key="getOptionValue(option)"
          type="button"
          class="list-group-item list-group-item-action"
          :class="{ 'active': index === selectedIndex }"
          @click="selectOption(option)"
          @mousedown.prevent
          @mouseover="selectedIndex = index"
        >
          {{ getOptionLabel(option) }}
        </button>
      </div>
      <div v-else class="p-3 text-muted text-center">
        <small>{{ allowCustom ? 'Type to add new or select from list' : 'No options found' }}</small>
      </div>
      
      <div v-if="allowCustom && searchTerm && !exactMatch" class="p-2 border-top">
        <button
          type="button"
          class="btn btn-sm btn-outline-primary w-100"
          @click="addCustomOption"
          @mousedown.prevent
        >
          <i class="bi bi-plus-circle me-1"></i>
          Add "{{ searchTerm }}"
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Object],
    default: ''
  },
  options: {
    type: Array,
    required: true,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Search or select...'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  inputClass: {
    type: String,
    default: 'form-control'
  },
  allowCustom: {
    type: Boolean,
    default: false
  },
  hideDropdownIcon: {
    type: Boolean,
    default: false
  },
  // For object options: specify which property to use as label
  labelKey: {
    type: String,
    default: 'label'
  },
  // For object options: specify which property to use as value
  valueKey: {
    type: String,
    default: 'value'
  },
  // Return the full object instead of just the value
  returnObject: {
    type: Boolean,
    default: false
  },
  // Limit number of options shown; set to 0 or negative to show all
  maxResults: {
    type: Number,
    default: 50
  }
})

const emit = defineEmits(['update:modelValue', 'add-custom'])

const wrapperRef = ref(null)
const inputRef = ref(null)
const dropdownRef = ref(null)
const searchTerm = ref('')
const showDropdown = ref(false)
const selectedIndex = ref(-1)

// Get option label (handle both string and object options)
const getOptionLabel = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return String(option)
  }
  // Handle nested properties (e.g., "childInfo.name")
  if (props.labelKey.includes('.')) {
    const keys = props.labelKey.split('.')
    let value = option
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) break
    }
    return value ? String(value) : String(option)
  }
  return option[props.labelKey] || String(option)
}

// Get option value (handle both string and object options)
const getOptionValue = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return option
  }
  // Handle nested properties (e.g., "id.value")
  if (props.valueKey.includes('.')) {
    const keys = props.valueKey.split('.')
    let value = option
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) break
    }
    return value !== undefined ? value : option
  }
  return option[props.valueKey] !== undefined ? option[props.valueKey] : option
}

// Filter options based on search term
const filteredOptions = computed(() => {
  const limit = Number.isFinite(props.maxResults) ? props.maxResults : 50
  if (!searchTerm.value) {
    return limit > 0 ? props.options.slice(0, limit) : props.options
  }

  const term = searchTerm.value.toLowerCase()
  const filtered = props.options.filter(option => {
    const label = getOptionLabel(option).toLowerCase()
    return label.includes(term)
  })
  return limit > 0 ? filtered.slice(0, limit) : filtered
})

// Check if there's an exact match
const exactMatch = computed(() => {
  if (!searchTerm.value) return false
  const term = searchTerm.value.toLowerCase()
  return filteredOptions.value.some(option => 
    getOptionLabel(option).toLowerCase() === term
  )
})

// Helper function to update search term
const updateSearchTerm = (newVal) => {
  if (!newVal) {
    searchTerm.value = ''
    return
  }
  
  // Find the option that matches the value
  const matchingOption = props.options.find(option => {
    const optionValue = getOptionValue(option)
    if (props.returnObject) {
      return JSON.stringify(optionValue) === JSON.stringify(newVal)
    }
    return optionValue === newVal
  })
  
  if (matchingOption) {
    searchTerm.value = getOptionLabel(matchingOption)
  } else if (typeof newVal === 'string' || typeof newVal === 'number') {
    searchTerm.value = String(newVal)
  }
}

// Initialize search term from model value
watch(() => props.modelValue, (newVal) => {
  updateSearchTerm(newVal)
}, { immediate: true })

// Also watch for options changes to update display when options are loaded
watch(() => props.options, () => {
  updateSearchTerm(props.modelValue)
}, { immediate: true })

const handleInput = () => {
  if (!showDropdown.value) {
    showDropdown.value = true
  }
  selectedIndex.value = -1
}

const handleFocus = () => {
  showDropdown.value = true
}

const handleBlur = () => {
  // Delay to allow click events on dropdown items
  setTimeout(() => {
    showDropdown.value = false
    
    // If no exact match and not allowing custom, revert to previous value
    if (!exactMatch.value && !props.allowCustom && searchTerm.value) {
      const previousOption = props.options.find(option => 
        getOptionValue(option) === props.modelValue
      )
      if (previousOption) {
        searchTerm.value = getOptionLabel(previousOption)
      } else {
        searchTerm.value = ''
        emit('update:modelValue', '')
      }
    } else if (props.allowCustom && searchTerm.value && !exactMatch.value) {
      // Emit custom value
      emit('update:modelValue', searchTerm.value)
    } else if (!searchTerm.value) {
      emit('update:modelValue', '')
    }
  }, 200)
}

const handleKeydown = (e) => {
  if (!showDropdown.value) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      showDropdown.value = true
      e.preventDefault()
    }
    return
  }
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredOptions.value.length - 1)
      scrollToSelected()
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      scrollToSelected()
      break
    case 'Enter':
      e.preventDefault()
      if (selectedIndex.value >= 0 && filteredOptions.value[selectedIndex.value]) {
        selectOption(filteredOptions.value[selectedIndex.value])
      } else if (props.allowCustom && searchTerm.value) {
        addCustomOption()
      }
      break
    case 'Escape':
      e.preventDefault()
      showDropdown.value = false
      inputRef.value?.blur()
      break
  }
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    inputRef.value?.focus()
  }
}

const selectOption = (option) => {
  searchTerm.value = getOptionLabel(option)
  const value = props.returnObject ? option : getOptionValue(option)
  emit('update:modelValue', value)
  showDropdown.value = false
  selectedIndex.value = -1
}

const addCustomOption = () => {
  const customValue = searchTerm.value.trim()
  if (!customValue) return
  
  emit('add-custom', customValue)
  emit('update:modelValue', customValue)
  showDropdown.value = false
  selectedIndex.value = -1
}

const scrollToSelected = () => {
  if (dropdownRef.value && selectedIndex.value >= 0) {
    const items = dropdownRef.value.querySelectorAll('.list-group-item')
    if (items[selectedIndex.value]) {
      items[selectedIndex.value].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }
}

// Click outside to close dropdown
const handleClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.searchable-select-wrapper {
  position: relative;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 2px;
}

.list-group-item {
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border: none;
  border-bottom: 1px solid #dee2e6;
}

.list-group-item:last-child {
  border-bottom: none;
}

.list-group-item:hover,
.list-group-item.active {
  background-color: #e9ecef;
  color: #000;
}

.list-group-item.active {
  font-weight: 500;
}
</style>
