<template>
  <teleport to="body">
    <transition name="filter-sheet">
      <div
        v-if="show"
        class="filter-sheet-overlay"
        @click="close"
      >
        <div
          class="filter-sheet"
          @click.stop
        >
          <!-- Header -->
          <div class="filter-header">
            <h3 class="filter-title">
              Filters
            </h3>
            <button
              class="close-btn"
              @click="close"
            >
              <i class="bi bi-x-lg" />
            </button>
          </div>

          <!-- Filter Content -->
          <div class="filter-content">
            <!-- Sort By -->
            <div class="filter-section">
              <label class="filter-label">Sort By</label>
              <select
                v-model="filters.sortBy"
                class="filter-select"
              >
                <option value="name_asc">
                  Name (A-Z)
                </option>
                <option value="name_desc">
                  Name (Z-A)
                </option>
                <option value="age_asc">
                  Age (Youngest First)
                </option>
                <option value="age_desc">
                  Age (Oldest First)
                </option>
                <option value="date_asc">
                  Date Registered (Oldest)
                </option>
                <option value="date_desc">
                  Date Registered (Newest)
                </option>
              </select>
            </div>

            <!-- Gender Filter -->
            <div class="filter-section">
              <label class="filter-label">Gender</label>
              <div class="filter-options">
                <label class="filter-option">
                  <input
                    v-model="filters.gender"
                    type="radio"
                    value=""
                  >
                  <span>All</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.gender"
                    type="radio"
                    value="Male"
                  >
                  <span>Male</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.gender"
                    type="radio"
                    value="Female"
                  >
                  <span>Female</span>
                </label>
              </div>
            </div>

            <!-- Status Filter -->
            <div class="filter-section">
              <label class="filter-label">Status</label>
              <div class="filter-options">
                <label class="filter-option">
                  <input
                    v-model="filters.statuses"
                    type="checkbox"
                    value="All Status"
                  >
                  <span>All Status</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.statuses"
                    type="checkbox"
                    value="Active"
                  >
                  <span>Active</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.statuses"
                    type="checkbox"
                    value="Inactive"
                  >
                  <span>Inactive</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.statuses"
                    type="checkbox"
                    value="Vaccination Due"
                  >
                  <span>Vaccination Due</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.statuses"
                    type="checkbox"
                    value="Up to Date"
                  >
                  <span>Up to Date</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.statuses"
                    type="checkbox"
                    value="FIC"
                  >
                  <span>FIC</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.statuses"
                    type="checkbox"
                    value="CIC"
                  >
                  <span>CIC</span>
                </label>
                <label class="filter-option">
                  <input
                    v-model="filters.statuses"
                    type="checkbox"
                    value="Defaulter"
                  >
                  <span>Defaulter</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="filter-footer">
            <button
              class="btn-clear"
              @click="clearFilters"
            >
              Clear All
            </button>
            <button
              class="btn-apply"
              @click="applyFilters"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:show', 'update:modelValue', 'apply'])

const filters = ref({
  sortBy: 'name_asc',
  gender: '',
  statuses: []
})

// Initialize filters from modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    filters.value = { ...newValue }
  }
}, { immediate: true, deep: true })

const close = () => {
  emit('update:show', false)
}

const clearFilters = () => {
  filters.value = {
    sortBy: 'name_asc',
    gender: '',
    statuses: []
  }
}

const applyFilters = () => {
  emit('update:modelValue', { ...filters.value })
  emit('apply', { ...filters.value })
  close()
}
</script>

<style scoped>
.filter-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
}

.filter-sheet {
  background: white;
  width: 100%;
  max-height: 85vh;
  border-radius: 1.25rem 1.25rem 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.filter-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.filter-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.filter-section {
  margin-bottom: 2rem;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-label {
  display: block;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.2s ease;
}

.filter-option:hover {
  background: #f9fafb;
}

.filter-option input[type="checkbox"],
.filter-option input[type="radio"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.filter-option span {
  font-size: 0.9375rem;
  color: #1f2937;
}

.filter-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #1f2937;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.filter-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.btn-clear,
.btn-apply {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-clear {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-clear:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-apply {
  background: #007bff;
  color: white;
}

.btn-apply:hover {
  background: #0056b3;
}

/* Animations */
.filter-sheet-enter-active,
.filter-sheet-leave-active {
  transition: all 0.3s ease;
}

.filter-sheet-enter-from .filter-sheet,
.filter-sheet-leave-to .filter-sheet {
  transform: translateY(100%);
}

.filter-sheet-enter-from,
.filter-sheet-leave-to {
  opacity: 0;
}
</style>
