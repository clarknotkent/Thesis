<template>
  <div class="form-section visit-selector-section">
    <h3 class="section-title">
      <i class="bi bi-journal-medical"></i>
      Visit
    </h3>

    <div class="form-group">
      <label class="form-label">Attach to visit</label>
      <div class="visit-mode-options">
        <label class="radio-label">
          <input 
            type="radio" 
            :value="'new'" 
            :checked="visitMode === 'new'"
            @change="handleNewModeSelect"
          />
          <span>Create new visit</span>
        </label>
        <label class="radio-label">
          <input 
            type="radio" 
            :value="'existing'" 
            :checked="visitMode === 'existing'"
            @change="handleExistingModeSelect"
          />
          <span>Use existing visit</span>
        </label>
      </div>
      <small v-if="visitMode === 'existing'" class="form-hint">
        Select a recent visit for this patient (preferably created by BHS)
      </small>
    </div>

    <div v-if="visitMode === 'existing'" class="form-group">
      <label class="form-label">Existing Visits</label>
      <select 
        class="form-input" 
        :value="existingVisitId"
        @change="$emit('update:existingVisitId', $event.target.value)"
        :disabled="loadingVisits"
      >
        <option value="">{{ loadingVisits ? 'Loading visits...' : 'Select a visit' }}</option>
        <option 
          v-for="visit in availableVisits" 
          :key="visit.visit_id" 
          :value="String(visit.visit_id)"
        >
          {{ formatDate(visit.visit_date) }} — {{ visit.service_rendered || 'No services yet' }}
        </option>
      </select>
      <small v-if="availableVisits.length === 0 && !loadingVisits" class="form-hint text-warning">
        No recent visits found. Consider creating a new visit instead.
      </small>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/offlineAPI'
import { addToast } from '@/composables/useToast'

defineProps({
  visitMode: {
    type: String,
    required: true
  },
  existingVisitId: {
    type: String,
    default: ''
  },
  availableVisits: {
    type: Array,
    default: () => []
  },
  loadingVisits: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visitMode', 'update:existingVisitId', 'ensure-visits-loaded'])

const route = useRoute()

// Centralized check: if a visit exists today, auto-correct to existing and toast
const checkTodayVisitAndCorrect = async () => {
  const patientId = route.params.patientId || route.params.id
  if (!patientId) return
  try {
    const visitDateIso = new Date().toISOString()
    const { data } = await api.get('/visits/exists/check', { params: { patient_id: patientId, visit_date: visitDateIso } })
    // Online success path with expected shape
    if (data && typeof data.exists === 'boolean') {
      if (data.exists) {
        addToast({
          title: 'Visit already exists',
          message: 'A visit already exists for this patient today. Switched to use existing visit.',
          type: 'info'
        })
        emit('update:visitMode', 'existing')
        emit('update:existingVisitId', String(data.visit_id || ''))
        emit('ensure-visits-loaded')
        return true
      }
      return false
    }

    // Offline fallback: data likely contains cached visits array or store contents
    const cachedVisits = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : [])
    const sameDay = cachedVisits.find(v => {
      if (!v || String(v.patient_id) !== String(patientId) || !v.visit_date) return false
      const vd = new Date(v.visit_date)
      const cd = new Date(visitDateIso)
      return vd.getFullYear() === cd.getFullYear() && vd.getMonth() === cd.getMonth() && vd.getDate() === cd.getDate()
    })
    if (sameDay) {
      addToast({
        title: 'Visit already exists',
        message: 'A visit already exists for this patient today. Switched to use existing visit.',
        type: 'info'
      })
      emit('update:visitMode', 'existing')
      emit('update:existingVisitId', String(sameDay.visit_id || ''))
      emit('ensure-visits-loaded')
      return true
    }
  } catch (err) {
    // Non-blocking failure: inform but keep current selection
    addToast({ title: 'Notice', message: 'Unable to check today\'s visit. Please try again.', type: 'warning' })
  }
  return false
}

const handleNewModeSelect = async () => {
  // Optimistically set to new, then correct if needed
  emit('update:visitMode', 'new')
  emit('update:existingVisitId', '')
  await checkTodayVisitAndCorrect()
}

const handleExistingModeSelect = () => {
  emit('update:visitMode', 'existing')
  emit('ensure-visits-loaded')
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Default is create new visit: run the check immediately on mount and correct if necessary
onMounted(async () => {
  await checkTodayVisitAndCorrect()
})
</script>

<style scoped>
.visit-selector-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.section-title i {
  color: #3b82f6;
  font-size: 1.2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.visit-mode-options {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: #4b5563;
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.radio-label span {
  user-select: none;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1f2937;
  background: white;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-hint {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.form-hint.text-warning {
  color: #f59e0b;
}
</style>
