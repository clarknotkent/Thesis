<template>
  <div class="conversations-list-section">
    <!-- Messages Header (match Parent UI) -->
    <div class="section-header d-flex justify-content-between align-items-center">
      <h5 class="section-title mb-0">
        Messages
      </h5>
      <button
        class="btn btn-primary btn-sm"
        @click="$emit('new-conversation')"
      >
        <i class="bi bi-plus-circle me-1" />
        New Chat
      </button>
    </div>

    <!-- Search Bar -->
    <div
      v-if="conversations.length > 0"
      class="search-bar"
    >
      <i class="bi bi-search" />
      <input 
        :value="searchQuery" 
        type="text"
        placeholder="Search conversations..." 
        @input="$emit('update:searchQuery', $event.target.value)"
      >
    </div>

    <!-- Messages List -->
    <div
      v-if="filteredConversations.length > 0"
      class="messages-list"
    >
      <div 
        v-for="conv in filteredConversations" 
        :key="conv.conversation_id"
        class="message-item"
        :class="{ 'unread': conv.unread_count > 0 }"
        @click="$emit('open-conversation', conv)"
      >
        <div class="message-avatar">
          <i class="bi bi-person-circle" />
        </div>
        <div class="message-content">
          <div class="message-header">
            <h6 class="sender-name">
              {{ getConversationTitle(conv) }}
            </h6>
            <small class="message-time">{{ formatTimePH(conv.latest_message_time || conv.created_at) }}</small>
          </div>
          <p class="message-preview">
            {{ conv.latest_message || 'No messages yet' }}
          </p>
          <span
            v-if="conv.unread_count > 0"
            class="unread-badge"
          >{{ conv.unread_count }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="empty-state"
    >
      <i class="bi bi-chat-dots-fill empty-icon" />
      <h5>No conversations yet</h5>
      <p class="text-muted">
        Start a new conversation to get started
      </p>
      <button
        class="btn btn-primary"
        @click="$emit('new-conversation')"
      >
        <i class="bi bi-plus-circle me-1" />
        Start Conversation
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  filteredConversations: {
    type: Array,
    default: () => []
  },
  searchQuery: {
    type: String,
    default: ''
  },
  getConversationTitle: {
    type: Function,
    required: true
  },
  formatTime: {
    type: Function,
    required: true
  }
})

defineEmits(['new-conversation', 'open-conversation', 'update:searchQuery'])

// Philippine time formatter (UTC+8), aligned with shared chat behavior
const shiftHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000)

const formatTimePH = (s) => {
  if (!s) return ''
  const dateOrig = new Date(s)
  const date = shiftHours(dateOrig, 8) // convert to UTC+8
  const now = shiftHours(new Date(), 8)
  const diff = now - date

  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) {
    return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 604800000) {
    return date.toLocaleDateString('en-PH', { weekday: 'short' })
  }
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.conversations-list-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Match ParentMessages header look */
.section-header {
  margin-bottom: 1rem;
  padding: 1rem;
  padding-bottom: 0;
}

.section-title {
  margin: 0;
  font-weight: 600;
  color: #333;
  font-size: 1.25rem;
}

.search-bar {
  position: relative;
  margin-bottom: 1rem;
}

.search-bar i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-bar input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.search-bar input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.messages-list {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px;
}

.message-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;
  position: relative;
  cursor: pointer;
}

.message-item:hover {
  background-color: #f8f9fa;
}

.message-item:last-child {
  border-bottom: none;
}

.message-item.unread {
  background-color: #f0f8ff;
  border-left: 3px solid #007bff;
}

.message-avatar {
  margin-right: 0.75rem;
  color: #6c757d;
}

.message-avatar i {
  font-size: 2.5rem;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.sender-name {
  font-weight: 600;
  margin: 0;
  color: #333;
  font-size: 0.9rem;
}

.message-time {
  color: #6c757d;
  font-size: 0.75rem;
}

.message-preview {
  margin: 0;
  color: #555;
  font-size: 0.875rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.unread-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  min-width: 20px;
  height: 20px;
  background: #007bff;
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0 0.4rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.text-muted {
  color: #6c757d;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .message-item {
    padding: 0.75rem;
  }
  
  .message-avatar i {
    font-size: 2rem;
  }
  
  .sender-name {
    font-size: 0.875rem;
  }
  
  .message-preview {
    font-size: 0.8rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .new-message-btn {
    justify-content: center;
  }
}
</style>
