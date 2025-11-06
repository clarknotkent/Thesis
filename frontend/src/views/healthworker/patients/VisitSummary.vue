<template>
  <HealthWorkerLayout :show-controls="false">
    <!-- Fixed Header Section -->
    <div class="visit-summary-header-section">
      <div class="header-bar">
        <button
          class="back-button"
          @click="goBack"
        >
          <i class="bi bi-chevron-left" />
        </button>
        <h1 class="page-title">Visit Summary</h1>
        <div class="menu-wrapper">
          <button class="menu-button" @click.stop="toggleMenu">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <div v-if="showMenu" class="menu-popover" @click.stop>
            <button class="menu-item" @click="goToEdit">
              <i class="bi bi-pencil-square"></i>
              Edit Visit
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content wrapper -->
    <div class="page-content-wrapper">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="loading-state"
      >
        <div class="spinner" />
        <p>Loading visit summary...</p>
      </div>

      <!-- Content -->
      <div
        v-else-if="visit"
        class="visit-content"
      >
        <!-- Visit Information Card -->
        <div class="info-card">
          <div class="card-header primary">
            <i class="bi bi-clipboard-data" />
            <h2>Visit Information</h2>
          </div>
          <div class="card-body">
            <div class="info-item">
              <div class="info-icon">
                <i class="bi bi-person-circle text-primary" />
              </div>
              <div class="info-content">
                <span class="info-label">Patient</span>
                <span class="info-value">{{ patientName }}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon">
                <i class="bi bi-calendar-event text-success" />
              </div>
              <div class="info-content">
                <span class="info-label">Visit Date</span>
                <span class="info-value">{{ formattedVisitDate }}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon">
                <i class="bi bi-person-badge text-info" />
              </div>
              <div class="info-content">
                <span class="info-label">Health Staff</span>
                <span class="info-value">{{ healthStaffName }}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon">
                <i :class="hasOutsideServices ? 'bi bi-house-door text-warning' : 'bi bi-building text-secondary'" />
              </div>
              <div class="info-content">
                <span class="info-label">Service Location</span>
                <span :class="hasOutsideServices ? 'badge bg-warning text-dark' : 'badge bg-secondary'">
                  {{ hasOutsideServices ? 'Outside Facility' : 'In-Facility' }}
                </span>
              </div>
            </div>
            <div
              v-if="visit?.findings"
              class="info-item findings"
            >
              <div class="info-icon">
                <i class="bi bi-journal-text text-info" />
              </div>
              <div class="info-content">
                <span class="info-label">Clinical Findings</span>
                <p class="findings-text">
                  {{ visit.findings }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Services Provided Card -->
        <CollapsibleServiceCard
          v-if="hasServices"
          :services="services"
          :initial-expanded="expandedCards.services"
          @toggle="expandedCards.services = !expandedCards.services"
        />

        <!-- Vital Signs Card -->
        <div
          v-if="hasVitalSigns"
          class="info-card"
        >
          <div class="card-header info">
            <i class="bi bi-heart-pulse" />
            <h2>Vital Signs</h2>
          </div>
          <div class="card-body">
            <div class="vitals-grid">
              <div
                v-if="vitals.temperature"
                class="vital-box"
              >
                <div class="vital-icon">
                  <i class="bi bi-thermometer-half text-danger" />
                </div>
                <div class="vital-content">
                  <span class="vital-label">Temperature</span>
                  <span class="vital-value">{{ vitals.temperature }}°C</span>
                </div>
              </div>
              <div
                v-if="vitals.weight"
                class="vital-box"
              >
                <div class="vital-icon">
                  <i class="bi bi-speedometer2 text-primary" />
                </div>
                <div class="vital-content">
                  <span class="vital-label">Weight</span>
                  <span class="vital-value">{{ vitals.weight }} kg</span>
                </div>
              </div>
              <div
                v-if="vitals.height"
                class="vital-box"
              >
                <div class="vital-icon">
                  <i class="bi bi-arrows-vertical text-info" />
                </div>
                <div class="vital-content">
                  <span class="vital-label">Height</span>
                  <span class="vital-value">{{ vitals.height }} cm</span>
                </div>
              </div>
              <div
                v-if="vitals.muac"
                class="vital-box"
              >
                <div class="vital-icon">
                  <i class="bi bi-rulers text-warning" />
                </div>
                <div class="vital-content">
                  <span class="vital-label">MUAC</span>
                  <span class="vital-value">{{ vitals.muac }} cm</span>
                </div>
              </div>
              <div
                v-if="vitals.respiration"
                class="vital-box"
              >
                <div class="vital-icon">
                  <i class="bi bi-lungs text-success" />
                </div>
                <div class="vital-content">
                  <span class="vital-label">Respiration</span>
                  <span class="vital-value">{{ vitals.respiration }} /min</span>
                </div>
              </div>
              <div
                v-if="vitals.heart_rate"
                class="vital-box"
              >
                <div class="vital-icon">
                  <i class="bi bi-heart text-danger" />
                </div>
                <div class="vital-content">
                  <span class="vital-label">Heart Rate</span>
                  <span class="vital-value">{{ vitals.heart_rate }} bpm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Services Message -->
        <div
          v-if="!hasServices && !hasVitalSigns"
          class="empty-state"
        >
          <i class="bi bi-info-circle empty-icon" />
          <p class="empty-text">
            No additional services or vitals recorded for this visit
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else
        class="error-state"
      >
        <i class="bi bi-exclamation-triangle error-icon" />
        <p class="error-text">
          Failed to load visit summary
        </p>
        <button
          class="retry-button"
          @click="fetchVisitData"
        >
          <i class="bi bi-arrow-clockwise" />
          Retry
        </button>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import CollapsibleServiceCard from '@/features/health-worker/patients/components/CollapsibleServiceCard.vue'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

const visit = ref(null)
const patientData = ref(null)
const loading = ref(true)
const expandedCards = ref({
  services: true
})
const showMenu = ref(false)

const patientName = computed(() => {
  if (patientData.value) {
    return patientData.value.full_name || 
           [patientData.value.firstname, patientData.value.middlename, patientData.value.surname]
             .filter(Boolean).join(' ').trim() || '—'
  }
  return visit.value?.patient_name || visit.value?.full_name || '—'
})

const healthStaffName = computed(() => {
  // Try multiple fallbacks: explicit recorded_by_name, raw recorded_by (id or text),
  // administered_by_name (from immunization entries), administered_by, or health_worker_name
  return (
    visit.value?.recorded_by_name ||
    visit.value?.recorded_by ||
    visit.value?.administered_by_name ||
    visit.value?.administered_by ||
    visit.value?.health_worker_name ||
    '—'
  )
})

const formattedVisitDate = computed(() => {
  if (!visit.value?.visit_date) return '—'
  return new Date(visit.value.visit_date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const hasServices = computed(() => {
  return services.value && services.value.length > 0
})

const hasVitalSigns = computed(() => {
  if (!visit.value) return false
  
  // Check multiple possible data structures
  const vitals = visit.value.vitals || visit.value.vital_signs || visit.value
  
  return !!(vitals.temperature || vitals.weight || vitals.height || 
            vitals.height_length || vitals.muac || vitals.respiration || 
            vitals.respiration_rate || vitals.heart_rate || vitals.blood_pressure)
})

const services = computed(() => {
  if (!visit.value) return []
  
  // Try multiple possible data structures from admin-side approach
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
  
  // Try multiple possible data structures
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

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const goToEdit = () => {
  showMenu.value = false
  const patientId = route.params.patientId
  const visitId = route.params.visitId
  router.push({ name: 'HealthWorkerEditVisit', params: { patientId, visitId } })
}

const fetchVisitData = async () => {
  try {
    loading.value = true
    const visitId = route.params.visitId
    const patientId = route.params.patientId
    
    // Fetch visit details using admin-side approach
    const visitResponse = await api.get(`/visits/${visitId}`)
    const visitDataRaw = visitResponse.data?.data || visitResponse.data || {}
    visit.value = visitDataRaw

    // If the API returned a recorded_by id but not a recorded_by_name, try to resolve
    // the id to a full name via the health-staff endpoint for better display.
    try {
      if (visit.value && !visit.value.recorded_by_name && visit.value.recorded_by) {
        const hwRes = await api.get('/health-staff')
        let list = []
        if (hwRes.data?.data?.healthWorkers && Array.isArray(hwRes.data.data.healthWorkers)) {
          list = hwRes.data.data.healthWorkers
        } else if (hwRes.data?.data?.healthStaff && Array.isArray(hwRes.data.data.healthStaff)) {
          list = hwRes.data.data.healthStaff
        } else if (Array.isArray(hwRes.data)) {
          list = hwRes.data
        } else if (hwRes.data?.data && Array.isArray(hwRes.data.data)) {
          list = hwRes.data.data
        } else if (hwRes.data?.users && Array.isArray(hwRes.data.users)) {
          list = hwRes.data.users
        } else if (hwRes.data?.healthWorkers && Array.isArray(hwRes.data.healthWorkers)) {
          list = hwRes.data.healthWorkers
        } else if (hwRes.data?.healthStaff && Array.isArray(hwRes.data.healthStaff)) {
          list = hwRes.data.healthStaff
        }

        const match = list.find(hw => String(hw.user_id || hw.id || hw.health_worker_id) === String(visit.value.recorded_by))
        if (match) {
          visit.value.recorded_by_name = [match.firstname, match.middlename, match.surname].filter(Boolean).join(' ').trim() || match.name || match.fullname || visit.value.recorded_by
        }
      }
    } catch (err) {
      // Non-fatal: if resolving fails, leave the raw recorded_by value as the fallback
      console.warn('Could not resolve recorded_by id to name:', err)
    }
    
    // Fetch patient details for accurate name
    if (patientId) {
      try {
        const patientResponse = await api.get(`/patients/${patientId}`)
        patientData.value = patientResponse.data?.data || patientResponse.data || {}
      } catch (err) {
        console.warn('Could not fetch patient details:', err)
      }
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
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

function onDocumentClick(e) {
  // Close the menu when clicking outside of the menu wrapper
  const target = e.target
  if (!(target && target.closest && target.closest('.menu-wrapper'))) {
    showMenu.value = false
  }
}
</script>

<style scoped>
/* Menu */
.menu-wrapper { position: relative; }
.menu-popover {
  position: absolute;
  right: 0;
  top: 42px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 6px;
  z-index: 200;
  min-width: 160px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #111827;
  cursor: pointer;
  text-align: left;
}
.menu-item:hover { background: #f3f4f6; }
.menu-item i { color: #2563eb; }
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
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0.5rem;
}

.back-button:hover {
  background: #f3f4f6;
}

.back-button:active {
  transform: scale(0.95);
}

.back-button i {
  font-size: 1.5rem;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
  text-align: center;
}

.menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0.5rem;
}

.menu-button:hover {
  background: #f3f4f6;
}

.menu-button:active {
  transform: scale(0.95);
}

.menu-button i {
  font-size: 1.25rem;
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
  padding: 1.25rem 1.5rem;
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
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Info Item */
.info-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.info-item.findings {
  flex-direction: column;
  gap: 0.5rem;
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.info-icon i {
  font-size: 1.75rem;
}

.info-content {
  flex: 1;
  min-width: 0;
}

.info-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.25rem;
}

.info-value {
  display: block;
  font-size: 0.9375rem;
  color: #1f2937;
  font-weight: 600;
}

.badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.bg-warning {
  background-color: #fef3c7;
}

.text-dark {
  color: #92400e;
}

.bg-secondary {
  background-color: #f3f4f6;
  color: #4b5563;
}

.findings-text {
  font-size: 0.9375rem;
  color: #1f2937;
  line-height: 1.6;
  margin: 0;
}

/* Vitals Grid */
.vitals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.875rem;
}

.vital-box {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
}

.vital-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.vital-icon i {
  font-size: 1.5rem;
}

.vital-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.vital-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.vital-value {
  font-size: 0.9375rem;
  color: #1f2937;
  font-weight: 600;
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

.empty-text {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
  max-width: 320px;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1.5rem;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 0.5rem;
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
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background: #0069d9;
}

.retry-button:active {
  transform: scale(0.98);
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

  .header-bar {
    padding: 0.875rem 1rem;
  }

  .page-title {
    font-size: 1rem;
  }

  .back-button,
  .menu-button {
    width: 32px;
    height: 32px;
    font-size: 1.125rem;
  }

  .card-body {
    padding: 1rem;
    gap: 1rem;
  }

  .vitals-grid {
    grid-template-columns: 1fr;
  }

  .info-label {
    font-size: 0.6875rem;
  }

  .info-value,
  .findings-text {
    font-size: 0.875rem;
  }
}
</style>
