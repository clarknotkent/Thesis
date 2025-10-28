<template>
  <HealthWorkerLayout :show-controls="false">
    <!-- Fixed Header Section -->
    <div class="add-record-header-section">
      <div class="header-bar">
        <button class="back-button" @click="goBack">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h1 class="page-title">Add Immunization Record</h1>
        <div style="width: 40px;"></div>
      </div>
    </div>

    <!-- Page Content -->
    <div class="page-content-wrapper">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading form data...</p>
      </div>

      <!-- Form Content -->
      <form v-else @submit.prevent="handleSubmit" class="record-form">
        <!-- Patient Info Display (Read-only) -->
        <div class="form-section patient-info-display">
          <h3 class="section-title">
            <i class="bi bi-person-fill"></i>
            Patient Information
          </h3>
          <div v-if="currentPatient" class="patient-details">
            <div class="patient-name">{{ currentPatient.childInfo?.name || `${currentPatient.firstname} ${currentPatient.surname}` }}</div>
            <div class="patient-meta">
              <span v-if="currentPatient.age"><i class="bi bi-calendar3"></i> {{ currentPatient.age }} years old</span>
              <span v-if="currentPatient.sex"><i class="bi bi-gender-ambiguous"></i> {{ currentPatient.sex }}</span>
            </div>
          </div>
          <div v-else class="text-muted">Loading patient information...</div>
        </div>

        <!-- Vital Signs Card -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="bi bi-heart-pulse-fill"></i>
            Vital Signs
          </h3>
          
          <div class="form-group">
            <label class="form-label">Temperature (°C)</label>
            <input 
              type="number" 
              step="0.1" 
              class="form-input" 
              v-model="formData.vitals.temperature"
              placeholder="e.g., 36.5"
            />
          </div>

          <div class="form-group">
            <label class="form-label">MUAC (cm)</label>
            <input 
              type="number" 
              step="0.1" 
              class="form-input" 
              v-model="formData.vitals.muac"
              placeholder="Mid-Upper Arm Circumference"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Respiration (Beats/min)</label>
            <input 
              type="number" 
              class="form-input" 
              v-model="formData.vitals.respiration"
              placeholder="e.g., 18"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Weight (kg)</label>
            <input 
              type="number" 
              step="0.01" 
              class="form-input" 
              v-model="formData.vitals.weight"
              placeholder="e.g., 8.5"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Height (cm)</label>
            <input 
              type="number" 
              step="0.1" 
              class="form-input" 
              v-model="formData.vitals.height"
              placeholder="e.g., 75.5"
            />
          </div>
        </div>

        <!-- Findings Card -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="bi bi-clipboard-data-fill"></i>
            Findings
          </h3>
          
          <div class="form-group">
            <label class="form-label">Findings/Notes</label>
            <textarea 
              class="form-input" 
              rows="4" 
              v-model="formData.findings"
              placeholder="Enter findings or notes about this visit..."
            ></textarea>
            <small class="form-hint">This field is auto-filled after adding interventions</small>
          </div>
        </div>

        <!-- Add Service Section -->
        <div class="form-section">
          <button 
            type="button" 
            class="btn-add-service" 
            @click="toggleServiceForm"
          >
            <i class="bi bi-plus-circle-fill"></i>
            {{ showServiceForm ? 'Hide Service Form' : 'Add Service to Record' }}
          </button>

          <!-- Expandable Service Form -->
          <div v-if="showServiceForm" class="service-form-container">
            <div class="service-form-card">
              <h4 class="service-form-title">
                <i class="bi bi-syringe-fill"></i>
                Add Vaccine Service
              </h4>

              <div class="form-group">
                <label class="form-label">Vaccine *</label>
                <div class="vaccine-search-wrapper" @click.stop>
                  <input 
                    type="text"
                    class="form-input"
                    v-model="vaccineSearchTerm"
                    @input="onVaccineSearch"
                    @focus="showVaccineDropdown = true"
                    placeholder="Type to search vaccine..."
                    autocomplete="off"
                    required
                  />
                  <div 
                    v-if="showVaccineDropdown" 
                    class="vaccine-dropdown"
                    @click.stop
                  >
                    <template v-if="filteredVaccineOptions.length > 0">
                      <button
                        v-for="vaccine in filteredVaccineOptions"
                        :key="vaccine.inventory_id"
                        type="button"
                        class="vaccine-option"
                        :class="{ 'disabled': vaccine.isExpired }"
                        @click.stop="selectVaccine(vaccine)"
                        :disabled="vaccine.isExpired"
                      >
                        <div class="vaccine-option-main">
                          <strong>{{ vaccine.antigen_name }}</strong>
                          <span class="vaccine-brand">{{ vaccine.brand_name }}</span>
                        </div>
                        <div class="vaccine-option-details">
                          <span class="vaccine-detail">Lot: {{ vaccine.lot_number }}</span>
                          <span class="vaccine-detail">Stock: {{ vaccine.current_stock }}</span>
                          <span v-if="vaccine.isExpired" class="vaccine-expired">EXPIRED</span>
                        </div>
                      </button>
                    </template>
                    <div v-else-if="vaccineOptions.length === 0" class="vaccine-no-results">
                      Loading vaccines...
                    </div>
                    <div v-else class="vaccine-no-results">
                      <div v-if="vaccineSearchTerm">
                        No vaccines found matching "{{ vaccineSearchTerm }}"
                      </div>
                      <div v-else>
                        No vaccines available in stock
                      </div>
                      <small class="d-block mt-2 text-muted">
                        Total vaccines loaded: {{ vaccineOptions.length }}
                      </small>
                    </div>
                  </div>
                </div>
                <div class="form-group-inline">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="serviceForm.filterNIP" />
                    Filter NIP only
                  </label>
                </div>
              </div>

              <div class="form-group" v-if="serviceForm.diseasePrevented">
                <label class="form-label">Disease Prevented</label>
                <input 
                  type="text"
                  class="form-input"
                  v-model="serviceForm.diseasePrevented"
                  readonly
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Dose Number *</label>
                  <select class="form-input" v-model="serviceForm.doseNumber">
                    <option value="">Select dose</option>
                    <option value="1">Dose 1</option>
                    <option value="2">Dose 2</option>
                    <option value="3">Dose 3</option>
                    <option value="booster">Booster</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Date Administered *</label>
                  <input 
                    type="date"
                    class="form-input"
                    v-model="serviceForm.dateAdministered"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Age at Administration</label>
                  <input 
                    type="text"
                    class="form-input"
                    v-model="serviceForm.ageAtAdmin"
                    placeholder="Auto-calculated"
                    readonly
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Manufacturer</label>
                  <input 
                    type="text"
                    class="form-input"
                    v-model="serviceForm.manufacturer"
                    placeholder="Enter manufacturer"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Lot Number</label>
                  <input 
                    type="text"
                    class="form-input"
                    v-model="serviceForm.lotNumber"
                    placeholder="Enter lot number"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Site of Administration</label>
                  <select class="form-input" v-model="serviceForm.site">
                    <option value="">Select a site</option>
                    <option value="left-deltoid">Left Deltoid</option>
                    <option value="right-deltoid">Right Deltoid</option>
                    <option value="left-thigh">Left Thigh</option>
                    <option value="right-thigh">Right Thigh</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Health Staff *</label>
                <select 
                  class="form-input" 
                  v-model="serviceForm.healthStaff" 
                  required
                >
                  <option value="">Select health staff</option>
                  <option 
                    v-for="nurse in nurses" 
                    :key="nurse.user_id" 
                    :value="nurse.user_id"
                  >
                    {{ nurse.fullname }} ({{ nurse.hs_type }})
                  </option>
                  <option v-if="nurses.length === 0" disabled>No nurses/nutritionists available</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Facility Name</label>
                <input 
                  type="text"
                  class="form-input"
                  v-model="serviceForm.facilityName"
                  placeholder="Enter facility name"
                />
                <div class="form-group-inline">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="serviceForm.outsideFacility" />
                    Administered from outside facility
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Remarks</label>
                <textarea 
                  class="form-input" 
                  rows="3" 
                  v-model="serviceForm.remarks"
                  placeholder="Enter any remarks or notes..."
                ></textarea>
              </div>

              <div class="service-form-actions">
                <button type="button" class="btn-form-cancel" @click="cancelServiceForm">
                  Cancel
                </button>
                <button type="button" class="btn-form-add" @click="addServiceToRecord">
                  <i class="bi bi-plus-lg"></i>
                  Add to Record
                </button>
              </div>
            </div>
          </div>

          <!-- Added Services List -->
          <div v-if="addedServices.length > 0" class="added-services-list">
            <h4 class="added-services-title">Services to be Recorded</h4>
            <div 
              v-for="(service, index) in addedServices" 
              :key="index"
              class="service-item"
            >
              <div class="service-item-header">
                <i class="bi bi-syringe-fill"></i>
                <span class="service-item-name">{{ service.vaccineName }}</span>
                <span class="service-item-dose">Dose {{ service.doseNumber }}</span>
              </div>
              <div class="service-item-details">
                <span>{{ formatDate(service.dateAdministered) }}</span>
              </div>
              <div class="service-item-actions">
                <button type="button" class="btn-service-action" @click="editService(index)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="btn-service-action delete" @click="removeService(index)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Service Rendered Card -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="bi bi-check-circle-fill"></i>
            Service Rendered
          </h3>
          
          <div class="form-group">
            <label class="form-label">Service Summary</label>
            <textarea 
              class="form-input" 
              rows="3" 
              v-model="formData.service_rendered"
              readonly
              placeholder="Auto-generated summary of services..."
            ></textarea>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button type="button" class="btn-cancel" @click="goBack">
            <i class="bi bi-x-circle"></i>
            Cancel
          </button>
          <button type="submit" class="btn-save" :disabled="submitting">
            <i class="bi bi-check-circle-fill" v-if="!submitting"></i>
            <span class="spinner-small" v-else></span>
            {{ submitting ? 'Saving...' : 'Save Record' }}
          </button>
        </div>
      </form>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, toRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import api from '@/services/api'
import { useVaccinationRecords } from '@/composables/useVaccinationRecords'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const submitting = ref(false)
const patients = ref([])
const currentPatient = ref(null)

// Use the vaccination records composable for vaccine data
const {
  vaccineOptions,
  vaccineCatalog,
  fetchVaccineOptions,
  fetchVaccineCatalog
} = useVaccinationRecords(toRef(() => route.params.patientId), ref(null))

// Separate ref for nurses/nutritionists (for vaccination administration)
const nurses = ref([])

// Service form state
const showServiceForm = ref(false)
const addedServices = ref([])
const editingServiceIndex = ref(null)
const vaccineSearchTerm = ref('')
const showVaccineDropdown = ref(false)

const serviceForm = ref({
  inventoryId: '',
  vaccineName: '',
  diseasePrevented: '',
  filterNIP: false,
  doseNumber: '',
  dateAdministered: '',
  ageAtAdmin: '',
  manufacturer: '',
  lotNumber: '',
  site: '',
  healthStaff: '',
  facilityName: '',
  outsideFacility: false,
  remarks: ''
})

// Computed: Filter vaccines by NIP and search term
const filteredVaccineOptions = computed(() => {
  let filtered = [...vaccineOptions.value]
  
  console.log('=== Vaccine Filtering ===')
  console.log('Total vaccines loaded:', filtered.length)
  console.log('Sample vaccine:', filtered[0])
  
  // Filter by NIP if checkbox is checked
  if (serviceForm.value.filterNIP) {
    filtered = filtered.filter(v => v.is_nip || v.isNIP)
    console.log('After NIP filter:', filtered.length)
  }
  
  // Filter by search term if provided
  if (vaccineSearchTerm.value && vaccineSearchTerm.value.trim() !== '') {
    const searchLower = vaccineSearchTerm.value.toLowerCase().trim()
    console.log('Searching for:', searchLower)
    
    filtered = filtered.filter(v => {
      const antigenMatch = (v.antigen_name || '').toLowerCase().includes(searchLower)
      const brandMatch = (v.brand_name || '').toLowerCase().includes(searchLower)
      const lotMatch = (v.lot_number || '').toLowerCase().includes(searchLower)
      const diseaseMatch = (v.disease_prevented || '').toLowerCase().includes(searchLower)
      
      const matches = antigenMatch || brandMatch || lotMatch || diseaseMatch
      
      if (matches) {
        console.log('Match found:', v.antigen_name, '|', v.brand_name)
      }
      
      return matches
    })
    console.log('After search filter:', filtered.length)
  } else {
    console.log('No search term - showing all vaccines')
  }
  
  // Limit to first 20 results for mobile performance
  const result = filtered.slice(0, 20)
  console.log('Final filtered results:', result.length)
  console.log('=== End Filtering ===')
  return result
})

const formData = ref({
  patient_id: route.params.patientId || '',
  vitals: {
    temperature: '',
    muac: '',
    respiration: '',
    weight: '',
    height: ''
  },
  findings: '',
  service_rendered: ''
})

const goBack = () => {
  router.back()
}

const fetchPatients = async () => {
  try {
    loading.value = true
    const response = await api.get('/patients')
    patients.value = response.data.data || response.data || []
    
    // Find and set the current patient
    if (formData.value.patient_id) {
      currentPatient.value = patients.value.find(p => p.id === formData.value.patient_id)
    }
  } catch (error) {
    console.error('Error fetching patients:', error)
    alert('Failed to load patients. Please refresh the page.')
  } finally {
    loading.value = false
  }
}

const fetchCurrentPatient = async () => {
  if (!formData.value.patient_id) return
  
  try {
    loading.value = true
    const response = await api.get(`/patients/${formData.value.patient_id}`)
    currentPatient.value = response.data.data || response.data
  } catch (error) {
    console.error('Error fetching patient:', error)
    alert('Failed to load patient information.')
  } finally {
    loading.value = false
  }
}

// Fetch health workers - specifically nurses/nutritionists for vaccination administration
const fetchHealthWorkers = async () => {
  try {
    console.log('🔄 [AddImmunization] Fetching health staff...')
    const res = await api.get('/health-staff')
    console.log('✅ [AddImmunization] Health workers API response:', res.data)
    
    // Handle different possible response structures - prioritize new backend structure
    let list = []
    if (res.data?.data?.healthWorkers && Array.isArray(res.data.data.healthWorkers)) {
      list = res.data.data.healthWorkers
    } else if (res.data?.data?.healthStaff && Array.isArray(res.data.data.healthStaff)) {
      // Current backend returns { success:true, data: { healthStaff: [...] } }
      list = res.data.data.healthStaff
    } else if (Array.isArray(res.data)) {
      list = res.data
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      list = res.data.data
    } else if (res.data?.users && Array.isArray(res.data.users)) {
      list = res.data.users
    } else if (res.data?.healthWorkers && Array.isArray(res.data.healthWorkers)) {
      list = res.data.healthWorkers
    } else if (res.data?.healthStaff && Array.isArray(res.data.healthStaff)) {
      list = res.data.healthStaff
    } else {
      console.warn('Unexpected health workers response structure:', res.data)
      list = []
    }
    
    console.log('👥 [AddImmunization] Health workers list:', list)
    
    // Role helpers
    const rawRole = (hw) => String(hw.hs_type || hw.hw_type || hw.role || hw.type || '').toLowerCase()
    const isNurseOrNutritionistRole = (r) => {
      const s = r.toLowerCase()
      return s.includes('nurse') || s.includes('rn') || s.includes('nutritionist') || s.includes('dietitian') || s.includes('nd')
    }
    const displayRole = (r) => {
      if (isNurseOrNutritionistRole(r)) {
        return r.includes('nutrition') || r.includes('diet') ? 'Nutritionist' : 'Nurse'
      }
      return r || 'Health Staff'
    }
    
    // For vaccination form (administered_by): show Nurses and Nutritionists only
    nurses.value = list
      .filter(hw => isNurseOrNutritionistRole(rawRole(hw)))
      .map(hw => ({
        user_id: hw.user_id || hw.id || hw.health_worker_id,
        fullname: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
        hs_type: displayRole(rawRole(hw))
      }))
    
    console.log('🎯 [AddImmunization] Processed nurses/nutritionists for vaccination:', nurses.value)
    console.log('🔍 [AddImmunization] Available HS types in data:', [...new Set(list.map(hw => hw.hs_type || hw.hw_type || hw.role || hw.type))])
  } catch (err) {
    console.error('❌ [AddImmunization] Failed to load health workers:', err)
    nurses.value = []
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Handle vaccine search input
const onVaccineSearch = () => {
  showVaccineDropdown.value = true
  console.log('Search input changed to:', vaccineSearchTerm.value)
  
  // Clear selection if user is modifying the search term
  if (serviceForm.value.inventoryId) {
    const selectedVaccine = vaccineOptions.value.find(v => v.inventory_id === serviceForm.value.inventoryId)
    const expectedText = selectedVaccine ? `${selectedVaccine.antigen_name} - ${selectedVaccine.brand_name}` : ''
    
    // Only clear if the text doesn't match the selected vaccine
    if (vaccineSearchTerm.value !== expectedText) {
      console.log('Clearing selection because search term changed')
      serviceForm.value.inventoryId = ''
      serviceForm.value.vaccineName = ''
      serviceForm.value.diseasePrevented = ''
      serviceForm.value.manufacturer = ''
      serviceForm.value.lotNumber = ''
    }
  }
}

// Handle vaccine selection from dropdown
const selectVaccine = (vaccine) => {
  if (vaccine.isExpired) return
  
  // Set the search term to display name
  vaccineSearchTerm.value = `${vaccine.antigen_name} - ${vaccine.brand_name}`
  
  // Fill form fields
  serviceForm.value.inventoryId = vaccine.inventory_id
  serviceForm.value.vaccineName = vaccine.antigen_name
  serviceForm.value.diseasePrevented = vaccine.disease_prevented || ''
  serviceForm.value.manufacturer = vaccine.manufacturer || ''
  serviceForm.value.lotNumber = vaccine.lot_number || ''
  
  // Close dropdown
  showVaccineDropdown.value = false
}

// Close dropdown when clicking outside
const closeVaccineDropdown = (event) => {
  // Check if click is outside the vaccine search wrapper
  if (!event.target.closest('.vaccine-search-wrapper')) {
    showVaccineDropdown.value = false
  }
}

// Service form functions
const toggleServiceForm = () => {
  showServiceForm.value = !showServiceForm.value
  if (!showServiceForm.value) {
    resetServiceForm()
  }
}

const resetServiceForm = () => {
  serviceForm.value = {
    inventoryId: '',
    vaccineName: '',
    diseasePrevented: '',
    filterNIP: false,
    doseNumber: '',
    dateAdministered: '',
    ageAtAdmin: '',
    manufacturer: '',
    lotNumber: '',
    site: '',
    healthStaff: '',
    facilityName: '',
    outsideFacility: false,
    remarks: ''
  }
  vaccineSearchTerm.value = ''
  showVaccineDropdown.value = false
  editingServiceIndex.value = null
}

const cancelServiceForm = () => {
  showServiceForm.value = false
  resetServiceForm()
}

const addServiceToRecord = () => {
  // Validate required fields
  if (!serviceForm.value.inventoryId) {
    alert('Please select a vaccine from the dropdown')
    return
  }
  
  if (!serviceForm.value.doseNumber || !serviceForm.value.dateAdministered || !serviceForm.value.healthStaff) {
    alert('Please fill in all required fields (Vaccine, Dose Number, Date Administered, Health Staff)')
    return
  }

  if (editingServiceIndex.value !== null) {
    // Update existing service
    addedServices.value[editingServiceIndex.value] = { ...serviceForm.value }
  } else {
    // Add new service
    addedServices.value.push({ ...serviceForm.value })
  }

  // Reset form and close
  showServiceForm.value = false
  resetServiceForm()
}

const editService = (index) => {
  editingServiceIndex.value = index
  serviceForm.value = { ...addedServices.value[index] }
  showServiceForm.value = true
}

const removeService = (index) => {
  if (confirm('Are you sure you want to remove this service?')) {
    addedServices.value.splice(index, 1)
  }
}

// Watch addedServices to update service_rendered summary
watch(addedServices, (services) => {
  if (services.length > 0) {
    const summary = services.map(s => 
      `${s.vaccineName} (Dose ${s.doseNumber}) - ${formatDate(s.dateAdministered)}`
    ).join('; ')
    formData.value.service_rendered = summary
  } else {
    formData.value.service_rendered = ''
  }
}, { deep: true })

// Watch nurses to log when data loads
watch(nurses, (workers) => {
  console.log('Nurses/Nutritionists data updated:', workers.length, 'staff')
  if (workers.length > 0) {
    console.log('First nurse:', workers[0])
    console.log('Sample structure:', {
      user_id: workers[0].user_id,
      fullname: workers[0].fullname,
      hs_type: workers[0].hs_type
    })
  }
}, { immediate: true })

// Watch vaccineOptions to log when data loads
watch(vaccineOptions, (vaccines) => {
  console.log('Vaccine options data updated:', vaccines.length, 'vaccines')
  if (vaccines.length > 0) {
    console.log('First vaccine:', vaccines[0])
  }
}, { immediate: true })

const handleSubmit = async () => {
  try {
    submitting.value = true

    if (!formData.value.patient_id) {
      alert('Patient ID is missing. Please go back and try again.')
      return
    }

    // Prepare visit data
    const visitData = {
      patient_id: formData.value.patient_id,
      visit_date: new Date().toISOString().split('T')[0],
      vitals: formData.value.vitals,
      findings: formData.value.findings,
      service_rendered: formData.value.service_rendered,
      services: addedServices.value
    }

    // TODO: Replace with actual API endpoint
    console.log('Submitting visit data:', visitData)
    
    // Simulated API call
    // const response = await api.post('/visits', visitData)
    
    alert('Immunization record saved successfully!')
    router.push(`/healthworker/patients/${formData.value.patient_id}`)
  } catch (error) {
    console.error('Error saving record:', error)
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred'
    alert(`Failed to save record: ${errorMessage}`)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchCurrentPatient()
  fetchVaccineOptions() // Using composable function
  fetchHealthWorkers() // Direct API call - filters nurses/nutritionists for vaccination
  
  // Add click outside listener for vaccine dropdown
  document.addEventListener('click', closeVaccineDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeVaccineDropdown)
})
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
  padding: 0 0.5rem;
}

/* Page Content */
.page-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  padding-bottom: 120px;
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
  color: #111827;
  margin-bottom: 0.5rem;
}

.patient-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.patient-meta span {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.patient-meta i {
  color: #007bff;
}

/* Form Fields */
.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
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
}

.form-input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-hint {
  display: block;
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 0;
}

.btn-cancel,
.btn-save {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
}

.btn-save:active:not(:disabled) {
  transform: translateY(0);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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

/* Vaccine Search Dropdown */
.vaccine-search-wrapper {
  position: relative;
}

.vaccine-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.vaccine-option {
  width: 100%;
  text-align: left;
  padding: 0.75rem;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: background 0.2s;
}

.vaccine-option:last-child {
  border-bottom: none;
}

.vaccine-option:hover:not(.disabled) {
  background: #f3f4f6;
}

.vaccine-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vaccine-option-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.vaccine-option-main strong {
  font-size: 0.9375rem;
  color: #111827;
}

.vaccine-brand {
  font-size: 0.875rem;
  color: #6b7280;
}

.vaccine-option-details {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.vaccine-detail {
  font-size: 0.8125rem;
  color: #6b7280;
}

.vaccine-expired {
  font-size: 0.75rem;
  color: #dc2626;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  background: #fef2f2;
  border-radius: 0.25rem;
}

.vaccine-no-results {
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

/* Health Staff Search Dropdown */
.health-staff-search-wrapper {
  position: relative;
}

.health-staff-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.health-staff-option {
  width: 100%;
  text-align: left;
  padding: 0.75rem;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: background 0.2s;
}

.health-staff-option:last-child {
  border-bottom: none;
}

.health-staff-option:hover {
  background: #f3f4f6;
}

.staff-option-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.staff-option-main strong {
  font-size: 0.9375rem;
  color: #111827;
}

.staff-option-details {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.staff-role {
  font-size: 0.8125rem;
  color: #6b7280;
  padding: 0.125rem 0.5rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
}

.health-staff-no-results {
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

/* Service Form Styles */
.btn-add-service {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.btn-add-service:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.btn-add-service i {
  font-size: 1.125rem;
}

.service-form-container {
  margin-top: 1rem;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.service-form-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.service-form-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.25rem 0;
}

.service-form-title i {
  color: #007bff;
  font-size: 1.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  margin-top: 0.5rem;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.service-form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn-form-cancel,
.btn-form-add {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-form-cancel {
  background: #f1f5f9;
  color: #475569;
}

.btn-form-cancel:hover {
  background: #e2e8f0;
}

.btn-form-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-form-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* Added Services List */
.added-services-list {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;
}

.added-services-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s;
}

.service-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.service-item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.service-item-header i {
  color: #007bff;
  font-size: 1.125rem;
}

.service-item-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9375rem;
}

.service-item-dose {
  background: #eff6ff;
  color: #007bff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.service-item-details {
  font-size: 0.875rem;
  color: #64748b;
}

.service-item-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-service-action {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
}

.btn-service-action:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.btn-service-action.delete:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

/* Mobile Optimizations */
@media (max-width: 576px) {
  .page-content-wrapper {
    padding: 1rem;
  }

  .form-section {
    padding: 1rem;
  }

  .form-input {
    padding: 0.625rem;
    font-size: 0.875rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .service-form-card {
    padding: 1rem;
  }

  .service-item {
    flex-wrap: wrap;
  }

  .service-item-header {
    flex-basis: 100%;
  }

  .service-item-details {
    flex-basis: 100%;
    margin-top: 0.5rem;
  }
}
</style>
