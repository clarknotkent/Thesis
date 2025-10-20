<template>
  <form @submit.prevent="handleSubmit">
    <!-- Alert for new vaccine type -->
    <div v-if="!isEditing" class="alert alert-info mb-4">
      <i class="bi bi-info-circle me-2"></i>
      <strong>Note:</strong> This creates a new vaccine type. Each combination of Antigen Name + Brand Name must be unique.
    </div>

    <!-- Vaccine Information -->
    <div class="row mb-4">
      <div class="col-12">
        <h6 class="text-primary fw-bold mb-3">
          <i class="bi bi-shield-check me-2"></i>Vaccine Information
        </h6>
        <div class="row g-4">
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label for="antigenName" class="form-label">Antigen Name: <span class="text-danger">*</span></label>
            <div class="input-group">
              <select
                class="form-select"
                v-model="selectedAntigen"
                @change="onAntigenSelect"
                :disabled="readOnly"
              >
                <option value="">-- Select or type antigen --</option>
                <option v-for="antigen in antigenOptions" :key="antigen" :value="antigen">
                  {{ antigen }}
                </option>
              </select>
              <input
                type="text"
                class="form-control"
                id="antigenName"
                v-model="localForm.antigen_name"
                @input="onAntigenInput"
                placeholder="e.g., COVID-19, Rotavirus, Measles"
                required
                :readonly="readOnly"
              >
            </div>
            <small class="text-muted">Select from dropdown or type manually to add new antigen</small>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label for="brandName" class="form-label">Brand Name: <span class="text-danger">*</span></label>
            <div class="input-group">
              <select
                class="form-select"
                v-model="selectedBrand"
                @change="onBrandSelect"
                :disabled="readOnly"
              >
                <option value="">-- Select or type brand --</option>
                <option v-for="brand in brandOptions" :key="brand" :value="brand">
                  {{ brand }}
                </option>
              </select>
              <input
                type="text"
                class="form-control"
                id="brandName"
                v-model="localForm.brand_name"
                @input="onBrandInput"
                placeholder="e.g., Pfizer, Moderna, Sinovac"
                required
                :readonly="readOnly"
              >
            </div>
            <small class="text-muted">Select from dropdown or type manually to add new brand</small>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label for="manufacturer" class="form-label">Manufacturer: <span class="text-danger">*</span></label>
            <div class="input-group">
              <select
                class="form-select"
                v-model="selectedManufacturer"
                @change="onManufacturerSelect"
                :disabled="readOnly"
              >
                <option value="">-- Select or type manufacturer --</option>
                <option v-for="manufacturer in manufacturerOptions" :key="manufacturer" :value="manufacturer">
                  {{ manufacturer }}
                </option>
              </select>
              <input
                type="text"
                class="form-control"
                id="manufacturer"
                v-model="localForm.manufacturer"
                @input="onManufacturerInput"
                placeholder="e.g., Pfizer Inc., Moderna Inc."
                required
                :readonly="readOnly"
              >
            </div>
            <small class="text-muted">Select from dropdown or type manually to add new manufacturer</small>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label for="diseasePrevented" class="form-label">Disease Prevented: <span class="text-danger">*</span></label>
            <div class="input-group">
              <select
                class="form-select"
                v-model="selectedDisease"
                @change="onDiseaseSelect"
                :disabled="readOnly"
              >
                <option value="">-- Select or type disease --</option>
                <option v-for="disease in diseaseOptions" :key="disease" :value="disease">
                  {{ disease }}
                </option>
              </select>
              <input
                type="text"
                class="form-control"
                id="diseasePrevented"
                v-model="localForm.disease_prevented"
                @input="onDiseaseInput"
                placeholder="e.g., Tuberculosis, Measles, COVID-19"
                required
                :readonly="readOnly"
              >
            </div>
            <small class="text-muted">Select from dropdown or type manually to add new disease</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Classification & Category -->
    <div class="row mb-4">
      <div class="col-12">
        <h6 class="text-primary fw-bold mb-3">
          <i class="bi bi-tags me-2"></i>Classification & Category
        </h6>
        <div class="row g-4">
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label for="category" class="form-label">Category: <span class="text-danger">*</span></label>
            <select
              class="form-select"
              id="category"
              v-model="localForm.category"
              @change="onCategoryChange"
              required
              :disabled="readOnly"
            >
              <option value="">-- Select Category --</option>
              <option value="VACCINE">Vaccine</option>
              <option value="DEWORMING">Deworming</option>
              <option value="VITAMIN_A">Vitamin A Supplement</option>
            </select>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label for="vaccineType" class="form-label">
              Vaccine Type: 
              <span class="text-danger" v-if="localForm.category === 'VACCINE'">*</span>
            </label>
            <select 
              class="form-select" 
              id="vaccineType"
              v-model="localForm.vaccine_type"
              :required="localForm.category === 'VACCINE'"
              :disabled="localForm.category !== 'VACCINE' || readOnly"
            >
              <option value="">-- Select Type --</option>
              <option value="live">Live Attenuated</option>
              <option value="inactivated">Inactivated/Killed</option>
            </select>
            <small v-if="localForm.category !== 'VACCINE'" class="text-muted">Not applicable for this category</small>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6 d-flex align-items-center">
            <div class="form-check mt-3">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="isNipCheckbox" 
                v-model="localForm.is_nip"
                :disabled="readOnly"
              >
              <label class="form-check-label" for="isNipCheckbox">
                Part of NIP (National Immunization Program)
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Initial Stock Information (only when creating new type) -->
    <div v-if="!isEditing && !readOnly" class="row mb-4">
      <div class="col-12">
        <h6 class="text-primary fw-bold mb-3">
          <i class="bi bi-archive me-2"></i>Initial Stock Information
        </h6>
        <div class="row g-4">
          <div class="col-xl-4 col-lg-4 col-md-6">
            <label for="lotNumber" class="form-label">Lot Number: <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="lotNumber"
              v-model="localForm.lot_number" 
              required
              placeholder="e.g., LOT123456"
            >
          </div>
          <div class="col-xl-4 col-lg-4 col-md-6">
            <label for="expirationDate" class="form-label">Expiration Date: <span class="text-danger">*</span></label>
            <DateInput v-model="localForm.expiration_date" output-format="iso" />
          </div>
          <div class="col-xl-4 col-lg-4 col-md-6">
            <label for="stockLevel" class="form-label">Initial Stock Level: <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              id="stockLevel"
              v-model.number="localForm.stock_level" 
              min="0"
              required
              placeholder="Number of doses"
            >
          </div>
          <div class="col-12">
            <label for="storageLocation" class="form-label">Storage Location:</label>
            <input
              type="text"
              class="form-control"
              id="storageLocation"
              v-model="localForm.storage_location"
              placeholder="e.g., Cold Room A, Refrigerator 1, Freezer Section B"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div v-if="!readOnly" class="d-flex justify-content-end gap-2 mt-4">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
        <i class="bi bi-x-circle me-2"></i>Cancel
      </button>
      <button type="submit" class="btn btn-success" :disabled="submitting">
        <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
        <i v-else class="bi bi-check-circle me-2"></i>
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'
import DateInput from '@/components/common/DateInput.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      antigen_name: '',
      brand_name: '',
      manufacturer: '',
      disease_prevented: '',
      category: 'VACCINE',
      vaccine_type: '',
      is_nip: false,
      lot_number: '',
      expiration_date: '',
      stock_level: 0,
      storage_location: ''
    })
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  submitLabel: {
    type: String,
    default: 'Save'
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel'])

const localForm = ref({ ...props.initialData })

// Dropdown selections
const selectedAntigen = ref('')
const selectedBrand = ref('')
const selectedManufacturer = ref('')
const selectedDisease = ref('')

// Options for dropdowns
const antigenOptions = [
  'COVID-19',
  'BCG',
  'Hepatitis B',
  'Pentavalent (DPT-Hep B-Hib)',
  'Oral Polio Vaccine (OPV)',
  'Inactivated Polio Vaccine (IPV)',
  'Pneumococcal Conjugate Vaccine (PCV)',
  'Measles, Mumps, Rubella (MMR)',
  'Rotavirus',
  'Japanese Encephalitis',
  'Human Papillomavirus (HPV)',
  'Tetanus-Diphtheria (Td)',
  'Influenza',
  'Meningococcal',
  'Varicella (Chickenpox)',
  'Typhoid'
]

const brandOptions = [
  'Pfizer',
  'Moderna',
  'Sinovac',
  'AstraZeneca',
  'Johnson & Johnson',
  'Sanofi Pasteur',
  'GlaxoSmithKline',
  'Merck',
  'Serum Institute of India',
  'Bharat Biotech'
]

const manufacturerOptions = [
  'Pfizer Inc.',
  'Moderna Inc.',
  'Sinovac Biotech',
  'AstraZeneca',
  'Johnson & Johnson',
  'Sanofi Pasteur',
  'GlaxoSmithKline (GSK)',
  'Merck & Co.',
  'Serum Institute of India',
  'Bharat Biotech',
  'Novartis',
  'Wyeth Pharmaceuticals'
]

const diseaseOptions = [
  'COVID-19',
  'Tuberculosis (TB)',
  'Hepatitis B',
  'Diphtheria',
  'Pertussis (Whooping Cough)',
  'Tetanus',
  'Haemophilus influenzae type b (Hib)',
  'Poliomyelitis (Polio)',
  'Pneumococcal Disease',
  'Measles',
  'Mumps',
  'Rubella',
  'Rotavirus',
  'Japanese Encephalitis',
  'Human Papillomavirus (HPV)',
  'Influenza',
  'Meningococcal Disease',
  'Varicella (Chickenpox)',
  'Typhoid Fever'
]

// Watch for prop changes
watch(() => props.initialData, (newData) => {
  localForm.value = { ...newData }
}, { deep: true })

// Dropdown handlers
const onAntigenSelect = () => {
  if (selectedAntigen.value) {
    localForm.value.antigen_name = selectedAntigen.value
  }
}

const onAntigenInput = () => {
  selectedAntigen.value = ''
}

const onBrandSelect = () => {
  if (selectedBrand.value) {
    localForm.value.brand_name = selectedBrand.value
  }
}

const onBrandInput = () => {
  selectedBrand.value = ''
}

const onManufacturerSelect = () => {
  if (selectedManufacturer.value) {
    localForm.value.manufacturer = selectedManufacturer.value
  }
}

const onManufacturerInput = () => {
  selectedManufacturer.value = ''
}

const onDiseaseSelect = () => {
  if (selectedDisease.value) {
    localForm.value.disease_prevented = selectedDisease.value
  }
}

const onDiseaseInput = () => {
  selectedDisease.value = ''
}

const onCategoryChange = () => {
  // Reset vaccine_type if category is not VACCINE
  if (localForm.value.category !== 'VACCINE') {
    localForm.value.vaccine_type = ''
  }
}

const handleSubmit = () => {
  emit('submit', { ...localForm.value })
}
</script>

<style scoped>
.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.text-primary {
  color: #4e73df !important;
}

.input-group {
  display: flex;
}

.input-group .form-select {
  max-width: 50px;
  border-right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-group .form-control {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.alert-info {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}
</style>
