<template>
  <div class="form-section vitals-section">
    <h3 class="section-title">
      <i class="bi bi-heart-pulse-fill" />
      Vital Signs
    </h3>
    
    <div
      v-if="readonly"
      class="form-hint readonly-notice"
    >
      <i class="bi bi-info-circle" />
      Vitals prefilled from selected visit — read-only
    </div>

    <div class="vitals-grid">
      <div class="form-group">
        <label class="form-label">Temperature (°C)</label>
        <input 
          type="number" 
          step="0.1" 
          class="form-input" 
          :value="modelValue.temperature"
          placeholder="e.g., 36.5"
          :readonly="readonly"
          :disabled="readonly"
          @input="updateField('temperature', $event.target.value)"
        >
      </div>

      <div class="form-group">
        <label class="form-label">MUAC (cm)</label>
        <input 
          type="number" 
          step="0.1" 
          class="form-input" 
          :value="modelValue.muac"
          placeholder="e.g., 12.5"
          :readonly="readonly"
          :disabled="readonly"
          @input="updateField('muac', $event.target.value)"
        >
      </div>

      <div class="form-group">
        <label class="form-label">Respiration (per min)</label>
        <input 
          type="number" 
          class="form-input" 
          :value="modelValue.respiration"
          placeholder="e.g., 20"
          :readonly="readonly"
          :disabled="readonly"
          @input="updateField('respiration', $event.target.value)"
        >
      </div>

      <div class="form-group">
        <label class="form-label">Weight (kg)</label>
        <input 
          type="number" 
          step="0.1" 
          class="form-input" 
          :value="modelValue.weight"
          placeholder="e.g., 8.5"
          :readonly="readonly"
          :disabled="readonly"
          @input="updateField('weight', $event.target.value)"
        >
      </div>

      <div class="form-group">
        <label class="form-label">Height (cm)</label>
        <input 
          type="number" 
          step="0.1" 
          class="form-input" 
          :value="modelValue.height"
          placeholder="e.g., 75.0"
          :readonly="readonly"
          :disabled="readonly"
          @input="updateField('height', $event.target.value)"
        >
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
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
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}
</script>

<style scoped>
.vitals-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.section-title i {
  color: #ef4444;
  font-size: 1.2rem;
}

.readonly-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.readonly-notice i {
  font-size: 1.1rem;
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .vitals-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1f2937;
  background: white;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled,
.form-input:read-only {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-hint {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.5rem;
}
</style>
