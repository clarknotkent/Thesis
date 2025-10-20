<template>
  <div v-if="!embedded" class="modal fade" :class="{ show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ recordMode ? 'Add Patient Record' : 'Add Patient Visit / Record' }}</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveVisit">
            <div class="mb-3">
                      <label class="form-label">Patient *</label>
                      <div class="input-group mb-2">
                        <input type="search" class="form-control" placeholder="Search patients by name" v-model="patientSearch" @input="onPatientSearchInput" :disabled="lockPatientEffective || viewOnly || existingVisitMode">
                        <button class="btn btn-outline-secondary" type="button" @click="clearPatientSearch">Clear</button>
                      </div>
                      <select class="form-select" v-model="form.patient_id" :disabled="lockPatientEffective || viewOnly || existingVisitMode" required>
                        <option value="">Select patient</option>
                        <option v-for="p in patients" :key="p.id" :value="p.id">{{ p.childInfo.name }}</option>
                      </select>
            </div>

            <div class="mb-3" v-if="!recordMode">
              <label class="form-label">Health Staff (BHS) *</label>
              <select class="form-select" v-model="form.recorded_by" :disabled="viewOnly || existingVisitMode" required>
                <option value="">Select health worker</option>
                <option v-for="hw in healthWorkers" :key="hw.user_id" :value="hw.user_id">{{ hw.fullname || hw.name }}</option>
              </select>
            </div>

            <h6 class="mb-2">Vital Signs</h6>
            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <label class="form-label">Temperature (°C)</label>
                <input type="number" step="0.1" class="form-control" v-model="form.vitals.temperature" :disabled="viewOnly || existingVisitMode">
              </div>
              <div class="col-md-4">
                <label class="form-label">MUAC (cm)</label>
                <input type="number" step="0.1" class="form-control" v-model="form.vitals.muac" :disabled="viewOnly || existingVisitMode">
              </div>
              <div class="col-md-4">
                <label class="form-label">Respiration (breaths/min)</label>
                <input type="number" class="form-control" v-model="form.vitals.respiration" :disabled="viewOnly || existingVisitMode">
              </div>
              <div class="col-md-4">
                <label class="form-label">Weight (kg)</label>
                <input type="number" step="0.01" class="form-control" v-model="form.vitals.weight" :disabled="viewOnly || existingVisitMode">
              </div>
              <div class="col-md-4">
                <label class="form-label">Height (cm)</label>
                <input type="number" step="0.1" class="form-control" v-model="form.vitals.height" :disabled="viewOnly || existingVisitMode">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Service Options</label>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-primary" @click="openVaccinationModal">Add Vaccine</button>
                <button type="button" class="btn btn-outline-secondary" @click="openDewormModal">Deworm</button>
                <button type="button" class="btn btn-outline-info" @click="openVitAModal">Vitamin A</button>
              </div>
            </div>

            <div class="mb-3" v-if="!recordMode">
              <label class="form-label">Findings (auto-filled after interventions)</label>
              <textarea class="form-control" rows="3" v-model="form.findings" readonly></textarea>
            </div>

            <div class="mb-3" v-if="!recordMode">
              <label class="form-label">Service Rendered (auto-filled)</label>
              <textarea class="form-control" rows="3" v-model="form.service_rendered" readonly></textarea>
            </div>

            <!-- Collected Vaccinations Display (with edit/remove in modal) -->
            <div v-if="localCollectedVaccinations && localCollectedVaccinations.length > 0" class="mb-3">
              <label class="form-label">Vaccines to be Administered During Visit</label>
              <div class="border rounded p-2 bg-light">
                <div v-for="(vacc, index) in localCollectedVaccinations" :key="index" class="d-flex justify-content-between align-items-center mb-1 p-2 border rounded">
                  <div class="flex-grow-1">
                    <strong>{{ vacc.vaccine_name || vacc.vaccineName || vacc.antigen_name || 'Unknown Vaccine' }}</strong>
                    <br>
                    <small class="text-muted">
                      Date: {{ formatDate(vacc.administered_date) }} |
                      Dose: {{ vacc.dose_number || 'N/A' }} |
                      Outside Transaction: {{ vacc.outside ? 'Yes' : 'No' }}
                    </small>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-info me-2">Will be saved with visit</span>
                    <div v-if="!viewOnly" class="d-flex gap-1">
                      <button type="button" class="btn btn-sm btn-outline-primary" @click="editService(index)" title="Edit">
                        <i class="bi bi-pencil"></i>
                        <span class="ms-1">Edit</span>
                      </button>
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="removeService(index)" title="Remove">
                        <i class="bi bi-trash"></i>
                        <span class="ms-1">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <small class="text-muted">These vaccines will be administered and recorded when you save the visit.</small>
            </div>

            <div class="text-end">
              <button type="button" class="btn btn-secondary me-2" @click="$emit('close')">Cancel</button>
              <button v-if="!viewOnly" type="submit" class="btn btn-primary" :disabled="isSaveDisabled">{{ existingVisitMode ? 'Add Services' : (recordMode ? 'Save Record' : 'Save Visit') }}</button>
              <button v-else type="button" class="btn btn-primary" @click="$emit('close')">Close</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="card shadow-sm mb-3">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h6 class="mb-0">{{ recordMode ? 'Add Patient Record' : 'Add Patient Visit / Record' }}</h6>
      <button type="button" class="btn-close" @click="$emit('close')"></button>
    </div>
    <div class="card-body">
      <form @submit.prevent="saveVisit">
        <div class="mb-3">
          <label class="form-label">Patient *</label>
                    <select class="form-select" v-model="form.patient_id" :disabled="lockPatientEffective || viewOnly || existingVisitMode" required>
            <option value="">Select patient</option>
            <option v-for="p in patients" :key="p.id" :value="p.id">{{ p.childInfo.name }}</option>
          </select>
        </div>

        <div class="mb-3" v-if="!recordMode">
          <label class="form-label">Health Staff (BHS) *</label>
          <select class="form-select" v-model="form.recorded_by" :disabled="viewOnly || existingVisitMode" required>
            <option value="">Select health worker</option>
            <option v-for="hw in healthWorkers" :key="hw.user_id" :value="hw.user_id">{{ hw.fullname || hw.name }}</option>
          </select>
        </div>

        <h6 class="mb-2">Vital Signs</h6>
        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <label class="form-label">Temperature (°C)</label>
            <input type="number" step="0.1" class="form-control" v-model="form.vitals.temperature" :disabled="viewOnly || existingVisitMode">
          </div>
          <div class="col-md-4">
            <label class="form-label">MUAC (cm)</label>
            <input type="number" step="0.1" class="form-control" v-model="form.vitals.muac" :disabled="viewOnly || existingVisitMode">
          </div>
          <div class="col-md-4">
            <label class="form-label">Respiration (breaths/min)</label>
            <input type="number" class="form-control" v-model="form.vitals.respiration" :disabled="viewOnly || existingVisitMode">
          </div>
          <div class="col-md-4">
            <label class="form-label">Weight (kg)</label>
            <input type="number" step="0.01" class="form-control" v-model="form.vitals.weight" :disabled="viewOnly || existingVisitMode">
          </div>
          <div class="col-md-4">
            <label class="form-label">Height (cm)</label>
            <input type="number" step="0.1" class="form-control" v-model="form.vitals.height" :disabled="viewOnly || existingVisitMode">
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Service Options</label>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-primary" @click="openVaccinationModal">Add Vaccine</button>
            <button type="button" class="btn btn-outline-secondary" @click="openDewormModal">Deworm</button>
            <button type="button" class="btn btn-outline-info" @click="openVitAModal">Vitamin A</button>
          </div>
        </div>

        <div class="mb-3" v-if="!recordMode">
          <label class="form-label">Findings</label>
          <textarea class="form-control" rows="3" v-model="form.findings" :readonly="viewOnly || existingVisitMode" placeholder="Enter clinical findings..."></textarea>
          <small class="text-muted">Auto-filled when services are added, but can be edited</small>
        </div>

        <div class="mb-3" v-if="!recordMode">
          <label class="form-label">Service Rendered</label>
          <textarea class="form-control" rows="3" v-model="form.service_rendered" :readonly="viewOnly || existingVisitMode" placeholder="Describe services rendered..."></textarea>
          <small class="text-muted">Auto-filled when services are added, but can be edited</small>
        </div>

        <!-- Editable Services Section -->
  <div v-if="localCollectedVaccinations && localCollectedVaccinations.length > 0" class="mb-3">
          <label class="form-label">Services to be Administered During Visit</label>
          <div class="border rounded p-3 bg-light">
            <div v-for="(vacc, index) in localCollectedVaccinations" :key="index" class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
              <div class="flex-grow-1">
                <strong>{{ vacc.vaccine_name || vacc.vaccineName || vacc.antigen_name || 'Unknown Vaccine' }}</strong>
                <br>
                <small class="text-muted">
                  Date: {{ formatDate(vacc.administered_date) }} |
                  Dose: {{ vacc.dose_number || 'N/A' }} |
                  Outside Transaction: {{ vacc.outside ? 'Yes' : 'No' }}
                </small>
              </div>
              <div class="d-flex gap-1" v-if="!viewOnly">
                <button type="button" class="btn btn-sm btn-outline-primary" @click="editService(index)" title="Edit">
                  <i class="bi bi-pencil"></i>
                  <span class="ms-1">Edit</span>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" @click="removeService(index)" title="Remove">
                  <i class="bi bi-trash"></i>
                  <span class="ms-1">Remove</span>
                </button>
              </div>
            </div>
          </div>
          <small class="text-muted">These services will be administered and recorded when you save the visit. You can edit or remove them before saving.</small>
        </div>

        <div class="text-end">
          <button type="button" class="btn btn-secondary me-2" @click="$emit('close')">Cancel</button>
          <button v-if="!viewOnly" type="submit" class="btn btn-primary" :disabled="isSaveDisabled">{{ existingVisitMode ? 'Add Services' : (recordMode ? 'Save Record' : 'Save Visit') }}</button>
          <button v-else type="button" class="btn btn-primary" @click="$emit('close')">Close</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Add Vaccination Modal -->
  <div class="modal fade" :class="{ show: showVaccinationModal }" :style="{ display: showVaccinationModal ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-plus-circle me-2"></i>
            {{ recordMode ? 'Add Vaccine to Record' : 'Add Vaccine to Visit' }}
          </h5>
          <button type="button" class="btn-close" @click="closeVaccinationModal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveVaccination">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Vaccine *</label>
                  <!-- In-facility (inside): choose from inventory stocks -->
                  <div class="d-flex align-items-center mb-2">
                    <div class="form-check form-switch ms-auto">
                      <input class="form-check-input" type="checkbox" id="nipOnlyToggle" v-model="showNipOnly" @change="onNipToggle">
                      <label class="form-check-label small" for="nipOnlyToggle">Filter NIP only</label>
                    </div>
                  </div>
                  <select v-if="!recordMode" class="form-select" v-model="vaccinationForm.inventoryId" @change="onVaccineSelect" required>
                  <option value="">Select a vaccine stock</option>
                  <option v-for="v in vaccineOptions" :key="v.inventory_id" :value="v.inventory_id">
                    {{ v.display_name }}
                  </option>
                </select>
                <!-- Outside: choose vaccine from catalog (no inventory) -->
                <select v-else class="form-select" v-model="vaccinationForm.vaccineId" @change="onVaccineCatalogSelect" required>
                  <option value="">Select a vaccine</option>
                  <option v-for="v in vaccineCatalog" :key="v.vaccine_id" :value="v.vaccine_id">
                    {{ v.antigen_name }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Disease Prevented</label>
                <input type="text" class="form-control" v-model="vaccinationForm.diseasePrevented" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Dose Number *</label>
                <select class="form-select" v-model="vaccinationForm.doseNumber" required>
                  <option value="">Select dose</option>
                  <option v-for="dose in availableDoses" :key="dose" :value="dose">
                    Dose {{ dose }}
                  </option>
                </select>
                <div v-if="autoSelectHint" class="form-text text-success">{{ autoSelectHint }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Date Administered *</label>
                <input type="date" class="form-control" v-model="vaccinationForm.dateAdministered" required @change="updateAgeCalculation">
              </div>
              <div class="col-md-6">
                <label class="form-label">Age at Administration</label>
                <input type="text" class="form-control" v-model="vaccinationForm.ageAtAdministration" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Manufacturer</label>
                <input type="text" class="form-control" v-model="vaccinationForm.vaccineManufacturer" :readonly="!recordMode">
              </div>
              <div class="col-md-6">
                <label class="form-label">Lot Number</label>
                <input type="text" class="form-control" v-model="vaccinationForm.lotNumber" :readonly="!recordMode">
              </div>
              <div class="col-md-6">
                <label class="form-label">Site of Administration</label>
                <select class="form-select" v-model="vaccinationForm.siteOfAdministration">
                  <option value="">Select a site</option>
                  <option value="Left arm (deltoid)">Left arm (deltoid)</option>
                  <option value="Right arm (deltoid)">Right arm (deltoid)</option>
                  <option value="Left thigh (anterolateral)">Left thigh (anterolateral)</option>
                  <option value="Right thigh (anterolateral)">Right thigh (anterolateral)</option>
                  <option value="Oral">Oral</option>
                </select>
              </div>
              <div class="col-md-6" v-if="!recordMode">
                <label class="form-label">Health Staff *</label>
                <select class="form-select" v-model="vaccinationForm.healthWorkerId" required>
                  <option value="">Select health staff</option>
                  <option v-for="nurse in nurses" :key="nurse.user_id || nurse.id" :value="nurse.user_id || nurse.id">
                    {{ nurse.fullname }} ({{ nurse.hs_type || nurse.hw_type || nurse.role || nurse.type }})
                  </option>
                  <option v-if="nurses.length === 0" disabled>No nurses/nutritionists available</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Facility Name</label>
                <input type="text" class="form-control" v-model="vaccinationForm.facilityName">
              </div>
              <div class="col-md-6">
                <label class="form-label">Remarks</label>
                <input type="text" class="form-control" v-model="vaccinationForm.remarks" :placeholder="recordMode ? 'Hint: include the person who administered the vaccine' : ''">
              </div>
            </div>
            <div class="text-end mt-3">
              <button type="button" class="btn btn-secondary me-2" @click="closeVaccinationModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="savingVaccination">
                <span v-if="savingVaccination" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ savingVaccination ? 'Adding...' : (recordMode ? 'Add to Record' : 'Add to Visit') }}
              </button>
            </div>
            
            <!-- Debug info -->
            <div v-if="false" class="mt-3 p-2 bg-light border rounded">
              <small class="text-muted">Debug: {{ nurses.length }} nurses/nutritionists available</small>
              <pre class="small">{{ JSON.stringify(nurses, null, 2) }}</pre>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Backdrop -->
  <div v-if="showVaccinationModal" class="modal-backdrop fade show" @click="closeVaccinationModal"></div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { getCurrentPHDate, utcToPH } from '@/utils/dateUtils'

const { addToast } = useToast()
const { confirm } = useConfirm()

const props = defineProps({
  show: { type: Boolean, default: false },
  collectedVaccinations: { type: Array, default: () => [] },
  // Optional: preselect a patient and lock the selector for in-facility flow
  initialPatientId: { type: [String, Number], default: '' },
  lockPatient: { type: Boolean, default: false },
  // When true, hide unneeded fields and save as a simple record
  recordMode: { type: Boolean, default: false },
  // Render as embedded card instead of modal
  embedded: { type: Boolean, default: false },
  // View-only mode for existing visit: fields disabled; service buttons still active
  viewMode: { type: Boolean, default: false },
  // Existing visit id to load in viewMode and to post immunizations to
  existingVisitId: { type: [String, Number], default: '' }
})
const emit = defineEmits(['close', 'saved', 'open-vaccination', 'open-deworm', 'open-vita', 'update-collected-vaccinations'])

// Derived flags
const viewOnly = computed(() => !!props.viewMode)
const existingVisitMode = computed(() => !!props.existingVisitId)
const lockPatientEffective = computed(() => props.lockPatient || !!props.existingVisitId)

const patients = ref([])
const patientSearch = ref('')
const healthWorkers = ref([]) // BHW for visit recording
const nurses = ref([]) // Nurses for vaccination administration
const loading = ref(false)
const selectedPatientData = ref(null)
const showVaccinationModal = ref(false)
const savingVaccination = ref(false)
const vaccineOptions = ref([])
const vaccineCatalog = ref([])
const showNipOnly = ref(false)
const availableDoses = ref([1, 2, 3, 4, 5]) // Default doses, can be made dynamic later
const autoSelectHint = ref('')

// Use computed to get collected vaccinations from props (prop is an Array, not a ref)
// Local buffer so additions show immediately even if parent doesn't two-way bind
const localCollectedVaccinations = ref(Array.isArray(props.collectedVaccinations) ? [...props.collectedVaccinations] : [])

// Keep local buffer in sync with parent prop
watch(() => props.collectedVaccinations, (newVal) => {
  if (Array.isArray(newVal)) {
    localCollectedVaccinations.value = [...newVal]
  } else {
    localCollectedVaccinations.value = []
  }
}, { deep: true })

const isSaveDisabled = computed(() => existingVisitMode.value && (!localCollectedVaccinations.value || localCollectedVaccinations.value.length === 0))

// Auto-fill findings and service_rendered based on collected services
const autoFilledFindings = computed(() => {
  if (!localCollectedVaccinations.value || localCollectedVaccinations.value.length === 0) return ''
  
  const services = localCollectedVaccinations.value
  const vaccineCount = services.filter(s => s.inventory_id || s.vaccine_id).length
  const dewormingCount = services.filter(s => s.deworming_type).length
  const vitaminACount = services.filter(s => s.vitamin_a_type).length
  
  let findings = []
  if (vaccineCount > 0) findings.push(`${vaccineCount} vaccine${vaccineCount > 1 ? 's' : ''} administered`)
  if (dewormingCount > 0) findings.push(`${dewormingCount} deworming treatment${dewormingCount > 1 ? 's' : ''} given`)
  if (vitaminACount > 0) findings.push(`${vitaminACount} vitamin A supplement${vitaminACount > 1 ? 's' : ''} provided`)
  
  return findings.join(', ')
})

const autoFilledServiceRendered = computed(() => {
  if (!localCollectedVaccinations.value || localCollectedVaccinations.value.length === 0) return ''
  
  const services = localCollectedVaccinations.value
  const vaccineCount = services.filter(s => s.inventory_id || s.vaccine_id).length
  const dewormingCount = services.filter(s => s.deworming_type).length
  const vitaminACount = services.filter(s => s.vitamin_a_type).length
  
  let servicesRendered = []
  if (vaccineCount > 0) servicesRendered.push(`Vaccination (${vaccineCount} dose${vaccineCount > 1 ? 's' : ''})`)
  if (dewormingCount > 0) servicesRendered.push(`Deworming (${dewormingCount} treatment${dewormingCount > 1 ? 's' : ''})`)
  if (vitaminACount > 0) servicesRendered.push(`Vitamin A supplementation (${vitaminACount} dose${vitaminACount > 1 ? 's' : ''})`)
  
  return servicesRendered.join(', ')
})

const form = ref({
  patient_id: '',
  recorded_by: '',
  visit_date: getCurrentPHDate(),
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

const vaccinationForm = ref({
  inventoryId: '',
  vaccineId: '',
  vaccineName: '',
  diseasePrevented: '',
  doseNumber: '',
  dateAdministered: getCurrentPHDate(),
  ageAtAdministration: '',
  vaccineManufacturer: '',
  lotNumber: '',
  siteOfAdministration: '',
  healthWorkerId: '',
  facilityName: '',
  remarks: ''
})

const fetchPatients = async () => {
  try {
    const params = {}
    // For dropdowns, fetch a larger page of results; allow server-side search
    params.limit = 100
    if (patientSearch.value && patientSearch.value.trim() !== '') params.search = patientSearch.value.trim()
    const res = await api.get('/patients', { params })
    const payload = res.data?.data || {}
    const list = payload.patients || payload.items || payload || []
    patients.value = list.map(p => ({ id: p.patient_id || p.id, childInfo: { name: [p.firstname, p.middlename, p.surname].filter(Boolean).join(' ').trim() } }))
  } catch (err) {
    console.error('Failed to load patients for visit editor', err)
    patients.value = []
  }
}

const onPatientSearchInput = () => {
  // debounce can be added later; for now fetch on input
  fetchPatients()
}

const clearPatientSearch = () => {
  patientSearch.value = ''
  fetchPatients()
}

const fetchHealthWorkers = async () => {
  try {
    console.log('🔄 [VisitEditor] Fetching health staff...')
    const res = await api.get('/health-staff')
    console.log('✅ [VisitEditor] Health workers API response:', res.data)
    
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
    
    console.log('👥 [VisitEditor] Health workers list:', list)
    
    // Role helpers
    const rawRole = (hw) => String(hw.hs_type || hw.hw_type || hw.role || hw.type || '').toLowerCase()
    const isHealthStaffRole = (r) => {
      const s = r.toLowerCase()
      return [
        'bhs',
        'barangay health staff',
        'barangay health worker',
        'health staff',
        'health worker'
      ].some(k => s.includes(k))
    }
    const isNurseOrNutritionistRole = (r) => {
      const s = r.toLowerCase()
      return s.includes('nurse') || s.includes('rn') || s.includes('nutritionist') || s.includes('dietitian') || s.includes('nd')
    }
    const displayRole = (r) => {
      if (isNurseOrNutritionistRole(r)) {
        return r.includes('nutrition') || r.includes('diet') ? 'Nutritionist' : 'Nurse'
      }
      if (isHealthStaffRole(r)) return 'Health Staff'
      return r || 'Health Staff'
    }

    // For visit form (recorded_by): show Health Staff roles
    healthWorkers.value = list
      .filter(hw => isHealthStaffRole(rawRole(hw)))
      .map(hw => ({
        user_id: hw.user_id || hw.id || hw.health_worker_id,
        fullname: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
        hs_type: displayRole(rawRole(hw))
      }))
    
    // For vaccination form (administered_by): show Nurses and Nutritionists
    nurses.value = list
      .filter(hw => isNurseOrNutritionistRole(rawRole(hw)))
      .map(hw => ({
        user_id: hw.user_id || hw.id || hw.health_worker_id,
        fullname: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
        hs_type: displayRole(rawRole(hw))
      }))
    
    console.log('🎯 [VisitEditor] Processed Health Staff for visit recording:', healthWorkers.value)
    console.log('🎯 [VisitEditor] Processed nurses/nutritionists for vaccination:', nurses.value)
    console.log('🔍 [VisitEditor] Available HS types in data:', [...new Set(list.map(hw => hw.hs_type || hw.hw_type || hw.role || hw.type))])
  } catch (err) {
    console.error('❌ [VisitEditor] Failed to load health workers:', err)
    healthWorkers.value = []
    nurses.value = []
  }
}

const fetchVaccineOptions = async () => {
  try {
    console.log('🔄 [VisitEditor] Fetching vaccine options...')
    const params = {}
    if (showNipOnly.value) params.is_nip = true
    const res = await api.get('/vaccines/inventory', { params })
    console.log('✅ [VisitEditor] Vaccine inventory API response:', res.data)
    const payload = res.data?.data || []
    console.log('💉 [VisitEditor] Vaccine inventory list:', payload)
    vaccineOptions.value = payload.map(v => ({
      inventory_id: v.inventory_id || v.id,
      vaccine_id: v.vaccine_id,
      display_name: `${v.vaccinemaster?.antigen_name || 'Unknown'} (${v.vaccinemaster?.disease_prevented || 'Unknown'}) - Lot: ${v.lot_number || 'N/A'} - Exp: ${v.expiration_date ? formatDate(v.expiration_date) : 'N/A'}`,
      vaccine_name: v.vaccinemaster?.antigen_name || 'Unknown',
      disease_prevented: v.vaccinemaster?.disease_prevented || 'Unknown',
      manufacturer: v.vaccinemaster?.manufacturer || 'Unknown',
      lot_number: v.lot_number,
      expiration_date: v.expiration_date
    }))
    console.log('🎯 [VisitEditor] Processed vaccine options:', vaccineOptions.value)
  } catch (err) {
    console.error('❌ [VisitEditor] Failed to load vaccine options:', err)
    vaccineOptions.value = []
  }
}

const fetchVaccineCatalog = async () => {
  try {
    const params = {}
    if (showNipOnly.value) params.is_nip = true
    const res = await api.get('/vaccines', { params })
    // Backend returns { success: true, data: { vaccines, totalCount, ... } }
    const payload = res.data?.data
    console.log('✅ [VisitEditor] Vaccine catalog API response:', res.data)
    const list = Array.isArray(payload?.vaccines)
      ? payload.vaccines
      : (Array.isArray(res.data?.vaccines) ? res.data.vaccines : (Array.isArray(res.data) ? res.data : []))
    vaccineCatalog.value = list.map(v => ({
      vaccine_id: v.vaccine_id || v.id,
      antigen_name: v.antigen_name || v.name || 'Unknown',
      disease_prevented: v.disease_prevented || '',
      manufacturer: v.manufacturer || ''
    }))
  } catch (e) {
    console.error('❌ [VisitEditor] Failed to load vaccine catalog:', e)
    vaccineCatalog.value = []
  }
}

// When NIP filter toggles, refresh the appropriate source (inventory for in-facility, catalog for recordMode)
const onNipToggle = () => {
  if (props.recordMode) {
    fetchVaccineCatalog()
  } else {
    fetchVaccineOptions()
  }
}

const fetchSelectedPatientData = async (patientId) => {
  console.log('🚀 [VISIT_EDITOR] Starting to fetch patient data for ID:', patientId)
  if (!patientId) {
    console.log('❌ [VISIT_EDITOR] No patient ID provided, clearing selected patient data')
    selectedPatientData.value = null
    return
  }
  
  try {
    console.log('📡 [VISIT_EDITOR] Making API call to fetch patient details...')
    const response = await api.get(`/patients/${patientId}`)
    selectedPatientData.value = response.data?.data || null
    console.log('✅ [VISIT_EDITOR] Successfully fetched patient data:', {
      patientId,
      patientName: selectedPatientData.value?.first_name + ' ' + selectedPatientData.value?.last_name,
      dateOfBirth: selectedPatientData.value?.date_of_birth,
      fullData: selectedPatientData.value
    })
  } catch (error) {
    console.error('❌ [VISIT_EDITOR] Error fetching patient details:', {
      patientId,
      error: error.message,
      response: error.response?.data
    })
    selectedPatientData.value = null
  }
}

const openVaccinationModal = async (patientId = null) => {
  const selectedPatientId = patientId || form.value.patient_id
  if (!selectedPatientId || selectedPatientId === '') {
    addToast({ title: 'Error', message: 'Please select a patient first', type: 'error' })
    return
  }
  // Ensure patient details (DOB) are loaded for age calculation
  if (!selectedPatientData.value || !selectedPatientData.value.date_of_birth) {
    try { await fetchSelectedPatientData(selectedPatientId) } catch {}
  }
  
  // Reset vaccination form
  vaccinationForm.value = {
    inventoryId: '',
    vaccineId: '',
    vaccineName: '',
    diseasePrevented: '',
    doseNumber: '',
    dateAdministered: getCurrentPHDate(),
    ageAtAdministration: '',
    vaccineManufacturer: '',
    lotNumber: '',
    siteOfAdministration: '',
    healthWorkerId: '',
    facilityName: '',
    remarks: ''
  }
  
  // Calculate age immediately with default date
  updateAgeCalculation()
  
  showVaccinationModal.value = true
}
const openDewormModal = (patientId = null) => {
  const selectedPatientId = patientId || form.value.patient_id
  if (!selectedPatientId || selectedPatientId === '') {
    addToast({ title: 'Error', message: 'Please select a patient first', type: 'error' })
    return
  }
  emit('open-deworm', selectedPatientId, selectedPatientData.value, { outside: !!props.recordMode })
}
const openVitAModal = (patientId = null) => {
  const selectedPatientId = patientId || form.value.patient_id
  if (!selectedPatientId || selectedPatientId === '') {
    addToast({ title: 'Error', message: 'Please select a patient first', type: 'error' })
    return
  }
  emit('open-vita', selectedPatientId, selectedPatientData.value, { outside: !!props.recordMode })
}

const onVaccineSelect = async () => {
  if (!vaccinationForm.value.inventoryId) {
    vaccinationForm.value.diseasePrevented = ''
    vaccinationForm.value.doseNumber = ''
    vaccinationForm.value.vaccineManufacturer = ''
    vaccinationForm.value.lotNumber = ''
    vaccinationForm.value.vaccineName = ''
    availableDoses.value = [1,2,3,4,5]
    autoSelectHint.value = ''
    return
  }

  // Get vaccine data from already loaded vaccineOptions
  const selectedVaccine = vaccineOptions.value.find(v => v.inventory_id === vaccinationForm.value.inventoryId)
  if (selectedVaccine) {
    vaccinationForm.value.vaccineName = selectedVaccine.vaccine_name || ''
    vaccinationForm.value.diseasePrevented = selectedVaccine.disease_prevented || ''
    vaccinationForm.value.vaccineManufacturer = selectedVaccine.manufacturer || ''
    vaccinationForm.value.lotNumber = selectedVaccine.lot_number || ''
    console.log('Auto-filled vaccine data:', {
      vaccineName: vaccinationForm.value.vaccineName,
      diseasePrevented: vaccinationForm.value.diseasePrevented,
      manufacturer: vaccinationForm.value.vaccineManufacturer,
      lotNumber: vaccinationForm.value.lotNumber
    })
  } else {
    console.warn('Selected vaccine not found in options')
  }
  updateAgeCalculation()

  // Smart dose options: call patient smart-doses endpoint if patient is selected
  try {
    if (form.value.patient_id) {
      const res = await api.get(`/patients/${form.value.patient_id}/smart-doses`, { params: { vaccine_id: selectedVaccine?.vaccine_id } })
      const data = res.data?.data || res.data || {}
      const doses = Array.isArray(data.available_doses) ? data.available_doses : (Array.isArray(data.doses) ? data.doses : [])
      availableDoses.value = doses.length > 0 ? doses : [1,2,3,4,5]
      if (data.auto_select) {
        vaccinationForm.value.doseNumber = data.auto_select
        autoSelectHint.value = `Auto-selected Dose ${data.auto_select} based on schedule`
      } else if (doses.length === 1) {
        vaccinationForm.value.doseNumber = doses[0]
        autoSelectHint.value = `Auto-selected Dose ${doses[0]} (only remaining)`
      } else {
        autoSelectHint.value = ''
      }
    }
  } catch (e) {
    console.warn('Smart dose lookup failed', e)
    availableDoses.value = [1,2,3,4,5]
    autoSelectHint.value = ''
  }
}

const onVaccineCatalogSelect = async () => {
  const vid = vaccinationForm.value.vaccineId
  if (!vid) {
    vaccinationForm.value.diseasePrevented = ''
    vaccinationForm.value.vaccineManufacturer = ''
    vaccinationForm.value.vaccineName = ''
    availableDoses.value = [1,2,3,4,5]
    autoSelectHint.value = ''
    return
  }
  const v = (vaccineCatalog.value || []).find(x => x.vaccine_id === vid)
  if (v) {
    vaccinationForm.value.vaccineName = v.antigen_name || ''
    vaccinationForm.value.diseasePrevented = v.disease_prevented || ''
    vaccinationForm.value.vaccineManufacturer = v.manufacturer || ''
    vaccinationForm.value.lotNumber = ''
  }
  updateAgeCalculation()

  try {
    if (form.value.patient_id) {
      const res = await api.get(`/patients/${form.value.patient_id}/smart-doses`, { params: { vaccine_id: vaccinationForm.value.vaccineId } })
      const data = res.data?.data || res.data || {}
      const doses = Array.isArray(data.available_doses) ? data.available_doses : (Array.isArray(data.doses) ? data.doses : [])
      availableDoses.value = doses.length > 0 ? doses : [1,2,3,4,5]
      if (data.auto_select) {
        vaccinationForm.value.doseNumber = data.auto_select
        autoSelectHint.value = `Auto-selected Dose ${data.auto_select} based on schedule`
      } else if (doses.length === 1) {
        vaccinationForm.value.doseNumber = doses[0]
        autoSelectHint.value = `Auto-selected Dose ${doses[0]} (only remaining)`
      } else {
        autoSelectHint.value = ''
      }
    }
  } catch (e) {
    availableDoses.value = [1,2,3,4,5]
    autoSelectHint.value = ''
  }
}

const saveVaccination = async () => {
  try {
    savingVaccination.value = true

    // For outside mode, concatenate all additional info into remarks
    let fullRemarks = vaccinationForm.value.remarks || ''
    if (vaccinationForm.value.vaccineManufacturer) {
      fullRemarks = fullRemarks ? `${fullRemarks} | Manufacturer: ${vaccinationForm.value.vaccineManufacturer}` : `Manufacturer: ${vaccinationForm.value.vaccineManufacturer}`
    }
    if (vaccinationForm.value.lotNumber) {
      fullRemarks = fullRemarks ? `${fullRemarks} | Lot: ${vaccinationForm.value.lotNumber}` : `Lot: ${vaccinationForm.value.lotNumber}`
    }
    if (vaccinationForm.value.facilityName) {
      fullRemarks = fullRemarks ? `${fullRemarks} | Facility: ${vaccinationForm.value.facilityName}` : `Facility: ${vaccinationForm.value.facilityName}`
    }
    if (vaccinationForm.value.siteOfAdministration) {
      fullRemarks = fullRemarks ? `${fullRemarks} | Site: ${vaccinationForm.value.siteOfAdministration}` : `Site: ${vaccinationForm.value.siteOfAdministration}`
    }

    const vaccinationData = props.recordMode
      ? {
          patient_id: form.value.patient_id,
          vaccine_id: vaccinationForm.value.vaccineId,
          disease_prevented: vaccinationForm.value.diseasePrevented,
          dose_number: vaccinationForm.value.doseNumber,
          administered_date: vaccinationForm.value.dateAdministered,
          age_at_administration: vaccinationForm.value.ageAtAdministration,
          administered_by: vaccinationForm.value.healthWorkerId,
          remarks: fullRemarks,
          outside: true,
          vaccine_name: vaccinationForm.value.vaccineName
        }
      : {
          patient_id: form.value.patient_id,
          inventory_id: vaccinationForm.value.inventoryId,
          disease_prevented: vaccinationForm.value.diseasePrevented,
          dose_number: vaccinationForm.value.doseNumber,
          administered_date: vaccinationForm.value.dateAdministered,
          age_at_administration: vaccinationForm.value.ageAtAdministration,
          administered_by: vaccinationForm.value.healthWorkerId,
          facility_name: vaccinationForm.value.facilityName,
          vaccine_name: vaccinationForm.value.vaccineName,
          remarks: vaccinationForm.value.siteOfAdministration 
            ? `${vaccinationForm.value.remarks || ''} (Site: ${vaccinationForm.value.siteOfAdministration})`.trim()
            : vaccinationForm.value.remarks || ''
        }

    if (viewOnly.value && props.existingVisitId) {
      const payload = { ...vaccinationData, visit_id: props.existingVisitId }
      console.log('🔄 [VISIT_VACCINATION] Posting immunization directly to existing visit:', payload)
      await api.post('/immunizations', payload)
      addToast({ title: 'Saved', message: 'Immunization added to visit', type: 'success' })
      closeVaccinationModal()
    } else {
      console.log('🔄 [VISIT_VACCINATION] Adding vaccination to visit collection:', vaccinationData)
      // Add to collected vaccinations (will be saved with visit)
  const collectedVaccinationsArray = [...localCollectedVaccinations.value]

      // Check if we're editing an existing service
      if (vaccinationForm.value.editingIndex !== undefined) {
        // Update existing service
        collectedVaccinationsArray[vaccinationForm.value.editingIndex] = vaccinationData
        console.log('🔄 [VISIT_VACCINATION] Updated service at index:', vaccinationForm.value.editingIndex)
        addToast({ title: 'Success', message: 'Service updated successfully.', type: 'success' })
      } else {
        // Add new service
        collectedVaccinationsArray.push(vaccinationData)
        console.log('🔄 [VISIT_VACCINATION] New collectedVaccinationsArray:', collectedVaccinationsArray)
        addToast({ title: 'Success', message: 'Vaccine added to visit. Will be administered when you save the visit.', type: 'success' })
      }

  // Update local buffer and emit to parent
  localCollectedVaccinations.value = collectedVaccinationsArray
  emit('update-collected-vaccinations', collectedVaccinationsArray)
      closeVaccinationModal()
    }
  } catch (err) {
    console.error('❌ [VISIT_VACCINATION] Error saving vaccination', err)
    addToast({ title: 'Error', message: 'Failed to administer vaccine', type: 'error' })
  } finally {
    savingVaccination.value = false
  }
}

const updateAgeCalculation = () => {
  if (selectedPatientData.value?.date_of_birth && vaccinationForm.value.dateAdministered) {
    vaccinationForm.value.ageAtAdministration = calculateAgeAtDate(
      selectedPatientData.value.date_of_birth, 
      vaccinationForm.value.dateAdministered
    )
  }
}

const closeVaccinationModal = () => {
  showVaccinationModal.value = false
  // Reset form when closing
  vaccinationForm.value = {
    inventoryId: '',
    vaccineName: '',
    diseasePrevented: '',
    doseNumber: '',
    dateAdministered: getCurrentPHDate(),
    ageAtAdministration: '',
    vaccineManufacturer: '',
    lotNumber: '',
    siteOfAdministration: '',
    healthWorkerId: '',
    facilityName: '',
    remarks: '',
    editingIndex: undefined // Clear editing state
  }
}

const editService = (index) => {
  const service = localCollectedVaccinations.value[index]
  if (!service) return

  // Populate vaccination form with service data for editing
  vaccinationForm.value = {
    inventoryId: service.inventory_id || '',
    vaccineId: service.vaccine_id || '',
    vaccineName: service.vaccine_name || '',
    diseasePrevented: service.disease_prevented || '',
    doseNumber: service.dose_number || '',
    dateAdministered: service.administered_date || getCurrentPHDate(),
    ageAtAdministration: service.age_at_administration || '',
    vaccineManufacturer: service.vaccine_manufacturer || '',
    lotNumber: service.lot_number || '',
    siteOfAdministration: service.site_of_administration || '',
    healthWorkerId: service.administered_by || '',
    facilityName: service.facility_name || '',
    remarks: service.remarks || ''
  }

  // Open modal for editing
  showVaccinationModal.value = true

  // Store the index being edited for later update
  vaccinationForm.value.editingIndex = index
}

const removeService = async (index) => {
  try {
    await confirm({
      title: 'Remove Service',
      message: 'Are you sure you want to remove this service from the visit?',
      variant: 'warning',
      confirmText: 'Remove',
      cancelText: 'Cancel'
    })
    
  const collectedVaccinationsArray = [...localCollectedVaccinations.value]
    collectedVaccinationsArray.splice(index, 1)
  localCollectedVaccinations.value = collectedVaccinationsArray
  emit('update-collected-vaccinations', collectedVaccinationsArray)
    addToast({ title: 'Removed', message: 'Service removed from visit', type: 'info' })
  } catch {
    // User cancelled
  }
}

const saveVisit = async () => {
  if (viewOnly.value) {
    addToast({ title: 'View Mode', message: 'Visit fields are read-only. Use service buttons to add records.', type: 'info' })
    return
  }
  try {
    loading.value = true

  console.log('🔄 [VISIT_SAVE_FRONTEND] collectedVaccinations before save:', localCollectedVaccinations.value)

    // In full visit mode: If vaccines are queued, require at least one vital sign
    if (!props.recordMode && localCollectedVaccinations.value && localCollectedVaccinations.value.length > 0) {
      const v = form.value.vitals || {}
      const vitalsProvided = [v.temperature, v.muac, v.respiration, v.weight, v.height].some(x => x !== '' && x !== null && typeof x !== 'undefined')
      if (!vitalsProvided) {
        addToast({ title: 'Validation', message: 'Please enter at least one vital sign when recording vaccinations in-facility.', type: 'error' })
        loading.value = false
        return
      }
    }

    // If adding to existing visit, save services directly
    if (props.existingVisitId) {
      if (!localCollectedVaccinations.value || localCollectedVaccinations.value.length === 0) {
        addToast({ title: 'No Services', message: 'Please add at least one service to save.', type: 'warning' })
        loading.value = false
        return
      }
      console.log('🔄 [VISIT_SAVE_FRONTEND] Adding services to existing visit:', props.existingVisitId)

      // Get current visit to append services
      const currentVisit = await api.get(`/visits/${props.existingVisitId}`)
      const visitData = currentVisit.data?.data || currentVisit.data || {}

      // Build additional service_rendered and findings from collected vaccinations
      let additionalServiceRendered = []
      let additionalFindings = []

  if (localCollectedVaccinations.value.length > 0) {
        additionalServiceRendered.push('Vaccine Administration')
        for (const vacc of localCollectedVaccinations.value) {
          if (vacc.remarks) {
            additionalFindings.push(`Vaccine Administration -- ${vacc.remarks}`)
          }
        }
      }

      // Append to existing
      const updatedServiceRendered = [visitData.service_rendered, ...additionalServiceRendered].filter(Boolean).join(', ')
      const updatedFindings = [visitData.findings, ...additionalFindings].filter(Boolean).join(', ')

      // Update the visit
      await api.put(`/visits/${props.existingVisitId}`, {
        service_rendered: updatedServiceRendered,
        findings: updatedFindings,
        updated_by: form.value.recorded_by
      })

      // Post each collected vaccination as immunization
  const promises = localCollectedVaccinations.value.map(vacc => 
        api.post('/immunizations', {
          ...vacc,
          visit_id: props.existingVisitId,
          patient_id: form.value.patient_id
        })
      )
      await Promise.all(promises)
      console.log('✅ [VISIT_SAVE_FRONTEND] Services added to existing visit successfully')
      addToast({ title: 'Saved', message: 'Services added to visit successfully', type: 'success' })
      emit('saved')
      emit('close')
      return
    }

    // Prepare the visit payload with collected vaccinations and services
    const visitPayload = {
      ...form.value,
      // In recordMode, omit findings/service_rendered and recorded_by if empty
      ...(props.recordMode ? { recorded_by: form.value.recorded_by || undefined, findings: undefined, service_rendered: undefined, vitals: form.value.vitals || {} } : {}),
  collectedVaccinations: localCollectedVaccinations.value || [],
      services: [] // Add services array for future use (deworming, etc.)
    }

    console.log('🔄 [VISIT_SAVE_FRONTEND] Preparing to save visit with payload:', visitPayload)

    // Save the visit (this will handle all related data atomically)
    const visitResponse = await api.post('/visits', visitPayload)
    const visitData = visitResponse.data
    console.log('✅ [VISIT_SAVE_FRONTEND] Visit created successfully:', visitData)

    addToast({ title: 'Saved', message: 'Visit record created successfully', type: 'success' })
    emit('saved')
    emit('close')
  } catch (err) {
    console.error('❌ [VISIT_SAVE_FRONTEND] Error saving visit', err)
    addToast({ title: 'Error', message: 'Failed to save visit', type: 'error' })
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const calculateAgeAtDate = (birthDate, targetDate) => {
  if (!birthDate || !targetDate) return ''
  
  const birth = new Date(birthDate)
  const target = new Date(targetDate)
  
  let years = target.getFullYear() - birth.getFullYear()
  let months = target.getMonth() - birth.getMonth()
  let days = target.getDate() - birth.getDate()
  
  if (days < 0) {
    months--
    const lastMonth = new Date(target.getFullYear(), target.getMonth() - 1, birth.getDate())
    days += Math.round((target - lastMonth) / (1000 * 60 * 60 * 24))
  }
  
  if (months < 0) {
    years--
    months += 12
  }
  
  // Return in months and days format
  if (years === 0) {
    if (months === 0) {
      return `${days} day${days !== 1 ? 's' : ''} old`
    } else {
      return `${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} old`
    }
  } else {
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} old`
  }
}

onMounted(() => {
  console.log('🏁 [VISIT_EDITOR] Component mounted, initializing...')
  fetchPatients()
  fetchHealthWorkers()
  fetchVaccineOptions()
  fetchVaccineCatalog()
  // Note: initialPatientId handling is now done by the watch with immediate: true
})

// Watch for patient selection changes to fetch patient details
watch(() => form.value.patient_id, (newPatientId) => {
  console.log('🔍 [VISIT_EDITOR] Patient selection changed:', {
    newPatientId,
    previousPatientId: form.value.patient_id,
    isValidId: !!newPatientId && newPatientId !== ''
  })
  if (newPatientId) {
    fetchSelectedPatientData(newPatientId)
  } else {
    selectedPatientData.value = null
  }
})

watch(() => props.existingVisitId, (newId) => {
  if (newId) {
    fetchExistingVisit(String(newId))
  }
})

const fetchExistingVisit = async (visitId) => {
  console.log('🔄 [VISIT_EDITOR] Fetching existing visit:', visitId)
  try {
    loading.value = true
    const res = await api.get(`/visits/${visitId}`)
    const data = res.data?.data || res.data || {}
    console.log('✅ [VISIT_EDITOR] Fetched visit data:', data)
    form.value.patient_id = String(data.patient_id || form.value.patient_id || props.initialPatientId || '')
    form.value.recorded_by = String(data.recorded_by || '')
    console.log('✅ [VISIT_EDITOR] Set recorded_by to:', form.value.recorded_by)
    
    // If recorded_by is a name, find the corresponding user_id
    if (data.recorded_by && isNaN(data.recorded_by)) {
      // It's a name, find the health worker
      const hw = healthWorkers.value.find(h => h.fullname === data.recorded_by || h.name === data.recorded_by)
      if (hw) {
        form.value.recorded_by = String(hw.user_id)
        console.log('✅ [VISIT_EDITOR] Matched name to user_id:', form.value.recorded_by)
      } else {
        console.warn('Could not find health worker with name:', data.recorded_by)
      }
    }
    form.value.visit_date = data.visit_date ? utcToPH(data.visit_date).format('YYYY-MM-DD') : form.value.visit_date
    form.value.findings = data.findings || ''
    form.value.service_rendered = data.service_rendered || ''
    
    // Vitals are included in the visit data
    if (data.vitals) {
      form.value.vitals = {
        temperature: data.vitals.temperature ?? '',
        muac: data.vitals.muac ?? '',
        respiration: data.vitals.respiration ?? '',
        weight: data.vitals.weight ?? '',
        height: data.vitals.height ?? ''
      }
    } else {
      // Fetch vitals from separate endpoint
      try {
        const vitalsRes = await api.get(`/vitals/${visitId}`)
        const v = vitalsRes.data?.data || vitalsRes.data || {}
        form.value.vitals = {
          temperature: v.temperature ?? '',
          muac: v.muac ?? '',
          respiration: v.respiration ?? '',
          weight: v.weight ?? '',
          height: v.height ?? ''
        }
        console.log('✅ [VISIT_EDITOR] Fetched vitals:', form.value.vitals)
      } catch (e) {
        console.warn('Failed to fetch vitals for visit', e)
        form.value.vitals = { temperature: '', muac: '', respiration: '', weight: '', height: '' }
      }
    }
    
    if (form.value.patient_id) {
      fetchSelectedPatientData(form.value.patient_id)
    }
    console.log('✅ [VISIT_EDITOR] Form populated with visit data')
    
    // For existing visit mode, prefill vaccination form with visit's health worker
    if (existingVisitMode.value) {
      vaccinationForm.value.healthWorkerId = form.value.recorded_by
    }
  } catch (e) {
    console.warn('❌ [VISIT_EDITOR] Failed to load existing visit details', e)
  } finally {
    loading.value = false
  }
}

// Watch for vaccination date changes to recalculate age
watch(() => vaccinationForm.value.dateAdministered, (newDate) => {
  if (newDate && selectedPatientData.value?.date_of_birth && (vaccinationForm.value.inventoryId || vaccinationForm.value.vaccineId)) {
    vaccinationForm.value.ageAtAdministration = calculateAgeAtDate(
      selectedPatientData.value.date_of_birth, 
      newDate
    )
  }
})

watch(() => vaccinationForm.value.inventoryId, (val) => {
  if (val) updateAgeCalculation()
})
watch(() => vaccinationForm.value.vaccineId, (val) => {
  if (val) updateAgeCalculation()
})

// When switching modes, ensure proper lists are loaded
watch(() => props.recordMode, (isOutside) => {
  if (isOutside) {
    fetchVaccineCatalog()
  } else {
    fetchVaccineOptions()
  }
})

// Watch for collected vaccinations changes to auto-fill findings and service_rendered
watch(() => localCollectedVaccinations.value, (newServices) => {
  if (newServices && newServices.length > 0) {
    // Only auto-fill if fields are empty or contain default values
    if (!form.value.findings || form.value.findings.trim() === '') {
      form.value.findings = autoFilledFindings.value
    }
    if (!form.value.service_rendered || form.value.service_rendered.trim() === '') {
      form.value.service_rendered = autoFilledServiceRendered.value
    }
  }
}, { deep: true })

// Watch for initialPatientId changes to ensure patient options are loaded
watch(() => props.initialPatientId, (newPatientId, oldPatientId) => {
  console.log('🎯 [VISIT_EDITOR] initialPatientId changed:', {
    newPatientId,
    oldPatientId,
    type: typeof newPatientId,
    isValid: !!newPatientId,
    propsInitialPatientId: props.initialPatientId
  })
  if (newPatientId) {
    console.log('🔄 [VISIT_EDITOR] Triggering fetchPatients() due to initialPatientId change')
    fetchPatients()
    console.log('📝 [VISIT_EDITOR] Setting form.patient_id to:', String(newPatientId))
    form.value.patient_id = String(newPatientId)
    fetchSelectedPatientData(newPatientId)
  }
}, { immediate: true })
</script>

<style scoped>
.modal.show { background-color: rgba(0,0,0,0.5); }
</style>
