<template>
  <div class="modal fade admin-add-record-modal" :class="{ show: show }" :style="{ display: show ? 'block' : 'none', zIndex: 1100 }" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header align-items-center">
          <div class="d-flex align-items-center w-100">
            <h5 class="modal-title me-auto">Add Patient Record</h5>
            <!-- Upper-right toggle: switches between full Visit mode and simplified Record mode -->
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="recordModeToggle" v-model="recordMode">
              <label class="form-check-label" for="recordModeToggle">Outside record</label>
            </div>
          </div>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body p-0">
          <div class="p-3">
            <VisitEditor
              :show="true"
              :initial-patient-id="initialPatientId"
              :lock-patient="lockPatientWhenPrefilled"
              :collected-vaccinations="collectedVaccinations"
              :record-mode="recordMode"
              :embedded="true"
              :existing-visit-id="initialVisitId"
              @close="$emit('close')"
              @saved="onSaved"
              @update-collected-vaccinations="val => collectedVaccinations.value = val"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="show" class="modal-backdrop fade show" :style="{ zIndex: 1090 }"></div>
</template>

<script setup>
import { ref, watch } from 'vue'
import VisitEditor from '@/components/common/VisitEditor.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
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

const recordMode = ref(!!props.defaultRecordMode)
const collectedVaccinations = ref([])

console.log('🎯 [ADMIN_ADD_RECORD_MODAL] Component initialized with props:', {
  show: props.show,
  initialPatientId: props.initialPatientId,
  initialPatientIdType: typeof props.initialPatientId,
  lockPatientWhenPrefilled: props.lockPatientWhenPrefilled,
  defaultRecordMode: props.defaultRecordMode,
  defaultOutsideMode: props.defaultOutsideMode,
  initialVisitId: props.initialVisitId
})

watch(() => props.show, (open) => {
  console.log('🔄 [ADMIN_ADD_RECORD_MODAL] Modal show changed:', {
    open,
    currentInitialPatientId: props.initialPatientId,
    recordModeWillBe: !!(props.defaultRecordMode || props.defaultOutsideMode)
  })
  if (open) {
    // Prefer explicit defaultRecordMode, fallback to legacy defaultOutsideMode
    recordMode.value = !!(props.defaultRecordMode || props.defaultOutsideMode)
    collectedVaccinations.value = []
  } else {
    // Reset when closing
    collectedVaccinations.value = []
  }
})

const onSaved = () => {
  emit('saved')
  emit('close')
}
</script>

<style scoped>
.admin-add-record-modal.modal.show { background-color: rgba(0,0,0,0.5); }
/* Prevent nested backdrops */
:deep(.modal-backdrop) { display: none !important; }
</style>
