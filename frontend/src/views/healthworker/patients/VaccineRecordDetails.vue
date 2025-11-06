<template>
  <HealthWorkerLayout :show-controls="false">
    <!-- Fixed Header Section -->
    <div class="vaccine-details-header-section">
      <div class="header-bar">
        <button
          class="back-button"
          @click="goBack"
        >
          <i class="bi bi-chevron-left" />
        </button>
        <h1 class="page-title">
          {{ vaccineName }}
        </h1>
        <button class="menu-button">
          <i class="bi bi-three-dots-vertical" />
        </button>
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
        <p>Loading vaccine details...</p>
      </div>

      <!-- Content -->
      <div
        v-else-if="allDoses && allDoses.length > 0"
        class="vaccine-content"
      >
        <!-- Vaccine Information Card -->
        <div class="info-card">
          <div class="card-header primary">
            <i class="bi bi-shield-fill-check" />
            <h2>Vaccine Information</h2>
          </div>
          <div class="card-body">
            <div class="detail-item">
              <span class="detail-label">Vaccine Name</span>
              <span class="detail-value">{{ vaccineName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Disease Prevented</span>
              <span class="detail-value">{{ allDoses[0].disease_prevented || allDoses[0].diseasePrevented || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Patient</span>
              <span class="detail-value">{{ patientName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Total Doses Administered</span>
              <span class="detail-value">
                <span class="dose-badge">{{ allDoses.length }} {{ allDoses.length === 1 ? 'Dose' : 'Doses' }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Doses List -->
        <div 
          v-for="(dose, index) in sortedDoses" 
          :key="dose.immunization_id || index"
          class="info-card"
        >
          <div class="card-header info">
            <i class="bi bi-calendar-check" />
            <h2>Dose {{ dose.dose_number || dose.doseNumber || dose.dose || index + 1 }}</h2>
            <span :class="['status-badge-small', getStatusClass(dose.status)]">
              {{ dose.status || 'Completed' }}
            </span>
          </div>
          <div class="card-body">
            <div class="detail-item">
              <span class="detail-label">Date Administered</span>
              <span class="detail-value">{{ formatDate(dose.administered_date || dose.date_administered || dose.dateAdministered) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Age at Administration</span>
              <span class="detail-value">{{ dose.age_at_administration || dose.ageAtAdministration || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Administered By</span>
              <span class="detail-value">{{ getAdministeredBy(dose) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Facility</span>
              <span class="detail-value">{{ getFacility(dose) }}</span>
            </div>
            <div
              v-if="dose.site || dose.administration_site"
              class="detail-item"
            >
              <span class="detail-label">Site</span>
              <span class="detail-value">{{ dose.site || dose.administration_site || '—' }}</span>
            </div>
            <div
              v-if="dose.batch_number || dose.batchNumber || dose.lot_number || dose.lotNumber"
              class="detail-item"
            >
              <span class="detail-label">Batch Number</span>
              <span class="detail-value">
                <span class="batch-badge">{{ dose.batch_number || dose.batchNumber || dose.lot_number || dose.lotNumber }}</span>
              </span>
            </div>
            <div
              v-if="dose.outside !== undefined"
              class="detail-item"
            >
              <span class="detail-label">Location Type</span>
              <span class="detail-value">
                <span :class="dose.outside ? 'location-badge outside' : 'location-badge'">
                  {{ dose.outside ? 'Outside Facility' : 'In-Facility' }}
                </span>
              </span>
            </div>
            <div
              v-if="dose.remarks || dose.notes"
              class="detail-item remarks-item"
            >
              <span class="detail-label">Remarks</span>
              <span class="detail-value remarks-text">{{ dose.remarks || dose.notes }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else
        class="error-state"
      >
        <i class="bi bi-exclamation-triangle error-icon" />
        <p class="error-text">
          Failed to load vaccine details
        </p>
        <button
          class="retry-button"
          @click="fetchVaccineDetails"
        >
          <i class="bi bi-arrow-clockwise" />
          Retry
        </button>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

const allDoses = ref([])
const loading = ref(true)
const patientName = ref('')

const vaccineName = computed(() => {
  return route.query.vaccine || '—'
})

const sortedDoses = computed(() => {
  return [...allDoses.value].sort((a, b) => {
    const doseA = typeof a.dose_number === 'number' ? a.dose_number : parseInt(a.dose_number || a.doseNumber || a.dose) || 0
    const doseB = typeof b.dose_number === 'number' ? b.dose_number : parseInt(b.dose_number || b.doseNumber || b.dose) || 0
    return doseA - doseB
  })
})

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getAdministeredBy = (dose) => {
  if (!dose) return '—'
  
  return dose.administered_by_name || 
         dose.administeredBy || 
         dose.health_worker_name || 
         dose.healthWorkerName || 
         dose.worker_name ||
         dose.workerName ||
         dose.recorded_by_name ||
         'Taken Outside'
}

const getFacility = (dose) => {
  if (!dose) return '—'
  
  const isOutside = dose.outside || dose.immunization_outside || dose.is_outside
  if (isOutside) return 'Outside'
  
  return dose.immunization_facility_name || 
         dose.health_center || 
         dose.facility || 
         '—'
}

const getStatusClass = (status) => {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'completed' || statusLower === 'administered') return 'status-completed'
  if (statusLower === 'pending') return 'status-pending'
  if (statusLower === 'scheduled') return 'status-scheduled'
  return 'status-default'
}

const goBack = () => {
  router.back()
}

const fetchVaccineDetails = async () => {
  try {
    loading.value = true
    const patientId = route.params.patientId
    const vaccine = route.query.vaccine
    
    if (!vaccine) {
      console.error('No vaccine name provided in query parameter')
      allDoses.value = []
      return
    }
    
    // Fetch patient data
    const patientResponse = await api.get(`/patients/${patientId}`)
    const patientData = patientResponse.data?.data || patientResponse.data
    patientName.value = `${patientData.firstname || ''} ${patientData.middlename || ''} ${patientData.surname || ''}`.trim()
    
    // Extract vaccination history
    const vax = patientData.vaccinationHistory || patientData.vaccination_history || patientData.immunizations || []
    
    // Filter for the specific vaccine
    const vaccineRecords = Array.isArray(vax) ? vax.filter(v => {
      const vName = v.vaccine_antigen_name || v.vaccineName || v.antigen_name || v.antigenName || ''
      return vName === vaccine
    }) : []
    
    // Store all doses
    allDoses.value = vaccineRecords
    
  } catch (error) {
    console.error('Error fetching vaccine details:', error)
    allDoses.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchVaccineDetails()
})
</script>

<style scoped>
/* Fixed Header Section */
.vaccine-details-header-section {
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

/* Page Content */
.page-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  padding-bottom: 100px; /* Scroll fix for bottom navbar */
}

.vaccine-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Info Card */
.info-card {
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  color: #ffffff;
}

.card-header.primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
}

.card-header.info {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  position: relative;
}

.card-header.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.card-header i {
  font-size: 1.5rem;
}

.card-header h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.status-badge-small {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: capitalize;
  margin-left: auto;
}

.card-body {
  padding: 1.25rem 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item.remarks-item {
  flex-direction: column;
  gap: 0.5rem;
}

.remarks-item .detail-value {
  text-align: left;
  font-weight: 400;
  font-style: italic;
  color: #6b7280;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  flex-shrink: 0;
}

.detail-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  text-align: right;
  word-break: break-word;
}

.remarks-text {
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

/* Badges */
.dose-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: #007bff;
  color: #ffffff;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
}

.batch-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.location-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
}

.location-badge.outside {
  background: #fef3c7;
  color: #92400e;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.status-pending {
  background: #fed7aa;
  color: #92400e;
}

.status-scheduled {
  background: #dbeafe;
  color: #1e40af;
}

.status-default {
  background: #e5e7eb;
  color: #374151;
}

/* Loading State */
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

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-text {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
}

.retry-button:active {
  transform: translateY(0);
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .page-content-wrapper {
    padding: 1rem;
  }

  .card-header {
    padding: 0.875rem 1rem;
  }

  .card-header h2 {
    font-size: 0.9375rem;
  }

  .card-body {
    padding: 1rem 1.25rem;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.375rem;
    padding: 0.625rem 0;
  }

  .detail-label {
    font-size: 0.8125rem;
  }

  .detail-value {
    font-size: 0.875rem;
    text-align: left;
  }
}
</style>