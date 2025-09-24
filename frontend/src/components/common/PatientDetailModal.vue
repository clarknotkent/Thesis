<template>
  <div class="modal fade" :class="{ show: show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-person-circle me-2"></i>
            Patient Details
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        
        <!-- Loading State, Patient Data, Error State -->
        <div v-if="loading" class="modal-body text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">Loading patient information...</p>
        </div>
        <div v-else-if="patientData" class="modal-body">
          <!-- Patient Information -->
          <div class="row mb-4">
            <div class="col-12">
              <h6 class="text-primary fw-bold mb-3">
                <i class="bi bi-person-fill me-2"></i>Patient Information
              </h6>
              <div class="row g-3">
                <!-- Phone number moved to Guardian section below -->
                <div class="col-md-4">
                  <strong>First Name:</strong><br>
                  <span class="text-muted">{{ patientData.patientInfo.firstname || '—' }}</span>
                </div>
                <div class="col-md-4">
                  <strong>Middle Name:</strong><br>
                  <span class="text-muted">{{ patientData.patientInfo.middlename || '—' }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Sex:</strong><br>
                  <span class="text-muted">{{ patientData.patientInfo.sex || '—' }}</span>
                </div>
                <div class="col-md-4">
                  <strong>Barangay:</strong><br>
                  <span class="text-muted">{{ patientData.patientInfo.barangay || '—' }}</span>
                </div>
                <div class="col-md-5">
                  <strong>Health Center:</strong><br>
                  <span class="text-muted">{{ patientData.patientInfo.health_center || '—' }}</span>
                </div>
                <div class="col-md-12">
                  <strong>Address:</strong><br>
                  <span class="text-muted">{{ patientData.childInfo.address.street }}, {{ patientData.childInfo.address.barangay }}</span>
                </div>
                <!-- Phone number moved to Guardian section below -->
              </div>
            </div>
          </div>

          <!-- Guardian & Parent Information -->
          <div class="row g-3">
            <div class="col-md-4">
              <strong>Guardian:</strong><br>
              <span class="text-muted">{{ patientData.guardianInfo?.full_name || '—' }}</span>
            </div>
            <div class="col-md-4">
              <strong>Relationship to Guardian:</strong><br>
              <span class="text-muted">{{ patientData.patientInfo.relationship_to_guardian || '—' }}</span>
            </div>
            <div class="col-md-4">
              <strong>Guardian Contact:</strong><br>
              <span class="text-muted">{{ patientData.guardianInfo?.contact_number || patientData.childInfo?.phoneNumber || '—' }}</span>
            </div>
          </div>

          <div class="row mt-3">
            <div class="col-md-6">
              <h6 class="text-primary fw-bold mb-2">Mother's Information</h6>
              <div>
                <strong>Name:</strong><br>
                <span class="text-muted">{{ patientData.motherInfo.name || '—' }}</span>
              </div>
              <div class="mt-1">
                <strong>Occupation:</strong><br>
                <span class="text-muted">{{ patientData.motherInfo.occupation || '—' }}</span>
              </div>
              <div class="mt-1">
                <strong>Contact:</strong><br>
                <span class="text-muted">{{ patientData.motherInfo.phoneNumber || '—' }}</span>
              </div>
            </div>
            <div class="col-md-6">
              <h6 class="text-primary fw-bold mb-2">Father's Information</h6>
              <div>
                <strong>Name:</strong><br>
                <span class="text-muted">{{ patientData.fatherInfo.name || '—' }}</span>
              </div>
              <div class="mt-1">
                <strong>Occupation:</strong><br>
                <span class="text-muted">{{ patientData.fatherInfo.occupation || '—' }}</span>
              </div>
              <div class="mt-1">
                <strong>Contact:</strong><br>
                <span class="text-muted">{{ patientData.fatherInfo.phoneNumber || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Birth History -->
          <div class="row mb-4" v-if="patientData.birthHistory">
            <div class="col-12">
              <h6 class="text-primary fw-bold mb-3">
                <i class="bi bi-heart-pulse me-2"></i>Birth History
              </h6>
              <div class="row g-3">
                <div class="col-md-3">
                  <strong>Date of Birth:</strong><br>
                  <span class="text-muted">{{ formatDate(patientData.birthHistory.date_of_birth) }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Time of Birth:</strong><br>
                  <span class="text-muted">{{ patientData.birthHistory.time_of_birth || '—' }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Attendant:</strong><br>
                  <span class="text-muted">{{ patientData.birthHistory.attendant_at_birth || '—' }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Delivery Type:</strong><br>
                  <span class="text-muted">{{ patientData.birthHistory.type_of_delivery || '—' }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Birth Weight (kg):</strong><br>
                  <span class="text-muted">{{ patientData.birthHistory.birth_weight || '—' }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Birth Length (cm):</strong><br>
                  <span class="text-muted">{{ patientData.birthHistory.birth_length || '—' }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Place of Birth:</strong><br>
                  <span class="text-muted">{{ patientData.birthHistory.place_of_birth || '—' }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Address at Birth:</strong><br>
                  <span class="text-muted">{{ patientData.birthHistory.address_at_birth || '—' }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Ballard's Score:</strong><br>
                  <span class="text-muted">{{ patientData.birthHistory.ballards_score || '—' }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Hearing Test:</strong><br>
                  <span class="text-muted">{{ patientData.birthHistory.hearing_test_date || '—' }}</span>
                </div>
                <div class="col-md-4">
                  <strong>Newborn Screening Date:</strong><br>
                  <span class="text-muted">{{ patientData.birthHistory.newborn_screening_date || '—' }}</span>
                </div>
                <div class="col-md-5">
                  <strong>Newborn Screening Result:</strong><br>
                  <span class="text-muted">{{ patientData.birthHistory.newborn_screening_result || '—' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vaccination History -->
          <div class="row mb-4" v-if="patientData.vaccinationHistory && patientData.vaccinationHistory.length > 0">
            <div class="col-12">
              <h6 class="text-primary fw-bold mb-3">
                <i class="bi bi-shield-check me-2"></i>Vaccination History
              </h6>
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>Vaccine Name</th>
                      <th>Date Administered</th>
                      <th>Dose</th>
                      <th>Manufacturer</th>
                      <th>Lot Number</th>
                      <th>Health Worker</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="vaccine in patientData.vaccinationHistory" :key="vaccine.immunization_id || vaccine.lotNumber">
                      <td class="fw-semibold">{{ vaccine.vaccineName }}</td>
                      <td>{{ formatDate(vaccine.dateAdministered) }}</td>
                      <td>{{ vaccine.ageAtAdministration || vaccine.doseNumber || '-' }}</td>
                      <td>{{ vaccine.vaccineManufacturer }}</td>
                      <td><code>{{ vaccine.lotNumber }}</code></td>
                      <td>{{ vaccine.healthWorker }}</td>
                      <td><small class="text-muted">{{ vaccine.remarks }}</small></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Next Scheduled Vaccinations -->
          <div class="row mb-4" v-if="patientData.nextScheduledVaccinations && patientData.nextScheduledVaccinations.length > 0">
            <div class="col-12">
              <h6 class="text-primary fw-bold mb-3">
                <i class="bi bi-calendar-check me-2"></i>Next Scheduled Vaccinations
              </h6>
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead class="table-light">
                    <tr>
                      <th>Vaccine Name</th>
                      <th>Scheduled Date</th>
                      <th>Dose Number</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="vaccine in patientData.nextScheduledVaccinations" :key="vaccine.vaccineName + vaccine.scheduledDate">
                      <td class="fw-semibold">{{ vaccine.vaccineName }}</td>
                      <td>{{ formatDate(vaccine.scheduledDate) }}</td>
                      <td>{{ vaccine.doseNumber }}</td>
                      <td>
                        <span class="badge" :class="vaccine.status === 'Due' ? 'bg-warning text-dark' : 'bg-success'">
                          {{ vaccine.status }}
                        </span>
                      </td>
                      <td><small class="text-muted">{{ vaccine.notes || '' }}</small></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="modal-body text-center py-5">
          <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
          <h5 class="text-danger mt-3">Error Loading Patient Data</h5>
          <p class="text-muted">{{ error }}</p>
          <button class="btn btn-primary" @click="fetchPatientData">Try Again</button>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Close</button>
                <button type="button" class="btn btn-primary" @click="printRecord" v-if="patientData">
            <i class="bi bi-printer me-2"></i>Print Record
          </button>
                <button v-if="isAdmin && patientData && patientData.nextScheduledVaccinations && patientData.nextScheduledVaccinations.length > 0" type="button" class="btn btn-outline-secondary ms-2" @click="showScheduleEditor = true">
                  <i class="bi bi-calendar2-event me-2"></i>View/Edit Schedule
                </button>
                <button v-if="patientData" type="button" class="btn btn-outline-info ms-2" @click="showVisitHistory = true">
                  <i class="bi bi-journal-text me-2"></i>View Visits
                </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Backdrop -->
  <div v-if="show" class="modal-backdrop fade show"></div>
  
  <!-- Vaccination Record Editor Modal -->
  <VaccinationRecordEditor 
    :show="showVaccinationEditor" 
    :patient-id="patientId" 
    @close="showVaccinationEditor = false"
    @update="fetchPatientData"
  />

  <!-- Schedule Editor Modal -->
  <ScheduleEditor
    :show="showScheduleEditor"
    :patient-id="patientId"
    :schedule="patientData ? patientData.nextScheduledVaccinations : []"
    @close="showScheduleEditor = false"
    @updated="fetchPatientData"
  />

  <!-- Visit History Modal -->
  <VisitHistoryModal
    :show="showVisitHistory"
    :patient-id="patientId"
    @close="showVisitHistory = false"
  />
</template>

<script setup>
import { ref, watch, inject } from 'vue'
import api from '@/services/api'
import VaccinationRecordEditor from './VaccinationRecordEditor.vue'
import ScheduleEditor from './ScheduleEditor.vue'
import VisitHistoryModal from './VisitHistoryModal.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: [String, null],
    default: null
  }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const patientData = ref(null)
const error = ref(null)
const showVaccinationEditor = ref(false)
const showScheduleEditor = ref(false)
const showVisitHistory = ref(false)
const isAdmin = inject('isAdmin', () => false) // Inject user role, default to non-admin

const fetchPatientData = async () => {
  if (!props.patientId || props.patientId === null) return

  try {
    loading.value = true
    error.value = null
    patientData.value = null

    // Fetch base patient info, schedule and immunizations
    const [patientRes, scheduleRes, immunizationsRes, vaccinesRes] = await Promise.all([
      api.get(`/patients/${props.patientId}`),
      api.get(`/patients/${props.patientId}/schedule`).catch(() => ({ data: null })),
      api.get('/immunizations', { params: { patient_id: props.patientId } }).catch(() => ({ data: [] })),
      api.get('/vaccines').catch(() => ({ data: [] }))
    ])

    const p = patientRes.data?.data || {}
    const schedule = scheduleRes.data || []
    const immunizations = (immunizationsRes.data?.data || immunizationsRes.data || [])
    const vaccines = vaccinesRes.data || []
    const vaccineMap = {}
    if (Array.isArray(vaccines)) {
      vaccines.forEach(v => {
        const id = v.vaccine_id || v.id || v.id_number || null
        if (id) vaccineMap[id] = v.antigen_name || v.name || v.label || v.label_name || ''
      })
    }

    // Map to the shape expected by the modal
    // Resolve guardian full name if guardian_id present
    let guardianInfo = {}
    try {
      if (p.guardian_id) {
        const gres = await api.get(`/guardians/${p.guardian_id}`).catch(() => ({ data: null }))
        const g = gres.data?.data || gres.data || null
        guardianInfo = g ? { full_name: g.full_name || `${g.firstname || ''} ${g.middlename || ''} ${g.surname || ''}`.trim() } : { full_name: p.guardian_name || p.guardian_fullname || '' }
      } else {
        guardianInfo = { full_name: p.guardian_name || p.guardian_fullname || '' }
      }
    } catch (e) {
      guardianInfo = { full_name: p.guardian_name || p.guardian_fullname || '' }
    }

    // Normalize schedule array and map vaccine names where possible
    const scheduleArr = Array.isArray(schedule) ? schedule : (schedule.data || [])
    const computeScheduleStatus = (s) => {
      // If backend already provided a definitive status, trust it for Completed/Missed
      if (s.status && ['Completed', 'Missed'].includes(s.status)) return s.status

      const scheduled = s.scheduled_date || s.scheduledDate || s.date || null
      if (!scheduled) return s.status || 'Scheduled'

      const grace = parseInt(s.grace_period || s.gracePeriod || s.dose_grace_days || 0, 10) || 0
      const scheduledDate = new Date(scheduled)
      const deadline = new Date(scheduledDate)
      deadline.setDate(deadline.getDate() + grace)
      const now = new Date()

      // If there is an actual/administered date, mark Completed
      if (s.actual_date || s.administered_date || s.date_administered) return 'Completed'

      if (now > deadline) return 'Missed'
      if (now >= scheduledDate) return 'Due'
      return 'Scheduled'
    }

    const normalizedSchedule = (scheduleArr || []).map(s => ({
      patient_schedule_id: s.patient_schedule_id || s.id || s.patient_schedule_id,
      vaccine_id: s.vaccine_id || s.vaccineId || (s.vaccine && (s.vaccine.vaccine_id || s.vaccine.id)) || null,
      vaccineName: s.vaccine_name || s.antigen_name || (s.vaccine && (s.vaccine.antigen_name || s.vaccine.name)) || (vaccineMap[s.vaccine_id] || vaccineMap[s.vaccineId] || ''),
      scheduledDate: s.scheduled_date || s.scheduledDate || s.date || null,
      doseNumber: s.dose_number || s.doseNumber || null,
      status: computeScheduleStatus(s),
      notes: s.notes || s.remarks || ''
    }))

    patientData.value = {
      patientInfo: {
        patient_id: p.patient_id || p.id || null,
        surname: p.surname || p.family_name || '',
        firstname: p.firstname || p.given_name || '',
        middlename: p.middlename || p.middle_name || '',
        sex: p.sex || p.gender || '',
        date_of_birth: p.date_of_birth || p.birth_date || null,
        address: p.address || '',
        barangay: p.barangay || '',
        health_center: p.health_center || p.clinic || '',
        relationship_to_guardian: p.relationship_to_guardian || ''
      },
      childInfo: {
        name: [p.firstname, p.middlename, p.surname].filter(Boolean).join(' ').trim(),
        sex: p.sex || p.gender || '',
        birthDate: p.date_of_birth || p.birth_date || '',
        birthWeightKg: p.birth_weight || p.birthWeight || null,
        birthLengthCm: p.birth_length || p.birthLength || null,
        placeOfBirth: p.place_of_birth || p.birth_place || '',
        address: p.address ? {
          street: p.address,
          barangay: p.barangay || '',
          municipality: p.municipality || '',
          province: p.province || '',
          zipCode: p.zip_code || ''
        } : { street: '', barangay: '', municipality: '', province: '', zipCode: '' },
        phoneNumber: p.contact_number || ''
      },
      guardianInfo: p.guardian || {
        full_name: p.guardian_name || p.guardian_fullname || ''
      },
      motherInfo: {
        name: p.mother_name || '',
        age: p.mother_age || null,
        educationLevel: p.mother_education || '',
        occupation: p.mother_occupation || '',
        phoneNumber: p.mother_contact_number || p.mother_phone || ''
      },
      fatherInfo: {
        name: p.father_name || '',
        age: p.father_age || null,
        educationLevel: p.father_education || '',
        occupation: p.father_occupation || '',
        phoneNumber: p.father_contact_number || p.father_phone || ''
      },
      medicalHistory: p.medical_history || {},
      vaccinationHistory: immunizations.map(im => ({
        immunization_id: im.immunization_id || im.id || null,
        vaccineId: im.vaccine_id || im.vaccineId || null,
        vaccineName: im.vaccine_name || im.vaccineName || im.vaccine?.antigen_name || '',
        diseasePrevented: im.disease_prevented || '',
        dateAdministered: im.administered_date || im.date_administered || im.administered_date_time || null,
        ageAtAdministration: im.age_at_administration || '',
        vaccineManufacturer: im.vaccine_manufacturer || im.manufacturer || '',
        lotNumber: im.lot_number || im.lot || '',
        siteOfAdministration: im.site_of_administration || im.site || '',
        healthWorker: im.administered_by || im.health_worker || '',
        remarks: im.remarks || ''
      })),
  nextScheduledVaccinations: normalizedSchedule,
      // Expose birth history fields (DB column names) for direct access in UI
      birthHistory: Object.assign({}, (p.birthhistory || p.medical_history || {}), {
        date_of_birth: (p.birthhistory && (p.birthhistory.date_of_birth || p.birthhistory.dob)) || p.date_of_birth || null,
        birth_weight: (p.birthhistory && p.birthhistory.birth_weight) || p.birth_weight || null,
        birth_length: (p.birthhistory && p.birthhistory.birth_length) || p.birth_length || null,
        place_of_birth: (p.birthhistory && p.birthhistory.place_of_birth) || p.place_of_birth || '',
        address_at_birth: (p.birthhistory && p.birthhistory.address_at_birth) || p.address_at_birth || ''
      })
    }
    // attach resolved guardian info
    patientData.value.guardianInfo = guardianInfo

  } catch (err) {
    console.error('Error fetching patient details:', err)
    error.value = err.response?.data?.message || 'Failed to load patient information'
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('close')
  // Reset data when closing
  patientData.value = null
  error.value = null
  showVaccinationEditor.value = false
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const printRecord = () => {
  window.print()
}

// Watch for show prop changes to fetch data when modal opens
watch(() => props.show, (newVal) => {
  if (newVal && props.patientId) {
    fetchPatientData()
  }
})

// Watch for patientId changes
watch(() => props.patientId, (newVal) => {
  if (props.show && newVal) {
    fetchPatientData()
  }
})
</script>

<style scoped>
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

code {
  background: #e9ecef;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

@media print {
  .modal-header,
  .modal-footer {
    display: none;
  }
  
  .modal-dialog {
    max-width: none;
    margin: 0;
  }
  
  .modal-content {
    border: none;
    box-shadow: none;
  }
}
</style>
