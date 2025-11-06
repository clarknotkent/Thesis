<template>
  <div class="position-relative">
    <input
      v-model="searchTerm"
      type="text"
      class="form-control"
      :class="{ 'is-invalid': !isValid }"
      :placeholder="'Search and select guardian...'"
      :disabled="disabled"
      :required="required"
      autocomplete="off"
      @focus="showDropdown = true"
      @blur="hideDropdown"
    >
    
    <!-- Dropdown Menu -->
    <div 
      v-if="showDropdown && filteredGuardians.length > 0" 
      class="dropdown-menu show w-100 position-absolute" 
      style="max-height: 300px; overflow-y: auto; z-index: 1000;"
    >
      <div 
        v-for="guardian in filteredGuardians" 
        :key="guardian.guardian_id" 
        class="dropdown-item cursor-pointer d-flex justify-content-between align-items-center" 
        @mousedown="selectGuardian(guardian)"
      >
        <div>
          <strong>{{ guardian.full_name }}</strong>
          <br>
          <small class="text-muted">
            <i class="bi bi-telephone me-1" />{{ guardian.contact_number || 'No contact' }} 
            | 
            <i class="bi bi-people me-1" />Family: {{ guardian.family_number || 'N/A' }}
          </small>
        </div>
        <span class="badge bg-primary">Guardian</span>
      </div>
    </div>
    
    <!-- No Results Message -->
    <div 
      v-if="showDropdown && searchTerm && filteredGuardians.length === 0" 
      class="dropdown-menu show w-100 position-absolute" 
      style="z-index: 1000;"
    >
      <div class="dropdown-item-text text-muted text-center py-3">
        <i class="bi bi-search" />
        No guardians found matching "{{ searchTerm }}"
      </div>
    </div>
    
    <div
      v-if="!isValid"
      class="invalid-feedback"
    >
      Please select a guardian
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  guardians: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: [Number, String],
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: true
  },
  isValid: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'guardian-selected'])

const searchTerm = ref('')
const showDropdown = ref(false)
const selectedGuardianName = ref('')

const filteredGuardians = computed(() => {
  if (!searchTerm.value) return props.guardians
  
  const term = searchTerm.value.toLowerCase()
  return props.guardians.filter(g => 
    g.full_name?.toLowerCase().includes(term) ||
    g.contact_number?.includes(term) ||
    g.family_number?.includes(term)
  )
})

const selectGuardian = (guardian) => {
  selectedGuardianName.value = guardian.full_name
  // Keep the selected name in the input so native required validation passes
  searchTerm.value = guardian.full_name
  showDropdown.value = false
  
  emit('update:modelValue', guardian.guardian_id)
  emit('guardian-selected', guardian)
}

const hideDropdown = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

// Watch for external changes to modelValue (e.g., when editing)
watch(() => props.modelValue, (newVal) => {
  if (newVal && props.guardians.length > 0) {
    const guardian = props.guardians.find(g => g.guardian_id === newVal)
    if (guardian) {
      selectedGuardianName.value = guardian.full_name
      // Reflect externally selected guardian in the input box value
      searchTerm.value = guardian.full_name
    }
  } else {
    selectedGuardianName.value = ''
    searchTerm.value = ''
  }
}, { immediate: true })
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}
</style>
