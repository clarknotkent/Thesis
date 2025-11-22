<template>
  <HealthWorkerLayout>
    <div class="edit-record-container">
      <!-- Fixed Header -->
      <div class="edit-record-header-section">
        <div class="header-content">
          <button
            class="btn-back"
            :disabled="saving"
            @click="handleBack"
          >
            <i class="bi bi-arrow-left" />
          </button>
          <div class="header-title">
            <h1>{{ form.vaccineName ? `Edit ${form.vaccineName}` : 'Edit Vaccination Record' }}</h1>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="loading-section"
      >
        <div class="spinner" />
        <p>Loading vaccination record...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="error-section"
      >
        <i class="bi bi-exclamation-circle" />
        <p>{{ error }}</p>
        <button
          class="btn-retry"
          @click="fetchVaccinationRecord"
        >
          <i class="bi bi-arrow-clockwise" />
          Retry
        </button>
      </div>

      <!-- Edit Form -->
      <div
        v-else-if="vaccinationRecord"
        class="edit-form-content"
      >
        <!-- Other doses navigator (quick jump between doses of same vaccine) -->
        <div
          v-if="otherDoses.length > 0"
          class="dose-navigator"
        >
          <div
            v-for="dose in otherDoses"
            :key="dose.immunization_id || dose.id"
            class="dose-pill"
            :class="{ 
              active: String(dose.immunization_id || dose.id) === String(recordId),
              disabled: isBHS && !isDoseOutside(dose)
            }"
            :title="isBHS && !isDoseOutside(dose) ? 'BHS users can only access outside vaccination records' : ''"
            role="button"
            tabindex="0"
            @click="handleDosePillClick(dose)"
          >
            <div class="dose-label">
              Dose {{ dose.dose_number || dose.dose || dose.doseNumber || '—' }}
            </div>
            <div class="dose-date">
              {{ formatDisplayDate(dose) }}
            </div>
          </div>
        </div>
        <form @submit.prevent="handleSubmit">
          <!-- Vaccine Name (Read-only) -->
          <div class="form-group">
            <label class="form-label">Vaccine Name *</label>
            <input 
              v-model="form.vaccineName" 
              type="text" 
              class="form-input"
              readonly
              disabled
            >
            <small class="form-hint">Vaccine name cannot be changed</small>
          </div>

          <!-- Dose Number -->
          <div class="form-group">
            <label class="form-label">Dose Number *</label>
            <select 
              v-model="form.doseNumber" 
              class="form-input"
              required
              @change="onDoseChange"
            >
              <option value="">
                Select dose number
              </option>
              <option 
                v-for="dose in availableDoses" 
                :key="dose"
                :value="dose"
              >
                Dose {{ dose }}
              </option>
            </select>
            <small
              v-if="autoSelectHint"
              class="form-hint success"
            >{{ autoSelectHint }}</small>
          </div>

          <!-- Date Administered -->
          <div class="form-group">
            <label class="form-label">Date Administered *</label>
            <DateInput 
              v-model="form.dateAdministered"
              :required="true"
              output-format="iso"
              :max="immunizationDateMax"
              :min="immunizationDateMin"
              @update:model-value="calculateAge"
            />
            <div class="form-text small text-muted">
              Min: {{ immunizationDateMin || 'Patient DOB' }} | Max: {{ immunizationDateMax || 'Today' }}
            </div>
          </div>

          <!-- Age at Administration (Auto-calculated) -->
          <div class="form-group">
            <label class="form-label">Age at Administration</label>
            <input 
              v-model="form.ageAtAdministration" 
              type="text" 
              class="form-input"
              readonly
            >
            <small class="form-hint">Automatically calculated from date administered</small>
          </div>

          <!-- Administered By: show select for in-facility, free-text for outside -->
          <div class="form-group">
            <label class="form-label">Administered By *</label>
            <div v-if="!form.isOutside">
              <select 
                v-model="form.administeredBy" 
                class="form-input"
                required
                :disabled="form.isOutside"
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
                v-model="form.administeredByDisplay"
                type="text"
                class="form-input"
                placeholder="Name of vaccinator or provider"
              >
              <small class="form-hint">For outside immunizations, enter vaccinator name (will be stored in remarks)</small>
            </div>
          </div>

          <!-- Site of Administration -->
          <div class="form-group">
            <label class="form-label">Site of Administration</label>
            <select 
              v-model="form.siteOfAdministration" 
              class="form-input"
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
              v-model="form.manufacturer" 
              type="text" 
              class="form-input"
              placeholder="e.g., Sanofi Pasteur"
              :readonly="!form.isOutside"
            >
            <small
              v-if="!form.isOutside"
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
              v-model="form.lotNumber" 
              type="text" 
              class="form-input"
              placeholder="e.g., L123456"
              :readonly="!form.isOutside"
            >
            <small
              v-if="!form.isOutside"
              class="form-hint"
            >Auto-filled from inventory / read-only for in-facility</small>
            <small
              v-else
              class="form-hint"
            >Editable for outside immunizations</small>
          </div>

          <!-- Facility Name -->
          <div class="form-group">
            <label class="form-label">Facility Name *</label>
            <input 
              v-model="form.facilityName" 
              type="text" 
              class="form-input"
              placeholder="e.g., Barangay Health Center"
              required
            >
          </div>

          <!-- Remarks -->
          <div class="form-group">
            <label class="form-label">Remarks</label>
            <textarea 
              v-model="form.remarks" 
              class="form-input"
              rows="4"
              placeholder="Additional notes or observations..."
            />
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button 
              type="button" 
              class="btn-cancel"
              :disabled="saving"
              @click="handleBack"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn-save"
              :disabled="saving || !isFormValid"
            >
              <i
                v-if="!saving"
                class="bi bi-check-circle-fill"
              />
              <span
                v-else
                class="spinner-small"
              />
              {{ saving ? 'Saving...' : 'Save All Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </HealthWorkerLayout>
  <!-- Approval modal for second approver -->
  <ApprovalModal
    v-if="showApproval"
    @approved="onApproverApproved"
    @cancel="onApproverCancel"
  />
</template>

<script setup>
import { addToast } from '@/composables/useToast'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import { useVaccinationRecordEditor } from '@/features/health-worker/patients/composables'
import ApprovalModal from '@/components/ApprovalModal.vue'
import api from '@/services/api'
import { useAuth } from '@/composables/useAuth'
import DateInput from '@/components/ui/form/DateInput.vue'
import { useImmunizationDateBounds } from '@/composables/useImmunizationDateBounds'

const router = useRouter()
const route = useRoute()

// Props from route params
const patientId = computed(() => route.params.patientId)
const recordId = computed(() => route.params.recordId)

// Get user authentication and role
const { userInfo } = useAuth()
const isBHS = computed(() => {
  const user = userInfo.value
  return user && user.role === 'HealthStaff' && user.hs_type === 'bhs'
})

// Use the immunization date bounds composable
const { immunizationDateMin, immunizationDateMax, updateImmunizationDateConstraints } = useImmunizationDateBounds()

// Debug role detection
console.log('🔍 [EditVaccinationRecord] Role detection:', {
  userInfo: userInfo.value,
  isBHS: isBHS.value,
  userRole: userInfo.value?.role,
  hsType: userInfo.value?.hs_type
})

// Use vaccination record editor composable
const {
  loading,
  saving,
  error,
  vaccinationRecord,
  nurses,
  form,
  isFormValid,
  otherDoses,
  calculateAge,
  fetchVaccinationRecord,
  prepareUpdateData
} = useVaccinationRecordEditor(patientId, recordId)

// Debug otherDoses data
watch(otherDoses, (newDoses) => {
  console.log('🔍 [EditVaccinationRecord] otherDoses updated:', newDoses.map(dose => ({
    id: dose.immunization_id || dose.id,
    dose_number: dose.dose_number || dose.dose,
    immunization_outside: dose.immunization_outside,
    vaccine_name: dose.vaccine_antigen_name || dose.vaccineName
  })))
}, { immediate: true })

// Watch for vaccination record changes to update smart dates
watch(vaccinationRecord, async (newRecord) => {
  if (newRecord && form.value.doseNumber) {
    await updateImmunizationDateConstraints(patientId.value, newRecord.vaccine_id, form.value.doseNumber)
  }
}, { immediate: true })

// Watch for dose changes to update date constraints
watch(() => form.value.doseNumber, async (newDoseNumber) => {
  if (newDoseNumber && vaccinationRecord.value?.vaccine_id) {
    await updateImmunizationDateConstraints(patientId.value, vaccinationRecord.value.vaccine_id, newDoseNumber)
  }
})

// Local state for approval modal
const showApproval = ref(false)
const pendingUpdateData = ref(null)

// Smart dose state
const availableDoses = ref([1, 2, 3, 4])
const autoSelectHint = ref('')

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
  if (!updateData) {
    // prepareUpdateData sets composable error.value; show toast to surface to user
    addToast({ title: 'Invalid', message: (error.value || 'Invalid administered date'), type: 'error' })
    return
  }

  pendingUpdateData.value = updateData
  // Show approval modal for secondary sign-off
  showApproval.value = true
}

// Handle dose pill click with BHS restrictions and debugging
const handleDosePillClick = (dose) => {
  const doseId = dose.immunization_id || dose.id
  const isOutside = isDoseOutside(dose)
  
  console.log('🔍 [EditVaccinationRecord] Dose pill clicked:', {
    doseId,
    isBHS: isBHS.value,
    isOutside,
    shouldRestrict: isBHS.value && !isOutside,
    userInfo: userInfo.value,
    doseData: {
      immunization_outside: dose.immunization_outside,
      vaccine_name: dose.vaccine_antigen_name
    }
  })
  
  if (isBHS.value && !isOutside) {
    console.log('🚫 [EditVaccinationRecord] BHS user blocked from clicking in-facility dose - DEBUGGER WOULD PAUSE HERE')
    console.log('🔍 [EditVaccinationRecord] Current state:', {
      userInfo: userInfo.value,
      isBHS: isBHS.value,
      doseId,
      isOutside,
      dose
    })
    // Show warning toast for BHS users trying to access in-facility records
    addToast({ 
      title: 'Access Restricted', 
      message: 'BHS health staff can only access outside vaccination records. Please contact a nurse or nutritionist for in-facility records.', 
      type: 'warning' 
    })
    // Uncomment the next line to enable debugger: debugger
    return
  }
  
  jumpToDose(doseId)
}

// Navigate to edit a different dose (routes to same component with new recordId)
const jumpToDose = (id) => {
  if (!id) return
  router.push({ name: 'EditVaccinationRecord', params: { patientId: patientId.value, recordId: id } })
}

// Check if a dose record is outside immunization
const isDoseOutside = (dose) => {
  const result = !!(dose?.immunization_outside || dose?.is_outside || dose?.isOutside || dose?.outside_immunization || dose?.outside)
  console.log('🔍 [EditVaccinationRecord] isDoseOutside check:', {
    doseId: dose?.immunization_id || dose?.id,
    immunization_outside: dose?.immunization_outside,
    is_outside: dose?.is_outside,
    isOutside: dose?.isOutside,
    outside_immunization: dose?.outside_immunization,
    outside: dose?.outside,
    result
  })
  return result
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
    const month = String(dt.getMonth() + 1).padStart(2, '0')
    const day = String(dt.getDate()).padStart(2, '0')
    const year = dt.getFullYear()
    return `${month}/${day}/${year}`
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

// Handle dose change to update smart dates
const onDoseChange = async () => {
  await updateSmartDates()
  // Also update immunization date constraints
  if (vaccinationRecord.value?.vaccine_id && form.value.doseNumber) {
    await updateImmunizationDateConstraints(patientId.value, vaccinationRecord.value.vaccine_id, form.value.doseNumber)
  }
}

// Query backend for smart-dose info and update date suggestions
const updateSmartDates = async () => {
  try {
    if (!vaccinationRecord.value?.vaccine_id) {
      autoSelectHint.value = ''
      return
    }
    
    const pid = patientId.value
    if (!pid) return
    
    const res = await api.get(`/patients/${pid}/smart-doses`, { 
      params: { vaccine_id: vaccinationRecord.value.vaccine_id } 
    })
    const data = res.data?.data || res.data || {}

    // Determine all possible doses for the schedule
    let all = data.all_doses || data.schedule_doses || []
    if (typeof all === 'number') {
      all = Array.from({ length: all }, (_, i) => i + 1)
    }
    const allArr = Array.isArray(all) ? all : []
    availableDoses.value = allArr.length > 0 ? allArr : [1, 2, 3, 4]

    // If backend suggests a dose, apply and hint it
    autoSelectHint.value = ''
    const suggested = data.auto_select != null ? Number(data.auto_select) : null
    if (suggested && allArr.includes(suggested) && !form.value.dateAdministered) {
      // Auto-set date_administered based on smart date for the suggested dose
      const smartDates = data.smart_dates || {}
      if (smartDates[suggested]) {
        form.value.dateAdministered = smartDates[suggested]
        calculateAge()
        autoSelectHint.value = `Suggested date for Dose ${suggested}`
      }
    } else if (form.value.doseNumber && !form.value.dateAdministered) {
      // Auto-set date for the currently selected dose
      const smartDates = data.smart_dates || {}
      const currentDose = Number(form.value.doseNumber)
      if (smartDates[currentDose]) {
        form.value.dateAdministered = smartDates[currentDose]
        calculateAge()
        autoSelectHint.value = `Suggested date for Dose ${currentDose}`
      }
    }
  } catch (e) {
    // On failure, don't block UI; keep existing selections
    console.warn('updateSmartDates failed', e?.response?.data || e.message)
    autoSelectHint.value = ''
  }
}

// Parse structured remarks produced by admin UI into discrete fields.
// Returns { manufacturer, lot, site, facility, administeredBy, otherRemarks }
const _parseRemarksForOutside = (remarks) => {
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
const _buildStructuredRemarks = (f) => {
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
  fetchHealthWorkers()
})
</script>

<style scoped>
/* Container */
.edit-record-container {
  min-height: 100vh;
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

.form-hint.success {
  color: #059669;
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

.dose-pill.disabled {
  background: #f3f4f6;
  color: #9ca3af;
  border-color: #e5e7eb;
  cursor: not-allowed;
  opacity: 0.6;
}

.dose-pill.disabled:hover {
  background: #f3f4f6;
  color: #9ca3af;
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


