<template>
  <div>
    <h6 class="mb-2">Vital Signs</h6>
    <div class="row g-3">
      <div class="col-md-4">
        <label class="form-label">Temperature (°C)</label>
        <input 
          type="number" 
          step="0.1" 
          class="form-control" 
          :value="vitals.temperature" 
          @input="$emit('update:vitals', { ...vitals, temperature: $event.target.value })"
          :disabled="disabled"
        >
      </div>
      <div class="col-md-4">
        <label class="form-label">MUAC (cm)</label>
        <input 
          type="number" 
          step="0.1" 
          class="form-control" 
          :value="vitals.muac" 
          @input="$emit('update:vitals', { ...vitals, muac: $event.target.value })"
          :disabled="disabled"
        >
      </div>
      <div class="col-md-4">
        <label class="form-label">Respiration (breaths/min)</label>
        <input 
          type="number" 
          class="form-control" 
          :value="vitals.respiration" 
          @input="$emit('update:vitals', { ...vitals, respiration: $event.target.value })"
          :disabled="disabled"
        >
      </div>
      <div class="col-md-4">
        <label class="form-label">Weight (kg)</label>
        <input 
          type="number" 
          step="0.01" 
          class="form-control" 
          :value="vitals.weight" 
          @input="$emit('update:vitals', { ...vitals, weight: $event.target.value })"
          :disabled="disabled"
        >
      </div>
      <div class="col-md-4">
        <label class="form-label">Height (cm)</label>
        <input 
          type="number" 
          step="0.1" 
          class="form-control" 
          :value="vitals.height" 
          @input="$emit('update:vitals', { ...vitals, height: $event.target.value })"
          :disabled="disabled"
        >
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  vitals: {
    type: Object,
    required: true,
    default: () => ({
      temperature: '',
      muac: '',
      respiration: '',
      weight: '',
      height: ''
    })
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:vitals']);
</script>
