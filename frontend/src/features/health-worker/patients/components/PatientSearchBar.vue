<template>
  <div class="hw-patient-search">
    <div class="input-group">
      <span class="input-group-text">
        <i class="bi bi-search" />
      </span>
      <input 
        type="text" 
        class="form-control" 
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      >
      <button 
        v-if="modelValue"
        type="button"
        class="btn btn-clear"
        @click="$emit('update:modelValue', '')"
      >
        <i class="bi bi-x-circle-fill" />
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search patients...'
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.hw-patient-search {
  margin-bottom: 1rem;
}

.input-group {
  position: relative;
}

.input-group-text {
  background-color: #f8f9fa;
  border-right: none;
  color: #6c757d;
}

.form-control {
  border-left: none;
  padding-right: 2.5rem;
}

.form-control:focus {
  border-color: #ced4da;
  box-shadow: none;
}

.form-control:focus + .input-group-text {
  border-color: #ced4da;
}

.btn-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: transparent;
  border: none;
  color: #6c757d;
  padding: 0.25rem 0.5rem;
  font-size: 1.25rem;
  line-height: 1;
  transition: color 0.2s ease;
}

.btn-clear:hover {
  color: #495057;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .input-group-text,
  .form-control {
    font-size: 0.95rem;
    height: 44px;
  }
  
  .btn-clear {
    font-size: 1.15rem;
  }
}
</style>
