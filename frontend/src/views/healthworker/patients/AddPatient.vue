<template>
  <HealthWorkerLayout :show-controls="false">
    <!-- Fixed Header Section -->
    <div class="add-patient-header-section">
      <div class="header-bar">
        <button
          class="back-button"
          @click="goBack"
        >
          <i class="bi bi-chevron-left" />
        </button>
        <h1 class="page-title">
          Add New Patient
        </h1>
        <button
          class="menu-button"
          style="visibility: hidden;"
        >
          <i class="bi bi-three-dots-vertical" />
        </button>
      </div>
    </div>

    <!-- Page Content -->
    <div class="page-content-wrapper">
      <!-- Loading State -->
      <div
        v-if="loadingGuardians"
        class="loading-state"
      >
        <div class="spinner" />
        <p>Loading guardians...</p>
      </div>

      <!-- Form Content -->
      <form
        v-else
        class="patient-form"
        @submit.prevent="handleSubmit"
      >
        <!-- Patient Information Card -->
        <CollapsibleCard
          title="Patient Information"
          icon="person-fill"
          :is-expanded="expandedCards.patientInfo"
          @toggle="expandedCards.patientInfo = !expandedCards.patientInfo"
        >
          <div class="form-fields">
            <div class="form-group">
              <label class="form-label">First Name <span class="required">*</span></label>
              <input 
                v-model="formData.firstname" 
                type="text" 
                class="form-input" 
                required
                placeholder="Enter first name"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Middle Name</label>
              <input 
                v-model="formData.middlename" 
                type="text" 
                class="form-input"
                placeholder="Enter middle name"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Surname <span class="required">*</span></label>
              <input 
                v-model="formData.surname" 
                type="text" 
                class="form-input" 
                required
                placeholder="Enter surname"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Sex <span class="required">*</span></label>
              <select
                v-model="formData.sex"
                class="form-input"
                required
              >
                <option value="">
                  Select Sex
                </option>
                <option value="Male">
                  Male
                </option>
                <option value="Female">
                  Female
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Date of Birth <span class="required">*</span></label>
              <input 
                v-model="formData.date_of_birth" 
                type="date" 
                class="form-input" 
                required
              >
            </div>

            <div class="form-group">
              <label class="form-label">Barangay <span class="required">*</span></label>
              <input 
                v-model="formData.barangay" 
                type="text" 
                class="form-input"
                required
                placeholder="Enter barangay"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Health Center <span class="required">*</span></label>
              <input 
                v-model="formData.health_center" 
                type="text" 
                class="form-input"
                required
                placeholder="Enter health center"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Address <span class="required">*</span></label>
              <textarea 
                v-model="formData.address" 
                class="form-input" 
                rows="3"
                required
                placeholder="Enter complete address"
              />
            </div>
          </div>
        </CollapsibleCard>

        <!-- Guardian & Family Information Card -->
        <CollapsibleCard
          title="Guardian & Family Information"
          icon="people-fill"
          :is-expanded="expandedCards.guardianInfo"
          @toggle="expandedCards.guardianInfo = !expandedCards.guardianInfo"
        >
          <div class="form-fields">
            <div class="form-group">
              <label class="form-label">Guardian <span class="required">*</span></label>
              <select 
                v-model="formData.guardian_id" 
                class="form-input" 
                required
                @change="onGuardianSelected"
              >
                <option value="">
                  Select Guardian
                </option>
                <option 
                  v-for="guardian in guardians" 
                  :key="guardian.guardian_id" 
                  :value="guardian.guardian_id"
                >
                  {{ guardian.full_name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Relationship to Guardian <span class="required">*</span></label>
              <select
                v-model="formData.relationship_to_guardian"
                class="form-input"
                required
              >
                <option value="">
                  Select relationship
                </option>
                <option value="Mother">
                  Mother
                </option>
                <option value="Father">
                  Father
                </option>
                <option value="Guardian">
                  Guardian
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Family Number</label>
              <input 
                v-model="formData.family_number" 
                type="text" 
                class="form-input" 
                readonly
                placeholder="Auto-generated from guardian"
              >
              <div class="form-hint">
                Auto-populated from selected guardian
              </div>
            </div>

            <div class="section-divider">
              Mother's Information
            </div>

            <div class="form-group">
              <label class="form-label">Mother's Name <span class="required">*</span></label>
              <ParentNameSelector
                v-model="formData.mother_name"
                :options="motherOptions"
                placeholder="Search/select mother..."
                :disabled="submitting"
                :required="true"
                @selected="onMotherSelected"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Mother's Occupation</label>
              <input 
                v-model="formData.mother_occupation" 
                type="text" 
                class="form-input"
                placeholder="Enter occupation"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Mother's Contact Number</label>
              <input 
                v-model="formData.mother_contact_number" 
                type="tel" 
                class="form-input"
                placeholder="Enter contact number"
              >
            </div>

            <div class="section-divider">
              Father's Information
            </div>

            <div class="form-group">
              <label class="form-label">Father's Name</label>
              <ParentNameSelector
                v-model="formData.father_name"
                :options="fatherOptions"
                placeholder="Search/select father..."
                :disabled="submitting"
                @selected="onFatherSelected"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Father's Occupation</label>
              <input 
                v-model="formData.father_occupation" 
                type="text" 
                class="form-input"
                placeholder="Enter occupation"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Father's Contact Number</label>
              <input 
                v-model="formData.father_contact_number" 
                type="tel" 
                class="form-input"
                placeholder="Enter contact number"
              >
            </div>
          </div>
        </CollapsibleCard>

        <!-- Birth History Card -->
        <CollapsibleCard
          title="Birth History"
          icon="heart-pulse"
          :is-expanded="expandedCards.birthHistory"
          @toggle="expandedCards.birthHistory = !expandedCards.birthHistory"
        >
          <div class="form-fields">
            <div class="form-group">
              <label class="form-label">Time of Birth <span class="required">*</span></label>
              <input 
                v-model="formData.time_of_birth" 
                type="time" 
                class="form-input"
                required
              >
            </div>

            <div class="form-group">
              <label class="form-label">Attendant at Birth <span class="required">*</span></label>
              <input 
                v-model="formData.attendant_at_birth" 
                type="text" 
                class="form-input"
                required
                placeholder="e.g., Doctor, Midwife"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Type of Delivery <span class="required">*</span></label>
              <select
                v-model="formData.type_of_delivery"
                class="form-input"
                required
              >
                <option value="">
                  Select delivery type
                </option>
                <option value="Normal">
                  Normal
                </option>
                <option value="Cesarean">
                  Cesarean
                </option>
                <option value="Assisted">
                  Assisted
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Birth Weight (kg)</label>
              <input 
                v-model="formData.birth_weight" 
                type="number" 
                step="0.1" 
                class="form-input"
                placeholder="e.g., 3.2"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Birth Length (cm)</label>
              <input 
                v-model="formData.birth_length" 
                type="number" 
                step="0.1" 
                class="form-input"
                placeholder="e.g., 50.5"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Place of Birth</label>
              <input 
                v-model="formData.place_of_birth" 
                type="text" 
                class="form-input"
                placeholder="Enter place of birth"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Ballard's Score</label>
              <input 
                v-model="formData.ballards_score" 
                type="number" 
                class="form-input"
                placeholder="Enter score"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Newborn Screening Result</label>
              <input 
                v-model="formData.newborn_screening_result" 
                type="text" 
                class="form-input"
                placeholder="Enter result"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Newborn Screening Date</label>
              <input 
                v-model="formData.newborn_screening_date" 
                type="date" 
                class="form-input"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Hearing Test Date</label>
              <input 
                v-model="formData.hearing_test_date" 
                type="date" 
                class="form-input"
              >
            </div>
          </div>
        </CollapsibleCard>

        <!-- Save Button -->
        <div class="save-button-container">
          <button 
            type="submit" 
            class="save-button" 
            :disabled="submitting"
          >
            <i
              v-if="!submitting"
              class="bi bi-check-circle-fill"
            />
            <span
              v-else
              class="spinner-small"
            />
            {{ submitting ? 'Saving...' : 'Save Record' }}
          </button>
        </div>
      </form>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { addToast } from '@/composables/useToast'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import CollapsibleCard from '@/features/health-worker/patients/components/CollapsibleCard.vue'
import { usePatientForm } from '@/features/health-worker/patients/composables'
import ParentNameSelector from '@/features/admin/patients/ParentNameSelector.vue'

const router = useRouter()

// Use patient form composable
const {
  loadingGuardians,
  submitting,
  guardians,
  expandedCards,
  formData,
  motherOptions,
  fatherOptions,
  onGuardianSelected,
  onMotherSelected,
  onFatherSelected,
  fetchGuardians,
  fetchParentSuggestions,
  validateForm,
  submitPatient
} = usePatientForm()

// Local navigation function
const goBack = () => {
  if (confirm('Are you sure you want to cancel? Unsaved data will be lost.')) {
    router.back()
  }
}

const handleSubmit = async () => {
  const validation = validateForm()
  if (!validation.valid) {
    addToast({
      title: 'Validation Error',
      message: validation.errors.join(', '),
      type: 'error',
      timeout: 5000
    })
    return
  }

  submitting.value = true
  try {
    await submitPatient()
    addToast({
      title: 'Success',
      message: 'Patient registered successfully!',
      type: 'success'
    })
    router.push('/healthworker/patients')
  } catch (err) {
    console.error('Failed to submit patient:', err)
    const message = err.response?.data?.message || 'Failed to register patient. Please try again.'
    addToast({
      title: 'Error',
      message: message,
      type: 'error'
    })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchGuardians()
  await fetchParentSuggestions()
})
</script>

<style scoped>
.add-patient-header-section {
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

.back-button,
.menu-button {
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

.back-button:hover,
.menu-button:hover {
  background: #f3f4f6;
}

.back-button:active,
.menu-button:active {
  background: #e5e7eb;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
  text-align: center;
  padding: 0 0.5rem;
}

.page-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  padding-bottom: 120px;
}

.patient-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #111827;
  background: #ffffff;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

select.form-input {
  cursor: pointer;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.form-input:read-only {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.parent-selector {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-name {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.dropdown-contact {
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.125rem;
}

.form-hint {
  font-size: 0.8125rem;
  color: #6b7280;
  font-style: italic;
}

.section-divider {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #007bff;
  padding: 0.75rem 0;
  border-bottom: 2px solid #007bff;
  margin: 0.5rem 0;
}

.save-button-container {
  padding: 1.5rem 0;
}

.save-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: #ffffff;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.0625rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
}

.save-button:active:not(:disabled) {
  transform: translateY(0);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-button i {
  font-size: 1.25rem;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  margin-top: 1rem;
  font-size: 0.9375rem;
  color: #6b7280;
}

@media (max-width: 576px) {
  .page-content-wrapper {
    padding: 1rem;
  }

  .form-fields {
    padding: 1rem;
    gap: 1rem;
  }

  .form-input {
    padding: 0.625rem;
    font-size: 0.875rem;
  }

  .save-button {
    padding: 0.875rem;
    font-size: 1rem;
  }
}
</style>

