<template>
  <div class="border rounded p-3 mb-3">
    <h6 class="mb-3">Add Vaccination Service</h6>
    
    <div class="row g-3">
      <!-- Record Type Toggle (for in-facility records) -->
      <div v-if="!isOutsideRecord" class="col-12">
        <div class="btn-group w-100" role="group">
          <input 
            type="radio" 
            class="btn-check" 
            id="radio-inside" 
            :checked="!vaccinationForm.is_outside_record" 
            @change="$emit('update:vaccination-form', { ...vaccinationForm, is_outside_record: false })"
            :disabled="disabled"
          >
          <label class="btn btn-outline-primary" for="radio-inside">
            <i class="bi bi-building"></i> Inside Facility
          </label>
          
          <input 
            type="radio" 
            class="btn-check" 
            id="radio-outside" 
            :checked="vaccinationForm.is_outside_record" 
            @change="$emit('update:vaccination-form', { ...vaccinationForm, is_outside_record: true })"
            :disabled="disabled"
          >
          <label class="btn btn-outline-warning" for="radio-outside">
            <i class="bi bi-house"></i> Outside Facility
          </label>
        </div>
      </div>

      <!-- Vaccine Selection -->
      <div class="col-md-6">
        <label class="form-label">
          {{ vaccinationForm.is_outside_record ? 'Vaccine (Catalog)' : 'Vaccine (Inventory)' }}
          <span class="text-danger">*</span>
        </label>
        <SearchableSelect
          :options="vaccinationForm.is_outside_record ? catalogOptions : vaccineOptions"
          :value="vaccinationForm.is_outside_record ? vaccinationForm.vaccine_catalog_id : vaccinationForm.vaccine_id"
          @update:value="handleVaccineSelect"
          placeholder="Select vaccine..."
          :disabled="disabled"
        />
      </div>

      <!-- Date Administered -->
      <div class="col-md-6">
        <label class="form-label">
          Date Administered <span class="text-danger">*</span>
        </label>
        <DateInput
          :value="vaccinationForm.date_administered"
          @update:value="$emit('update:vaccination-form', { ...vaccinationForm, date_administered: $event })"
          :disabled="disabled"
        />
      </div>

      <!-- Age at Date Display -->
      <div v-if="ageAtDate" class="col-12">
        <div class="alert alert-info py-2 mb-0">
          <small>
            <i class="bi bi-info-circle"></i> 
            Patient age at administration: <strong>{{ ageAtDate }}</strong>
          </small>
        </div>
      </div>

      <!-- Dose Selection -->
      <div class="col-md-6">
        <label class="form-label">
          Dose <span class="text-danger">*</span>
        </label>
        <select 
          class="form-select" 
          :value="vaccinationForm.dose_ordinal"
          @change="$emit('update:vaccination-form', { ...vaccinationForm, dose_ordinal: $event.target.value })"
          :disabled="disabled"
        >
          <option value="">Select dose...</option>
          <option 
            v-for="dose in availableDoses" 
            :key="dose" 
            :value="dose"
          >
            Dose {{ dose }}
            <span v-if="nextSuggestedDose && dose === nextSuggestedDose"> (suggested)</span>
          </option>
        </select>
        <small v-if="nextSuggestedDose" class="text-muted">
          Suggested next dose: {{ nextSuggestedDose }}
        </small>
      </div>

      <!-- Site of Administration -->
      <div class="col-md-6">
        <label class="form-label">Site of Administration</label>
        <select 
          class="form-select" 
          :value="vaccinationForm.site_of_administration"
          @change="$emit('update:vaccination-form', { ...vaccinationForm, site_of_administration: $event.target.value })"
          :disabled="disabled"
        >
          <option value="">Select site...</option>
          <option value="Left Deltoid">Left Deltoid</option>
          <option value="Right Deltoid">Right Deltoid</option>
          <option value="Left Thigh">Left Thigh</option>
          <option value="Right Thigh">Right Thigh</option>
          <option value="Oral">Oral</option>
        </select>
      </div>

      <!-- Health Worker Selection (for outside records) -->
      <div v-if="vaccinationForm.is_outside_record" class="col-md-6">
        <label class="form-label">Health Worker</label>
        <SearchableSelect
          :options="healthWorkerOptions"
          :value="vaccinationForm.health_worker_id"
          @update:value="$emit('update:vaccination-form', { ...vaccinationForm, health_worker_id: $event })"
          placeholder="Select health worker..."
          :disabled="disabled"
        />
      </div>

      <!-- Remarks -->
      <div class="col-12">
        <label class="form-label">Remarks</label>
        <textarea 
          class="form-control" 
          rows="2" 
          :value="vaccinationForm.remarks"
          @input="$emit('update:vaccination-form', { ...vaccinationForm, remarks: $event.target.value })"
          :disabled="disabled"
        ></textarea>
      </div>

      <!-- Action Buttons -->
      <div class="col-12">
        <button 
          type="button" 
          class="btn btn-primary me-2"
          @click="$emit('add-vaccination')"
          :disabled="disabled || !isVaccinationFormValid"
        >
          <i class="bi bi-plus-circle"></i> Add to Services
        </button>
        <button 
          type="button" 
          class="btn btn-secondary"
          @click="$emit('clear-vaccination-form')"
          :disabled="disabled"
        >
          <i class="bi bi-x-circle"></i> Clear
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import SearchableSelect from '@/components/SearchableSelect.vue';
import DateInput from '@/components/DateInput.vue';

const props = defineProps({
  vaccinationForm: {
    type: Object,
    required: true
  },
  vaccineOptions: {
    type: Array,
    default: () => []
  },
  catalogOptions: {
    type: Array,
    default: () => []
  },
  healthWorkerOptions: {
    type: Array,
    default: () => []
  },
  ageAtDate: {
    type: String,
    default: ''
  },
  availableDoses: {
    type: Array,
    default: () => [1, 2, 3, 4]
  },
  nextSuggestedDose: {
    type: Number,
    default: null
  },
  isOutsideRecord: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

defineEmits([
  'update:vaccination-form',
  'add-vaccination',
  'clear-vaccination-form'
]);

const handleVaccineSelect = (value) => {
  const updatedForm = { ...props.vaccinationForm };
  
  if (props.vaccinationForm.is_outside_record) {
    updatedForm.vaccine_catalog_id = value;
    updatedForm.vaccine_id = null;
  } else {
    updatedForm.vaccine_id = value;
    updatedForm.vaccine_catalog_id = null;
  }
  
  props.$emit('update:vaccination-form', updatedForm);
};

const isVaccinationFormValid = computed(() => {
  const form = props.vaccinationForm;
  
  // Must have vaccine selected (either inventory or catalog)
  const hasVaccine = form.is_outside_record 
    ? !!form.vaccine_catalog_id 
    : !!form.vaccine_id;
  
  // Must have date and dose
  return hasVaccine && !!form.date_administered && !!form.dose_ordinal;
});
</script>
