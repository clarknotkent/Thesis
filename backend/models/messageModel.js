import supabase from '../db.js';
import * as notificationModel from './notificationModel.js';

// Feature flag: control whether creating a chat message also creates an in-app notification
// Default is OFF; set NOTIFY_ON_NEW_MESSAGE=true to enable per-message notifications
const SHOULD_NOTIFY_NEW_MESSAGE = String(process.env.NOTIFY_ON_NEW_MESSAGE ?? 'false').toLowerCase() === 'true';

const createMessage = async (payload) => {
  // Remove fields that are not actual columns on public.messages to avoid PostgREST PGRST204 errors
  const { suppress_notification: suppressNotification, ...messagePayload } = payload || {};

  const withAudit = {
    ...messagePayload,
    created_by: messagePayload.sender_id || messagePayload.created_by || null,
    updated_by: messagePayload.sender_id || messagePayload.updated_by || null,
  };

  const { data, error } = await supabase.from('messages').insert(withAudit).select().single();
  if (error) throw error;

  // create receipts for conversation participants (mark delivered_at null for now)
  try {
    const convId = data.conversation_id;
    const { data: parts, error: pErr } = await supabase
      .from('conversationparticipants')
      .select('user_id')
      .eq('conversation_id', convId)
      .is('left_at', null);
    if (!pErr && parts && parts.length > 0) {
      const receipts = parts.filter(p => p.user_id !== payload.sender_id).map(p => ({ message_id: data.message_id, user_id: p.user_id, delivered_at: null, read_at: null }));
      if (receipts.length > 0) {
        await supabase.from('message_receipts').insert(receipts);
        // Optionally insert notifications for recipients (use model to normalize channel & enforce constraint)
        if (SHOULD_NOTIFY_NEW_MESSAGE && !suppressNotification) {
          for (const r of receipts) {
            try {
              await notificationModel.createNotification({
                channel: 'Push',
                recipient_user_id: r.user_id,
                template_code: 'NEW_MESSAGE',
                message_body: payload.message_content || 'You have a new message',
                related_entity_type: 'conversation',
                related_entity_id: convId,
                scheduled_at: null,
                status: 'pending',
              }, payload.sender_id || null);
            } catch (nErr) {
              console.warn('[createMessage] notification insert failed for user', r.user_id, nErr?.message || nErr);
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[createMessage] failed to create receipts/notifications', e.message || e);
  }

  return data;
};

const listMessagesByConversation = async (conversation_id, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
};

const markMessageRead = async (message_id, user_id, read_at = new Date().toISOString()) => {
  const nowIso = new Date().toISOString();
  // 1) Mark delivered_at if still null for this receipt
  try {
    await supabase
      .from('message_receipts')
      .update({ delivered_at: nowIso })
      .eq('message_id', message_id)
      .eq('user_id', user_id)
      .is('delivered_at', null);
  } catch (_) {}

  // 2) Mark read_at for this receipt
  const { data: receipt, error: rErr } = await supabase
    .from('message_receipts')
    .update({ read_at })
    .eq('message_id', message_id)
    .eq('user_id', user_id)
    .select()
    .single();

  if (rErr) {
    // Fallback: set message-level read_at as a legacy indicator
    const { data: msg, error: mErr } = await supabase
      .from('messages')
      .update({ read_at })
      .eq('message_id', message_id)
      .select()
      .single();
    if (mErr) throw mErr;
    return msg;
  }

  // 3) If all receipts are read, set message-level read_at
  try {
    const { data: pending, error: pErr } = await supabase
      .from('message_receipts')
      .select('receipt_id')
      .eq('message_id', message_id)
      .is('read_at', null)
      .limit(1);
    if (!pErr && (!pending || pending.length === 0)) {
      await supabase
        .from('messages')
        .update({ read_at })
        .eq('message_id', message_id);
    }
  } catch (_) {}

  return receipt;
};

export { createMessage, listMessagesByConversation, markMessageRead };
