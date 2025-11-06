<template>
  <router-link 
    :to="linkTo || `/parent/dependent/${dependent.id}`" 
    class="dependent-card"
  >
    <div class="card-content">
      <!-- Avatar Icon -->
      <div class="dependent-avatar">
        <i class="bi bi-person-circle" />
      </div>

      <!-- Dependent Info -->
      <div class="dependent-info">
        <h6 class="dependent-name">
          {{ dependent.name }}
        </h6>
        <p class="dependent-age">
          {{ ageText }}
        </p>
        <div
          class="dependent-status"
          :class="statusClass"
        >
          <i :class="statusIcon" />
          <span>{{ dependent.status }}</span>
        </div>
      </div>

      <!-- Chevron Icon -->
      <div class="chevron-icon">
        <i class="bi bi-chevron-right" />
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  dependent: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.id && value.name && value.age !== undefined
    }
  },
  linkTo: {
    type: String,
    default: null
  }
})

const ageText = computed(() => {
  const age = props.dependent.age
  if (age === 1) {
    return '1 year old'
  } else if (age < 1 && age > 0) {
    const months = Math.round(age * 12)
    return `${months} month${months !== 1 ? 's' : ''} old`
  } else {
    return `${age} years old`
  }
})

const statusClass = computed(() => {
  const status = props.dependent.status?.toLowerCase() || ''
  if (status.includes('up-to-date') || status.includes('complete')) {
    return 'status-success'
  } else if (status.includes('due') || status.includes('overdue')) {
    return 'status-warning'
  } else if (status.includes('urgent') || status.includes('missed')) {
    return 'status-danger'
  }
  return 'status-info'
})

const statusIcon = computed(() => {
  const status = props.dependent.status?.toLowerCase() || ''
  if (status.includes('up-to-date') || status.includes('complete')) {
    return 'bi bi-check-circle-fill'
  } else if (status.includes('due') || status.includes('overdue')) {
    return 'bi bi-exclamation-circle-fill'
  } else if (status.includes('urgent') || status.includes('missed')) {
    return 'bi bi-x-circle-fill'
  }
  return 'bi bi-info-circle-fill'
})
</script>

<style scoped>
.dependent-card {
  display: block;
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.dependent-card:hover {
  text-decoration: none;
  color: inherit;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dependent-avatar {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 2.5rem;
}

.dependent-info {
  flex: 1;
  min-width: 0;
}

.dependent-name {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #333;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dependent-age {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #6c757d;
}

.dependent-status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  width: fit-content;
}

.dependent-status i {
  font-size: 0.9rem;
}

.status-success {
  color: #198754;
  background-color: #d1e7dd;
}

.status-warning {
  color: #fd7e14;
  background-color: #ffe5d0;
}

.status-danger {
  color: #dc3545;
  background-color: #f8d7da;
}

.status-info {
  color: #0dcaf0;
  background-color: #cff4fc;
}

.chevron-icon {
  flex-shrink: 0;
  color: #6c757d;
  font-size: 1.25rem;
  transition: transform 0.2s ease;
}

.dependent-card:hover .chevron-icon {
  transform: translateX(4px);
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .dependent-card {
    padding: 0.875rem;
    margin-bottom: 0.625rem;
  }

  .card-content {
    gap: 0.75rem;
  }

  .dependent-avatar {
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }

  .dependent-name {
    font-size: 0.95rem;
  }

  .dependent-age {
    font-size: 0.8rem;
  }

  .dependent-status {
    font-size: 0.75rem;
    padding: 0.2rem 0.4rem;
  }

  .dependent-status i {
    font-size: 0.85rem;
  }

  .chevron-icon {
    font-size: 1.1rem;
  }
}
</style>
