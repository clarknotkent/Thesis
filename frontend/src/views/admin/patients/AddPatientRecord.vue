<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/admin/dashboard">Admin</router-link></li>
          <li class="breadcrumb-item"><router-link to="/admin/patients">Patient Records</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Add Patient Immunization Record</li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex align-items-center">
          <div>
            <h2 class="mb-1">
              <i class="bi bi-file-medical me-2"></i>Add Patient Immunization Record
            </h2>
            <p class="text-muted mb-0">Record Patient On-Site or Outside Immunization</p>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="goBack">
            <i class="bi bi-arrow-left me-2"></i>Back
          </button>
          <button class="btn btn-outline-primary" @click="goHome">
            <i class="bi bi-house me-2"></i>Home
          </button>
        </div>
      </div>

      <!-- Single Form Card -->
      <div class="card shadow">
        <div class="card-header py-3">
          <h5 class="mb-0 text-primary">
            <i class="bi bi-clipboard-data me-2"></i>
            Patient Immunization Form
          </h5>
        </div>
        <div class="card-body">
          <VisitEditor
            :show="true"
            :initial-patient-id="$route.query.patientId || ''"
            :lock-patient="!!$route.query.patientId"
            :collected-vaccinations="collectedVaccinations"
            :record-mode="recordMode"
            :embedded="true"
            :existing-visit-id="$route.query.visitId || ''"
            @close="onClose"
            @saved="onSaved"
            @update-collected-vaccinations="val => collectedVaccinations = val"
          />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import VisitEditor from '@/features/admin/patients/VisitEditor.vue'

const router = useRouter()
const route = useRoute()

const recordMode = ref(String(route.query.outside).toLowerCase() === 'true')
const collectedVaccinations = ref([])

// Keep record mode in sync with query param
watch(() => route.query.outside, (val) => {
  recordMode.value = String(val).toLowerCase() === 'true'
})

const onSaved = () => {
  // Navigate back after successful save
  goBack()
}

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/admin/dashboard')
}

const onClose = () => {
  goBack()
}
</script>

<style scoped>
/* Page-specific styles */
</style>
