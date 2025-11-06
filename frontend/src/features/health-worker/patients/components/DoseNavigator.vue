<template>
  <div
    v-if="doses.length > 0"
    class="dose-navigator"
  >
    <div
      v-for="dose in doses"
      :key="dose.immunization_id || dose.id"
      class="dose-pill"
      :class="{ active: String(dose.immunization_id || dose.id) === String(currentDoseId) }"
      role="button"
      tabindex="0"
      @click="$emit('jump-to-dose', dose.immunization_id || dose.id)"
    >
      <div class="dose-label">
        Dose {{ dose.dose_number || dose.dose || dose.doseNumber || '—' }}
      </div>
      <div class="dose-date">
        {{ formatDate(dose) }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  doses: {
    type: Array,
    default: () => []
  },
  currentDoseId: {
    type: [String, Number],
    required: true
  },
  formatDate: {
    type: Function,
    required: true
  }
})

defineEmits(['jump-to-dose'])
</script>

<style scoped>
.dose-navigator {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  flex-wrap: wrap;
}

.dose-pill {
  flex: 0 0 auto;
  padding: 0.75rem 1rem;
  border: 2px solid #dee2e6;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-width: 100px;
}

.dose-pill:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.15);
}

.dose-pill.active {
  border-color: #007bff;
  background: #007bff;
  color: white;
}

.dose-label {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.dose-date {
  font-size: 0.75rem;
  opacity: 0.8;
}

.dose-pill.active .dose-label,
.dose-pill.active .dose-date {
  color: white;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .dose-navigator {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .dose-pill {
    min-width: 85px;
    padding: 0.5rem 0.75rem;
  }
  
  .dose-label {
    font-size: 0.85rem;
  }
  
  .dose-date {
    font-size: 0.7rem;
  }
}
</style>
