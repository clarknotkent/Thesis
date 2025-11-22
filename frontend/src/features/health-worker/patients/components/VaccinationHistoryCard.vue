<template>
  <div class="vaccination-history-card">
    <!-- Header -->
    <div class="card-header">
      <div class="vaccine-info">
        <i class="bi bi-shield-fill-check vaccine-icon" />
        <div class="vaccine-details">
          <h3 class="vaccine-name">
            {{ vaccineName }}
          </h3>
          <p class="disease-prevented">
            {{ diseasePrevented }}
          </p>
        </div>
      </div>
      <span
        class="status-badge"
        :class="statusClass"
      >
        {{ vaccination.status || 'Completed' }}
      </span>
    </div>

    <!-- Info Grid -->
    <div class="card-body">
      <div class="info-row">
        <span class="info-label">Dose</span>
        <span class="info-value">
          <span
            v-if="vaccination.dose_number || vaccination.doseNumber || vaccination.dose"
            class="dose-badge"
          >
            Dose {{ vaccination.dose_number || vaccination.doseNumber || vaccination.dose }}
          </span>
          <span
            v-else
            class="text-muted"
          >—</span>
        </span>
      </div>

      <div class="info-row">
        <span class="info-label">Date Administered</span>
        <span class="info-value">{{ formattedDate }}</span>
      </div>

      <div class="info-row">
        <span class="info-label">Age at Administration</span>
        <span class="info-value">{{ vaccination.age_at_administration || vaccination.ageAtAdministration || '—' }}</span>
      </div>

      <div class="info-row">
        <span class="info-label">Administered By</span>
        <span class="info-value">{{ administeredBy }}</span>
      </div>

      <div class="info-row">
        <span class="info-label">Site</span>
        <span class="info-value">{{ site }}</span>
      </div>

      <div class="info-row">
        <span class="info-label">Facility</span>
        <span class="info-value">{{ facility }}</span>
      </div>

      <div
        v-if="vaccination.remarks || vaccination.notes"
        class="info-row"
      >
        <span class="info-label">Remarks</span>
        <span class="info-value remarks">{{ vaccination.remarks || vaccination.notes }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="card-actions">
      <button
        class="action-btn view-btn"
        @click="$emit('view')"
      >
        <i class="bi bi-eye" />
        View
      </button>
      <button 
        class="action-btn edit-btn" 
        :disabled="!isOutside"
        :title="isOutside ? 'Edit record' : 'Only outside records can be edited'"
        @click="$emit('edit')"
      >
        <i class="bi bi-pencil" />
        Edit
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  vaccination: {
    type: Object,
    required: true
  }
})

defineEmits(['view', 'edit'])

const vaccineName = computed(() => {
  return props.vaccination.vaccine_antigen_name || 
         props.vaccination.vaccineName || 
         props.vaccination.antigen_name || 
         props.vaccination.antigenName || 
         'Unknown Vaccine'
})

const diseasePrevented = computed(() => {
  return props.vaccination.disease_prevented || 
         props.vaccination.diseasePrevented || 
         '—'
})

const administeredBy = computed(() => {
  return props.vaccination.administered_by_name ||
         props.vaccination.administeredBy ||
         props.vaccination.health_worker_name ||
         props.vaccination.healthWorkerName ||
         props.vaccination.worker_name ||
         props.vaccination.workerName ||
         props.vaccination.recorded_by_name ||
         'Taken Outside'
})

const site = computed(() => {
  return props.vaccination.site || 
         props.vaccination.administration_site || 
         props.vaccination.administrationSite || 
         '—'
})

const facility = computed(() => {
  return props.vaccination.facility_name ||
         props.vaccination.facilityName ||
         props.vaccination.facility || 
         props.vaccination.health_center || 
         props.vaccination.healthCenter || 
         '—'
})

const isOutside = computed(() => {
  const adminBy = administeredBy.value.toLowerCase()
  return adminBy.includes('outside') || adminBy.includes('taken outside')
})

const statusClass = computed(() => {
  const status = props.vaccination.status?.toLowerCase() || 'completed'
  if (status.includes('completed')) return 'status-completed'
  if (status.includes('pending')) return 'status-pending'
  if (status.includes('scheduled')) return 'status-scheduled'
  return 'status-default'
})

const formattedDate = computed(() => {
  const date = props.vaccination.administered_date || 
               props.vaccination.date_administered || 
               props.vaccination.dateAdministered
  
  if (!date) return '—'
  
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})
</script>

<style scoped>
.vaccination-history-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.2s ease;
}

.vaccination-history-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* Header */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
  border-bottom: 1px solid #e5e7eb;
  gap: 1rem;
}

.vaccine-info {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  flex: 1;
  min-width: 0;
}

.vaccine-icon {
  font-size: 1.75rem;
  color: #007bff;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.vaccine-details {
  flex: 1;
  min-width: 0;
}

.vaccine-name {
  font-size: 1.0625rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.disease-prevented {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.status-pending {
  background: #fed7aa;
  color: #92400e;
}

.status-scheduled {
  background: #dbeafe;
  color: #1e40af;
}

.status-default {
  background: #e5e7eb;
  color: #374151;
}

/* Body */
.card-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.375rem 0;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  flex-shrink: 0;
  min-width: 140px;
}

.info-value {
  font-size: 0.9375rem;
  color: #111827;
  text-align: right;
  flex: 1;
  word-break: break-word;
}

.info-value.remarks {
  text-align: left;
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

.dose-badge {
  padding: 0.25rem 0.625rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}

/* Actions */
.card-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn i {
  font-size: 1rem;
}

.view-btn {
  background: #007bff;
  color: #ffffff;
}

.view-btn:hover {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
}

.view-btn:active {
  transform: translateY(0);
}

.edit-btn {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.edit-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.edit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.edit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .card-header {
    padding: 1rem 1.25rem;
  }

  .vaccine-icon {
    font-size: 1.5rem;
  }

  .vaccine-name {
    font-size: 1rem;
  }

  .disease-prevented {
    font-size: 0.8125rem;
  }

  .status-badge {
    padding: 0.25rem 0.625rem;
    font-size: 0.6875rem;
  }

  .card-body {
    padding: 1rem 1.25rem;
    gap: 0.75rem;
  }

  .info-row {
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.25rem 0;
  }

  .info-label {
    font-size: 0.8125rem;
    min-width: 0;
  }

  .info-value {
    font-size: 0.875rem;
    text-align: left;
  }

  .card-actions {
    padding: 0.875rem 1.25rem;
    gap: 0.625rem;
  }

  .action-btn {
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
  }

  .action-btn i {
    font-size: 0.9375rem;
  }
}
</style>
