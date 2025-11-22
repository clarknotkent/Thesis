<template>
  <div>
    <div
      class="modal fade show"
      tabindex="-1"
      style="display: block;"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Change Password
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="$emit('close')"
            />
          </div>
          <div class="modal-body">
            <div class="mb-2">
              <label class="form-label">Current Password</label>
              <div class="input-group">
                <input 
                  v-model="localPwd.current" 
                  :type="showCurrentPwd ? 'text' : 'password'" 
                  class="form-control"
                  placeholder="Enter current password" 
                >
                <button 
                  class="btn btn-outline-secondary" 
                  type="button"
                  @click="showCurrentPwd = !showCurrentPwd"
                >
                  <i :class="showCurrentPwd ? 'bi bi-eye-slash' : 'bi bi-eye'" />
                </button>
              </div>
            </div>
            <div class="mb-2">
              <label class="form-label">New Password</label>
              <div class="input-group">
                <input 
                  v-model="localPwd.next" 
                  :type="showNewPwd ? 'text' : 'password'" 
                  class="form-control"
                  placeholder="Enter new password"
                >
                <button 
                  class="btn btn-outline-secondary" 
                  type="button"
                  @click="showNewPwd = !showNewPwd"
                >
                  <i :class="showNewPwd ? 'bi bi-eye-slash' : 'bi bi-eye'" />
                </button>
              </div>
              <small class="text-muted">Minimum 8 characters</small>
            </div>
            <div class="mb-2">
              <label class="form-label">Confirm New Password</label>
              <div class="input-group">
                <input 
                  v-model="localPwd.confirm" 
                  :type="showConfirmPwd ? 'text' : 'password'" 
                  class="form-control"
                  placeholder="Re-enter new password"
                >
                <button 
                  class="btn btn-outline-secondary" 
                  type="button"
                  @click="showConfirmPwd = !showConfirmPwd"
                >
                  <i :class="showConfirmPwd ? 'bi bi-eye-slash' : 'bi bi-eye'" />
                </button>
              </div>
            </div>
            
            <!-- Password strength indicator -->
            <div
              v-if="localPwd.next"
              class="mt-2"
            >
              <small :class="passwordStrengthClass">
                {{ passwordStrengthText }}
              </small>
            </div>
            
            <!-- Validation messages -->
            <div
              v-if="validationError"
              class="alert alert-warning py-2 px-3 mt-2 mb-0"
            >
              <small>{{ validationError }}</small>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button 
              class="btn btn-primary" 
              :disabled="changing || !isValid" 
              @click="handleSave"
            >
              <i
                v-if="changing"
                class="bi bi-hourglass-split fa-spin me-1"
              />
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({
  changing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save'])

const showCurrentPwd = ref(false)
const showNewPwd = ref(false)
const showConfirmPwd = ref(false)

const localPwd = ref({
  current: '',
  next: '',
  confirm: ''
})

const validationError = computed(() => {
  if (!localPwd.value.current && !localPwd.value.next && !localPwd.value.confirm) {
    return null
  }
  
  if (!localPwd.value.current) {
    return 'Current password is required'
  }
  
  if (!localPwd.value.next) {
    return 'New password is required'
  }
  
  if (localPwd.value.next.length < 8) {
    return 'New password must be at least 8 characters'
  }
  
  if (localPwd.value.next !== localPwd.value.confirm) {
    return 'New passwords do not match'
  }
  
  return null
})

const isValid = computed(() => {
  return localPwd.value.current && 
         localPwd.value.next && 
         localPwd.value.confirm &&
         localPwd.value.next.length >= 8 &&
         localPwd.value.next === localPwd.value.confirm
})

const passwordStrength = computed(() => {
  const pwd = localPwd.value.next
  if (!pwd) return 0
  
  let strength = 0
  if (pwd.length >= 8) strength++
  if (pwd.length >= 12) strength++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
  if (/\d/.test(pwd)) strength++
  if (/[^a-zA-Z\d]/.test(pwd)) strength++
  
  return strength
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'Weak password'
  if (strength === 2) return 'Fair password'
  if (strength === 3) return 'Good password'
  if (strength === 4) return 'Strong password'
  return 'Very strong password'
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'text-danger'
  if (strength === 2) return 'text-warning'
  if (strength >= 3) return 'text-success'
  return 'text-success'
})

const handleSave = () => {
  if (!isValid.value) return
  emit('save', localPwd.value)
  // Clear form after save attempt
  localPwd.value = { current: '', next: '', confirm: '' }
}
</script>

<style scoped>
.form-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #495057;
  margin-bottom: 0.375rem;
}

.form-control {
  font-size: 0.875rem;
}

.alert {
  font-size: 0.8125rem;
  border-radius: 0.375rem;
}
</style>
