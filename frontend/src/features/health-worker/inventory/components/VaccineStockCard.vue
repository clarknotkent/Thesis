<template>
  <div 
    class="vaccine-item clickable"
    @click="$emit('click', vaccine.id)"
  >
    <div class="d-flex justify-content-between align-items-start">
      <div class="vaccine-info">
        <h6 class="vaccine-name mb-1">{{ vaccine.vaccineName }}</h6>
        <p class="vaccine-details mb-0">
          {{ vaccine.manufacturer }} • {{ vaccine.quantity }} doses
        </p>
      </div>
      <div class="d-flex align-items-center">
        <span class="badge me-2" :class="getStatusBadgeClass(vaccine.status)">
          {{ vaccine.status }}
        </span>
        <i class="bi bi-chevron-right text-muted" style="font-size: 0.9rem;"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  vaccine: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Available': return 'bg-success'
    case 'Low Stock': return 'bg-warning text-dark'
    case 'Out of Stock': return 'bg-danger'
    case 'Expiring Soon': return 'bg-danger'
    case 'Expired': return 'bg-dark'
    default: return 'bg-secondary'
  }
}
</script>

<style scoped>
.vaccine-item {
  background: white;
  border: 1px solid #e9ecef;
  border-bottom: 0;
  padding: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.vaccine-item.clickable:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.vaccine-item.clickable:active {
  background-color: #e9ecef;
  transform: translateY(0);
}

.vaccine-item:first-child {
  border-radius: 0.5rem 0.5rem 0 0;
}

.vaccine-item:last-child {
  border-bottom: 1px solid #e9ecef;
  border-radius: 0 0 0.5rem 0.5rem;
}

.vaccine-item:only-child {
  border-radius: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.vaccine-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.vaccine-details {
  color: #6c757d;
  font-size: 0.875rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

@media (max-width: 576px) {
  .vaccine-item {
    padding: 0.875rem;
    -webkit-tap-highlight-color: rgba(0, 123, 255, 0.1);
  }
  
  .vaccine-item.clickable:active {
    background-color: rgba(0, 123, 255, 0.1);
  }
  
  .vaccine-name {
    font-size: 0.95rem;
  }
  
  .vaccine-details {
    font-size: 0.8rem;
  }
}
</style>
