# Health Worker Features - Quick Reference Guide

## 🔔 Notifications Page

### Access
- **Route**: `/healthworker/notifications`
- **Menu**: Click bell icon in health worker layout

### Features at a Glance

#### View Filters
```
┌─────────────────────────────────────┐
│  All (25)  │ Unread (5) │ Read (20) │
└─────────────────────────────────────┘
```

#### Quick Actions
- 🔄 **Refresh** - Reload notifications manually
- ✅ **Mark All Read** - Clear all unread badges
- 🗑️ **Clear Read** - Remove all read notifications

#### Notification Types
| Icon | Type | Color | Example |
|------|------|-------|---------|
| ⚠️ | Urgent | Red | Overdue vaccination, Low stock |
| ⏰ | Reminder | Yellow | 7-day reminder, Due today |
| ✅ | Appointment | Green | Vaccination confirmed |
| ⚙️ | System | Gray | Role change, Password reset |

#### User Actions
- **Click notification** → Mark as read (+ navigate if conversation)
- **Click X button** → Delete notification
- **Auto-refresh** → Every 30 seconds

---

## 💬 Messages/Chat Page

### Access
- **Route**: `/healthworker/messages`
- **Menu**: Click message icon in health worker layout

### Two Views

#### 1. Conversations List View
```
┌──────────────────────────────────┐
│  🔍 Search conversations...      │
├──────────────────────────────────┤
│  👤 Dr. Martinez          2m ago │
│  📝 Need to discuss...         3 │ ← Unread count
├──────────────────────────────────┤
│  👤 Admin Office          1h ago │
│  📝 Inventory update...          │
└──────────────────────────────────┘
```

**Features**:
- Search by participant name or message
- See unread counts
- Preview latest message
- Timestamps (relative: "2 min ago")

#### 2. Chat View
```
┌──────────────────────────────────┐
│  ← Dr. Martinez                  │
├──────────────────────────────────┤
│                                  │
│     ┌──────────────────┐         │
│     │ Hello doctor     │ (them) │
│     └──────────────────┘         │
│                                  │
│         ┌──────────────────┐     │
│  (you)  │ Hi! How can I    │     │
│         │ help you?        │     │
│         └──────────────────┘     │
│                                  │
├──────────────────────────────────┤
│  Type message...           [📤]  │
└──────────────────────────────────┘
```

**Features**:
- Real-time message updates (3s polling)
- Bubble-style chat interface
- Your messages (blue, right-aligned)
- Their messages (white, left-aligned)
- Auto-scroll to bottom
- Enter to send

### Creating New Conversation

1. Click **"New"** button
2. Select recipient from dropdown
3. (Optional) Add subject
4. Type first message
5. Click **"Send"**

```
┌─────────────────────────────────┐
│  New Conversation          ✕    │
├─────────────────────────────────┤
│  Recipient: [Dr. Martinez ▼]    │
│  Subject:   [Optional...]        │
│  Message:   [Type here...]       │
│             [                 ]  │
│                                  │
│         [Cancel]  [📤 Send]      │
└─────────────────────────────────┘
```

---

## 🔑 Quick Tips

### Notifications
- ✨ Yellow dot = unread
- ✨ Click to auto-mark as read
- ✨ Conversation notifications navigate to chat
- ✨ Filters show count in real-time
- ✨ Auto-refreshes in background

### Messages
- ✨ Press Enter to send quickly
- ✨ Back button returns to list
- ✨ Search works on names & messages
- ✨ Messages auto-update while viewing
- ✨ Unread badges show new messages

---

## 📱 Mobile Optimizations

- Touch-friendly buttons (larger tap targets)
- Responsive layout (stacks on mobile)
- Optimized spacing and fonts
- Swipe-friendly scrolling
- Modal dialogs fit small screens

---

## 🎨 Visual Indicators

### Notification States
| State | Indicator |
|-------|-----------|
| Unread | Yellow background + dot |
| Read | White background |
| Urgent | Red icon |
| Recent | "2 min ago" |

### Message States
| State | Indicator |
|-------|-----------|
| Unread conversation | Blue badge with count |
| Your message | Blue bubble, right side |
| Their message | White bubble, left side |
| Sending | Hourglass icon |

---

## ⚡ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Send message | Enter |
| New line in message | Shift + Enter |
| Back to conversations | Esc (browser default) |

---

## 🔧 Troubleshooting

### Notifications not updating?
- Check internet connection
- Click refresh button
- Page auto-refreshes every 30s

### Messages not sending?
- Ensure message is not empty
- Check internet connection
- Try refreshing page

### Can't see new messages?
- Messages auto-update every 3s
- Scroll to bottom of chat
- Check if you're in the right conversation

### Empty state showing?
- For notifications: No notifications yet
- For messages: Start a new conversation
- Both update in real-time when data arrives

---

## 🎯 Best Practices

1. **Check notifications regularly** - Don't miss urgent updates
2. **Mark as read** - Keep inbox organized
3. **Use search** - Find conversations quickly
4. **Delete old notifications** - Clear read ones periodically
5. **Respond promptly** - Patients and staff are waiting

---

## 📊 At a Glance

| Feature | Route | Polling | Actions |
|---------|-------|---------|---------|
| Notifications | `/healthworker/notifications` | 30s | View, Read, Delete, Filter |
| Messages | `/healthworker/messages` | 3s | View, Send, Search, Create |

---

## 🎉 You're All Set!

Both notification and chat systems are fully integrated with:
- Real-time updates
- Mobile-friendly design
- Intuitive interface
- Complete functionality

Navigate to the features and start communicating! 🚀
