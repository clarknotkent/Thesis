<template>
  <div class="chat-header border-bottom bg-white p-3">
    <div class="d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center">
        <div class="avatar-circle me-3">
          {{ getInitials(headerTitle) }}
        </div>
        <div>
          <h6 class="mb-0 fw-semibold">
            {{ headerTitle }}
          </h6>
          <small class="text-muted">{{ participantList }}</small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <small class="text-muted">{{ formatDate(conversation.latest_message_time) }}</small>
        <button 
          class="btn btn-sm btn-outline-danger" 
          :disabled="leaving" 
          @click="$emit('leave')"
        >
          <i class="bi bi-box-arrow-right me-1" />
          <span class="d-none d-sm-inline">Leave</span>
        </button>
        <button
          class="btn btn-sm btn-outline-secondary"
          @click="$emit('close')"
        >
          <i class="bi bi-x-lg" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Vue compiler macros are globally available in <script setup>

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  },
  participantList: {
    type: String,
    default: ''
  },
  leaving: {
    type: Boolean,
    default: false
  },
  currentUserId: {
    type: [String, Number],
    default: null
  }
});

defineEmits(['leave', 'close']);

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
};

const shiftHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const formatDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  const ph = shiftHours(d, 8);
  return ph.toLocaleString('en-PH');
};

// Helpers to derive header title: primary other participant name + "+N" if more
const getUserKey = (u) => u?.user_id ?? u?.id ?? u?.userId ?? null;
const getParticipantDisplayName = (p) => {
  if (!p) return '';
  return (
    p.participant_name ||
    p.full_name ||
    `${p.firstname || p.first_name || ''} ${p.surname || p.last_name || ''}`.trim() ||
    p.email ||
    ''
  );
};

const headerTitle = computed(() => {
  const conv = props.conversation || {};
  const currentId = String(props.currentUserId ?? '');
  const parts = Array.isArray(conv.participants) ? conv.participants : [];
  const others = parts
    .filter(p => String(getUserKey(p) ?? '') !== currentId)
    .map(getParticipantDisplayName)
    .filter(Boolean);

  if (others.length === 0) return conv.title || 'Conversation';
  if (others.length === 1) return others[0];
  const firstTwo = others.slice(0, 2);
  const remaining = others.length - 2;
  return remaining > 0 ? `${firstTwo[0]}, ${firstTwo[1]}, +${remaining}` : `${firstTwo[0]}, ${firstTwo[1]}`;
});
</script>

<style scoped>
.chat-header {
  background: white;
  border-bottom: 1px solid #dee2e6;
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
</style>
