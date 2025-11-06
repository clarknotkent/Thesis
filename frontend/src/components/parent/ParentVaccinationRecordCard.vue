<template>
  <div class="vaccination-record-card">
    <!-- Collapsed View: Header -->
    <div
      class="card-header"
      @click="toggleExpanded"
    >
      <div class="vaccine-info">
        <i class="bi bi-shield-fill-check vaccine-icon" />
        <div class="vaccine-details">
          <h3 class="vaccine-name">
            {{ vaccineName }}
          </h3>
          <p class="vaccine-summary">
            {{ doseSummary }}
          </p>
        </div>
      </div>
      
      <div class="header-actions">
        <span
          class="status-badge"
          :class="overallStatusClass"
        >
          {{ overallStatus }}
        </span>
        <i
          class="bi toggle-icon"
          :class="isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'"
        />
      </div>
    </div>

    <!-- Expanded View: Dose Details -->
    <transition name="expand">
      <div
        v-show="isExpanded"
        class="card-body"
      >
        <div class="dose-list">
          <div
            v-for="(dose, index) in doses" 
            :key="dose.immunization_id || index"
            class="dose-item"
          >
            <!-- Dose Header -->
            <div class="dose-header">
              <span class="dose-badge">Dose {{ dose.dose_number || dose.doseNumber || dose.dose || index + 1 }}</span>
              <span
                class="dose-status-badge"
                :class="getDoseStatusClass(dose)"
              >
                {{ dose.status || 'Completed' }}
              </span>
            </div>

            <!-- Dose Details Grid -->
            <div class="dose-details">
              <div class="detail-row">
                <span class="detail-label">Date Administered</span>
                <span class="detail-value">{{ formatDate(dose.administered_date || dose.date_administered || dose.dateAdministered) }}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Age at Administration</span>
                <span class="detail-value">{{ dose.age_at_administration || dose.ageAtAdministration || '—' }}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Administered By</span>
                <span class="detail-value">{{ getAdministeredBy(dose) }}</span>
              </div>
              
              <div
                v-if="dose.site || dose.administration_site"
                class="detail-row"
              >
                <span class="detail-label">Site</span>
                <span class="detail-value">{{ dose.site || dose.administration_site || '—' }}</span>
              </div>
              
              <div
                v-if="dose.facility || dose.health_center"
                class="detail-row"
              >
                <span class="detail-label">Facility</span>
                <span class="detail-value">{{ dose.facility || dose.health_center || '—' }}</span>
              </div>
              
              <div
                v-if="dose.remarks || dose.notes"
                class="detail-row remarks-row"
              >
                <span class="detail-label">Remarks</span>
                <span class="detail-value remarks">{{ dose.remarks || dose.notes }}</span>
              </div>
            </div>

            <!-- Divider (not on last item) -->
            <div
              v-if="index < doses.length - 1"
              class="dose-divider"
            />
          </div>
        </div>
        
        <!-- View Full Details Button -->
        <router-link
          :to="`/parent/records/${patientId}/vaccine-details?vaccine=${encodeURIComponent(vaccineName)}`"
          class="view-all-button"
        >
          <span>View Full Vaccine Details</span>
          <i class="bi bi-arrow-right" />
        </router-link>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  vaccineName: {
    type: String,
    required: true
  },
  doses: {
    type: Array,
    required: true
  },
  initialExpanded: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: [String, Number],
    required: true
  }
})

const isExpanded = ref(props.initialExpanded)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const doseSummary = computed(() => {
  const total = props.doses.length
  const completed = props.doses.filter(d => 
    !d.status || d.status.toLowerCase() === 'completed'
  ).length
  
  if (completed === total) {
    return total === 1 ? '1 Dose' : `${total} Doses`
  }
  return `${completed} of ${total} Doses Completed`
})

const overallStatus = computed(() => {
  const total = props.doses.length
  const completed = props.doses.filter(d => 
    !d.status || d.status.toLowerCase() === 'completed'
  ).length
  
  if (completed === total) {
    return `Completed (${total} ${total === 1 ? 'Dose' : 'Doses'})`
  }
  if (completed > 0) {
    return `In Progress (${completed}/${total})`
  }
  return 'Pending'
})

const overallStatusClass = computed(() => {
  const total = props.doses.length
  const completed = props.doses.filter(d => 
    !d.status || d.status.toLowerCase() === 'completed'
  ).length
  
  if (completed === total) return 'status-completed'
  if (completed > 0) return 'status-in-progress'
  return 'status-pending'
})

const getDoseStatusClass = (dose) => {
  const status = dose.status?.toLowerCase() || 'completed'
  if (status.includes('completed')) return 'dose-status-completed'
  if (status.includes('pending')) return 'dose-status-pending'
  if (status.includes('scheduled')) return 'dose-status-scheduled'
  return 'dose-status-default'
}

const getAdministeredBy = (dose) => {
  return dose.administered_by_name ||
         dose.administeredBy ||
         dose.health_worker_name ||
         dose.healthWorkerName ||
         dose.worker_name ||
         dose.workerName ||
         dose.recorded_by_name ||
         'Taken Outside'
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.vaccination-record-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.2s ease;
}

.vaccination-record-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
  cursor: pointer;
  gap: 1rem;
  transition: background 0.2s ease;
}

.card-header:hover {
  background: linear-gradient(135deg, #e6f2ff 0%, #dbeafe 100%);
}

.card-header:active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.vaccine-info {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex: 1;
  min-width: 0;
}

.vaccine-icon {
  font-size: 1.75rem;
  color: #007bff;
  flex-shrink: 0;
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

.vaccine-summary {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.status-in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-pending {
  background: #fed7aa;
  color: #92400e;
}

.toggle-icon {
  font-size: 1.25rem;
  color: #6b7280;
  transition: transform 0.2s ease;
}

/* Card Body - Expanded Content */
.card-body {
  overflow: hidden;
}

.dose-list {
  padding: 0;
}

.dose-item {
  padding: 1.25rem 1.5rem;
}

.dose-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.dose-badge {
  padding: 0.375rem 0.75rem;
  background: #007bff;
  color: #ffffff;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
}

.dose-status-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dose-status-completed {
  background: #d1fae5;
  color: #065f46;
}

.dose-status-pending {
  background: #fed7aa;
  color: #92400e;
}

.dose-status-scheduled {
  background: #dbeafe;
  color: #1e40af;
}

.dose-status-default {
  background: #e5e7eb;
  color: #374151;
}

/* Dose Details */
.dose-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.detail-row.remarks-row {
  flex-direction: column;
  gap: 0.375rem;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  flex-shrink: 0;
  min-width: 140px;
}

.detail-value {
  font-size: 0.875rem;
  color: #111827;
  text-align: right;
  flex: 1;
  word-break: break-word;
}

.detail-value.remarks {
  text-align: left;
  font-style: italic;
  color: #6b7280;
  font-size: 0.8125rem;
}

/* View All Button */
.view-all-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  margin: 1rem 1.5rem 0.5rem;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  border-radius: 0.75rem;
  color: #ffffff;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.view-all-button:hover {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
  transform: translateY(-1px);
  color: #ffffff;
  text-decoration: none;
}

.view-all-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 123, 255, 0.3);
}

.view-all-button i {
  font-size: 1.125rem;
  transition: transform 0.2s ease;
}

.view-all-button:hover i {
  transform: translateX(4px);
}

/* Dose Divider */
.dose-divider {
  height: 1px;
  background: #e5e7eb;
  margin-top: 1.25rem;
}

/* Expand Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 3000px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .card-header {
    padding: 1rem 1.25rem;
    flex-wrap: wrap;
  }

  .vaccine-info {
    gap: 0.75rem;
  }

  .vaccine-icon {
    font-size: 1.5rem;
  }

  .vaccine-name {
    font-size: 1rem;
  }

  .vaccine-summary {
    font-size: 0.8125rem;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
    margin-top: 0.5rem;
  }

  .status-badge {
    padding: 0.25rem 0.625rem;
    font-size: 0.6875rem;
  }

  .dose-item {
    padding: 1rem 1.25rem;
  }

  .dose-details {
    padding: 0.875rem;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-label {
    font-size: 0.8125rem;
    min-width: 0;
  }

  .detail-value {
    font-size: 0.8125rem;
    text-align: left;
  }

  .view-indicator {
    padding: 0.625rem 0.875rem;
    font-size: 0.8125rem;
  }
}
</style>
