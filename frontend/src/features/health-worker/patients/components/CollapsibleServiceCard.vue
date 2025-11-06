<template>
  <div class="collapsible-service-card">
    <!-- Card Header -->
    <div
      class="card-header"
      @click="toggleExpanded"
    >
      <div class="header-content">
        <i class="bi bi-check-circle-fill" />
        <h2>Services Provided</h2>
      </div>
      <div
        class="chevron-icon"
        :class="{ expanded: isExpanded }"
      >
        <i class="bi bi-chevron-down" />
      </div>
    </div>

    <!-- Card Body -->
    <transition name="expand">
      <div
        v-if="isExpanded"
        class="card-body"
      >
        <div
          v-for="(service, index) in services"
          :key="index"
          class="service-item"
        >
          <div class="service-icon">
            <i class="bi bi-shield-check" />
          </div>
          <div class="service-content">
            <h3 class="service-name">
              {{ service.vaccine_name || service.antigen_name || 'Unknown Vaccine' }}
            </h3>
            <div class="service-details">
              <span class="service-badge">Vaccination</span>
              <span class="service-dose">Dose {{ service.dose_number || 'N/A' }}</span>
              <span class="service-dot">•</span>
              <span class="service-date">{{ formatDate(service.administered_date) }}</span>
              <span
                v-if="service.outside"
                class="outside-badge"
              >
                <i class="bi bi-house-door" />
                Outside Facility
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  services: {
    type: Array,
    default: () => []
  },
  initialExpanded: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['toggle'])

const isExpanded = ref(props.initialExpanded)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  emit('toggle')
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.collapsible-service-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s;
}

.card-header:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.header-content i {
  font-size: 1.5rem;
}

.header-content h2 {
  font-size: 1.0625rem;
  font-weight: 600;
  margin: 0;
}

.chevron-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #ffffff;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.chevron-icon i {
  font-size: 1.25rem;
}

.chevron-icon.expanded {
  transform: rotate(180deg);
}

/* Card Body */
.card-body {
  padding: 1.5rem;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

/* Expand Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
}

/* Service Item */
.service-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 0.75rem;
  border: 1px solid #bbf7d0;
}

.service-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #10b981;
  color: #ffffff;
  border-radius: 0.625rem;
  flex-shrink: 0;
}

.service-icon i {
  font-size: 1.5rem;
}

.service-content {
  flex: 1;
  min-width: 0;
}

.service-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.service-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: #6b7280;
}

.service-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: #10b981;
  color: #ffffff;
  border-radius: 0.375rem;
  font-weight: 600;
}

.service-dose {
  font-weight: 500;
}

.service-dot {
  color: #d1d5db;
}

.service-date {
  font-weight: 500;
}

.outside-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 0.375rem;
  font-weight: 600;
}

.outside-badge i {
  font-size: 0.75rem;
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .card-header {
    padding: 1rem;
  }

  .card-body {
    padding: 1rem;
    gap: 0.875rem;
  }

  .header-content h2 {
    font-size: 1rem;
  }

  .service-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .service-icon {
    width: 36px;
    height: 36px;
  }

  .service-icon i {
    font-size: 1.25rem;
  }

  .service-name {
    font-size: 0.875rem;
  }

  .service-details {
    font-size: 0.6875rem;
  }
}
</style>
