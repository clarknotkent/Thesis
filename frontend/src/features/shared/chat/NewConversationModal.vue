<template>
  <div
    class="modal fade show d-block"
    tabindex="-1"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            <i class="bi bi-plus-circle me-2" />Start New Conversation
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="$emit('close')"
          />
        </div>
        <div class="modal-body p-4">
          <div class="mb-4">
            <label
              for="subject"
              class="form-label fw-semibold"
            >Subject (Optional)</label>
            <input
              id="subject"
              type="text"
              :value="subject"
              class="form-control form-control-lg"
              placeholder="Enter conversation subject..."
              @input="$emit('update:subject', $event.target.value)"
            >
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">First message</label>
            <textarea
              :value="message"
              class="form-control"
              rows="3"
              placeholder="Type your first message..."
              maxlength="1000"
              @input="$emit('update:message', $event.target.value)"
            />
            <div class="form-text text-end">
              {{ message.length }}/1000
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Select Participants</label>
            <input
              type="text"
              :value="searchQuery"
              class="form-control mb-3"
              placeholder="Search users by name or role..."
              @input="$emit('update:searchQuery', $event.target.value)"
            >
            <div
              class="participants-list border rounded p-3"
              style="max-height: 300px; overflow-y: auto;"
            >
              <div
                v-if="users.length === 0"
                class="text-center py-4"
              >
                <i
                  class="bi bi-search text-muted mb-2"
                  style="font-size: 2rem;"
                />
                <p class="text-muted mb-0">
                  No users found
                </p>
              </div>
              <div v-else>
                <div
                  v-for="user in users"
                  :key="user.__id"
                  class="participant-item d-flex align-items-center p-2 rounded hover-bg-light"
                >
                  <input
                    :id="'user-'+user.__id"
                    class="form-check-input me-3"
                    type="checkbox"
                    :value="user.__id"
                    :checked="selectedParticipants.includes(user.__id)"
                    @change="toggleParticipant(user.__id)"
                  >
                  <div class="avatar-circle-sm me-3">
                    {{ getInitials(user.full_name) }}
                  </div>
                  <label
                    class="form-check-label flex-grow-1 mb-0"
                    :for="'user-'+user.__id"
                  >
                    <div class="fw-semibold">{{ user.full_name }}</div>
                    <small class="text-muted">{{ user.role }}</small>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-outline-secondary"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="selectedParticipants.length === 0 || !message.trim() || creating"
            @click="$emit('create')"
          >
            <span
              v-if="creating"
              class="spinner-border spinner-border-sm me-2"
            />
            Send & Create
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Vue compiler macros are globally available in <script setup>

const props = defineProps({
  subject: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  searchQuery: {
    type: String,
    default: ''
  },
  users: {
    type: Array,
    required: true
  },
  selectedParticipants: {
    type: Array,
    required: true
  },
  creating: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'create', 'update:subject', 'update:message', 'update:searchQuery', 'update:selectedParticipants']);

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
};

const toggleParticipant = (userId) => {
  const current = [...props.selectedParticipants];
  const index = current.indexOf(userId);
  if (index > -1) {
    current.splice(index, 1);
  } else {
    current.push(userId);
  }
  emit('update:selectedParticipants', current);
};
</script>

<style scoped>
.modal-content {
  border: none;
  border-radius: 0.5rem;
}

.modal-header {
  border-radius: 0.5rem 0.5rem 0 0;
  background: #0d6efd;
}

.participants-list {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
}

.participant-item {
  transition: background-color 0.15s ease-in-out;
  border-radius: 0.25rem;
}

.hover-bg-light:hover {
  background: #f8f9fa !important;
}

.avatar-circle-sm {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #6c757d;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
}
</style>
