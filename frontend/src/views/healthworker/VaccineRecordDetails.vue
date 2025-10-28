<template>
  <HealthWorkerLayout :show-controls="false">
    <!-- Fixed Header Section -->
    <div class="vaccine-details-header-section">
      <div class="header-bar">
        <button class="back-button" @click="goBack">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h1 class="page-title">{{ vaccineName }}</h1>
        <button class="menu-button">
          <i class="bi bi-three-dots-vertical"></i>
        </button>
      </div>
    </div>

    <!-- Page Content -->
    <div class="page-content-wrapper">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading vaccine details...</p>
      </div>

      <!-- Content -->
      <div v-else-if="vaccineDetails" class="vaccine-content">
        <!-- Vaccine Information Card -->
        <div class="info-card">
          <div class="card-header primary">
            <i class="bi bi-shield-fill-check"></i>
            <h2>Vaccine Information</h2>
          </div>
          <div class="card-body">
            <div class="detail-item">
              <span class="detail-label">Vaccine Name</span>
              <span class="detail-value">{{ vaccineName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Disease Prevented</span>
              <span class="detail-value">{{ vaccineDetails.disease_prevented || vaccineDetails.diseasePrevented || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Dose Number</span>
              <span class="detail-value">
                <span class="dose-badge">Dose {{ vaccineDetails.dose_number || vaccineDetails.doseNumber || vaccineDetails.dose || '—' }}</span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span :class="['status-badge', getStatusClass(vaccineDetails.status)]">
                  {{ vaccineDetails.status || 'Completed' }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Administration Details Card -->
        <div class="info-card">
          <div class="card-header info">
            <i class="bi bi-calendar-check"></i>
            <h2>Administration Details</h2>
          </div>
          <div class="card-body">
            <div class="detail-item">
              <span class="detail-label">Date Administered</span>
              <span class="detail-value">{{ formattedAdministeredDate }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Age at Administration</span>
              <span class="detail-value">{{ vaccineDetails.age_at_administration || vaccineDetails.ageAtAdministration || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Administered By</span>
              <span class="detail-value">{{ getAdministeredBy }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Facility</span>
              <span class="detail-value">{{ getFacility }}</span>
            </div>
            <div v-if="vaccineDetails.outside !== undefined" class="detail-item">
              <span class="detail-label">Location Type</span>
              <span class="detail-value">
                <span :class="vaccineDetails.outside ? 'location-badge outside' : 'location-badge'">
                  {{ vaccineDetails.outside ? 'Outside Facility' : 'In-Facility' }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Remarks & Notes Card (if available) -->
        <div v-if="vaccineDetails.remarks || vaccineDetails.notes" class="info-card">
          <div class="card-header warning">
            <i class="bi bi-journal-text"></i>
            <h2>Remarks & Notes</h2>
          </div>
          <div class="card-body">
            <p class="remarks-text">{{ vaccineDetails.remarks || vaccineDetails.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="error-state">
        <i class="bi bi-exclamation-triangle error-icon"></i>
        <p class="error-text">Failed to load vaccine details</p>
        <button class="retry-button" @click="fetchVaccineDetails">
          <i class="bi bi-arrow-clockwise"></i>
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

const vaccineDetails = ref(null)
const loading = ref(true)
const patientName = ref('')
const totalDoses = ref(1)

const vaccineName = computed(() => {
  return vaccineDetails.value?.vaccine_antigen_name || 
         vaccineDetails.value?.antigen_name || 
         vaccineDetails.value?.vaccineName || 
         vaccineDetails.value?.antigenName ||
         vaccineDetails.value?.vaccine_name ||
         '—'
})

const formattedAdministeredDate = computed(() => {
  const date = vaccineDetails.value?.administered_date || 
               vaccineDetails.value?.date_administered || 
               vaccineDetails.value?.dateAdministered
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const getAdministeredBy = computed(() => {
  const details = vaccineDetails.value
  if (!details) return '—'
  
  return details.administered_by_name || 
         details.administeredBy || 
         details.health_worker_name || 
         details.healthWorkerName || 
         details.worker_name ||
         details.workerName ||
         details.recorded_by_name ||
         'Taken Outside'
})

const getFacility = computed(() => {
  const details = vaccineDetails.value
  if (!details) return '—'
  
  const isOutside = details.outside || details.immunization_outside || details.is_outside
  if (isOutside) return 'Outside'
  
  return details.facility_name || 
         details.health_center || 
         details.facility || 
         '—'
})

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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
    const immunizationId = route.params.immunizationId
    const patientId = route.params.patientId
    
    // Fetch patient data for patient name
    try {
      const patientResponse = await api.get(`/patients/${patientId}`)
      const patientData = patientResponse.data?.data || patientResponse.data
      patientName.value = `${patientData.firstname || ''} ${patientData.middlename || ''} ${patientData.surname || ''}`.trim()
      
      // Get all doses for this vaccine to calculate total
      const vax = patientData.vaccinationHistory || patientData.vaccination_history || patientData.immunizations || []
      const currentVaccineDetails = vax.find(v => (v.immunization_id || v.id) == immunizationId)
      
      if (currentVaccineDetails) {
        const vaccineName = currentVaccineDetails.vaccine_antigen_name || currentVaccineDetails.vaccineName
        const sameDoses = vax.filter(v => 
          (v.vaccine_antigen_name || v.vaccineName) === vaccineName
        )
        totalDoses.value = sameDoses.length
      }
    } catch (e) {
      console.error('Error fetching patient data:', e)
      patientName.value = 'Patient'
    }
    
    // Fetch immunization details from backend
    const response = await api.get(`/immunizations/${immunizationId}`)
    vaccineDetails.value = response.data?.data || response.data || {}
    
  } catch (error) {
    console.error('Error fetching vaccine details:', error)
    vaccineDetails.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Check if vaccine details were passed via route state
  if (route.params.vaccineData) {
    try {
      vaccineDetails.value = JSON.parse(route.params.vaccineData)
      loading.value = false
    } catch {
      fetchVaccineDetails()
    }
  } else {
    fetchVaccineDetails()
  }
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
  background: #e5e7eb;
  color: #374151;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
}

.location-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: #e5e7eb;
  color: #374151;
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