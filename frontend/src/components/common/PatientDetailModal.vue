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
        
        <!-- Loading State -->
        <div v-if="loading" class="modal-body text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">Loading patient information...</p>
        </div>

        <!-- Patient Data -->
        <div v-else-if="patientData" class="modal-body">
          <!-- Child Information -->
          <div class="row mb-4">
            <div class="col-12">
              <h6 class="text-primary fw-bold mb-3">
                <i class="bi bi-person-fill me-2"></i>Child Information
              </h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <strong>Full Name:</strong><br>
                  <span class="text-muted">{{ patientData.childInfo.name }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Sex:</strong><br>
                  <span class="text-muted">{{ patientData.childInfo.sex }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Birth Date:</strong><br>
                  <span class="text-muted">{{ formatDate(patientData.childInfo.birthDate) }}</span>
                </div>
                <div class="col-md-3">
                  <strong>Birth Weight:</strong><br>
                  <span class="text-muted">{{ patientData.childInfo.birthWeightKg }} kg</span>
                </div>
                <div class="col-md-3">
                  <strong>Birth Length:</strong><br>
                  <span class="text-muted">{{ patientData.childInfo.birthLengthCm }} cm</span>
                </div>
                <div class="col-md-6">
                  <strong>Place of Birth:</strong><br>
                  <span class="text-muted">{{ patientData.childInfo.placeOfBirth }}</span>
                </div>
                <div class="col-md-12">
                  <strong>Address:</strong><br>
                  <span class="text-muted">
                    {{ patientData.childInfo.address.street }}, 
                    {{ patientData.childInfo.address.barangay }}, 
                    {{ patientData.childInfo.address.municipality }}, 
                    {{ patientData.childInfo.address.province }} 
                    {{ patientData.childInfo.address.zipCode }}
                  </span>
                </div>
                <div class="col-md-6">
                  <strong>Phone Number:</strong><br>
                  <span class="text-muted">{{ patientData.childInfo.phoneNumber }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Parent Information -->
          <div class="row mb-4">
            <div class="col-md-6">
              <h6 class="text-primary fw-bold mb-3">
                <i class="bi bi-person-heart me-2"></i>Mother's Information
              </h6>
              <div class="row g-2">
                <div class="col-12">
                  <strong>Name:</strong><br>
                  <span class="text-muted">{{ patientData.motherInfo.name }}</span>
                </div>
                <div class="col-6">
                  <strong>Age:</strong><br>
                  <span class="text-muted">{{ patientData.motherInfo.age }}</span>
                </div>
                <div class="col-6">
                  <strong>Education:</strong><br>
                  <span class="text-muted">{{ patientData.motherInfo.educationLevel }}</span>
                </div>
                <div class="col-12">
                  <strong>Occupation:</strong><br>
                  <span class="text-muted">{{ patientData.motherInfo.occupation }}</span>
                </div>
                <div class="col-12">
                  <strong>Phone:</strong><br>
                  <span class="text-muted">{{ patientData.motherInfo.phoneNumber }}</span>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <h6 class="text-primary fw-bold mb-3">
                <i class="bi bi-person-check me-2"></i>Father's Information
              </h6>
              <div class="row g-2">
                <div class="col-12">
                  <strong>Name:</strong><br>
                  <span class="text-muted">{{ patientData.fatherInfo.name }}</span>
                </div>
                <div class="col-6">
                  <strong>Age:</strong><br>
                  <span class="text-muted">{{ patientData.fatherInfo.age }}</span>
                </div>
                <div class="col-6">
                  <strong>Education:</strong><br>
                  <span class="text-muted">{{ patientData.fatherInfo.educationLevel }}</span>
                </div>
                <div class="col-12">
                  <strong>Occupation:</strong><br>
                  <span class="text-muted">{{ patientData.fatherInfo.occupation }}</span>
                </div>
                <div class="col-12">
                  <strong>Phone:</strong><br>
                  <span class="text-muted">{{ patientData.fatherInfo.phoneNumber }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vaccination History -->
          <div class="row mb-4">
            <div class="col-12">
              <h6 class="text-primary fw-bold mb-3">
                <i class="bi bi-shield-check me-2"></i>Vaccination History
              </h6>
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>Vaccine Name</th>
                      <th>Disease Prevented</th>
                      <th>Date Administered</th>
                      <th>Age at Administration</th>
                      <th>Manufacturer</th>
                      <th>Lot Number</th>
                      <th>Site</th>
                      <th>Health Worker</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="vaccine in patientData.vaccinationHistory" :key="vaccine.lotNumber">
                      <td class="fw-semibold">{{ vaccine.vaccineName }}</td>
                      <td>{{ vaccine.diseasePrevented }}</td>
                      <td>{{ formatDate(vaccine.dateAdministered) }}</td>
                      <td>{{ vaccine.ageAtAdministration }}</td>
                      <td>{{ vaccine.vaccineManufacturer }}</td>
                      <td><code>{{ vaccine.lotNumber }}</code></td>
                      <td>{{ vaccine.siteOfAdministration }}</td>
                      <td>{{ vaccine.healthWorker }}</td>
                      <td>
                        <small class="text-muted">{{ vaccine.remarks }}</small>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Medical History -->
          <div class="row mb-4" v-if="patientData.medicalHistory">
            <div class="col-12">
              <h6 class="text-primary fw-bold mb-3">
                <i class="bi bi-clipboard-heart me-2"></i>Medical History
              </h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <strong>Birth Complications:</strong><br>
                  <span class="text-muted">{{ patientData.medicalHistory.birthComplications }}</span>
                </div>
                <div class="col-md-6">
                  <strong>Allergies:</strong><br>
                  <span class="text-muted">{{ patientData.medicalHistory.allergies }}</span>
                </div>
                <div class="col-md-6">
                  <strong>Chronic Conditions:</strong><br>
                  <span class="text-muted">{{ patientData.medicalHistory.chronicConditions }}</span>
                </div>
                <div class="col-md-6">
                  <strong>Nutritional Status:</strong><br>
                  <span class="text-muted">{{ patientData.medicalHistory.nutritionalStatus }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Next Scheduled Vaccinations -->
          <div class="row" v-if="patientData.nextScheduledVaccinations && patientData.nextScheduledVaccinations.length > 0">
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
                      <th>Age at Schedule</th>
                      <th>Dose Number</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="vaccine in patientData.nextScheduledVaccinations" :key="vaccine.vaccineName + vaccine.scheduledDate">
                      <td class="fw-semibold">{{ vaccine.vaccineName }}</td>
                      <td>{{ formatDate(vaccine.scheduledDate) }}</td>
                      <td>{{ vaccine.ageAtSchedule }}</td>
                      <td>{{ vaccine.doseNumber }}</td>
                      <td>
                        <span class="badge" :class="vaccine.status === 'Due' ? 'bg-warning text-dark' : 'bg-success'">
                          {{ vaccine.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="modal-body text-center py-5">
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
</template>

<script setup>
import { ref, watch, inject } from 'vue'
import api from '@/services/api'
import VaccinationRecordEditor from './VaccinationRecordEditor.vue'

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
const isAdmin = inject('isAdmin', () => false) // Inject user role, default to non-admin

const fetchPatientData = async () => {
  if (!props.patientId || props.patientId === null) return

  try {
    loading.value = true
    error.value = null
    patientData.value = null

    const response = await api.get(`/patients/${props.patientId}/details`)
    patientData.value = response.data.data
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
