<template>
  <div
    v-if="show"
    class="modal fade show"
    style="display: block;"
    tabindex="-1"
    @click.self="cancel"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div
          class="modal-header"
          :class="`bg-${variant} bg-opacity-10`"
        >
          <h5 class="modal-title">
            <i
              :class="iconClass"
              class="me-2"
            />
            {{ title }}
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="cancel"
          />
        </div>
        <div class="modal-body">
          <p class="mb-0">
            {{ message }}
          </p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="cancel"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            :class="`btn btn-${variant}`"
            @click="confirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="show"
    class="modal-backdrop fade show"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'danger', // danger, warning, primary, success, info
    validator: (value) => ['danger', 'warning', 'primary', 'success', 'info'].includes(value)
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const iconClass = computed(() => {
  const icons = {
    danger: 'bi bi-exclamation-triangle-fill text-danger',
    warning: 'bi bi-exclamation-circle-fill text-warning',
    primary: 'bi bi-info-circle-fill text-primary',
    success: 'bi bi-check-circle-fill text-success',
    info: 'bi bi-info-circle-fill text-info'
  }
  return icons[props.variant] || icons.danger
})

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
