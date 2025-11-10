import supabase from '../db.js';
import { createMessage } from './messageModel.js';

// Normalization functions
const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const toSentenceCase = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Utility: normalize to string UUIDs and sort for stable signatures
const toId = (v) => (v === null || v === undefined ? '' : String(v));
const makeParticipantSignature = (ids = []) => ids.map(toId).sort().join('|');

// Find an active conversation whose ACTIVE participant set exactly equals targetIds
const findActiveConversationByParticipantSet = async (targetIds = []) => {
  const target = Array.from(new Set((targetIds || []).map(toId))).filter(Boolean);
  if (!target.length) return null;

  // 1) find conversations that include ALL target members as active participants
  const { data: rowsWithTarget, error: rowsErr } = await supabase
    .from('conversationparticipants')
    .select('conversation_id, user_id')
    .is('left_at', null)
    .in('user_id', target);
  if (rowsErr) {
    console.warn('[findActiveConversationByParticipantSet] query1 failed:', rowsErr.message);
    return null;
  }
  if (!rowsWithTarget || rowsWithTarget.length === 0) return null;

  // Group by conversation and count how many target ids are present
  const byConv = rowsWithTarget.reduce((acc, r) => {
    const cid = r.conversation_id;
    if (!acc[cid]) acc[cid] = new Set();
    acc[cid].add(toId(r.user_id));
    return acc;
  }, {});

  const candidateConvIds = Object.entries(byConv)
    .filter(([, set]) => set.size === target.length && target.every(t => set.has(t)))
    .map(([cid]) => cid);
  if (!candidateConvIds.length) return null;

  // 2) For these candidates, ensure they have NO extra active participants beyond target
  const { data: activeRows, error: activeErr } = await supabase
    .from('conversationparticipants')
    .select('conversation_id, user_id')
    .is('left_at', null)
    .in('conversation_id', candidateConvIds);
  if (activeErr) {
    console.warn('[findActiveConversationByParticipantSet] query2 failed:', activeErr.message);
    return null;
  }
  const activeByConv = activeRows.reduce((acc, r) => {
    const cid = r.conversation_id;
    if (!acc[cid]) acc[cid] = new Set();
    acc[cid].add(toId(r.user_id));
    return acc;
  }, {});

  const exactMatches = Object.entries(activeByConv)
    .filter(([, set]) => set.size === target.length && target.every(t => set.has(t)))
    .map(([cid]) => cid);
  if (!exactMatches.length) return null;

  // 3) If multiple, pick the one with the most recent activity
  const { data: convRows } = await supabase
    .from('conversations_view')
    .select('conversation_id, latest_message_time, last_message_at, created_at')
    .in('conversation_id', exactMatches);
  if (!Array.isArray(convRows) || convRows.length === 0) return exactMatches[0];
  const pick = convRows.reduce((best, r) => {
    const t = new Date(r.latest_message_time || r.last_message_at || r.created_at || 0).getTime();
    if (!best || t > best.t) return { cid: r.conversation_id, t };
    return best;
  }, null);
  return pick?.cid || exactMatches[0];
};

/**
 * Fetches all conversations for a specific user from the corrected conversations_view_v2.
 * This view provides conversation summaries, including the other participant's name,
 * the last message, and the unread message count.
 *
 * @param {string} userId - The UUID of the user whose conversations are to be fetched.
 * @returns {Promise<Array>} A promise that resolves to an array of conversation objects.
 */
const getConversationsForUser = async (_userId) => {
  // Attempt to order by preferred columns with graceful fallback
  const orderCols = ['latest_message_time', 'last_message_at', 'created_at'];
  let lastErr = null;
  for (const col of orderCols) {
    const { data, error } = await supabase
      .from('conversations_view')
      .select('*')
      .order(col, { ascending: false });
    if (!error) return data || [];
    lastErr = error;
  }
  console.error('Error fetching conversations from view:', lastErr);
  throw new Error(lastErr?.message || 'Failed to fetch conversations');
};

/**
 * Lists all conversations with pagination support.
 * For admin use - shows all conversations in the system.
 *
 * @param {Object} filters - Filter options (user_id, patient_id)
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Number of items per page
 * @returns {Promise<Object>} A promise that resolves to paginated conversation results
 */
const listConversations = async (filters = {}, page = 1, limit = 20) => {
  try {
    // Helper to construct the base query with filters/pagination and an order column
    const buildQuery = async (orderColumn) => {
      let base = supabase
        .from('conversations_view')
        .select('*', { count: 'exact' });

      // Filter by participant membership using the junction table to avoid brittle JSON contains
      if (filters.user_id) {
        const { data: convIdsRows, error: convIdsErr } = await supabase
          .from('conversationparticipants')
          .select('conversation_id')
          .eq('user_id', filters.user_id)
          .is('left_at', null);
        if (convIdsErr) {
          console.error('Error fetching conversation ids for user:', convIdsErr);
          throw new Error(convIdsErr.message);
        }
        const convIds = (convIdsRows || []).map(r => r.conversation_id);
        // If no conversations, short-circuit to empty result
        if (!convIds.length) {
          return { empty: true };
        }
        base = base.in('conversation_id', convIds);
      }

      // NOTE: patient_id is not part of conversations_view; skip or implement via join when needed

      // Pagination
      const offset = (page - 1) * limit;
      base = base.range(offset, offset + limit - 1);

      // Order by the provided column (may not exist in some environments)
      base = base.order(orderColumn, { ascending: false });
      const { data, error, count } = await base;
      return { data, error, count };
    };

    // Try known columns in order of preference
    const orderCandidates = ['last_message_at', 'latest_message_time', 'created_at'];
    let lastErr = null;

    for (const col of orderCandidates) {
      try {
        const result = await buildQuery(col);
        if (result.empty) {
          return { items: [], total: 0, page, limit, totalPages: 0 };
        }
        if (!result.error) {
          const { data, count } = result;

          // Enrich conversations with participants, latest message/time (when missing), and unread counts
          let items = Array.isArray(data) ? [...data] : [];
          const convIds = items.map(i => i.conversation_id || i.id).filter(Boolean);

          if (convIds.length) {
            // 1) Participants (exclude left users)
            const { data: cpRows, error: cpErr } = await supabase
              .from('conversationparticipants')
              .select('conversation_id, user_id, joined_at, left_at')
              .in('conversation_id', convIds)
              .is('left_at', null);
            if (cpErr) {
              console.warn('[listConversations] participants fetch failed:', cpErr.message);
            }

            const userIds = Array.from(new Set((cpRows || []).map(r => r.user_id))).filter(Boolean);
            let usersById = {};
            if (userIds.length) {
              const { data: userRows, error: userErr } = await supabase
                .from('users')
                .select('user_id, firstname, surname, full_name, email, role')
                .in('user_id', userIds);
              if (userErr) {
                console.warn('[listConversations] users fetch failed:', userErr.message);
              } else {
                usersById = (userRows || []).reduce((acc, u) => {
                  acc[u.user_id] = u;
                  return acc;
                }, {});
              }
            }

            const participantsByConv = {};
            for (const r of (cpRows || [])) {
              const u = usersById[r.user_id] || {};
              const p = {
                user_id: r.user_id,
                firstname: u.firstname || null,
                surname: u.surname || null,
                full_name: u.full_name || null,
                email: u.email || null,
                role: u.role || null,
                joined_at: r.joined_at,
              };
              if (!participantsByConv[r.conversation_id]) participantsByConv[r.conversation_id] = [];
              participantsByConv[r.conversation_id].push(p);
            }

            // 2) Unread counts for current user
            const unreadByConv = {};
            if (filters.user_id) {
              const { data: unreadRows, error: unreadErr } = await supabase
                .from('message_receipts')
                .select('message_id')
                .eq('user_id', filters.user_id)
                .is('read_at', null);
              if (!unreadErr && Array.isArray(unreadRows) && unreadRows.length) {
                const messageIds = unreadRows.map(r => r.message_id);
                const { data: mConvRows, error: mConvErr } = await supabase
                  .from('messages')
                  .select('message_id, conversation_id')
                  .in('message_id', messageIds);
                if (!mConvErr) {
                  for (const r of (mConvRows || [])) {
                    unreadByConv[r.conversation_id] = (unreadByConv[r.conversation_id] || 0) + 1;
                  }
                }
              }
            }

            // 3) Fill latest_message and latest_message_time if missing
            for (const it of items) {
              const cid = it.conversation_id || it.id;
              // Attach participants
              const enrichedParts = participantsByConv[cid] || [];
              if (enrichedParts.length) {
                it.participants = enrichedParts;
              } else if (!Array.isArray(it.participants)) {
                it.participants = [];
              }

              // Compute participant_name for UI if not provided by the view
              if (!it.participant_name && Array.isArray(it.participants) && it.participants.length) {
                const me = String(filters.user_id || '');
                const others = it.participants.filter(p => String(p.user_id || '') !== me);
                const nameOf = (p) => p.full_name || [p.firstname || '', p.surname || ''].join(' ').trim() || p.email || '';
                if (others.length === 1) {
                  it.participant_name = nameOf(others[0]) || null;
                } else if (others.length > 1) {
                  const joined = others.map(nameOf).filter(Boolean).slice(0, 3).join(', ');
                  it.participant_name = joined || null;
                }
              }
              // Fallback title: prefer explicit title, then participant_name
              if (!it.title) {
                it.title = it.participant_name || it.title || null;
              }
              // Attach unread count if not present
              if (typeof it.unread_count === 'undefined' || it.unread_count === null) {
                it.unread_count = unreadByConv[cid] || 0;
              }
              // Backfill latest message/time when missing
              const hasTime = it.latest_message_time || it.last_message_at || it.created_at;
              if (!it.latest_message || !it.latest_message_time) {
                const { data: lastMsgRow, error: lastMsgErr } = await supabase
                  .from('messages')
                  .select('message_content, created_at')
                  .eq('conversation_id', cid)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (!lastMsgErr && lastMsgRow) {
                  it.latest_message = it.latest_message || lastMsgRow.message_content || null;
                  it.latest_message_time = it.latest_message_time || lastMsgRow.created_at || hasTime || null;
                }
              }
            }

            // 4) Deduplicate: keep only one conversation per active participant set (including current user)
            if (filters.user_id) {
              const grouped = {};
              for (const it of items) {
                const activeIds = (it.participants || []).map(p => toId(p.user_id));
                const sig = makeParticipantSignature(activeIds);
                const t = new Date(it.latest_message_time || it.last_message_at || it.created_at || 0).getTime();
                if (!grouped[sig] || t > grouped[sig]._t) {
                  grouped[sig] = { ...it, _t: t };
                }
              }
              items = Object.values(grouped).map(({ _t, ...rest }) => rest);
            }
          }

          return {
            items,
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
          };
        }
        lastErr = result.error;
      } catch (e) {
        // buildQuery may throw on invalid columns or other issues; record and try next
        lastErr = e;
      }
    }

    // If all attempts failed, throw the last error
    if (lastErr) {
      console.error('Error fetching conversations:', lastErr);
      throw new Error(lastErr.message || 'Failed to fetch conversations');
    }

    // Fallback empty (should not reach here)
    return { items: [], total: 0, page, limit, totalPages: 0 };
  } catch (error) {
    console.error('Error in listConversations:', error);
    throw error;
  }
};

/**
 * Fetches all messages for a given conversation ID, along with sender details.
 * It also marks the messages as "read" for the specified user.
 *
 * @param {string} conversationId - The UUID of the conversation.
 * @param {string} currentUserId - The UUID of the user reading the messages.
 * @returns {Promise<Array>} A promise that resolves to an array of message objects.
 */
const getMessages = async (conversationId, currentUserId) => {
  // Step 1: Mark messages as read for the current user in this conversation
  const { error: updateError } = await supabase
    .from('message_receipts')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', currentUserId)
    .is('read_at', null)
    .in('message_id', (
      await supabase.from('messages').select('message_id').eq('conversation_id', conversationId)
    ).data.map(m => m.message_id));

  if (updateError) {
    console.error('Error marking messages as read:', updateError);
    // Non-critical error, so we just log it and continue.
  }

  // Step 2: Fetch all messages with sender's full name
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id ( raw_user_meta_data->>full_name )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error(error.message);
  }

  return data.map(m => ({
    ...m,
    sender_name: m.sender?.full_name || 'Unknown User'
  }));
};

// (exports consolidated at bottom)
/**
 * Creates a conversation and adds participants.
 * @param {{ subject?: string|null, created_by: string, participants?: string[] }} payload
 * @returns {Promise<object>} The created conversation row
 */
const createConversation = async ({ subject = null, created_by, participants = [] }) => {
  if (!created_by) throw new Error('created_by is required');

  // Normalize participants: include creator, ensure uniqueness and truthy values
  const allParticipants = Array.from(new Set([...(participants || []), created_by])).filter(Boolean);

  // 1) Create the conversation
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert({ subject: toTitleCase(subject), created_by, updated_by: created_by })
    .select()
    .single();

  if (convErr) {
    console.error('[createConversation] insert conversation failed:', convErr);
    throw new Error(convErr.message || 'Failed to create conversation');
  }

  const conversation_id = conv.conversation_id || conv.id;

  // 2) Add participants
  const nowIso = new Date().toISOString();
  const participantRows = allParticipants.map(user_id => ({
    conversation_id,
    user_id,
    joined_at: nowIso,
    created_by: created_by,
    updated_by: created_by,
  }));
  if (participantRows.length > 0) {
    const { error: partErr } = await supabase
      .from('conversationparticipants')
      .insert(participantRows);
    if (partErr) {
      console.error('[createConversation] insert participants failed:', partErr);
      throw new Error(partErr.message || 'Failed to add conversation participants');
    }
  }

  return conv;
};

/**
 * Starts a conversation and immediately posts the first message.
 * Ensures we don't leave an empty conversation if message creation fails.
 */
const startConversationWithMessage = async ({ subject = null, created_by, participants = [], message_content, message_type = 'chat', attachment_url = null }) => {
  message_type = (message_type || 'chat').toString().toLowerCase();
  if (!['chat', 'system'].includes(message_type)) message_type = 'chat';
  if (!message_content && !attachment_url) {
    throw new Error('message_content or attachment_url is required');
  }

  // Normalize participant set to include creator for matching and creation
  const desiredParticipants = Array.from(new Set([...(participants || []), created_by])).filter(Boolean);

  // 0) Try to find an existing active conversation with the exact same participant set
  let conversation_id = await findActiveConversationByParticipantSet(desiredParticipants);
  let conv = null;
  let createdNew = false;
  if (!conversation_id) {
    // 1) Create conversation and participants
    conv = await createConversation({ subject, created_by, participants });
    conversation_id = conv.conversation_id || conv.id;
    createdNew = true;
  } else {
    // Fetch conversation row for return consistency
    const { data: convRow } = await supabase
      .from('conversations')
      .select('*')
      .eq('conversation_id', conversation_id)
      .maybeSingle();
    conv = convRow || { conversation_id };
  }

  // 2) Create first message; suppress per-message notifications (we'll send one-time conversation notification)
  try {
    const message = await createMessage({
      conversation_id,
      sender_id: created_by,
      message_type,
      message_content: message_content || null,
      attachment_url: attachment_url || null,
      created_at: new Date().toISOString(),
      suppress_notification: true,
    });
    // One-time notifications to other participants
    try {
      const { data: parts, error: pErr } = await supabase
        .from('conversationparticipants')
        .select('user_id')
        .eq('conversation_id', conversation_id)
        .is('left_at', null);
      if (!pErr && Array.isArray(parts) && parts.length) {
        const others = parts.map(p => p.user_id).filter(uid => String(uid) !== String(created_by));
        // fetch sender name for nicer message
        let senderName = 'Someone';
        try {
          const { data: urow } = await supabase
            .from('users')
            .select('firstname, surname, email')
            .eq('user_id', created_by)
            .maybeSingle();
          if (urow) {
            const name = [urow.firstname || '', urow.surname || ''].join(' ').trim();
            senderName = name || urow.email || senderName;
          }
        } catch(_) {}

        for (const uid of others) {
          try {
            await require('./notificationModel').createNotification({
              channel: 'Push',
              recipient_user_id: uid,
              template_code: 'CONVERSATION_STARTED',
              message_body: `${senderName} has sent you a message`,
              related_entity_type: 'conversation',
              related_entity_id: conversation_id,
              scheduled_at: null,
              status: 'pending',
            }, created_by || null);
          } catch (nErr) {
            console.warn('[startConversationWithMessage] initial conversation notification failed for user', uid, nErr?.message || nErr);
          }
        }
      }
    } catch (notifyErr) {
      console.warn('[startConversationWithMessage] notify participants failed:', notifyErr?.message || notifyErr);
    }
    return { conversation: conv, message };
  } catch (e) {
    // Best-effort cleanup to avoid empty conversation
    if (createdNew && conv && conv.conversation_id) {
      try {
        await supabase.from('conversationparticipants').delete().eq('conversation_id', conv.conversation_id);
        await supabase.from('conversations').delete().eq('conversation_id', conv.conversation_id);
      } catch (cleanupErr) {
        console.warn('[startConversationWithMessage] cleanup failed after message error:', cleanupErr?.message || cleanupErr);
      }
    }
    throw e;
  }
};

export { getConversationsForUser, getMessages, listConversations, createConversation, startConversationWithMessage };
