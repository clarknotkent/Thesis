/**
 * Composable for managing message threads within conversations
 * Handles message loading, sending, and real-time updates
 */
import { ref, nextTick } from 'vue'
import { messageAPI } from '@/services/api'
import { getUserId } from '@/services/auth'

export function useMessageThread() {
  // State
  const loadingMessages = ref(false)
  const sending = ref(false)
  const messages = ref([])
  const messageText = ref('')
  const messagesContainer = ref(null)
  const currentUserId = ref(null)

  /**
   * Check if message is from current user
   */
  const isMyMessage = (msg) => {
    return String(msg.sender_id) === String(currentUserId.value)
  }

  /**
   * Load messages for a conversation
   */
  const loadMessages = async (conversationId) => {
    if (!conversationId) return
    
    try {
      loadingMessages.value = true
      currentUserId.value = getUserId()
      
      const response = await messageAPI.list(conversationId)
      messages.value = response.data?.data || response.data || []
      
      // Scroll to bottom after loading
      await nextTick()
      scrollToBottom()
    } catch (error) {
      console.error('Error loading messages:', error)
      messages.value = []
    } finally {
      loadingMessages.value = false
    }
  }

  /**
   * Send a new message
   */
  const sendMessage = async (conversationId, content) => {
    if (!conversationId || !content?.trim()) return null
    
    try {
      sending.value = true
      
      const response = await messageAPI.create(conversationId, {
        message_content: content.trim(),
        sender_id: getUserId()
      })
      
      const newMessage = response.data?.data || response.data
      if (newMessage) {
        messages.value.push(newMessage)
        messageText.value = ''
        
        // Scroll to bottom after sending
        await nextTick()
        scrollToBottom()
      }
      
      return newMessage
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    } finally {
      sending.value = false
    }
  }

  /**
   * Handle send message action
   */
  const handleSendMessage = async (conversationId) => {
    if (!messageText.value.trim() || sending.value) return
    
    try {
      await sendMessage(conversationId, messageText.value)
    } catch (error) {
      alert('Failed to send message. Please try again.')
    }
  }

  /**
   * Scroll to bottom of messages container
   */
  const scrollToBottom = () => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }

  /**
   * Clear messages
   */
  const clearMessages = () => {
    messages.value = []
    messageText.value = ''
  }

  /**
   * Add a message to the thread (for real-time updates)
   */
  const addMessage = async (message) => {
    messages.value.push(message)
    await nextTick()
    scrollToBottom()
  }

  /**
   * Update a message in the thread
   */
  const updateMessage = (messageId, updates) => {
    const index = messages.value.findIndex(m => m.message_id === messageId)
    if (index >= 0) {
      messages.value[index] = { ...messages.value[index], ...updates }
    }
  }

  /**
   * Delete a message from the thread
   */
  const deleteMessage = (messageId) => {
    const index = messages.value.findIndex(m => m.message_id === messageId)
    if (index >= 0) {
      messages.value.splice(index, 1)
    }
  }

  return {
    // State
    loadingMessages,
    sending,
    messages,
    messageText,
    messagesContainer,
    currentUserId,
    
    // Methods
    isMyMessage,
    loadMessages,
    sendMessage,
    handleSendMessage,
    scrollToBottom,
    clearMessages,
    addMessage,
    updateMessage,
    deleteMessage
  }
}
