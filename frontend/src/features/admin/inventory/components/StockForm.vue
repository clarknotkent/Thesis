<template>
  <form @submit.prevent="handleSubmit">
    <!-- Stock Information -->
    <div class="row mb-4">
      <div class="col-12">
        <h6 class="text-primary fw-bold mb-3">
          <i class="bi bi-box-seam me-2" />Stock Information
        </h6>
        <div class="row g-4">
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label
              for="vaccineSelect"
              class="form-label"
            >Select Vaccine Type: <span class="text-danger">*</span></label>
            <select 
              id="vaccineSelect" 
              v-model="localForm.vaccine_id"
              class="form-select" 
              :disabled="isEditing || readOnly"
              required
              @change="onVaccineSelect"
            >
              <option value="">
                -- Select a Vaccine Type --
              </option>
              <option
                v-for="vaccine in vaccines"
                :key="vaccine.id"
                :value="vaccine.id"
              >
                {{ vaccine.antigen_name }} - {{ vaccine.brand_name }}
              </option>
            </select>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label
              for="brandName"
              class="form-label"
            >Brand Name:</label>
            <input 
              id="brandName" 
              v-model="localForm.brandName" 
              type="text"
              class="form-control bg-light" 
              readonly
              placeholder="Auto-populated from selected vaccine"
            >
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label
              for="manufacturer"
              class="form-label"
            >Manufacturer: <span class="text-danger">*</span></label>
            <input 
              id="manufacturer" 
              v-model="localForm.manufacturer" 
              type="text"
              class="form-control" 
              :readonly="readOnly"
              required
              list="manufacturerOptionsList"
              placeholder="e.g., Pfizer Inc., Moderna Inc."
            >
            <datalist id="manufacturerOptionsList">
              <option
                v-for="m in manufacturerOptions"
                :key="m"
                :value="m"
              />
            </datalist>
          </div>
          <div class="col-xl-6 col-lg-6 col-md-6">
            <label
              for="quantity"
              class="form-label"
            >
              {{ isEditing ? 'Current Stock Quantity:' : 'Stock Quantity:' }} 
              <span
                v-if="!isEditing"
                class="text-danger"
              >*</span>
            </label>
            <input 
              id="quantity" 
              v-model.number="localForm.quantity" 
              type="number"
              class="form-control"
              :class="{ 'bg-light': isEditing || readOnly }" 
              min="0"
              :readonly="isEditing || readOnly"
              :required="!isEditing"
              placeholder="Number of doses"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Batch & Storage Information -->
    <div class="row mb-4">
      <div class="col-12">
        <h6 class="text-primary fw-bold mb-3">
          <i class="bi bi-archive me-2" />Batch & Storage Information
        </h6>
        <div class="row g-4">
          <div class="col-xl-4 col-lg-4 col-md-6">
            <label
              for="lotNumber"
              class="form-label"
            >Lot Number: <span class="text-danger">*</span></label>
            <input 
              id="lotNumber" 
              v-model="localForm.lotNumber" 
              type="text"
              class="form-control" 
              :readonly="readOnly"
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
              v-model="localForm.expirationDate"
              :disabled="readOnly"
              output-format="iso"
            />
          </div>
          <div class="col-xl-4 col-lg-4 col-md-6">
            <label
              for="storageLocation"
              class="form-label"
            >Storage Location:</label>
            <input
              id="storageLocation"
              v-model="localForm.storageLocation"
              type="text"
              class="form-control"
              :readonly="readOnly"
              list="storageLocations"
              placeholder="e.g., Cold Room A, Refrigerator 1"
            >
            <datalist id="storageLocations">
              <option
                v-for="opt in storageLocationOptions"
                :key="opt"
                :value="opt"
              >
                {{ opt }}
              </option>
            </datalist>
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
        class="btn btn-primary"
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
import { ref, watch, onMounted } from 'vue'
import DateInput from '@/components/ui/form/DateInput.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      vaccine_id: '',
      brandName: '',
      manufacturer: '',
      quantity: 0,
      lotNumber: '',
      expirationDate: '',
      storageLocation: ''
    })
  },
  vaccines: {
    type: Array,
    default: () => []
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

const manufacturerOptions = [
  'Pfizer Inc.',
  'Moderna Inc.',
  'AstraZeneca',
  'Johnson & Johnson',
  'Sinovac Biotech',
  'Bharat Biotech',
  'GlaxoSmithKline',
  'Sanofi Pasteur',
  'Merck & Co.',
  'Novartis'
]

const storageLocationOptions = [
  'Cold Room A',
  'Cold Room B',
  'Refrigerator 1',
  'Refrigerator 2',
  'Freezer 1',
  'Freezer 2',
  'Main Storage',
  'Backup Storage'
]

// Watch for prop changes
watch(() => props.initialData, (newData) => {
  localForm.value = { ...newData }
}, { deep: true })

const onVaccineSelect = () => {
  // Defensive check: ensure vaccines is an array
  if (!Array.isArray(props.vaccines)) {
    console.error('vaccines prop is not an array:', props.vaccines)
    return
  }
  
  const selectedVaccine = props.vaccines.find(v => v.id === localForm.value.vaccine_id)
  if (selectedVaccine) {
    localForm.value.brandName = selectedVaccine.brand_name
    // Optionally pre-fill manufacturer if available in vaccine data
    if (selectedVaccine.manufacturer) {
      localForm.value.manufacturer = selectedVaccine.manufacturer
    }
  }
}

const handleSubmit = () => {
  emit('submit', { ...localForm.value })
}

// Initialize if editing
onMounted(() => {
  if (props.isEditing && localForm.value.vaccine_id) {
    onVaccineSelect()
  }
})
</script>

<style scoped>
.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.text-primary {
  color: #4e73df !important;
}

.bg-light {
  background-color: #f8f9fc !important;
}
</style>
