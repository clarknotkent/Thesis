<template>
  <ParentLayout>
    <div class="messages-container">
      <!-- Offline Warning -->
      <div
        v-if="!isOnline"
        class="alert alert-warning d-flex align-items-center mb-3"
        role="alert"
      >
        <i class="bi bi-wifi-off me-2" />
        <div>
          <strong>Offline Mode - Messaging Disabled</strong><br>
          <small>You must be online to send or view messages. Connect to the internet to access messaging features.</small>
        </div>
      </div>

      <div class="section-header d-flex justify-content-between align-items-center">
        <h5 class="section-title mb-0">
          Messages
        </h5>
        <button 
          class="btn btn-primary btn-sm" 
          :disabled="!isOnline"
          :title="!isOnline ? 'Not available offline' : 'Start new chat'"
          @click="openNewChat"
        >
          <i class="bi bi-plus-circle me-1" />
          New Chat
        </button>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-5"
      >
        <div
          class="spinner-border text-primary"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="messages.length === 0"
        class="empty-state"
      >
        <div class="empty-state-icon">
          <i class="bi bi-chat-dots" />
        </div>
        <h6 class="empty-state-title">
          No Messages
        </h6>
        <p class="empty-state-text">
          You don't have any messages yet.
        </p>
      </div>

      <!-- Messages List -->
      <div
        v-else
        class="messages-list"
      >
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-item"
          :class="{ unread: !message.read, 'disabled-offline': !isOnline }"
          :style="{ cursor: isOnline ? 'pointer' : 'not-allowed', opacity: isOnline ? 1 : 0.6 }"
          @click="openConversation(message)"
        >
          <div class="message-avatar">
            <i class="bi bi-person-circle" />
          </div>
          <div class="message-content">
            <div class="message-header">
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <h6
                  class="message-sender"
                  style="margin:0"
                >
                  {{ message.sender }}
                </h6>
                <small
                  v-if="message.role"
                  class="sender-role badge bg-primary-subtle text-black me-2"
                  style="font-weight:600; font-size:0.65rem; text-transform:capitalize;"
                >{{ prettyRole(message.role) }}</small>
              </div>
              <span class="message-time">{{ formatTimePH(message.created_at) }}</span>
            </div>
            <p class="message-text">
              {{ message.text }}
            </p>
            <small
              v-if="!isOnline"
              class="text-muted"
            ><i class="bi bi-wifi-off me-1" />View online to open</small>
          </div>
        </div>
      </div>

      <!-- Floating FAQ Chat Head -->
      <FaqPanel
        :is-open="faqOpen"
        :thread="faqThread"
        :faqs="faqs"
        @toggle="toggleFaq"
        @close="faqOpen = false"
        @select-faq="selectFaq"
      />

      <!-- New Chat Modal -->
      <NewChatModal
        :show="showNewModal"
        :mode="newChatMode"
        :staff-options="staffOptions"
        :selected-staff-id="selectedStaffId"
        :message="newMessage"
        :creating="creating"
        @close="closeNewChat"
        @update:mode="newChatMode = $event"
        @update:selected-staff-id="selectedStaffId = $event"
        @update:message="newMessage = $event"
        @create="createConversation"
      />
    </div>
  </ParentLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import ParentLayout from '@/components/layout/mobile/ParentLayout.vue'
import FaqPanel from '@/features/parent/messaging/components/FaqPanel.vue'
import NewChatModal from '@/features/parent/messaging/components/NewChatModal.vue'
import api from '@/services/api'
import { getConversationsOffline } from '@/services/offline/chatOffline'
import { getUserId } from '@/services/auth'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { getFaqs as apiGetFaqs } from '@/services/faqService'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const { isOnline } = useOnlineStatus()
const loading = ref(true)
const messages = ref([])
const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

// New chat state
const showNewModal = ref(false)
const staffOptions = ref([])
const selectedStaffId = ref('')
const newMessage = ref('')
const creating = ref(false)
const newChatMode = ref('team') // 'team' | 'staff'

const startDisabled = computed(() => {
  const msg = (newMessage.value || '').trim()
  const msgOk = msg.length > 0 && msg.length <= 1000
  if (!msgOk || creating.value) return true
  if (newChatMode.value === 'staff') return !selectedStaffId.value
  return false
})

// FAQ assistant (loads FAQs from backend faqs table)
const faqOpen = ref(false)
const faqThread = ref([])
const faqChatBox = ref(null)
const faqs = ref([])

const loadFaqs = async () => {
  try {
    const res = await apiGetFaqs()
    const items = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data) ? res.data : [])
    faqs.value = (items || [])
      .map(f => ({ id: f.faq_id || f.id, q: f.question || f.q || '', a: f.answer || f.a || '' }))
      .filter(f => f.q && f.a)
  } catch (e) {
    console.error('Failed to load FAQs', e)
    faqs.value = []
  }
}

const fetchConversations = async () => {
  try {
    loading.value = true
    const userId = getUserId()
    const { data } = await api.get('/conversations', {
      params: { user_id: userId, limit: 50 }
    })
    const items = data?.items || data?.data || []
    const me = String(getUserId())
    messages.value = items.map(it => {
      const id = it.conversation_id || it.id
      const when = it.latest_message_time || it.last_message_at || it.updated_at || it.created_at
      const txt = it.latest_message || it.last_message || it.last_message_body || it.message_preview || it.message_body || ''
      // Try to get other participant's name from participants array
      let sender = 'Conversation'
      let senderRole = ''
      const list = Array.isArray(it.participants) ? it.participants : []
      const others = list.filter(p => String(p.user_id || p.id) !== me)
      if (others.length) {
        const p = others[0]
        sender = p.fullname || p.full_name || p.participant_name || `${p.firstname || p.first_name || ''} ${p.surname || p.last_name || ''}`.trim() || sender
        // read role from participant if provided
        senderRole = p.role || p.user_role || p.userRole || ''
      } else if (it.subject) {
        sender = it.subject
      }
      return { id, sender, role: senderRole, text: txt, created_at: when, read: it.unread_count !== undefined ? it.unread_count === 0 : !!it.read_at }
    })
  } catch (e) {
    // Offline fallback
    try {
      const items = await getConversationsOffline()
      const me = String(getUserId())
      messages.value = items.map(it => {
        const id = it.conversation_id || it.id
        const when = it.latest_message_time || it.last_message_at || it.updated_at || it.created_at
        const txt = it.latest_message || it.last_message || it.last_message_body || it.message_preview || it.message_body || ''
        let sender = 'Conversation'
        let senderRole = ''
        const list = Array.isArray(it.participants) ? it.participants : []
        const others = list.filter(p => String(p.user_id || p.id) !== me)
        if (others.length) {
          const p = others[0]
          sender = p.fullname || p.full_name || p.participant_name || `${p.firstname || p.first_name || ''} ${p.surname || p.last_name || ''}`.trim() || sender
          senderRole = p.role || p.user_role || p.userRole || ''
        } else if (it.subject) {
          sender = it.subject
        }
        return { id, sender, role: senderRole, text: txt, created_at: when, read: it.unread_count !== undefined ? it.unread_count === 0 : !!it.read_at }
      })
    } catch (_) {
      messages.value = []
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Load conversations
  fetchConversations()
  // If routed with ?faq=1 (or any faq query), open the FAQ assistant automatically
  const faqParam = route.query?.faq
  if (faqParam !== undefined) {
    // Open panel and ensure FAQs are loaded with a greeting
    if (!faqOpen.value) {
      faqOpen.value = true
    }
    if (faqThread.value.length === 0) {
      faqThread.value.push({ id: `greet-${Date.now()}`, role: 'faq', text: 'Hi! I can help with common questions. Pick one below and I’ll show the answer here.', at: new Date().toISOString() })
    }
    if (faqs.value.length === 0) {
      loadFaqs()
    }
  }
})

const openConversation = (msg) => {
  if (!isOnline.value) {
    addToast({ message: 'Messaging is not available offline. Please connect to the internet to view conversations.', type: 'warning' })
    return
  }
  const id = msg?.id
  if (!id) return
  router.push({ name: 'ParentChat', params: { conversationId: id } })
}

const toggleFaq = () => {
  faqOpen.value = !faqOpen.value
  if (faqOpen.value && faqThread.value.length === 0) {
    faqThread.value.push({ id: `greet-${Date.now()}`, role: 'faq', text: 'Hi! I can help with common questions. Pick one below and I’ll show the answer here.', at: new Date().toISOString() })
  }
  if (faqOpen.value && faqs.value.length === 0) {
    // lazy-load FAQs when panel is first opened
    loadFaqs()
  }
}

const selectFaq = (faq) => {
  const now = new Date().toISOString()
  faqThread.value.push({ id: `q-${Date.now()}-${Math.random()}`, role: 'me', text: faq.q, at: now })
  faqThread.value.push({ id: `a-${Date.now()}-${Math.random()}`, role: 'faq', text: faq.a, at: now })
  requestAnimationFrame(() => {
    if (faqChatBox.value) {
      faqChatBox.value.scrollTop = faqChatBox.value.scrollHeight
    }
  })
}

const openNewChat = async () => {
  if (!isOnline.value) {
    addToast({ title: 'Offline', message: 'Cannot start new conversations while offline.', type: 'warning' })
    return
  }
  showNewModal.value = true
  if (staffOptions.value.length === 0) {
    try {
      // Fetch both health staff and admins and combine them so guardians can message either
      const [hwRes, adminRes] = await Promise.all([
        api.get('/users', { params: { role: 'healthworker', limit: 100 } }),
        api.get('/users', { params: { role: 'admin', limit: 100 } })
      ])
      const hwRaw = hwRes?.data?.users || hwRes?.data || []
      const adminRaw = adminRes?.data?.users || adminRes?.data || []
      // Combine and dedupe by id
      const combinedRaw = [...(hwRaw || []), ...(adminRaw || [])]
      const byId = {};
      combinedRaw.forEach(u => {
        const id = u.user_id || u.id || u.__id
        if (!id) return
        if (!byId[id]) byId[id] = u
      })
      const raw = Object.values(byId)
      staffOptions.value = raw.map(u => ({
        __id: u.user_id || u.id || u.__id,
        full_name: u.name || `${u.firstname || u.first_name || ''} ${u.surname || u.last_name || ''}`.trim(),
        hs_type: u.hs_type || u.type || null,
        last_login: u.lastLogin || u.last_login || null,
        role: u.role || null
      })).filter(u => !!u.__id)
    } catch (e) {
      console.error('Failed to load staff list', e)
      addToast({ title: 'Error', message: 'Failed to load staff list', type: 'error' })
    }
  }
}

const closeNewChat = () => {
  showNewModal.value = false
  selectedStaffId.value = ''
  newMessage.value = ''
  newChatMode.value = 'team'
}

const prettyHsType = (t) => ({ nurse: 'Nurse', nutritionist: 'Nutritionist', bhs: 'BHS' }[String(t || '').toLowerCase()] || t || '')

const pickAutoStaffId = () => {
  const list = staffOptions.value || []
  if (!list.length) return ''
  const withScore = list.map(u => ({
    ...u,
    _score: u.last_login ? new Date(u.last_login).getTime() : 0
  }))
  withScore.sort((a, b) => b._score - a._score)
  return withScore[0].__id
}

const createConversation = async () => {
  const msg = (newMessage.value || '').trim()
  if (!msg) return
  if (msg.length > 1000) {
    addToast({ title: 'Warning', message: 'Message too long (max 1000).', type: 'warning' })
    return
  }
  let targetStaffId = selectedStaffId.value
  if (newChatMode.value === 'team') {
    targetStaffId = pickAutoStaffId()
    if (!targetStaffId) {
      addToast({ title: 'Unavailable', message: 'No health staff found to route your message.', type: 'warning' })
      return
    }
  }
  creating.value = true
  try {
    const payload = {
      subject: 'Support',
      participants: [targetStaffId],
      message_content: msg
    }
    const { data } = await api.post('/conversations/start', payload)
    const conv = data?.conversation || data
    closeNewChat()
    await fetchConversations()
    const id = conv?.conversation_id || conv?.id
    if (id) router.push({ name: 'ParentChat', params: { conversationId: id } })
    addToast({ title: 'Sent', message: 'Conversation started.', type: 'success' })
  } catch (e) {
    console.error('Failed to create conversation', e)
    addToast({ title: 'Error', message: 'Failed to start conversation', type: 'error' })
  } finally {
    creating.value = false
  }
}

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

const prettyRole = (r) => {
  if (!r) return ''
  const token = String(r).toLowerCase()
  if (token === 'healthstaff' || token === 'health staff' || token === 'health_staff' || token === 'health-worker' || token === 'healthworker' || token === 'health_worker') return 'Health Staff'
  if (token === 'admin' || token === 'administrator' || token === 'system admin') return 'Admin'
  if (token === 'guardian' || token === 'parent') return 'Parent'
  return r
}

// Philippine time display (UTC+8), aligned with BHS UI conventions
const shiftHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000)

const formatTimePH = (s) => {
  if (!s) return ''
  const dateOrig = new Date(s)
  const date = shiftHours(dateOrig, 8)
  const now = shiftHours(new Date(), 8)
  const diff = now - date

  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) {
    return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 604800000) {
    return date.toLocaleDateString('en-PH', { weekday: 'short' })
  }
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
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

/* FAQ chat head + panel */
.faq-fab {
  position: fixed;
  right: 16px;
  bottom: 90px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #0d6efd;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  z-index: 10;
}
.faq-fab i { font-size: 1.4rem; }

.faq-panel {
  position: fixed;
  right: 16px;
  bottom: 160px;
  width: min(380px, 92vw);
  max-height: 70vh;
  z-index: 11;
  border-radius: 12px;
  overflow: hidden;
}
.avatar-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.faq-chat .message-bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 14px;
  word-wrap: break-word;
}
.faq-chat .bubble-me {
  background: #0d6efd;
  color: #fff;
  border-bottom-right-radius: 4px;
}
.faq-chat .bubble-faq {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  color: #212529;
  border-bottom-left-radius: 4px;
}
.faq-chat .message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
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
