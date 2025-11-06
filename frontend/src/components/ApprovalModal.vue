<template>
  <div class="approval-backdrop">
    <div class="approval-modal">
      <h3>Require approval</h3>
      <p class="hint">
        Enter approver credentials (not the current user, and not a guardian or BHS staff)
      </p>
      <div class="form-group">
        <label>Identifier (email, username, or phone)</label>
        <input
          v-model="identifier"
          type="text"
          class="form-input"
        >
      </div>
      <div class="form-group">
        <label>Password</label>
        <input
          v-model="password"
          type="password"
          class="form-input"
        >
      </div>
      <div
        v-if="error"
        class="error"
      >
        {{ error }}
      </div>
      <div class="actions">
        <button
          class="btn"
          :disabled="loading"
          @click="onCancel"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="onConfirm"
        >
          <span v-if="!loading">Confirm</span>
          <span v-else>Checking...</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'
import { getUserId } from '@/services/auth'

const props = defineProps({})
const emit = defineEmits(['approved','cancel'])

const identifier = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const onCancel = () => {
  error.value = ''
  identifier.value = ''
  password.value = ''
  emit('cancel')
}

const onConfirm = async () => {
  error.value = ''
  if (!identifier.value || !password.value) {
    error.value = 'Please enter approver identifier and password.'
    return
  }
  loading.value = true
  try {
    // Call auth login directly WITHOUT storing tokens locally. Use fetch to avoid side effects.
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.value, password: password.value })
    })
    const json = await res.json()
    if (!res.ok) {
      error.value = json?.message || 'Invalid credentials'
      loading.value = false
      return
    }
    const approver = json.user
    // Basic checks: not current user, not guardian, not BHS (hw_type includes 'bhs')
    const currentId = getUserId()
    if (!approver) {
      error.value = 'Invalid approver response'
      loading.value = false
      return
    }
    if (approver.user_id === currentId || approver.id === currentId) {
      error.value = 'Approver cannot be the current user'
      loading.value = false
      return
    }
    const role = (approver.role || approver.user_role || '').toString().toLowerCase()
    if (role.includes('guardian')) {
      error.value = 'Approver cannot be a guardian'
      loading.value = false
      return
    }
    const hwType = (approver.hw_type || approver.hs_type || approver.type || '').toString().toLowerCase()
    if (hwType && hwType.includes('bhs')) {
      error.value = 'Approver cannot be BHS staff'
      loading.value = false
      return
    }

    // success
    emit('approved', approver)
  } catch (e) {
    console.error('Approval check failed', e)
    error.value = 'Approval check failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.approval-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index: 2000;
}
.approval-modal {
  width: 92%;
  max-width: 420px;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
.form-input { width: 100%; padding: 0.5rem; margin-top: 0.25rem; border: 1px solid #ddd; border-radius: 4px }
.actions { display:flex; gap: 0.5rem; justify-content:flex-end; margin-top:1rem }
.btn { padding: 0.5rem 0.75rem; border-radius:6px; border:none; background:#eee }
.btn-primary { background: linear-gradient(135deg,#667eea,#764ba2); color: white }
.error { color: #b91c1c; margin-top: 0.5rem }
.hint { font-size: 0.9rem; color: #374151 }
</style>
