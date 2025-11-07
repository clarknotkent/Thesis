<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav
        aria-label="breadcrumb"
        class="mb-3"
      >
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">
              Dashboard
            </router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link to="/admin/patients">
              Patient Records
            </router-link>
          </li>
          <li
            class="breadcrumb-item active"
            aria-current="page"
          >
            Add Patient
          </li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">
            <i class="bi bi-person-plus-fill me-2" />Add New Patient
          </h2>
          <p class="text-muted mb-0">
            Register a new patient in the system
          </p>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-secondary"
            @click="goBack"
          >
            <i class="bi bi-arrow-left me-2" />Back
          </button>
          <router-link
            to="/admin/dashboard"
            class="btn btn-outline-primary"
          >
            <i class="bi bi-house me-2" />Home
          </router-link>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loadingGuardians"
        class="text-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading guardians...</span>
        </div>
        <p class="text-muted mt-2">
          Loading guardian information...
        </p>
      </div>

      <!-- Form Card -->
      <div
        v-else
        class="card shadow"
      >
        <div class="card-header py-3">
          <h6 class="m-0 fw-bold text-primary">
            Patient Information Form
          </h6>
        </div>
        <div class="card-body p-4">
          <PatientForm
            :initial-data="{}"
            :guardians="guardians"
            :mother-suggestions="motherSuggestions"
            :father-suggestions="fatherSuggestions"
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
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import PatientForm from '@/features/admin/patients/PatientForm.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { addToast } = useToast()

const guardians = ref([])
const loadingGuardians = ref(true)
const submitting = ref(false)
const motherSuggestions = ref([])
const fatherSuggestions = ref([])

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

const fetchParentSuggestions = async () => {
  try {
    const [momsRes, dadsRes] = await Promise.all([
      api.get('/patients/parents/suggestions', { params: { type: 'mother' } }),
      api.get('/patients/parents/suggestions', { params: { type: 'father' } })
    ])
    motherSuggestions.value = momsRes.data?.data || []
    fatherSuggestions.value = dadsRes.data?.data || []
  } catch (error) {
    console.warn('Failed to fetch parent suggestions (non-blocking):', error?.message || error)
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

    // Debug/Validation: collect missing required fields and report clearly
    const requiredMain = [
      ['surname', 'Surname'],
      ['firstname', 'First Name'],
      ['sex', 'Sex'],
      ['date_of_birth', 'Date of Birth'],
      ['barangay', 'Barangay'],
      ['health_center', 'Health Center'],
      ['address', 'Address'],
      ['mother_name', "Mother's Name"],
      ['guardian_id', 'Guardian'],
      ['relationship_to_guardian', 'Relationship to Guardian']
    ]
    const missingMain = requiredMain
      .filter(([key]) => !formData[key])
      .map(([, label]) => label)

    const requiredBirth = [
      ['time_of_birth', 'Time of Birth'],
      ['attendant_at_birth', 'Attendant at Birth'],
      ['type_of_delivery', 'Type of Delivery']
    ]
    const missingBirth = requiredBirth
      .filter(([key]) => !formData[key])
      .map(([, label]) => label)

    if (missingMain.length > 0 || missingBirth.length > 0) {
      // Console debugger output for developers
      console.groupCollapsed('[Add Patient] Missing Required Fields')
      if (missingMain.length) console.warn('Main:', missingMain)
      if (missingBirth.length) console.warn('Birth History:', missingBirth)
      console.debug('Form snapshot:', { ...formData })
      console.groupEnd()

      const parts = []
      if (missingMain.length) parts.push(`Main: ${missingMain.join(', ')}`)
      if (missingBirth.length) parts.push(`Birth History: ${missingBirth.join(', ')}`)

      addToast({
        title: 'Validation Error',
        message: `Please fill in required fields: ${parts.join(' | ')}`,
        type: 'error'
      })

      // Small hint specific to Guardian selection UX
      if (!formData.guardian_id) {
        console.info('Hint: In the Guardian field, type to search then CLICK a dropdown item to select. Typing alone will not set guardian_id.')
      }
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
        newborn_screening_result: formData.newborn_screening_result,
        hearing_test_date: convertToISODate(formData.hearing_test_date) || formData.hearing_test_date,
        newborn_screening_date: convertToISODate(formData.newborn_screening_date) || formData.newborn_screening_date
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
  fetchParentSuggestions()
})
</script>

<style scoped>
.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin: 0;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
}

.breadcrumb-item a {
  color: #4e73df;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #6c757d;
}
</style>
