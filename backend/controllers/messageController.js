import { createMessage, listMessagesByConversation, markMessageRead } from '../models/messageModel.js';
import { ACTIVITY } from '../constants/activityTypes.js';
import { logActivity } from '../models/activityLogger.js';

import supabase from '../db.js';
const sendMessage = async (req, res) => {
  try {
    const sender_id = req.user && (req.user.user_id || req.user.id);
    const { conversation_id, message_content, attachment_url } = req.body;
    let message_type = (req.body.message_type || 'chat').toString().toLowerCase();
    // Normalize and validate message_type to match DB enum/check
    message_type = (message_type || 'chat').toString().toLowerCase();
    if (!['chat', 'system'].includes(message_type)) message_type = 'chat';
    if (!conversation_id || (!message_content && !attachment_url)) return res.status(400).json({ message: 'conversation_id and message_content or attachment_url required' });

    const payload = {
      conversation_id,
      sender_id,
      message_type,
      message_content: message_content || null,
      attachment_url: attachment_url || null,
      created_at: new Date().toISOString()
    };

    const message = await createMessage(payload);
    // Log activity (best-effort)
    try { await logActivity({ action_type: ACTIVITY.MESSAGE.SEND, user_id: sender_id, entity_type: 'message', entity_id: message.message_id, new_value: message }); } catch (_) {}

    res.status(201).json({ message });
  } catch (error) {
    console.error('[sendMessage]', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const user_id = req.user && (req.user.user_id || req.user.id);
    if (!conversation_id) return res.status(400).json({ message: 'conversation_id required' });
    // Non-critical: mark delivered for this user's receipts in this conversation
    try {
      if (user_id) {
        const nowIso = new Date().toISOString();
        const { data: msgIds } = await supabase
          .from('messages')
          .select('message_id')
          .eq('conversation_id', conversation_id);
        const ids = (msgIds || []).map(m => m.message_id);
        if (ids.length) {
          await supabase
            .from('message_receipts')
            .update({ delivered_at: nowIso })
            .eq('user_id', user_id)
            .is('delivered_at', null)
            .in('message_id', ids);

          // If all receipts are delivered for a message, set messages.delivered_at once
          try {
            // Get messages that still have at least one undelivered receipt
            const { data: undeliveredRows } = await supabase
              .from('message_receipts')
              .select('message_id')
              .in('message_id', ids)
              .is('delivered_at', null);
            const undeliveredSet = new Set((undeliveredRows || []).map(r => r.message_id));
            const fullyDelivered = ids.filter(id => !undeliveredSet.has(id));
            if (fullyDelivered.length) {
              await supabase
                .from('messages')
                .update({ delivered_at: nowIso })
                .in('message_id', fullyDelivered)
                .is('delivered_at', null);
            }
          } catch (_) {}

          // Additionally: mark read for this user's receipts in this conversation when fetching
          try {
            // Only receipts for this user that are still unread
            const { data: unreadRows } = await supabase
              .from('message_receipts')
              .select('message_id')
              .eq('user_id', user_id)
              .is('read_at', null)
              .in('message_id', ids);
            const unreadIds = (unreadRows || []).map(r => r.message_id);
            if (unreadIds.length) {
              // Mark user's receipts as read now
              await supabase
                .from('message_receipts')
                .update({ read_at: nowIso, delivered_at: nowIso })
                .eq('user_id', user_id)
                .in('message_id', unreadIds);

              // For any messages where all receipts are now read, set messages.read_at
              try {
                // Find messages that still have at least one unread receipt
                const { data: stillUnread } = await supabase
                  .from('message_receipts')
                  .select('message_id')
                  .in('message_id', unreadIds)
                  .is('read_at', null);
                const stillUnreadSet = new Set((stillUnread || []).map(r => r.message_id));
                const fullyRead = unreadIds.filter(id => !stillUnreadSet.has(id));
                if (fullyRead.length) {
                  await supabase
                    .from('messages')
                    .update({ read_at: nowIso })
                    .in('message_id', fullyRead)
                    .is('read_at', null);
                }
              } catch (_) {}
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
    const items = await listMessagesByConversation(conversation_id, parseInt(page), parseInt(limit));
    res.json({ items, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('[getMessages]', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

const markRead = async (req, res) => {
  try {
    const { message_id } = req.params;
    const user_id = req.user && (req.user.user_id || req.user.id);
    if (!message_id) return res.status(400).json({ message: 'message_id required' });
    const updated = await markMessageRead(message_id, user_id);
    res.json({ message: updated });
  } catch (error) {
    console.error('[markRead]', error);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

export { sendMessage, getMessages, markRead };
