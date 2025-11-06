<template>
  <div class="detail-card mb-3">
    <div
      class="card-header dropdown-header"
      @click="toggleExpanded"
    >
      <h6 class="mb-0 d-flex justify-content-between align-items-center">
        <span>Parent Information</span>
        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" />
      </h6>
    </div>
    <div
      v-show="isExpanded"
      class="card-body"
    >
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Mother's Name</span>
          <span class="info-value">{{ patient.motherInfo.name || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Mother's Occupation</span>
          <span class="info-value">{{ patient.motherInfo.occupation || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Mother's Contact</span>
          <span class="info-value">{{ patient.motherInfo.phone || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Father's Name</span>
          <span class="info-value">{{ patient.fatherInfo.name || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Father's Occupation</span>
          <span class="info-value">{{ patient.fatherInfo.occupation || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Father's Contact</span>
          <span class="info-value">{{ patient.fatherInfo.phone || 'N/A' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  patient: {
    type: Object,
    required: true
  },
  initialExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])

const isExpanded = ref(props.initialExpanded)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  emit('toggle', isExpanded.value)
}

defineExpose({
  isExpanded,
  toggleExpanded
})
</script>

<style scoped>
.detail-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e9ecef;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.dropdown-header {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-header:hover {
  background: #e9ecef;
}

.dropdown-header i {
  color: #6c757d;
  transition: transform 0.2s ease;
}

.card-body {
  padding: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

@media (max-width: 576px) {
  .card-body, .card-header {
    padding: 0.75rem;
  }
  
  .info-value {
    font-size: 0.95rem;
  }
}

@media (min-width: 576px) {
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
