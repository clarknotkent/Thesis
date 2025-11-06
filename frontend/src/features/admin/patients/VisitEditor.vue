<template>
  <div v-if="!embedded" class="modal fade" :class="{ show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ existingVisitMode ? `Edit Visit for ${patientDisplayName}` : (recordMode ? 'Add Patient Immunization Record' : 'Add Patient Visit / Record') }}</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveVisit">
            <div v-if="viewOnly" class="alert alert-light border mb-3">
              <div><strong>Patient:</strong> {{ patientDisplayName }}</div>
              <div><strong>Visit Date:</strong> {{ formatDate(form.visit_date) }}</div>
              <div v-if="form.findings"><strong>Findings:</strong> {{ form.findings }}</div>
              <div v-if="form.service_rendered"><strong>Service Rendered:</strong> {{ form.service_rendered }}</div>
              <div v-if="!recordMode"><strong>Recorded By:</strong> {{ recordedByDisplayName }}</div>
              <div><strong>Taken Outside:</strong> {{ hasOutsideInVisit ? 'Yes' : 'No' }}</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Patient *</label>
              <input v-if="existingVisitMode" type="text" class="form-control" :value="patientDisplayName" readonly>
              <SearchableSelect
                v-else
                v-model="form.patient_id"
                :options="patients"
                :disabled="lockPatientEffective || viewOnly"
                :required="true"
                placeholder="Search or select patient..."
                label-key="childInfo.name"
                value-key="id"
              />
            </div>

            <div class="mb-3" v-if="!recordMode">
              <label class="form-label">Select Health Staff *</label>
              <input v-if="existingVisitMode" type="text" class="form-control" :value="recordedByDisplayName" readonly>
              <SearchableSelect
                v-else
                v-model="form.recorded_by"
                :options="healthWorkers"
                :disabled="viewOnly"
                :required="true"
                placeholder="Search or select health staff..."
                label-key="fullname"
                value-key="user_id"
              />
            </div>

            <h6 class="mb-2">Vital Signs</h6>
            <div v-if="existingVisitMode && todayVisitId && todayVisitHasVitals" class="alert alert-info py-2 px-3 mb-2">
              Vitals prefilled from today’s existing visit and locked.
            </div>
            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <label class="form-label">Temperature (°C)</label>
                <input type="number" step="0.1" class="form-control" v-model="form.vitals.temperature" :disabled="vitalsReadOnly">
              </div>
              <div class="col-md-4">
                <label class="form-label">MUAC (cm)</label>
                <input type="number" step="0.1" class="form-control" v-model="form.vitals.muac" :disabled="vitalsReadOnly">
              </div>
              <div class="col-md-4">
                <label class="form-label">Respiration (Beats/min)</label>
                <input type="number" class="form-control" v-model="form.vitals.respiration" :disabled="vitalsReadOnly">
              </div>
              <div class="col-md-4">
                <label class="form-label">Weight (kg)</label>
                <input type="number" step="0.01" class="form-control" v-model="form.vitals.weight" :disabled="vitalsReadOnly">
              </div>
              <div class="col-md-4">
                <label class="form-label">Height (cm)</label>
                <input type="number" step="0.1" class="form-control" v-model="form.vitals.height" :disabled="vitalsReadOnly">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Service Options</label>
              <div class="d-flex gap-2 align-items-center">
                <button type="button" class="btn btn-outline-primary" @click="openVaccinationForm">Add Vaccine</button>
                <button type="button" class="btn btn-outline-secondary" @click="openDewormModal">Deworm</button>
                <button type="button" class="btn btn-outline-info" @click="openVitAModal">Vitamin A</button>
                <div class="form-check form-switch ms-3">
                  <input class="form-check-input" type="checkbox" id="visitOutsideToggle" v-model="hasOutsideInVisit" :disabled="viewOnly || existingVisitMode">
                  <label class="form-check-label small" for="visitOutsideToggle">
                    Outside Facility
                  </label>
                </div>
              </div>
              <small class="text-muted">Check if services will be administered outside the facility</small>
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
              <button v-if="!viewOnly" type="submit" class="btn btn-primary" :disabled="isSaveDisabled">{{ existingVisitMode ? (props.editMode ? 'Update Visit' : 'Add Services') : (recordMode ? 'Save Record' : 'Save Visit') }}</button>
              <button v-else type="button" class="btn btn-primary" @click="$emit('close')">Close</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    <form @submit.prevent="saveVisit">
      <div v-if="viewOnly" class="alert alert-light border mb-3">
        <div><strong>Patient:</strong> {{ patientDisplayName }}</div>
        <div><strong>Visit Date:</strong> {{ formatDate(form.visit_date) }}</div>
        <div v-if="form.findings"><strong>Findings:</strong> {{ form.findings }}</div>
        <div v-if="form.service_rendered"><strong>Service Rendered:</strong> {{ form.service_rendered }}</div>
        <div v-if="!recordMode"><strong>Recorded By:</strong> {{ recordedByDisplayName }}</div>
        <div><strong>Taken Outside:</strong> {{ hasOutsideInVisit ? 'Yes' : 'No' }}</div>
      </div>
      <div class="mb-3">
        <label class="form-label">Patient *</label>
        <input v-if="existingVisitMode" type="text" class="form-control" :value="patientDisplayName" readonly>
        <SearchableSelect
          v-else
          v-model="form.patient_id"
          :options="patients"
          :disabled="lockPatientEffective || viewOnly"
          :required="true"
          placeholder="Search or select patient..."
          label-key="childInfo.name"
          value-key="id"
        />
      </div>

        <div class="mb-3" v-if="!recordMode">
          <label class="form-label">Select Health Staff *</label>
          <input v-if="existingVisitMode" type="text" class="form-control" :value="recordedByDisplayName" readonly>
          <SearchableSelect
            v-else
            v-model="form.recorded_by"
            :options="healthWorkers"
            :disabled="viewOnly"
            :required="true"
            placeholder="Search or select health staff..."
            label-key="fullname"
            value-key="user_id"
          />
        </div>

        <h6 class="mb-2">Vital Signs</h6>
        <div v-if="existingVisitMode && todayVisitId && todayVisitHasVitals" class="alert alert-info py-2 px-3 mb-2">
          Vitals prefilled from today’s existing visit and locked.
        </div>
        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <label class="form-label">Temperature (°C)</label>
            <input type="number" step="0.1" class="form-control" v-model="form.vitals.temperature" :disabled="vitalsReadOnly">
          </div>
          <div class="col-md-4">
            <label class="form-label">MUAC (cm)</label>
            <input type="number" step="0.1" class="form-control" v-model="form.vitals.muac" :disabled="vitalsReadOnly">
          </div>
          <div class="col-md-4">
            <label class="form-label">Respiration (breaths/min)</label>
            <input type="number" class="form-control" v-model="form.vitals.respiration" :disabled="vitalsReadOnly">
          </div>
          <div class="col-md-4">
            <label class="form-label">Weight (kg)</label>
            <input type="number" step="0.01" class="form-control" v-model="form.vitals.weight" :disabled="vitalsReadOnly">
          </div>
          <div class="col-md-4">
            <label class="form-label">Height (cm)</label>
            <input type="number" step="0.1" class="form-control" v-model="form.vitals.height" :disabled="vitalsReadOnly">
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Service Options</label>
          <div class="d-flex gap-2 align-items-center">
            <button type="button" class="btn btn-outline-primary" @click="openVaccinationForm">Add Record</button>
          </div>
        </div>

        <!-- Vaccination Form Section -->
        <div v-if="showVaccinationForm" class="mb-3 border rounded p-3 bg-light">
          <h6 class="mb-3">
            <i class="bi bi-plus-circle me-2"></i>
            {{ recordMode ? 'Add Vaccine to Record' : 'Add Service to Record' }}
            <button type="button" class="btn btn-sm btn-outline-secondary float-end" @click="closeVaccinationForm">
              <i class="bi bi-x"></i> Cancel
            </button>
          </h6>
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
                  <SearchableSelect
                    v-if="!recordMode && !vaccinationForm.outside"
                    v-model="vaccinationForm.inventoryId"
                    :options="vaccineOptions"
                    :required="true"
                    placeholder="Search or select vaccine..."
                    label-key="display_name"
                    value-key="inventory_id"
                    @update:modelValue="onVaccineSelect"
                  />
                <!-- Outside: choose vaccine from catalog (no inventory) -->
                <SearchableSelect
                  v-else
                  v-model="vaccinationForm.vaccineId"
                  :options="vaccineCatalog"
                  :required="true"
                  placeholder="Search or select vaccine..."
                  label-key="antigen_name"
                  value-key="vaccine_id"
                  @update:modelValue="onVaccineCatalogSelect"
                />
                <div class="form-check form-switch mt-2">
                  <input class="form-check-input" type="checkbox" id="vaccinationOutsideToggle" v-model="vaccinationForm.outside">
                  <label class="form-check-label small" for="vaccinationOutsideToggle">
                    Administered from outside facility
                  </label>
                </div>
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
                <DateInput 
                  v-model="vaccinationForm.dateAdministered"
                  :required="true"
                  output-format="iso"
                  @update:modelValue="updateAgeCalculation"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Age at Administration</label>
                <input type="text" class="form-control" v-model="vaccinationForm.ageAtAdministration" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Manufacturer</label>
                <input type="text" class="form-control" v-model="vaccinationForm.vaccineManufacturer" :readonly="!recordMode && !vaccinationForm.outside">
              </div>
              <div class="col-md-6">
                <label class="form-label">Lot Number</label>
                <input type="text" class="form-control" v-model="vaccinationForm.lotNumber" :readonly="!recordMode && !vaccinationForm.outside">
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
              <div class="col-md-6" v-if="!recordMode && !vaccinationForm.outside">
                <label class="form-label">Health Staff *</label>
                <select class="form-select" v-model="vaccinationForm.healthWorkerId" required>
                  <option value="">Select health staff</option>
                  <option v-for="nurse in nurses" :key="nurse.user_id || nurse.id" :value="nurse.user_id || nurse.id">
                    {{ nurse.fullname }}
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
              <button type="button" class="btn btn-secondary me-2" @click="closeVaccinationForm">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="savingVaccination">
                <span v-if="savingVaccination" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ savingVaccination ? 'Adding...' : 'Add to Record' }}
              </button>
            </div>
            
            <!-- Debug info -->
            <div v-if="false" class="mt-3 p-2 bg-light border rounded">
              <small class="text-muted">Debug: {{ nurses.length }} nurses/nutritionists available</small>
              <pre class="small">{{ JSON.stringify(nurses, null, 2) }}</pre>
            </div>
          </form>
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
          <button v-if="!viewOnly" type="submit" class="btn btn-primary" :disabled="isSaveDisabled">{{ existingVisitMode ? (props.editMode ? 'Update Visit' : 'Add Services') : (recordMode ? 'Save Record' : 'Save Record') }}</button>
          <button v-else type="button" class="btn btn-primary" @click="$emit('close')">Close</button>
        </div>
      </form>
  </div>


</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { getCurrentPHDate, utcToPH } from '@/utils/dateUtils'
import SearchableSelect from '@/components/ui/form/SearchableSelect.vue'
import DateInput from '@/components/ui/form/DateInput.vue'

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
  existingVisitId: { type: [String, Number], default: '' },
  // When true, allows editing fields even for existing visits
  editMode: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'saved', 'open-vaccination', 'open-deworm', 'open-vita', 'update-collected-vaccinations'])

// Derived flags
const viewOnly = computed(() => !!props.viewMode)
// Admin parity with Health Worker: auto-adopt today's existing visit for the selected patient
const todayVisitId = ref('')
const todayVisitHasVitals = ref(false)
const effectiveExistingVisitId = computed(() => String(props.existingVisitId || todayVisitId.value || ''))
const existingVisitMode = computed(() => !!effectiveExistingVisitId.value)
const lockPatientEffective = computed(() => props.lockPatient || !!effectiveExistingVisitId.value)

const patients = ref([])
const patientSearch = ref('')
const healthWorkers = ref([]) // BHW for visit recording
const nurses = ref([]) // Nurses for vaccination administration
const loading = ref(false)
const selectedPatientData = ref(null)
const showVaccinationForm = ref(false)
const savingVaccination = ref(false)
const vaccineOptions = ref([])
const vaccineCatalog = ref([])
const showNipOnly = ref(false)
const availableDoses = ref([1, 2, 3, 4, 5]) // Default doses, can be made dynamic later
const autoSelectHint = ref('')
// Indicator if any immunization in this visit was recorded as outside
const hasOutsideInVisit = ref(false)

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

const isSaveDisabled = computed(() => existingVisitMode.value && !props.editMode && (!localCollectedVaccinations.value || localCollectedVaccinations.value.length === 0))

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

// Display name for the selected patient
const patientDisplayName = computed(() => {
  if (selectedPatientData.value) {
    const p = selectedPatientData.value
    const parts = [
      p.firstname || p.first_name || p.firstName,
      p.middlename || p.middle_name || p.middleName,
      p.surname || p.last_name || p.lastName
    ].filter(Boolean)
    const name = parts.join(' ').trim()
    if (name) return name
  }
  try {
    const opt = (patients.value || []).find(o => String(o.id) === String(form.value.patient_id))
    return opt?.childInfo?.name || '—'
  } catch {
    return '—'
  }
})

// Display name for the recorded by health worker
const recordedByDisplayName = computed(() => {
  const hw = healthWorkers.value.find(h => String(h.user_id) === String(form.value.recorded_by))
  return hw?.fullname || form.value.recorded_by || '—'
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
// Normalize an ID: return a digits-only string or empty string if invalid
const normalizeId = (val) => {
  if (val === null || val === undefined) return ''
  const s = String(val).trim()
  return /^\d+$/.test(s) ? s : ''
}


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
  remarks: '',
  outside: false
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
    patients.value = list.map(p => ({ id: String(p.patient_id || p.id), childInfo: { name: [p.firstname, p.middlename, p.surname].filter(Boolean).join(' ').trim() } }))
    
    // Ensure current patient is included if editing existing visit
    if (form.value.patient_id && selectedPatientData.value) {
      const existingPatient = patients.value.find(p => p.id === form.value.patient_id)
      if (!existingPatient) {
        const currentPatient = {
          id: form.value.patient_id,
          childInfo: { 
            name: [selectedPatientData.value.firstname, selectedPatientData.value.middlename, selectedPatientData.value.surname]
              .filter(Boolean).join(' ').trim() 
          }
        }
        patients.value.unshift(currentPatient)
        console.log('✅ [VISIT_EDITOR] Ensured current patient is in patients list')
      }
    }
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

    // For visit form (recorded_by): include ALL health staff (any HS type),
    // and append HS type next to their name for clarity.
    const allStaffMapped = list.map(hw => ({
      user_id: hw.user_id || hw.id || hw.health_worker_id,
      // Show HS type beside the name in the label used by SearchableSelect
      hs_type: displayRole(rawRole(hw)),
      base_name: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
    }))
    // Deduplicate by user_id in case the API returns duplicates
    const dedup = new Map()
    for (const s of allStaffMapped) {
      if (!s.user_id) continue
      dedup.set(String(s.user_id), s)
    }
    healthWorkers.value = Array.from(dedup.values()).map(s => ({
      user_id: String(s.user_id),
      fullname: s.base_name ? `${s.base_name} (${s.hs_type})` : `(${s.hs_type})`,
      hs_type: s.hs_type
    }))

    // For vaccination form (administered_by): show ONLY Nurses and Nutritionists
    nurses.value = list
      .filter(hw => isNurseOrNutritionistRole(rawRole(hw)))
      .map(hw => ({
        user_id: hw.user_id || hw.id || hw.health_worker_id,
        fullname: ([hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname) + ` (${displayRole(rawRole(hw))})`,
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
    // Map inventory items to option shape
    let mapped = payload.map(v => ({
      inventory_id: v.inventory_id || v.id,
      vaccine_id: v.vaccine_id,
      display_name: `${v.vaccinemaster?.antigen_name || 'Unknown'} (${v.vaccinemaster?.disease_prevented || 'Unknown'}) - Lot: ${v.lot_number || 'N/A'} - Exp: ${v.expiration_date ? formatDate(v.expiration_date) : 'N/A'}`,
      vaccine_name: v.vaccinemaster?.antigen_name || 'Unknown',
      disease_prevented: v.vaccinemaster?.disease_prevented || 'Unknown',
      manufacturer: v.vaccinemaster?.manufacturer || 'Unknown',
      lot_number: v.lot_number,
      expiration_date: v.expiration_date
    }))
    console.log('🎯 [VisitEditor] Processed vaccine options (unfiltered):', mapped)

    // If a patient is selected, fetch their immunizations and filter out vaccines
    // the patient already has a record for (so they won't appear in dropdown)
    if (form.value.patient_id) {
      try {
        const immRes = await api.get('/immunizations', { params: { patient_id: form.value.patient_id, limit: 500 } })
        const immData = immRes.data?.data || immRes.data || []
        const patientVaccineIds = new Set()
        const patientAntigenNames = new Set()
        if (Array.isArray(immData)) {
          immData.forEach(i => {
            if (i.vaccine_id) patientVaccineIds.add(String(i.vaccine_id))
            const name = i.vaccine_name || i.antigen_name || i.vaccine_antigen_name || i.vaccineName || ''
            if (name) patientAntigenNames.add(String(name).toLowerCase())
          })
        }

        // Filter mapped options: exclude inventory items whose vaccine_id or antigen name is already present
        mapped = mapped.filter(opt => {
          const vid = opt.vaccine_id ? String(opt.vaccine_id) : ''
          const aname = opt.vaccine_name ? String(opt.vaccine_name).toLowerCase() : ''
          if (vid && patientVaccineIds.has(vid)) return false
          if (aname && patientAntigenNames.has(aname)) return false
          return true
        })
        console.log('🔍 [VisitEditor] Filtered vaccine options based on patient immunizations:', mapped)
      } catch (e) {
        console.warn('⚠️ [VisitEditor] Failed to fetch patient immunizations for filtering:', e)
      }
    }

    vaccineOptions.value = mapped
    console.log('🎯 [VisitEditor] Vaccine options ready (filtered):', vaccineOptions.value)
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
    // Map catalog items
    let mapped = list.map(v => ({
      vaccine_id: v.vaccine_id || v.id,
      antigen_name: v.antigen_name || v.name || 'Unknown',
      disease_prevented: v.disease_prevented || '',
      manufacturer: v.manufacturer || ''
    }))

    // If a patient is selected, fetch their immunizations and filter out vaccines
    if (form.value.patient_id) {
      try {
        const immRes = await api.get('/immunizations', { params: { patient_id: form.value.patient_id, limit: 500 } })
        const immData = immRes.data?.data || immRes.data || []
        const patientVaccineIds = new Set()
        const patientAntigenNames = new Set()
        if (Array.isArray(immData)) {
          immData.forEach(i => {
            if (i.vaccine_id) patientVaccineIds.add(String(i.vaccine_id))
            const name = i.vaccine_name || i.antigen_name || i.vaccine_antigen_name || i.vaccineName || ''
            if (name) patientAntigenNames.add(String(name).toLowerCase())
          })
        }

        mapped = mapped.filter(opt => {
          const vid = opt.vaccine_id ? String(opt.vaccine_id) : ''
          const aname = opt.antigen_name ? String(opt.antigen_name).toLowerCase() : ''
          if (vid && patientVaccineIds.has(vid)) return false
          if (aname && patientAntigenNames.has(aname)) return false
          return true
        })
        console.log('🔍 [VisitEditor] Filtered vaccine catalog based on patient immunizations:', mapped)
      } catch (e) {
        console.warn('⚠️ [VisitEditor] Failed to fetch patient immunizations for catalog filtering:', e)
      }
    }

    vaccineCatalog.value = mapped
  } catch (e) {
    console.error('❌ [VisitEditor] Failed to load vaccine catalog:', e)
    vaccineCatalog.value = []
  }
}

// When NIP filter toggles, refresh the appropriate source (inventory for in-facility, catalog for outside)
const onNipToggle = () => {
  if (vaccinationForm.value.outside) {
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

// Vitals readonly logic: lock when viewing, or when adopting today's visit that already has vitals
const vitalsReadOnly = computed(() => {
  if (viewOnly.value) return true
  if (existingVisitMode.value && todayVisitId.value) {
    return todayVisitHasVitals.value || !props.editMode
  }
  if (existingVisitMode.value && !props.editMode) return true
  return false
})

// Check if a visit already exists for today for this patient and auto-adopt it
const checkTodayVisitAndAdopt = async (patientId) => {
  if (!patientId || props.existingVisitId) return
  try {
    const visitDateIso = new Date().toISOString()
    const { data } = await api.get('/visits/exists/check', { params: { patient_id: patientId, visit_date: visitDateIso } })
    if (data && data.exists) {
      todayVisitId.value = String(data.visit_id || '')
      // Load existing visit details to prefill vitals
      await fetchExistingVisit(todayVisitId.value)
      const v = form.value?.vitals || {}
      const hasAny = [v.temperature, v.muac, v.respiration, v.weight, v.height]
        .some(x => x !== '' && x !== null && typeof x !== 'undefined')
      todayVisitHasVitals.value = !!hasAny
      addToast({ title: 'Using today\'s visit', message: 'An existing visit for today was found and will be used.', type: 'info' })
    } else {
      todayVisitId.value = ''
      todayVisitHasVitals.value = false
    }
  } catch (e) {
    // Silent fail; backend will still block duplicate via 409
    todayVisitId.value = ''
    todayVisitHasVitals.value = false
  }
}

const openVaccinationForm = async (patientId = null) => {
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
    remarks: '',
    outside: hasOutsideInVisit.value // Default to visit-level setting
  }
  
  // Calculate age immediately with default date
  updateAgeCalculation()
  
  showVaccinationForm.value = true
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

const onVaccineSelect = async (newInventoryId) => {
  // Update the form value
  vaccinationForm.value.inventoryId = newInventoryId
  
  if (!newInventoryId) {
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
  const selectedVaccine = vaccineOptions.value.find(v => v.inventory_id === newInventoryId)
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

const onVaccineCatalogSelect = async (newVaccineId) => {
  // Update the form value
  vaccinationForm.value.vaccineId = newVaccineId
  
  if (!newVaccineId) {
    vaccinationForm.value.diseasePrevented = ''
    vaccinationForm.value.vaccineManufacturer = ''
    vaccinationForm.value.vaccineName = ''
    availableDoses.value = [1,2,3,4,5]
    autoSelectHint.value = ''
    return
  }
  const v = (vaccineCatalog.value || []).find(x => x.vaccine_id === newVaccineId)
  if (v) {
    vaccinationForm.value.vaccineName = v.antigen_name || ''
    vaccinationForm.value.diseasePrevented = v.disease_prevented || ''
    vaccinationForm.value.vaccineManufacturer = v.manufacturer || ''
    vaccinationForm.value.lotNumber = ''
  }
  updateAgeCalculation()

  try {
    if (form.value.patient_id) {
      const res = await api.get(`/patients/${form.value.patient_id}/smart-doses`, { params: { vaccine_id: newVaccineId } })
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

    const vaccinationData = (props.recordMode || vaccinationForm.value.outside)
      ? {
          patient_id: form.value.patient_id,
          vaccine_id: vaccinationForm.value.vaccineId,
          disease_prevented: vaccinationForm.value.diseasePrevented,
          dose_number: vaccinationForm.value.doseNumber,
          administered_date: vaccinationForm.value.dateAdministered,
          age_at_administration: vaccinationForm.value.ageAtAdministration,
          administered_by: vaccinationForm.value.healthWorkerId,
          remarks: fullRemarks,
          outside: vaccinationForm.value.outside,
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
      closeVaccinationForm()
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
      closeVaccinationForm()
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

const closeVaccinationForm = () => {
  showVaccinationForm.value = false
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
    outside: hasOutsideInVisit.value, // Reset to visit-level default
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
    remarks: service.remarks || '',
    outside: !!(service.outside || service.immunization_outside || service.is_outside || service.isOutside)
  }

  // Open form for editing
  showVaccinationForm.value = true

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

    // If adding to existing visit (explicit or auto-adopted), save services directly or update visit
    const targetExistingId = effectiveExistingVisitId.value
    if (targetExistingId) {
      console.log('🔄 [VISIT_SAVE_FRONTEND] Updating existing visit:', targetExistingId)

      // Prepare update payload for visit (exclude vitals)
      const updatePayload = {
        recorded_by: normalizeId(form.value.recorded_by) || undefined,
        visit_date: form.value.visit_date,
        findings: form.value.findings,
        service_rendered: form.value.service_rendered,
        updated_by: form.value.recorded_by
      }

      // Update the visit
  await api.put(`/visits/${targetExistingId}`, updatePayload)

      // Update vitals separately
      try {
  await api.put(`/vitals/${targetExistingId}`, form.value.vitals)
        console.log('✅ [VISIT_SAVE_FRONTEND] Vitals updated successfully')
      } catch (vitalsErr) {
        console.warn('⚠️ [VISIT_SAVE_FRONTEND] Failed to update vitals:', vitalsErr)
        // Don't fail the entire operation for vitals update failure
      }

      // If there are new services to add, post them as immunizations
      if (localCollectedVaccinations.value && localCollectedVaccinations.value.length > 0) {
        const promises = localCollectedVaccinations.value.map(vacc => 
          api.post('/immunizations', {
            ...vacc,
            visit_id: targetExistingId,
            patient_id: form.value.patient_id
          })
        )
        await Promise.all(promises)
      }

      console.log('✅ [VISIT_SAVE_FRONTEND] Visit updated successfully')
      addToast({ title: 'Saved', message: 'Visit updated successfully', type: 'success' })
      emit('saved')
      emit('close')
      return
    }

    // Prepare the visit payload with collected vaccinations and services
    const visitPayload = {
      ...form.value,
      // In recordMode, omit findings/service_rendered and recorded_by if empty
      ...(props.recordMode ? { recorded_by: normalizeId(form.value.recorded_by) || undefined, findings: undefined, service_rendered: undefined, vitals: form.value.vitals || {} } : { recorded_by: normalizeId(form.value.recorded_by) || undefined }),
  collectedVaccinations: localCollectedVaccinations.value || [],
      services: [] // Add services array for future use (deworming, etc.)
    }

    console.log('🔄 [VISIT_SAVE_FRONTEND] Preparing to save visit with payload:', visitPayload)

    // Save the visit (this will handle all related data atomically)
    let visitResponse
    try {
      visitResponse = await api.post('/visits', visitPayload)
    } catch (e) {
      const code = e?.response?.data?.code || e?.response?.data?.errorCode
      const existingId = e?.response?.data?.existing_visit_id
      if (code === 'VISIT_DUPLICATE_PER_DAY' && existingId) {
        todayVisitId.value = String(existingId)
        addToast({ title: 'Existing visit today', message: 'We found an existing visit for today. Switching to update that visit.', type: 'info' })
        loading.value = false
        return await saveVisit()
      }
      throw e
    }
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

  // If target date is before birth date, clamp to 0 days old
  if (target < birth) return '0 days old'

  // Compute total months and remaining days similar to VaccinationRecordEditor logic
  let totalMonths = (target.getFullYear() - birth.getFullYear()) * 12 + (target.getMonth() - birth.getMonth())
  let days = target.getDate() - birth.getDate()

  if (days < 0) {
    totalMonths--
    // Days in the previous month relative to target
    const prevMonthLastDay = new Date(target.getFullYear(), target.getMonth(), 0)
    const daysInPrevMonth = prevMonthLastDay.getDate()
    days += daysInPrevMonth
  }

  if (totalMonths < 0) totalMonths = 0

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  // Format string (retain years, months, days like existing UI)
  if (years === 0) {
    if (months === 0) {
      return `${days} day${days !== 1 ? 's' : ''} old`
    }
    return `${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} old`
  }
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} old`
}

onMounted(() => {
  console.log('🏁 [VISIT_EDITOR] Component mounted, initializing...')
  console.log('🏁 [VISIT_EDITOR] Props received:', {
    embedded: props.embedded,
    existingVisitId: props.existingVisitId,
    initialPatientId: props.initialPatientId,
    viewMode: props.viewMode,
    editMode: props.editMode,
    recordMode: props.recordMode
  })
  console.log('🏁 [VISIT_EDITOR] Props types:', {
    existingVisitId: typeof props.existingVisitId,
    initialPatientId: typeof props.initialPatientId
  })
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
    // Enforce one-visit-per-day: adopt today's visit if it exists
    checkTodayVisitAndAdopt(String(newPatientId))
  } else {
    selectedPatientData.value = null
  }
})

const fetchExistingVisit = async (visitId) => {
  console.log('🔄 [VISIT_EDITOR] Fetching existing visit:', visitId)
  console.log('🔄 [VISIT_EDITOR] API endpoint:', `/visits/${visitId}`)
  try {
    loading.value = true
    console.log('🔄 [VISIT_EDITOR] Making API request...')
    const res = await api.get(`/visits/${visitId}`)
    console.log('🔄 [VISIT_EDITOR] Raw API response:', res)
    console.log('🔄 [VISIT_EDITOR] Response data:', res.data)
    const data = res.data?.data || res.data || {}
    console.log('🔄 [VISIT_EDITOR] Extracted visit data:', data)
    console.log('🔄 [VISIT_EDITOR] Visit data keys:', Object.keys(data))
    console.log('🔄 [VISIT_EDITOR] Visit data values:', Object.values(data))

    const patientId = String(data.patient_id || form.value.patient_id || props.initialPatientId || '')
    console.log('🔄 [VISIT_EDITOR] Patient ID from data:', patientId)
    
    // Use patient_name from visits_view if available, otherwise fetch patient details
    if (data.patient_name) {
      // Create a temporary patient object for display purposes
      selectedPatientData.value = {
        patient_id: patientId,
        firstname: data.patient_name.split(' ')[0] || '',
        middlename: data.patient_name.split(' ').slice(1, -1).join(' ') || '',
        surname: data.patient_name.split(' ').slice(-1)[0] || ''
      }
      console.log('✅ [VISIT_EDITOR] Used patient_name from visits_view:', data.patient_name)
    } else {
      // Fallback to fetching patient details if patient_name not available
      if (patientId) {
        fetchSelectedPatientData(patientId)
      }
    }
    
    // Ensure the current patient is in the patients list for proper display
    if (patientId && patients.value.length > 0) {
      const existingPatient = patients.value.find(p => p.id === patientId)
      if (!existingPatient && selectedPatientData.value) {
        // Add the current patient to the list temporarily for display
        const currentPatient = {
          id: patientId,
          childInfo: { 
            name: [selectedPatientData.value.firstname, selectedPatientData.value.middlename, selectedPatientData.value.surname]
              .filter(Boolean).join(' ').trim() 
          }
        }
        patients.value.unshift(currentPatient)
        console.log('✅ [VISIT_EDITOR] Added current patient to patients list for display')
      }
    }

    // Now set the form patient_id after ensuring the patient is in the options
    form.value.patient_id = patientId
    console.log('🔄 [VISIT_EDITOR] Set patient_id to:', form.value.patient_id)
    form.value.recorded_by = String(data.recorded_by || '')
    console.log('🔄 [VISIT_EDITOR] Set recorded_by to:', form.value.recorded_by)

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
    console.log('🔄 [VISIT_EDITOR] Set visit_date to:', form.value.visit_date, 'from:', data.visit_date)
    form.value.findings = data.findings || ''
    console.log('🔄 [VISIT_EDITOR] Set findings to:', form.value.findings)
    form.value.service_rendered = data.service_rendered || ''
    console.log('🔄 [VISIT_EDITOR] Set service_rendered to:', form.value.service_rendered)
    // Determine if any immunization linked to this visit was taken outside
    try {
      const ims = Array.isArray(data.immunizations_given) ? data.immunizations_given : (Array.isArray(data.immunizations) ? data.immunizations : [])
      hasOutsideInVisit.value = ims.some(im => !!(im?.outside || im?.immunization_outside || im?.is_outside || im?.isOutside || im?.outside_immunization))
    } catch {
      hasOutsideInVisit.value = false
    }

    // Vitals mapping from multiple possible shapes
    if (data.vitals) {
      // Already nested under data.vitals
      form.value.vitals = {
        temperature: data.vitals.temperature ?? '',
        muac: data.vitals.muac ?? '',
        respiration: data.vitals.respiration ?? '',
        weight: data.vitals.weight ?? '',
        height: data.vitals.height ?? ''
      }
      console.log('🔄 [VISIT_EDITOR] Mapped vitals from data.vitals:', form.value.vitals)
    } else if (data.vital_signs) {
      // visits_view exposes vitals as vital_signs JSON column
      const vs = data.vital_signs
      form.value.vitals = {
        temperature: vs.temperature ?? '',
        muac: vs.muac ?? '',
        respiration: vs.respiration_rate ?? '',  // Note: API uses respiration_rate
        weight: vs.weight ?? '',
        height: vs.height_length ?? ''  // Note: API uses height_length
      }
      console.log('🔄 [VISIT_EDITOR] Mapped vitals from data.vital_signs:', form.value.vitals)
    } else if (
      data.temperature !== undefined ||
      data.muac !== undefined ||
      data.respiration_rate !== undefined ||
      data.weight !== undefined ||
      data.height_length !== undefined
    ) {
      // visits_view exposes vitals as top-level columns
      form.value.vitals = {
        temperature: data.temperature ?? '',
        muac: data.muac ?? '',
        respiration: (data.respiration_rate ?? data.respiration) ?? '',
        weight: data.weight ?? '',
        height: (data.height_length ?? data.height) ?? ''
      }
      console.log('🔄 [VISIT_EDITOR] Mapped vitals from visits_view columns:', form.value.vitals)
    } else {
      // Fetch vitals from separate endpoint as fallback
      try {
        console.log('🔄 [VISIT_EDITOR] No vitals in visit data, fetching from separate endpoint...')
        const vitalsRes = await api.get(`/vitals/${visitId}`)
        const v = vitalsRes.data?.data || vitalsRes.data || {}
        form.value.vitals = {
          temperature: v.temperature ?? '',
          muac: v.muac ?? '',
          respiration: v.respiration ?? '',
          weight: v.weight ?? '',
          height: v.height ?? ''
        }
        console.log('🔄 [VISIT_EDITOR] Fetched vitals from separate endpoint:', form.value.vitals)
      } catch (e) {
        console.warn('Failed to fetch vitals for visit', e)
        form.value.vitals = { temperature: '', muac: '', respiration: '', weight: '', height: '' }
        console.log('🔄 [VISIT_EDITOR] Set empty vitals due to error')
      }
    }

    if (form.value.patient_id && !data.patient_name) {
      fetchSelectedPatientData(form.value.patient_id)
    }
    console.log('✅ [VISIT_EDITOR] Form populated with visit data')
    console.log('✅ [VISIT_EDITOR] Final form state:', {
      patient_id: form.value.patient_id,
      recorded_by: form.value.recorded_by,
      visit_date: form.value.visit_date,
      findings: form.value.findings,
      service_rendered: form.value.service_rendered,
      vitals: form.value.vitals
    })

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

watch(() => props.existingVisitId, async (newId) => {
  console.log('🔍 [VISIT_EDITOR] existingVisitId prop changed:', {
    newId,
    type: typeof newId,
    isValid: !!newId,
    propsExistingVisitId: props.existingVisitId
  })
  if (newId) {
    // Ensure patients and health workers are loaded before fetching visit data
    if (patients.value.length === 0) {
      console.log('🔄 [VISIT_EDITOR] Patients not loaded yet, fetching first...')
      await fetchPatients()
    }
    if (healthWorkers.value.length === 0) {
      console.log('🔄 [VISIT_EDITOR] Health workers not loaded yet, fetching first...')
      await fetchHealthWorkers()
    }
    console.log('🔄 [VISIT_EDITOR] All data loaded, now fetching visit with:', String(newId))
    fetchExistingVisit(String(newId))
    // Parent dictates existing visit; reflect in today-visit state
    todayVisitId.value = String(newId)
    const v = form.value?.vitals || {}
    todayVisitHasVitals.value = [v.temperature, v.muac, v.respiration, v.weight, v.height]
      .some(x => x !== '' && x !== null && typeof x !== 'undefined')
  }
}, { immediate: true })

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

// Watch for outside toggle changes to refresh vaccine list
watch(() => vaccinationForm.value.outside, (isOutside) => {
  if (isOutside) {
    fetchVaccineCatalog()
  } else {
    fetchVaccineOptions()
  }
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
    // Also adopt today\'s visit if present
    checkTodayVisitAndAdopt(String(newPatientId))
  }
}, { immediate: true })
</script>

<style scoped>
.modal.show { background-color: rgba(0,0,0,0.5); }
</style>
