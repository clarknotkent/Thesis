<template>
  <HealthWorkerLayout>
    <div class="edit-record-container">
      <!-- Fixed Header -->
      <div class="edit-record-header-section">
        <div class="header-content">
          <button class="btn-back" @click="handleBack" :disabled="saving">
            <i class="bi bi-arrow-left"></i>
          </button>
          <div class="header-title">
            <h1>{{ form.vaccineName ? `Edit ${form.vaccineName}` : 'Edit Vaccination Record' }}</h1>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-section">
        <div class="spinner"></div>
        <p>Loading vaccination record...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-section">
        <i class="bi bi-exclamation-circle"></i>
        <p>{{ error }}</p>
        <button class="btn-retry" @click="fetchVaccinationRecord">
          <i class="bi bi-arrow-clockwise"></i>
          Retry
        </button>
      </div>

      <!-- Edit Form -->
      <div v-else-if="vaccinationRecord" class="edit-form-content">
        <!-- Other doses navigator (quick jump between doses of same vaccine) -->
        <div v-if="otherDoses.length > 0" class="dose-navigator">
          <div
            v-for="dose in otherDoses"
            :key="dose.immunization_id || dose.id"
            class="dose-pill"
            :class="{ active: String(dose.immunization_id || dose.id) === String(recordId) }"
            @click="jumpToDose(dose.immunization_id || dose.id)"
            role="button"
            tabindex="0"
          >
            <div class="dose-label">Dose {{ dose.dose_number || dose.dose || dose.doseNumber || '—' }}</div>
            <div class="dose-date">{{ formatDisplayDate(dose) }}</div>
          </div>
        </div>
        <form @submit.prevent="handleSubmit">
          <!-- Vaccine Name (Read-only) -->
          <div class="form-group">
            <label class="form-label">Vaccine Name *</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="form.vaccineName"
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
              v-model="form.doseNumber"
              required
            >
              <option value="">Select dose number</option>
              <option value="1">Dose 1</option>
              <option value="2">Dose 2</option>
              <option value="3">Dose 3</option>
              <option value="4">Booster</option>
            </select>
          </div>

          <!-- Date Administered -->
          <div class="form-group">
            <label class="form-label">Date Administered *</label>
            <input 
              type="date" 
              class="form-input" 
              v-model="form.dateAdministered"
              @change="calculateAge"
              required
              :max="todayDate"
            >
          </div>

          <!-- Age at Administration (Auto-calculated) -->
          <div class="form-group">
            <label class="form-label">Age at Administration</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="form.ageAtAdministration"
              readonly
            >
            <small class="form-hint">Automatically calculated from date administered</small>
          </div>

          <!-- Administered By: show select for in-facility, free-text for outside -->
          <div class="form-group">
            <label class="form-label">Administered By *</label>
            <div v-if="!form.isOutside">
              <select 
                class="form-input" 
                v-model="form.administeredBy"
                required
                :disabled="form.isOutside"
              >
                <option value="">Select health staff</option>
                <option 
                  v-for="nurse in nurses" 
                  :key="nurse.user_id" 
                  :value="nurse.user_id"
                >
                  {{ nurse.fullname }} ({{ nurse.hs_type }})
                </option>
                <option v-if="nurses.length === 0" disabled>No nurses/nutritionists available</option>
              </select>
            </div>
            <div v-else>
              <input
                type="text"
                class="form-input"
                v-model="form.administeredByDisplay"
                placeholder="Name of vaccinator or provider"
              />
              <small class="form-hint">For outside immunizations, enter vaccinator name (will be stored in remarks)</small>
            </div>
          </div>

          <!-- Site of Administration -->
          <div class="form-group">
            <label class="form-label">Site of Administration</label>
            <select 
              class="form-input" 
              v-model="form.siteOfAdministration"
            >
              <option value="">Select a site</option>
              <option value="Left arm (deltoid)">Left arm (deltoid)</option>
              <option value="Right arm (deltoid)">Right arm (deltoid)</option>
              <option value="Left thigh (anterolateral)">Left thigh (anterolateral)</option>
              <option value="Right thigh (anterolateral)">Right thigh (anterolateral)</option>
              <option value="Oral">Oral</option>
            </select>
          </div>

          <!-- Manufacturer -->
          <div class="form-group">
            <label class="form-label">Manufacturer</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="form.manufacturer"
              placeholder="e.g., Sanofi Pasteur"
              :readonly="!form.isOutside"
            >
            <small class="form-hint" v-if="!form.isOutside">Auto-filled from inventory / read-only for in-facility</small>
            <small class="form-hint" v-else>Editable for outside immunizations</small>
          </div>

          <!-- Lot Number -->
          <div class="form-group">
            <label class="form-label">Lot Number</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="form.lotNumber"
              placeholder="e.g., L123456"
              :readonly="!form.isOutside"
            >
            <small class="form-hint" v-if="!form.isOutside">Auto-filled from inventory / read-only for in-facility</small>
            <small class="form-hint" v-else>Editable for outside immunizations</small>
          </div>

          <!-- Facility Name -->
          <div class="form-group">
            <label class="form-label">Facility Name</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="form.facilityName"
              placeholder="e.g., Barangay Health Center"
            >
          </div>

          <!-- Remarks -->
          <div class="form-group">
            <label class="form-label">Remarks</label>
            <textarea 
              class="form-input" 
              v-model="form.remarks"
              rows="4"
              placeholder="Additional notes or observations..."
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button 
              type="button" 
              class="btn-cancel"
              @click="handleBack"
              :disabled="saving"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn-save"
              :disabled="saving || !isFormValid"
            >
              <i class="bi bi-check-circle-fill" v-if="!saving"></i>
              <span class="spinner-small" v-else></span>
              {{ saving ? 'Saving...' : 'Save All Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </HealthWorkerLayout>
  <!-- Approval modal for second approver -->
  <ApprovalModal v-if="showApproval" @approved="onApproverApproved" @cancel="onApproverCancel" />
</template>

<script setup>
import { addToast } from '@/composables/useToast'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import { useVaccinationRecordEditor } from '@/features/health-worker/patients/composables'
import ApprovalModal from '@/components/ApprovalModal.vue'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

// Props from route params
const patientId = computed(() => route.params.patientId)
const recordId = computed(() => route.params.recordId)

// Use vaccination record editor composable
const {
  loading,
  saving,
  error,
  vaccinationRecord,
  patientData,
  nurses,
  form,
  todayDate,
  isFormValid,
  otherDoses,
  calculateAge,
  formatDateForInput,
  fetchVaccinationRecord,
  prepareUpdateData,
  updateVaccinationRecord,
  resetForm
} = useVaccinationRecordEditor(patientId, recordId)

// Local state for approval modal
const showApproval = ref(false)
const pendingUpdateData = ref(null)

// Navigation and local methods
const handleBack = () => {
  if (saving.value) return
  router.push({ 
    name: 'PatientDetail', 
    params: { id: patientId.value }
  })
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    addToast({ title: 'Warning', message: 'Please fill in all required fields', type: 'warning' })
    return
  }

  // Prepare the update data using composable
  const updateData = prepareUpdateData()
  
  pendingUpdateData.value = updateData
  // Show approval modal for secondary sign-off
  showApproval.value = true
}

// Navigate to edit a different dose (routes to same component with new recordId)
const jumpToDose = (id) => {
  if (!id) return
  router.push({ name: 'EditVaccinationRecord', params: { patientId: patientId.value, recordId: id } })
}

// Ensure we re-fetch when the route recordId changes (same component instance)
watch(recordId, async (newId, oldId) => {
  if (String(newId) === String(oldId)) return
  await fetchVaccinationRecord()
})

const formatDisplayDate = (d) => {
  try {
    const v = d?.administered_date || d?.date_administered || d?.dateAdministered || d
    if (!v) return '—'
    const dt = new Date(v)
    return dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

// Called after approver credential check succeeds
const onApproverApproved = async (approver) => {
  showApproval.value = false
  if (!pendingUpdateData.value) return
  try {
    saving.value = true
    // Optionally: attach approver id into payload if DB supports it e.g. approved_by
    const payload = { ...pendingUpdateData.value }
    if (approver?.user_id) payload.approved_by = approver.user_id
    await api.put(`/immunizations/${recordId.value}`, payload)
    addToast({ title: 'Success', message: 'Vaccination record updated successfully', type: 'success' })
    handleBack()
  } catch (err) {
    console.error('❌ [EditVaccination] Error saving vaccination record after approval:', err)
    const errMsg = err.response?.data?.message || 'Failed to update vaccination record. Please try again.'
    addToast({ title: 'Error', message: errMsg, type: 'error' })
  } finally {
    saving.value = false
    pendingUpdateData.value = null
  }
}

const onApproverCancel = () => {
  showApproval.value = false
  pendingUpdateData.value = null
}

// Parse structured remarks produced by admin UI into discrete fields.
// Returns { manufacturer, lot, site, facility, administeredBy, otherRemarks }
const parseRemarksForOutside = (remarks) => {
  const result = { manufacturer: '', lot: '', site: '', facility: '', administeredBy: '', otherRemarks: '' }
  if (!remarks || !remarks.trim()) return result

  // Split by labeled separators used by admin: ' | '
  const parts = String(remarks).split(/\s*\|\s*/)
  for (const part of parts) {
    const p = part.trim()
    if (!p) continue
    const kv = p.match(/^([^:]+):\s*(.+)$/)
    if (kv) {
      const key = kv[1].toLowerCase().trim()
      const value = kv[2].trim()
      if (/^manufacturer|mfr|brand$/.test(key)) result.manufacturer = result.manufacturer || value
      else if (/^lot|batch|lot number$/.test(key)) result.lot = result.lot || value
      else if (/^site|injection site$/.test(key)) result.site = result.site || value
      else if (/^facility|center|clinic|hospital|health center$/.test(key)) result.facility = result.facility || value
      else if (/^administered by|vaccinator|given by$/.test(key)) result.administeredBy = result.administeredBy || value
      else result.otherRemarks = result.otherRemarks ? `${result.otherRemarks} | ${p}` : p
    } else {
      // fallback heuristics
      const mSite = p.match(/(?:site|injection site)[:\-]?\s*(.+)/i)
      const mFac = p.match(/(?:facility|center|clinic|hospital|health ?center)[:\-]?\s*(.+)/i)
      const mMfr = p.match(/(?:manufacturer|mfr|brand)[:\-]?\s*(.+)/i)
      const mLot = p.match(/(?:lot(?: number)?|batch)[:\-]?\s*([A-Z0-9\-]+)/i)
      const mAdmin = p.match(/(?:administered by|vaccinator|given by)[:\-]?\s*(.+)/i)
      if (mSite) result.site = result.site || mSite[1].trim()
      else if (mFac) result.facility = result.facility || mFac[1].trim()
      else if (mMfr) result.manufacturer = result.manufacturer || mMfr[1].trim()
      else if (mLot) result.lot = result.lot || mLot[1].trim()
      else if (mAdmin) result.administeredBy = result.administeredBy || mAdmin[1].trim()
      else result.otherRemarks = result.otherRemarks ? `${result.otherRemarks} | ${p}` : p
    }
  }

  return result
}

// Resolve administered-by display name (id -> name) or return free-text for outside
const getAdministeredByDisplay = (f) => {
  if (!f) return ''
  if (f.isOutside) return f.administeredByDisplay || ''
  const id = f.administeredBy
  if (!id) return ''
  const hw = nurses.value.find(n => String(n.user_id) === String(id))
  return hw ? hw.fullname : ''
}

// Build structured remarks string similar to admin: main remarks + labeled parts
const buildStructuredRemarks = (f) => {
  const main = (f.remarks && f.remarks.trim()) ? f.remarks.trim() : ''
  const parts = []
  if (f.siteOfAdministration) parts.push(`Site: ${f.siteOfAdministration}`)
  if (f.facilityName) parts.push(`Facility: ${f.facilityName}`)
  const adminName = getAdministeredByDisplay(f)
  if (adminName) parts.push(`Administered by: ${adminName}`)
  // Only include manufacturer/lot when this record is an outside immunization
  if (f.isOutside) {
    if (f.manufacturer) parts.push(`Manufacturer: ${f.manufacturer}`)
    if (f.lotNumber) parts.push(`Lot: ${f.lotNumber}`)
  }
  return [main, ...parts].filter(Boolean).join(' | ')
}

const fetchPatientData = async () => {
  try {
    const response = await api.get(`/patients/${patientId.value}`)
    patientData.value = response.data.data || response.data
  } catch (err) {
    console.error('Error fetching patient data:', err)
  }
}

const fetchHealthWorkers = async () => {
  try {
    const res = await api.get('/health-staff')
    
    // Handle different possible response structures
    let list = []
    if (res.data?.data?.healthWorkers && Array.isArray(res.data.data.healthWorkers)) {
      list = res.data.data.healthWorkers
    } else if (res.data?.data?.healthStaff && Array.isArray(res.data.data.healthStaff)) {
      list = res.data.data.healthStaff
    } else if (Array.isArray(res.data)) {
      list = res.data
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      list = res.data.data
    } else if (res.data?.users && Array.isArray(res.data.users)) {
      list = res.data.users
    } else if (res.data?.healthWorkers && Array.isArray(res.data.healthWorkers)) {
      list = res.data.healthWorkers
    } else if (res.data?.healthStaff && Array.isArray(res.data.healthStaff)) {
      list = res.data.healthStaff
    } else {
      console.warn('Unexpected health workers response structure:', res.data)
      list = []
    }
    
    // Role helpers
    const rawRole = (hw) => String(hw.hs_type || hw.hw_type || hw.role || hw.type || '').toLowerCase()
    const isNurseOrNutritionistRole = (r) => {
      const s = r.toLowerCase()
      return s.includes('nurse') || s.includes('rn') || s.includes('nutritionist') || s.includes('dietitian') || s.includes('nd')
    }
    const displayRole = (r) => {
      if (isNurseOrNutritionistRole(r)) {
        return r.includes('nutrition') || r.includes('diet') ? 'Nutritionist' : 'Nurse'
      }
      return r || 'Health Staff'
    }
    
    // For vaccination form: show Nurses and Nutritionists only
    nurses.value = list
      .filter(hw => isNurseOrNutritionistRole(rawRole(hw)))
      .map(hw => ({
        user_id: hw.user_id || hw.id || hw.health_worker_id,
        fullname: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
        hs_type: displayRole(rawRole(hw))
      }))
  } catch (err) {
    console.error('❌ [EditVaccination] Failed to load health workers:', err)
    nurses.value = []
  }
}

// main submit flow is handled earlier and gated behind approval modal

onMounted(() => {
  fetchVaccinationRecord()
})
</script>

<style scoped>
/* Container */
.edit-record-container {
  min-height: 100vh;
  background: #f3f4f6;
  padding-bottom: 100px; /* Extra padding for bottom navbar + buttons */
}

/* Fixed Header Section */
.edit-record-header-section {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 100%;
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-back:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.btn-back:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-title {
  flex: 1;
  min-width: 0;
}

.header-title h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Loading Section */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-section p {
  color: #6b7280;
  margin: 0;
}

/* Error Section */
.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.error-section i {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-section p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  font-size: 0.9375rem;
}

.btn-retry {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Form Content */
.edit-form-content {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 500;
  font-size: 0.9375rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.form-input[readonly] {
  background: #f9fafb;
  color: #6b7280;
}

textarea.form-input {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

select.form-input {
  cursor: pointer;
}

.form-hint {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  position: fixed;
  bottom: 60px; /* Above bottom navbar */
  left: 0;
  right: 0;
  z-index: 50;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 0.875rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-save {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Responsive adjustments */
@media (max-width: 375px) {
  .header-title h1 {
    font-size: 1.125rem;
  }
  
  .form-input {
    font-size: 0.9375rem;
  }
  
  .btn-cancel,
  .btn-save {
    font-size: 0.9375rem;
    padding: 0.75rem;
  }
}

/* Dose navigator pills */
.dose-navigator {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0 1rem 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.dose-pill {
  flex: 0 0 auto;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  min-width: 88px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: #374151;
}

.dose-pill.active {
  background: linear-gradient(90deg, #667eea, #764ba2);
  color: white;
  border-color: transparent;
}

.dose-label {
  font-weight: 600;
}

.dose-date {
  font-size: 0.75rem;
  color: inherit;
  opacity: 0.9;
}
</style>


