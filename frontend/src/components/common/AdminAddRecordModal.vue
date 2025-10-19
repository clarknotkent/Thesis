<template>
  <!-- Page mode: render the editor as a full page (no modal chrome) -->
  <div v-if="embeddedPage" class="add-record-page container-fluid py-3">
    <div class="d-flex align-items-center mb-3">
      <h3 class="mb-0">Add Patient Record</h3>
      <!-- Page-level toggle to switch between Outside record (record-only) vs In-facility visit -->
      <div class="form-check form-switch ms-3" title="Toggle outside vs in-facility mode">
        <input class="form-check-input" type="checkbox" id="pageRecordModeToggle" v-model="recordMode">
        <label class="form-check-label" for="pageRecordModeToggle">Outside record</label>
      </div>
  <button class="btn btn-outline-secondary ms-auto" @click="goBack">Back</button>
    </div>
    <div class="card shadow-sm">
      <div class="card-body p-3">
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
import VisitEditor from '@/components/common/VisitEditor.vue'

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
