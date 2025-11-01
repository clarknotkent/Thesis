/**
 * Composable for creating new conversations
 * Handles user selection and conversation creation
 */
import { ref, computed } from 'vue'
import { conversationAPI } from '@/services/api'
import axios from 'axios'

export function useNewConversation() {
  // State
  const creating = ref(false)
  const showNewMessageModal = ref(false)
  const availableUsers = ref([])
  const newConversation = ref({
    title: '',
    selectedUsers: [],
    initialMessage: ''
  })

  // Computed
  const canCreateConversation = computed(() => {
    return newConversation.value.selectedUsers.length > 0 && 
           newConversation.value.initialMessage.trim().length > 0
  })

  /**
   * Load available users for creating conversations
   */
  const loadAvailableUsers = async () => {
    try {
      // Load both health workers and parents as potential conversation participants
      const [hwResponse, parentsResponse] = await Promise.all([
        axios.get('/api/health-workers'),
        axios.get('/api/parents')
      ])

      const healthWorkers = (hwResponse.data?.data || hwResponse.data || []).map(hw => ({
        user_id: hw.id,
        name: `${hw.firstname} ${hw.surname}`,
        type: 'Health Worker',
        role: hw.type || 'Staff'
      }))

      const parents = (parentsResponse.data?.data || parentsResponse.data || []).map(parent => ({
        user_id: parent.id,
        name: `${parent.firstname} ${parent.surname}`,
        type: 'Parent/Guardian',
        role: 'Parent'
      }))

      availableUsers.value = [...healthWorkers, ...parents]
    } catch (error) {
      console.error('Error loading available users:', error)
      availableUsers.value = []
    }
  }

  /**
   * Open new conversation modal
   */
  const openNewConversationModal = async () => {
    showNewMessageModal.value = true
    if (availableUsers.value.length === 0) {
      await loadAvailableUsers()
    }
  }

  /**
   * Close new conversation modal
   */
  const closeModal = () => {
    showNewMessageModal.value = false
    resetNewConversation()
  }

  /**
   * Reset new conversation form
   */
  const resetNewConversation = () => {
    newConversation.value = {
      title: '',
      selectedUsers: [],
      initialMessage: ''
    }
  }

  /**
   * Toggle user selection
   */
  const toggleUserSelection = (userId) => {
    const index = newConversation.value.selectedUsers.indexOf(userId)
    if (index >= 0) {
      newConversation.value.selectedUsers.splice(index, 1)
    } else {
      newConversation.value.selectedUsers.push(userId)
    }
  }

  /**
   * Check if user is selected
   */
  const isUserSelected = (userId) => {
    return newConversation.value.selectedUsers.includes(userId)
  }

  /**
   * Create a new conversation
   */
  const createConversation = async () => {
    if (!canCreateConversation.value) {
      throw new Error('Please select at least one user and enter a message')
    }

    try {
      creating.value = true

      // Create conversation
      const conversationData = {
        title: newConversation.value.title || undefined,
        participant_ids: newConversation.value.selectedUsers,
        initial_message: newConversation.value.initialMessage.trim()
      }

      const response = await conversationAPI.create(conversationData)
      const conversation = response.data?.data || response.data

      // Reset form and close modal
      resetNewConversation()
      showNewMessageModal.value = false

      return conversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    } finally {
      creating.value = false
    }
  }

  return {
    // State
    creating,
    showNewMessageModal,
    availableUsers,
    newConversation,
    
    // Computed
    canCreateConversation,
    
    // Methods
    loadAvailableUsers,
    openNewConversationModal,
    closeModal,
    resetNewConversation,
    toggleUserSelection,
    isUserSelected,
    createConversation
  }
}
