<template>
  <div>
    <div
      v-if="show"
      class="modal fade show"
      tabindex="-1"
      style="display: block;"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Start a new chat
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="$emit('close')"
            />
          </div>
          <div class="modal-body">
            <!-- Mode toggle: Team vs Staff -->
            <ul class="nav nav-pills gap-2 mb-3">
              <li class="nav-item">
                <button 
                  class="nav-link" 
                  :class="{ active: mode === 'team' }" 
                  @click="$emit('update:mode', 'team')"
                >
                  <i class="bi bi-people me-1" /> Message Health Center
                </button>
              </li>
              <li class="nav-item">
                <button 
                  class="nav-link" 
                  :class="{ active: mode === 'staff' }" 
                  @click="$emit('update:mode', 'staff')"
                >
                  <i class="bi bi-person-badge me-1" /> Choose Staff
                </button>
              </li>
            </ul>

            <div
              v-if="mode === 'team'"
              class="alert alert-info py-2"
            >
              We'll route your message to an available health worker from your health center.
            </div>

            <div
              v-if="mode === 'staff'"
              class="mb-3"
            >
              <label class="form-label">Select staff</label>
              <select 
                class="form-select" 
                :value="selectedStaffId" 
                @input="$emit('update:selectedStaffId', $event.target.value)"
              >
                <option
                  value=""
                  disabled
                >
                  Select a staff member
                </option>
                <option 
                  v-for="u in staffOptions" 
                  :key="u.__id" 
                  :value="u.__id"
                >
                  {{ formatStaffName(u) }}
                </option>
              </select>
            </div>

            <div class="mb-2">
              <label class="form-label">Message</label>
              <textarea 
                :value="message" 
                class="form-control"
                rows="3" 
                placeholder="Type your message..." 
                @input="$emit('update:message', $event.target.value)"
              />
              <div class="text-muted small mt-1">
                {{ message.length }}/1000
              </div>
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
              :disabled="isDisabled"
              @click="$emit('create')"
            >
              <i
                v-if="creating"
                class="bi bi-hourglass-split fa-spin me-1"
              />
              Start
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="show"
      class="modal-backdrop fade show"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  mode: {
    type: String,
    required: true
  },
  staffOptions: {
    type: Array,
    required: true
  },
  selectedStaffId: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  creating: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'update:mode', 'update:selectedStaffId', 'update:message', 'create'])

const isDisabled = computed(() => {
  const msg = (props.message || '').trim()
  const msgOk = msg.length > 0 && msg.length <= 1000
  if (!msgOk || props.creating) return true
  if (props.mode === 'staff') return !props.selectedStaffId
  return false
})

const formatStaffName = (u) => {
  const name = u.full_name || u.name || ('User #' + u.__id)
  const type = u.hs_type ? ' — ' + prettyHsType(u.hs_type) : ''
  const roleLabel = u.role ? ' — ' + prettyRole(u.role) : ''
  return name + type + roleLabel
}

const prettyHsType = (t) => {
  if (!t) return ''
  const m = {
    bhw: 'Barangay Health Worker',
    midwife: 'Midwife',
    nurse: 'Nurse',
    doctor: 'Doctor',
    admin: 'Admin'
  }
  return m[t] || t
}

const prettyRole = (r) => {
  if (!r) return ''
  const token = String(r).toLowerCase()
  if (token === 'healthstaff' || token === 'health staff' || token === 'health_staff' || token === 'health-worker' || token === 'healthworker' || token === 'health_worker') return 'Health Staff'
  if (token === 'admin' || token === 'administrator' || token === 'system admin') return 'Admin'
  if (token === 'guardian' || token === 'parent') return 'Parent'
  return r
}
</script>

<style scoped>
.modal {
  z-index: 1050;
}

.modal-backdrop {
  z-index: 1040;
}

.nav-link {
  cursor: pointer;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-link:not(.active) {
  background: #f3f4f6;
  color: #6b7280;
}

.nav-link:not(.active):hover {
  background: #e5e7eb;
  color: #374151;
}

.nav-link.active {
  background: #6366f1;
  color: white;
}
</style>
