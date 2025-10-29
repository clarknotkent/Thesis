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

      <!-- Loading State -->
      <div v-if="loading && !selectedConversation" class="loading-state">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading conversations...</p>
      </div>

      <!-- Conversations View (when no conversation selected) -->
      <div v-else-if="!selectedConversation">
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

        <!-- Search Bar -->
        <div v-if="conversations.length > 0" class="search-bar">
          <i class="bi bi-search"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search conversations..."
          >
        </div>

        <!-- Messages List -->
        <div v-if="filteredConversations.length > 0" class="messages-list">
          <div 
            v-for="conv in filteredConversations" 
            :key="conv.conversation_id"
            class="message-item"
            :class="{ 'unread': conv.unread_count > 0 }"
            @click="openConversation(conv)"
          >
            <div class="message-avatar">
              <i class="bi bi-person-circle"></i>
            </div>
            <div class="message-content">
              <div class="message-header">
                <h6 class="sender-name">{{ getConversationTitle(conv) }}</h6>
                <small class="message-time">{{ formatTime(conv.latest_message_time || conv.created_at) }}</small>
              </div>
              <p class="message-preview">{{ conv.latest_message || 'No messages yet' }}</p>
              <span v-if="conv.unread_count > 0" class="unread-badge">{{ conv.unread_count }}</span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <i class="bi bi-chat-dots-fill empty-icon"></i>
          <h5>No conversations yet</h5>
          <p class="text-muted">Start a new conversation to get started</p>
          <button @click="showNewMessageModal = true" class="btn btn-primary">
            <i class="bi bi-plus-circle me-1"></i>
            Start Conversation
          </button>
        </div>
      </div>

      <!-- Chat View (when conversation selected) -->
      <div v-else class="chat-view">
        <!-- Chat Header -->
        <div class="chat-header">
          <button @click="selectedConversation = null" class="back-btn">
            <i class="bi bi-arrow-left"></i>
          </button>
          <div class="chat-info">
            <h6 class="chat-title">{{ getConversationTitle(selectedConversation) }}</h6>
            <small class="chat-subtitle" v-if="selectedConversation.participants">
              {{ getParticipantList(selectedConversation) }}
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
                  <small>{{ formatTime(msg.created_at) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Message Input -->
        <div class="message-input-container">
          <textarea 
            v-model="messageText"
            placeholder="Type your message..."
            rows="1"
            @keydown.enter.prevent="handleSendMessage"
            class="message-input"
            maxlength="1000"
          ></textarea>
          <button 
            @click="handleSendMessage" 
            class="send-btn"
            :disabled="!messageText.trim() || sending"
            :title="!messageText.trim() ? 'Type a message to send' : 'Send message'"
          >
            <i v-if="sending" class="bi bi-hourglass-split"></i>
            <i v-else class="bi bi-send-fill"></i>
          </button>
        </div>
      </div>

      <!-- New Message Modal -->
      <div v-if="showNewMessageModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h5>New Conversation</h5>
            <button @click="closeModal" class="close-btn">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="modal-body">
            <!-- Loading users state -->
            <div v-if="availableUsers.length === 0 && !creating" class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              Loading available users...
            </div>
            
            <div class="form-group">
              <label for="recipient">Recipient: <span class="text-danger">*</span></label>
              <select 
                v-model="newConversation.recipientId" 
                id="recipient" 
                class="form-control"
                :disabled="creating"
              >
                <option value="">Select recipient...</option>
                <option 
                  v-for="user in availableUsers" 
                  :key="user.user_id" 
                  :value="user.user_id"
                >
                  {{ user.full_name || `${user.firstname} ${user.surname}` }} ({{ user.role }})
                </option>
              </select>
              <small v-if="availableUsers.length === 0" class="text-muted">
                No users available. Please refresh or contact support.
              </small>
            </div>
            <div class="form-group">
              <label for="subject">Subject (optional):</label>
              <input 
                v-model="newConversation.subject" 
                type="text" 
                id="subject" 
                class="form-control"
                placeholder="Enter conversation subject..."
                :disabled="creating"
                maxlength="200"
              >
            </div>
            <div class="form-group">
              <label for="message">First Message: <span class="text-danger">*</span></label>
              <textarea 
                v-model="newConversation.message" 
                id="message" 
                class="form-control"
                rows="4"
                placeholder="Type your message here..."
                :disabled="creating"
                maxlength="1000"
              ></textarea>
              <small class="text-muted">
                {{ newConversation.message.length }}/1000 characters
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <!-- Validation hint -->
            <small v-if="!canCreateConversation" class="text-muted me-auto">
              <i class="bi bi-info-circle me-1"></i>
              {{ !newConversation.recipientId ? 'Select a recipient' : 'Type a message' }}
            </small>
            
            <button @click="closeModal" class="btn btn-secondary" :disabled="creating">Cancel</button>
            <button 
              @click="createConversation" 
              class="btn btn-primary" 
              :disabled="!canCreateConversation || creating"
              :title="!canCreateConversation ? 'Please select a recipient and type a message' : 'Send message'"
            >
              <i v-if="creating" class="bi bi-hourglass-split me-1"></i>
              <i v-else class="bi bi-send me-1"></i>
              {{ creating ? 'Sending...' : 'Send' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import { conversationAPI, messageAPI } from '@/services/api'
import { getUserId } from '@/services/auth'
import axios from 'axios'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

// State
const loading = ref(false)
const loadingMessages = ref(false)
const sending = ref(false)
const creating = ref(false)
const conversations = ref([])
const selectedConversation = ref(null)
const messages = ref([])
const messageText = ref('')
const searchQuery = ref('')
const currentUserId = ref(null)
const messagesContainer = ref(null)

// Modal state
const showNewMessageModal = ref(false)
const availableUsers = ref([])
const newConversation = ref({
  recipientId: '',
  subject: '',
  message: ''
})

// Polling
let pollInterval = null

// Computed
const filteredConversations = computed(() => {
  if (!searchQuery.value.trim()) return conversations.value
  
  const query = searchQuery.value.toLowerCase()
  return conversations.value.filter(conv => {
    const title = getConversationTitle(conv).toLowerCase()
    const message = (conv.latest_message || '').toLowerCase()
    return title.includes(query) || message.includes(query)
  })
})

const canCreateConversation = computed(() => {
  return newConversation.value.recipientId && 
         newConversation.value.message.trim()
})

// Methods
const getConversationTitle = (conv) => {
  if (!conv) return 'Conversation'
  
  // Get other participants (exclude current user)
  const participants = conv.participants || []
  const others = participants.filter(p => 
    String(p.user_id) !== String(currentUserId.value)
  )
  
  if (others.length === 0) {
    return conv.subject || conv.title || 'Conversation'
  }
  
  if (others.length === 1) {
    const p = others[0]
    return p.full_name || `${p.firstname || ''} ${p.surname || ''}`.trim() || p.email || 'User'
  }
  
  // Multiple participants
  const names = others.slice(0, 2).map(p => 
    p.full_name || `${p.firstname || ''} ${p.surname || ''}`.trim() || p.email
  ).filter(Boolean)
  
  if (others.length > 2) {
    return `${names.join(', ')} +${others.length - 2}`
  }
  
  return names.join(', ')
}

const getParticipantList = (conv) => {
  if (!conv || !conv.participants) return ''
  return conv.participants
    .map(p => p.full_name || `${p.firstname || ''} ${p.surname || ''}`.trim())
    .filter(Boolean)
    .join(', ')
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // Less than 1 minute
  if (diff < 60000) return 'Just now'
  
  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000)
    return `${mins} min${mins > 1 ? 's' : ''} ago`
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
  
  // Format as date
  return date.toLocaleDateString()
}

const isMyMessage = (msg) => {
  return String(msg.sender_id) === String(currentUserId.value)
}

const loadConversations = async () => {
  loading.value = true
  try {
    const response = await conversationAPI.getConversations({ limit: 50 })
    conversations.value = response.data?.items || response.data || []
  } catch (error) {
    console.error('Failed to load conversations:', error)
  } finally {
    loading.value = false
  }
}

const openConversation = async (conv) => {
  selectedConversation.value = conv
  await loadMessages(conv.conversation_id)
  startPolling()
}

const loadMessages = async (conversationId) => {
  loadingMessages.value = true
  try {
    const response = await messageAPI.getMessages(conversationId)
    messages.value = response.data?.items || response.data || []
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to load messages:', error)
  } finally {
    loadingMessages.value = false
  }
}

const handleSendMessage = async () => {
  if (!messageText.value.trim() || !selectedConversation.value) return
  
  sending.value = true
  try {
    await messageAPI.send({
      conversation_id: selectedConversation.value.conversation_id,
      message_content: messageText.value.trim(),
      message_type: 'chat'
    })
    
    messageText.value = ''
    await loadMessages(selectedConversation.value.conversation_id)
  } catch (error) {
    console.error('Failed to send message:', error)
    alert('Failed to send message. Please try again.')
  } finally {
    sending.value = false
  }
}

const createConversation = async () => {
  if (!canCreateConversation.value) return
  
  creating.value = true
  try {
    console.log('Creating conversation with:', {
      subject: newConversation.value.subject,
      recipientId: newConversation.value.recipientId,
      messageLength: newConversation.value.message.length
    })
    
    const response = await conversationAPI.startWithMessage({
      subject: newConversation.value.subject || null,
      participants: [newConversation.value.recipientId],
      message_content: newConversation.value.message,
      message_type: 'chat'
    })
    
    console.log('Conversation created successfully:', response.data)
    
    closeModal()
    await loadConversations()
    
    // Open the newly created conversation
    const newConv = response.data?.conversation
    if (newConv) {
      const found = conversations.value.find(c => c.conversation_id === newConv.conversation_id)
      if (found) {
        await openConversation(found)
      } else {
        console.log('New conversation not found in list, refreshing...')
        await loadConversations()
        const refound = conversations.value.find(c => c.conversation_id === newConv.conversation_id)
        if (refound) {
          await openConversation(refound)
        }
      }
    }
  } catch (error) {
    console.error('Failed to create conversation:', error)
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error'
    alert(`Failed to start conversation: ${errorMsg}. Please try again or contact support.`)
  } finally {
    creating.value = false
  }
}

const closeModal = () => {
  showNewMessageModal.value = false
  newConversation.value = {
    recipientId: '',
    subject: '',
    message: ''
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const fetchAvailableUsers = async () => {
  try {
    const response = await axios.get('/api/users', {
      params: {
        limit: 100, // Get more users
        page: 1,
        status: 'active' // Only active users
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`
      }
    })
    
    const users = response.data?.users || []
    
    if (users.length === 0) {
      console.warn('No users found in the system')
      alert('No users available to message. Please contact your administrator.')
      return
    }
    
    // Filter out current user
    availableUsers.value = users.filter(u => 
      String(u.user_id) !== String(currentUserId.value)
    )
    
    console.log(`Loaded ${availableUsers.value.length} available users`)
  } catch (error) {
    console.error('Failed to load users:', error)
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error'
    alert(`Failed to load users: ${errorMsg}. Please try again or contact support.`)
  }
}

const startPolling = () => {
  stopPolling()
  pollInterval = setInterval(async () => {
    if (selectedConversation.value) {
      try {
        const response = await messageAPI.getMessages(selectedConversation.value.conversation_id)
        const newMessages = response.data?.items || response.data || []
        
        // Only update if there are new messages
        if (newMessages.length !== messages.value.length) {
          const oldScrollHeight = messagesContainer.value?.scrollHeight || 0
          messages.value = newMessages
          await nextTick()
          
          // Auto-scroll only if user was already at bottom
          if (messagesContainer.value) {
            const wasAtBottom = messagesContainer.value.scrollTop + messagesContainer.value.clientHeight >= oldScrollHeight - 50
            if (wasAtBottom) {
              scrollToBottom()
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }
  }, 3000) // Poll every 3 seconds
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

// Watchers
watch(showNewMessageModal, (isShown) => {
  if (isShown) {
    fetchAvailableUsers()
  }
})

watch(selectedConversation, (newVal, oldVal) => {
  if (!newVal) {
    stopPolling()
  } else if (!oldVal || newVal.conversation_id !== oldVal.conversation_id) {
    startPolling()
  }
})

// Lifecycle
onMounted(async () => {
  currentUserId.value = getUserId()
  await loadConversations()
})
</script>

<style scoped>
.messages-container {
  max-width: 100%;
  margin: 0 auto;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: #6c757d;
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

/* Chat View Styles */
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

.send-btn:disabled i {
  color: #6c757d;
}

.send-btn i {
  font-size: 1rem;
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
  font-size: 0.875rem;
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

.alert {
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
}

.alert-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.text-danger {
  color: #dc3545;
}

.text-muted {
  color: #6c757d;
  font-size: 0.875rem;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .messages-container {
    height: calc(100vh - 70px);
  }

  .chat-view {
    height: calc(100vh - 110px);
  }

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

  .message-bubble {
    max-width: 85%;
  }
}
</style>