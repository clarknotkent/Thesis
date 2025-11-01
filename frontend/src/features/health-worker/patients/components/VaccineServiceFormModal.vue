<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>
          <i class="bi bi-syringe-fill"></i>
          {{ editingIndex !== null ? 'Edit' : 'Add' }} Vaccine Service
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="saveService">
          <!-- Vaccine Selection -->
          <div class="form-group">
            <label class="form-label">Vaccine *</label>

            <!-- Top toggles: NIP-only and Outside -->
            <div class="form-toggles">
              <label class="checkbox-label">
                <input type="checkbox" v-model="showNipOnly" @change="refreshVaccineSources" />
                <span>NIP only</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="outsideMode" @change="onOutsideToggle" />
                <span>Outside facility</span>
              </label>
            </div>

            <div class="vaccine-search-wrapper" @click.stop>
              <input 
                type="text"
                class="form-input"
                v-model="vaccineSearchTerm"
                @input="onVaccineSearch"
                @focus="showVaccineDropdown = true"
                :placeholder="outsideMode ? 'Search antigen (outside record)...' : 'Type to search vaccine (inventory)...'"
                autocomplete="off"
                required
              />
              <div v-if="showVaccineDropdown" class="vaccine-dropdown">
                <template v-if="filteredVaccineOptions.length > 0">
                  <button
                    v-for="vaccine in filteredVaccineOptions"
                    :key="outsideMode ? vaccine.vaccine_id : vaccine.inventory_id"
                    type="button"
                    class="vaccine-option"
                    :class="{ 'disabled': !outsideMode && vaccine.isExpired }"
                    @click.stop="selectVaccine(vaccine)"
                    :disabled="!outsideMode && vaccine.isExpired"
                  >
                    <div class="vaccine-option-main">
                      <strong>{{ vaccine.antigen_name }}</strong>
                      <span v-if="!outsideMode" class="vaccine-brand">{{ vaccine.manufacturer }}</span>
                    </div>
                    <div v-if="!outsideMode" class="vaccine-option-details">
                      <span>Lot: {{ vaccine.lot_number }}</span>
                      <span>Stock: {{ vaccine.current_stock_level ?? vaccine.current_stock ?? 0 }}</span>
                      <span v-if="vaccine.isExpired" class="vaccine-expired">EXPIRED</span>
                    </div>
                  </button>
                </template>
                <div v-else class="vaccine-no-results">
                  {{ (outsideMode ? vaccineCatalog.length : vaccineOptions.length) === 0 ? 'Loading vaccines...' : 'No vaccines found' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Disease Prevented (readonly) -->
          <div v-if="serviceForm.diseasePrevented" class="form-group">
            <label class="form-label">Disease Prevented</label>
            <input 
              type="text"
              class="form-input"
              v-model="serviceForm.diseasePrevented"
              readonly
            />
          </div>

          <!-- Dose Number & Date -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Dose Number *</label>
              <select class="form-input" v-model="serviceForm.doseNumber" required>
                <option value="">Select dose</option>
                <option v-for="dose in availableDoses" :key="dose" :value="dose">Dose {{ dose }}</option>
              </select>
              <small v-if="autoSelectHint" class="form-hint success">{{ autoSelectHint }}</small>
            </div>
            <div class="form-group">
              <label class="form-label">Date Administered *</label>
              <input 
                type="date"
                class="form-input"
                v-model="serviceForm.dateAdministered"
                @change="updateAgeCalculation"
                required
              />
            </div>
          </div>

          <!-- Age & Manufacturer -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Age at Administration</label>
              <input 
                type="text"
                class="form-input"
                :value="serviceForm.ageAtAdmin"
                placeholder="Auto-calculated"
                readonly
              />
            </div>
            <div v-if="!outsideMode" class="form-group">
              <label class="form-label">Manufacturer</label>
              <input 
                type="text"
                class="form-input"
                v-model="serviceForm.manufacturer"
                placeholder="Auto-filled from inventory"
              />
            </div>
          </div>

          <!-- Lot Number & Site -->
          <div class="form-row">
            <div v-if="!outsideMode" class="form-group">
              <label class="form-label">Lot Number</label>
              <input 
                type="text"
                class="form-input"
                v-model="serviceForm.lotNumber"
                placeholder="Auto-filled from inventory"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Site of Administration</label>
              <select class="form-input" v-model="serviceForm.site">
                <option value="">Select a site</option>
                <option value="left-deltoid">Left Deltoid</option>
                <option value="right-deltoid">Right Deltoid</option>
                <option value="left-thigh">Left Thigh</option>
                <option value="right-thigh">Right Thigh</option>
              </select>
            </div>
          </div>

          <!-- Facility Name -->
          <div class="form-group">
            <label class="form-label">Facility Name</label>
            <input 
              type="text"
              class="form-input"
              v-model="serviceForm.facilityName"
              placeholder="Enter facility name"
            />
          </div>

          <!-- Remarks -->
          <div class="form-group">
            <label class="form-label">Remarks</label>
            <textarea 
              class="form-input" 
              rows="3" 
              v-model="serviceForm.remarks"
              placeholder="Enter any remarks or notes..."
            ></textarea>
          </div>

          <!-- Form Actions -->
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              <i class="bi bi-check-lg"></i>
              {{ editingIndex !== null ? 'Update' : 'Add' }} Service
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, onBeforeUnmount } from 'vue'
import { useVaccineSelection } from '@/features/health-worker/patients/composables'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  editingIndex: {
    type: Number,
    default: null
  },
  currentPatient: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:show', 'save'])

// Use vaccine selection composable
const {
  vaccineOptions,
  vaccineCatalog,
  vaccineSearchTerm,
  showVaccineDropdown,
  showNipOnly,
  outsideMode,
  availableDoses,
  autoSelectHint,
  serviceForm,
  filteredVaccineOptions,
  fetchVaccineInventory,
  fetchVaccineCatalog,
  refreshVaccineSources,
  onVaccineSearch,
  selectVaccine: selectVaccineFromComposable,
  onOutsideToggle,
  resetServiceForm
} = useVaccineSelection()

// Initialize on mount
onMounted(async () => {
  await fetchVaccineInventory()
  await fetchVaccineCatalog()
  
  // Close dropdown when clicking outside
  document.addEventListener('click', closeVaccineDropdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeVaccineDropdown)
})

const closeVaccineDropdown = () => {
  showVaccineDropdown.value = false
}

const selectVaccine = async (vaccine) => {
  await selectVaccineFromComposable(vaccine, updateSmartDoses)
}

const updateSmartDoses = async (vaccineId) => {
  // TODO: Implement smart dose detection based on patient's existing records
  // This would query the patient's immunization history and suggest next dose
  console.log('Smart dose detection for vaccine:', vaccineId)
}

const updateAgeCalculation = () => {
  if (!props.currentPatient?.childInfo?.birthDate || !serviceForm.value.dateAdministered) {
    serviceForm.value.ageAtAdmin = ''
    return
  }

  const birthDate = new Date(props.currentPatient.childInfo.birthDate)
  const adminDate = new Date(serviceForm.value.dateAdministered)
  
  const ageInMonths = Math.floor((adminDate - birthDate) / (1000 * 60 * 60 * 24 * 30.44))
  const ageInDays = Math.floor((adminDate - birthDate) / (1000 * 60 * 60 * 24))

  if (ageInMonths >= 36) {
    const years = Math.floor(ageInMonths / 12)
    serviceForm.value.ageAtAdmin = `${years} year${years !== 1 ? 's' : ''}`
  } else {
    const months = ageInMonths
    const days = ageInDays % 30
    serviceForm.value.ageAtAdmin = `${months} months ${days} days`
  }
}

const closeModal = () => {
  resetServiceForm()
  emit('update:show', false)
}

const saveService = () => {
  // Validate required fields
  if (!serviceForm.value.vaccineId || !serviceForm.value.doseNumber || !serviceForm.value.dateAdministered) {
    return
  }

  emit('save', { ...serviceForm.value })
  closeModal()
}

// Watch for date changes to update age
watch(() => serviceForm.value.dateAdministered, updateAgeCalculation)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-header h3 i {
  color: #3b82f6;
}

.btn-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-toggles {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4b5563;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1f2937;
  background: white;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:read-only {
  background: #f9fafb;
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.vaccine-search-wrapper {
  position: relative;
}

.vaccine-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  margin-top: 0.25rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.vaccine-option {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: white;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;
}

.vaccine-option:hover {
  background: #f9fafb;
}

.vaccine-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vaccine-option-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.vaccine-option-main strong {
  color: #1f2937;
}

.vaccine-brand {
  color: #6b7280;
  font-size: 0.875rem;
}

.vaccine-option-details {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.vaccine-expired {
  color: #ef4444;
  font-weight: 600;
}

.vaccine-no-results {
  padding: 2rem 1rem;
  text-align: center;
  color: #6b7280;
}

.form-hint {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.form-hint.success {
  color: #059669;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary,
.btn-primary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

@media (max-width: 640px) {
  .modal-container {
    max-height: 95vh;
    margin: 0.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
