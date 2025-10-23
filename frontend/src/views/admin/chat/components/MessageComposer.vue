<template>
  <div class="message-composer border-top bg-white p-3">
    <div class="d-flex gap-2 align-items-end">
      <div class="flex-grow-1">
        <textarea
          :value="modelValue"
          @input="handleInput"
          @keydown="handleKeyDown"
          ref="textarea"
          class="form-control message-input"
          placeholder="Type your message..."
          rows="1"
          style="resize: none; min-height: 40px; max-height: 120px; overflow-y: auto;"
        ></textarea>
      </div>
      <button
        class="btn btn-primary send-button"
        @click="$emit('send')"
        :disabled="!modelValue.trim() || sending"
      >
        <i v-if="sending" class="bi bi-hourglass-split fa-spin"></i>
        <i v-else class="bi bi-send-fill"></i>
      </button>
    </div>
    <div class="text-muted small mt-2" v-if="modelValue.length > 800">
      {{ modelValue.length }}/1000 characters
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  sending: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'send']);

const textarea = ref(null);

const handleInput = (event) => {
  emit('update:modelValue', event.target.value);
  nextTick(() => autoResize());
};

const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    emit('send');
  }
};

const autoResize = () => {
  if (textarea.value) {
    textarea.value.style.height = 'auto';
    textarea.value.style.height = Math.min(textarea.value.scrollHeight, 120) + 'px';
  }
};

watch(() => props.modelValue, () => {
  nextTick(() => autoResize());
});
</script>

<style scoped>
.message-composer {
  background: white;
  border-top: 1px solid #dee2e6;
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.message-input {
  border: 1px solid #ced4da;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.message-input:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
  outline: none;
}

.send-button {
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease-in-out;
  background: #0d6efd;
  border-color: #0d6efd;
}

.send-button:hover:not(:disabled) {
  background: #0b5ed7;
  border-color: #0a58ca;
  transform: scale(1.05);
}

.send-button:disabled {
  opacity: 0.65;
}

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
