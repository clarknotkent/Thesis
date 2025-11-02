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
                <input type="checkbox" v-model="showNipOnly" @change="handleNipChange" />
                <span>NIP only</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="outsideMode" @change="handleOutsideToggle" />
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
              <select class="form-input" v-model.number="serviceForm.doseNumber" required>
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
            <div class="form-group">
              <label class="form-label">Manufacturer</label>
              <input 
                type="text"
                class="form-input"
                v-model="serviceForm.manufacturer"
                :readonly="!outsideMode"
                :placeholder="outsideMode ? 'Enter manufacturer (optional)' : 'Auto-filled from inventory'"
              />
            </div>
          </div>

          <!-- Lot Number & Site -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Lot Number</label>
              <input 
                type="text"
                class="form-input"
                v-model="serviceForm.lotNumber"
                :readonly="!outsideMode"
                :placeholder="outsideMode ? 'Enter lot number (optional)' : 'Auto-filled from inventory'"
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

          <!-- Administered By (Outside only) -->
          <div class="form-group" v-if="outsideMode">
            <label class="form-label">Administered By (Name)</label>
            <input
              type="text"
              class="form-input"
              v-model="serviceForm.healthStaff"
              placeholder="Enter name of administering staff"
            />
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
import api from '@/services/api'
import { addToast } from '@/composables/useToast'
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
  // editingService: full service object passed when editing an existing service
  editingService: {
    type: Object,
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

const getPatientId = () => props.currentPatient?.id || props.currentPatient?.patient_id || props.currentPatient?.childInfo?.id || null

const handleNipChange = async () => {
  await refreshVaccineSources(getPatientId())
}

const handleOutsideToggle = async () => {
  await onOutsideToggle(getPatientId())
}

// Initialize on mount
onMounted(async () => {
  await refreshVaccineSources(getPatientId())

  // Close dropdown when clicking outside
  document.addEventListener('click', closeVaccineDropdown)
})

// Ensure we remove the global click listener on unmount
onBeforeUnmount(() => {
  document.removeEventListener('click', closeVaccineDropdown)
})

// Local handler to close dropdown when clicking outside
const closeVaccineDropdown = () => {
  showVaccineDropdown.value = false
}

// Wrapper to call composable's select and then update smart doses
const selectVaccine = async (vaccine) => {
  await selectVaccineFromComposable(vaccine, updateSmartDoses)
}

// Query backend for smart-dose info and update available doses and auto-select
const updateSmartDoses = async (vaccineId) => {
  try {
    if (!vaccineId) {
      availableDoses.value = []
      autoSelectHint.value = ''
      return
    }
    const pid = getPatientId()
    if (!pid) return
    const res = await api.get(`/patients/${pid}/smart-doses`, { params: { vaccine_id: vaccineId } })
    const data = res.data?.data || res.data || {}

    // Determine all possible doses for the schedule
    let all = data.all_doses || data.schedule_doses || []
    if (typeof all === 'number') {
      all = Array.from({ length: all }, (_, i) => i + 1)
    }
    const allArr = Array.isArray(all) ? all : []
    availableDoses.value = allArr

    // Normalize arrays for selection logic
    const avail = Array.isArray(data.available_doses) ? data.available_doses.map(Number) : []
    const completed = Array.isArray(data.completed_doses) ? data.completed_doses.map(Number) : []

    // If backend suggests a dose, apply and hint it
    autoSelectHint.value = ''
    const suggested = data.auto_select != null ? Number(data.auto_select) : null
    if (suggested && allArr.includes(suggested)) {
      serviceForm.value.doseNumber = suggested
      autoSelectHint.value = `Suggested: Dose ${suggested}`
    } else if (avail.length > 0) {
      const next = Math.min(...avail)
      if (allArr.includes(next)) {
        serviceForm.value.doseNumber = next
        autoSelectHint.value = `Suggested: Dose ${next}`
      }
    } else if (allArr.length > 0 && completed.length > 0) {
      const firstRemaining = allArr.find(d => !completed.includes(Number(d)))
      if (firstRemaining) {
        serviceForm.value.doseNumber = Number(firstRemaining)
        autoSelectHint.value = `Suggested: Dose ${firstRemaining}`
      }
    } else if (
      serviceForm.value.doseNumber &&
      !availableDoses.value.includes(Number(serviceForm.value.doseNumber))
    ) {
      serviceForm.value.doseNumber = ''
    }
  } catch (e) {
    // On failure, don't block UI; keep existing selections
    console.warn('updateSmartDoses failed', e?.response?.data || e.message)
  }
}

const updateAgeCalculation = () => {
  // Support multiple possible birthdate fields to be robust across API shapes
  const patient = props.currentPatient || {}
  const birthCandidates = [
    patient?.childInfo?.birthDate,
    patient?.date_of_birth,
    patient?.birth_date,
    patient?.dob,
    patient?.birthDate
  ]
  const birthRaw = birthCandidates.find(b => !!b)

  const adminRaw = serviceForm.value.dateAdministered
  if (!birthRaw || !adminRaw) {
    serviceForm.value.ageAtAdmin = ''
    return
  }

  const parseYmd = (val) => {
    if (!val) return null
    if (val instanceof Date) {
      return { y: val.getFullYear(), m: val.getMonth() + 1, d: val.getDate() }
    }
    if (typeof val === 'string') {
      // Try ISO yyyy-mm-dd
      const iso = val.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (iso) return { y: +iso[1], m: +iso[2], d: +iso[3] }
      // Try mm/dd/yyyy
      const us = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (us) return { y: +us[3], m: +us[1], d: +us[2] }
      // Fallback to Date parsing
      const d = new Date(val)
      if (!isNaN(d.getTime())) return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
      return null
    }
    return null
  }

  const birth = parseYmd(birthRaw)
  const admin = parseYmd(adminRaw)
  if (!birth || !admin) {
    serviceForm.value.ageAtAdmin = ''
    return
  }

  const daysInMonth = (y, m) => new Date(y, m, 0).getDate() // m is 1..12

  // Compute calendar months and days difference precisely
  let months = (admin.y - birth.y) * 12 + (admin.m - birth.m)
  let days
  if (admin.d < birth.d) {
    months -= 1
    const prevMonthYear = admin.m === 1 ? admin.y - 1 : admin.y
    const prevMonth = admin.m === 1 ? 12 : admin.m - 1
    const dim = daysInMonth(prevMonthYear, prevMonth)
    days = dim - birth.d + admin.d
  } else {
    days = admin.d - birth.d
  }

  if (months < 0 || (months === 0 && days < 0)) {
    serviceForm.value.ageAtAdmin = ''
    return
  }

  if (months >= 36) {
    const years = Math.floor(months / 12)
    serviceForm.value.ageAtAdmin = `${years} year${years !== 1 ? 's' : ''}`
  } else {
    serviceForm.value.ageAtAdmin = `${months} months ${days} days`
  }
}

/**
 * Prefill service form when editing an existing service
 */
const populateFromEditingService = async (svc) => {
  if (!svc) return
  // Map common fields coming from the parent service object
  serviceForm.value.inventoryId = svc.inventoryId || svc.inventory_id || svc.inventoryId || ''
  serviceForm.value.vaccineId = svc.vaccineId || svc.vaccine_id || svc.vaccineId || svc.vaccine_id || ''
  serviceForm.value.vaccineName = svc.vaccineName || svc.vaccine_name || svc.antigen_name || svc.vaccineName || ''
  serviceForm.value.diseasePrevented = svc.diseasePrevented || svc.disease_prevented || ''
  serviceForm.value.doseNumber = svc.doseNumber || svc.dose_number || svc.dose || ''
  // Ensure date format is yyyy-mm-dd for input[type=date]
  const rawDate = svc.dateAdministered || svc.date_administered || svc.date || ''
  if (rawDate) {
    const d = new Date(rawDate)
    if (!isNaN(d.getTime())) {
      const iso = d.toISOString().slice(0,10)
      serviceForm.value.dateAdministered = iso
    } else {
      serviceForm.value.dateAdministered = rawDate
    }
  }
  serviceForm.value.ageAtAdmin = svc.ageAtAdmin || svc.age_at_admin || ''
  serviceForm.value.manufacturer = svc.manufacturer || ''
  serviceForm.value.lotNumber = svc.lotNumber || svc.lot_number || ''
  serviceForm.value.site = svc.site || ''
  serviceForm.value.facilityName = svc.facilityName || svc.facility_name || ''
  serviceForm.value.outsideFacility = svc.outsideFacility || svc.outside_facility || false
  serviceForm.value.remarks = svc.remarks || svc.note || ''

  // Run smart-dose suggestion for the vaccine id (if available)
  if (serviceForm.value.vaccineId) await updateSmartDoses(serviceForm.value.vaccineId)
  // Recompute age based on filled date
  updateAgeCalculation()
}

// Watch editingService prop to prefill when provided
watch(() => props.editingService, (val) => {
  if (val) populateFromEditingService(val)
})

// Also populate when modal is shown and editingService already exists
watch(() => props.show, (val) => {
  if (val && props.editingService) populateFromEditingService(props.editingService)
  if (!val) {
    // When closing, reset form
    resetServiceForm()
  }
})

const closeModal = () => {
  resetServiceForm()
  emit('update:show', false)
}

const saveService = () => {
  // Validate required fields
  if (!serviceForm.value.vaccineId || !serviceForm.value.doseNumber || !serviceForm.value.dateAdministered) {
    return
  }

  // If in-facility (not outside), require an inventory/lot selection
  const isOutside = !!serviceForm.value.outsideFacility
  if (!isOutside && !serviceForm.value.inventoryId) {
    addToast({ title: 'Validation Error', message: 'Please select a lot/stock for in-facility vaccine', type: 'error' })
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
