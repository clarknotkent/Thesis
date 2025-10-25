<template>
  <div class="modal fade" :class="{ show: show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <div class="d-flex align-items-center w-100">
            <h5 class="modal-title me-auto">
              <i class="bi bi-shield-plus me-2"></i>
              {{ isEdit ? 'Edit' : 'Add New' }} Vaccination Record
            </h5>
            <!-- Inside the add/edit vaccination modal: outside toggle at upper right -->
            <div class="form-check form-switch" v-if="!isEdit">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="insideOutsideToggle" 
                :checked="outsideImmunization"
                @change="$emit('update:outsideImmunization', $event.target.checked)"
              >
              <label class="form-check-label" for="insideOutsideToggle">Outside record</label>
            </div>
          </div>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="$emit('save')">
            <div class="row g-3">
              <div class="col-12">
                <small class="text-muted d-block">
                  Outside = vaccinations done outside the facility. No inventory is used; choose a vaccine from the catalog. 
                  In-facility = administered here; choose a stock from inventory and ensure a same-day visit exists.
                </small>
              </div>
              
              <!-- Vaccine Selection -->
              <div class="col-md-6">
                <label class="form-label">Vaccine *</label>
                <!-- In-facility: choose from inventory stocks -->
                <select 
                  v-if="!outsideImmunization" 
                  class="form-select" 
                  :value="form.inventoryId" 
                  @change="$emit('update:form', { ...form, inventoryId: $event.target.value }); $emit('vaccine-select')"
                  :required="!outsideImmunization" 
                  :disabled="isEdit"
                >
                  <option value="">Select a vaccine stock</option>
                  <option 
                    v-for="v in vaccineOptions" 
                    :key="v.inventory_id" 
                    :value="v.inventory_id" 
                    :disabled="v.isExpired"
                  >
                    {{ v.display_name }}<span v-if="v.isExpired"> — [EXPIRED]</span>
                  </option>
                </select>
                <!-- Outside: choose vaccine (no inventory) -->
                <select 
                  v-else 
                  class="form-select" 
                  :value="form.vaccineId" 
                  @change="$emit('update:form', { ...form, vaccineId: $event.target.value }); $emit('vaccine-catalog-select')"
                  :required="outsideImmunization" 
                  :disabled="isEdit"
                >
                  <option value="">Select a vaccine</option>
                  <option 
                    v-for="v in vaccineCatalog" 
                    :key="v.vaccine_id || v.id" 
                    :value="v.vaccine_id || v.id"
                  >
                    {{ v.antigen_name || v.name || 'Vaccine' }}
                  </option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label">Disease Prevented</label>
                <input type="text" class="form-control" :value="form.diseasePrevented" readonly>
              </div>

              <div class="col-md-6">
                <label class="form-label">Dose Number *</label>
                <select 
                  class="form-select" 
                  :value="form.doseNumber" 
                  @change="$emit('update:form', { ...form, doseNumber: $event.target.value })"
                  required
                >
                  <option value="">Select dose</option>
                  <option v-for="dose in availableDoses" :key="dose" :value="dose">Dose {{ dose }}</option>
                </select>
                <div v-if="autoSelectHint" class="form-text text-success">{{ autoSelectHint }}</div>
              </div>

              <div class="col-md-6">
                <label class="form-label">Date Administered *</label>
                <input 
                  type="date" 
                  class="form-control" 
                  :value="form.dateAdministered" 
                  @change="$emit('update:form', { ...form, dateAdministered: $event.target.value })"
                  required
                >
              </div>

              <div class="col-md-6">
                <label class="form-label">Age at Administration</label>
                <input type="text" class="form-control" :value="form.ageAtAdministration" readonly>
              </div>

              <div class="col-md-6">
                <label class="form-label">Manufacturer</label>
                <input type="text" class="form-control" :value="form.vaccineManufacturer" readonly>
              </div>

              <div class="col-md-6">
                <label class="form-label">Lot Number</label>
                <input type="text" class="form-control" :value="form.lotNumber" readonly>
              </div>

              <div class="col-md-6">
                <label class="form-label">Site of Administration</label>
                <select 
                  class="form-select" 
                  :value="form.siteOfAdministration" 
                  @change="$emit('update:form', { ...form, siteOfAdministration: $event.target.value })"
                >
                  <option value="">Select a site</option>
                  <option value="Left arm (deltoid)">Left arm (deltoid)</option>
                  <option value="Right arm (deltoid)">Right arm (deltoid)</option>
                  <option value="Left thigh (anterolateral)">Left thigh (anterolateral)</option>
                  <option value="Right thigh (anterolateral)">Right thigh (anterolateral)</option>
                  <option value="Oral">Oral</option>
                </select>
              </div>

              <div class="col-md-6" v-if="!outsideImmunization">
                <label class="form-label">Health Staff *</label>
                <select 
                  class="form-select" 
                  :value="form.healthWorkerId" 
                  @change="$emit('update:form', { ...form, healthWorkerId: $event.target.value })"
                  required
                >
                  <option value="">Select health staff</option>
                  <option 
                    v-for="hw in nurses" 
                    :key="hw.id || hw.health_worker_id" 
                    :value="hw.id || hw.health_worker_id"
                  >
                    {{ hw.name }} ({{ hw.hs_type || hw.hw_type || hw.role || hw.type }})
                  </option>
                  <option v-if="nurses.length === 0" disabled>No nurses/nutritionists available</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label">Facility Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  :value="form.facilityName" 
                  @input="$emit('update:form', { ...form, facilityName: $event.target.value })"
                >
              </div>

              <div class="col-md-6">
                <label class="form-label">Remarks</label>
                <textarea 
                  class="form-control" 
                  rows="2" 
                  :value="form.remarks" 
                  @input="$emit('update:form', { ...form, remarks: $event.target.value })"
                ></textarea>
              </div>
            </div>

            <div class="mt-4 text-muted small">
              <i class="bi bi-info-circle me-1"></i>
              Fields marked with * are required
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="saving || !canSave">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                {{ isEdit ? 'Update' : 'Add' }} Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  form: {
    type: Object,
    required: true
  },
  outsideImmunization: {
    type: Boolean,
    default: false
  },
  vaccineOptions: {
    type: Array,
    default: () => []
  },
  vaccineCatalog: {
    type: Array,
    default: () => []
  },
  availableDoses: {
    type: Array,
    default: () => [1, 2, 3, 4, 5]
  },
  autoSelectHint: {
    type: String,
    default: ''
  },
  nurses: {
    type: Array,
    default: () => []
  },
  saving: {
    type: Boolean,
    default: false
  },
  canSave: {
    type: Boolean,
    default: true
  }
});

defineEmits(['close', 'save', 'update:form', 'update:outsideImmunization', 'vaccine-select', 'vaccine-catalog-select']);
</script>
