<template>
  <ParentLayout>
    <div class="chat-page">
      <!-- Header -->
      <div class="chat-header d-flex align-items-center gap-2 p-2 border-bottom bg-white">
        <button class="btn btn-link text-decoration-none" @click="goBack">
          <i class="bi bi-arrow-left"></i>
        </button>
  <div class="flex-fill">
          <div class="fw-semibold text-truncate">{{ title }}</div>
          <div class="text-muted small text-truncate">{{ participantsLabel }}</div>
        </div>
      </div>

      <!-- Messages -->
      <div class="chat-body d-flex flex-column">
        <MessagesList
          ref="messagesList"
          :messages="messages"
          :current-user-id="currentUserId"
        />

        <MessageComposer
          v-model="messageText"
          :sending="sending"
          @send="handleSend"
        />

      </div>
    </div>
  </ParentLayout>
  
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import MessagesList from '@/features/shared/chat/components/MessagesList.vue'
import MessageComposer from '@/features/shared/chat/components/MessageComposer.vue'
import { useToast } from '@/composables/useToast'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { getUserId } from '@/services/auth'
import { loadMessages, sendMessage, loadConversations, getConversationTitle, getParticipantList } from '@/features/shared/chat/useChatService'

const route = useRoute()
const router = useRouter()
const { addToast } = useToast()
const { isOnline } = useOnlineStatus()

const currentUserId = ref(getUserId())
const conversationId = computed(() => route.params.conversationId || route.params.id)

const messages = ref([])
const messageText = ref('')
const sending = ref(false)
const selectedConversation = ref(null)
const messagesList = ref(null)

const title = computed(() => getConversationTitle(selectedConversation.value, currentUserId.value))
const participantsLabel = computed(() => getParticipantList(selectedConversation.value))

const fetchConversation = async () => {
  try {
    const convs = await loadConversations()
    const conv = convs.find(c => String(c.conversation_id || c.id) === String(conversationId.value))
    selectedConversation.value = conv || null
  } catch (e) {
    console.error('Failed to load conversations', e)
  }
}

const fetchMessages = async () => {
  if (!conversationId.value) return
  try {
    messages.value = await loadMessages(conversationId.value)
    messagesList.value?.scrollToBottom()
  } catch (e) {
    console.error('Failed to load messages', e)
    addToast({ title: 'Error', message: 'Failed to load messages', type: 'error' })
  }
}

const handleSend = async () => {
  if (!isOnline.value) {
    addToast({ message: 'Cannot send messages while offline. Please connect to the internet.', type: 'warning' })
    return
  }
  const text = (messageText.value || '').trim()
  if (!text) return
  if (!conversationId.value) return
  if (text.length > 1000) {
    addToast({ title: 'Warning', message: 'Message is too long (max 1000).', type: 'warning' })
    return
  }
  sending.value = true
  try {
    await sendMessage(conversationId.value, text)
    messageText.value = ''
    await fetchMessages()
  } catch (e) {
    console.error('Failed to send message', e)
    addToast({ title: 'Error', message: 'Failed to send message', type: 'error' })
  } finally {
    sending.value = false
  }
}


const goBack = () => router.push({ name: 'ParentMessages' })


onMounted(async () => {
  // Redirect if offline
  if (!isOnline.value) {
    addToast({ message: 'Messaging is not available offline. Redirecting to messages list...', type: 'warning' })
    router.push({ name: 'ParentMessages' })
    return
  }
  await fetchConversation()
  await fetchMessages()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 56px - 70px);
}
.chat-header {
  position: sticky;
  top: 0;
  z-index: 1;
}
.chat-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
}

</style>
