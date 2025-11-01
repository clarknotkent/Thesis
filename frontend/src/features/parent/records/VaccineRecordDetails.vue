<template>
  <ParentLayout title="Vaccine Details">
    <!-- Fixed Header Section -->
    <div class="vaccine-details-header-section">
      <div class="header-bar">
        <button class="back-button" @click="goBack">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h1 class="page-title">{{ vaccineName }}</h1>
        <!-- Removed menu button for read-only -->
        <div class="header-spacer"></div>
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
      <div v-else-if="allDoses && allDoses.length > 0" class="vaccine-content">
        <VaccineInfoCard 
          :vaccineName="vaccineName"
          :diseasePrevented="allDoses[0].disease_prevented || allDoses[0].diseasePrevented"
          :totalDoses="allDoses.length"
        />

        <DoseCard
          v-for="(dose, index) in sortedDoses" 
          :key="dose.immunization_id || index"
          :doseNumber="dose.dose_number || dose.doseNumber || dose.dose || index + 1"
          :status="dose.status"
          :statusClass="getStatusClass(dose.status)"
          :formattedDate="formatDate(dose.administered_date || dose.date_administered || dose.dateAdministered)"
          :ageAtAdministration="dose.age_at_administration || dose.ageAtAdministration"
          :administeredBy="getAdministeredBy(dose)"
          :facility="getFacility(dose)"
          :site="dose.site || dose.administration_site"
          :batchNumber="dose.batch_number || dose.batchNumber || dose.lot_number || dose.lotNumber"
          :isOutside="dose.outside"
          :remarks="dose.remarks || dose.notes"
        />
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
  </ParentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import VaccineInfoCard from './components/VaccineInfoCard.vue'
import DoseCard from './components/DoseCard.vue'
import { formatDate as formatDateUtil } from '@/composables/useDateFormat'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

const allDoses = ref([])
const loading = ref(true)

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
  return formatDateUtil(date)
}

const getAdministeredBy = (dose) => {
  if (!dose) return '—'

  return dose.administered_by_name ||
         dose.administered_by ||
         dose.administeredBy ||
         dose.health_worker_name ||
         dose.healthWorkerName ||
         dose.worker_name ||
         dose.workerName ||
         dose.recorded_by_name ||
         dose.recorded_by ||
         dose.taken_by ||
         'Taken Outside'
}

const getFacility = (dose) => {
  if (!dose) return '—'

  const isOutside = dose.outside || dose.immunization_outside || dose.is_outside
  if (isOutside) return 'Outside'

  // Check several common field names used across API versions
  return dose.immunization_facility_name ||
         dose.facility_name ||
         dose.facilityName ||
         dose.immunization_facility ||
         dose.health_center ||
         dose.healthCenter ||
         dose.facility ||
         dose.location ||
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
    
    // Fetch patient data from parent endpoint
    const response = await api.get(`/parent/children/${patientId}`)
    const childData = response.data?.data || response.data
    
    // Extract vaccination history
    const vax = childData.vaccinationHistory || childData.vaccination_history || childData.immunizations || []
    
    // Filter for the specific vaccine
    const vaccineRecords = Array.isArray(vax) ? vax.filter(v => {
      const vName = v.vaccine_antigen_name || v.vaccineName || v.antigen_name || v.antigenName || ''
      return vName === vaccine
    }) : []

    // Store all doses
    allDoses.value = vaccineRecords
    
  } catch (error) {
    console.error('Error fetching vaccine details:', error)
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
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

.back-button:active {
  background: #e5e7eb;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-spacer {
  width: 40px; /* Same as back button for centering */
}

/* Page Content */
.page-content-wrapper {
  padding: 20px;
  padding-bottom: 100px;
  min-height: 100%;
  background: #f3f4f6;
}

.vaccine-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
}

.error-text {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
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
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #0056b3;
}

.retry-button i {
  font-size: 1rem;
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .page-content-wrapper {
    padding: 1rem;
    padding-bottom: 100px;
  }

  .page-title {
    font-size: 1rem;
  }

  .back-button {
    width: 36px;
    height: 36px;
    font-size: 1.125rem;
  }

  .card-header {
    padding: 0.875rem 1rem;
  }

  .card-header h2 {
    font-size: 1rem;
  }

  .card-body {
    padding: 1rem;
  }

  .detail-item {
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-label {
    font-size: 0.8125rem;
    min-width: 0;
  }

  .detail-value {
    font-size: 0.8125rem;
    text-align: left;
  }
}
</style>
