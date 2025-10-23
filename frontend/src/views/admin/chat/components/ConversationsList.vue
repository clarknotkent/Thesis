<template>
  <div class="conversations-sidebar h-100 d-flex flex-column">
    <!-- Search -->
    <div class="p-3 border-bottom bg-white">
      <div class="input-group">
        <span class="input-group-text bg-transparent border-end-0">
          <i class="bi bi-search text-muted"></i>
        </span>
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          class="form-control border-start-0 ps-0"
          placeholder="Search conversations..."
        >
      </div>
    </div>

    <!-- Conversations List -->
    <div class="flex-grow-1 overflow-auto">
      <div v-if="conversations.length === 0" class="text-center py-5">
        <i class="bi bi-chat-square-dots text-muted" style="font-size: 3rem;"></i>
        <p class="text-muted mt-2 mb-0">No conversations found</p>
      </div>
      <div v-else>
        <div
          v-for="conv in conversations"
          :key="conv.conversation_id"
          class="conversation-item"
          :class="{ active: selectedId === conv.conversation_id }"
          @click="$emit('select', conv)"
        >
          <div class="d-flex align-items-center p-3">
            <!-- Avatar -->
            <div class="avatar-circle me-3 flex-shrink-0">
              {{ getInitials(conv.title) }}
            </div>

            <!-- Content -->
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex justify-content-between align-items-start mb-1">
                <h6 class="mb-0 text-truncate fw-semibold">{{ conv.title }}</h6>
                <small class="text-muted ms-2 flex-shrink-0">
                  {{ formatTime(conv.latest_message_time) }}
                </small>
              </div>
              <p class="text-muted small text-truncate mb-1">
                <template v-if="conv.latest_message">
                  <template v-if="conv.latest_message_sender_name">
                    <strong>{{ conv.latest_message_sender_name }}:</strong>
                    {{ ' ' + conv.latest_message }}
                  </template>
                  <template v-else>
                    {{ conv.latest_message }}
                  </template>
                </template>
                <template v-else>
                  No messages yet
                </template>
              </p>
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                  {{ conv.participants?.length || 0 }} participants
                </small>
                <span v-if="conv.unread_count > 0" class="badge bg-primary rounded-pill badge-sm">
                  {{ conv.unread_count }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Vue compiler macros (defineProps, defineEmits) are available globally in <script setup>

defineProps({
  conversations: {
    type: Array,
    required: true
  },
  selectedId: {
    type: [Number, String],
    default: null
  },
  searchQuery: {
    type: String,
    default: ''
  }
});

defineEmits(['select', 'update:searchQuery']);

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
};

const shiftHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const formatTime = (s) => {
  if (!s) return '';
  const dateOrig = new Date(s);
  const date = shiftHours(dateOrig, 8);
  const now = shiftHours(new Date(), 8);
  const diff = now - date;

  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) {
    return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 604800000) {
    return date.toLocaleDateString('en-PH', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};
</script>

<style scoped>
.conversations-sidebar {
  background: #f8f9fa;
}

.conversation-item {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
  border-bottom: 1px solid #e9ecef;
  background: white;
}

.conversation-item:hover {
  background: #f8f9fa;
}

.conversation-item.active {
  background: #e7f1ff;
  border-left: 3px solid #0d6efd;
}

.avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #6c757d;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.badge-sm {
  font-size: 10px;
  padding: 4px 6px;
}
</style>
