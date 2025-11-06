<template>
  <HealthWorkerLayout :show-controls="false">
    <!-- Fixed Header Section -->
    <div class="add-record-header-section">
      <div class="header-bar">
        <button
          class="back-button"
          @click="goBack"
        >
          <i class="bi bi-chevron-left" />
        </button>
        <h1 class="page-title">
          Add Immunization Record
        </h1>
        <div style="width: 40px;" />
      </div>
    </div>

    <!-- Page Content -->
    <div class="page-content-wrapper">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="loading-state"
      >
        <div class="spinner" />
        <p>Loading form data...</p>
      </div>

      <!-- Form Content -->
      <form
        v-else
        class="record-form"
        @submit.prevent="handleSubmit"
      >
        <!-- Patient Info Display (Read-only) -->
        <div class="form-section patient-info-display">
          <h3 class="section-title">
            <i class="bi bi-person-fill" />
            Patient Information
          </h3>
          <div
            v-if="currentPatient"
            class="patient-details"
          >
            <div class="patient-name">
              {{ currentPatient.childInfo?.name || `${currentPatient.firstname} ${currentPatient.surname}` }}
            </div>
            <div class="patient-meta">
              <span v-if="currentPatient.age">
                <i class="bi bi-calendar3" /> {{ currentPatient.age }} years old
              </span>
              <span v-if="currentPatient.sex">
                <i class="bi bi-gender-ambiguous" /> {{ currentPatient.sex }}
              </span>
            </div>
          </div>
          <div
            v-else
            class="text-muted"
          >
            Loading patient information...
          </div>
        </div>

        <!-- Visit Selection (Nurse/Nutritionist only) -->
        <VisitSelectorSection
          v-if="isNurseOrNutritionist"
          v-model:visit-mode="visitMode"
          v-model:existing-visit-id="existingVisitId"
          :available-visits="availableVisits"
          :loading-visits="loadingVisits"
          @ensure-visits-loaded="ensureVisitsLoaded"
        />

        <!-- Vital Signs -->
        <VitalsFormSection
          v-if="!hideVitals && visitMode === 'new'"
          v-model="formData.vitals"
          :readonly="vitalsReadOnly"
        />

        <!-- Services Section -->
        <div
          v-if="!isBHS"
          class="form-section"
        >
          <div class="section-header">
            <h3 class="section-title">
              <i class="bi bi-clipboard2-pulse-fill" />
              Services
            </h3>
            <button 
              type="button" 
              class="btn-add-service" 
              @click="showServiceForm = true"
            >
              <i class="bi bi-plus-circle-fill" />
              Add Service
            </button>
          </div>

          <ServicesListSection
            :services="addedServices"
            @edit="editService"
            @remove="removeService"
          />
        </div>

        <!-- Findings Card -->
        <div
          v-if="!isBHS"
          class="form-section"
        >
          <h3 class="section-title">
            <i class="bi bi-clipboard-data-fill" />
            Findings
          </h3>
          
          <div class="form-group">
            <label class="form-label">Findings/Notes</label>
            <textarea 
              v-model="formData.findings" 
              class="form-input" 
              rows="4"
              placeholder="Enter findings or notes about this visit..."
            />
            <small class="form-hint">This field is auto-filled after adding interventions</small>
          </div>
        </div>

        <!-- Service Rendered Card -->
        <div
          v-if="!isBHS"
          class="form-section"
        >
          <h3 class="section-title">
            <i class="bi bi-check-circle-fill" />
            Service Rendered
          </h3>
          
          <div class="form-group">
            <label class="form-label">Service Summary</label>
            <textarea 
              v-model="formData.service_rendered" 
              class="form-input" 
              rows="3"
              readonly
              placeholder="Auto-generated summary of services..."
            />
          </div>
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button
            type="button"
            class="btn-cancel"
            :disabled="submitting"
            @click="goBack"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-submit"
            :disabled="submitting || addedServices.length === 0"
          >
            <i class="bi bi-check2-circle" />
            {{ submitting ? 'Saving...' : 'Save Record' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Service Form Modal -->
    <VaccineServiceFormModal
      v-model:show="showServiceForm"
      :editing-index="editingServiceIndex"
      :editing-service="editingService"
      :current-patient="currentPatient"
      @save="handleServiceSave"
    />
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import VisitSelectorSection from '@/features/health-worker/patients/components/VisitSelectorSection.vue'
import VitalsFormSection from '@/features/health-worker/patients/components/VitalsFormSection.vue'
import ServicesListSection from '@/features/health-worker/patients/components/ServicesListSection.vue'
import VaccineServiceFormModal from '@/features/health-worker/patients/components/VaccineServiceFormModal.vue'
import { usePatientImmunizationForm } from '@/features/health-worker/patients/composables'
import { useVisitManagement } from '@/features/health-worker/patients/composables'
import { addToast } from '@/composables/useToast'
import db from '@/services/offline/db'

const router = useRouter()
const route = useRoute()

// Use composables
const {
  loading,
  submitting,
  currentPatient,
  formData,
  addedServices,
  isBHS,
  isNurseOrNutritionist,
  fetchCurrentPatient,
  validateForm,
  prepareSubmissionData
} = usePatientImmunizationForm(route.params.patientId)

const {
  visitMode,
  availableVisits,
  existingVisitId,
  vitalsReadOnly,
  hideVitals,
  loadVisitsForPatient,
  ensureVisitsLoaded,
  setupVisitWatcher,
  formatDate
} = useVisitManagement(formData)

// Local state
const showServiceForm = ref(false)
const editingServiceIndex = ref(null)
const loadingVisits = ref(false)
const editingService = computed(() => editingServiceIndex.value !== null ? addedServices.value[editingServiceIndex.value] : null)

// Initialize
onMounted(async () => {
  loading.value = true
  try {
    await fetchCurrentPatient()
    
    if (isNurseOrNutritionist.value) {
      loadingVisits.value = true
      await loadVisitsForPatient(route.params.patientId)
      setupVisitWatcher()
      loadingVisits.value = false
    }
  } catch (error) {
    addToast({ title: 'Error', message: error.message, type: 'error' })
  } finally {
    loading.value = false
  }
})

const goBack = () => {
  router.back()
}

// Reset vitals only when attaching to an existing visit AND a visit is selected
watch(existingVisitId, (newVal) => {
  if (visitMode.value === 'existing' && newVal) {
    // Clear any previously typed vitals to avoid stale data hanging around
    formData.value.vitals = {}
  }
})

const handleServiceSave = (service) => {
  if (editingServiceIndex.value !== null) {
    // Update existing service
    addedServices.value[editingServiceIndex.value] = { ...service }
    editingServiceIndex.value = null
  } else {
    // Add new service
    addedServices.value.push({ ...service })
  }
  
  // Update service_rendered and findings
  updateServiceRendered()
  updateFindings()
}

const editService = (index) => {
  editingServiceIndex.value = index
  showServiceForm.value = true
}

const removeService = (index) => {
  addedServices.value.splice(index, 1)
  updateServiceRendered()
  updateFindings()
}

const updateServiceRendered = () => {
  const vaccines = addedServices.value
    .map(s => `${s.vaccineName}${s.doseNumber ? ` (Dose ${s.doseNumber})` : ''}`)
    .join(', ')
  
  formData.value.service_rendered = vaccines || 'Immunization'
}

const updateFindings = () => {
  if (addedServices.value.length === 0) {
    formData.value.findings = ''
    return
  }

  const findingsList = addedServices.value.map(s => {
    let finding = `Administered ${s.vaccineName}`
    if (s.doseNumber) finding += ` (Dose ${s.doseNumber})`
    if (s.site) finding += ` at ${s.site}`
    if (s.dateAdministered) finding += ` on ${formatDate(s.dateAdministered)}`
    return finding
  })

  formData.value.findings = findingsList.join('. ') + '.'
}

const handleSubmit = async () => {
  // Validate form
  const errors = validateForm()
  if (errors.length > 0) {
    errors.forEach(err => addToast({ title: 'Validation Error', message: err, type: 'error' }))
    return
  }

  try {
    submitting.value = true
    
    // OFFLINE-FIRST: Save immunizations directly to Dexie (local IndexedDB)
    const submissionData = prepareSubmissionData(null)
    
    // Generate temporary IDs for each immunization
    const immunizationRecords = submissionData.services.map(service => {
      const tempId = `temp_immunization_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return {
        id: tempId,
        patient_id: submissionData.patient_id,
        vaccine_id: service.vaccine_id,
        vaccine_name: service.vaccine_name,
        disease_prevented: service.disease_prevented,
        dose_number: service.dose_number,
        administered_date: service.administered_date,
        age_at_administration: service.age_at_administration,
        manufacturer: service.manufacturer,
        lot_number: service.lot_number,
        site: service.site,
        administered_by: service.administered_by,
        facility_name: service.facility_name,
        outside: service.outside,
        remarks: service.remarks,
        inventory_id: service.inventory_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _pending: true, // Flag to indicate not synced yet
        _temp_id: tempId
      }
    })

    // STEP 1: Save all immunizations to local Dexie database
    await db.immunizations.bulkAdd(immunizationRecords)
    console.log('✅ Immunizations saved to Dexie:', immunizationRecords.length)

    // STEP 2: Add each immunization to pending_uploads (Outbox Pattern)
    const uploadTasks = immunizationRecords.map(record => ({
      type: 'immunization',
      operation: 'create',
      data: {
        patient_id: record.patient_id,
        vaccine_id: record.vaccine_id,
        vaccine_name: record.vaccine_name,
        disease_prevented: record.disease_prevented,
        dose_number: record.dose_number,
        administered_date: record.administered_date,
        age_at_administration: record.age_at_administration,
        manufacturer: record.manufacturer,
        lot_number: record.lot_number,
        site: record.site,
        administered_by: record.administered_by,
        facility_name: record.facility_name,
        outside: record.outside,
        remarks: record.remarks,
        inventory_id: record.inventory_id
      },
      local_id: record.id,
      created_at: new Date().toISOString(),
      status: 'pending'
    }))

    await db.pending_uploads.bulkAdd(uploadTasks)
    console.log('✅ Immunizations queued for sync in pending_uploads')

    addToast({ 
      title: 'Success', 
      message: 'Immunization record saved successfully!', 
      type: 'success' 
    })

    router.push(`/healthworker/patients/${route.params.patientId}`)
  } catch (error) {
    console.error('Error saving immunization record:', error)
    addToast({ 
      title: 'Error', 
      message: error.message || 'Failed to save immunization record.', 
      type: 'error' 
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* Fixed Header Section */
.add-record-header-section {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  flex-shrink: 0;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  height: 57px;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #374151;
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.back-button:hover {
  background: #f3f4f6;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
  text-align: center;
}

/* Page Content */
.page-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  padding-bottom: 160px; /* Increased to ensure buttons are fully visible */
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin-top: 1rem;
  color: #6b7280;
}

.record-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Form Sections */
.form-section {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #007bff;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  font-size: 1.125rem;
}

.section-header .section-title {
  margin-bottom: 0;
}

/* Patient Info Display */
.patient-info-display {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #007bff;
}

.patient-details {
  padding: 0.5rem 0;
}

.patient-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.patient-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #4b5563;
}

.patient-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.text-muted {
  color: #6b7280;
  font-style: italic;
}

/* Form Elements */
.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
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
  font-family: inherit;
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

.form-hint {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

/* Buttons */
.btn-add-service {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-add-service:hover {
  background: #2563eb;
}

.btn-add-service i {
  font-size: 1rem;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  position: sticky;
  bottom: 60px; /* Account for bottom navbar on mobile */
  border-top: 1px solid #e5e7eb;
  margin-left: -1.25rem;
  margin-right: -1.25rem;
  margin-bottom: -1.25rem;
  border-radius: 0 0 0.75rem 0.75rem;
  z-index: 10;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-submit {
  background: #10b981;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #059669;
}

.btn-submit:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .page-content-wrapper {
    padding: 1rem;
  }

  .form-actions {
    margin-left: -1rem;
    margin-right: -1rem;
  }
}
</style>
