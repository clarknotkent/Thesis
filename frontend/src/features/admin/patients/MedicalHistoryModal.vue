<template>
  <!-- Embedded Page View -->
  <div
    v-if="embeddedPage"
    class="medical-history-page container-fluid py-3"
  >
    <div class="d-flex align-items-center mb-3">
      <h3 class="mb-0">
        Medical History
      </h3>
      <button
        class="btn btn-outline-secondary ms-auto"
        @click="onClose"
      >
        Back
      </button>
    </div>

    <div class="card shadow-sm">
      <div class="card-body">
        <div
          v-if="loading"
          class="text-center py-4"
        >
          <div
            class="spinner-border text-primary"
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else>
          <div
            v-if="visits.length === 0"
            class="text-center text-muted py-4"
          >
            No visits found for this patient.
          </div>

          <div
            v-else
            class="list-group"
          >
            <button 
              v-for="v in visits" 
              :key="v.visit_id" 
              type="button" 
              class="list-group-item list-group-item-action d-flex justify-content-between align-items-start" 
              @click="selectVisit(v)"
            >
              <div>
                <div class="fw-semibold">
                  {{ formatDate(v.created_at || v.visit_date) }} - {{ v.visit_type || v.service_rendered || 'Visit' }}
                </div>
                <div class="text-muted small">
                  Recorded by: {{ v.recorded_by || v.recorded_by_name || v.recorded_by_user || '—' }}
                </div>
              </div>
              <small class="text-muted">
                {{ v.findings ? truncateText(v.findings, 30) : '' }}
              </small>
            </button>
          </div>

          <MedicalHistoryDetails
            v-if="selected"
            :visit="selected"
            :format-date="formatDate"
            :has-vital-signs="hasVitalSigns"
            :get-vital-sign="getVitalSign"
            class="mt-3"
            @close="onClose"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Modal View -->
  <div v-else>
    <div 
      class="modal fade" 
      :class="{ show: show }" 
      :style="{ display: show ? 'block' : 'none' }" 
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-clock-history me-2" />Medical History
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="$emit('close')"
            />
          </div>
          <div class="modal-body">
            <div
              v-if="loading"
              class="text-center py-4"
            >
              <div
                class="spinner-border text-primary"
                role="status"
              >
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>

            <div v-else>
              <div
                v-if="visits.length === 0"
                class="text-center text-muted py-4"
              >
                No visits found for this patient.
              </div>

              <div
                v-else
                class="list-group"
              >
                <button 
                  v-for="v in visits" 
                  :key="v.visit_id" 
                  type="button" 
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-start" 
                  @click="selectVisit(v)"
                >
                  <div>
                    <div class="fw-semibold">
                      {{ formatDate(v.created_at || v.visit_date) }} - {{ v.visit_type || v.service_rendered || 'Visit' }}
                    </div>
                    <div class="text-muted small">
                      Recorded by: {{ v.recorded_by || v.recorded_by_name || v.recorded_by_user || '—' }}
                    </div>
                  </div>
                  <small class="text-muted">
                    {{ v.findings ? truncateText(v.findings, 30) : '' }}
                  </small>
                </button>
              </div>

              <MedicalHistoryDetails
                v-if="selected"
                :visit="selected"
                :format-date="formatDate"
                :has-vital-signs="hasVitalSigns"
                :get-vital-sign="getVitalSign"
                class="mt-3"
                @close="$emit('close')"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="show && !embeddedPage"
      class="modal-backdrop fade show"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMedicalHistory } from '@/composables/useMedicalHistory'
import MedicalHistoryDetails from './components/MedicalHistoryDetails.vue'

const router = useRouter()

const props = defineProps({
  show: { 
    type: Boolean, 
    default: false 
  },
  patientId: { 
    type: [String, Number], 
    default: null 
  },
  embeddedPage: { 
    type: Boolean, 
    default: false 
  }
})

const emit = defineEmits(['close'])

const {
  visits,
  loading,
  fetchVisits,
  formatDate,
  hasVitalSigns,
  getVitalSign,
  truncateText
} = useMedicalHistory(props.patientId)

const selected = ref(null)

function selectVisit(v) {
  // Navigate to admin visit summary view by named route for reliability
  const id = String(v.visit_id || v.id || '')
  if (!id) return
  router.push({ name: 'AdminVisitSummary', params: { patientId: String(props.patientId), visitId: id } })
}

function onClose() {
  if (props.embeddedPage) {
    try { 
      router.back() 
    } catch (e) { 
      emit('close') 
    }
  } else {
    emit('close')
  }
}

onMounted(() => {
  if (props.embeddedPage && props.patientId) {
    fetchVisits(props.patientId)
  }
})

watch(() => props.patientId, (newVal) => {
  if (props.embeddedPage && newVal) {
    fetchVisits(newVal)
  }
})
</script>

<style scoped>
.medical-history-page .card { 
  min-height: 120px;
}

.modal.show { 
  background-color: rgba(0, 0, 0, 0.5); 
}
</style>
