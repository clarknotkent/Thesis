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
  
  // Prefer participant_name from backend
  if (typeof conv.participant_name === 'string' && conv.participant_name.trim()) {
    const pn = conv.participant_name.trim();
    
    // Check if participant_name is current user's name
    let myName = '';
    if (Array.isArray(conv.participants)) {
      const myId = String(getUserKey({ user_id: currentUserId, id: currentUserId }));
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
  
  // Backend-provided other participant name fields
  const viewOther = conv.other_participant_name || conv.other_participants || conv.other_name || '';
  if (typeof viewOther === 'string' && viewOther.trim()) return viewOther.trim();
  
  if (Array.isArray(conv.other_participant_names) && conv.other_participant_names.length) {
    const joined = conv.other_participant_names.filter(Boolean).join(', ').trim();
    if (joined) return joined;
  }
  
  const names = otherParticipantNames(conv, currentUserId);
  if (names.length === 1) return names[0];
  if (names.length > 1) return names.slice(0, 3).join(', ') + (names.length > 3 ? '…' : '');
  
  return 'Conversation';
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
