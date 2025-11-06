<template>
  <div>
    <div
      class="modal fade show"
      tabindex="-1"
      style="display: block;"
    >
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              Edit Profile
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="$emit('close')"
            />
          </div>
          <div class="modal-body">
            <h6 class="section-header">
              Account Information
            </h6>
            
            <div class="info-display">
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">{{ userInfo.email || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">{{ userInfo.contact_number || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Alt. Phone:</span>
                <span class="info-value">{{ userInfo.alternative_contact_number || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Occupation:</span>
                <span class="info-value">{{ userInfo.occupation || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Member Since:</span>
                <span class="info-value">{{ memberSince || 'N/A' }}</span>
              </div>
            </div>

            <div class="action-buttons">
              <button
                class="btn btn-outline-primary w-100 mb-2"
                @click="$emit('edit-form')"
              >
                <i class="bi bi-pencil me-2" />Edit Profile
              </button>
              <button
                class="btn btn-outline-secondary w-100 mb-2"
                @click="$emit('change-password')"
              >
                <i class="bi bi-key me-2" />Change Password
              </button>
              <button
                class="btn btn-outline-danger w-100"
                @click="$emit('logout')"
              >
                <i class="bi bi-box-arrow-right me-2" />Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate } from '@/composables/useDateFormat'

const props = defineProps({
  userInfo: {
    type: Object,
    required: true
  }
})

defineEmits(['close', 'edit-form', 'change-password', 'logout'])

const memberSince = computed(() => {
  const created = props.userInfo?.created_at || props.userInfo?.createdAt
  return created ? formatDate(created) : 'N/A'
})
</script>

<style scoped>
.section-header {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.info-display {
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f3f4;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #6c757d;
  font-size: 0.875rem;
}

.info-value {
  color: #333;
  font-size: 0.875rem;
  text-align: right;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>
