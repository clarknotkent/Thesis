<template>
  <div class="chat-header border-bottom bg-white p-3">
    <div class="d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center">
        <div class="avatar-circle me-3">
          {{ getInitials(conversation.title) }}
        </div>
        <div>
          <h6 class="mb-0 fw-semibold">{{ conversation.title }}</h6>
          <small class="text-muted">{{ participantList }}</small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <small class="text-muted">{{ formatDate(conversation.latest_message_time) }}</small>
        <button 
          class="btn btn-sm btn-outline-danger" 
          @click="$emit('leave')" 
          :disabled="leaving"
        >
          <i class="bi bi-box-arrow-right me-1"></i>
          <span class="d-none d-sm-inline">Leave</span>
        </button>
        <button class="btn btn-sm btn-outline-secondary" @click="$emit('close')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
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
