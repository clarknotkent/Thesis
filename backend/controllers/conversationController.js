const { listConversations, createConversation, startConversationWithMessage } = require('../models/conversationModel');
const supabase = require('../db');

const getConversations = async (req, res) => {
  try {
  const { page = 1, limit = 20, patient_id } = req.query;
  // Always use the logged-in user's id for inbox behavior
  const currentUserId = (req.user && (req.user.user_id || req.user.id)) || null;
  if (!currentUserId) return res.status(401).json({ message: 'Unauthorized' });
  const result = await listConversations({ user_id: currentUserId, patient_id }, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

// exports consolidated at bottom

const create = async (req, res) => {
  try {
    const user_id = req.user && (req.user.user_id || req.user.id);
    const { subject = null, participants = [] } = req.body;
    const conv = await createConversation({ subject, created_by: user_id, participants });
    res.status(201).json({ conversation: conv });
  } catch (error) {
    console.error('[createConversation]', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
};

module.exports = { getConversations, create };
// Start conversation and send first message in one request
const startWithMessage = async (req, res) => {
  try {
    const user_id = req.user && (req.user.user_id || req.user.id);
    let { subject = null, participants = [], message_content, message_type = 'chat', attachment_url = null } = req.body;
    message_type = (message_type || 'chat').toString().toLowerCase();
    if (!['chat', 'system'].includes(message_type)) message_type = 'chat';
    if (!message_content && !attachment_url) return res.status(400).json({ message: 'message_content or attachment_url required' });
  const result = await startConversationWithMessage({ subject, created_by: user_id, participants, message_content, message_type, attachment_url });
    res.status(201).json(result);
  } catch (error) {
    console.error('[startWithMessage]', error);
    res.status(500).json({ message: 'Failed to start conversation', error: error.message });
  }
};

module.exports = { getConversations, create, startWithMessage };

// A participant leaves a conversation: set left_at and updated_by
const leaveConversation = async (req, res) => {
  try {
    const conversation_id = req.params.conversation_id;
    const user_id = req.user && (req.user.user_id || req.user.id);
    if (!conversation_id) return res.status(400).json({ message: 'conversation_id required' });
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('conversationparticipants')
      .update({ left_at: nowIso, updated_by: user_id })
      .eq('conversation_id', conversation_id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('[leaveConversation] update failed', error);
      return res.status(500).json({ message: 'Failed to leave conversation' });
    }

    res.json({ participant: data });
  } catch (error) {
    console.error('[leaveConversation] error', error);
    res.status(500).json({ message: 'Failed to leave conversation' });
  }
};

module.exports = { getConversations, create, startWithMessage, leaveConversation };
