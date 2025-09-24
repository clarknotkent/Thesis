<template>
  <div class="modal fade" :class="{ show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-shield-check me-2"></i>
            Manage Vaccination Records
          </h5>
          <button type="button" class="btn-close" @click="closeMainModal"></button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="modal-body text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">Loading vaccination records...</p>
        </div>

        <!-- Main Interface: Only show when NOT in visit context -->
        <div v-else-if="!visitContext" class="modal-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6 class="mb-0">
                <span class="fw-bold">Patient:</span> {{ patientData?.firstname }} {{ patientData?.surname }}
              </h6>
              <p class="text-muted small mb-0">
                {{ patientData?.sex }}, {{ calculateAge(patientData?.date_of_birth) }}
              </p>
            </div>

            <button class="btn btn-success btn-sm" @click="openNewVaccinationModal">
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
          <div class="mt-4">
            <h6 class="fw-bold mb-3">Upcoming Scheduled Vaccinations</h6>
            <div v-if="patientData?.nextScheduledVaccinations && patientData.nextScheduledVaccinations.length > 0" class="table-responsive">
              <table class="table table-bordered">
                <thead class="table-light">
                  <tr>
                    <th>Vaccine Name</th>
                    <th>Scheduled Date</th>
                    <th>Dose Number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(vaccine, index) in patientData.nextScheduledVaccinations" :key="index">
                    <td class="fw-semibold">{{ vaccine.vaccineName || 'Unknown' }}</td>
                    <td>{{ formatDate(vaccine.scheduledDate) || 'N/A' }}</td>
                    <td>{{ vaccine.doseNumber || 'N/A' }}</td>
                    <td>
                      <span class="badge" :class="getStatusBadgeClass(vaccine.status)">
                        {{ vaccine.status || 'Unknown' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              No upcoming scheduled vaccinations found for this patient.
              <br><small>This could mean all recommended vaccinations have been completed, or schedule data is not available.</small>
            </div>
          </div>
          
          <!-- Debug: Show raw schedule data -->
          <div class="mt-3 p-3 bg-light border rounded" v-if="showDebug">
            <h6 class="text-muted">Debug: Schedule Data</h6>
            <div class="row">
              <div class="col-md-6">
                <strong>Raw nextScheduledVaccinations:</strong>
                <pre class="small">{{ JSON.stringify(patientData?.nextScheduledVaccinations, null, 2) }}</pre>
              </div>
              <div class="col-md-6">
                <strong>Patient Data Keys:</strong>
                <pre class="small">{{ patientData ? Object.keys(patientData).join('\n') : 'No patient data' }}</pre>
                <strong>Patient DOB:</strong> {{ patientData?.date_of_birth || 'Not available' }}
                <br><strong>Patient ID:</strong> {{ patientData?.patient_id || props.patientId }}
                <br><strong>Array Length:</strong> {{ patientData?.nextScheduledVaccinations?.length || 0 }}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeMainModal">Close</button>
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
                <label class="form-label">Vaccine *</label>
                <select class="form-select" v-model="vaccinationForm.inventoryId" @change="onVaccineSelect" required>
                  <option value="">Select a vaccine stock</option>
                  <option v-for="v in vaccineOptions" :key="v.inventory_id" :value="v.inventory_id">
                    {{ v.display_name }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Disease Prevented</label>
                <input type="text" class="form-control" v-model="vaccinationForm.diseasePrevented" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Date Administered *</label>
                <input type="date" class="form-control" v-model="vaccinationForm.dateAdministered" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Age at Administration</label>
                <input type="text" class="form-control" v-model="vaccinationForm.ageAtAdministration" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Manufacturer</label>
                <input type="text" class="form-control" v-model="vaccinationForm.vaccineManufacturer" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Lot Number</label>
                <input type="text" class="form-control" v-model="vaccinationForm.lotNumber" readonly>
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
                <select class="form-select" v-model="vaccinationForm.healthWorkerId" required>
                  <option value="">Select health worker</option>
                  <option v-for="hw in nurses" :key="hw.id || hw.health_worker_id" :value="hw.id || hw.health_worker_id">
                    {{ hw.name }} ({{ hw.hw_type }})
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
import { ref, watch, onMounted, computed } from 'vue';
import api from '@/services/api';
import { useToast } from '@/composables/useToast'

console.log('API service imported:', api);

const { addToast } = useToast();

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: String,
    default: ''
  },
  patientData: {
    type: Object,
    default: null
  },
  visitContext: {
    type: Boolean,
    default: false
  }
});

console.log('VaccinationRecordEditor props:', { show: props.show, patientId: props.patientId });

const emit = defineEmits(['close', 'update', 'vaccinations-collected']);

// State management
const loading = ref(false);
const saving = ref(false);
const patientData = ref(null);
const vaccineOptions = ref([]);
const healthWorkers = ref([]);
const nurses = ref([]);
const showNewVaccinationModal = ref(false);
const showEditVaccinationModal = ref(false);
const currentEditIndex = ref(-1);
const showDebug = ref(true); // Enable debug mode
const collectedVaccinations = ref([]); // Store vaccinations collected in visit context

// Form for vaccination record
const vaccinationForm = ref({
  inventoryId: '',
  vaccineName: '',
  diseasePrevented: '',
  dateAdministered: new Date().toISOString().split('T')[0], // Default to today
  ageAtAdministration: '',
  vaccineManufacturer: '',
  lotNumber: '',
  siteOfAdministration: '',
  healthWorkerId: '',
  facilityName: '',
  remarks: ''
});

// Initialize default form for new vaccination record
const initVaccinationForm = () => {
  vaccinationForm.value = {
    inventoryId: '',
    vaccineName: '',
    diseasePrevented: '',
    dateAdministered: new Date().toISOString().split('T')[0],
    ageAtAdministration: '',
    vaccineManufacturer: '',
    lotNumber: '',
    siteOfAdministration: '',
    healthWorkerId: '',
    facilityName: '',
    remarks: ''
  };
};

// Fetch patient data
const fetchPatientData = async () => {
  if (!props.patientId) {
    console.log('No patientId provided to component');
    return;
  }

  // If patient data is provided as prop, use it directly
  if (props.patientData) {
    console.log('Using patient data from props:', props.patientData);
    patientData.value = props.patientData;
    console.log('Patient DOB from props:', patientData.value?.date_of_birth);
    return;
  }

  try {
    loading.value = true;
    console.log('Fetching patient data for patientId:', props.patientId);
    console.log('Making API call to:', `/patients/${props.patientId}/details`);
    
    // Fetch patient details and vaccine list in parallel to normalize names
    const [resp, vaccinesResp] = await Promise.all([
      api.get(`/patients/${props.patientId}`).catch((error) => {
        console.error('Error fetching patient details:', error);
        // Try the details endpoint as fallback
        return api.get(`/patients/${props.patientId}/details`).catch((detailsError) => {
          console.error('Error fetching patient details from fallback endpoint:', detailsError);
          return { data: null };
        });
      }),
      api.get('/vaccines').catch((error) => {
        console.error('Error fetching vaccines:', error);
        return { data: [] };
      })
    ])

    console.log('Raw nextScheduledVaccinations:', resp.data?.data?.nextScheduledVaccinations);
    console.log('First raw schedule item:', resp.data?.data?.nextScheduledVaccinations?.[0]);
    console.log('All keys in first schedule item:', resp.data?.data?.nextScheduledVaccinations?.[0] ? Object.keys(resp.data?.data?.nextScheduledVaccinations[0]) : 'No data');

    patientData.value = resp.data?.data || null
    console.log('Patient data set to:', patientData.value);
    console.log('Patient DOB:', patientData.value?.date_of_birth);
    const vaccinesList = vaccinesResp.data || []
    const vaccineLookup = {}
    if (Array.isArray(vaccinesList)) {
      vaccinesList.forEach(v => {
        const id = v.vaccine_id || v.id
        vaccineLookup[id] = v.antigen_name || v.name || v.label || ''
      })
    }

    // Normalize vaccinationHistory entries to include vaccineName where missing
    if (patientData.value?.vaccinationHistory && Array.isArray(patientData.value.vaccinationHistory)) {
      patientData.value.vaccinationHistory = patientData.value.vaccinationHistory.map(im => ({
        ...im,
        vaccineId: im.vaccineId || im.vaccine_id || (im.vaccine && (im.vaccine.vaccine_id || im.vaccine.id)) || null,
        vaccineName: im.vaccineName || im.vaccine_name || (im.vaccine && (im.vaccine.antigen_name || im.vaccine.name)) || vaccineLookup[im.vaccineId] || vaccineLookup[im.vaccine_id] || ''
      }))
    }

    // Normalize nextScheduledVaccinations similarly
    if (patientData.value?.nextScheduledVaccinations && Array.isArray(patientData.value.nextScheduledVaccinations)) {
      patientData.value.nextScheduledVaccinations = patientData.value.nextScheduledVaccinations.map(s => ({
        ...s,
        vaccineId: s.vaccineId || s.vaccine_id || s.vaccine_id || null,
        vaccineName: s.vaccineName || s.vaccine_name || s.antigen_name || (s.vaccine && (s.vaccine.antigen_name || s.vaccine.name)) || vaccineLookup[s.vaccineId] || vaccineLookup[s.vaccine_id] || '',
        scheduledDate: s.scheduledDate || s.scheduled_date || s.due_date,
        ageAtSchedule: s.ageAtSchedule || s.age_at_schedule || s.scheduled_age,
        doseNumber: s.doseNumber || s.dose_number || s.dose || 1,
        status: s.status || s.schedule_status || 'pending'
      }))
    }
    
    console.log('Normalized nextScheduledVaccinations:', patientData.value?.nextScheduledVaccinations);
    console.log('First schedule item:', patientData.value?.nextScheduledVaccinations?.[0]);
  } catch (error) {
    console.error('Error fetching patient details:', error);
    addToast({ title: 'Error', message: 'Failed to load patient data. Please try again.', type: 'error' })
  } finally {
    loading.value = false;
    // Recalculate age if modal is open and form has date
    if ((showNewVaccinationModal.value || showEditVaccinationModal.value) && vaccinationForm.value.dateAdministered) {
      console.log('Recalculating age in finally block');
      calculateAgeAtAdministration();
    }
  }
};

// Fetch vaccine options (inventory/stocks)
const fetchVaccineOptions = async () => {
  try {
    const response = await api.get('/vaccines/inventory');
    // Accept both .data.data and .data as array
    const list = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
    vaccineOptions.value = list.map(v => ({
      inventory_id: v.inventory_id || v.id,
      vaccine_id: v.vaccine_id,
      antigen_name: v.vaccinemaster?.antigen_name || v.antigen_name || 'Unknown',
      lot_number: v.lot_number || '',
      manufacturer: v.vaccinemaster?.manufacturer || v.manufacturer || '',
      disease_prevented: v.vaccinemaster?.disease_prevented || '',
      expiration_date: v.expiration_date || '',
      current_stock_level: v.current_stock_level || 0,
      display_name: `${v.vaccinemaster?.antigen_name || 'Unknown'} (${v.vaccinemaster?.disease_prevented || 'Unknown'}) - Lot: ${v.lot_number || 'N/A'} - Expires: ${v.expiration_date ? new Date(v.expiration_date).toLocaleDateString() : 'N/A'} - ${v.vaccinemaster?.manufacturer || 'Unknown'}`
    }));
  } catch (error) {
    console.error('Error fetching vaccine inventory:', error);
    vaccineOptions.value = [];
  }
};

// Fetch health workers
const fetchHealthWorkers = async () => {
  try {
    const resp = await api.get('/health-workers');
    
    // Handle different possible response structures - prioritize new backend structure
    let allWorkers = [];
    if (resp.data?.data?.healthWorkers && Array.isArray(resp.data.data.healthWorkers)) {
      allWorkers = resp.data.data.healthWorkers;
    } else if (Array.isArray(resp.data)) {
      allWorkers = resp.data;
    } else if (resp.data?.data && Array.isArray(resp.data.data)) {
      allWorkers = resp.data.data;
    } else if (resp.data?.users && Array.isArray(resp.data.users)) {
      allWorkers = resp.data.users;
    } else if (resp.data?.healthWorkers && Array.isArray(resp.data.healthWorkers)) {
      allWorkers = resp.data.healthWorkers;
    } else {
      console.warn('Unexpected health workers response structure:', resp.data);
      allWorkers = [];
    }
    
    // Filter BHW for visit recording (if needed for other contexts)
    healthWorkers.value = allWorkers.filter(hw => {
      const hwType = hw.hw_type || hw.role || hw.type || '';
      return hwType.toLowerCase().includes('bhw');
    }).map(hw => ({
      id: hw.user_id || hw.id || hw.health_worker_id,
      health_worker_id: hw.health_worker_id || hw.user_id || hw.id,
      name: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
      role: hw.hw_type || hw.role || hw.type
    }));
    
    // Filter nurses and nutritionists for vaccination administration
    nurses.value = allWorkers.filter(hw => {
      const hwType = hw.hw_type || hw.role || hw.type || '';
      return hwType.toLowerCase().includes('nurse') || hwType.toLowerCase().includes('nutritionist');
    }).map(hw => ({
      id: hw.user_id || hw.id || hw.health_worker_id,
      health_worker_id: hw.health_worker_id || hw.user_id || hw.id,
      name: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
      role: hw.hw_type || hw.role || hw.type,
      hw_type: hw.hw_type || hw.role || hw.type
    }));
    
    console.log('Health workers filtered:', { 
      bhw: healthWorkers.value.length, 
      nursesAndNutritionists: nurses.value.length,
      availableTypes: [...new Set(allWorkers.map(hw => hw.hw_type || hw.role || hw.type))]
    });
  } catch (err) {
    console.error('Error fetching health workers:', err);
    healthWorkers.value = [];
    nurses.value = [];
  }
}

// When a vaccine is selected, autofill details from vaccineOptions
const onVaccineSelect = () => {
  const iid = vaccinationForm.value.inventoryId;
  console.log('Vaccine selected with inventory ID:', iid);
  if (!iid) {
    vaccinationForm.value.diseasePrevented = '';
    vaccinationForm.value.vaccineManufacturer = '';
    vaccinationForm.value.vaccineName = '';
    vaccinationForm.value.lotNumber = '';
    return;
  }
  const v = (vaccineOptions.value || []).find(x => x.inventory_id === iid);
  if (v) {
    vaccinationForm.value.diseasePrevented = v.disease_prevented || '';
    vaccinationForm.value.vaccineManufacturer = v.manufacturer || '';
    vaccinationForm.value.vaccineName = v.antigen_name || '';
    vaccinationForm.value.lotNumber = v.lot_number || '';
  }
  // Calculate age at administration
  console.log('Recalculating age after vaccine selection');
  calculateAgeAtAdministration();
}

// Calculate age at administration based on patient's DOB and selected date
const calculateAgeAtAdministration = () => {
  if (!patientData.value) {
    console.log('Patient data not loaded yet, skipping age calculation');
    return; // Don't calculate if patient data not loaded yet
  }
  
  const dob = patientData.value?.date_of_birth;
  const adminDate = vaccinationForm.value.dateAdministered;
  
  console.log('Calculating age at administration:', { 
    dob, 
    adminDate, 
    patientDataLoaded: !!patientData.value,
    fullPatientData: patientData.value 
  });
  
  if (!dob || !adminDate) {
    console.log('Missing DOB or admin date, setting age to empty');
    vaccinationForm.value.ageAtAdministration = '';
    return;
  }
  
  try {
    const birth = new Date(dob);
    const admin = new Date(adminDate);
    
    if (isNaN(birth.getTime()) || isNaN(admin.getTime())) {
      vaccinationForm.value.ageAtAdministration = '';
      return;
    }
    
    // Calculate age in months and days
    let totalMonths = (admin.getFullYear() - birth.getFullYear()) * 12 + (admin.getMonth() - birth.getMonth());
    let days = admin.getDate() - birth.getDate();
    
    // Adjust for negative days
    if (days < 0) {
      totalMonths--;
      // Calculate days in previous month
      const prevMonth = new Date(admin.getFullYear(), admin.getMonth() - 1, 1);
      const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
      days += daysInPrevMonth;
    }
    
    // Ensure totalMonths is not negative
    if (totalMonths < 0) {
      totalMonths = 0;
    }
    
    // Build age string in months and days format
    if (totalMonths === 0 && days === 0) {
      vaccinationForm.value.ageAtAdministration = '0 days';
    } else {
      const monthsPart = totalMonths > 0 ? `${totalMonths} month${totalMonths !== 1 ? 's' : ''}` : '';
      const daysPart = days > 0 ? `${days} day${days !== 1 ? 's' : ''}` : '';
      
      if (monthsPart && daysPart) {
        vaccinationForm.value.ageAtAdministration = `${monthsPart} ${daysPart}`;
      } else if (monthsPart) {
        vaccinationForm.value.ageAtAdministration = monthsPart;
      } else {
        vaccinationForm.value.ageAtAdministration = daysPart;
      }
    }
    
    console.log('Calculated age:', vaccinationForm.value.ageAtAdministration);
  } catch (error) {
    console.error('Error calculating age:', error);
    vaccinationForm.value.ageAtAdministration = '';
  }
}

// Open new vaccination modal and initialize form
const openNewVaccinationModal = () => {
  console.log('Opening new vaccination modal');
  initVaccinationForm();
  showNewVaccinationModal.value = true;
  // Calculate age immediately after opening modal
  calculateAgeAtAdministration();
}

// Edit vaccination record
const editVaccinationRecord = async (index) => {
  console.log('Editing vaccination record at index:', index);
  if (!patientData.value?.vaccinationHistory?.[index]) {
    console.log('No vaccination record found at index:', index);
    return;
  }
  
  // Refresh patient data to ensure schedules are up to date
  await fetchPatientData();
  
  const record = patientData.value.vaccinationHistory[index];
  vaccinationForm.value = { ...record };
  // Ensure vaccineId and healthWorkerId are set for the select inputs
  vaccinationForm.value.vaccineId = record.vaccineId || record.vaccine_id || (record.vaccine && (record.vaccine.vaccine_id || record.vaccine.id)) || '';
  vaccinationForm.value.healthWorkerId = record.administered_by || record.healthWorkerId || '';
  
  // Format date for input
  if (record.dateAdministered) {
    vaccinationForm.value.dateAdministered = new Date(record.dateAdministered)
      .toISOString().split('T')[0];
  }
  
  currentEditIndex.value = index;
  showEditVaccinationModal.value = true;
  
  // Calculate age at administration after modal is shown and form is set up
  calculateAgeAtAdministration();
};

// Delete vaccination record by immunization id
const deleteVaccinationRecord = async (index) => {
  if (!patientData.value?.vaccinationHistory?.[index]) return;

  const vaccine = patientData.value.vaccinationHistory[index];
  const confirmMsg = `Are you sure you want to delete the vaccination record for ${vaccine.vaccineName}?
This action cannot be undone.`;

  if (confirm(confirmMsg)) {
    try {
      saving.value = true;
      if (vaccine.immunization_id) {
        await api.delete(`/immunizations/${vaccine.immunization_id}`);
      } else {
        // Fallback: send delete by patient and matching lot/date
        await api.delete(`/patients/${props.patientId}/vaccinations`, { data: { lotNumber: vaccine.lotNumber, dateAdministered: vaccine.dateAdministered } });
      }
      
      // Update schedule statuses in the database after vaccination deletion
      try {
        await api.post(`/patients/${props.patientId}/update-schedules`);
        console.log('Schedule statuses updated in database after deletion');
      } catch (scheduleError) {
        console.error('Error updating schedule statuses after deletion:', scheduleError);
        // Don't fail the whole operation if schedule update fails
      }
      
      await fetchPatientData(); // Refresh data
      emit('update'); // Notify parent component
    } catch (error) {
      console.error('Error deleting vaccination record:', error);
      addToast({ title: 'Error', message: 'Failed to delete vaccination record. Please try again.', type: 'error' })
    } finally {
      saving.value = false;
    }
  }
};

// Save vaccination record (add new or update existing)
const saveVaccinationRecord = async () => {
  try {
    saving.value = true;

    // If in visit context, save to database and emit the vaccination data for the visit
    if (props.visitContext) {
      // Save to database first
      const response = await fetch('/api/vaccination-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: props.patientId,
          inventory_id: vaccinationForm.value.inventoryId,
          vaccine_name: vaccinationForm.value.vaccineName,
          disease_prevented: vaccinationForm.value.diseasePrevented,
          administered_date: vaccinationForm.value.dateAdministered,
          age_at_administration: vaccinationForm.value.ageAtAdministration,
          vaccine_manufacturer: vaccinationForm.value.vaccineManufacturer,
          lot_number: vaccinationForm.value.lotNumber,
          site_of_administration: vaccinationForm.value.siteOfAdministration,
          administered_by: vaccinationForm.value.healthWorkerId,
          facility_name: vaccinationForm.value.facilityName,
          remarks: vaccinationForm.value.remarks
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save vaccination record');
      }

      const savedVaccination = await response.json();

      // Emit the saved vaccination data to parent component for visit reference
      emit('vaccinations-collected', [savedVaccination]);

      addToast({ title: 'Success', message: 'Vaccination administered and recorded', type: 'success' });
      closeVaccinationModal();
      // Close the main modal as well since we're done
      emit('close');
      return;
    }

    // Normal database save logic for standalone vaccination editing
    if (showEditVaccinationModal.value && currentEditIndex.value >= 0) {
      // Update existing immunization by id
      const existing = patientData.value.vaccinationHistory[currentEditIndex.value];
      if (existing && existing.immunization_id) {
        await api.put(`/immunizations/${existing.immunization_id}`, {
          vaccine_id: vaccinationForm.value.vaccineId || vaccinationForm.value.vaccineId,
          administered_date: vaccinationForm.value.dateAdministered,
          lot_number: vaccinationForm.value.lotNumber,
          manufacturer: vaccinationForm.value.vaccineManufacturer,
          site_of_administration: vaccinationForm.value.siteOfAdministration,
          administered_by: vaccinationForm.value.healthWorkerId,
          facility_name: vaccinationForm.value.facilityName,
          remarks: vaccinationForm.value.remarks
        });
      } else {
        // Fallback: replace via patient vaccinations endpoint
        const updatedRecords = [...patientData.value.vaccinationHistory];
        updatedRecords[currentEditIndex.value] = { ...vaccinationForm.value };
        await api.put(`/patients/${props.patientId}/vaccinations`, { vaccinationHistory: updatedRecords });
      }
    } else {
      // Create new immunization (associate to patient)
      // Send minimal fields; backend will compute age_at_administration from patient's DOB and administered_date
      await api.post(`/immunizations`, {
        patient_id: props.patientId,
        vaccine_id: vaccinationForm.value.vaccineId,
        administered_date: vaccinationForm.value.dateAdministered,
        lot_number: vaccinationForm.value.lotNumber,
        manufacturer: vaccinationForm.value.vaccineManufacturer,
        site_of_administration: vaccinationForm.value.siteOfAdministration,
        administered_by: vaccinationForm.value.healthWorkerId,
        facility_name: vaccinationForm.value.facilityName,
        remarks: vaccinationForm.value.remarks
      });
    }

    // Update schedule statuses in the database after vaccination changes
    try {
      await api.post(`/patients/${props.patientId}/update-schedules`);
      console.log('Schedule statuses updated in database');
    } catch (scheduleError) {
      console.error('Error updating schedule statuses:', scheduleError);
      // Don't fail the whole operation if schedule update fails
    }

    await fetchPatientData(); // Refresh data
    emit('update'); // Notify parent component
    closeVaccinationModal();
  } catch (error) {
    console.error('Error saving vaccination record:', error);
    addToast({ title: 'Error', message: 'Failed to save vaccination record. Please try again.', type: 'error' })
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

// Close main modal
const closeMainModal = () => {
  // If in visit context, emit collected vaccinations before closing
  if (props.visitContext && collectedVaccinations.value.length > 0) {
    emit('vaccinations-collected', collectedVaccinations.value);
  }
  emit('close');
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

const getStatusBadgeClass = (status) => {
  if (!status) return 'bg-secondary';
  
  const statusLower = status.toString().toLowerCase().trim();
  console.log('Processing status:', status, '->', statusLower);
  
  switch (statusLower) {
    case 'due':
    case 'due now':
    case 'scheduled':
      return 'bg-warning text-dark';
    case 'overdue':
    case 'past due':
    case 'late':
      return 'bg-danger';
    case 'completed':
    case 'done':
    case 'administered':
    case 'given':
      return 'bg-success';
    case 'upcoming':
    case 'future':
    case 'pending':
      return 'bg-info';
    case 'missed':
    case 'skipped':
      return 'bg-secondary';
    default:
      console.log('Unknown status:', statusLower);
      return 'bg-secondary';
  }
};

// Watch for show prop changes to fetch data when modal opens
watch(() => props.show, (newVal) => {
  console.log('Show prop changed to:', newVal, 'patientId:', props.patientId);
  if (newVal && props.patientId) {
    fetchPatientData();
    fetchVaccineOptions();
    fetchHealthWorkers();
  }
});

// Watch for date changes to recalculate age
watch(() => vaccinationForm.value.dateAdministered, (newDate) => {
  console.log('Date administered changed to:', newDate);
  calculateAgeAtAdministration();
});

onMounted(() => {
  console.log('VaccinationRecordEditor mounted with props:', { show: props.show, patientId: props.patientId, visitContext: props.visitContext });
  if (props.show && props.patientId) {
    fetchPatientData();
    fetchVaccineOptions();
    fetchHealthWorkers();

    // If in visit context, automatically open the add vaccination modal
    if (props.visitContext) {
      console.log('Opening add vaccination modal automatically for visit context');
      setTimeout(() => {
        openNewVaccinationModal();
      }, 500); // Small delay to ensure data is loaded
    }
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
