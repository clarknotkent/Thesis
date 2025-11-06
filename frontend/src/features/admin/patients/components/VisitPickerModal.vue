<template>
  <div>
    <div
      class="modal fade"
      :class="{ show: show }"
      :style="{ display: show ? 'block' : 'none', zIndex: 1060 }"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Select a Visit
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
              class="text-center py-3"
            >
              <div class="spinner-border text-primary" />
            </div>
            <div v-else>
              <div
                v-if="visits.length === 0"
                class="text-muted text-center py-3"
              >
                No visits found. Create a visit from Add Patient Record (in-facility).
              </div>
              <div class="list-group">
                <button 
                  v-for="v in visits" 
                  :key="v.visit_id || v.id" 
                  type="button" 
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" 
                  @click="$emit('pick-visit', v)"
                >
                  <span>{{ formatDateShort(v.created_at || v.visit_date) }}</span>
                  <small class="text-muted">{{ v.visit_type || v.service_rendered || 'Visit' }}</small>
                </button>
              </div>
              <div class="mt-3 d-flex justify-content-end">
                <button 
                  type="button" 
                  class="btn btn-outline-secondary btn-sm" 
                  @click="$emit('open-outside-record')"
                >
                  <i class="bi bi-geo-alt me-1" /> Outside record
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div 
      v-if="show" 
      class="modal-backdrop fade show" 
      :style="{ zIndex: 1050 }" 
      @click="$emit('close')"
    />
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  visits: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  formatDateShort: {
    type: Function,
    required: true
  }
});

defineEmits(['close', 'pick-visit', 'open-outside-record']);
</script>
