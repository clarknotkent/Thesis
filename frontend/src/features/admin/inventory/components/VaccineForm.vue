<template>
  <form @submit.prevent="handleSubmit">
    <!-- Alert for new vaccine type -->
    <div
      v-if="!isEditing"
      class="alert alert-info mb-4"
    >
      <i class="bi bi-info-circle me-2" />
      <strong>Note:</strong> This creates a new vaccine type. Each combination of Antigen Name + Brand Name must be unique.
    </div>

    <!-- Vaccine Information -->
    <div class="row mb-4">
      <div class="col-12">
        <h6 class="text-primary fw-bold mb-3">
          <i class="bi bi-shield-check me-2" />Vaccine Information
        </h6>
        <div class="row g-4">
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label
              for="antigenName"
              class="form-label"
            >Antigen Name: <span class="text-danger">*</span></label>
            <div class="input-group">
              <input
                id="antigenName"
                v-model="localForm.antigen_name"
                type="text"
                class="form-control"
                placeholder="e.g., COVID-19, Rotavirus, Measles"
                required
                :readonly="readOnly"
                @input="onAntigenInput"
              >
            </div>
            <small class="text-muted">Type to edit antigen name</small>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label
              for="brandName"
              class="form-label"
            >Brand Name: <span class="text-danger">*</span></label>
            <div class="input-group">
              <select
                v-model="selectedBrand"
                class="form-select"
                :disabled="readOnly"
                @change="onBrandSelect"
              >
                <option value="">
                  -- Select or type brand --
                </option>
                <option
                  v-for="brand in brandOptions"
                  :key="brand"
                  :value="brand"
                >
                  {{ brand }}
                </option>
              </select>
              <input
                id="brandName"
                v-model="localForm.brand_name"
                type="text"
                class="form-control"
                placeholder="e.g., Pfizer, Moderna, Sinovac"
                required
                :readonly="readOnly"
                @input="onBrandInput"
              >
            </div>
            <small class="text-muted">Select from dropdown or type manually to add new brand</small>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label
              for="diseasePrevented"
              class="form-label"
            >Disease Prevented: <span class="text-danger">*</span></label>
            <div class="input-group">
              <select
                v-model="selectedDisease"
                class="form-select"
                :disabled="readOnly"
                @change="onDiseaseSelect"
              >
                <option value="">
                  -- Select or type disease --
                </option>
                <option
                  v-for="disease in diseaseOptions"
                  :key="disease"
                  :value="disease"
                >
                  {{ disease }}
                </option>
              </select>
              <input
                id="diseasePrevented"
                v-model="localForm.disease_prevented"
                type="text"
                class="form-control"
                placeholder="e.g., Tuberculosis, Measles, COVID-19"
                required
                :readonly="readOnly"
                @input="onDiseaseInput"
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
          <i class="bi bi-tags me-2" />Classification & Category
        </h6>
        <div class="row g-4">
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label
              for="category"
              class="form-label"
            >Category: <span class="text-danger">*</span></label>
            <select
              id="category"
              v-model="localForm.category"
              class="form-select"
              required
              :disabled="readOnly"
              @change="onCategoryChange"
            >
              <option value="">
                -- Select Category --
              </option>
              <option value="VACCINE">
                Vaccine
              </option>
              <option value="DEWORMING">
                Deworming
              </option>
              <option value="VITAMIN_A">
                Vitamin A Supplement
              </option>
            </select>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label
              for="vaccineType"
              class="form-label"
            >
              Vaccine Type: 
              <span
                v-if="localForm.category === 'VACCINE'"
                class="text-danger"
              >*</span>
            </label>
            <select 
              id="vaccineType" 
              v-model="localForm.vaccine_type"
              class="form-select"
              :required="localForm.category === 'VACCINE'"
              :disabled="localForm.category !== 'VACCINE' || readOnly"
            >
              <option value="">
                -- Select Type --
              </option>
              <option value="live">
                Live Attenuated
              </option>
              <option value="inactivated">
                Inactivated/Killed
              </option>
            </select>
            <small
              v-if="localForm.category !== 'VACCINE'"
              class="text-muted"
            >Not applicable for this category</small>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6 d-flex align-items-center">
            <div class="form-check mt-3">
              <input 
                id="isNipCheckbox" 
                v-model="localForm.is_nip" 
                class="form-check-input" 
                type="checkbox"
                :disabled="readOnly"
              >
              <label
                class="form-check-label"
                for="isNipCheckbox"
              >
                Part of NIP (National Immunization Program)
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Initial Stock Information (only when creating new type) -->
    <div
      v-if="!isEditing && !readOnly"
      class="row mb-4"
    >
      <div class="col-12">
        <h6 class="text-primary fw-bold mb-3">
          <i class="bi bi-archive me-2" />Initial Stock Information
        </h6>
        <div class="row g-4">
          <div class="col-xl-4 col-lg-4 col-md-6">
            <label
              for="lotNumber"
              class="form-label"
            >Lot Number: <span class="text-danger">*</span></label>
            <input 
              id="lotNumber" 
              v-model="localForm.lot_number" 
              type="text"
              class="form-control" 
              required
              placeholder="e.g., LOT123456"
            >
          </div>
          <div class="col-xl-4 col-lg-4 col-md-6">
            <label
              for="expirationDate"
              class="form-label"
            >Expiration Date: <span class="text-danger">*</span></label>
            <DateInput
              v-model="localForm.expiration_date"
              output-format="iso"
            />
          </div>
          <div class="col-xl-4 col-lg-4 col-md-6">
            <label
              for="stockLevel"
              class="form-label"
            >Initial Stock Level: <span class="text-danger">*</span></label>
            <input 
              id="stockLevel" 
              v-model.number="localForm.stock_level" 
              type="number"
              class="form-control" 
              min="0"
              required
              placeholder="Number of doses"
            >
          </div>
          <div class="col-12">
            <label
              for="storageLocation"
              class="form-label"
            >Storage Location:</label>
            <input
              id="storageLocation"
              v-model="localForm.storage_location"
              type="text"
              class="form-control"
              placeholder="e.g., Cold Room A, Refrigerator 1, Freezer Section B"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div
      v-if="!readOnly"
      class="d-flex justify-content-end gap-2 mt-4"
    >
      <button
        type="button"
        class="btn btn-secondary"
        @click="$emit('cancel')"
      >
        <i class="bi bi-x-circle me-2" />Cancel
      </button>
      <button
        type="submit"
        class="btn btn-success"
        :disabled="submitting"
      >
        <span
          v-if="submitting"
          class="spinner-border spinner-border-sm me-2"
        />
        <i
          v-else
          class="bi bi-check-circle me-2"
        />
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'
import DateInput from '@/components/ui/form/DateInput.vue'

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
const selectedBrand = ref('')
const selectedDisease = ref('')

// Options for dropdowns

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

// Manufacturer field removed from UI per requirements

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

// Manufacturer handlers removed per requirements

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
