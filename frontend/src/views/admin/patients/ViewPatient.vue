<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav
        aria-label="breadcrumb"
        class="mb-3"
      >
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">
              Dashboard
            </router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/admin/patients">
              Patient Records
            </router-link>
          </li>
          <li
            class="breadcrumb-item active"
            aria-current="page"
          >
            View Details
          </li>
        </ol>
      </nav>

      <!-- Offline Indicator Banner -->
      <div
        v-if="isOffline"
        class="alert alert-warning d-flex align-items-center mb-3"
        role="alert"
      >
        <i class="bi bi-wifi-off me-2 fs-5" />
        <div>
          <strong>Offline Mode</strong> - You're viewing cached data. Editing is disabled until you reconnect to the internet.
        </div>
      </div>

      <!-- Caching Progress Banner -->
      <div
        v-if="isCaching"
        class="alert alert-info d-flex align-items-center mb-3"
        role="alert"
      >
        <div
          class="spinner-border spinner-border-sm me-2"
          role="status"
        >
          <span class="visually-hidden">Caching...</span>
        </div>
        <div>
          <strong>Caching patient data...</strong> Please wait while we save data for offline access.
        </div>
      </div>

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">
            <i class="bi bi-person-circle me-2" />Patient Details
          </h2>
          <p class="text-muted mb-0">
            View patient information and vaccination history
          </p>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-secondary"
            @click="goBack"
          >
            <i class="bi bi-arrow-left me-2" />Back
          </button>
          <router-link
            to="/admin/dashboard"
            class="btn btn-outline-primary"
          >
            <i class="bi bi-house me-2" />Home
          </router-link>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading patient data...</span>
        </div>
        <p class="text-muted mt-2">
          Loading patient information...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="alert alert-danger"
      >
        <i class="bi bi-exclamation-circle me-2" />
        {{ error }} <router-link to="/admin/patients">
          Go back to patient list
        </router-link>
      </div>

      <!-- Patient Details -->
      <div
        v-else
        class="row"
      >
        <!-- Patient Information with Tabs -->
        <div class="col-lg-8 mb-4">
          <div class="card shadow">
            <div class="card-header py-3">
              <!-- Tabs Navigation -->
              <ul class="nav nav-tabs card-header-tabs">
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'info' }"
                    @click="activeTab = 'info'"
                  >
                    <i class="bi bi-person-circle me-2" />Patient Information
                  </button>
                </li>
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'vaccinations' }"
                    @click="activeTab = 'vaccinations'"
                  >
                    <i class="bi bi-shield-check me-2" />Vaccination History
                  </button>
                </li>
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'scheduled' }"
                    @click="activeTab = 'scheduled'"
                  >
                    <i class="bi bi-calendar-check me-2" />Scheduled Vaccinations
                  </button>
                </li>
                <li class="nav-item">
                  <button 
                    class="nav-link" 
                    :class="{ active: activeTab === 'visits' }"
                    @click="activeTab = 'visits'"
                  >
                    <i class="bi bi-clipboard-pulse me-2" />Medical History
                  </button>
                </li>
              </ul>
            </div>
            <div class="card-body p-4">
              <!-- Patient Information Tab -->
              <div v-if="activeTab === 'info'">
                <PatientForm
                  :initial-data="patientData"
                  :guardians="guardians"
                  :is-editing="true"
                  :read-only="true"
                  submit-label="Update Patient"
                />
                <div class="d-flex justify-content-end mt-3">
                  <router-link 
                    v-if="!isOffline"
                    :to="{ name: 'EditPatient', params: { id: patientId } }"
                    class="btn btn-primary btn-sm"
                  >
                    <i class="bi bi-pencil-square me-2" />Edit Patient Information
                  </router-link>
                  <button
                    v-else
                    class="btn btn-secondary btn-sm"
                    disabled
                    title="Editing is disabled while offline"
                  >
                    <i class="bi bi-wifi-off me-2" />Edit Patient Information (Offline)
                  </button>
                </div>
              </div>

              <!-- Vaccination History Tab -->
              <div v-if="activeTab === 'vaccinations'">
                <VaccinationHistory :patient-id="patientId" />
              </div>

              <!-- Scheduled Vaccinations Tab -->
              <div v-if="activeTab === 'scheduled'">
                <ScheduledVaccinations :patient-id="patientId" />
              </div>

              <!-- Medical History Tab -->
              <div v-if="activeTab === 'visits'">
                <MedicalHistory
                  :patient-id="patientId"
                  :embedded-page="true"
                />
                <div class="d-flex justify-content-end mt-3" />
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar with Stats and Actions -->
        <div class="col-lg-4 d-flex flex-column">
          <!-- Patient Summary Card -->
          <div class="card shadow mb-4">
            <div class="card-header py-3 bg-primary text-white">
              <h6 class="m-0 fw-bold">
                <i class="bi bi-person-badge me-2" />Patient Summary
              </h6>
            </div>
            <div class="card-body p-0">
              <!-- Patient Overview Section -->
              <div class="p-4 bg-light border-bottom">
                <div class="summary-header mb-2">
                  <div class="summary-name-block">
                    <h5 class="mb-1 text-dark fw-semibold">
                      {{ fullName }}
                    </h5>
                    <div class="text-muted small">
                      {{ calculateAge(patientData.date_of_birth) }} • {{ patientData.sex }}
                    </div>
                  </div>
                  <div class="status-block text-center">
                    <span
                      class="badge bg-secondary me-1"
                      title="Patient ID"
                    >
                      #{{ patientData.id }}
                    </span>
                    <span
                      v-if="patientStatus"
                      class="badge status-badge me-1"
                      :class="patientStatusClass"
                    >
                      {{ patientStatusDisplay }}
                    </span>
                    <span
                      v-if="patientData.tags && patientData.tags !== 'None'"
                      class="badge tag-badge"
                      :class="tagClass"
                    >
                      {{ patientData.tags }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Key Information -->
              <div class="p-4">
                <div class="info-section mb-3">
                  <h6 class="section-title text-primary mb-3">
                    <i class="bi bi-info-circle me-2" />Basic Information
                  </h6>
                  <div class="info-item mb-2">
                    <div class="info-label">
                      Date of Birth
                    </div>
                    <div class="info-value">
                      {{ formatDate(patientData.date_of_birth) }}
                    </div>
                  </div>
                  <div class="info-item mb-2">
                    <div class="info-label">
                      Barangay
                    </div>
                    <div class="info-value">
                      {{ patientData.barangay || 'Not specified' }}
                    </div>
                  </div>
                  <div class="info-item mb-0">
                    <div class="info-label">
                      Health Center
                    </div>
                    <div class="info-value">
                      {{ patientData.health_center || 'Not specified' }}
                    </div>
                  </div>
                </div>

                <div class="info-section mb-3">
                  <h6 class="section-title text-success mb-3">
                    <i class="bi bi-shield-check me-2" />Vaccination Status
                  </h6>
                  <div class="info-item mb-0">
                    <div class="info-label">
                      Last Vaccination
                    </div>
                    <div class="info-value">
                      <span
                        v-if="lastVaccination"
                        class="text-success fw-bold"
                      >
                        {{ formatDate(lastVaccination) }}
                      </span>
                      <span
                        v-else
                        class="text-muted"
                      >
                        No records
                      </span>
                    </div>
                  </div>
                </div>

                <!-- QR Code Section -->
                <div class="text-center">
                  <h6 class="section-title text-info mb-3">
                    <i class="bi bi-qr-code me-2" />Patient QR Code
                  </h6>
                  <div class="qr-code-container">
                    <canvas
                      ref="qrCanvas"
                      width="120"
                      height="120"
                    />
                  </div>
                  <small class="text-muted d-block mt-2">
                    Scan for quick access
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vaccination editor now opens as a dedicated page -->
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import PatientForm from '@/features/admin/patients/PatientForm.vue'
import VaccinationHistory from '@/features/admin/patients/VaccinationHistory.vue'
import ScheduledVaccinations from '@/features/admin/patients/ScheduledVaccinations.vue'
import MedicalHistory from '@/features/admin/patients/MedicalHistory.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import QRCode from 'qrcode'

// CRITICAL: Preload lazy-loaded route components for offline use
// This ensures that when user views a patient, all related components are cached
// and can be accessed offline (vaccine details, visit summary, etc.)
const preloadRelatedComponents = () => {
  // Preload VaccineDetails component (lazy-loaded in router)
  // Used when clicking on a specific vaccine in Vaccination History
  import('@/views/admin/patients/VaccineDetails.vue').catch(() => {
    console.warn('[Offline] VaccineDetails preload failed - may not be available offline')
  })
  
  // Preload VisitSummary component (lazy-loaded in router)
  // Used when clicking on a specific visit in Medical History
  import('@/views/admin/patients/VisitSummaryPage.vue').catch(() => {
    console.warn('[Offline] VisitSummaryPage preload failed - may not be available offline')
  })
  
  // Preload MedicalHistoryPage component (lazy-loaded in router)
  // Used when navigating to full medical history view
  import('@/views/admin/patients/MedicalHistoryPage.vue').catch(() => {
    console.warn('[Offline] MedicalHistoryPage preload failed - may not be available offline')
  })
  
  // Preload VaccinationEditorPage component (lazy-loaded in router)
  // Used when navigating to full vaccinations view
  import('@/views/admin/patients/VaccinationEditorPage.vue').catch(() => {
    console.warn('[Offline] VaccinationEditorPage preload failed - may not be available offline')
  })
  
  // Preload EditPatient component (lazy-loaded in router)
  // Used when clicking edit button
  import('@/views/admin/patients/EditPatient.vue').catch(() => {
    console.warn('[Offline] EditPatient preload failed - may not be available offline')
  })
  
  console.log('📦 [ViewPatient] Preloading 5 related components for offline use')
}

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const patientData = ref({})
const guardians = ref([])
const loading = ref(true)
const error = ref(null)
const lastVaccination = ref(null)
const activeTab = ref('info')
const isOffline = ref(!navigator.onLine)
const isCaching = ref(false)
const qrCanvas = ref(null)

const patientId = computed(() => route.params.id)

const fullName = computed(() => {
  const parts = [
    patientData.value.firstname,
    patientData.value.middlename,
    patientData.value.surname
  ].filter(Boolean)
  return parts.join(' ')
})

// Derive patient status display & classes (Active / Inactive / Archived)
const patientStatus = computed(() => {
  const raw = (patientData.value.status || '').toString().trim().toLowerCase()
  if (!raw) return null
  if (['active', 'inactive', 'archived'].includes(raw)) return raw
  // Fallback mappings (e.g., 1/0 or A/I codes) if needed
  if (raw === '1') return 'active'
  if (raw === '0') return 'inactive'
  return raw
})

const patientStatusDisplay = computed(() => {
  if (!patientStatus.value) return ''
  return patientStatus.value.charAt(0).toUpperCase() + patientStatus.value.slice(1)
})

const patientStatusClass = computed(() => {
  switch (patientStatus.value) {
    case 'active': return 'bg-success'
    case 'inactive': return 'bg-secondary'
    case 'archived': return 'bg-dark'
    default: return 'bg-info'
  }
})

const tagClass = computed(() => {
  const t = patientData.value.tags
  if (t === 'FIC') return 'bg-success'
  if (t === 'CIC') return 'bg-warning'
  if (t === 'Defaulter') return 'bg-danger'
  return 'bg-primary'
})

const goBack = () => {
  router.back()
}

const formatForInput = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  } catch (e) {
    return ''
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const calculateAge = (birthDate) => {
  if (!birthDate) return 'Unknown'
  const today = new Date()
  const birth = new Date(birthDate)
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  if (months < 0) {
    years--
    months += 12
  }
  if (years > 0) {
    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`
  } else {
    return `${months} month${months !== 1 ? 's' : ''}`
  }
}

const fetchPatientData = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch guardians first
    const guardianResponse = await api.get('/guardians')
    guardians.value = guardianResponse.data.data || guardianResponse.data || []

    // Fetch patient data
    const response = await api.get(`/patients/${patientId.value}`)
    const p = response.data.data || response.data

    // Map backend fields to form structure
    patientData.value = {
      id: p.id || p.patient_id,
      surname: p.surname || p.lastName || '',
      firstname: p.firstname || p.firstName || '',
      middlename: p.middlename || p.middleName || '',
      sex: p.sex || '',
      date_of_birth: formatForInput(p.date_of_birth || p.dateOfBirth),
      address: p.address || '',
      barangay: p.barangay || '',
      health_center: p.health_center || p.healthCenter || '',
      mother_name: p.mother_name || p.motherName || '',
      mother_occupation: p.mother_occupation || p.motherOccupation || '',
      mother_contact_number: p.mother_contact_number || p.motherContactNumber || '',
      father_name: p.father_name || p.fatherName || '',
      father_occupation: p.father_occupation || p.fatherOccupation || '',
      father_contact_number: p.father_contact_number || p.fatherContactNumber || '',
      guardian_id: p.guardian_id || p.guardianId || null,
      family_number: p.family_number || p.familyNumber || '',
      relationship_to_guardian: p.relationship_to_guardian || p.relationshipToGuardian || '',
      birth_weight: (p.medical_history && p.medical_history.birth_weight) || p.birth_weight || p.birthWeight || '',
      birth_length: (p.medical_history && p.medical_history.birth_length) || p.birth_length || p.birthLength || '',
      place_of_birth: (p.medical_history && p.medical_history.place_of_birth) || p.place_of_birth || p.placeOfBirth || '',
      time_of_birth: (p.medical_history && (p.medical_history.time_of_birth || p.medical_history.timeOfBirth)) || p.time_of_birth || '',
      attendant_at_birth: (p.medical_history && (p.medical_history.attendant_at_birth || p.medical_history.attendantAtBirth)) || p.attendant_at_birth || '',
      type_of_delivery: (p.medical_history && (p.medical_history.type_of_delivery || p.medical_history.typeOfDelivery)) || p.type_of_delivery || '',
      ballards_score: (p.medical_history && (p.medical_history.ballards_score || p.medical_history.ballardsScore)) || p.ballards_score || '',
      newborn_screening_result: (p.medical_history && (p.medical_history.newborn_screening_result || p.medical_history.newbornScreeningResult)) || p.newborn_screening_result || '',
      hearing_test_date: formatForInput((p.medical_history && (p.medical_history.hearing_test_date || p.medical_history.hearingTestDate)) || p.hearing_test_date),
      newborn_screening_date: formatForInput((p.medical_history && (p.medical_history.newborn_screening_date || p.medical_history.newbornScreeningDate)) || p.newborn_screening_date),
      qr: p.qr, // Include the QR data from backend
      tags: p.tags || 'None',
      status: p.status || p.patient_status || p.patientStatus || null
    }

    // Resolve family number from guardian if missing
    if (!patientData.value.family_number && patientData.value.guardian_id && Array.isArray(guardians.value)) {
      const g = guardians.value.find(x => x.guardian_id === patientData.value.guardian_id)
      if (g && g.family_number) {
        patientData.value.family_number = g.family_number
      }
    }

    // Get last vaccination: if not in patient payload, fetch by patient id
    if (p.lastVaccination || p.last_vaccination_date) {
      lastVaccination.value = p.lastVaccination || p.last_vaccination_date
    } else {
      try {
        const vaccRes = await api.get(`/immunizations`, { params: { patient_id: patientId.value, limit: 1, sort: 'administered_date:desc' } })
        const items = vaccRes.data?.data || vaccRes.data?.items || vaccRes.data || []
        const mostRecent = Array.isArray(items) && items.length > 0 ? (items[0].administered_date || items[0].date_administered) : null
        if (mostRecent) lastVaccination.value = mostRecent
      } catch (e) {
        // non-fatal; keep null if fetch fails
      }
    }

    // Vaccination editor is now a separate page; no local modal data prep needed

  } catch (err) {
    console.error('Error fetching patient data:', err)
    error.value = 'Failed to load patient data. Please try again.'
    addToast({
      title: 'Error',
      message: error.value,
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

/**
 * Prefetch ALL patient-related data for comprehensive offline caching
 * This ensures that when a user views a patient online, ALL related data
 * is cached and available offline, not just the patient record itself.
 */
const prefetchPatientData = async () => {
  if (!patientId.value) return
  
  // Skip if offline
  if (!navigator.onLine) {
    console.log('⚠️ [ViewPatient] Skipping prefetch (offline)')
    return
  }
  
  try {
    isCaching.value = true
    console.log(`🔄 [ViewPatient] Prefetching comprehensive data for patient ${patientId.value}`)
    
    // Track all prefetch promises
    const prefetchPromises = []
    
    // Fetch immunizations (vaccination history) - will be auto-cached by response interceptor
    prefetchPromises.push(
      api.get('/immunizations', { 
        params: { 
          patient_id: patientId.value, 
          limit: 200 
        } 
      }).catch(() => {})
    )
    
    // Fetch visits (medical history) and their vitals - will be auto-cached by response interceptor
    prefetchPromises.push(
      api.get('/visits', { 
        params: { 
          patient_id: patientId.value, 
          page: 1,
          limit: 200 
        } 
      }).then(async (response) => {
        // After fetching visits, fetch vitals for each visit
        const visits = response.data?.data || response.data?.items || response.data || []
        if (Array.isArray(visits)) {
          const vitalPromises = visits
            .filter(visit => visit.vital_id)
            .map(visit => api.get(`/vitals/${visit.vital_id}`).catch(() => {}))
          
          return Promise.all(vitalPromises)
        }
      }).catch(() => {})
    )
    
    // Fetch patient schedule - will be auto-cached by response interceptor
    prefetchPromises.push(
      api.get(`/patients/${patientId.value}/schedule`).catch(() => {})
    )
    
    // Fetch vaccine inventory - needed for vaccine details page
    prefetchPromises.push(
      api.get('/vaccines/inventory').catch(() => {})
    )
    
    // Wait for all prefetch operations to complete
    await Promise.all(prefetchPromises)
    
    console.log(`✅ [ViewPatient] Prefetch completed for patient ${patientId.value}`)
    
    // Show success toast notification
    addToast({
      title: 'Offline Ready',
      message: 'Patient data cached',
      type: 'success',
      timeout: 3000
    })
    
  } catch (error) {
    // Non-fatal - prefetch is opportunistic
    console.warn('[ViewPatient] Prefetch failed:', error)
  } finally {
    isCaching.value = false
  }
}

const renderQR = async () => {
  if (!qrCanvas.value || !patientData.value.id) return
  
  try {
    const origin = window.location.origin
    const qrUrl = patientData.value.qr?.url || `${origin}/patient/${patientData.value.id}`
    
    await QRCode.toCanvas(qrCanvas.value, qrUrl, { 
      width: 180,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    console.log('✅ QR code rendered in patient summary')
  } catch (error) {
    console.error('❌ Error rendering QR code:', error)
  }
}

// Online/Offline event listeners
const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine
  
  if (navigator.onLine) {
    console.log('🌐 Connection restored')
    addToast({
      title: 'Back Online',
      message: 'You can now edit records',
      type: 'success',
      timeout: 3000
    })
  } else {
    console.log('📴 Connection lost')
    addToast({
      title: 'Offline',
      message: 'Viewing cached data',
      type: 'warning',
      timeout: 3000
    })
  }
}

onMounted(async () => {
  // Add online/offline event listeners
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  
  await fetchPatientData()
  
  // Render QR code after patient data is loaded
  await nextTick()
  await renderQR()
  
  // Preload related components for offline use
  preloadRelatedComponents()
  
  // Prefetch all patient-related data for offline caching (only if online)
  await prefetchPatientData()
  
  // Check for hash navigation (e.g., #vaccinations)
  if (route.hash) {
    const tab = route.hash.replace('#', '')
    if (['info', 'vaccinations', 'scheduled', 'visits'].includes(tab)) {
      activeTab.value = tab
    }
  }
})

// Watch for patient data changes to re-render QR
watch(() => patientData.value.id, async () => {
  await nextTick()
  await renderQR()
})

// Cleanup event listeners on unmount
onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
.nav-tabs .nav-link {
  border: none;
  border-bottom: 3px solid transparent;
  color: #6c757d;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  transition: all 0.3s;
}

.nav-tabs .nav-link:hover {
  border-color: transparent;
  background-color: rgba(13, 110, 253, 0.05);
  color: #0d6efd;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  background: transparent;
}

.card-header-tabs {
  margin-bottom: -1rem;
  border-bottom: none;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-code-container canvas {
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.patient-info-table td {
  padding: 0.75rem 0.5rem;
  vertical-align: middle;
}

.patient-info-table tr {
  border-bottom: 1px solid #f0f0f0;
}

.patient-info-table tr:last-child {
  border-bottom: none;
}

.patient-info-table .text-muted {
  font-size: 0.875rem;
}

.patient-info-table td:first-child {
  width: 50%;
}

.patient-info-table td:last-child {
  width: 50%;
}

/* New patient summary styles */
.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* New summary layout without avatar */
.summary-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  text-align: center;
}

.summary-name-block h5 {
  font-size: 1.075rem;
}

.status-block .badge {
  font-size: 0.65rem;
  letter-spacing: .5px;
  text-transform: uppercase;
}

.status-block {
  text-align: center;
}

.status-badge {
  font-weight: 600;
}

.tag-badge {
  font-weight: 500;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
}

.info-section {
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: #495057;
  font-weight: 600;
  text-align: right;
}

.qr-code-container {
  display: inline-block;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  border: 2px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qr-code-container canvas {
  display: block;
  border-radius: 0.25rem;
}
</style>

