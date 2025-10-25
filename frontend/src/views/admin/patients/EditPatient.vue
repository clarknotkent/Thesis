<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/admin/dashboard">Dashboard</router-link></li>
          <li class="breadcrumb-item"><router-link to="/admin/patients">Patient Records</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Edit Patient</li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">
            <i class="bi bi-pencil-square me-2"></i>Edit Patient
          </h2>
          <p class="text-muted mb-0">Update patient information</p>
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
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading patient data...</span>
        </div>
        <p class="text-muted mt-2">Loading patient information...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger">
        <i class="bi bi-exclamation-circle me-2"></i>
        {{ error }} <router-link to="/admin/patients">Go back to patient list</router-link>
      </div>

      <!-- Form Card -->
      <div v-else class="card shadow">
        <div class="card-header py-3">
          <h6 class="m-0 fw-bold text-primary">Patient Information Form</h6>
        </div>
        <div class="card-body p-4">
          <PatientForm
            :initial-data="patientData"
            :guardians="guardians"
            :is-editing="true"
            :submitting="submitting"
            submit-label="Update Patient"
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
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PatientForm from '@/features/patients/PatientForm.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const patientData = ref({})
const guardians = ref([])
const loading = ref(true)
const submitting = ref(false)
const error = ref(null)

const patientId = computed(() => route.params.id)

const goBack = () => {
  router.back()
}

const formatForInput = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  } catch (e) {
    return ''
  }
}

const convertToISODate = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

const fetchPatientData = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch guardians first
    const guardianResponse = await api.get('/guardians')
    guardians.value = guardianResponse.data.data || guardianResponse.data || []

    // Fetch patient data
    const response = await api.get(`/patients/${patientId.value}`)
    const p = response.data.data || response.data

    // Map backend fields to form structure
    patientData.value = {
      id: p.id || p.patient_id,
      surname: p.surname || p.lastName || '',
      firstname: p.firstname || p.firstName || '',
      middlename: p.middlename || p.middleName || '',
      sex: p.sex || '',
      date_of_birth: formatForInput(p.date_of_birth || p.dateOfBirth),
      address: p.address || '',
      barangay: p.barangay || '',
      health_center: p.health_center || p.healthCenter || '',
      mother_name: p.mother_name || p.motherName || '',
      mother_occupation: p.mother_occupation || p.motherOccupation || '',
      mother_contact_number: p.mother_contact_number || p.motherContactNumber || '',
      father_name: p.father_name || p.fatherName || '',
      father_occupation: p.father_occupation || p.fatherOccupation || '',
      father_contact_number: p.father_contact_number || p.fatherContactNumber || '',
      guardian_id: p.guardian_id || p.guardianId || null,
      family_number: p.family_number || p.familyNumber || '',
      relationship_to_guardian: p.relationship_to_guardian || p.relationshipToGuardian || '',
      birth_weight: p.birth_weight || p.birthWeight || '',
      birth_length: p.birth_length || p.birthLength || '',
      place_of_birth: p.place_of_birth || p.placeOfBirth || '',
      time_of_birth: (p.medical_history && (p.medical_history.time_of_birth || p.medical_history.timeOfBirth)) || p.time_of_birth || '',
      attendant_at_birth: (p.medical_history && (p.medical_history.attendant_at_birth || p.medical_history.attendantAtBirth)) || p.attendant_at_birth || '',
      type_of_delivery: (p.medical_history && (p.medical_history.type_of_delivery || p.medical_history.typeOfDelivery)) || p.type_of_delivery || '',
      ballards_score: (p.medical_history && (p.medical_history.ballards_score || p.medical_history.ballardsScore)) || p.ballards_score || '',
      newborn_screening_result: (p.medical_history && (p.medical_history.newborn_screening_result || p.medical_history.newbornScreeningResult)) || p.newborn_screening_result || ''
    }

    // If family number missing but guardian selected, prefill from guardians list
    if (!patientData.value.family_number && patientData.value.guardian_id) {
      const g = guardians.value.find(x => x.guardian_id === patientData.value.guardian_id)
      if (g && g.family_number) {
        patientData.value.family_number = g.family_number
      }
    }

  } catch (err) {
    console.error('Error fetching patient data:', err)
    error.value = 'Failed to load patient data. Please try again.'
    addToast({
      title: 'Error',
      message: error.value,
      type: 'error'
    })
  } finally {
    loading.value = false
  }
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

    // Prepare patient data
    const patientUpdateData = {
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

    const response = await api.put(`/patients/${patientId.value}`, patientUpdateData)
    
    if (response.data.success) {
      addToast({
        title: 'Success',
        message: 'Patient information updated successfully!',
        type: 'success'
      })
      router.push('/admin/patients')
    }
  } catch (err) {
    console.error('Error updating patient:', err)
    const errorMessage = err.response?.data?.message || err.message || 'An error occurred'
    addToast({
      title: 'Error',
      message: `Failed to update patient: ${errorMessage}`,
      type: 'error'
    })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchPatientData()
})
</script>
