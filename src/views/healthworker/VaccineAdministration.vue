<template>
  <HealthWorkerLayout>
    <AppPageHeader
      title="Vaccine Administration"
      subtitle="Record vaccine administration and schedule follow-ups"
      :breadcrumbs="breadcrumbs"
    />

    <div class="row g-4">
      <!-- Patient Selection -->
      <div class="col-lg-4">
        <AppCard class="sticky-top hw-form-section">
          <template #header>
            <div class="bg-primary text-white">
              <h5 class="mb-0">
                <i class="bi bi-person me-2"></i>
                Select Patient
              </h5>
            </div>
          </template>
          <AppSearchFilter
            v-model="patientSearch"
            placeholder="Search patient..."
            :show-filters="false"
            class="mb-3"
          />
          
          <div v-if="selectedPatient" class="selected-patient">
            <AppCard class="bg-light">
              <h6 class="card-title fw-bold">
                {{ selectedPatient.name }}
                <span class="badge bg-info ms-2">Child</span>
              </h6>
              <p class="mb-1">ID: {{ selectedPatient.id }}</p>
              <p class="mb-1">Age: {{ selectedPatient.age }} years</p>
              <div class="mt-3 mb-2 border-top pt-2">
                <h6 class="fw-bold">
                  <i class="bi bi-person-circle me-1"></i>
                  Parent/Guardian
                </h6>
                <p class="mb-1">{{ selectedPatient.parent.name }}</p>
                <p class="mb-1">Phone: {{ selectedPatient.parent.phone }}</p>
                <p class="mb-0">Relation: {{ selectedPatient.parent.relation }}</p>
              </div>
            </AppCard>
          </div>
          
          <div v-else class="patient-list">
            <div 
              v-for="patient in filteredPatients" 
              :key="patient.id"
              class="patient-item p-3 border-bottom cursor-pointer"
              @click="selectPatient(patient)"
            >
              <strong>{{ patient.name }}</strong> 
              <span class="badge bg-info ms-2">Child</span>
              <div class="d-flex justify-content-between mt-1">
                <small class="text-muted">{{ patient.id }}</small>
                <small class="text-muted">{{ patient.age }} years</small>
              </div>
              <small class="d-block text-muted mt-1">
                <i class="bi bi-person-circle me-1"></i>
                Parent: {{ patient.parent.name }}
              </small>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Administration Form -->
      <div class="col-lg-8">
        <AppCard class="hw-form-section">
          <template #header>
            <div class="bg-success text-white">
              <h5 class="mb-0">
                <i class="bi bi-syringe me-2"></i>
                Administration Details
              </h5>
            </div>
          </template>
          <form @submit.prevent="administerVaccine">
            <!-- Vaccine Selection -->
            <div class="row mb-3">
              <div class="col-md-8">
                <label class="form-label fw-bold">Vaccine Type *</label>
                <select class="form-select form-select-lg hw-search-input" v-model="administrationForm.vaccineId" required>
                  <option value="">Select Vaccine...</option>
                  <option 
                    v-for="vaccine in availableVaccines" 
                    :key="vaccine.id"
                    :value="vaccine.id"
                    :disabled="vaccine.quantity === 0"
                  >
                    {{ vaccine.name }} - {{ vaccine.manufacturer }} 
                    ({{ vaccine.quantity }} available)
                  </option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-bold">Batch Number</label>
                <input 
                  type="text" 
                  class="form-control form-control-lg hw-search-input" 
                  v-model="administrationForm.batchNumber"
                  readonly
                >
              </div>
            </div>

            <!-- Administration Details -->
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label fw-bold">Administration Date *</label>
                <input 
                  type="date" 
                  class="form-control form-control-lg hw-search-input" 
                  v-model="administrationForm.date"
                  required
                >
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">Administration Time *</label>
                <input 
                  type="time" 
                  class="form-control form-control-lg hw-search-input" 
                  v-model="administrationForm.time"
                  required
                >
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label fw-bold">Injection Site</label>
                <select class="form-select form-select-lg hw-search-input" v-model="administrationForm.injectionSite">
                  <option value="">Select site...</option>
                  <option value="left-arm">Left Arm</option>
                  <option value="right-arm">Right Arm</option>
                  <option value="left-thigh">Left Thigh</option>
                  <option value="right-thigh">Right Thigh</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">Dosage (ml)</label>
                <input 
                  type="number" 
                  step="0.1"
                  class="form-control form-control-lg hw-search-input" 
                  v-model="administrationForm.dosage"
                  placeholder="0.5"
                >
              </div>
            </div>

            <!-- Parent/Guardian Consent -->
            <div class="mb-4">
              <label class="form-label fw-bold">Parent/Guardian Consent</label>
              <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" v-model="administrationForm.consent" id="consentCheck">
                <label class="form-check-label" for="consentCheck">
                  Parent/guardian has provided consent for vaccination
                </label>
              </div>
              <div class="input-group mb-3">
                <span class="input-group-text">Consent Given By</span>
                <input 
                  type="text" 
                  class="form-control hw-search-input" 
                  v-model="administrationForm.consentName"
                  placeholder="Parent/guardian name"
                  :disabled="!administrationForm.consent"
                >
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-4">
              <label class="form-label fw-bold">Notes</label>
              <textarea 
                class="form-control hw-search-input" 
                rows="3"
                v-model="administrationForm.notes"
                placeholder="Any additional notes or observations..."
              ></textarea>
            </div>

            <!-- Next Appointment -->
            <AppCard class="bg-light mb-4">
              <h6 class="card-title">
                <i class="bi bi-calendar-plus me-2"></i>
                Schedule Next Appointment
              </h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Next Appointment Date</label>
                  <input 
                    type="date" 
                    class="form-control hw-search-input" 
                    v-model="administrationForm.nextAppointment"
                  >
                </div>
                <div class="col-md-6">
                  <label class="form-label">Appointment Time</label>
                  <input 
                    type="time" 
                    class="form-control hw-search-input" 
                    v-model="administrationForm.nextAppointmentTime"
                  >
                </div>
              </div>
            </AppCard>

            <!-- Submit Button -->
            <div class="d-grid">
              <AppButton
                type="submit"
                variant="success"
                size="lg"
                :disabled="!selectedPatient || !administrationForm.vaccineId"
                icon="bi bi-check-circle"
                class="btn-hw-primary"
              >
                Complete Administration
              </AppButton>
            </div>
          </form>
        </AppCard>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import HealthWorkerLayout from '@/components/layout/HealthWorkerLayout.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSearchFilter from '@/components/common/AppSearchFilter.vue'

const patientSearch = ref('')
const selectedPatient = ref(null)

const breadcrumbs = [
  { text: 'Health Worker', href: '/healthworker/dashboard' },
  { text: 'Vaccine Administration', active: true }
]

const administrationForm = ref({
  vaccineId: '',
  batchNumber: '',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().split(' ')[0].substring(0, 5),
  injectionSite: '',
  dosage: '',
  consent: false,
  consentName: '',
  notes: '',
  nextAppointment: '',
  nextAppointmentTime: ''
})

// Sample data - Children with parent/guardian information
const patients = ref([
  { 
    id: 'P-001', 
    name: 'Ethan Cruz', 
    age: 5, 
    parent: {
      name: 'Maria Cruz',
      phone: '+63 912 345 6789',
      relation: 'Mother'
    }
  },
  { 
    id: 'P-002', 
    name: 'Sofia Reyes', 
    age: 3, 
    parent: {
      name: 'Juan Reyes',
      phone: '+63 917 654 3210',
      relation: 'Father'
    } 
  },
  { 
    id: 'P-003', 
    name: 'Carlos Santos', 
    age: 7,
    parent: {
      name: 'Elena Santos',
      phone: '+63 905 123 4567',
      relation: 'Mother'
    } 
  },
  { 
    id: 'P-004', 
    name: 'Isabella Garcia', 
    age: 2,
    parent: {
      name: 'Miguel Garcia',
      phone: '+63 927 890 1234',
      relation: 'Father'
    } 
  }
])

const availableVaccines = ref([
  {
    id: 'V-001',
    name: 'COVID-19',
    manufacturer: 'Pfizer',
    batchNumber: 'PF20250123',
    quantity: 50
  },
  {
    id: 'V-002',
    name: 'Influenza',
    manufacturer: 'Sanofi',
    batchNumber: 'SF20250987',
    quantity: 320
  },
  {
    id: 'V-003',
    name: 'Measles-Mumps-Rubella',
    manufacturer: 'Merck',
    batchNumber: 'MK20250456',
    quantity: 0
  }
])

const filteredPatients = computed(() => {
  if (!patientSearch.value) return patients.value
  return patients.value.filter(patient => 
    patient.name.toLowerCase().includes(patientSearch.value.toLowerCase()) ||
    patient.id.toLowerCase().includes(patientSearch.value.toLowerCase())
  )
})

const selectPatient = (patient) => {
  selectedPatient.value = patient
}

// Watch for vaccine selection to auto-fill batch number
watch(() => administrationForm.value.vaccineId, (newVaccineId) => {
  const selectedVaccine = availableVaccines.value.find(v => v.id === newVaccineId)
  if (selectedVaccine) {
    administrationForm.value.batchNumber = selectedVaccine.batchNumber
  }
})

const administerVaccine = () => {
  // Here you would normally send the data to your backend
  console.log('Administering vaccine:', {
    patient: selectedPatient.value,
    administration: administrationForm.value
  })
  
  alert('Vaccine administered successfully!')
  
  // Reset form
  selectedPatient.value = null
  administrationForm.value = {
    vaccineId: '',
    batchNumber: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    injectionSite: '',
    dosage: '',
    consent: false,
    consentName: '',
    notes: '',
    nextAppointment: '',
    nextAppointmentTime: ''
  }
}
</script>

<style scoped>
.sticky-top {
  top: 1rem;
}

.patient-item {
  transition: background-color 0.2s ease;
}

.patient-item:hover {
  background-color: #f8f9fa;
}

.cursor-pointer {
  cursor: pointer;
}

/* Tablet optimizations */
@media (max-width: 992px) {
  .sticky-top {
    position: relative !important;
    top: auto !important;
  }
}
</style>
