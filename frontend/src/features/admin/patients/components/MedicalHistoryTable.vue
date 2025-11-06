<template>
  <div class="medical-history-table">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-5"
    >
      <div
        class="spinner-border text-primary"
        role="status"
      >
        <span class="visually-hidden">Loading medical history...</span>
      </div>
      <p class="text-muted mt-3">
        Loading medical history...
      </p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!visits || visits.length === 0"
      class="text-center py-5"
    >
      <i
        class="bi bi-clipboard-x text-muted"
        style="font-size: 3rem;"
      />
      <p class="text-muted mt-3">
        No medical records found
      </p>
    </div>

    <!-- Medical History Table -->
    <div
      v-else
      class="table-responsive"
    >
      <table class="table table-hover table-striped">
        <thead>
          <tr>
            <th>Checkup Date</th>
            <th>Recorded By</th>
            <th>Services</th>
            <th>Immunizations</th>
            <th>Vitals</th>
            <th>Findings</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="visit in visits"
            :key="visit.visit_id || visit.id"
            style="cursor: pointer;"
            title="Click to view visit details"
            @click="$emit('select-visit', visit)"
          >
            <td>
              <i class="bi bi-calendar-event me-1" />
              {{ formatDate(visit.visit_date) }}
            </td>
            <td>
              <i class="bi bi-person-badge me-1" />
              {{ getWorkerName(visit) }}
            </td>
            <td>
              <div class="d-flex flex-column gap-1">
                <span
                  v-if="visit.service_rendered"
                  class="services-badge"
                  :title="visit.service_rendered"
                >
                  {{ visit.service_rendered }}
                </span>
                <div class="d-flex gap-1">
                  <span
                    v-if="visit.vitamina_given"
                    class="badge bg-warning text-dark"
                  >Vitamin A</span>
                  <span
                    v-if="visit.deworming_given"
                    class="badge bg-success"
                  >Deworming</span>
                </div>
              </div>
              <span
                v-if="!visit.service_rendered && !visit.vitamina_given && !visit.deworming_given"
                class="text-muted"
              >—</span>
            </td>
            <td>
              <div v-if="Array.isArray(visit.immunizations_given) && visit.immunizations_given.length > 0">
                <small
                  v-for="(im, idx) in visit.immunizations_given"
                  :key="idx"
                  class="d-block"
                >
                  <i class="bi bi-syringe me-1" />{{ im.antigen_name }} 
                  <span v-if="im.dose_number">(Dose {{ im.dose_number }})</span>
                </small>
              </div>
              <span
                v-else
                class="text-muted"
              >—</span>
            </td>
            <td>
              <div
                v-if="hasVitals(visit)"
                class="vitals-info"
              >
                <small
                  v-if="getVitals(visit).height_length"
                  class="d-block"
                >
                  <i class="bi bi-arrows-vertical me-1" />{{ getVitals(visit).height_length }} cm
                </small>
                <small
                  v-if="getVitals(visit).weight"
                  class="d-block"
                >
                  <i class="bi bi-speedometer me-1" />{{ getVitals(visit).weight }} kg
                </small>
                <small
                  v-if="getVitals(visit).temperature"
                  class="d-block"
                >
                  <i class="bi bi-thermometer me-1" />{{ getVitals(visit).temperature }}°C
                </small>
                <small
                  v-if="getVitals(visit).respiration_rate"
                  class="d-block"
                >
                  <i class="bi bi-wind me-1" />{{ getVitals(visit).respiration_rate }} bpm
                </small>
                <small
                  v-if="getVitals(visit).muac"
                  class="d-block"
                >
                  <i class="bi bi-activity me-1" />{{ getVitals(visit).muac }} cm MUAC
                </small>
              </div>
              <span
                v-else
                class="text-muted"
              >—</span>
            </td>
            <td>
              <span
                v-if="visit.findings"
                class="text-truncate"
                :title="visit.findings"
              >
                {{ truncateText(visit.findings, 80) }}
              </span>
              <span
                v-else
                class="text-muted"
              >—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Info -->
    <div
      v-if="visits && visits.length > 0"
      class="text-muted small mt-3"
    >
      Showing {{ visits.length }} visit{{ visits.length !== 1 ? 's' : '' }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  visits: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  formatDate: {
    type: Function,
    required: true
  },
  getWorkerName: {
    type: Function,
    required: true
  },
  getVitals: {
    type: Function,
    required: true
  },
  hasVitals: {
    type: Function,
    required: true
  },
  truncateText: {
    type: Function,
    required: true
  }
})

defineEmits(['select-visit'])
</script>

<style scoped>
.medical-history-table {
  min-height: 200px;
}

.table {
  font-size: 0.9rem;
}

.table thead th {
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.table tbody tr:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.vitals-info small {
  line-height: 1.4;
}

.services-badge {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
