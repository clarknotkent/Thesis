<template>
  <div
    class="inventory-card"
    @click="$emit('click', inventory)"
  >
    <div class="card-header">
      <div class="vaccine-info">
        <i class="bi bi-shield-fill-check vaccine-icon" />
        <div class="vaccine-details">
          <h3 class="vaccine-name">
            {{ vaccineName }}
          </h3>
          <p class="vaccine-meta">
            {{ manufacturer }} • {{ brandName }}
          </p>
        </div>
      </div>
      <span
        class="status-badge"
        :class="statusClass"
      >{{ status }}</span>
    </div>

    <div class="card-body">
      <div class="info-row">
        <div class="info-item">
          <span class="info-label">Quantity</span>
          <span
            class="info-value"
            :class="quantityClass"
          >{{ quantity }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Expiration</span>
          <span class="info-value">{{ expirationDate }}</span>
        </div>
      </div>

      <div
        v-if="lotNumber"
        class="lot-info"
      >
        <span class="lot-label">Lot:</span>
        <span class="lot-value">{{ lotNumber }}</span>
      </div>
    </div>

    <div class="card-footer">
      <i class="bi bi-chevron-right" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  inventory: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

// Computed properties
const vaccineName = computed(() => {
  return props.inventory.vaccinemaster?.antigen_name || 
         props.inventory.vaccine_name || 
         'Unknown Vaccine'
})

const manufacturer = computed(() => {
  return props.inventory.vaccinemaster?.manufacturer || 
         props.inventory.manufacturer || 
         'Unknown'
})

const brandName = computed(() => {
  return props.inventory.vaccinemaster?.brand_name || 
         props.inventory.brand_name || 
         'Generic'
})

const quantity = computed(() => {
  return props.inventory.current_stock_level || 0
})

const lotNumber = computed(() => {
  return props.inventory.lot_number || ''
})

const expirationDate = computed(() => {
  const date = props.inventory.expiration_date
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

const status = computed(() => {
  const qty = quantity.value
  const expiry = new Date(props.inventory.expiration_date)
  const today = new Date()
  const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return 'Expired'
  if (qty === 0) return 'Out of Stock'
  if (qty < 10) return 'Low Stock'
  return 'In Stock'
})

const statusClass = computed(() => {
  switch (status.value) {
    case 'In Stock':
      return 'status-in-stock'
    case 'Low Stock':
      return 'status-low-stock'
    case 'Out of Stock':
      return 'status-out-of-stock'
    case 'Expired':
      return 'status-expired'
    default:
      return ''
  }
})

const quantityClass = computed(() => {
  const qty = quantity.value
  if (qty === 0) return 'quantity-zero'
  if (qty < 10) return 'quantity-low'
  if (qty < 50) return 'quantity-medium'
  return 'quantity-good'
})
</script>

<style scoped>
.inventory-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.inventory-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

/* Card Header */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
}

.vaccine-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.vaccine-icon {
  font-size: 1.5rem;
  color: #007bff;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.vaccine-details {
  flex: 1;
  min-width: 0;
}

.vaccine-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.vaccine-meta {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  padding: 0.375rem 0.625rem;
  border-radius: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-in-stock {
  background: #d1fae5;
  color: #065f46;
}

.status-low-stock {
  background: #fed7aa;
  color: #92400e;
}

.status-out-of-stock {
  background: #fee2e2;
  color: #991b1b;
}

.status-expired {
  background: #f3f4f6;
  color: #374151;
}

/* Card Body */
.card-body {
  padding: 1rem;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
}

.quantity-zero {
  color: #dc2626;
}

.quantity-low {
  color: #ea580c;
}

.quantity-medium {
  color: #ca8a04;
}

.quantity-good {
  color: #16a34a;
}

.lot-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.lot-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}

.lot-value {
  font-size: 0.8125rem;
  color: #374151;
  font-family: 'Courier New', monospace;
}

/* Card Footer */
.card-footer {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: #9ca3af;
  font-size: 1.125rem;
}

/* Mobile Optimizations */
@media (max-width: 375px) {
  .vaccine-name {
    font-size: 0.9375rem;
  }

  .vaccine-meta {
    font-size: 0.75rem;
  }

  .status-badge {
    font-size: 0.625rem;
    padding: 0.25rem 0.5rem;
  }

  .info-value {
    font-size: 0.875rem;
  }
}
</style>
