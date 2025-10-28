<template>
  <HealthWorkerLayout>
    <div class="messages-container">
      <!-- Back Button -->
      <div class="back-button-container">
        <button @click="goBack" class="back-button">
          <i class="bi bi-arrow-left"></i>
          <span>Back</span>
        </button>
      </div>

      <!-- Messages Header -->
      <div class="messages-header">
        <div class="header-content">
          <h4 class="mb-0">
            <i class="bi bi-chat-dots me-2"></i>
            Messages
          </h4>
          <button @click="showNewMessageModal = true" class="new-message-btn">
            <i class="bi bi-plus-circle me-1"></i>
            New
          </button>
        </div>
      </div>

      <!-- Messages List -->
      <div class="messages-list">
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-item"
          :class="{ 'unread': !message.read }"
        >
          <div class="message-avatar">
            <i class="bi bi-person-circle"></i>
          </div>
          <div class="message-content">
            <div class="message-header">
              <h6 class="sender-name">{{ message.sender }}</h6>
              <small class="message-time">{{ message.time }}</small>
            </div>
            <p class="message-preview">{{ message.preview }}</p>
            <span v-if="!message.read" class="unread-indicator"></span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="messages.length === 0" class="empty-state">
        <i class="bi bi-chat-dots-fill empty-icon"></i>
        <h5>No messages yet</h5>
        <p class="text-muted">Your messages will appear here</p>
      </div>

      <!-- New Message Modal -->
      <div v-if="showNewMessageModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h5>New Message</h5>
            <button @click="closeModal" class="close-btn">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="recipient">To:</label>
              <select v-model="newMessage.recipient" id="recipient" class="form-control">
                <option value="">Select recipient...</option>
                <option value="Dr. Martinez">Dr. Martinez</option>
                <option value="Admin Office">Admin Office</option>
                <option value="Nurse Chen">Nurse Chen</option>
                <option value="Health Department">Health Department</option>
              </select>
            </div>
            <div class="form-group">
              <label for="subject">Subject:</label>
              <input 
                v-model="newMessage.subject" 
                type="text" 
                id="subject" 
                class="form-control"
                placeholder="Enter message subject..."
              >
            </div>
            <div class="form-group">
              <label for="message">Message:</label>
              <textarea 
                v-model="newMessage.content" 
                id="message" 
                class="form-control"
                rows="4"
                placeholder="Type your message here..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeModal" class="btn btn-secondary">Cancel</button>
            <button @click="sendMessage" class="btn btn-primary" :disabled="!canSendMessage">
              <i class="bi bi-send me-1"></i>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

const showNewMessageModal = ref(false)
const newMessage = ref({
  recipient: '',
  subject: '',
  content: ''
})

const canSendMessage = computed(() => {
  return newMessage.value.recipient && 
         newMessage.value.subject && 
         newMessage.value.content.trim()
})

const closeModal = () => {
  showNewMessageModal.value = false
  newMessage.value = {
    recipient: '',
    subject: '',
    content: ''
  }
}

const sendMessage = () => {
  if (!canSendMessage.value) return
  
  // Add the new message to the top of the list
  const sentMessage = {
    id: Date.now(),
    sender: 'You',
    preview: newMessage.value.content.substring(0, 100) + (newMessage.value.content.length > 100 ? '...' : ''),
    time: 'just now',
    read: true,
    sent: true
  }
  
  messages.value.unshift(sentMessage)
  
  // Show success message (you could replace this with a toast notification)
  alert(`Message sent to ${newMessage.value.recipient}!`)
  
  closeModal()
}

const messages = ref([
  {
    id: 1,
    sender: 'Dr. Martinez',
    preview: 'Patient John Doe requires immediate attention for vaccine reaction follow-up.',
    time: '2 min ago',
    read: false
  },
  {
    id: 2,
    sender: 'Admin Office',
    preview: 'New vaccine shipment has arrived. Please check inventory levels.',
    time: '1 hour ago',
    read: false
  },
  {
    id: 3,
    sender: 'Nurse Chen',
    preview: 'Appointment schedule updated for tomorrow morning.',
    time: '3 hours ago',
    read: true
  },
  {
    id: 4,
    sender: 'Health Department',
    preview: 'Weekly vaccination report submission reminder.',
    time: '1 day ago',
    read: true
  }
])
</script>

<style scoped>
.messages-container {
  max-width: 100%;
  margin: 0 auto;
}

.back-button-container {
  margin-bottom: 1rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #007bff;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0;
  cursor: pointer;
  transition: color 0.2s ease;
}

.back-button:hover {
  color: #0056b3;
}

.back-button i {
  font-size: 1rem;
}

.messages-header {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid #007bff;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.new-message-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
}

.new-message-btn:hover {
  background: #0056b3;
}

.new-message-btn i {
  font-size: 0.9rem;
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

.unread-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 8px;
  height: 8px;
  background: #007bff;
  border-radius: 50%;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h5 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #333;
}

.modal-body {
  padding: 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control textarea {
  resize: vertical;
  min-height: 100px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
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
  
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-header,
  .modal-body {
    padding: 1rem;
  }
  
  .modal-footer {
    padding: 1rem;
    flex-direction: row;
    justify-content: flex-end;
  }
  
  .btn {
    flex: 0 0 auto;
    min-width: 80px;
  }
}
</style>