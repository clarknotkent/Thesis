<template>
  <HealthWorkerLayout :show-controls="false">
    <!-- Fixed Header Section: Details Header + Tabs (positioned sticky) -->
    <div class="patient-details-header-section">
      <!-- Patient Details Header Bar -->
      <div class="details-header-bar">
        <button
          class="back-button"
          @click="goBack"
        >
          <i class="bi bi-chevron-left" />
        </button>
        <h1 class="page-title">
          Patient Details
        </h1>
        <button
          class="add-button"
          :aria-disabled="!effectiveOnline"
          :class="{ 'disabled-visual': !effectiveOnline }"
          @click="goToAddImmunization"
        >
          <i class="bi bi-plus-lg" />
        </button>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="setActiveTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Content wrapper (same pattern as PatientRecords) -->
    <div class="page-content-wrapper">
      <!-- Patient Information Tab -->
      <div
        v-if="activeTab === 'patient-info'"
        class="tab-content"
      >
        <!-- QR Code Card -->
        <PatientQRCodeCard
          v-if="patient"
          :patient="patient"
        />

        <!-- Patient Information Card -->
        <CollapsibleCard
          title="Patient Information"
          icon="person-fill"
          :is-expanded="expandedCards.patientInfo"
          @toggle="toggleCard('patientInfo')"
        >
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">First Name</span>
              <span class="info-value">{{ patient?.childInfo?.firstName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Middle Name</span>
              <span class="info-value">{{ patient?.childInfo?.middleName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Surname</span>
              <span class="info-value">{{ patient?.childInfo?.lastName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sex</span>
              <span class="info-value">{{ patient?.childInfo?.sex || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date of Birth</span>
              <span class="info-value">{{ formattedBirthDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Age</span>
              <span class="info-value">{{ age }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Address</span>
              <span class="info-value">{{ patient?.childInfo?.address || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Barangay</span>
              <span class="info-value">{{ patient?.childInfo?.barangay || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Health Center</span>
              <span class="info-value">{{ patient?.health_center || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Phone Number</span>
              <span class="info-value">{{ patient?.childInfo?.phoneNumber || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tags</span>
              <span class="info-value">{{ patient?.tags || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date Registered</span>
              <span class="info-value">{{ formattedRegisteredDate }}</span>
            </div>
          </div>
        </CollapsibleCard>

        <!-- Guardian & Family Information Card -->
        <CollapsibleCard
          title="Guardian & Family Information"
          icon="people-fill"
          :is-expanded="expandedCards.guardianInfo"
          @toggle="toggleCard('guardianInfo')"
        >
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Guardian Name</span>
              <span class="info-value">{{ patient?.guardianInfo?.name || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Relationship</span>
              <span class="info-value">{{ patient?.guardianInfo?.relationship || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Guardian Contact</span>
              <span class="info-value">{{ patient?.guardianInfo?.contact_number || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Family Number</span>
              <span class="info-value">{{ patient?.guardianInfo?.family_number || '—' }}</span>
            </div>
            <div class="info-section-header">
              <i class="bi bi-person-heart" />
              <span>Mother's Information</span>
            </div>
            <div class="info-item">
              <span class="info-label">Mother's Name</span>
              <span class="info-value">{{ patient?.motherInfo?.name || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Occupation</span>
              <span class="info-value">{{ patient?.motherInfo?.occupation || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Contact Number</span>
              <span class="info-value">{{ patient?.motherInfo?.phone || '—' }}</span>
            </div>
            <div class="info-section-header">
              <i class="bi bi-person-heart" />
              <span>Father's Information</span>
            </div>
            <div class="info-item">
              <span class="info-label">Father's Name</span>
              <span class="info-value">{{ patient?.fatherInfo?.name || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Occupation</span>
              <span class="info-value">{{ patient?.fatherInfo?.occupation || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Contact Number</span>
              <span class="info-value">{{ patient?.fatherInfo?.phone || '—' }}</span>
            </div>
          </div>
        </CollapsibleCard>

        <!-- Birth History Card -->
        <CollapsibleCard
          title="Birth History"
          icon="clipboard2-heart-fill"
          :is-expanded="expandedCards.birthHistory"
          @toggle="toggleCard('birthHistory')"
        >
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Birth Weight</span>
              <span class="info-value">{{ formattedBirthWeight }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Birth Length</span>
              <span class="info-value">{{ formattedBirthLength }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Place of Birth</span>
              <span class="info-value">{{ patient?.birthHistory?.place_of_birth || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Address at Birth</span>
              <span class="info-value">{{ patient?.birthHistory?.address_at_birth || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Time of Birth</span>
              <span class="info-value">{{ formattedTimeOfBirth }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Attendant at Birth</span>
              <span class="info-value">{{ patient?.birthHistory?.attendant_at_birth || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Type of Delivery</span>
              <span class="info-value">{{ patient?.birthHistory?.type_of_delivery || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Ballard's Score</span>
              <span class="info-value">{{ patient?.birthHistory?.ballards_score || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Hearing Test Date</span>
              <span class="info-value">{{ formattedHearingTestDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Newborn Screening Date</span>
              <span class="info-value">{{ formattedNewbornScreeningDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Newborn Screening Result</span>
              <span class="info-value">{{ patient?.birthHistory?.newborn_screening_result || '—' }}</span>
            </div>
          </div>
        </CollapsibleCard>
      </div>

      <!-- Vaccination History Tab -->
      <div
        v-else-if="activeTab === 'vaccination-history'"
        class="tab-content"
      >
        <!-- Loading State -->
        <div
          v-if="loading"
          class="loading-container"
        >
          <div
            class="spinner-border text-primary"
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <!-- Vaccination Accordion List -->
        <div
          v-else-if="groupedVaccinations.length > 0"
          class="vaccination-accordion-list"
        >
          <VaccinationRecordCard
            v-for="(group, index) in groupedVaccinations"
            :key="group.vaccineName"
            :vaccine-name="group.vaccineName"
            :doses="group.doses"
            :disable-edit="!effectiveOnline"
            :initial-expanded="index === 0"
            @view="viewVaccination"
            @edit="editVaccination"
          />
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="empty-state"
        >
          <i class="bi bi-shield-exclamation empty-icon" />
          <h4 class="empty-title">
            No Vaccination Records
          </h4>
          <p class="empty-text">
            This patient has no vaccination history yet.
          </p>
        </div>
      </div>

      <!-- Scheduled Vaccinations Tab -->
      <div
        v-else-if="activeTab === 'scheduled-vaccinations'"
        class="tab-content"
      >
        <div
          v-if="loading"
          class="loading-state"
        >
          <div class="spinner" />
          <p>Loading scheduled vaccinations...</p>
        </div>
        <div
          v-else-if="scheduledVaccinations.length === 0"
          class="empty-state"
        >
          <i class="bi bi-calendar-check empty-icon" />
          <p class="empty-text">
            No scheduled vaccinations found
          </p>
        </div>
        <div
          v-else
          class="vaccines-list"
        >
          <ScheduledVaccineCard
            v-for="(vaccine, index) in scheduledVaccinations"
            :key="vaccine.schedule_id || index"
            :vaccine-name="vaccine.vaccine_name || vaccine.antigen_name || vaccine.vaccineName || 'Unknown Vaccine'"
            :dose="vaccine.dose_number || vaccine.dose"
            :scheduled-date="vaccine.scheduled_date"
            :status="vaccine.status"
            :editable="effectiveOnline && isEditable(vaccine)"
            @select="onScheduledSelect(vaccine)"
          />
        </div>
      </div>

      <!-- Medical History Tab -->
      <div
        v-else-if="activeTab === 'medical-history'"
        class="tab-content"
      >
        <div
          v-if="loading"
          class="loading-state"
        >
          <div class="spinner" />
          <p>Loading medical history...</p>
        </div>
        <div
          v-else-if="medicalHistory.length === 0"
          class="empty-state"
        >
          <i class="bi bi-clipboard2-pulse empty-icon" />
          <p class="empty-text">
            No medical history found
          </p>
        </div>
        <div
          v-else
          class="history-list"
        >
          <MedicalHistoryCard
            v-for="(visit, index) in medicalHistory"
            :key="visit.visit_id || index"
            :visit-id="visit.visit_id"
            :visit-date="visit.visit_date"
            :service-rendered="visit.service_rendered || 'General Checkup'"
            :recorded-by="visit.recorded_by_name || visit.recorded_by || visit.health_worker_name || '—'"
            :vitals="{
              // Common vitals with robust fallbacks to match DB/view field names
              weight: visit.weight ?? null,
              height: visit.height ?? visit.height_length ?? null,
              temperature: visit.temperature ?? null,
              heart_rate: visit.heart_rate ?? null,
              respiratory_rate: visit.respiratory_rate ?? visit.respiration_rate ?? visit.respiration ?? null,
              blood_pressure: visit.blood_pressure ?? null,
              muac: visit.muac ?? null
            }"
            :immunizations="visit.immunizations || []"
            :findings="visit.findings"
            :initial-expanded="index === 0"
            @navigate="navigateToVisitSummary"
          />
        </div>
      </div>
    </div>

    <!-- Modals: placed inside the main template so they render correctly -->
    <!-- Edit Scheduled Vaccination Modal -->
    <div
      v-if="showEditModal"
      class="modal fade show"
      tabindex="-1"
      style="display: block;"
    >
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Edit Scheduled Date
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeEditModal"
            />
          </div>
          <div class="modal-body">
            <label class="form-label">Scheduled date</label>
            <input
              v-model="editScheduledDate"
              type="date"
              class="form-control"
            >
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="closeEditModal"
            >
              Cancel
            </button>
            <button
              class="btn btn-primary"
              @click="saveScheduleEdit"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="showEditModal"
      class="modal-backdrop fade show"
    />

    <!-- Calendar / Read-only modal for completed schedules -->
    <div
      v-if="showCalendarModal"
      class="modal fade show"
      tabindex="-1"
      style="display: block;"
    >
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Scheduled Date
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeCalendarModal"
            />
          </div>
          <div class="modal-body text-center">
            <div class="calendar-visual mb-3">
              <div class="month">
                {{ calendarTarget ? (calendarTarget.scheduled_date ? new Date(calendarTarget.scheduled_date).toLocaleString('en-PH', { month: 'short', year: 'numeric' }) : '') : '' }}
              </div>
              <div class="day">
                {{ calendarTarget ? (calendarTarget.scheduled_date ? new Date(calendarTarget.scheduled_date).getDate() : '') : '' }}
              </div>
            </div>
            <div>{{ calendarTarget ? (calendarTarget.scheduled_date ? new Date(calendarTarget.scheduled_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—') : '—' }}</div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-primary"
              @click="closeCalendarModal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="showCalendarModal"
      class="modal-backdrop fade show"
    />
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import PatientQRCodeCard from '@/features/health-worker/patients/components/PatientQRCodeCard.vue'
import CollapsibleCard from '@/features/health-worker/patients/components/CollapsibleCard.vue'
import VaccinationRecordCard from '@/features/health-worker/patients/components/VaccinationRecordCard.vue'
import ScheduledVaccineCard from '@/features/health-worker/patients/components/ScheduledVaccineCard.vue'
import MedicalHistoryCard from '@/features/health-worker/patients/components/MedicalHistoryCard.vue'
import { usePatientDetails } from '@/features/health-worker/patients/composables'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useOffline } from '@/composables/useOffline'

const router = useRouter()
const route = useRoute()

// Use patient details composable
const {
  patient,
  scheduledVaccinations,
  medicalHistory,
  loading,
  activeTab,
  tabs,
  expandedCards,
  age,
  formattedBirthDate,
  formattedRegisteredDate,
  formattedHearingTestDate,
  formattedNewbornScreeningDate,
    formattedTimeOfBirth,
  formattedBirthWeight,
  formattedBirthLength,
  groupedVaccinations,
  formatDate,
  isEditable,
  fetchPatientDetails,
  rescheduleVaccination,
  toggleCard,
  setActiveTab
} = usePatientDetails(route.params.id)

const { confirm } = useConfirm()
const { addToast } = useToast()
const { effectiveOnline } = useOffline()

// Navigation functions
const goBack = () => {
  router.push('/healthworker/patients')
}

const goToAddImmunization = async () => {
  if (!effectiveOnline.value) {
    addToast({
      title: 'Offline',
      message: 'Adding immunization records is unavailable offline. Please go online to continue.',
      type: 'warning'
    })
    return
  }
  router.push({
    name: 'AddPatientImmunizationRecord',
    params: {
      patientId: route.params.id
    }
  })
}

const viewVaccination = (group) => {
  router.push({
    name: 'VaccineRecordDetails',
    params: {
      patientId: route.params.id
    },
    query: {
      vaccine: group.vaccineName
    }
  })
}

const editVaccination = (group) => {
  if (!effectiveOnline.value) {
    addToast({ title: 'Offline', message: 'Editing all doses is unavailable offline. Please go online to edit.', type: 'warning' })
    return
  }
  if (!group.doses || group.doses.length === 0) {
    addToast({ title: 'Notice', message: 'No doses found to edit', type: 'warning' })
    return
  }
  
  const firstDose = group.doses[0]
  const recordId = firstDose.immunization_id || firstDose.id
  
  if (!recordId) {
    addToast({ title: 'Error', message: 'Cannot edit: Record ID not found', type: 'error' })
    return
  }
  
  router.push({
    name: 'EditVaccinationRecord',
    params: {
      patientId: route.params.id,
      recordId: recordId
    }
  })
}

const navigateToVisitSummary = (visitId) => {
  const patientId = route.params.id
  router.push(`/healthworker/patients/${patientId}/visit/${visitId}`)
}

// Modal state for editing / calendar view
const showEditModal = ref(false)
const editTarget = ref(null)
const editScheduledDate = ref('')

const showCalendarModal = ref(false)
const calendarTarget = ref(null)

const onScheduledSelect = (vaccine) => {
  if (!effectiveOnline.value) {
    addToast({
      title: 'Offline',
      message: 'Rescheduling is unavailable offline. Please go online to continue.',
      type: 'warning'
    })
    return
  }
  if (isEditable(vaccine)) {
    // open edit modal
    editTarget.value = vaccine
    // prefer existing scheduled_date if present
    editScheduledDate.value = vaccine.scheduled_date ? vaccine.scheduled_date.split('T')[0] : ''
    showEditModal.value = true
  } else {
    // show calendar/read-only view for completed schedules
    calendarTarget.value = vaccine
    showCalendarModal.value = true
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  editTarget.value = null
  editScheduledDate.value = ''
}

// Follow admin manual-reschedule flow (confirm + RPC that enforces rules)
const saveScheduleEdit = async () => {
  if (!effectiveOnline.value) {
    addToast({ title: 'Offline', message: 'Rescheduling requires an internet connection.', type: 'warning' })
    return
  }
  if (!editTarget.value || !editTarget.value.patient_schedule_id) return
  if (!editScheduledDate.value) {
    addToast({ title: 'Error', message: 'Please select a valid date.', type: 'error' })
    return
  }

  try {
    await confirm({
      title: 'Confirm Reschedule',
      message: `This will reschedule this vaccination to ${formatDate(editScheduledDate.value)}. Related vaccinations in the schedule may also be adjusted. Do you want to proceed?`,
      variant: 'warning',
      confirmText: 'Yes, Reschedule',
      cancelText: 'Cancel'
    })

    // Use rescheduleVaccination from composable
    await rescheduleVaccination(
      editTarget.value.patient_schedule_id || editTarget.value.schedule_id,
      editScheduledDate.value
    )

    addToast({ title: 'Success', message: 'Vaccination rescheduled successfully.', type: 'success' })
    closeEditModal()
  } catch (err) {
    if (err && err.message === false) {
      // user cancelled (useConfirm rejects with false)
      return
    }
    console.error('Failed to save schedule edit', err)
    const message = err?.response?.data?.message || err?.message || 'Failed to reschedule vaccination.'
    addToast({ title: 'Error', message, type: 'error' })
  }
}

const closeCalendarModal = () => {
  showCalendarModal.value = false
  calendarTarget.value = null
}

onMounted(() => {
  fetchPatientDetails()
})
</script>

<style scoped>
/* Fixed Header Section */
.patient-details-header-section {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  flex-shrink: 0;
}

/* Details Header Bar */
.details-header-bar {
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
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: #374151;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: #f3f4f6;
}

.back-button i {
  font-size: 1.25rem;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: #374151;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.add-button:hover {
  background: #f3f4f6;
}

.add-button i {
  font-size: 1.25rem;
}

/* Visual disabled state for add button when offline (still clickable for toast) */
.add-button.disabled-visual {
  opacity: 0.5;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-navigation::-webkit-scrollbar {
  display: none;
}

.tab-button {
  flex: 1;
  min-width: max-content;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-button:hover {
  color: #374151;
  background: #f9fafb;
}

.tab-button.active {
  color: #007bff;
  border-bottom-color: #007bff;
  background: #f0f7ff;
}

/* Page Content Wrapper (same as PatientRecords) */
.page-content-wrapper {
  padding: 20px;
  padding-bottom: 100px;
  min-height: 100%;
  background: #f3f4f6;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Info Grid Styling */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 120px;
}

.info-value {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
  text-align: right;
  word-break: break-word;
}

.info-section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
  border-top: 2px solid #e5e7eb;
}

.info-section-header i {
  font-size: 1.125rem;
  color: #007bff;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.placeholder-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.placeholder-text {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

/* Vaccination Accordion List */
.vaccination-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Vaccines List (Scheduled Vaccinations) */
.vaccines-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* History List (Medical History) */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Loading Container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.loading-state .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-state p {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: #ffffff;
  border-radius: 1rem;
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-text {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
  max-width: 320px;
}

/* Mobile optimizations */
@media (max-width: 576px) {
  .page-content-wrapper {
    padding: 1rem;
    padding-bottom: 100px;
  }
  
  .details-header-bar {
    padding: 0.875rem 1rem;
  }
  
  .page-title {
    font-size: 1rem;
  }
  
  .back-button,
  .add-button {
    width: 32px;
    height: 32px;
    font-size: 1.125rem;
  }
  
  .tab-button {
    font-size: 0.8125rem;
    padding: 0.75rem 0.875rem;
  }
  
  .info-label {
    font-size: 0.8125rem;
    min-width: 100px;
  }
  
  .info-value {
    font-size: 0.8125rem;
  }
}
</style>

