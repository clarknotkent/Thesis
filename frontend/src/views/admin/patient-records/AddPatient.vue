<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/admin/dashboard">Dashboard</router-link></li>
          <li class="breadcrumb-item"><router-link to="/admin/patients">Patient Records</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Add Patient</li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">
            <i class="bi bi-person-plus-fill me-2"></i>Add New Patient
          </h2>
          <p class="text-muted mb-0">Register a new patient in the system</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="goBack">
            <i class="bi bi-arrow-left me-2"></i>Back
          </button>
          <router-link to="/admin/dashboard" class="btn btn-outline-primary">
            <i class="bi bi-house me-2"></i>Home
          </router-link>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loadingGuardians" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading guardians...</span>
        </div>
        <p class="text-muted mt-2">Loading guardian information...</p>
      </div>

      <!-- Form Card -->
      <div v-else class="card shadow">
        <div class="card-header py-3">
          <h6 class="m-0 fw-bold text-primary">Patient Information Form</h6>
        </div>
        <div class="card-body p-4">
          <PatientForm
            :initial-data="{}"
            :guardians="guardians"
            :is-editing="false"
            :submitting="submitting"
            submit-label="Add Patient"
            @submit="handleSubmit"
            @cancel="goBack"
          />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PatientForm from './components/PatientForm.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { addToast } = useToast()

const guardians = ref([])
const loadingGuardians = ref(true)
const submitting = ref(false)

const goBack = () => {
  router.back()
}

const fetchGuardians = async () => {
  try {
    loadingGuardians.value = true
    const response = await api.get('/guardians')
    guardians.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error fetching guardians:', error)
    addToast({
      title: 'Error',
      message: 'Failed to load guardians. Please refresh the page.',
      type: 'error'
    })
  } finally {
    loadingGuardians.value = false
  }
}

const convertToISODate = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

const handleSubmit = async (formData) => {
  try {
    submitting.value = true

    // Validate required fields
    if (!formData.surname || !formData.firstname || !formData.sex || 
        !formData.date_of_birth || !formData.mother_name || 
        !formData.guardian_id || !formData.relationship_to_guardian) {
      addToast({
        title: 'Validation Error',
        message: 'Please fill in all required fields marked with *',
        type: 'error'
      })
      return
    }

    // Validate birth history fields for new patients
    if (!formData.time_of_birth || !formData.attendant_at_birth || !formData.type_of_delivery) {
      addToast({
        title: 'Validation Error',
        message: 'Please provide required birth history: Time of Birth, Attendant at Birth, and Type of Delivery',
        type: 'error'
      })
      return
    }

    // Prepare patient data
    const patientData = {
      surname: formData.surname,
      firstname: formData.firstname,
      middlename: formData.middlename,
      sex: formData.sex,
      date_of_birth: convertToISODate(formData.date_of_birth) || formData.date_of_birth,
      address: formData.address,
      barangay: formData.barangay,
      health_center: formData.health_center,
      mother_name: formData.mother_name,
      mother_occupation: formData.mother_occupation,
      mother_contact_number: formData.mother_contact_number,
      father_name: formData.father_name,
      father_occupation: formData.father_occupation,
      father_contact_number: formData.father_contact_number,
      guardian_id: formData.guardian_id,
      family_number: formData.family_number,
      relationship_to_guardian: formData.relationship_to_guardian,
      birth_weight: formData.birth_weight,
      birth_length: formData.birth_length,
      place_of_birth: formData.place_of_birth,
      birthhistory: {
        birth_weight: formData.birth_weight,
        birth_length: formData.birth_length,
        place_of_birth: formData.place_of_birth,
        time_of_birth: formData.time_of_birth,
        attendant_at_birth: formData.attendant_at_birth,
        type_of_delivery: formData.type_of_delivery,
        ballards_score: formData.ballards_score,
        newborn_screening_result: formData.newborn_screening_result
      }
    }

    const response = await api.post('/patients', patientData)
    
    if (response.data.success) {
      addToast({
        title: 'Success',
        message: 'New patient added successfully!',
        type: 'success'
      })
      router.push('/admin/patients')
    }
  } catch (error) {
    console.error('Error creating patient:', error)
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred'
    addToast({
      title: 'Error',
      message: `Failed to add patient: ${errorMessage}`,
      type: 'error'
    })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchGuardians()
})
</script>
