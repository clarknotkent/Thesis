<template>
  <div class="modal fade" :class="{ show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-shield-check me-2"></i>
            Manage Vaccination Records
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="modal-body text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">Loading vaccination records...</p>
        </div>

        <!-- Patient Info -->
        <div v-else class="modal-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6 class="mb-0">
                <span class="fw-bold">Patient:</span> {{ patientData?.childInfo?.name }}
              </h6>
              <p class="text-muted small mb-0">
                {{ patientData?.childInfo?.sex }}, {{ calculateAge(patientData?.childInfo?.birthDate) }}
              </p>
            </div>

            <button class="btn btn-success btn-sm" @click="showNewVaccinationModal = true">
              <i class="bi bi-plus-circle me-1"></i> Add Vaccination Record
            </button>
          </div>

          <!-- Vaccination History Table -->
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-dark">
                <tr>
                  <th>#</th>
                  <th>Vaccine Name</th>
                  <th>Disease Prevented</th>
                  <th>Date Administered</th>
                  <th>Age at Administration</th>
                  <th>Manufacturer</th>
                  <th>Lot Number</th>
                  <th>Health Worker</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(vaccine, index) in patientData?.vaccinationHistory" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td class="fw-semibold">{{ vaccine.vaccineName }}</td>
                  <td>{{ vaccine.diseasePrevented }}</td>
                  <td>{{ formatDate(vaccine.dateAdministered) }}</td>
                  <td>{{ vaccine.ageAtAdministration }}</td>
                  <td>{{ vaccine.vaccineManufacturer }}</td>
                  <td><code>{{ vaccine.lotNumber }}</code></td>
                  <td>{{ vaccine.healthWorker }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click="editVaccinationRecord(index)" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-danger" @click="deleteVaccinationRecord(index)" title="Delete">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!patientData?.vaccinationHistory || patientData.vaccinationHistory.length === 0">
                  <td colspan="9" class="text-center py-4 text-muted">
                    <i class="bi bi-shield-exclamation me-2"></i>
                    No vaccination records found for this patient
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Next Scheduled Vaccinations -->
          <div class="mt-4" v-if="patientData?.nextScheduledVaccinations && patientData.nextScheduledVaccinations.length > 0">
            <h6 class="fw-bold mb-3">Upcoming Scheduled Vaccinations</h6>
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
                  <tr v-for="(vaccine, index) in patientData.nextScheduledVaccinations" :key="index">
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

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Add/Edit Vaccination Record Modal -->
  <div class="modal fade" :class="{ show: showNewVaccinationModal || showEditVaccinationModal }" 
       :style="{ display: (showNewVaccinationModal || showEditVaccinationModal) ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-shield-plus me-2"></i>
            {{ showEditVaccinationModal ? 'Edit' : 'Add New' }} Vaccination Record
          </h5>
          <button type="button" class="btn-close" @click="closeVaccinationModal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveVaccinationRecord">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Vaccine Name *</label>
                <select class="form-select" v-model="vaccinationForm.vaccineId" required>
                  <option value="">Select a vaccine</option>
                  <option v-for="vaccine in vaccineOptions" :key="vaccine.vaccine_id" :value="Number(vaccine.vaccine_id)">
                    {{ vaccine.antigen_name || vaccine.vaccineName || 'Unknown' }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Disease Prevented *</label>
                <input type="text" class="form-control" v-model="vaccinationForm.diseasePrevented" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Date Administered *</label>
                <input type="date" class="form-control" v-model="vaccinationForm.dateAdministered" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Age at Administration</label>
                <input type="text" class="form-control" v-model="vaccinationForm.ageAtAdministration">
              </div>
              <div class="col-md-6">
                <label class="form-label">Manufacturer *</label>
                <input type="text" class="form-control" v-model="vaccinationForm.vaccineManufacturer" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Lot Number *</label>
                <input type="text" class="form-control" v-model="vaccinationForm.lotNumber" required>
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
              <div class="col-md-6">
                <label class="form-label">Health Worker *</label>
                <input type="text" class="form-control" v-model="vaccinationForm.healthWorker" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Facility Name</label>
                <input type="text" class="form-control" v-model="vaccinationForm.facilityName">
              </div>
              <div class="col-md-6">
                <label class="form-label">Remarks</label>
                <textarea class="form-control" rows="2" v-model="vaccinationForm.remarks"></textarea>
              </div>
            </div>

            <div class="mt-4 text-muted small">
              <i class="bi bi-info-circle me-1"></i>
              Fields marked with * are required
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeVaccinationModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                {{ showEditVaccinationModal ? 'Update' : 'Add' }} Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Backdrop -->
  <div v-if="show || showNewVaccinationModal || showEditVaccinationModal" class="modal-backdrop fade show"></div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import api from '@/services/api';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'update']);

// State management
const loading = ref(false);
const saving = ref(false);
const patientData = ref(null);
const vaccineOptions = ref([]);
const showNewVaccinationModal = ref(false);
const showEditVaccinationModal = ref(false);
const currentEditIndex = ref(-1);

// Form for vaccination record
const vaccinationForm = ref({
  vaccineName: '',
  diseasePrevented: '',
  dateAdministered: new Date().toISOString().split('T')[0], // Default to today
  ageAtAdministration: '',
  vaccineManufacturer: '',
  lotNumber: '',
  siteOfAdministration: '',
  healthWorker: '',
  facilityName: '',
  remarks: ''
});

// Initialize default form for new vaccination record
const initVaccinationForm = () => {
  vaccinationForm.value = {
    vaccineName: '',
    diseasePrevented: '',
    dateAdministered: new Date().toISOString().split('T')[0],
    ageAtAdministration: '',
    vaccineManufacturer: '',
    lotNumber: '',
    siteOfAdministration: '',
    healthWorker: '',
    facilityName: '',
    remarks: ''
  };
};

// Fetch patient data
const fetchPatientData = async () => {
  if (!props.patientId) return;

  try {
    loading.value = true;
    const response = await api.get(`/patients/${props.patientId}/details`);
    patientData.value = response.data.data;
  } catch (error) {
    console.error('Error fetching patient details:', error);
    alert('Failed to load patient data. Please try again.');
  } finally {
    loading.value = false;
  }
};

// Fetch vaccine options
const fetchVaccineOptions = async () => {
  try {
    const response = await api.get('/vaccines/stock');
    vaccineOptions.value = response.data.data;
  } catch (error) {
    console.error('Error fetching vaccines:', error);
  }
};

// Edit vaccination record
const editVaccinationRecord = (index) => {
  if (!patientData.value?.vaccinationHistory?.[index]) return;
  
  const record = patientData.value.vaccinationHistory[index];
  vaccinationForm.value = { ...record };
  
  // Format date for input
  if (record.dateAdministered) {
    vaccinationForm.value.dateAdministered = new Date(record.dateAdministered)
      .toISOString().split('T')[0];
  }
  
  currentEditIndex.value = index;
  showEditVaccinationModal.value = true;
};

// Delete vaccination record
const deleteVaccinationRecord = async (index) => {
  if (!patientData.value?.vaccinationHistory?.[index]) return;
  
  const vaccine = patientData.value.vaccinationHistory[index];
  const confirmMsg = `Are you sure you want to delete the vaccination record for ${vaccine.vaccineName}?
This action cannot be undone.`;
  
  if (confirm(confirmMsg)) {
    try {
      saving.value = true;
      await api.delete(`/patients/${props.patientId}/vaccinations/${index}`);
      await fetchPatientData(); // Refresh data
      emit('update'); // Notify parent component
    } catch (error) {
      console.error('Error deleting vaccination record:', error);
      alert('Failed to delete vaccination record. Please try again.');
    } finally {
      saving.value = false;
    }
  }
};

// Save vaccination record (add new or update existing)
const saveVaccinationRecord = async () => {
  try {
    saving.value = true;
    
    if (showEditVaccinationModal.value && currentEditIndex.value >= 0) {
      // Update existing record in the array
      const updatedRecords = [...patientData.value.vaccinationHistory];
      updatedRecords[currentEditIndex.value] = { ...vaccinationForm.value };
      
      // Send the entire updated array to the backend
      await api.put(`/patients/${props.patientId}/vaccinations`, { 
        vaccinationHistory: updatedRecords 
      });
    } else {
      // Add new record
      await api.post(`/patients/${props.patientId}/vaccinations`, vaccinationForm.value);
    }
    
    await fetchPatientData(); // Refresh data
    emit('update'); // Notify parent component
    closeVaccinationModal();
  } catch (error) {
    console.error('Error saving vaccination record:', error);
    alert('Failed to save vaccination record. Please try again.');
  } finally {
    saving.value = false;
  }
};

// Close vaccination modal and reset form
const closeVaccinationModal = () => {
  showNewVaccinationModal.value = false;
  showEditVaccinationModal.value = false;
  currentEditIndex.value = -1;
  initVaccinationForm();
};

// Helper functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const calculateAge = (birthDate) => {
  if (!birthDate) return '';
  
  const birth = new Date(birthDate);
  const today = new Date();
  const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  
  if (ageInMonths < 12) {
    return `${ageInMonths} months`;
  } else {
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    return months > 0 ? `${years}y ${months}m` : `${years} years`;
  }
};

// Watch for show prop changes to fetch data when modal opens
watch(() => props.show, (newVal) => {
  if (newVal && props.patientId) {
    fetchPatientData();
    fetchVaccineOptions();
  }
});

// Watch for patientId changes
watch(() => props.patientId, (newVal) => {
  if (props.show && newVal) {
    fetchPatientData();
  }
});

onMounted(() => {
  if (props.show && props.patientId) {
    fetchPatientData();
    fetchVaccineOptions();
  }
});
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

.btn-group .btn {
  border-radius: 0.25rem;
  margin-right: 0.125rem;
}

.btn-group .btn:last-child {
  margin-right: 0;
}
</style>
