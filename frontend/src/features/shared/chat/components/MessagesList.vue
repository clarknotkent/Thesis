<template>
  <div
    ref="messagesBox"
    class="messages-list flex-grow-1 p-3 overflow-auto"
  >
    <div
      v-if="messages.length === 0"
      class="text-center py-5"
    >
      <i
        class="bi bi-chat-square-dots text-muted mb-2"
        style="font-size: 2rem;"
      />
      <p class="text-muted mb-0">
        No messages yet. Start the conversation!
      </p>
    </div>
    <div v-else>
      <div
        v-for="message in messages"
        :key="message.message_id"
        class="message-wrapper mb-2"
        :class="{
          'message-sent': message.sender_id === currentUserId,
          'message-received': message.sender_id !== currentUserId
        }"
      >
        <div class="message-bubble">
          <div class="message-content">
            {{ message.message_content }}
          </div>
          <div class="message-time small text-muted mt-1">
            {{ formatTime(message.created_at) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';

const props = defineProps({
  messages: {
    type: Array,
    required: true
  },
  currentUserId: {
    type: [Number, String],
    required: true
  }
});

const messagesBox = ref(null);

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

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesBox.value) {
      messagesBox.value.scrollTop = messagesBox.value.scrollHeight;
    }
  });
};

watch(() => props.messages.length, () => {
  scrollToBottom();
});

onMounted(() => {
  // Ensure initial render is scrolled to latest
  scrollToBottom();
});

defineExpose({ scrollToBottom });
</script>

<style scoped>
.messages-list {
  background: #fafbfc;
  /* Make this flex child truly scrollable inside flex parents */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* smooth scrolling on iOS */
  min-height: 0; /* allow shrinking inside column flex */
  height: 0; /* key: prevents auto min-content height from blocking overflow */
  flex: 1 1 auto; /* grow to fill, shrink when needed */
  padding-bottom: 1% !important;
}

.message-wrapper {
  display: flex;
  margin-bottom: 16px;
  animation: messageSlideIn 0.2s ease-out;
}

.message-wrapper.message-sent {
  justify-content: flex-end;
}

.message-wrapper.message-received {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 16px;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.message-wrapper.message-sent .message-bubble {
  background: #0d6efd;
  color: white;
  border-bottom-right-radius: 4px;
  margin-left: auto;
}

.message-wrapper.message-received .message-bubble {
  background: white;
  border: 1px solid #e0e0e0;
  color: #212529;
  border-bottom-left-radius: 4px;
  margin-right: auto;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.message-wrapper.message-sent .message-time {
  text-align: right;
  color: rgba(255, 255, 255, 0.85);
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.messages-list::-webkit-scrollbar {
  width: 6px;
}

.messages-list::-webkit-scrollbar-track {
  background: #f1f3f4;
}

.messages-list::-webkit-scrollbar-thumb {
  background: #dadce0;
  border-radius: 3px;
}

.messages-list::-webkit-scrollbar-thumb:hover {
  background: #bdc1c6;
}

@media (max-width: 768px) {
  .message-bubble {
    max-width: 85%;
  }
}
</style>
