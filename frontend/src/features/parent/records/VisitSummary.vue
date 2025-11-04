<template>
  <ParentLayout title="Visit">
    <!-- Fixed Header Section -->
    <div class="visit-summary-header-section">
      <div class="header-bar">
        <button class="back-button" @click="goBack">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h1 class="page-title">Visit Summary</h1>
        <!-- Removed menu button for read-only -->
        <div class="header-spacer"></div>
      </div>
    </div>

    <!-- Content wrapper -->
    <div class="page-content-wrapper">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading visit summary...</p>
      </div>

      <!-- Content -->
      <div v-else-if="visit" class="visit-content">
        <VisitInfoCard
          :patient-name="patientName"
          :formatted-visit-date="formattedVisitDate"
          :health-staff-name="healthStaffName"
          :has-outside-services="hasOutsideServices"
          :findings="visit?.findings"
        />

        <ServicesProvidedCard
          v-if="hasServices"
          :services="services"
        />

        <VitalSignsCard
          v-if="hasVitalSigns"
          :vitals="vitals"
        />

        <!-- No Services Message -->
        <div v-if="!hasServices && !hasVitalSigns" class="empty-state">
          <i class="bi bi-info-circle empty-icon"></i>
          <p class="empty-text">No additional services or vitals recorded for this visit</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="error-state">
        <i class="bi bi-exclamation-triangle error-icon"></i>
        <p class="error-text">Failed to load visit summary</p>
        <button class="retry-button" @click="fetchVisitData">
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
import VisitInfoCard from './components/VisitInfoCard.vue'
import ServicesProvidedCard from './components/ServicesProvidedCard.vue'
import VitalSignsCard from './components/VitalSignsCard.vue'
import { formatDate } from '@/composables/useDateFormat'
import api from '@/services/api'
import db from '@/services/offline/db-parent-portal'

const router = useRouter()
const route = useRoute()

const visit = ref(null)
const patientData = ref(null)
const loading = ref(true)

const patientName = computed(() => {
  if (patientData.value) {
    return patientData.value.full_name || 
           [patientData.value.firstname, patientData.value.middlename, patientData.value.surname]
             .filter(Boolean).join(' ').trim() || '—'
  }
  return visit.value?.patient_name || visit.value?.full_name || '—'
})

const healthStaffName = computed(() => {
  // Accept multiple possible field names returned by the API / views
  return visit.value?.recorded_by || visit.value?.recorded_by_name || visit.value?.health_worker_name || '—'
})

const formattedVisitDate = computed(() => {
  return formatDate(visit.value?.visit_date)
})

const hasServices = computed(() => {
  return services.value && services.value.length > 0
})

const hasVitalSigns = computed(() => {
  if (!visit.value) return false
  
  const vitals = visit.value.vitals || visit.value.vital_signs || visit.value
  
  return !!(vitals.temperature || vitals.weight || vitals.height || 
            vitals.height_length || vitals.muac || vitals.respiration || 
            vitals.respiration_rate || vitals.heart_rate || vitals.blood_pressure)
})

const services = computed(() => {
  if (!visit.value) return []
  
  const immunizations = Array.isArray(visit.value.immunizations_given) 
    ? visit.value.immunizations_given 
    : (Array.isArray(visit.value.immunizations) ? visit.value.immunizations : [])
  
  return immunizations.map(im => ({
    vaccine_name: im.vaccine_name || im.antigen_name || im.vaccineName || 'Unknown Vaccine',
    antigen_name: im.antigen_name || im.vaccine_name,
    dose_number: im.dose_number || im.doseNumber || 'N/A',
    administered_date: im.administered_date || visit.value.visit_date,
    administered_by: im.administered_by || healthStaffName.value,
    facility_name: im.facility_name || '',
    outside: im.outside || false,
    remarks: im.remarks || ''
  }))
})

const vitals = computed(() => {
  if (!visit.value) return {}
  
  const data = visit.value.vitals || visit.value.vital_signs || visit.value
  
  return {
    temperature: data.temperature || '',
    weight: data.weight || '',
    height: data.height || data.height_length || '',
    muac: data.muac || '',
    respiration: data.respiration || data.respiration_rate || '',
    heart_rate: data.heart_rate || ''
  }
})

const hasOutsideServices = computed(() => {
  return services.value.some(s => s.outside === true)
})

const goBack = () => {
  router.back()
}

const fetchVisitData = async () => {
  try {
    loading.value = true
    const visitId = route.params.visitId
    const patientId = route.params.patientId
    
    let visitDataRaw = null
    let patientDataRaw = null
    
    // NETWORK-FIRST for visit data
    if (navigator.onLine) {
      try {
        console.log('🌐 Fetching visit from API (online)')
        const visitResponse = await api.get(`/visits/${visitId}`)
        visitDataRaw = visitResponse.data?.data || visitResponse.data || {}
        console.log('✅ Fetched visit from API')
      } catch (apiError) {
        console.error('⚠️ Visit API failed while online:', apiError.message)
      }
    }
    
    // OFFLINE FALLBACK for visit
    if (!visitDataRaw) {
      console.log('📴 Loading visit from IndexedDB cache')
      try {
        const cachedVisit = await db.visits.get(parseInt(visitId))
        if (cachedVisit) {
          visitDataRaw = cachedVisit
          console.log('✅ Loaded visit from IndexedDB cache')
        } else {
          throw new Error('Visit not found in cache')
        }
      } catch (dbError) {
        console.error('❌ Failed to load visit from IndexedDB:', dbError)
        throw new Error('Unable to load visit data. Please connect to the internet.')
      }
    }
    
    visit.value = visitDataRaw
    
    // NETWORK-FIRST for patient details
    if (patientId) {
      if (navigator.onLine) {
        try {
          console.log('🌐 Fetching patient from API (online)')
          const patientResponse = await api.get(`/patients/${patientId}`)
          patientDataRaw = patientResponse.data?.data || patientResponse.data || {}
          console.log('✅ Fetched patient from API')
        } catch (patientError) {
          console.error('⚠️ Patient API failed while online:', patientError.message)
        }
      }
      
      // OFFLINE FALLBACK for patient
      if (!patientDataRaw) {
        console.log('📴 Loading patient from IndexedDB cache')
        try {
          const cachedPatient = await db.patients.get(parseInt(patientId))
          if (!cachedPatient) {
            const cachedChild = await db.patients.get(parseInt(patientId))
            if (cachedChild) {
              patientDataRaw = cachedChild
              console.log('✅ Loaded patient from db.children cache')
            }
          } else {
            patientDataRaw = cachedPatient
            console.log('✅ Loaded patient from db.patients cache')
          }
        } catch (dbError) {
          console.warn('Could not load patient from cache:', dbError)
        }
      }
      
      patientData.value = patientDataRaw
    }
    
  } catch (error) {
    console.error('Error fetching visit data:', error)
    visit.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchVisitData()
})
</script>

<style scoped>
/* Fixed Header Section */
.visit-summary-header-section {
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
}

.header-spacer {
  width: 40px;
}

/* Page Content Wrapper */
.page-content-wrapper {
  padding: 20px;
  padding-bottom: 100px;
  min-height: 100%;
  background: #f3f4f6;
}

.visit-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Info Card */
.info-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.card-header.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.card-header.info {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
}

.card-header i {
  font-size: 1.5rem;
}

.card-header h2 {
  font-size: 1.0625rem;
  font-weight: 600;
  margin: 0;
}

.card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Info Item */
.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}

.info-item.findings {
  flex-direction: column;
  gap: 0.5rem;
}

.info-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 0.5rem;
  flex-shrink: 0;
}

.info-icon i {
  font-size: 1.25rem;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 0.9375rem;
  color: #1f2937;
  font-weight: 600;
}

.findings-text {
  font-size: 0.9375rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
  font-style: italic;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border-left: 3px solid #0ea5e9;
}

.badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.bg-warning {
  background: #fef3c7;
}

.text-dark {
  color: #92400e;
}

.bg-secondary {
  background: #e5e7eb;
  color: #374151;
}

/* Service Item */
.service-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
}

.service-item:not(:last-child) {
  margin-bottom: 0.75rem;
}

.service-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.service-icon {
  font-size: 1.25rem;
  color: #10b981;
}

.service-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
}

.service-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.service-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-label {
  font-size: 0.8125rem;
  color: #6b7280;
}

.detail-value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1f2937;
}

/* Vitals Grid */
.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.vital-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
}

.vital-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 0.5rem;
  flex-shrink: 0;
}

.vital-icon i {
  font-size: 1.5rem;
}

.vital-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.vital-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.vital-value {
  font-size: 1rem;
  color: #1f2937;
  font-weight: 700;
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

.spinner {
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

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  gap: 1rem;
  background: #ffffff;
  border-radius: 1rem;
}

.empty-icon {
  font-size: 3rem;
  color: #9ca3af;
}

.empty-text {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .page-content-wrapper {
    padding: 1rem;
    padding-bottom: 100px;
  }

  .vitals-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    padding: 0.875rem 1rem;
  }

  .card-body {
    padding: 1rem;
  }

  .page-title {
    font-size: 1rem;
  }
}
</style>
