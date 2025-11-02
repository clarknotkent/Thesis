<template>
  <div class="chat-view">
    <!-- Chat Header -->
    <div class="chat-header">
      <button @click="$emit('close-chat')" class="back-btn">
        <i class="bi bi-arrow-left"></i>
      </button>
      <div class="chat-info">
        <h6 class="chat-title">{{ getConversationTitle(conversation) }}</h6>
        <small class="chat-subtitle" v-if="conversation.participants">
          {{ getParticipantList(conversation) }}
        </small>
      </div>
    </div>

    <!-- Messages Container -->
    <div ref="messagesContainer" class="messages-container-scroll">
      <div v-if="loadingMessages" class="text-center p-3">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else-if="messages.length === 0" class="text-center p-4 text-muted">
        <i class="bi bi-chat-text mb-2" style="font-size: 2rem;"></i>
        <p>No messages yet</p>
      </div>
      <div v-else class="messages-list-chat">
        <div 
          v-for="msg in messages" 
          :key="msg.message_id"
          class="message-bubble-wrapper"
          :class="{ 'mine': isMyMessage(msg) }"
        >
          <div class="message-bubble">
            <div class="message-text">{{ msg.message_content }}</div>
            <div class="message-meta">
              <small>{{ formatTimePH(msg.created_at) }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="message-input-container">
      <textarea 
        :value="messageText"
        @input="$emit('update:messageText', $event.target.value)"
        placeholder="Type your message..."
        rows="1"
        @keydown.enter.prevent="$emit('send-message')"
        class="message-input"
        maxlength="1000"
      ></textarea>
      <button 
        @click="$emit('send-message')" 
        class="send-btn"
        :disabled="!messageText.trim() || sending"
        :title="!messageText.trim() ? 'Type a message to send' : 'Send message'"
      >
        <i v-if="sending" class="bi bi-hourglass-split"></i>
        <i v-else class="bi bi-send-fill"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  conversation: {
    type: Object,
    required: true
  },
  messages: {
    type: Array,
    default: () => []
  },
  messageText: {
    type: String,
    default: ''
  },
  loadingMessages: {
    type: Boolean,
    default: false
  },
  sending: {
    type: Boolean,
    default: false
  },
  messagesContainer: {
    type: Object,
    default: null
  },
  getConversationTitle: {
    type: Function,
    required: true
  },
  getParticipantList: {
    type: Function,
    required: true
  },
  isMyMessage: {
    type: Function,
    required: true
  },
  formatTime: {
    type: Function,
    required: true
  }
})

defineEmits(['close-chat', 'update:messageText', 'send-message'])

// Local time formatter aligned with shared chat: display times in Philippine Time (UTC+8)
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
.chat-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.back-btn {
  background: none;
  border: none;
  color: #007bff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background: rgba(0, 123, 255, 0.1);
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-title {
  margin: 0;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.chat-subtitle {
  color: #6c757d;
  font-size: 0.75rem;
}

.messages-container-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
}

/* Ensure messages don't get hidden behind the fixed mobile bottom navbar
   Give extra bottom padding equal to the input area + expected bottom navbar height */
.messages-container-scroll {
  padding-bottom: calc(1rem + 92px);
}

.messages-list-chat {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message-bubble-wrapper {
  display: flex;
  justify-content: flex-start;
}

.message-bubble-wrapper.mine {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 75%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-bubble-wrapper.mine .message-bubble {
  background: #007bff;
  color: white;
}

.message-text {
  word-wrap: break-word;
  font-size: 0.875rem;
  line-height: 1.4;
}

.message-meta {
  margin-top: 0.25rem;
  text-align: right;
}

.message-meta small {
  font-size: 0.7rem;
  opacity: 0.7;
}

.message-input-container {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid #dee2e6;
  /* Make input sticky so it stays visible above fixed bottom navbars */
  position: sticky;
  bottom: 60px; /* default offset to sit above mobile bottom navbar */
  z-index: 1100; /* above most layout elements but below global overlays */
  box-shadow: 0 -4px 12px rgba(0,0,0,0.06);
}

.message-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  resize: none;
  max-height: 100px;
  font-family: inherit;
}

.message-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #0056b3;
}

.send-btn:disabled {
  background: #d1d1d1;
  color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.send-btn i {
  font-size: 1rem;
}

.text-center {
  text-align: center;
}

.text-muted {
  color: #6c757d;
}

.p-3 {
  padding: 1rem;
}

.p-4 {
  padding: 1.5rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.spinner-border {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  vertical-align: text-bottom;
  border: 0.2em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.15em;
}

.text-primary {
  color: #007bff;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .chat-view {
    height: calc(100vh - 110px);
  }

  .message-bubble {
    max-width: 85%;
  }
}

/* Additional sticky adjustments for small mobile viewports where a fixed bottom
   navbar is present (match MobileBottomNavbar height and safe-area insets) */
@media (max-width: 576px) {
  .message-input-container {
    bottom: calc(28px + env(safe-area-inset-bottom));
  }

  /* Slightly larger messages container bottom padding on small screens */
  .messages-container-scroll {
    padding-bottom: calc(1rem + 28px);
  }
}
</style>
