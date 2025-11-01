/**
 * Composable for managing conversations list and filtering
 * Handles conversation loading, searching, and selection
 */
import { ref, computed } from 'vue'
import { conversationAPI } from '@/services/api'
import { getUserId } from '@/services/auth'

export function useConversations() {
  // State
  const loading = ref(false)
  const conversations = ref([])
  const selectedConversation = ref(null)
  const searchQuery = ref('')
  const currentUserId = ref(null)

  // Computed
  const filteredConversations = computed(() => {
    if (!searchQuery.value.trim()) {
      return conversations.value
    }
    const q = searchQuery.value.toLowerCase()
    return conversations.value.filter(conv => {
      const title = getConversationTitle(conv).toLowerCase()
      const preview = (conv.latest_message || '').toLowerCase()
      return title.includes(q) || preview.includes(q)
    })
  })

  /**
   * Get conversation title based on participants
   */
  const getConversationTitle = (conv) => {
    if (!conv) return 'Conversation'
    
    // Check for title field
    if (conv.title) {
      return conv.title
    }

    // Try to get participant names
    if (conv.participants && Array.isArray(conv.participants)) {
      const otherParticipants = conv.participants.filter(p => p.user_id !== currentUserId.value)
      if (otherParticipants.length > 0) {
        return otherParticipants.map(p => p.user_name || p.name || 'Unknown').join(', ')
      }
    }

    // Fallback to single participant name fields
    if (conv.participant_names && conv.participant_names.length > 0) {
      return conv.participant_names.join(', ')
    }
    if (conv.participant_name) {
      return conv.participant_name
    }

    return 'Conversation'
  }

  /**
   * Get comma-separated list of participants
   */
  const getParticipantList = (conv) => {
    if (!conv?.participants) return ''
    const names = conv.participants.map(p => p.user_name || p.name || 'Unknown')
    return names.join(', ')
  }

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now - date
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    // Less than 1 minute ago
    if (diffInMinutes < 1) {
      return 'Just now'
    }
    // Less than 1 hour ago
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    }
    // Less than 24 hours ago
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    }
    // Less than 7 days ago
    if (diffInDays < 7) {
      return `${diffInDays}d ago`
    }
    // More than 7 days ago
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  /**
   * Load all conversations for current user
   */
  const loadConversations = async () => {
    try {
      loading.value = true
      currentUserId.value = getUserId()
      
      const response = await conversationAPI.list()
      conversations.value = response.data?.data || response.data || []
    } catch (error) {
      console.error('Error loading conversations:', error)
      conversations.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Open a conversation
   */
  const openConversation = async (conv) => {
    selectedConversation.value = conv
    // Mark as read by updating unread count
    if (conv.unread_count > 0) {
      conv.unread_count = 0
    }
  }

  /**
   * Close current conversation
   */
  const closeConversation = () => {
    selectedConversation.value = null
  }

  /**
   * Refresh conversations list
   */
  const refreshConversations = async () => {
    await loadConversations()
  }

  /**
   * Add or update a conversation in the list
   */
  const upsertConversation = (conversation) => {
    const index = conversations.value.findIndex(c => c.conversation_id === conversation.conversation_id)
    if (index >= 0) {
      conversations.value[index] = conversation
    } else {
      conversations.value.unshift(conversation)
    }
  }

  return {
    // State
    loading,
    conversations,
    selectedConversation,
    searchQuery,
    currentUserId,
    
    // Computed
    filteredConversations,
    
    // Methods
    getConversationTitle,
    getParticipantList,
    formatTime,
    loadConversations,
    openConversation,
    closeConversation,
    refreshConversations,
    upsertConversation
  }
}
