import db from './db-parent-portal'
import api from '@/services/api'

/**
 * Read conversations from Dexie when offline
 */
export async function getConversationsOffline() {
  try {
    console.log('🔍 Querying offline conversations...')
    const rows = await db.conversations.orderBy('updated_at').reverse().toArray()
    console.log(`📦 Found ${rows?.length || 0} conversation rows`)
    if (!rows || rows.length === 0) return []
    // Enrich with last message preview/time from messages table so the list shows something offline
    const enriched = []
    for (const conv of rows) {
      const id = conv.conversation_id || conv.id
      let lastMsg = null
      try {
        const msgs = await db.messages.where('conversation_id').equals(Number(id)).sortBy('created_at')
        if (msgs && msgs.length) lastMsg = msgs[msgs.length - 1]
      } catch (_) {}
      const latest_message_time = lastMsg?.created_at || conv.last_message_at || conv.updated_at || conv.created_at
      const latest_message = lastMsg?.message_content || lastMsg?.content || conv.last_message || conv.message_preview || ''
      enriched.push({
        ...conv,
        latest_message_time,
        latest_message,
      })
    }
    console.log(`✅ Enriched ${enriched.length} conversations with last messages`)
    return enriched
  } catch (error) {
    console.error('❌ Error loading offline conversations:', error)
    return []
  }
}

/**
 * Read messages for a conversation from Dexie when offline
 */
export async function getMessagesOffline(conversationId) {
  try {
    const convId = Number(conversationId)
    console.log(`🔍 Querying offline messages for conversation ${convId}`)
    const rows = await db.messages.where('conversation_id').equals(convId).sortBy('created_at')
    console.log(`📦 Found ${rows?.length || 0} raw message rows`)
    const mapped = (rows || []).map(r => ({
      ...r,
      message_content: r.message_content || r.content,
    }))
    console.log(`📴 Loaded ${mapped.length} messages from offline cache for conversation ${conversationId}`)
    return mapped
  } catch (error) {
    console.error(`❌ Error loading offline messages for conversation ${conversationId}:`, error)
    return []
  }
}

/** Queue a new message while offline */
export async function queueOfflineMessage(conversationId, content, currentUserId) {
  const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const now = new Date().toISOString()
  const pendingRecord = {
    id: tempId,
    conversation_id: Number(conversationId),
    message_content: content,
    created_at: now,
    sender_id: currentUserId,
  }
  // Save to outbox and optimistic insert to messages table
  await db.messages_outbox.add(pendingRecord)
  await db.messages.put({
    message_id: tempId,
    conversation_id: Number(conversationId),
    sender_id: currentUserId,
    content,
    created_at: now,
    pending: true,
  })
  return pendingRecord
}

/** Flush queued messages when online */
export function initializeChatOfflineSync() {
  async function flush() {
    try {
      const queued = await db.messages_outbox.toArray()
      if (!queued || queued.length === 0) return
      for (const item of queued) {
        try {
          await api.post('/messages', {
            conversation_id: item.conversation_id,
            message_content: item.message_content,
          })
          // Remove from outbox and mark message as not pending
          await db.messages_outbox.delete(item.id)
          await db.messages.delete(item.id) // remove temp record
        } catch (_) {
          // keep in outbox if send fails
        }
      }
    } catch (_) {}
  }

  window.addEventListener('online', flush)
  // Attempt one flush on init if we are online
  if (navigator.onLine) {
    flush()
  }
}
