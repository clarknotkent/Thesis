<template>
  <div class="services-list-section">
    <div
      v-if="services.length === 0"
      class="empty-state"
    >
      <i class="bi bi-inbox" />
      <p>No services added yet</p>
      <small>Click "Add Service" above to get started</small>
    </div>

    <div
      v-else
      class="services-container"
    >
      <div 
        v-for="(service, index) in services" 
        :key="index"
        class="service-card"
      >
        <div class="service-header">
          <div class="service-title">
            <i class="bi bi-shield-fill-check" />
            <h4>{{ service.vaccineName }}</h4>
            <span
              v-if="service.doseNumber"
              class="dose-badge"
            >
              Dose {{ service.doseNumber }}
            </span>
            <span
              v-if="service.outsideFacility"
              class="outside-badge"
            >
              <i class="bi bi-geo-alt" /> Outside
            </span>
          </div>
          <div class="service-actions">
            <button 
              type="button"
              class="btn-icon btn-edit" 
              title="Edit service"
              @click="$emit('edit', index)"
            >
              <i class="bi bi-pencil" />
            </button>
            <button 
              type="button"
              class="btn-icon btn-delete" 
              title="Remove service"
              @click="$emit('remove', index)"
            >
              <i class="bi bi-trash" />
            </button>
          </div>
        </div>

        <div class="service-details">
          <div class="detail-row">
            <span class="label">Date:</span>
            <span class="value">{{ formatDate(service.dateAdministered) }}</span>
          </div>
          <div
            v-if="service.diseasePrevented"
            class="detail-row"
          >
            <span class="label">Disease Prevented:</span>
            <span class="value">{{ service.diseasePrevented }}</span>
          </div>
          <div
            v-if="service.manufacturer"
            class="detail-row"
          >
            <span class="label">Manufacturer:</span>
            <span class="value">{{ service.manufacturer }}</span>
          </div>
          <div
            v-if="service.lotNumber"
            class="detail-row"
          >
            <span class="label">Lot Number:</span>
            <span class="value">{{ service.lotNumber }}</span>
          </div>
          <div
            v-if="service.site"
            class="detail-row"
          >
            <span class="label">Site:</span>
            <span class="value">{{ service.site }}</span>
          </div>
          <div
            v-if="service.ageAtAdmin"
            class="detail-row"
          >
            <span class="label">Age at Administration:</span>
            <span class="value">{{ service.ageAtAdmin }}</span>
          </div>
          <div
            v-if="service.healthStaff"
            class="detail-row"
          >
            <span class="label">Health Staff:</span>
            <span class="value">{{ service.healthStaff }}</span>
          </div>
          <div
            v-if="service.facilityName"
            class="detail-row"
          >
            <span class="label">Facility:</span>
            <span class="value">{{ service.facilityName }}</span>
          </div>
          <div
            v-if="service.remarks"
            class="detail-row"
          >
            <span class="label">Remarks:</span>
            <span class="value">{{ service.remarks }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  services: {
    type: Array,
    default: () => []
  }
})

defineEmits(['edit', 'remove'])

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.services-list-section {
  margin-top: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  color: #6b7280;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.empty-state p {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #4b5563;
}

.empty-state small {
  font-size: 0.875rem;
}

.services-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.service-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.2s;
}

.service-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.service-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.service-title i {
  color: #10b981;
  font-size: 1.2rem;
}

.service-title h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.dose-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.outside-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.outside-badge i {
  font-size: 0.85rem;
}

.service-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-edit {
  background: #dbeafe;
  color: #1e40af;
}

.btn-edit:hover {
  background: #3b82f6;
  color: white;
}

.btn-delete {
  background: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
}

.service-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.detail-row .label {
  font-weight: 500;
  color: #6b7280;
  min-width: 140px;
}

.detail-row .value {
  color: #1f2937;
  flex: 1;
}

@media (max-width: 640px) {
  .service-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .service-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-row .label {
    min-width: auto;
  }
}
</style>
