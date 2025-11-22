<template>
  <AppModal
    :show="show"
    title="Stay Updated"
    size="md"
    @close="handleMaybeLater"
  >
    <div class="push-permission-content">
      <!-- Icon -->
      <div class="text-center mb-4">
        <div class="notification-icon-wrapper">
          <i class="bi bi-bell-fill text-primary" />
        </div>
      </div>

      <!-- Title -->
      <h5 class="text-center mb-3 fw-bold">
        Enable Push Notifications
      </h5>

      <!-- Description -->
      <p class="text-center text-muted mb-4">
        Stay informed about important updates:
      </p>

      <!-- Benefits -->
      <ul class="benefits-list mb-4">
        <li>
          <i class="bi bi-check-circle-fill text-success me-2" />
          <span>Real-time vaccination reminders</span>
        </li>
        <li>
          <i class="bi bi-check-circle-fill text-success me-2" />
          <span>Schedule updates and changes</span>
        </li>
        <li>
          <i class="bi bi-check-circle-fill text-success me-2" />
          <span>Important health alerts</span>
        </li>
        <li>
          <i class="bi bi-check-circle-fill text-success me-2" />
          <span>New messages from health workers</span>
        </li>
      </ul>

      <!-- Privacy Note -->
      <div class="privacy-note mb-4">
        <i class="bi bi-shield-check me-2 text-info" />
        <small class="text-muted">
          You can disable notifications anytime in your browser settings.
        </small>
      </div>

      <!-- Actions -->
      <div class="d-flex gap-2">
        <button
          class="btn btn-outline-secondary flex-fill"
          @click="handleMaybeLater"
        >
          Maybe Later
        </button>
        <button
          class="btn btn-primary flex-fill"
          :disabled="loading"
          @click="handleEnable"
        >
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm me-2"
          />
          <i
            v-else
            class="bi bi-bell-fill me-2"
          />
          Enable Notifications
        </button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref } from 'vue'
import AppModal from '@/components/ui/base/AppModal.vue'
import { usePushNotifications } from '@/composables/usePushNotifications'
import { useToast } from '@/composables/useToast'

defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'enabled', 'dismissed'])

const { subscribe } = usePushNotifications()
const { addToast } = useToast()
const loading = ref(false)

const handleEnable = async () => {
  loading.value = true

  try {
    const success = await subscribe()

    if (success) {
      addToast({
        title: 'Notifications Enabled',
        message: 'You will now receive push notifications for important updates.',
        type: 'success'
      })
      emit('enabled')
      emit('close')
    } else {
      addToast({
        title: 'Permission Denied',
        message: 'Please enable notifications in your browser settings to receive alerts.',
        type: 'warning'
      })
    }
  } catch (error) {
    console.error('Failed to enable notifications:', error)
    addToast({
      title: 'Error',
      message: 'Failed to enable notifications. Please try again.',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const handleMaybeLater = () => {
  emit('dismissed')
  emit('close')
}
</script>

<style scoped>
.push-permission-content {
  padding: 1rem 0;
}

.notification-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.notification-icon-wrapper i {
  font-size: 2.5rem;
  color: white !important;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefits-list li {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.95rem;
}

.benefits-list li i {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.privacy-note {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
}

.privacy-note i {
  font-size: 1.2rem;
  flex-shrink: 0;
}
</style>
