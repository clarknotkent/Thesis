// Patient Management Feature Components
export { default as VisitEditor } from './VisitEditor.vue'
export { default as VaccinationRecordEditor } from './VaccinationRecordEditor.vue'
export { default as MedicalHistoryModal } from './MedicalHistoryModal.vue'
export { default as VisitSummaryView } from './VisitSummaryView.vue'
export { default as PatientForm } from './PatientForm.vue'
export { default as GuardianSelector } from './GuardianSelector.vue'
export { default as ScheduledVaccinations } from './ScheduledVaccinations.vue'
export { default as VaccinationHistory } from './VaccinationHistory.vue'
export { default as MedicalHistory } from './MedicalHistory.vue'

// Vaccination Record Editor Sub-Components
export { default as VaccinationHistoryTable } from './components/VaccinationHistoryTable.vue'
export { default as VaccinationScheduleTable } from './components/VaccinationScheduleTable.vue'
export { default as VaccinationFormModal } from './components/VaccinationFormModal.vue'
export { default as VisitPickerModal } from './components/VisitPickerModal.vue'

// Medical Record Editor Sub-Components
export { default as VitalSignsForm } from './components/VitalSignsForm.vue'
export { default as CollectedServicesList } from './components/CollectedServicesList.vue'
export { default as MedicalRecordVaccinationForm } from './components/MedicalRecordVaccinationForm.vue'

// Backwards compatibility aliases (deprecated)
export { default as VisitHistoryModal } from './MedicalHistoryModal.vue'
export { default as VisitHistory } from './MedicalHistory.vue'
