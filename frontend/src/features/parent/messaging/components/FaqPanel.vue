<template>
  <div>
    <!-- Floating FAQ Chat Head -->
    <button
      class="faq-fab"
      type="button"
      @click="$emit('toggle')"
    >
      <i class="bi bi-question-circle-fill" />
    </button>

    <!-- FAQ Conversation Panel -->
    <div
      v-if="isOpen"
      class="faq-panel card shadow"
    >
      <div class="card-header d-flex align-items-center justify-content-between py-2">
        <div class="d-flex align-items-center gap-2">
          <div class="avatar-circle bg-primary text-white">
            ?
          </div>
          <div>
            <div class="fw-semibold">
              FAQs Assistant
            </div>
            <div class="text-muted small">
              Tap a question to view the answer
            </div>
          </div>
        </div>
        <button
          class="btn btn-sm btn-outline-secondary"
          @click="$emit('close')"
        >
          <i class="bi bi-x" />
        </button>
      </div>
      <div
        class="card-body p-0 d-flex flex-column"
        style="max-height: 60vh;"
      >
        <div
          ref="chatBox"
          class="faq-chat flex-fill p-2 overflow-auto"
        >
          <div
            v-if="thread.length === 0"
            class="text-center text-muted small py-3"
          >
            Select a question below to see the answer here.
          </div>
          <div v-else>
            <div 
              v-for="m in thread" 
              :key="m.id" 
              class="mb-2 d-flex" 
              :class="m.role === 'me' ? 'justify-content-end' : 'justify-content-start'"
            >
              <div
                class="message-bubble"
                :class="m.role === 'me' ? 'bubble-me' : 'bubble-faq'"
              >
                <div class="message-content">
                  {{ m.text }}
                </div>
                <div class="message-time small">
                  {{ formatTime(m.at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="p-2 border-top"
          style="max-height: 40%; overflow: auto;"
        >
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="mb-2"
          >
            <button
              class="btn btn-light w-100 text-start"
              @click="$emit('select-faq', faq)"
            >
              <div class="fw-semibold">
                {{ faq.q }}
              </div>
              <div class="text-muted small">
                Tap to show answer
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  thread: {
    type: Array,
    required: true
  },
  faqs: {
    type: Array,
    required: true
  }
})

defineEmits(['toggle', 'close', 'select-faq'])

const chatBox = ref(null)

const formatTime = (dt) => {
  if (!dt) return ''
  const d = new Date(dt)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (d >= today) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.faq-fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 998;
  transition: all 0.3s ease;
}

.faq-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
}

.faq-panel {
  position: fixed;
  bottom: 150px;
  right: 20px;
  width: 90%;
  max-width: 400px;
  z-index: 999;
  border: none;
  border-radius: 16px;
  overflow: hidden;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.125rem;
}

.faq-chat {
  background: #f9fafb;
}

.message-bubble {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 12px;
  word-wrap: break-word;
}

.bubble-me {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
}

.bubble-faq {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #111827;
}

.message-content {
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 4px;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
}

@media (max-width: 480px) {
  .faq-panel {
    width: calc(100% - 40px);
    right: 20px;
    left: 20px;
    max-width: none;
  }
}
</style>
