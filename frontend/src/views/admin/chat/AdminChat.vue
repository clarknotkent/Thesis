<template>
  <AdminLayout>
    <div class="admin-content">
      <!-- Breadcrumb -->
      <nav
        aria-label="breadcrumb"
        class="mb-3"
      >
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">
              Admin
            </router-link>
          </li>
          <li
            class="breadcrumb-item active"
            aria-current="page"
          >
            Messages
          </li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h4 mb-1 fw-semibold text-dark">
            <i class="bi bi-chat-dots me-2" />Messages
          </h1>
          <p class="text-muted mb-0 small">
            Admin messaging center
            <span
              v-if="isOffline"
              class="badge bg-warning text-dark ms-2"
            >
              <i class="bi bi-wifi-off me-1" />Offline Mode
            </span>
          </p>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-primary"
            :disabled="isOffline"
            @click="isOffline ? showOfflineToast() : showModal = true"
          >
            <i class="bi bi-plus-circle me-2" />New Chat
          </button>
          <button
            class="btn btn-outline-secondary"
            :disabled="loading || isOffline"
            @click="isOffline ? showOfflineToast() : refreshConversations()"
          >
            <i
              class="bi bi-arrow-clockwise"
              :class="{ 'fa-spin': loading }"
            />
            <span class="d-none d-sm-inline ms-1">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Chat Interface -->
      <div class="chat-container">
        <div class="row g-0 h-100">
          <!-- Conversations Sidebar -->
          <div
            class="col-lg-4 col-md-5 border-end d-flex flex-column h-100"
            style="width: 380px;"
          >
            <ConversationsList
              v-model:search-query="searchQuery"
              :conversations="filteredConversations"
              :selected-id="selectedConversation?.conversation_id"
              @select="selectConversation"
            />
          </div>

          <!-- Chat Area -->
          <div
            class="col-lg-8 col-md-7 d-flex flex-column h-100"
            style="width: calc(100% - 380px);"
          >
            <!-- Empty State -->
            <div
              v-if="!selectedConversation"
              class="empty-chat d-flex align-items-center justify-content-center h-100"
            >
              <div class="text-center">
                <i
                  class="bi bi-chat-dots text-muted mb-3"
                  style="font-size: 4rem;"
                />
                <h5 class="text-muted mb-2">
                  Select a conversation
                </h5>
                <p class="text-muted mb-4">
                  Choose a conversation from the sidebar to start chatting
                </p>
                <button
                  class="btn btn-primary"
                  :disabled="isOffline"
                  @click="isOffline ? showOfflineToast() : showModal = true"
                >
                  <i class="bi bi-plus-circle me-2" />Start New Chat
                </button>
              </div>
            </div>

            <!-- Active Chat -->
            <div
              v-else
              class="d-flex flex-column h-100"
            >
              <ChatHeader
                :conversation="selectedConversation"
                :participant-list="participantList"
                :leaving="leaving"
                :current-user-id="currentUserId"
                :offline="isOffline"
                @leave="isOffline ? showOfflineToast() : handleLeave()"
                @close="selectedConversation = null"
              />

              <div
                class="flex-grow-1 d-flex flex-column"
                style="min-height: 0;"
              >
                <MessagesList
                  ref="messagesList"
                  :messages="messages"
                  :current-user-id="currentUserId"
                />

                <MessageComposer
                  v-model="messageText"
                  :sending="sending"
                  :disabled="isOffline"
                  @send="isOffline ? showOfflineToast() : handleSendMessage()"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- New Conversation Modal -->
      <NewConversationModal
        v-if="showModal"
        v-model:subject="newConv.subject"
        v-model:message="newConv.message"
        v-model:search-query="userSearchQuery"
        v-model:selected-participants="newConv.participants"
        :users="availableUsers"
        :creating="creating"
        @close="closeModal"
        @create="handleCreateConversation"
      />
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue';
import ConversationsList from '@/features/shared/chat/components/ConversationsList.vue';
import ChatHeader from '@/features/shared/chat/components/ChatHeader.vue';
import MessagesList from '@/features/shared/chat/components/MessagesList.vue';
import MessageComposer from '@/features/shared/chat/components/MessageComposer.vue';
import NewConversationModal from '@/features/shared/chat/NewConversationModal.vue';
import { listUsers as getUsers } from '@/services/users';
import { useToast } from '@/composables/useToast';
import { getUserId } from '@/services/auth';
import { useOfflineAdmin } from '@/composables/useOfflineAdmin';
import {
  loadConversations as fetchConversations,
  loadMessages as fetchMessages,
  sendMessage,
  createNewConversation,
  leaveConversation,
  getParticipantList,
  processConversations
} from '@/features/shared/chat/useChatService';

const { addToast } = useToast();
const { isOffline } = useOfflineAdmin();

// State
const conversations = ref([]);
const selectedConversation = ref(null);
const messages = ref([]);
const messageText = ref('');
const searchQuery = ref('');
const currentUserId = ref(null);
const messagesList = ref(null);

// Modal state
const showModal = ref(false);
const availableUsers = ref([]);
const userSearchQuery = ref('');
const newConv = ref({
  subject: '',
  participants: [],
  message: ''
});

// Loading states
const loading = ref(false);
const sending = ref(false);
const creating = ref(false);
const leaving = ref(false);

// Polling
let pollHandle = null;

// Computed
const filteredConversations = computed(() => {
  const processed = processConversations(conversations.value, currentUserId.value);
  if (!searchQuery.value.trim()) return processed;
  
  const query = searchQuery.value.toLowerCase();
  return processed.filter(conv =>
    (conv.title || '').toLowerCase().includes(query) ||
    (conv.latest_message || '').toLowerCase().includes(query)
  );
});

const participantList = computed(() => {
  if (!selectedConversation.value) return '';
  return getParticipantList(selectedConversation.value);
});

// Methods
const refreshConversations = async () => {
  loading.value = true;
  try {
    conversations.value = await fetchConversations();
  } catch (error) {
    addToast({ title: 'Error', message: 'Failed to load conversations', type: 'error' });
  } finally {
    loading.value = false;
  }
};

const showOfflineToast = () => {
  addToast({
    title: 'Offline Mode',
    message: 'Chat functionality is not available while offline',
    type: 'warning'
  });
};

const selectConversation = async (conv) => {
  selectedConversation.value = conv;
  try {
    messages.value = await fetchMessages(conv.conversation_id);
    messagesList.value?.scrollToBottom();
  } catch (error) {
    addToast({ title: 'Error', message: 'Failed to load messages', type: 'error' });
  }
};

const handleSendMessage = async () => {
  if (!selectedConversation.value || !messageText.value.trim()) return;
  if (messageText.value.length > 1000) {
    addToast({ title: 'Warning', message: 'Message is too long. Maximum 1000 characters.', type: 'warning' });
    return;
  }

  sending.value = true;
  try {
    await sendMessage(selectedConversation.value.conversation_id, messageText.value);
    messageText.value = '';
    messages.value = await fetchMessages(selectedConversation.value.conversation_id);
    messagesList.value?.scrollToBottom();
  } catch (error) {
    addToast({ title: 'Error', message: 'Failed to send message', type: 'error' });
  } finally {
    sending.value = false;
  }
};

const handleLeave = async () => {
  if (!selectedConversation.value) return;
  
  leaving.value = true;
  try {
    await leaveConversation(selectedConversation.value.conversation_id);
    conversations.value = conversations.value.filter(
      c => c.conversation_id !== selectedConversation.value.conversation_id
    );
    selectedConversation.value = null;
    addToast({ title: 'Left', message: 'You left the conversation.', type: 'success' });
  } catch (error) {
    addToast({ title: 'Error', message: 'Failed to leave conversation', type: 'error' });
  } finally {
    leaving.value = false;
  }
};

const fetchAvailableUsers = async (search = '') => {
  try {
    // getUsers returns the response.data directly (not the axios response)
    const data = await getUsers({ search, limit: 50 });
    const raw = Array.isArray(data)
      ? data
      : (data?.users || data?.items || data?.data || []);

    const getUserKey = (u) => u?.user_id ?? u?.id ?? u?.userId ?? null;
    const currentId = getUserKey({ user_id: currentUserId.value, id: currentUserId.value });

    availableUsers.value = raw
      .map(u => ({
        ...u,
        __id: getUserKey(u),
        full_name: u.full_name || u.name || `${u.firstname || u.first_name || ''} ${u.surname || u.last_name || ''}`.trim(),
      }))
      .filter(u => u.__id !== null && String(u.__id) !== String(currentId));

    // Optional: notify when no users are available
    if (availableUsers.value.length === 0) {
      console.warn('[AdminChat] No users available for selection');
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    const msg = error?.response?.data?.message || error?.message || 'Unknown error';
    addToast({ title: 'Error', message: `Failed to fetch users: ${msg}` , type: 'error' });
  }
};

const handleCreateConversation = async () => {
  if (newConv.value.participants.length === 0) {
    addToast({ title: 'Info', message: 'Please select at least one participant.', type: 'info' });
    return;
  }
  
  const msg = (newConv.value.message || '').trim();
  if (!msg) {
    addToast({ title: 'Info', message: 'Type your first message to start the conversation.', type: 'info' });
    return;
  }
  
  if (msg.length > 1000) {
    addToast({ title: 'Warning', message: 'Message is too long. Maximum 1000 characters.', type: 'warning' });
    return;
  }

  creating.value = true;
  try {
    const conv = await createNewConversation(
      newConv.value.subject,
      newConv.value.participants,
      msg
    );
    
    closeModal();
    await refreshConversations();
    
    if (conv?.conversation_id) {
      selectedConversation.value = conv;
      messages.value = await fetchMessages(conv.conversation_id);
    }
    
    addToast({ title: 'Sent', message: 'Conversation created and message sent.', type: 'success' });
  } catch (error) {
    addToast({ title: 'Error', message: 'Failed to start conversation.', type: 'error' });
  } finally {
    creating.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  newConv.value = { subject: '', participants: [], message: '' };
  userSearchQuery.value = '';
};

// Watchers
watch(selectedConversation, (conv) => {
  if (pollHandle) clearInterval(pollHandle);
  
  if (conv?.conversation_id) {
    pollHandle = setInterval(async () => {
      try {
        messages.value = await fetchMessages(conv.conversation_id);
      } catch (error) {
        console.error('Failed to poll messages:', error);
      }
    }, 5000);
  }
});

watch(showModal, (isShown) => {
  if (isShown) {
    newConv.value.participants = [];
    fetchAvailableUsers();
  }
});

watch(userSearchQuery, (query) => {
  fetchAvailableUsers(query);
});

// Lifecycle
onMounted(async () => {
  currentUserId.value = getUserId();
  await refreshConversations();
});

onBeforeUnmount(() => {
  if (pollHandle) clearInterval(pollHandle);
});
</script>

<style scoped>
.admin-content {
  padding: 0;
}

/* Breadcrumb Styling */
.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin: 0;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
}

.breadcrumb-item a {
  color: #4e73df;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #6c757d;
}

.chat-container {
  height: calc(100vh - 200px);
  min-height: 600px;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  background: white;
  border: 1px solid #dee2e6;
  width: 100%;
}

.empty-chat {
  background: white;
}

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 150px);
  }
  
  .admin-content {
    padding: 0%;
  }
}
</style>
