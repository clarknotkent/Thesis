import api from '@/services/api';
import { getUserId } from '@/services/auth';

// Helper to normalize user ID
const getUserKey = (u) => u?.user_id ?? u?.id ?? u?.userId ?? null;

// Helper to shift Date by N hours (PH time UTC+8)
const shiftHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

// Get participant display name
const getParticipantDisplayName = (p) => {
  if (!p) return '';
  return (
    p.participant_name ||
    p.fullname ||
    p.full_name ||
    `${p.firstname || p.first_name || ''} ${p.surname || p.last_name || ''}`.trim() ||
    p.email ||
    ''
  );
};

// Get other participant names
const otherParticipantNames = (conv, currentUserId) => {
  const me = String(currentUserId ?? '');
  const list = Array.isArray(conv?.participants) ? conv.participants : [];
  const others = list.filter(p => String(getUserKey(p)) !== me);
  return others.map(getParticipantDisplayName).filter(Boolean);
};

// Get conversation title
export const getConversationTitle = (conv, currentUserId) => {
  if (!conv) return 'Conversation';

  // Compute based on actual participants excluding current user, and display up to two names + "+N"
  const names = otherParticipantNames(conv, currentUserId);
  if (names.length === 0) {
    // Fallbacks if no participant objects present
    const pn = (conv.participant_name || '').toString().trim();
    if (pn) return pn;
    if ((conv.subject || '').trim()) return conv.subject;
    const viewOther = conv.other_participant_name || conv.other_participants || conv.other_name || '';
    if (typeof viewOther === 'string' && viewOther.trim()) return viewOther.trim();
    if (Array.isArray(conv.other_participant_names) && conv.other_participant_names.length) {
      const joined = conv.other_participant_names.filter(Boolean).join(', ').trim();
      if (joined) return joined;
    }
    return 'Conversation';
  }
  if (names.length === 1) return names[0];
  // Show first two names, then +N for the rest
  const firstTwo = names.slice(0, 2);
  const remaining = names.length - 2;
  return remaining > 0 ? `${firstTwo[0]}, ${firstTwo[1]}, +${remaining}` : `${firstTwo[0]}, ${firstTwo[1]}`;
};

// Load conversations
export const loadConversations = async () => {
  const res = await api.get('/conversations');
  return res.data.items || res.data || [];
};

// Load messages for a conversation
export const loadMessages = async (conversationId) => {
  const res = await api.get(`/messages/${conversationId}`);
  return res.data.items || res.data || [];
};

// Send a message
export const sendMessage = async (conversationId, messageContent) => {
  await api.post('/messages', { 
    conversation_id: conversationId, 
    message_content: messageContent 
  });
};

// Create a new conversation
export const createNewConversation = async (subject, participants, messageContent) => {
  const currentUserId = getUserId();
  const payload = {
    subject: subject || 'New Conversation',
    participants: Array.from(new Set([
      ...participants,
      getUserKey({ user_id: currentUserId })
    ])),
    message_content: messageContent,
    message_type: 'chat'
  };
  
  const res = await api.post('/conversations/start', payload);
  return res.data.conversation || res.data?.conversation || null;
};

// Leave a conversation
export const leaveConversation = async (conversationId) => {
  await api.post(`/conversations/${conversationId}/leave`);
};

// Get participant list string
export const getParticipantList = (conversation) => {
  if (!conversation || !conversation.participants) return '';
  return conversation.participants.map(getParticipantDisplayName).filter(Boolean).join(', ');
};

// Process conversations with titles
export const processConversations = (conversations, currentUserId) => {
  return conversations.map(conv => ({
    ...conv,
    title: getConversationTitle(conv, currentUserId)
  }));
};
