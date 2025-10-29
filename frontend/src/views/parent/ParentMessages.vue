<template>
  <ParentLayout>
    <div class="messages-container">
      <div class="section-header">
        <h5 class="section-title">Messages</h5>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="messages.length === 0" class="empty-state">
        <div class="empty-state-icon">
          <i class="bi bi-chat-dots"></i>
        </div>
        <h6 class="empty-state-title">No Messages</h6>
        <p class="empty-state-text">You don't have any messages yet.</p>
      </div>

      <!-- Messages List -->
      <div v-else class="messages-list">
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-item"
          :class="{ unread: !message.read }"
        >
          <div class="message-avatar">
            <i class="bi bi-person-circle"></i>
          </div>
          <div class="message-content">
            <div class="message-header">
              <h6 class="message-sender">{{ message.sender }}</h6>
              <span class="message-time">{{ formatTime(message.created_at) }}</span>
            </div>
            <p class="message-text">{{ message.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'

const loading = ref(true)
const messages = ref([])

// Placeholder data
onMounted(() => {
  setTimeout(() => {
    messages.value = []
    loading.value = false
  }, 500)
})

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.messages-container {
  padding: 1rem;
  min-height: calc(100vh - 56px - 70px);
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  margin: 0;
  font-weight: 600;
  color: #333;
  font-size: 1.25rem;
}

.messages-list {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.message-item:last-child {
  border-bottom: none;
}

.message-item.unread {
  background-color: #eff6ff;
}

.message-item:hover {
  background-color: #f8f9fa;
}

.message-avatar {
  flex-shrink: 0;
  font-size: 2.5rem;
  color: #6c757d;
  margin-right: 1rem;
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

.message-sender {
  margin: 0;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.message-time {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
}

.message-text {
  margin: 0;
  color: #6c757d;
  font-size: 0.85rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.empty-state-icon i {
  font-size: 2.5rem;
  color: #6c757d;
}

.empty-state-title {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.empty-state-text {
  color: #6c757d;
  font-size: 0.9rem;
}

@media (max-width: 576px) {
  .messages-container {
    padding: 0.75rem;
  }

  .message-item {
    padding: 0.875rem;
  }

  .message-avatar {
    font-size: 2rem;
    margin-right: 0.75rem;
  }
}
</style>
