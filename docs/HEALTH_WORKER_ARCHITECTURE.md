# Health Worker Chat & Notifications - System Architecture

## 🏗️ Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Health Worker Frontend                       │
│                                                                   │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │   Notifications.vue  │      │     Messages.vue     │        │
│  │                      │      │                      │        │
│  │  - Filter tabs       │  │  - Conversations     │        │
│  │  - Notification list │  │  - Chat interface    │        │
│  │  - Actions           │  │  - New conversation  │        │
│  │  - Polling (30s)     │  │  - Polling (3s)      │        │
│  └──────────┬───────────┘      └──────────┬───────────┘        │
│             │                              │                     │
│             └──────────────┬───────────────┘                     │
│                            │                                     │
│                   ┌────────▼────────┐                           │
│                   │   api.js        │                           │
│                   │  - notificationAPI                          │
│                   │  - conversationAPI                          │
│                   │  - messageAPI                               │ │
│                   └────────┬────────┘                           │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                        Backend (Node.js)                          │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Notification    │  │ Conversation    │  │   Message       │ │
│  │   Routes        │  │    Routes       │  │   Routes        │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                     │          │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐ │
│  │ Notification    │  │ Conversation    │  │   Message       │ │
│  │  Controller     │  │   Controller    │  │  Controller     │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                     │          │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐ │
│  │ Notification    │  │ Conversation    │  │   Message       │ │
│  │    Model        │  │     Model       │  │    Model        │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                     │          │
│           └────────────────────┼─────────────────────┘          │
│                                │                                 │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
                                 │ SQL
                                 │
┌────────────────────────────────▼─────────────────────────────────┐
│                      Database (PostgreSQL)                        │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  notifications   │  │  conversations   │  │   messages    │ │
│  │                  │  │                  │  │               │ │
│  │ - id             │  │ - id             │  │ - id          │ │
│  │ - user_id        │  │ - subject        │  │ - conv_id     │ │
│  │ - template_code  │  │ - created_by     │  │ - sender_id   │ │
│  │ - message_body   │  │ - created_at     │  │ - content     │ │
│  │ - channel        │  │                  │  │ - created_at  │ │
│  │ - read_at        │  │                  │  │ - read_at     │ │
│  │ - created_at     │  └──────────────────┘  └───────────────┘ │
│  └──────────────────┘  ┌──────────────────┐  ┌───────────────┐ │
│                        │ conversation_    │  │  message_     │ │
│                        │  participants    │  │  receipts     │ │
│                        │                  │  │               │ │
│                        │ - conversation_id│  │ - message_id  │ │
│                        │ - user_id        │  │ - user_id     │ │
│                        │ - joined_at      │  │ - read_at     │ │
│                        │ - left_at        │  │ - delivered_at│ │
│                        └──────────────────┘  └───────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagrams

### Notifications Flow

```
┌──────────────┐
│ User Opens   │
│ Notifications│
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ loadNotifications()      │
│ GET /api/notifications   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Backend fetches from DB  │
│ - Filter by user_id      │
│ - Order by created_at    │
│ - Include read status    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Transform data:          │
│ - Map notification types │
│ - Format timestamps      │
│ - Set read/unread status │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Display in UI:           │
│ - Group by filter        │
│ - Show unread badges     │
│ - Color code by type     │
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Start polling (30s)      │
│ Auto-refresh in bg       │
└──────────────────────────┘

User Actions:
├─ Click notification ──► Mark as read ──► PUT /api/notifications/:id/read
├─ Delete notification ─► Delete ──────► DELETE /api/notifications/:id
├─ Mark all read ───────► Bulk update ─► Multiple PUT requests
└─ Clear all read ──────► Bulk delete ─► Multiple DELETE requests
```

### Messages Flow

```
┌──────────────┐
│ User Opens   │
│   Messages   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ loadConversations()      │
│ GET /api/conversations   │
└────~~