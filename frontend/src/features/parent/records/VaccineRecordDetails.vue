<template>
  <ParentLayout title="Vaccine">
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
        <!-- Removed menu button for read-only -->
        <div class="header-spacer" />
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
        <VaccineInfoCard 
          :vaccine-name="vaccineName"
          :disease-prevented="allDoses[0].disease_prevented || allDoses[0].diseasePrevented"
          :total-doses="allDoses.length"
        />

        <DoseCard
          v-for="(dose, index) in sortedDoses" 
          :key="dose.immunization_id || index"
          :dose-number="dose.dose_number || dose.doseNumber || dose.dose || index + 1"
          :status="dose.status"
          :status-class="getStatusClass(dose.status)"
          :formatted-date="formatDate(dose.administered_date || dose.date_administered || dose.dateAdministered)"
          :age-at-administration="dose.age_at_administration || dose.ageAtAdministration"
          :administered-by="getAdministeredBy(dose)"
          :facility="getFacility(dose)"
          :site="dose.site || dose.administration_site"
          :batch-number="dose.batch_number || dose.batchNumber || dose.lot_number || dose.lotNumber"
          :is-outside="dose.outside"
          :remarks="dose.remarks || dose.notes"
        />
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
import db from '@/services/offline/db-parent-portal'

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
    
    let childData = null
    
    // NETWORK-FIRST: If online, fetch from API directly (fast)
    if (navigator.onLine) {
      try {
        console.log('🌐 Fetching vaccine details from API (online)')
        const response = await api.get(`/parent/children/${patientId}`)
        childData = response.data?.data || response.data
        console.log('✅ Fetched vaccine details from API')
      } catch (apiError) {
        console.error('⚠️ API failed while online:', apiError.message)
        // Fall through to offline logic
      }
    }
    
    // OFFLINE FALLBACK: If offline or API failed, try IndexedDB
    if (!childData) {
      console.log('📴 Loading vaccine details from IndexedDB cache')
      try {
        // Check db.children table first (prefetched data)
        const cachedChild = await db.patients.get(parseInt(patientId))
        
        if (!cachedChild) {
          // Try db.patients table as fallback
          const cachedPatient = await db.patients.get(parseInt(patientId))
          if (cachedPatient) {
            childData = cachedPatient
            console.log('✅ Loaded vaccine details from db.patients cache')
          }
        } else {
          childData = cachedChild
          console.log('✅ Loaded vaccine details from db.children cache')
        }
        
        if (!childData) {
          throw new Error('No cached data available for this patient')
        }
      } catch (dbError) {
        console.error('❌ Failed to load from IndexedDB:', dbError)
        throw new Error('Unable to load vaccine data. Please connect to the internet.')
      }
    }
    
    if (!childData) {
      throw new Error('No data available for this patient')
    }
    
    // Extract vaccination history
    let vax = childData.vaccinationHistory || childData.vaccination_history || childData.immunizations || []
    
    // If offline and no vaccination history in patient object, fetch from immunizations table
    if ((!vax || vax.length === 0) && !navigator.onLine) {
      console.log('📋 Fetching immunizations from separate table (offline)')
      try {
        const cachedImmunizations = await db.immunizations
          .where('patient_id')
          .equals(parseInt(patientId))
          .toArray()
        
        console.log(`✅ Found ${cachedImmunizations.length} immunizations in cache`)
        
        // Map to match expected format (avoid introducing fields not present online)
        vax = cachedImmunizations.map(i => ({
          immunization_id: i.immunization_id,
          vaccine_antigen_name: i.vaccine_name || i.antigen_name,
          vaccineName: i.vaccine_name || i.antigen_name,
          antigen_name: i.antigen_name || i.vaccine_name,
          antigenName: i.antigen_name || i.vaccine_name,
          dose_number: i.dose_number,
          administered_date: i.administered_date,
          administered_time: i.administered_time,
          administered_by: i.administered_by,
          administered_by_name: i.health_worker_name,
          age_at_administration: i.age_at_administration,
          immunization_facility_name: i.immunization_facility_name || i.facility_name,
          outside: i.outside,
          remarks: i.remarks,
          disease_prevented: i.disease_prevented,
          brand_name: i.brand_name,
          manufacturer: i.manufacturer,
          // Do not fabricate lot/batch number offline if not available
        }))
      } catch (err) {
        console.error('❌ Failed to fetch immunizations from cache:', err)
      }
    }
    
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
