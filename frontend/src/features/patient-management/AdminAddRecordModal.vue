<template>
  <!-- Page mode: render the editor as a full page (no modal chrome) -->
  <div v-if="embeddedPage" class="container-fluid">
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
          :initial-patient-id="initialPatientId"
          :lock-patient="lockPatientWhenPrefilled"
          :collected-vaccinations="collectedVaccinations"
          :record-mode="recordMode"
          :embedded="true"
          :existing-visit-id="initialVisitId"
          @close="onClose"
          @saved="onSaved"
          @update-collected-vaccinations="val => collectedVaccinations.value = val"
        />
      </div>
    </div>
  </div>
  <!-- No modal variant: this component is page-only in latest -->
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VisitEditor from '@/features/patient-management/VisitEditor.vue'

const props = defineProps({
  embeddedPage: { type: Boolean, default: false },
  initialPatientId: { type: [String, Number], default: '' },
  // If provided, lock patient selection in both modes
  lockPatientWhenPrefilled: { type: Boolean, default: false },
  // Default record-only mode when opening
  defaultRecordMode: { type: Boolean, default: false },
  // Back-compat: previously used to toggle outside immunization mode
  defaultOutsideMode: { type: Boolean, default: false },
  // If provided, load existing visit for adding services
  initialVisitId: { type: [String, Number], default: '' }
})

const emit = defineEmits(['close', 'saved'])

const recordMode = ref(!!(props.defaultRecordMode || props.defaultOutsideMode))
const collectedVaccinations = ref([])

console.log('🎯 [ADMIN_ADD_RECORD_MODAL] Component initialized with props:', {
  initialPatientId: props.initialPatientId,
  initialPatientIdType: typeof props.initialPatientId,
  lockPatientWhenPrefilled: props.lockPatientWhenPrefilled,
  defaultRecordMode: props.defaultRecordMode,
  defaultOutsideMode: props.defaultOutsideMode,
  initialVisitId: props.initialVisitId
})

// Initialize defaults for page mode
recordMode.value = !!(props.defaultRecordMode || props.defaultOutsideMode)
collectedVaccinations.value = []

// Keep page-mode toggle in sync when default props change
watch(() => props.defaultRecordMode, (val) => {
  if (props.embeddedPage) recordMode.value = !!(val || props.defaultOutsideMode)
})
watch(() => props.defaultOutsideMode, (val) => {
  if (props.embeddedPage) recordMode.value = !!(val || props.defaultRecordMode)
})

const router = useRouter()

const onSaved = () => {
  emit('saved')
}

const goBack = () => {
  // Always prefer router back when available; fallback to emit for modal mode
  if (router) return router.back()
  emit('close')
}

const goHome = () => {
  // Navigate to admin dashboard
  if (router) return router.push('/admin/dashboard')
  emit('close')
}

// Unified close handler used by VisitEditor
const onClose = () => {
  return goBack()
}
</script>

<style scoped>
.admin-add-record-modal.modal.show { background-color: rgba(0,0,0,0.5); }
/* Prevent nested backdrops */
:deep(.modal-backdrop) { display: none !important; }
</style>
