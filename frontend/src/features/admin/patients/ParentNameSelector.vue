<template>
  <div class="position-relative">
    <input
      type="text"
      class="form-control"
      v-model="searchTerm"
      @focus="showDropdown = true"
      @blur="hideDropdown"
      :placeholder="placeholder || 'Search and select...'"
      :disabled="disabled"
      :required="required"
      autocomplete="off"
    />

    <!-- Dropdown Menu -->
    <div
      v-if="showDropdown && filteredOptions.length > 0"
      class="dropdown-menu show w-100 position-absolute"
      style="max-height: 300px; overflow-y: auto; z-index: 1000;"
    >
      <div
        v-for="(opt, idx) in filteredOptions"
        :key="optKey(opt, idx)"
        class="dropdown-item cursor-pointer d-flex justify-content-between align-items-center"
        @mousedown="selectOption(opt)"
      >
        <div>
          <strong>{{ displayName(opt) }}</strong>
          <br>
          <small class="text-muted">
            <i class="bi bi-telephone me-1"></i>{{ opt.contact_number || 'No contact' }}
          </small>
        </div>
        <span class="badge bg-secondary">Parent</span>
      </div>
    </div>

    <div
      v-if="showDropdown && filteredOptions.length === 0"
      class="dropdown-menu show w-100 position-absolute"
      style="z-index: 1000;"
    >
      <div class="dropdown-item-text text-muted text-center py-3">
        <i class="bi bi-search"></i>
        No matches
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  options: { type: Array, default: () => [] },
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'selected'])

const searchTerm = ref('')
const showDropdown = ref(false)

const normalize = (v) => (v ?? '').toString().trim().toLowerCase()

const displayName = (opt) => {
  const parts = []
  if (opt?.firstname) parts.push(opt.firstname)
  if (opt?.middlename) parts.push(opt.middlename)
  if (opt?.surname) parts.push(opt.surname)
  const name = parts.join(' ').trim()
  return name || opt?.full_name || ''
}

const filteredOptions = computed(() => {
  const term = normalize(searchTerm.value)
  if (!term) return props.options
  return props.options.filter(o => {
    const name = normalize(displayName(o))
    const phone = normalize(o.contact_number)
    return name.includes(term) || phone.includes(term)
  })
})

const selectOption = (opt) => {
  const name = displayName(opt)
  searchTerm.value = name
  showDropdown.value = false
  emit('update:modelValue', name)
  emit('selected', opt)
}

const hideDropdown = () => {
  setTimeout(() => { showDropdown.value = false }, 200)
}

// Reflect external v-model into input
watch(() => props.modelValue, (v) => {
  searchTerm.value = v || ''
}, { immediate: true })

const optKey = (opt, idx) => opt.guardian_id ?? opt.user_id ?? opt.full_name ?? idx
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.dropdown-item:hover { background-color: #f8f9fa; }
</style>
