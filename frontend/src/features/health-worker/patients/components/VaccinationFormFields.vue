<template>
  <div class="vaccination-form-fields">
    <!-- Vaccine Name (Read-only) -->
    <div class="form-group">
      <label class="form-label">Vaccine Name *</label>
      <input 
        type="text" 
        class="form-input" 
        :value="vaccineName"
        readonly
        disabled
      >
      <small class="form-hint">Vaccine name cannot be changed</small>
    </div>

    <!-- Dose Number -->
    <div class="form-group">
      <label class="form-label">Dose Number *</label>
      <select 
        class="form-input" 
        :value="doseNumber"
        required
        @change="$emit('update:doseNumber', $event.target.value)"
      >
        <option value="">
          Select dose number
        </option>
        <option value="1">
          Dose 1
        </option>
        <option value="2">
          Dose 2
        </option>
        <option value="3">
          Dose 3
        </option>
        <option value="4">
          Booster
        </option>
      </select>
    </div>

    <!-- Date Administered -->
    <div class="form-group">
      <label class="form-label">Date Administered *</label>
      <input 
        type="date" 
        class="form-input" 
        :value="dateAdministered"
        required
        :max="maxDate"
        @input="$emit('update:dateAdministered', $event.target.value)"
        @change="$emit('calculate-age')"
      >
    </div>

    <!-- Age at Administration (Auto-calculated) -->
    <div class="form-group">
      <label class="form-label">Age at Administration</label>
      <input 
        type="text" 
        class="form-input" 
        :value="ageAtAdministration"
        readonly
      >
      <small class="form-hint">Automatically calculated from date administered</small>
    </div>

    <!-- Administered By -->
    <div class="form-group">
      <label class="form-label">Administered By *</label>
      <div v-if="!isOutside">
        <select 
          class="form-input" 
          :value="administeredBy"
          required
          :disabled="isOutside"
          @change="$emit('update:administeredBy', $event.target.value)"
        >
          <option value="">
            Select health staff
          </option>
          <option 
            v-for="nurse in nurses" 
            :key="nurse.user_id" 
            :value="nurse.user_id"
          >
            {{ nurse.fullname }} ({{ nurse.hs_type }})
          </option>
          <option
            v-if="nurses.length === 0"
            disabled
          >
            No nurses/nutritionists available
          </option>
        </select>
      </div>
      <div v-else>
        <input
          type="text"
          class="form-input"
          :value="administeredByDisplay"
          placeholder="Name of vaccinator or provider"
          @input="$emit('update:administeredByDisplay', $event.target.value)"
        >
        <small class="form-hint">For outside immunizations, enter vaccinator name (will be stored in remarks)</small>
      </div>
    </div>

    <!-- Site of Administration -->
    <div class="form-group">
      <label class="form-label">Site of Administration</label>
      <select 
        class="form-input" 
        :value="siteOfAdministration"
        @change="$emit('update:siteOfAdministration', $event.target.value)"
      >
        <option value="">
          Select a site
        </option>
        <option value="Left arm (deltoid)">
          Left arm (deltoid)
        </option>
        <option value="Right arm (deltoid)">
          Right arm (deltoid)
        </option>
        <option value="Left thigh (anterolateral)">
          Left thigh (anterolateral)
        </option>
        <option value="Right thigh (anterolateral)">
          Right thigh (anterolateral)
        </option>
        <option value="Oral">
          Oral
        </option>
      </select>
    </div>

    <!-- Manufacturer -->
    <div class="form-group">
      <label class="form-label">Manufacturer</label>
      <input 
        type="text" 
        class="form-input" 
        :value="manufacturer"
        placeholder="e.g., Sanofi Pasteur"
        :readonly="!isOutside"
        @input="$emit('update:manufacturer', $event.target.value)"
      >
      <small
        v-if="!isOutside"
        class="form-hint"
      >Auto-filled from inventory / read-only for in-facility</small>
      <small
        v-else
        class="form-hint"
      >Editable for outside immunizations</small>
    </div>

    <!-- Lot Number -->
    <div class="form-group">
      <label class="form-label">Lot Number</label>
      <input 
        type="text" 
        class="form-input" 
        :value="lotNumber"
        placeholder="e.g., L123456"
        :readonly="!isOutside"
        @input="$emit('update:lotNumber', $event.target.value)"
      >
      <small
        v-if="!isOutside"
        class="form-hint"
      >Auto-filled from inventory / read-only for in-facility</small>
      <small
        v-else
        class="form-hint"
      >Editable for outside immunizations</small>
    </div>

    <!-- Facility Name -->
    <div class="form-group">
      <label class="form-label">Facility Name</label>
      <input 
        type="text" 
        class="form-input" 
        :value="facilityName"
        placeholder="e.g., Barangay Health Center"
        @input="$emit('update:facilityName', $event.target.value)"
      >
    </div>

    <!-- Remarks -->
    <div class="form-group">
      <label class="form-label">Remarks</label>
      <textarea 
        class="form-input" 
        :value="remarks"
        rows="4"
        placeholder="Additional notes or observations..."
        @input="$emit('update:remarks', $event.target.value)"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  vaccineName: { type: String, default: '' },
  doseNumber: { type: [String, Number], default: '' },
  dateAdministered: { type: String, default: '' },
  ageAtAdministration: { type: String, default: '' },
  administeredBy: { type: [String, Number], default: '' },
  administeredByDisplay: { type: String, default: '' },
  siteOfAdministration: { type: String, default: '' },
  manufacturer: { type: String, default: '' },
  lotNumber: { type: String, default: '' },
  facilityName: { type: String, default: '' },
  remarks: { type: String, default: '' },
  isOutside: { type: Boolean, default: false },
  nurses: { type: Array, default: () => [] },
  maxDate: { type: String, default: '' }
})

defineEmits([
  'update:doseNumber',
  'update:dateAdministered',
  'update:administeredBy',
  'update:administeredByDisplay',
  'update:siteOfAdministration',
  'update:manufacturer',
  'update:lotNumber',
  'update:facilityName',
  'update:remarks',
  'calculate-age'
])
</script>

<style scoped>
.vaccination-form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.form-input[readonly]:not(:disabled) {
  background-color: #f8f9fa;
}

.form-hint {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: #6c757d;
}

textarea.form-input {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .vaccination-form-fields {
    gap: 1rem;
  }
  
  .form-label {
    font-size: 0.85rem;
  }
  
  .form-input {
    padding: 0.625rem;
    font-size: 0.8rem;
  }
}
</style>
