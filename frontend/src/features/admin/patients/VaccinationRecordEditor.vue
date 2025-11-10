<template>
  <!-- Page mode: render the editor as a full page (no modal chrome) -->
  <div
    v-if="embeddedPage"
    class="vaccination-editor-page container-fluid py-3"
  >
    <div class="d-flex align-items-center mb-3">
      <h3 class="mb-0">
        <i class="bi bi-shield-check me-2" />
        Manage Vaccination Records
      </h3>
      <button
        class="btn btn-outline-secondary ms-auto"
        @click="onClose"
      >
        Back
      </button>
    </div>
    <div class="card shadow-sm">
      <div class="card-body p-3">
        <!-- Loading State -->
        <div
          v-if="loading"
          class="text-center py-5"
        >
          <div
            class="spinner-border text-primary"
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">
            Loading vaccination records...
          </p>
        </div>

        <!-- Main Interface: Only show when NOT in visit context -->
        <div v-else-if="!visitContext">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6 class="mb-0">
                <span class="fw-bold">Patient:</span> {{ patientData?.firstname }} {{ patientData?.surname }}
              </h6>
              <p class="text-muted small mb-0">
                {{ patientData?.sex }}, {{ calculateAge(patientData?.date_of_birth) }}
              </p>
            </div>

            <div class="btn-group btn-group-sm">
              <button
                class="btn btn-success"
                @click="startInFacilityAdd"
              >
                <i class="bi bi-plus-circle me-1" /> Add Vaccination Record
              </button>
            </div>
          </div>

          <!-- Vaccination History Table -->
          <VaccinationHistoryTable
            :sorted-vaccinations="sortedVaccinations"
            :format-date="formatDate"
            :derive-site="deriveSite"
            :derive-facility="deriveFacility"
            :get-status-badge-class="getStatusBadgeClass"
            :is-outside="isOutside"
            @edit="editVaccinationRecord"
            @delete="handleDeleteVaccination"
          />

          <!-- Vaccination Schedule Table -->
          <VaccinationScheduleTable
            v-model:new-schedule-date="newScheduleDate"
            :upcoming-schedules="upcomingSchedules"
            :editing-schedule-index="editingScheduleIndex"
            :saving="saving"
            :format-date="formatDate"
            :get-status-badge-class="getStatusBadgeClass"
            :compute-days-overdue="computeDaysOverdue"
            :get-min-date="getMinDate"
            @start-edit="startEditSchedule"
            @save="handleSaveSchedule"
            @cancel-edit="cancelEditSchedule"
          />
        </div>
      </div>
    </div>

    <!-- Vaccination Form Modal -->
    <VaccinationFormModal
      v-model:form="vaccinationForm"
      v-model:outside-immunization="outsideImmunization"
      :show="showNewVaccinationModal || showEditVaccinationModal"
      :is-edit="showEditVaccinationModal"
      :vaccine-options="vaccineOptions"
      :vaccine-catalog="vaccineCatalog"
      :available-doses="availableDoses"
      :auto-select-hint="autoSelectHint"
      :nurses="nurses"
      :saving="saving"
      :can-save="canSave"
      :patient-dob="patientData?.date_of_birth"
      :immunization-date-min="immunizationDateMin"
      :immunization-date-max="immunizationDateMax"
      @close="closeVaccinationModal"
      @save="handleSaveVaccination"
      @vaccine-select="onVaccineSelect"
      @vaccine-catalog-select="onVaccineCatalogSelect"
    />

    <!-- Visit Picker Modal -->
    <VisitPickerModal
      :show="showVisitPicker"
      :visits="visits"
      :loading="loadingVisits"
      :format-date-short="formatDateShort"
      @close="showVisitPicker = false"
      @pick-visit="pickVisit"
      @open-outside-record="openOutsideRecordFromVisitPicker"
    />

    <!-- Embedded Visit View (read-only + services active) -->
    <div
      v-if="showVisitView"
      class="card border-primary mt-3"
    >
      <div class="card-header d-flex align-items-center justify-content-between">
        <h6 class="mb-0">
          Visit Details
        </h6>
        <button
          type="button"
          class="btn-close"
          @click="closeVisitView"
        />
      </div>
      <div class="card-body p-0">
        <div class="p-3">
          <VisitEditor
            :show="true"
            :initial-patient-id="patientId"
            :lock-patient="true"
            :collected-vaccinations="[]"
            :record-mode="false"
            :embedded="true"
            :view-mode="true"
            :existing-visit-id="selectedVisitId"
            @close="closeVisitView"
            @saved="onVisitSaved"
            @update-collected-vaccinations="() => {}"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Modal mode: keep previous behaviour for backward compatibility -->
  <div
    v-else
    class="modal fade"
    :class="{ show }"
    :style="{ display: show ? 'block' : 'none' }"
    tabindex="-1"
  >
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-shield-check me-2" />
            Manage Vaccination Records
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="closeMainModal"
          />
        </div>

        <!-- Loading State -->
        <div
          v-if="loading"
          class="modal-body text-center py-5"
        >
          <div
            class="spinner-border text-primary"
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">
            Loading vaccination records...
          </p>
        </div>

        <!-- Main Interface: Only show when NOT in visit context -->
        <div
          v-else-if="!visitContext"
          class="modal-body"
        >
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6 class="mb-0">
                <span class="fw-bold">Patient:</span> {{ patientData?.firstname }} {{ patientData?.surname }}
              </h6>
              <p class="text-muted small mb-0">
                {{ patientData?.sex }}, {{ calculateAge(patientData?.date_of_birth) }}
              </p>
            </div>

            <div class="btn-group btn-group-sm">
              <button
                class="btn btn-success"
                @click="startInFacilityAdd"
              >
                <i class="bi bi-plus-circle me-1" /> Add Vaccination Record
              </button>
            </div>
          </div>

          <!-- Vaccination History Table -->
          <VaccinationHistoryTable
            :sorted-vaccinations="sortedVaccinations"
            :format-date="formatDate"
            :derive-site="deriveSite"
            :derive-facility="deriveFacility"
            :get-status-badge-class="getStatusBadgeClass"
            :is-outside="isOutside"
            @edit="editVaccinationRecord"
            @delete="handleDeleteVaccination"
          />

          <!-- Vaccination Schedule Table -->
          <VaccinationScheduleTable
            v-model:new-schedule-date="newScheduleDate"
            :upcoming-schedules="upcomingSchedules"
            :editing-schedule-index="editingScheduleIndex"
            :saving="saving"
            :format-date="formatDate"
            :get-status-badge-class="getStatusBadgeClass"
            :compute-days-overdue="computeDaysOverdue"
            :get-min-date="getMinDate"
            @start-edit="startEditSchedule"
            @save="handleSaveSchedule"
            @cancel-edit="cancelEditSchedule"
          />
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeMainModal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Vaccination Form Modal -->
  <VaccinationFormModal
    v-model:form="vaccinationForm"
    v-model:outside-immunization="outsideImmunization"
    :show="showNewVaccinationModal || showEditVaccinationModal"
    :is-edit="showEditVaccinationModal"
    :vaccine-options="vaccineOptions"
    :vaccine-catalog="vaccineCatalog"
    :available-doses="availableDoses"
    :auto-select-hint="autoSelectHint"
    :nurses="nurses"
    :saving="saving"
    :can-save="canSave"
    :patient-dob="patientData?.date_of_birth"
    :immunization-date-min="immunizationDateMin"
    :immunization-date-max="immunizationDateMax"
    @close="closeVaccinationModal"
    @save="handleSaveVaccination"
    @vaccine-select="onVaccineSelect"
    @vaccine-catalog-select="onVaccineCatalogSelect"
  />

  <!-- Visit Picker Modal -->
  <VisitPickerModal
    :show="showVisitPicker"
    :visits="visits"
    :loading="loadingVisits"
    :format-date-short="formatDateShort"
    @close="showVisitPicker = false"
    @pick-visit="pickVisit"
    @open-outside-record="openOutsideRecordFromVisitPicker"
  />

  <!-- Modal Backdrop only for main modal -->
  <div
    v-if="show && !embeddedPage"
    class="modal-backdrop fade show"
  />

  <!-- Embedded Visit View (read-only + services active) -->
  <div
    v-if="showVisitView"
    class="card border-primary mt-3"
  >
    <div class="card-header d-flex align-items-center justify-content-between">
      <h6 class="mb-0">
        Visit Details
      </h6>
      <button
        type="button"
        class="btn-close"
        @click="closeVisitView"
      />
    </div>
    <div class="card-body p-0">
      <div class="p-3">
        <VisitEditor
          :show="true"
          :initial-patient-id="patientId"
          :lock-patient="true"
          :collected-vaccinations="[]"
          :record-mode="false"
          :embedded="true"
          :view-mode="true"
          :existing-visit-id="selectedVisitId"
          @close="closeVisitView"
          @saved="onVisitSaved"
          @update-collected-vaccinations="() => {}"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, toRef } from 'vue';
import { useRouter } from 'vue-router';
import VisitEditor from './VisitEditor.vue';
import VaccinationHistoryTable from './components/VaccinationHistoryTable.vue';
import VaccinationScheduleTable from './components/VaccinationScheduleTable.vue';
import VaccinationFormModal from './components/VaccinationFormModal.vue';
import VisitPickerModal from './components/VisitPickerModal.vue';
import { useVaccinationRecords } from '@/composables/useVaccinationRecords';
import { useImmunizationDateBounds } from '@/composables/useImmunizationDateBounds';

const router = useRouter();

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
  },
  defaultOutside: {
    type: Boolean,
    default: false
  },
  embeddedPage: {
    type: Boolean,
    default: false
  },
  editRecordId: {
    type: [String, Number],
    default: null
  }
});

const emit = defineEmits(['close', 'update', 'vaccinations-collected', 'open-add-patient-record']);

// Use the composable
const {
  loading,
  saving,
  patientData,
  vaccineOptions,
  nurses,
  availableDoses,
  autoSelectHint,
  vaccineCatalog,
  outsideImmunization,
  vaccinationForm,
  showVisitPicker,
  loadingVisits,
  visits,
  editingScheduleIndex,
  newScheduleDate,
  initVaccinationForm,
  fetchPatientData,
  fetchVaccineOptions,
  fetchVaccineCatalog,
  fetchHealthWorkers,
  fetchVisits,
  calculateAgeAtAdministration,
  onVaccineSelect,
  onVaccineCatalogSelect,
  deleteVaccinationRecord,
  saveVaccinationRecord,
  saveScheduleDate,
  formatDate,
  formatDateShort,
  calculateAge,
  getStatusBadgeClass,
  computeDaysOverdue,
  deriveSite,
  deriveFacility,
  isOutside,
  getMinDate,
  sortedVaccinations,
  upcomingSchedules,
  canSave
} = useVaccinationRecords(toRef(props, 'patientId'), toRef(props, 'patientData'));

// Use the immunization date bounds composable
const { immunizationDateMin, immunizationDateMax, updateImmunizationDateConstraints } = useImmunizationDateBounds();

// Local state
const showNewVaccinationModal = ref(false);
const showEditVaccinationModal = ref(false);
const currentEditIndex = ref(-1);
const selectedVisitId = ref(null);
const showVisitView = ref(false);
const collectedVaccinations = ref([]);

// Methods
const startInFacilityAdd = async () => {
  outsideImmunization.value = false;
  showVisitPicker.value = true;
  await fetchVisits();
};

const pickVisit = (v) => {
  showVisitPicker.value = false;
  const visitId = v.visit_id || v.id;
  if (props.embeddedPage && router) {
    router.push({
      name: 'AddPatientRecord',
      query: {
        patientId: props.patientId,
        visitId,
        outside: 'false'
      }
    });
  } else {
    emit('open-add-patient-record', { outside: false, visitId, patientId: props.patientId });
  }
};

const openOutsideRecordFromVisitPicker = () => {
  showVisitPicker.value = false;
  if (props.embeddedPage && router) {
    router.push({
      name: 'AddPatientRecord',
      query: {
        patientId: props.patientId,
        outside: 'true'
      }
    });
  } else {
    emit('open-add-patient-record', { outside: true, patientId: props.patientId });
  }
};

const closeVisitView = () => {
  showVisitView.value = false;
};

const onVisitSaved = () => {
  showVisitView.value = false;
};

const openNewVaccinationModal = () => {
  initVaccinationForm();
  showNewVaccinationModal.value = true;
  calculateAgeAtAdministration();
};

const editVaccinationRecord = async (index) => {
  if (!patientData.value?.vaccinationHistory?.[index]) {
    return;
  }

  await fetchPatientData();

  const record = patientData.value.vaccinationHistory[index];
  vaccinationForm.value = { ...record };
  vaccinationForm.value.vaccineId = record.vaccineId || record.vaccine_id || (record.vaccine && (record.vaccine.vaccine_id || record.vaccine.id)) || '';
  vaccinationForm.value.healthWorkerId = record.administered_by || record.healthWorkerId || '';

  if (record.dateAdministered) {
    const date = new Date(record.dateAdministered);
    vaccinationForm.value.dateAdministered = date.toISOString().split('T')[0];
  }

  currentEditIndex.value = index;
  showEditVaccinationModal.value = true;

  calculateAgeAtAdministration();

  // Update date constraints for edit
  if (vaccinationForm.value.vaccineId && vaccinationForm.value.doseNumber) {
    await updateImmunizationDateConstraints(props.patientId, vaccinationForm.value.vaccineId, vaccinationForm.value.doseNumber);
  }
};

const openEditForRecordId = async (recordId) => {
  if (!patientData.value) {
    await fetchPatientData();
  }

  const index = patientData.value?.vaccinationHistory?.findIndex(v =>
    String(v.immunization_id || v.id) === String(recordId)
  );

  if (index !== undefined && index >= 0) {
    await editVaccinationRecord(index);
  }
};

const handleDeleteVaccination = async (vaccination) => {
  const success = await deleteVaccinationRecord(vaccination);
  if (success) {
    emit('update');
  }
};

const handleSaveVaccination = async () => {
  const result = await saveVaccinationRecord(
    showEditVaccinationModal.value,
    currentEditIndex.value >= 0 ? patientData.value.vaccinationHistory[currentEditIndex.value]?.immunization_id : null,
    props.visitContext,
    selectedVisitId.value
  );

  if (result.success) {
    if (result.isVisitContext) {
      emit('vaccinations-collected', [result.data]);
      emit('close');
    } else {
      emit('update');
      closeVaccinationModal();
    }
  }
};

const closeVaccinationModal = () => {
  showNewVaccinationModal.value = false;
  showEditVaccinationModal.value = false;
  currentEditIndex.value = -1;
  initVaccinationForm();
};

const closeMainModal = () => {
  if (props.visitContext && collectedVaccinations.value.length > 0) {
    emit('vaccinations-collected', collectedVaccinations.value);
  }
  if (props.embeddedPage) {
    router.back();
  } else {
    emit('close');
  }
};

const onClose = () => {
  if (props.embeddedPage) return router.back();
  return emit('close');
};

const startEditSchedule = (vaccine, index) => {
  editingScheduleIndex.value = index;
  newScheduleDate.value = vaccine.scheduledDate ? new Date(vaccine.scheduledDate).toISOString().split('T')[0] : '';
};

const cancelEditSchedule = () => {
  editingScheduleIndex.value = -1;
  newScheduleDate.value = '';
};

const handleSaveSchedule = async (vaccine) => {
  const success = await saveScheduleDate(vaccine, newScheduleDate.value);
  if (success) {
    cancelEditSchedule();
  }
};

// Watch for show prop changes
watch(() => props.show, (newVal) => {
  if (newVal && props.patientId) {
    fetchPatientData();
    fetchVaccineOptions();
    fetchHealthWorkers();
  }
  if (newVal) {
    outsideImmunization.value = !!props.defaultOutside;
  }
});

// Watch for date changes to recalculate age
watch(() => vaccinationForm.value.dateAdministered, () => {
  calculateAgeAtAdministration();
});

// Watch for vaccine and dose changes to update date constraints
watch(() => vaccinationForm.value.inventoryId, async (newId) => {
  if (newId) {
    await onVaccineSelect();
    await updateImmunizationDateConstraints(props.patientId, vaccinationForm.value.vaccineId, vaccinationForm.value.doseNumber);
  }
});

watch(() => vaccinationForm.value.vaccineId, async (newId) => {
  if (newId) {
    await onVaccineCatalogSelect();
    await updateImmunizationDateConstraints(props.patientId, newId, vaccinationForm.value.doseNumber);
  }
});

watch(() => vaccinationForm.value.doseNumber, async (newDose) => {
  if (newDose && (vaccinationForm.value.vaccineId || vaccinationForm.value.inventoryId)) {
    const vaccineId = vaccinationForm.value.vaccineId || vaccinationForm.value.vaccineId; // This was wrong, should be vaccinationForm.value.vaccineId
    await updateImmunizationDateConstraints(props.patientId, vaccineId, newDose);
  }
});

onMounted(() => {
  if ((props.embeddedPage || props.show) && props.patientId) {
    fetchPatientData();
    fetchVaccineOptions();
    fetchVaccineCatalog();
    fetchHealthWorkers();

    if (props.editRecordId) {
      setTimeout(async () => {
        await openEditForRecordId(props.editRecordId);
      }, 800);
    } else if (props.visitContext && props.show) {
      setTimeout(() => {
        openNewVaccinationModal();
      }, 500);
    }
  }
  outsideImmunization.value = !!props.defaultOutside;
});
</script>

<style scoped>
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
