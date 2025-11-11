<template>
  <div class="form-section visit-selector-section">
    <h3 class="section-title">
      <i class="bi bi-journal-medical" />
      Visit
    </h3>

    <div class="form-group">
      <label class="form-label">Visit for today</label>
      <div class="visit-status">
        <template v-if="visitMode === 'existing' && existingVisit">
          <div class="status-row">
            <i class="bi bi-check-circle-fill text-success" />
            <span>Attached to today's visit</span>
          </div>
          <div class="meta">
            <div>
              <span class="meta-label">Date:</span>
              <span class="meta-value">{{ formatDate(existingVisit.visit_date) }}</span>
            </div>
            <div>
              <span class="meta-label">Recorded by:</span>
              <span class="meta-value">{{ existingVisit.recorded_by_name || existingVisit.recorded_by || '—' }}</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="status-row">
            <i class="bi bi-plus-circle-fill text-primary" />
            <span>No visit yet today — will create a new visit</span>
          </div>
        </template>
      </div>
      <small class="form-hint">One visit per day is enforced automatically.</small>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { addToast } from '@/composables/useToast'

// Props from parent (visit assignment context)
defineProps({
  visitMode: { type: String, required: true },
  existingVisitId: { type: String, default: '' },
  availableVisits: { type: Array, default: () => [] },
  loadingVisits: { type: Boolean, default: false }
})

// Emitted events for parent coordination
const emit = defineEmits(['update:visitMode', 'update:existingVisitId', 'ensure-visits-loaded'])

const route = useRoute()
const existingVisit = ref(null)

// Core logic: check if a visit exists for today; if so, switch to existing mode
const checkTodayVisitAndCorrect = async () => {
  const patientId = route.params.patientId || route.params.id
  if (!patientId) return false
  try {
    // Use date-only string for comparison (YYYY-MM-DD)
    const today = new Date()
    const visitDateStr = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0')
    
    console.log('🔍 [VisitSelector] DEBUG - Date comparison:')
    console.log('  Current date (now):', today.toISOString())
    console.log('  Visit date string:', visitDateStr)
    console.log('  Today components:', { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() })
    
    const { data } = await api.get('/visits/exists/check', { params: { patient_id: patientId, visit_date: visitDateStr } })
    
    console.log('🔍 [VisitSelector] API response:', data)
    
    if (data && typeof data.exists === 'boolean') {
      console.log('🔍 [VisitSelector] Visit exists:', data.exists, 'Visit ID:', data.visit_id)
      if (data.exists) {
        addToast({ title: 'Visit already exists', message: 'Switched to today\'s existing visit.', type: 'info' })
        emit('update:visitMode', 'existing')
        const foundId = String(data.visit_id || '')
        emit('update:existingVisitId', foundId)
        // Fetch full visit details for richer display
        try {
          if (foundId) {
            const vres = await api.get(`/visits/${foundId}`)
            existingVisit.value = vres.data?.data || vres.data || null
            console.log('🔍 [VisitSelector] Fetched visit details:', existingVisit.value)
          }
        } catch (_) { existingVisit.value = null }
        emit('ensure-visits-loaded')
        return true
      }
      return false
    }
    // Offline / cached fallback shape handling
    const cachedVisits = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : [])
    console.log('🔍 [VisitSelector] Using cached visits fallback, found', cachedVisits.length, 'visits')
    
    const sameDay = cachedVisits.find(v => {
      if (!v || String(v.patient_id) !== String(patientId) || !v.visit_date) {
        console.log('🔍 [VisitSelector] Skipping visit:', v?.visit_id, 'patient_id:', v?.patient_id, 'visit_date:', v?.visit_date)
        return false
      }
      const vd = new Date(v.visit_date)
      const cd = new Date()
      const isSameDay = vd.getFullYear() === cd.getFullYear() && vd.getMonth() === cd.getMonth() && vd.getDate() === cd.getDate()
      
      console.log('🔍 [VisitSelector] Comparing dates:')
      console.log('  Visit date:', v.visit_date, '->', vd.toISOString())
      console.log('  Current date:', cd.toISOString())
      console.log('  Same day?', isSameDay)
      
      return isSameDay
    })
    
    if (sameDay) {
      console.log('🔍 [VisitSelector] Found same day visit in cache:', sameDay.visit_id)
      addToast({ title: 'Visit already exists', message: 'Switched to today\'s existing visit.', type: 'info' })
      emit('update:visitMode', 'existing')
      const foundId = String(sameDay.visit_id || '')
      emit('update:existingVisitId', foundId)
      existingVisit.value = sameDay
      emit('ensure-visits-loaded')
      return true
    }
    
    console.log('🔍 [VisitSelector] No existing visit found for today')
  } catch (err) {
    console.error('🔍 [VisitSelector] Error checking today\'s visit:', err)
    addToast({ title: 'Notice', message: 'Unable to verify today\'s visit. You may proceed.', type: 'warning' })
  }
  return false
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(async () => { await checkTodayVisitAndCorrect() })
</script>

<style scoped>
.visit-selector-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
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

.visit-status { display: flex; flex-direction: column; gap: 0.5rem; }
.status-row { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #374151; }
.status-row .text-success { color: #10b981 !important; }
.status-row .text-primary { color: #3b82f6 !important; }
.meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; font-size: 0.9rem; }
.meta-label { color: #6b7280; margin-right: 0.25rem; }
.meta-value { color: #111827; font-weight: 500; }

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
