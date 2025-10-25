<template>
  <div v-if="visit" class="card">
    <div class="card-body">
      <h6 class="card-title">Visit Details</h6>
      
      <!-- Basic Info -->
      <div class="row g-2 mb-3">
        <div class="col-md-4">
          <strong>Date:</strong>
          <div class="text-muted">{{ formatDate(visit.created_at || visit.visit_date) }}</div>
        </div>
        <div class="col-md-4">
          <strong>Recorded By:</strong>
          <div class="text-muted">{{ visit.recorded_by_name || visit.recorded_by || '—' }}</div>
        </div>
        <div class="col-md-4">
          <strong>Service Rendered:</strong>
          <div class="text-muted">{{ visit.service_rendered || visit.visit_type || '—' }}</div>
        </div>
      </div>

      <hr />

      <!-- Vital Signs Section -->
      <div class="mb-3">
        <h6><i class="bi bi-heart-pulse me-2"></i>Vital Signs</h6>
        <div v-if="hasVitalSigns(visit)" class="table-responsive">
          <table class="table table-sm table-bordered">
            <tbody>
              <tr v-if="getVitalSign(visit, 'temperature')">
                <td class="fw-semibold"><i class="bi bi-thermometer me-2"></i>Temperature</td>
                <td>{{ getVitalSign(visit, 'temperature') }}°C</td>
              </tr>
              <tr v-if="getVitalSign(visit, 'weight')">
                <td class="fw-semibold"><i class="bi bi-speedometer2 me-2"></i>Weight</td>
                <td>{{ getVitalSign(visit, 'weight') }} kg</td>
              </tr>
              <tr v-if="getVitalSign(visit, 'height_length') || getVitalSign(visit, 'height')">
                <td class="fw-semibold"><i class="bi bi-rulers me-2"></i>Height/Length</td>
                <td>{{ getVitalSign(visit, 'height_length') || getVitalSign(visit, 'height') }} cm</td>
              </tr>
              <tr v-if="getVitalSign(visit, 'muac')">
                <td class="fw-semibold"><i class="bi bi-circle me-2"></i>MUAC</td>
                <td>{{ getVitalSign(visit, 'muac') }} cm</td>
              </tr>
              <tr v-if="getVitalSign(visit, 'blood_pressure') || getVitalSign(visit, 'bp')">
                <td class="fw-semibold"><i class="bi bi-activity me-2"></i>Blood Pressure</td>
                <td>{{ getVitalSign(visit, 'blood_pressure') || getVitalSign(visit, 'bp') }}</td>
              </tr>
              <tr v-if="getVitalSign(visit, 'pulse') || getVitalSign(visit, 'heart_rate')">
                <td class="fw-semibold"><i class="bi bi-heart me-2"></i>Pulse/Heart Rate</td>
                <td>{{ getVitalSign(visit, 'pulse') || getVitalSign(visit, 'heart_rate') }} bpm</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-muted small">No vital signs recorded for this visit.</div>
      </div>

      <!-- Immunizations Section -->
      <div class="mb-3">
        <h6><i class="bi bi-shield-check me-2"></i>Services / Immunizations Given</h6>
        <div v-if="(visit.immunizations_given && visit.immunizations_given.length) || (visit.immunizations && visit.immunizations.length)">
          <ul>
            <li v-for="im in (visit.immunizations_given || visit.immunizations || [])" :key="im.immunization_id || im.vaccine_id">
              <strong>{{ im.vaccineName || im.antigen_name || im.vaccine_name || im.name }}</strong>
              <div class="small text-muted">
                Dose: {{ im.dose_number || im.doseNumber || im.dose || '—' }} | 
                Lot: {{ im.lot_number || im.lot || im.batch_number || '—' }}
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="text-muted small">No immunizations or services recorded for this visit.</div>
      </div>

      <!-- Findings Section -->
      <div class="mb-3">
        <h6><i class="bi bi-clipboard-data me-2"></i>Findings / Remarks</h6>
        <div class="p-2 bg-light rounded">
          <div class="small">
            {{ visit.findings || visit.remarks || visit.notes || 'No findings or remarks recorded for this visit.' }}
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="text-end">
        <slot name="actions">
          <button class="btn btn-secondary" @click="$emit('close')">Close</button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visit: {
    type: Object,
    default: null
  },
  formatDate: {
    type: Function,
    required: true
  },
  hasVitalSigns: {
    type: Function,
    required: true
  },
  getVitalSign: {
    type: Function,
    required: true
  }
})

defineEmits(['close'])
</script>

<style scoped>
.card {
  border: 1px solid #dee2e6;
}

.table {
  margin-bottom: 0;
}

.table td {
  padding: 0.5rem;
}
</style>
