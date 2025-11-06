<template>
  <div
    v-if="show"
    class="modal-overlay"
    @click="$emit('close')"
  >
    <div
      class="modal-content"
      @click.stop
    >
      <div class="modal-header">
        <h5>New Conversation</h5>
        <button
          class="close-btn"
          @click="$emit('close')"
        >
          <i class="bi bi-x" />
        </button>
      </div>
      <div class="modal-body">
        <!-- Loading users state -->
        <div
          v-if="availableUsers.length === 0 && !creating"
          class="alert alert-info"
        >
          <i class="bi bi-info-circle me-2" />
          Loading available users...
        </div>
        
        <div class="form-group">
          <label for="recipient">Recipient: <span class="text-danger">*</span></label>
          <select 
            id="recipient"
            :value="recipientId"
            class="form-control" 
            :disabled="creating"
            @change="$emit('update:recipientId', $event.target.value)"
          >
            <option value="">
              Select recipient...
            </option>
            <option 
              v-for="user in availableUsers" 
              :key="user.user_id" 
              :value="user.user_id"
            >
              {{ user.full_name || `${user.firstname} ${user.surname}` }} ({{ user.role }})
            </option>
          </select>
          <small
            v-if="availableUsers.length === 0"
            class="text-muted"
          >
            No users available. Please refresh or contact support.
          </small>
        </div>
        <div class="form-group">
          <label for="subject">Subject (optional):</label>
          <input 
            id="subject"
            :value="subject"
            type="text" 
            class="form-control" 
            placeholder="Enter conversation subject..."
            :disabled="creating"
            maxlength="200"
            @input="$emit('update:subject', $event.target.value)"
          >
        </div>
        <div class="form-group">
          <label for="message">First Message (optional):</label>
          <textarea 
            id="message"
            :value="message"
            class="form-control" 
            rows="4"
            placeholder="Type your message here or leave blank to start conversation..."
            :disabled="creating"
            maxlength="1000"
            @input="$emit('update:message', $event.target.value)"
          />
          <small class="text-muted">
            {{ message.length }}/1000 characters
          </small>
        </div>
      </div>
      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          :disabled="creating"
          @click="$emit('close')"
        >
          Cancel
        </button>
        <button 
          class="btn btn-primary" 
          :disabled="creating || !canCreate" 
          title="Send message"
          @click="$emit('create-conversation')"
        >
          <i
            v-if="creating"
            class="bi bi-hourglass-split me-1"
          />
          <i
            v-else
            class="bi bi-send me-1"
          />
          {{ creating ? 'Sending...' : 'Send' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  availableUsers: {
    type: Array,
    default: () => []
  },
  recipientId: {
    type: [String, Number],
    default: ''
  },
  subject: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  creating: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'update:recipientId', 'update:subject', 'update:message', 'create-conversation'])

const canCreate = computed(() => {
  return props.recipientId && props.recipientId !== ''
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h5 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #333;
}

.modal-body {
  padding: 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.875rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control textarea {
  resize: vertical;
  min-height: 100px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.alert {
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
}

.alert-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.text-danger {
  color: #dc3545;
}

.text-muted {
  color: #6c757d;
  font-size: 0.875rem;
}

.me-1 {
  margin-right: 0.25rem;
}

.me-2 {
  margin-right: 0.5rem;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-header,
  .modal-body {
    padding: 1rem;
  }
  
  .modal-footer {
    padding: 1rem;
    flex-direction: row;
    justify-content: flex-end;
  }
  
  .btn {
    flex: 0 0 auto;
    min-width: 80px;
  }
}
</style>
