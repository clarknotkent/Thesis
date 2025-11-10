<template>
  <div class="detail-card mb-3">
    <div
      class="card-header dropdown-header"
      @click="toggleExpanded"
    >
      <h6 class="mb-0 d-flex justify-content-between align-items-center">
        <span>Vaccination History</span>
        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" />
      </h6>
    </div>
    <div
      v-show="isExpanded"
      class="card-body"
    >
      <!-- Has Vaccination History -->
      <div
        v-if="hasHistory"
        class="vaccination-history"
      >
        <div 
          v-for="vaccination in sortedVaccinationHistory" 
          :key="vaccination.id"
          class="vaccination-item"
        >
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-semibold">
                {{ vaccination.vaccineName }}
              </div>
              <div class="text-muted small">
                {{ formatDate(vaccination.dateAdministered) }}
              </div>
            </div>
            <span class="badge bg-success">Administered</span>
          </div>
        </div>
      </div>

      <!-- No Vaccination History -->
      <div
        v-else
        class="text-center py-4"
      >
        <i
          class="bi bi-clipboard-x text-muted mb-2"
          style="font-size: 2rem;"
        />
        <p class="text-muted mb-0">
          No vaccination records found
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  vaccinationHistory: {
    type: Array,
    default: () => []
  },
  initialExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])

const isExpanded = ref(props.initialExpanded)

const hasHistory = computed(() => {
  return props.vaccinationHistory && props.vaccinationHistory.length > 0
})

// Canonical order list for consistent display (aligned with Philippine EPI schedule - vaccines given together grouped)
const VACCINE_ORDER = [
  'BCG', 'BCG Vaccine',
  'Hepatitis B', 'Hepa B', 'Hep B', 'Hepatitis B Vaccine',
  'Pentavalent', 'DPT-HepB-Hib', 'DPT-Hep B-HIB', 'DPT-HepB-Hib Vaccine', 'Pentavalent Vaccine',
  'Pneumococcal', 'PCV', 'Pneumococcal Conjugate', 'Pneumococcal Vaccine', 'Pneumococcal Conjugate Vaccine',
  'Oral Polio', 'OPV', 'Oral Poliovirus', 'Oral Polio Vaccine', 'Oral Poliovirus Vaccine',
  'Inactivated Polio', 'IPV', 'Inactivated Poliovirus', 'Inactivated Polio Vaccine', 'Inactivated Poliovirus Vaccine',
  'Measles', 'MMR', 'Measles, Mumps, Rubella', 'Measles Vaccine', 'MMR Vaccine', 'Measles Mumps Rubella Vaccine'
]

const getOrderIndex = (name) => {
  if (!name) return 999
  const upper = String(name).toUpperCase().trim()
  for (let i = 0; i < VACCINE_ORDER.length; i++) {
    if (upper.includes(VACCINE_ORDER[i].toUpperCase())) return i
  }
  // Debug: log unmatched vaccine names
  console.warn('Unmatched vaccine name for ordering:', name)
  return 999
}

// Sorted vaccination history by canonical vaccine order
const sortedVaccinationHistory = computed(() => {
  if (!props.vaccinationHistory) return []
  return [...props.vaccinationHistory].sort((a, b) => {
    const nameA = a.vaccineName || a.vaccine_antigen_name || a.antigen_name || a.antigenName || 'Unknown Vaccine'
    const nameB = b.vaccineName || b.vaccine_antigen_name || b.antigen_name || b.antigenName || 'Unknown Vaccine'
    const orderA = getOrderIndex(nameA)
    const orderB = getOrderIndex(nameB)
    if (orderA !== orderB) return orderA - orderB
    // If same vaccine, sort by dose number
    const doseA = a.dose_number || a.doseNumber || a.dose || 0
    const doseB = b.dose_number || b.doseNumber || b.dose || 0
    return doseA - doseB
  })
})

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  emit('toggle', isExpanded.value)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not specified'
  try {
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  } catch {
    return dateString
  }
}

defineExpose({
  isExpanded,
  toggleExpanded
})
</script>

<style scoped>
.detail-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e9ecef;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.dropdown-header {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-header:hover {
  background: #e9ecef;
}

.dropdown-header i {
  color: #6c757d;
  transition: transform 0.2s ease;
}

.card-body {
  padding: 1rem;
}

.vaccination-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vaccination-item {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
}

@media (max-width: 576px) {
  .card-body, .card-header {
    padding: 0.75rem;
  }
}
</style>
