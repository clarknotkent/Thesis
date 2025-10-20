<template>
  <AdminLayout>
  <div class="container-fluid py-4 chat-wrapper">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-1 text-gray-800 fw-bold">
            <i class="bi bi-chat-dots-fill text-primary me-2"></i>
            Messages
          </h1>
          <p class="text-muted mb-0 small">Admin messaging center</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-primary btn-sm d-flex align-items-center" @click="showNewConversationModal = true">
            <i class="bi bi-plus-circle me-1"></i>
            <span class="d-none d-sm-inline">New Chat</span>
          </button>
          <button class="btn btn-outline-secondary btn-sm" @click="loadConversations" :disabled="loading">
            <i class="bi bi-arrow-clockwise" :class="{ 'fa-spin': loading }"></i>
            <span class="d-none d-sm-inline ms-1">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Chat Interface -->
      <div class="chat-container">
        <div class="row g-0 h-100 chat-row">
          <!-- Conversations Sidebar -->
          <div class="col-lg-4 col-md-5 border-end bg-light sidebar-column">
            <div class="conversations-sidebar h-100 d-flex flex-column">
              <!-- Search -->
              <div class="p-3 border-bottom bg-white">
                <div class="input-group">
                  <span class="input-group-text bg-transparent border-end-0">
                    <i class="bi bi-search text-muted"></i>
                  </span>
                  <input
                    v-model="searchQuery"
                    class="form-control border-start-0 ps-0"
                    placeholder="Search conversations..."
                    @input="filterConversations"
                  >
                </div>
              </div>

              <!-- Conversations List -->
              <div class="flex-grow-1 overflow-auto">
                <div v-if="filteredConversations.length === 0" class="text-center py-5">
                  <i class="bi bi-chat-square-dots text-muted" style="font-size: 3rem;"></i>
                  <p class="text-muted mt-2 mb-0">No conversations found</p>
                </div>
                <div v-else>
                  <div
                    v-for="conv in filteredConversations"
                    :key="conv.conversation_id"
                    class="conversation-item"
                    :class="{ active: selected && selected.conversation_id === conv.conversation_id }"
                    @click="selectConversation(conv)"
                  >
                    <div class="d-flex align-items-center p-3">
                      <!-- Avatar -->
                      <div class="avatar-circle me-3 flex-shrink-0">
                        {{ getInitials(conversationTitle(conv)) }}
                      </div>

                      <!-- Content -->
                      <div class="flex-grow-1 min-w-0">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                          <h6 class="mb-0 text-truncate fw-semibold">{{ conversationTitle(conv) }}</h6>
                          <small class="text-muted ms-2 flex-shrink-0">
                            {{ formatTime(conv.latest_message_time) }}
                          </small>
                        </div>
                        <p class="text-muted small text-truncate mb-1">
                          <template v-if="conv.latest_message">
                            <template v-if="conv.latest_message_sender_name">
                              <strong>{{ conv.latest_message_sender_name }}:</strong>
                              {{ ' ' + conv.latest_message }}
                            </template>
                            <template v-else>
                              {{ conv.latest_message }}
                            </template>
                          </template>
                          <template v-else>
                            No messages yet
                          </template>
                        </p>
                        <div class="d-flex justify-content-between align-items-center">
                          <small class="text-muted">
                            {{ conv.participants?.length || 0 }} participants
                          </small>
                          <span v-if="conv.unread_count > 0" class="badge bg-primary rounded-pill badge-sm">
                            {{ conv.unread_count }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Chat Area -->
          <div class="col-lg-8 col-md-7 d-flex flex-column chat-column">
            <!-- Chat Header -->
            <div v-if="selected" class="chat-header border-bottom bg-white p-3">
              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                  <div class="avatar-circle me-3">
                    {{ getInitials(conversationTitle(selected)) }}
                  </div>
                  <div>
                    <h6 class="mb-0 fw-semibold">{{ conversationTitle(selected) }}</h6>
                    <small class="text-muted">{{ participantList }}</small>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <small class="text-muted">{{ formatDate(selected.latest_message_time) }}</small>
                  <button class="btn btn-sm btn-outline-danger" @click="leave" :disabled="leaving">
                    <i class="bi bi-box-arrow-right me-1"></i>
                    <span class="d-none d-sm-inline">Leave</span>
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" @click="selected = null">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Messages Area -->
            <div class="flex-grow-1 d-flex flex-column chat-main">
              <div v-if="!selected" class="empty-chat d-flex align-items-center justify-content-center h-100">
                <div class="text-center">
                  <div class="empty-chat-icon mb-3">
                    <i class="bi bi-chat-dots text-primary" style="font-size: 4rem;"></i>
                  </div>
                  <h5 class="text-muted mb-2">Select a conversation</h5>
                  <p class="text-muted mb-4">Choose a conversation from the sidebar to start chatting</p>
                  <button class="btn btn-primary" @click="showNewConversationModal = true">
                    <i class="bi bi-plus-circle me-2"></i>Start New Chat
                  </button>
                </div>
              </div>

              <div v-else class="messages-container flex-grow-1 d-flex flex-column">
                <!-- Messages List -->
                <div class="messages-list flex-grow-1 p-3 overflow-auto" ref="messagesBox">
                  <div v-if="messages.length === 0" class="text-center py-5">
                    <i class="bi bi-chat-square-dots text-muted mb-2" style="font-size: 2rem;"></i>
                    <p class="text-muted mb-0">No messages yet. Start the conversation!</p>
                  </div>
                  <div v-else>
                    <div
                      v-for="(message, index) in messages"
                      :key="message.message_id"
                      class="message-wrapper mb-3"
                      :class="{
                        'message-sent': message.sender_id === currentUserId,
                        'message-received': message.sender_id !== currentUserId
                      }"
                    >
                      <!-- Show sender name for received messages 
                      <div
                        v-if="message.sender_id !== currentUserId && getSenderName(message.sender_id)"
                        class="sender-name small text-muted mb-1 ms-3"
                      >
                        {{ getSenderName(message.sender_id) }}
                      </div>-->

                      <div class="message-bubble">
                        <div class="message-content">{{ message.message_content }}</div>
                        <div class="message-time small text-muted mt-1">
                          {{ formatTime(message.created_at) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Message Composer -->
                <div class="message-composer border-top bg-white p-3">
                  <div class="d-flex gap-2 align-items-end">
                    <div class="flex-grow-1">
                      <textarea
                        v-model="composer"
                        @keydown="handleKeyDown"
                        @input="autoResize"
                        ref="messageInput"
                        class="form-control message-input"
                        placeholder="Type your message..."
                        rows="1"
                        style="resize: none; min-height: 40px; max-height: 120px; overflow-y: auto;"
                      ></textarea>
                    </div>
                    <button
                      class="btn btn-primary send-button"
                      @click="send"
                      :disabled="!composer.trim() || sending"
                    >
                      <i v-if="sending" class="bi bi-hourglass-split fa-spin"></i>
                      <i v-else class="bi bi-send-fill"></i>
                    </button>
                  </div>
                  <div class="text-muted small mt-2" v-if="composer.length > 800">
                    {{ composer.length }}/1000 characters
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- New Conversation Modal -->
      <div v-if="showNewConversationModal" class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">
                <i class="bi bi-plus-circle me-2"></i>Start New Conversation
              </h5>
              <button type="button" class="btn-close btn-close-white" @click="showNewConversationModal = false"></button>
            </div>
            <div class="modal-body p-4">
              <div class="mb-4">
                <label for="subject" class="form-label fw-semibold">Subject (Optional)</label>
                <input
                  type="text"
                  id="subject"
                  v-model="newConversation.subject"
                  class="form-control form-control-lg"
                  placeholder="Enter conversation subject..."
                >
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">First message</label>
                <textarea
                  v-model="newConversation.firstMessage"
                  class="form-control"
                  rows="3"
                  placeholder="Type your first message..."
                  maxlength="1000"
                ></textarea>
                <div class="form-text text-end">{{ (newConversation.firstMessage || '').length }}/1000</div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Select Participants</label>
                <input
                  type="text"
                  v-model="userSearch"
                  @input="searchUsers"
                  class="form-control mb-3"
                  placeholder="Search users by name or role..."
                >
                <div class="participants-list border rounded p-3" style="max-height: 300px; overflow-y: auto;">
                  <div v-if="availableUsers.length === 0" class="text-center py-4">
                    <i class="bi bi-search text-muted mb-2" style="font-size: 2rem;"></i>
                    <p class="text-muted mb-0">No users found</p>
                  </div>
                  <div v-else>
                    <div
                      v-for="user in availableUsers"
                      :key="user.__id"
                      class="participant-item d-flex align-items-center p-2 rounded hover-bg-light"
                    >
                      <input
                        class="form-check-input me-3"
                        type="checkbox"
                        :value="user.__id"
                        :id="'user-'+user.__id"
                        v-model="newConversation.participants"
                      >
                      <div class="avatar-circle-sm me-3">
                        {{ getInitials(user.full_name || `${user.firstname} ${user.surname}`) }}
                      </div>
                      <label class="form-check-label flex-grow-1 mb-0" :for="'user-'+user.__id">
                        <div class="fw-semibold">{{ user.full_name || `${user.firstname} ${user.surname}` }}</div>
                        <small class="text-muted">{{ user.role }}</small>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="showNewConversationModal = false">
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click="createConversation"
                :disabled="newConversation.participants.length === 0 || !(newConversation.firstMessage || '').trim() || creating"
              >
                <span v-if="creating" class="spinner-border spinner-border-sm me-2"></span>
                Send & Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import api from '@/services/api';
import { getUsers } from '@/services/userService';
import { useToast } from '@/composables/useToast';
import { getUserId } from '@/services/auth';

const conversations = ref([]);
const selected = ref(null);
const messages = ref([]);
const composer = ref('');
const messagesBox = ref(null);
const searchQuery = ref('');
const filteredConversations = ref([]);
const currentUserId = ref(null);
const messageInput = ref(null);
const { addToast } = useToast();

const showNewConversationModal = ref(false);
const availableUsers = ref([]);
const userSearch = ref('');
const newConversation = ref({
  subject: '',
  participants: [],
  firstMessage: ''
});

// New reactive variables
const loading = ref(false);
const sending = ref(false);
const creating = ref(false);
const leaving = ref(false);

let pollHandle = null;

const loadConversations = async () => {
  loading.value = true;
  try {
    const res = await api.get('/conversations');
    conversations.value = res.data.items || res.data || [];
    filterConversations();
  } catch (e) {
    addToast({ title: 'Error', message: 'Failed to load conversations', type: 'error' });
  } finally {
    loading.value = false;
  }
};

const filterConversations = () => {
  if (!searchQuery.value.trim()) {
    filteredConversations.value = conversations.value;
  } else {
    const query = searchQuery.value.toLowerCase();
    filteredConversations.value = conversations.value.filter(conv =>
      (conversationTitle(conv) || '').toLowerCase().includes(query) ||
      (conv.latest_message || '').toLowerCase().includes(query)
    );
  }
};

const selectConversation = async (conv) => {
  selected.value = conv;
  await loadMessages(conv.conversation_id);
};

const loadMessages = async (conversation_id) => {
  try {
    const res = await api.get(`/messages/${conversation_id}`);
    messages.value = res.data.items || res.data || [];
    await nextTick();
    scrollMessagesToBottom();
  } catch (e) {
    addToast({ title: 'Error', message: 'Failed to load messages', type: 'error' });
  }
};

// Normalize to a stable user key regardless of backend shape
const getUserKey = (u) => u?.user_id ?? u?.id ?? u?.userId ?? null;

const fetchUsers = async (search = '') => {
  try {
    const response = await getUsers({ search, limit: 50 });
    const raw = response.data.users || response.data || [];
    const currentId = getUserKey({ user_id: currentUserId.value, id: currentUserId.value });
    availableUsers.value = raw
      .map(u => ({
        ...u,
        __id: getUserKey(u),
        full_name: u.full_name || `${u.firstname || u.first_name || ''} ${u.surname || u.last_name || ''}`.trim(),
      }))
      .filter(u => u.__id !== null && u.__id !== currentId);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    addToast({ title: 'Error', message: 'Failed to fetch users.', type: 'error' });
  }
};

const searchUsers = () => {
  fetchUsers(userSearch.value);
};

const createConversation = async () => {
  if (newConversation.value.participants.length === 0) {
    addToast({ title: 'Info', message: 'Please select at least one participant.', type: 'info' });
    return;
  }
  const msg = (newConversation.value.firstMessage || '').trim();
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
    const payload = {
      subject: newConversation.value.subject || 'New Conversation',
      participants: Array.from(new Set([
        ...newConversation.value.participants,
        getUserKey({ user_id: currentUserId.value })
      ])),
      message_content: msg,
      message_type: 'chat'
    };
    const res = await api.post('/conversations/start', payload);
    const conv = res.data.conversation || res.data?.conversation || null;
    showNewConversationModal.value = false;
    // reset modal state
    newConversation.value.subject = '';
    newConversation.value.participants = [];
    newConversation.value.firstMessage = '';
    // refresh and select new conversation
    await loadConversations();
    if (conv?.conversation_id) {
      selected.value = conv;
      await loadMessages(conv.conversation_id);
    }
    addToast({ title: 'Sent', message: 'Conversation created and message sent.', type: 'success' });
  } catch (e) {
    addToast({ title: 'Error', message: 'Failed to start conversation.', type: 'error' });
  } finally {
    creating.value = false;
  }
};

const send = async () => {
  if (!selected.value) return addToast({ title: 'Info', message: 'Select a conversation first', type: 'info' });
  if (!composer.value.trim()) return;
  if (composer.value.length > 1000) {
    return addToast({ title: 'Warning', message: 'Message is too long. Maximum 1000 characters.', type: 'warning' });
  }

  sending.value = true;
  try {
    await api.post('/messages', { conversation_id: selected.value.conversation_id, message_content: composer.value });
    composer.value = '';
    autoResize(); // Reset textarea height
    await loadMessages(selected.value.conversation_id);
  } catch (e) {
    addToast({ title: 'Error', message: 'Failed to send message', type: 'error' });
  } finally {
    sending.value = false;
  }
};

const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    send();
  }
};

const autoResize = () => {
  const textarea = messageInput.value;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
};

// Helper to shift any Date by N hours (used to display PH time as UTC+8)
const shiftHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

// Format a timestamp adding +8 hours (PH time)
const formatDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  const ph = shiftHours(d, 8);
  return ph.toLocaleString('en-PH');
};

const formatTime = (s) => {
  if (!s) return '';
  const dateOrig = new Date(s);
  const date = shiftHours(dateOrig, 8);
  const now = shiftHours(new Date(), 8);
  const diff = now - date;

  if (diff < 60000) return 'now'; // less than 1 minute
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`; // less than 1 hour
  if (diff < 86400000) {
    // same day -> HH:mm
    return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 604800000) {
    // this week -> Weekday
    return date.toLocaleDateString('en-PH', { weekday: 'short' });
  }

  // older -> Month Day
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const scrollMessagesToBottom = () => {
  try {
    const el = messagesBox.value;
    if (el) el.scrollTop = el.scrollHeight;
  } catch (_) {}
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
};

const getParticipantDisplayName = (p) => {
  if (!p) return '';
  return (
    p.participant_name ||
    p.full_name ||
    `${p.firstname || p.first_name || ''} ${p.surname || p.last_name || ''}`.trim() ||
    p.email ||
    ''
  );
};

const otherParticipantNames = (conv) => {
  const me = String(currentUserId.value ?? '');
  const list = Array.isArray(conv?.participants) ? conv.participants : [];
  const others = list.filter(p => String(getUserKey(p)) !== me);
  return others.map(getParticipantDisplayName).filter(Boolean);
};

const conversationTitle = (conv) => {
  if (!conv) return 'Conversation';
  // 1) Explicit participant_name from backend is preferred
  if (typeof conv.participant_name === 'string' && conv.participant_name.trim()) {
    const pn = conv.participant_name.trim();
    // If participant_name equals the current user's name, show the sender name instead
    let myName = '';
    if (Array.isArray(conv.participants)) {
      const myId = String(getUserKey({ user_id: currentUserId.value, id: currentUserId.value }));
      const me = conv.participants.find(p => String(getUserKey(p)) === myId);
      if (me) myName = getParticipantDisplayName(me) || '';
    }
    const eq = (a, b) => (a || '').toString().trim().toLowerCase() === (b || '').toString().trim().toLowerCase();
    if (eq(pn, myName) && (conv.latest_message_sender_name || '').toString().trim()) {
      return conv.latest_message_sender_name.toString().trim();
    }
    return pn;
  }
  if ((conv.subject || '').trim()) return conv.subject;
  // Prefer backend-provided other participant name fields if present
  const viewOther = conv.other_participant_name || conv.other_participants || conv.other_name || '';
  if (typeof viewOther === 'string' && viewOther.trim()) return viewOther.trim();
  if (Array.isArray(conv.other_participant_names) && conv.other_participant_names.length) {
    const joined = conv.other_participant_names.filter(Boolean).join(', ').trim();
    if (joined) return joined;
  }
  const names = otherParticipantNames(conv);
  if (names.length === 1) return names[0];
  if (names.length > 1) return names.slice(0, 3).join(', ') + (names.length > 3 ? '…' : '');
  // Avoid showing numeric conversation id; use a generic label instead
  return 'Conversation';
};

const getSenderName = (senderId) => {
  // Find the sender in the conversation participants
  const sid = getUserKey({ user_id: senderId, id: senderId });
  if (selected.value && Array.isArray(selected.value.participants)) {
    const participant = selected.value.participants.find(p => {
      const pid = getUserKey(p);
      return pid !== null && String(pid) === String(sid);
    });
    if (participant) {
      const first = participant.firstname || participant.first_name || '';
      const last = participant.surname || participant.last_name || '';
      return (
        participant.name ||
        participant.full_name ||
        `${first} ${last}`.trim() ||
        participant.email ||
        ''
      );
    }
  }
  return '';
};

watch(selected, (v) => {
  if (v && v.conversation_id) {
    if (pollHandle) clearInterval(pollHandle);
    pollHandle = setInterval(() => { loadMessages(v.conversation_id) }, 5000);
  }
});

watch(showNewConversationModal, (isShown) => {
  if (isShown) {
    // Reset and normalize selection to string ids each time modal opens
    newConversation.value.participants = [];
    fetchUsers();
  }
});

onMounted(async () => {
  currentUserId.value = getUserId();
  await loadConversations();
});

onBeforeUnmount(() => {
  if (pollHandle) clearInterval(pollHandle);
});

const participantList = computed(() => {
  if (!selected.value || !selected.value.participants) return '';
  return selected.value.participants.map(getParticipantDisplayName).filter(Boolean).join(', ');
});

// Leave conversation
const leave = async () => {
  if (!selected.value) return;
  leaving.value = true;
  try {
    await api.post(`/conversations/${selected.value.conversation_id}/leave`);
    // Remove from lists and clear selection
    conversations.value = conversations.value.filter(c => c.conversation_id !== selected.value.conversation_id);
    filterConversations();
    selected.value = null;
    addToast({ title: 'Left', message: 'You left the conversation.', type: 'success' });
  } catch (e) {
    addToast({ title: 'Error', message: 'Failed to leave conversation', type: 'error' });
  } finally {
    leaving.value = false;
  }
};
</script>

<style scoped>
/* Chat Container */
.chat-wrapper {
  /* Allow child flex items to shrink and scroll */
  min-height: 0;
}

.chat-container {
  height: calc(100vh - 200px);
  min-height: 600px;
  border-radius: 12px;
  /* Do not clip inner scroll; let children manage their own overflow */
  overflow: visible;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: white;
  display: flex;
  flex-direction: column;
}

.chat-row {
  min-height: 0; /* critical for inner scroll */
}

/* Ensure the right column allows inner scroll areas */
.chat-column {
  min-height: 0; /* critical so the inner flex child can shrink and scroll */
  display: flex;
  flex-direction: column;
}

/* Conversations Sidebar */
.conversations-sidebar {
  background: #f8f9fa;
  min-height: 0; /* allow inner list to scroll */
}

/* Ensure the left sidebar column doesn't trap overflow */
.sidebar-column {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.conversation-item {
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #e9ecef;
}

.conversation-item:hover {
  background: rgba(13, 110, 253, 0.05);
}

.conversation-item.active {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
}

.conversation-item.active .text-muted {
  color: rgba(255, 255, 255, 0.8) !important;
}

.conversation-item.active .badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Avatar Styles */
.avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-circle-sm {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Chat Header */
.chat-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 3; /* keep above messages */
}

/* Messages Container */
.messages-container {
  background: #f8f9fa;
  /* Allow children to manage their own height when using flex */
  min-height: 0;
}

.messages-list {
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  /* Ensure the list scrolls and doesn't push the composer */
  overflow-y: auto;
  min-height: 0;
}

/* Ensure the main chat section can shrink to allow messages list to scroll */
.chat-main {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Fix header and composer to natural content height */
.chat-header {
  flex: 0 0 auto;
}

.message-composer {
  flex: 0 0 auto;
}

/* Message Styles */
.message-wrapper {
  display: flex;
  margin-bottom: 16px;
  animation: messageSlideIn 0.3s ease-out;
}

.message-wrapper.message-sent {
  justify-content: flex-end;
}

.message-wrapper.message-received {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.message-wrapper.message-sent .message-bubble {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border-bottom-right-radius: 6px;
  margin-left: auto;
}

.message-wrapper.message-received .message-bubble {
  background: white;
  border: 1px solid #e9ecef;
  border-bottom-left-radius: 6px;
  margin-right: auto;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.message-wrapper.message-sent .message-time {
  text-align: right;
  color: rgba(255, 255, 255, 0.8);
}

/* Sender Name */
.sender-name {
  margin-bottom: 4px;
  font-weight: 500;
}

/* Message Composer */
.message-composer {
  background: white;
  border-top: 1px solid #dee2e6;
  /* Keep the composer visible at the bottom */
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.message-input {
  border: 1px solid #dee2e6;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.message-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: none;
}

.send-button {
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.05);
}

.send-button:disabled {
  opacity: 0.6;
}

/* Empty States */
.empty-chat {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.empty-chat-icon {
  opacity: 0.6;
}

/* Badge Styles */
.badge-sm {
  font-size: 10px;
  padding: 4px 6px;
}

/* Hover Effects */
.hover-bg-light:hover {
  background: #f8f9fa !important;
}

/* Animations */
@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scrollbar Styling */
.messages-list::-webkit-scrollbar {
  width: 6px;
}

.messages-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.messages-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.messages-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 150px);
  }

  .message-bubble {
    max-width: 85%;
  }

  .avatar-circle {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }

  .conversation-item .d-flex {
    padding: 12px;
  }
}

/* Loading States */
.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modal Improvements */
.modal-content {
  border: none;
  border-radius: 12px;
}

.modal-header {
  border-radius: 12px 12px 0 0;
}

.participants-list {
  border: 1px solid #dee2e6;
  border-radius: 8px;
}

.participant-item {
  transition: all 0.2s ease;
  border-radius: 6px;
}
</style>
