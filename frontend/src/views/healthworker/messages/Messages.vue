<template>
  <HealthWorkerLayout>
    <div class="messages-container">
      <!-- Loading State -->
      <div
        v-if="loading && !selectedConversation"
        class="loading-state"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">
          Loading conversations...
        </p>
      </div>

      <!-- Conversations List View -->
      <ConversationsListSection
        v-else-if="!selectedConversation"
        :conversations="conversations"
        :filtered-conversations="filteredConversations"
        :search-query="searchQuery"
        :get-conversation-title="getConversationTitle"
        :format-time="formatTime"
        @update:search-query="searchQuery = $event"
        @new-conversation="openNewConversationModal"
        @open-conversation="openConversation"
      />

      <!-- Chat View -->
      <ChatViewSection
        v-else
        :conversation="selectedConversation"
        :messages="messages"
        :message-text="messageText"
        :loading-messages="loadingMessages"
        :sending="sending"
        :messages-container="messagesContainer"
        :get-conversation-title="getConversationTitle"
        :get-participant-list="getParticipantList"
        :is-my-message="isMyMessage"
        :format-time="formatTime"
        @update:message-text="messageText = $event"
        @close-chat="closeChat"
        @send-message="handleSendMessage"
      />

      <!-- New Conversation Modal -->
      <NewConversationModal
        :show="showNewMessageModal"
        :available-users="availableUsers"
        :recipient-id="newConversation.recipientId"
        :subject="newConversation.subject"
        :message="newConversation.message"
        :creating="creating"
        @update:recipient-id="newConversation.recipientId = $event"
        @update:subject="newConversation.subject = $event"
        @update:message="newConversation.message = $event"
        @close="closeModal"
        @create-conversation="createConversation"
      />
    </div>
  </HealthWorkerLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import HealthWorkerLayout from '@/components/layout/mobile/HealthWorkerLayout.vue'
import ConversationsListSection from '@/features/health-worker/messages/components/ConversationsListSection.vue'
import ChatViewSection from '@/features/health-worker/messages/components/ChatViewSection.vue'
import NewConversationModal from '@/features/health-worker/messages/components/NewConversationModal.vue'
import { conversationAPI, messageAPI } from '@/services/api'
import api from '@/services/api'
import { getUserId } from '@/services/auth'
import { useToast } from '@/composables/useToast'

const { addToast } = useToast()

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

const closeChat = () => {
  selectedConversation.value = null
  stopPolling()
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
    addToast({
      title: 'Error',
      message: 'Failed to send message. Please try again.',
      type: 'error'
    })
  } finally {
    sending.value = false
  }
}

const openNewConversationModal = async () => {
  showNewMessageModal.value = true
  if (availableUsers.value.length === 0) {
    await fetchAvailableUsers()
  }
}

const createConversation = async () => {
  // Validate recipient
  if (!newConversation.value.recipientId || newConversation.value.recipientId === '') {
    addToast({
      title: 'Warning',
      message: 'Please select a recipient first',
      type: 'warning'
    })
    return
  }
  
  creating.value = true
  try {
    // Use default message if empty
    const messageContent = newConversation.value.message.trim() || 'New conversation started'
    
    const response = await conversationAPI.startWithMessage({
      subject: newConversation.value.subject || null,
      participants: [newConversation.value.recipientId],
      message_content: messageContent,
      message_type: 'chat'
    })
    
    closeModal()
    await loadConversations()
    
    // Open the newly created conversation
    const newConv = response.data?.conversation
    if (newConv) {
      const found = conversations.value.find(c => c.conversation_id === newConv.conversation_id)
      if (found) {
        await openConversation(found)
      } else {
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
    addToast({
      title: 'Error',
      message: `Failed to start conversation: ${errorMsg}`,
      type: 'error',
      timeout: 5000
    })
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
    // Use the shared api instance so baseURL and interceptors apply in production
    const response = await api.get('/users', {
      params: {
        limit: 100,
        page: 1,
        status: 'active'
      }
    })
    const users = response.data?.users || []
    
    if (users.length === 0) {
      console.warn('No users found in the system')
      addToast({
        title: 'Notice',
        message: 'No users available to message. Please contact your administrator.',
        type: 'warning',
        timeout: 5000
      })
      return
    }
    
    // Normalize user data
    const normalized = users.map(u => ({
      ...u,
      user_id: u.user_id ?? u.id,
      full_name: u.full_name || u.name || `${u.firstname || ''} ${u.surname || ''}`.trim(),
    }))

    // Filter out current user
    availableUsers.value = normalized.filter(u => 
      String(u.user_id) !== String(currentUserId.value)
    )
  } catch (error) {
    console.error('Failed to load users:', error)
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error'
    addToast({
      title: 'Error',
      message: `Failed to load users: ${errorMsg}`,
      type: 'error',
      timeout: 5000
    })
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
watch(selectedConversation, (newVal) => {
  if (!newVal) {
    stopPolling()
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

.spinner-border {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  vertical-align: text-bottom;
  border: 0.25em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
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

.mt-2 {
  margin-top: 0.5rem;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .messages-container {
    height: calc(100vh - 70px);
  }
}
</style>
