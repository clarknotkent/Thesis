<template>
  <div class="table-responsive">
    <h6 class="fw-bold mb-3">
      Vaccination Records
    </h6>
    <table class="table table-hover table-striped">
      <thead class="table-light">
        <tr>
          <th>Vaccine Name</th>
          <th>Disease Prevented</th>
          <th>Dose</th>
          <th>Date Administered</th>
          <th>Age at Administration</th>
          <th>Administered By</th>
          <th>Site</th>
          <th>Facility</th>
          <th>Status</th>
          <th>Remarks</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(vaccination, index) in sortedVaccinations"
          :key="vaccination.immunization_id || vaccination.id || index"
        >
          <td class="fw-semibold">
            {{ vaccination.vaccine_antigen_name || vaccination.vaccineName || vaccination.antigen_name || vaccination.antigenName || 'Unknown' }}
          </td>
          <td>
            <small>{{ vaccination.disease_prevented || vaccination.diseasePrevented || vaccination.lotNumber || vaccination.batch_number || vaccination.batchNumber || '—' }}</small>
          </td>
          <td>
            <span
              v-if="vaccination.dose_number || vaccination.doseNumber || vaccination.dose"
              class="badge bg-secondary"
            >
              Dose {{ vaccination.dose_number || vaccination.doseNumber || vaccination.dose }}
            </span>
            <span
              v-else
              class="text-muted"
            >—</span>
          </td>
          <td>
            <small>{{ formatDate(vaccination.administered_date || vaccination.date_administered || vaccination.dateAdministered) }}</small>
          </td>
          <td>
            <small>{{ vaccination.age_at_administration || vaccination.ageAtAdministration || '—' }}</small>
          </td>
          <td>
            <small>{{
              vaccination.administered_by_name ||
                vaccination.administeredBy ||
                vaccination.health_worker_name ||
                vaccination.healthWorkerName ||
                vaccination.worker_name ||
                vaccination.workerName ||
                vaccination.recorded_by_name ||
                'Taken Outside'
            }}</small>
          </td>
          <td>
            <small>{{ deriveSite(vaccination) }}</small>
          </td>
          <td>
            <small>{{ deriveFacility(vaccination) }}</small>
          </td>
          <td>
            <span
              class="badge"
              :class="getStatusBadgeClass(vaccination.status)"
            >
              {{ vaccination.status || 'Completed' }}
            </span>
          </td>
          <td>
            <small class="text-muted">{{ vaccination.remarks || vaccination.notes || '—' }}</small>
          </td>
          <td>
            <div class="btn-group btn-group-sm">
              <button 
                class="btn btn-outline-primary" 
                :disabled="!isOutside(vaccination)" 
                :title="isOutside(vaccination) ? 'Edit' : 'Edit allowed for Outside records only'" 
                @click="$emit('edit', index)"
              >
                <i class="bi bi-pencil" />
              </button>
              <button 
                class="btn btn-outline-danger" 
                title="Delete" 
                @click="$emit('delete', vaccination)"
              >
                <i class="bi bi-trash" />
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="sortedVaccinations.length === 0">
          <td
            colspan="11"
            class="text-center py-4 text-muted"
          >
            <i class="bi bi-shield-exclamation me-2" />
            No vaccination records found for this patient
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  sortedVaccinations: {
    type: Array,
    required: true
  },
  formatDate: {
    type: Function,
    required: true
  },
  deriveSite: {
    type: Function,
    required: true
  },
  deriveFacility: {
    type: Function,
    required: true
  },
  getStatusBadgeClass: {
    type: Function,
    required: true
  },
  isOutside: {
    type: Function,
    required: true
  }
});

defineEmits(['edit', 'delete']);
</script>
