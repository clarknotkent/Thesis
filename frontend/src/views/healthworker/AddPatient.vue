<template>
  <HealthWorkerLayout>
    <!-- Mobile Header -->
    <div class="mobile-header d-flex align-items-center mb-3">
      <button class="btn btn-link p-0 me-3" @click="goBack">
        <i class="bi bi-arrow-left" style="font-size: 1.5rem; color: #007bff;"></i>
      </button>
      <h5 class="mb-0 fw-bold">Add New Patient</h5>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Form -->
    <div v-if="!loading" class="add-patient-form">
      <PatientForm
        :form-data="form"
        :guardians="guardians"
        @submit="savePatient"
        @update:form-data="form = $event"
      />

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button type="button" class="btn btn-outline-secondary" @click="goBack">
          Cancel
        </button>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="savePatient">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
          Add Patient
        </button>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import { PatientForm } from '@/features/health-worker/patients'
import api from '@/services/api'

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const guardians = ref([])

const form = ref({
  surname: '',
  firstname: '',
  middlename: '',
  sex: '',
  date_of_birth: '',
  address: '',
  barangay: '',
  health_center: '',
  guardian_id: '',
  family_number: '',
  guardian_relationship: '',
  mother_name: '',
  mother_occupation: '',
  mother_contact_number: '',
  father_name: '',
  father_occupation: '',
  father_contact_number: '',
  birth_weight: '',
  birth_height: '',
  place_of_birth: ''
})

const goBack = () => {
  router.push('/healthworker/patients')
}

const fetchGuardians = async () => {
  try {
    const response = await api.get('/guardians')
    guardians.value = response.data.data || []
  } catch (error) {
    console.error('Error fetching guardians:', error)
  }
}

const savePatient = async () => {
  try {
    saving.value = true
    
    const payload = {
      ...form.value,
      birth_weight: form.value.birth_weight ? parseFloat(form.value.birth_weight) : null,
      birth_height: form.value.birth_height ? parseFloat(form.value.birth_height) : null,
      guardian_id: parseInt(form.value.guardian_id)
    }
    
    await api.post('/patients', payload)
    
    router.push('/healthworker/patients')
  } catch (error) {
    console.error('Error saving patient:', error)
    alert('Error saving patient. Please try again.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchGuardians()
  loading.value = false
})
</script>

<style scoped>
.mobile-header {
  background: white;
  padding: 1rem 0 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 56px;
  z-index: 100;
}

.add-patient-form {
  padding-bottom: 6rem;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
}

.action-buttons {
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  background: white;
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  gap: 0;
}

.action-buttons .btn {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  border: 1px solid #ced4da;
  transition: all 0.2s ease;
}

.action-buttons .btn:first-child {
  border-radius: 0.5rem 0 0 0.5rem;
  border-right: none;
}

.action-buttons .btn:last-child {
  border-radius: 0 0.5rem 0.5rem 0;
}

.action-buttons .btn-outline-secondary {
  background: white;
  color: #6c757d;
  border-color: #ced4da;
}

.action-buttons .btn-outline-secondary:hover,
.action-buttons .btn-outline-secondary:active {
  background: #f8f9fa;
  color: #495057;
  border-color: #adb5bd;
}

.action-buttons .btn-primary {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.action-buttons .btn-primary:hover,
.action-buttons .btn-primary:active {
  background: #0056b3;
  border-color: #0056b3;
}

.action-buttons .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 576px) {
  .mobile-header {
    margin-left: -1rem;
    margin-right: -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
    width: calc(100% + 2rem);
  }
  
  .add-patient-form {
    margin-left: -0.5rem;
    margin-right: -0.5rem;
    width: calc(100% + 1rem);
    padding-bottom: 7rem;
  }
  
  .action-buttons {
    padding: 0.75rem 1rem;
  }
  
  .action-buttons .btn {
    padding: 0.625rem 0.875rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) and (orientation: landscape) {
  .action-buttons {
    bottom: 60px;
  }
  
  .add-patient-form {
    padding-bottom: 5rem;
  }
}
</style>