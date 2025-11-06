<template>
  <HealthWorkerLayout :show-controls="false">
    <div class="header">
      <button
        class="back"
        @click="goBack"
      >
        <i class="bi bi-chevron-left" />
      </button>
      <h1 class="title">
        Edit Visit
      </h1>
      <div style="width:36px" />
    </div>

    <div class="content">
      <div
        v-if="loading"
        class="loading"
      >
        <div class="spinner" />
        <p>Loading visit...</p>
      </div>

      <div
        v-else-if="visit"
        class="grid"
      >
        <!-- Visit info -->
        <div class="card">
          <h3 class="card-title">
            <i class="bi bi-clipboard2-pulse" /> Visit Info
          </h3>
          <div class="row">
            <div>
              <div class="label">
                Visit Date
              </div>
              <div class="value">
                {{ formatDate(visit.visit_date) }}
              </div>
            </div>
            <div>
              <div class="label">
                Recorded By
              </div>
              <div class="value">
                {{ visit.recorded_by_name || visit.recorded_by || '—' }}
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Findings / Notes</label>
            <textarea
              v-model="form.findings"
              class="form-input"
              rows="4"
              placeholder="Enter clinical notes..."
            />
          </div>
        </div>

        <!-- Vitals -->
        <div class="card">
          <h3 class="card-title">
            <i class="bi bi-heart-pulse" /> Vital Signs
          </h3>
          <div class="vitals-grid">
            <div class="form-group">
              <label class="form-label">Temperature (°C)</label>
              <input
                v-model="form.vitals.temperature"
                class="form-input"
                type="number"
                step="0.1"
              >
            </div>
            <div class="form-group">
              <label class="form-label">Weight (kg)</label>
              <input
                v-model="form.vitals.weight"
                class="form-input"
                type="number"
                step="0.1"
              >
            </div>
            <div class="form-group">
              <label class="form-label">Height (cm)</label>
              <input
                v-model="form.vitals.height"
                class="form-input"
                type="number"
                step="0.1"
              >
            </div>
            <div class="form-group">
              <label class="form-label">MUAC (cm)</label>
              <input
                v-model="form.vitals.muac"
                class="form-input"
                type="number"
                step="0.1"
              >
            </div>
            <div class="form-group">
              <label class="form-label">Respiration (/min)</label>
              <input
                v-model="form.vitals.respiration"
                class="form-input"
                type="number"
                step="1"
              >
            </div>
          </div>
          <small class="form-hint">Vitals are saved to this visit.
          </small>
        </div>

        <!-- Services quick-add (Nurse/Nutritionist only) -->
        <div
          v-if="isNurseOrNutritionist"
          class="card"
        >
          <h3 class="card-title">
            <i class="bi bi-ui-checks" /> Add Services
          </h3>
          <div class="actions">
            <button
              class="btn"
              :disabled="saving"
              @click="openVaccineModal"
            >
              <i class="bi bi-plus-circle" /> Add Service
            </button>
          </div>
          <small class="form-hint">Use the Add Immunization page to record vaccines.</small>
        </div>
        
        <!-- Vaccine Service Modal (reuse same component as Add Immunization page) -->
        <VaccineServiceFormModal
          v-model:show="showVaccineForm"
          :editing-index="null"
          :editing-service="null"
          :current-patient="modalPatient"
          @save="saveVaccineService"
        />

        <div class="actions sticky">
          <button
            class="btn ghost"
            :disabled="saving"
            @click="goBack"
          >
            Cancel
          </button>
          <button
            class="btn primary"
            :disabled="saving"
            @click="save"
          >
            <span
              v-if="saving"
              class="spinner small"
            />
            <span v-else><i class="bi bi-check2-circle" /></span>
            <span>{{ saving ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </div>

      <div
        v-else
        class="error"
      >
        <i class="bi bi-exclamation-triangle" />
        <p>Visit not found.</p>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import VaccineServiceFormModal from '@/features/health-worker/patients/components/VaccineServiceFormModal.vue'
import api from '@/services/api'
import { addToast } from '@/composables/useToast'
import { getUser } from '@/services/auth'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const visit = ref(null)
const form = ref({
  findings: '',
  vitals: { temperature: '', weight: '', height: '', muac: '', respiration: '' }
})
const showVaccineForm = ref(false)
const currentUser = ref(getUser())
const hsType = computed(() => String(currentUser.value?.hs_type || currentUser.value?.type || '').toLowerCase())
const isNurseOrNutritionist = computed(() => ['nurse','nutritionist'].some(t => hsType.value.includes(t)))
const modalPatient = computed(() => ({ patient_id: route.params.patientId }))

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'})

const goBack = () => router.back()

const openVaccineModal = () => { showVaccineForm.value = true }

const load = async () => {
  try {
    loading.value = true
    const { patientId, visitId } = route.params
    const res = await api.get(`/visits/${visitId}`)
    const data = res.data?.data || res.data || null
    visit.value = data
    form.value.findings = data?.findings || ''
    // Prefill vitals from visit payload if present (some views may embed vitals)
    const vFromVisit = data?.vitals || data || {}
    form.value.vitals = {
      temperature: vFromVisit.temperature || '',
      weight: vFromVisit.weight || '',
      height: vFromVisit.height || vFromVisit.height_length || '',
      muac: vFromVisit.muac || '',
      respiration: vFromVisit.respiration || vFromVisit.respiration_rate || ''
    }
    // Fetch current vitals explicitly to ensure accuracy
    try {
      const vres = await api.get(`/vitalsigns/${visitId}`)
      const v = vres.data?.data || vres.data || null
      if (v) {
        form.value.vitals = {
          temperature: v.temperature ?? form.value.vitals.temperature,
          weight: v.weight ?? form.value.vitals.weight,
          height: v.height ?? v.height_length ?? form.value.vitals.height,
          muac: v.muac ?? form.value.vitals.muac,
          respiration: v.respiration ?? v.respiration_rate ?? form.value.vitals.respiration,
        }
      }
    } catch(_) { /* ignore 404: vitals may not exist yet */ }
  } catch (e) {
    visit.value = null
  } finally {
    loading.value = false
  }
}

const save = async () => {
  try {
    saving.value = true
    const { visitId } = route.params
    // Update visit findings
    await api.put(`/visits/${visitId}`, { findings: form.value.findings })
    // Upsert vitals for this visit (backend supports PUT /vitalsigns/:visitId)
    await api.put(`/vitalsigns/${visitId}`, { 
      temperature: form.value.vitals.temperature || null,
      weight: form.value.vitals.weight || null,
      height: form.value.vitals.height || null,
      muac: form.value.vitals.muac || null,
      respiration: form.value.vitals.respiration || null,
    })
    addToast({ title: 'Saved', message: 'Visit updated successfully', type: 'success' })
    goBack()
  } catch (e) {
    addToast({ title: 'Error', message: e?.response?.data?.message || e.message || 'Failed to save visit', type: 'error' })
  } finally {
    saving.value = false
  }
}

const addDeworming = async () => {
  try {
    const { visitId } = route.params
    await api.post('/deworming', { visit_id: visitId })
    addToast({ title: 'Deworming Added', message: 'Deworming recorded for this visit', type: 'success' })
  } catch (e) {
    addToast({ title: 'Error', message: e?.response?.data?.message || 'Failed to add deworming', type: 'error' })
  }
}
const addVitA = async () => {
  try {
    const { visitId } = route.params
    // For in-facility VitA, backend requires inventory_id; here we let staff add outside-service quickly
    await api.post('/vitamina', { visit_id: visitId, outside: true })
    addToast({ title: 'Vitamin A Added', message: 'Vitamin A recorded for this visit', type: 'success' })
  } catch (e) {
    addToast({ title: 'Error', message: e?.response?.data?.message || 'Failed to add Vitamin A', type: 'error' })
  }
}

const saveVaccineService = async (svc) => {
  // Normalize and post immediately as an immunization linked to this visit
  try {
    saving.value = true
    const { visitId, patientId } = route.params
    const outsideFacility = !!(svc.outsideFacility || svc.outside_facility)
    const vaccineId = svc.vaccineId || svc.vaccine_id
    let administeredDate = svc.dateAdministered || svc.date_administered || null
    if (administeredDate) {
      const d = new Date(administeredDate)
      if (!isNaN(d.getTime())) administeredDate = d.toISOString().slice(0,10)
    }

    const payload = {
      visit_id: visitId,
      patient_id: patientId,
      inventory_id: outsideFacility ? null : (svc.inventoryId || svc.inventory_id || null),
      vaccine_id: vaccineId ? Number(vaccineId) : null,
      vaccine_name: svc.vaccineName || svc.vaccine_name || null,
      disease_prevented: svc.diseasePrevented || svc.disease_prevented || null,
      dose_number: svc.doseNumber ? Number(svc.doseNumber) : null,
      administered_date: administeredDate,
      age_at_administration: svc.ageAtAdmin || svc.age_at_admin || null,
      manufacturer: svc.manufacturer || null,
      lot_number: svc.lotNumber || svc.lot_number || null,
      site: svc.site || null,
      administered_by: currentUser.value?.user_id || null,
      facility_name: svc.facilityName || svc.facility_name || null,
      outside: outsideFacility,
      remarks: (() => {
        const base = svc.remarks || svc.note || ''
        const parts = []
        const lot = svc.lotNumber || svc.lot_number
        if (lot) parts.push(`Lot: ${lot}`)
        const manuf = svc.manufacturer
        if (manuf) parts.push(`Manufacturer: ${manuf}`)
        if (outsideFacility) {
          if (svc.site) parts.push(`Site: ${svc.site}`)
          const fac = svc.facilityName || svc.facility_name
          if (fac) parts.push(`Facility: ${fac}`)
        }
        if (base && parts.length) return `${base} | ${parts.join(' | ')}`
        if (!base && parts.length) return parts.join(' | ')
        return base || null
      })()
    }

    await api.post('/immunizations', payload)
    addToast({ title: 'Service Added', message: 'Vaccine immunization recorded for this visit', type: 'success' })
  } catch (e) {
    addToast({ title: 'Error', message: e?.response?.data?.message || e.message || 'Failed to add service', type: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.header{position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem}
.title{font-size:1.1rem;font-weight:600;margin:0}
.back{background:transparent;border:none;width:36px;height:36px;border-radius:8px}
.content{padding:1rem}
.loading,.error{display:flex;flex-direction:column;align-items:center;gap:.75rem;padding:2rem}
.spinner{width:32px;height:32px;border:4px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite}
.spinner.small{width:16px;height:16px;border-width:2px}
@keyframes spin{to{transform:rotate(360deg)}}
.grid{display:flex;flex-direction:column;gap:1rem}
.card{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);padding:1rem}
.card-title{display:flex;align-items:center;gap:.5rem;font-size:1rem;margin:0 0 .75rem 0;color:#007bff}
.row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin-bottom:.75rem}
.label{font-size:.8rem;color:#6b7280}
.value{font-weight:600;color:#111827}
.form-group{margin-bottom:.75rem}
.form-label{display:block;font-weight:500;margin-bottom:.375rem}
.form-input{width:100%;padding:.625rem;border:1px solid #d1d5db;border-radius:8px}
.vitals-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}
.actions{display:flex;gap:.5rem;flex-wrap:wrap}
.actions.sticky{position:sticky;bottom:60px;background:#fff;border-top:1px solid #e5e7eb;justify-content:flex-end;padding:1rem;border-radius:0 0 12px 12px}
.btn{display:flex;align-items:center;gap:.5rem;padding:.5rem .875rem;border:none;border-radius:8px;background:#f3f4f6;cursor:pointer}
.btn.primary{background:#10b981;color:#fff}
.btn.ghost{background:#f3f4f6}

/* Modal */
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:flex-end;justify-content:center;z-index:1000}
.modal{background:#fff;width:100%;max-width:520px;border-radius:12px 12px 0 0;box-shadow:0 -6px 20px rgba(0,0,0,0.2);padding:1rem 1rem 0.75rem}
.modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem}
.modal-header h4{display:flex;align-items:center;gap:.5rem;margin:0;font-size:1rem}
.modal-close{background:transparent;border:none;width:32px;height:32px;border-radius:8px;cursor:pointer}
.modal-body{padding:.25rem 0 .5rem}
.modal-actions{display:flex;justify-content:flex-end;gap:.5rem;border-top:1px solid #e5e7eb;padding:0.75rem 0 0;margin-top:0.5rem}
</style>
