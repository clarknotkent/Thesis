<template>
  <AdminLayout>
    <div class="container-fluid">
      <!-- Breadcrumb -->
      <nav
        aria-label="breadcrumb"
        class="mb-3"
      >
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/admin/dashboard">
              Admin
            </router-link>
          </li>
          <li
            class="breadcrumb-item active"
            aria-current="page"
          >
            Notifications
          </li>
        </ol>
      </nav>

      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-bell me-2" />Notifications Inbox
          </h1>
          <p class="text-muted mb-0">
            View and manage your notifications
            <span
              v-if="isOffline"
              class="badge bg-warning text-dark ms-2"
            >
              <i class="bi bi-wifi-off me-1" />Offline Mode
            </span>
          </p>
        </div>
        <router-link
          v-if="!isOffline"
          to="/admin/add-notifications"
          class="btn btn-primary"
        >
          <i class="bi bi-plus-circle me-2" />Create Notification
        </router-link>
        <button
          v-else
          class="btn btn-primary disabled"
          @click="showOfflineToast"
        >
          <i class="bi bi-plus-circle me-2" />Create Notification
        </button>
      </div>

      <!-- Compact Toolbar -->
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <ul class="nav nav-pills small">
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: !filters.channel, disabled: isOffline }"
              :disabled="isOffline"
              @click="isOffline ? showOfflineToast() : onChannelTab('')"
            >
              <i class="bi bi-ui-checks-grid me-1" />All
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: filters.channel==='in-app', disabled: isOffline }"
              :disabled="isOffline"
              @click="isOffline ? showOfflineToast() : onChannelTab('in-app')"
            >
              <i class="bi bi-bell-fill me-1" />In‑App
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: filters.channel==='email', disabled: isOffline }"
              :disabled="isOffline"
              @click="isOffline ? showOfflineToast() : onChannelTab('email')"
            >
              <i class="bi bi-envelope-fill me-1" />Email
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: filters.channel==='sms', disabled: isOffline }"
              :disabled="isOffline"
              @click="isOffline ? showOfflineToast() : onChannelTab('sms')"
            >
              <i class="bi bi-chat-dots-fill me-1" />SMS
            </button>
          </li>
        </ul>
        <div class="d-flex align-items-center gap-3 ms-auto">
          <div class="form-check form-switch m-0">
            <input
              id="unreadOnly"
              v-model="filters.unreadOnly"
              class="form-check-input"
              type="checkbox"
              @change="loadNotifications"
            >
            <label
              class="form-check-label small"
              for="unreadOnly"
            >Unread only</label>
          </div>
          <input
            v-model="filters.search"
            class="form-control form-control-sm"
            style="min-width: 240px;"
            :disabled="isOffline"
            placeholder="Search notifications..."
            @input="isOffline ? null : debouncedSearch"
          >
          <button
            class="btn btn-sm btn-outline-secondary"
            :disabled="!hasUnreadVisible || isOffline"
            @click="isOffline ? showOfflineToast() : markAllVisibleAsRead()"
          >
            <i class="bi bi-check2-all me-1" />Mark all read
          </button>
        </div>
      </div>

      <!-- Loading -->
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

      <!-- Notifications List (Grouped) -->
      <div
        v-else-if="notifications.length > 0"
        class="row"
      >
        <div class="col-12">
          <div class="card shadow">
            <div class="card-body p-0">
              <div
                v-for="section in groupedNotifications"
                :key="section.label"
              >
                <div class="section-header small text-uppercase text-muted px-3 py-2">
                  {{ section.label }}
                </div>
                <div
                  v-for="n in section.items"
                  :key="n.notification_id"
                  class="notification-item d-flex align-items-start px-3 py-3"
                  :class="{ unread: !n.read_at }"
                >
                  <div
                    class="avatar me-3"
                    :class="avatarClass(n)"
                  >
                    <i :class="channelIcon(n.channel)" />
                  </div>
                  <div class="flex-grow-1 min-w-0">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                      <div class="text-truncate fw-semibold">
                        {{ n.created_by_name || senderLabel(n) }}
                        <span class="text-muted">• {{ channelLabel(n.channel) }}</span>
                      </div>
                      <small class="text-muted flex-shrink-0 ms-2">{{ timeAgo(n.created_at) }}</small>
                    </div>
                    <div class="text-truncate-2 mb-1">
                      {{ n.message_body }}
                    </div>
                    <div class="small text-muted d-flex align-items-center gap-3">
                      <span>Template: {{ n.template_code || 'Custom' }}</span>
                      <span v-if="n.related_entity_type">Related: {{ n.related_entity_type }}</span>
                    </div>
                    <div class="mt-2 d-flex align-items-center gap-3">
                      <button
                        v-if="n.related_entity_type && n.related_entity_id"
                        class="btn btn-link btn-sm p-0"
                        :class="{ disabled: isOffline }"
                        @click="isOffline ? showOfflineToast() : openRelated(n)"
                      >
                        View
                      </button>
                      <button
                        class="btn btn-link btn-sm p-0"
                        :class="{ disabled: isOffline }"
                        @click="isOffline ? showOfflineToast() : openDetails(n)"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                  <div class="ms-3 d-flex flex-column align-items-end gap-2">
                    <button
                      v-if="!n.read_at"
                      class="btn btn-sm btn-outline-primary"
                      :disabled="isOffline"
                      @click="isOffline ? showOfflineToast() : markAsRead(n.notification_id)"
                    >
                      <i class="bi bi-check2 me-1" />Mark read
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      :disabled="isOffline"
                      @click="isOffline ? showOfflineToast() : deleteNotification(n.notification_id)"
                    >
                      <i class="bi bi-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="text-center py-5"
      >
        <div class="mb-4">
          <i
            class="bi bi-bell-slash text-muted"
            style="font-size: 4rem;"
          />
        </div>
        <h5 class="text-muted">
          No notifications found
        </h5>
        <p class="text-muted">
          You don't have any notifications matching your filters.
        </p>
      </div>

      <!-- Pagination -->
      <div
        v-if="notifications.length > 0"
        class="d-flex justify-content-center mt-4"
      >
        <nav>
          <ul class="pagination">
            <li
              class="page-item"
              :class="{ disabled: currentPage === 1 || isOffline }"
            >
              <button
                class="page-link"
                :disabled="currentPage === 1 || isOffline"
                @click="isOffline ? showOfflineToast() : changePage(currentPage - 1)"
              >
                Previous
              </button>
            </li>
            <li
              v-for="page in visiblePages"
              :key="page"
              class="page-item"
              :class="{ active: page === currentPage, disabled: isOffline }"
            >
              <button
                class="page-link"
                :disabled="isOffline"
                @click="isOffline ? showOfflineToast() : changePage(page)"
              >
                {{ page }}
              </button>
            </li>
            <li
              class="page-item"
              :class="{ disabled: currentPage === totalPages || isOffline }"
            >
              <button
                class="page-link"
                :disabled="currentPage === totalPages || isOffline"
                @click="isOffline ? showOfflineToast() : changePage(currentPage + 1)"
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </AdminLayout>
  
  <!-- Details Modal -->
  <div
    v-if="showDetails && selectedNotification"
    class="modal-backdrop-custom"
  >
    <div class="modal-custom card shadow">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="m-0">
          Notification Details
        </h6>
        <button
          class="btn btn-sm btn-outline-secondary"
          @click="closeDetails"
        >
          Close
        </button>
      </div>
      <div class="card-body">
        <div class="mb-2">
          <strong>Message:</strong><br>{{ selectedNotification.message_body }}
        </div>
        <div class="row g-3">
          <div class="col-md-6">
            <strong>Channel:</strong> {{ selectedNotification.channel }}
          </div>
          <div class="col-md-6">
            <strong>Status:</strong> {{ selectedNotification.status }}
          </div>
          <div class="col-md-6">
            <strong>Sender:</strong> {{ selectedNotification.created_by_name || senderLabel(selectedNotification) }}
          </div>
          <div class="col-md-6">
            <strong>Recipient:</strong> {{ selectedNotification.recipient_name || selectedNotification.recipient_user_id }}
          </div>
          <div class="col-md-6">
            <strong>Template:</strong> {{ selectedNotification.template_code || 'Custom' }}
          </div>
          <div
            v-if="selectedNotification.related_entity_type"
            class="col-md-6"
          >
            <strong>Related:</strong> {{ selectedNotification.related_entity_type }} #{{ selectedNotification.related_entity_id }}
          </div>
        </div>
        <hr>
        <div class="row g-3 small text-muted">
          <div class="col-md-6">
            <strong>Created:</strong> {{ formatDate(selectedNotification.created_at) }}
          </div>
          <div class="col-md-6">
            <strong>Scheduled:</strong> {{ formatDate(selectedNotification.scheduled_at) }}
          </div>
          <div class="col-md-6">
            <strong>Sent:</strong> {{ formatDate(selectedNotification.sent_at) }}
          </div>
          <div class="col-md-6">
            <strong>Read:</strong> {{ formatDate(selectedNotification.read_at) }}
          </div>
          <div class="col-md-6">
            <strong>Updated:</strong> {{ formatDate(selectedNotification.updated_at) }}
          </div>
          <div
            v-if="selectedNotification.error_message"
            class="col-md-6"
          >
            <strong>Error:</strong> {{ selectedNotification.error_message }}
          </div>
        </div>
        <hr>
        <details>
          <summary>Raw JSON</summary>
          <pre class="mt-2 small">{{ formatJSON(selectedNotification) }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script>
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import { notificationAPI } from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useOfflineAdmin } from '@/composables/useOfflineAdmin'

export default {
  name: 'NotificationsInbox',
  components: {
    AdminLayout
  },
  setup() {
    const { addToast } = useToast()
    const { isOffline } = useOfflineAdmin()
    return { addToast, isOffline }
  },
  data() {
    return {
      loading: false,
      notifications: [],
      filters: {
        status: '',
        channel: '',
        unreadOnly: false,
        search: ''
      },
      currentPage: 1,
      totalPages: 1,
      debounceTimer: null,
      showDetails: false,
      selectedNotification: null
    }
  },
  computed: {
    visiblePages() {
      const pages = []
      const start = Math.max(1, this.currentPage - 2)
      const end = Math.min(this.totalPages, this.currentPage + 2)
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    },
    hasUnreadVisible() {
      return (this.notifications || []).some(n => !n.read_at)
    },
    groupedNotifications() {
      const groups = {}
      const arr = this.notifications || []
      for (const n of arr) {
        const key = this.phDateKey(n.created_at)
        if (!groups[key]) groups[key] = []
        groups[key].push(n)
      }
      const todayKey = this.phDateKey(new Date().toISOString())
      const yKey = this.phDateKey(this.addDays(new Date(), -1).toISOString())
      const labels = Object.keys(groups).sort((a,b)=> b.localeCompare(a)).map(k => {
        let label
        if (k === todayKey) label = 'Today'
        else if (k === yKey) label = 'Yesterday'
        else label = this.formatDate(k + 'T00:00:00Z')
        return { label, items: groups[k].sort((a,b)=> new Date(b.created_at) - new Date(a.created_at)) }
      })
      return labels
    }
  },
  async mounted() {
    await this.loadNotifications()
  },
  methods: {
    showOfflineToast() {
      this.addToast({
        title: 'Offline Mode',
        message: 'Notifications management is not available while offline',
        type: 'warning'
      })
    },
    onChannelTab(ch) {
      this.filters.channel = ch
      this.currentPage = 1
      this.loadNotifications()
    },
    markAllVisibleAsRead: async function() {
      const unread = (this.notifications || []).filter(n => !n.read_at)
      if (!unread.length) return
      await Promise.allSettled(unread.map(n => notificationAPI.markAsRead(n.notification_id)))
      await this.loadNotifications()
      this.addToast({ title: 'Done', message: 'All visible notifications marked as read', type: 'success' })
    },
    openDetails(n) {
      this.selectedNotification = n
      this.showDetails = true
    },
    closeDetails() {
      this.showDetails = false
      this.selectedNotification = null
    },
    openRelated(n) {
      const type = (n.related_entity_type || '').toLowerCase().trim()
      const id = n.related_entity_id
      if (!type || !id) return
      // Route mapping by type
      if (type === 'conversation') {
        this.$router.push({ name: 'AdminChat', query: { conversation_id: id } })
        return
      }
      // Add additional mappings as needed
      // e.g., patient -> { name: 'ViewPatient', params: { id } }
    },
    async loadNotifications() {
      this.loading = true
      try {
        const params = {
          ...this.filters,
          limit: 20,
          offset: (this.currentPage - 1) * 20
        }
        const response = await notificationAPI.getMyNotifications(params)
        this.notifications = response.data.data || []
        // For pagination, we'd need total count from API
        this.totalPages = Math.ceil((response.data.meta?.totalCount || this.notifications.length) / 20)
      } catch (error) {
        console.error('Failed to load notifications:', error)
        this.addToast({ title: 'Error', message: 'Failed to load notifications', type: 'error' })
      } finally {
        this.loading = false
      }
    },

    debouncedSearch() {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.currentPage = 1
        this.loadNotifications()
      }, 500)
    },

    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        this.loadNotifications()
      }
    },

    async markAsRead(notificationId) {
      try {
        await notificationAPI.markAsRead(notificationId)
        await this.loadNotifications() // Refresh list
        this.addToast({ title: 'Success', message: 'Notification marked as read', type: 'success' })
      } catch (error) {
        console.error('Failed to mark as read:', error)
        this.addToast({ title: 'Error', message: 'Failed to mark notification as read', type: 'error' })
      }
    },

    async deleteNotification(notificationId) {
      if (!confirm('Are you sure you want to delete this notification?')) return

      try {
        await notificationAPI.delete(notificationId)
        await this.loadNotifications() // Refresh list
        this.addToast({ title: 'Success', message: 'Notification deleted', type: 'success' })
      } catch (error) {
        console.error('Failed to delete notification:', error)
        this.addToast({ title: 'Error', message: 'Failed to delete notification', type: 'error' })
      }
    },

    getStatusBadgeClass(status) {
      switch (status) {
        case 'sent': return 'bg-success'
        case 'pending': return 'bg-warning'
        case 'failed': return 'bg-danger'
        default: return 'bg-secondary'
      }
    },

    getChannelBadgeClass(channel) {
      switch (channel) {
        case 'in-app': return 'bg-primary'
        case 'email': return 'bg-info'
        case 'sms': return 'bg-success'
        default: return 'bg-secondary'
      }
    },
    channelIcon(channel) {
      switch ((channel || '').toLowerCase()) {
        case 'in-app':
        case 'push': return 'bi bi-bell-fill'
        case 'email': return 'bi bi-envelope-fill'
        case 'sms': return 'bi bi-chat-dots-fill'
        default: return 'bi bi-bell'
      }
    },
    channelLabel(channel) {
      const c = (channel || '').toLowerCase()
      if (c === 'in-app' || c === 'push') return 'In‑App'
      if (c === 'email') return 'Email'
      if (c === 'sms') return 'SMS'
      return channel || 'Unknown'
    },

    formatDate(dateString) {
      if (!dateString) return ''
      try {
        // Treat timestamps without timezone as UTC to avoid local-time misinterpretation
        let s = dateString
        if (typeof s === 'string') {
          const tzPattern = /([zZ]|[+-]\d{2}:?\d{2})$/
          const hasTime = /T\d{2}:\d{2}:\d{2}/.test(s)
          if (hasTime && !tzPattern.test(s)) {
            s = s + 'Z'
          }
        }
        const d = new Date(s)
        return new Intl.DateTimeFormat(undefined, {
          year: 'numeric', month: 'short', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: true, timeZone: 'Asia/Manila'
        }).format(d)
      } catch(_) {
        return String(dateString)
      }
    },
    timeAgo(dateString) {
      if (!dateString) return ''
      try {
        let s = dateString
        if (typeof s === 'string' && /T\d{2}:\d{2}:\d{2}/.test(s) && !/([zZ]|[+-]\d{2}:?\d{2})$/.test(s)) s = s + 'Z'
        const d = new Date(s)
        const now = new Date()
        const diff = (d.getTime() - now.getTime()) / 1000
        const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
        const ranges = [
          ['year', 60*60*24*365],
          ['month', 60*60*24*30],
          ['day', 60*60*24],
          ['hour', 60*60],
          ['minute', 60],
          ['second', 1]
        ]
        for (const [unit, seconds] of ranges) {
          const value = Math.round(diff / seconds)
          if (Math.abs(value) >= 1) return rtf.format(value, unit)
        }
        return 'just now'
      } catch(_) { return this.formatDate(dateString) }
    },
    phDateKey(dateString) {
      // Normalize to Manila calendar date key YYYY-MM-DD
      try {
        let s = dateString
        if (typeof s === 'string' && /T\d{2}:\d{2}:\d{2}/.test(s) && !/([zZ]|[+-]\d{2}:?\d{2})$/.test(s)) s = s + 'Z'
        const d = new Date(s)
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
        return parts // already YYYY-MM-DD
      } catch(_) { return String(dateString).slice(0,10) }
    },
    addDays(date, days) {
      const d = new Date(date)
      d.setDate(d.getDate() + days)
      return d
    },
    avatarClass(n) {
      const ch = (n.channel || '').toLowerCase()
      if (ch === 'in-app' || ch === 'push') return 'avatar-inapp'
      if (ch === 'email') return 'avatar-email'
      if (ch === 'sms') return 'avatar-sms'
      return 'avatar-default'
    },

    senderLabel(notification) {
      // Interpret null created_by as System; otherwise show "User #<id>" for now.
      // If backend later enriches with created_by_name, we can display that here.
      const cid = notification.created_by
      if (cid === null || typeof cid === 'undefined') return 'System'
      return `User #${cid}`
    },

    formatJSON(obj) {
      try { return JSON.stringify(obj, null, 2) } catch(_) { return String(obj) }
    }
  }
}
</script>

<style scoped>
/* Breadcrumb Styling */
.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin: 0;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
}

.breadcrumb-item a {
  color: #4e73df;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #6c757d;
}

.nav-pills .nav-link { cursor: pointer; }
.section-header { background: #f8f9fa; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
.notification-item { border-bottom: 1px solid #f1f1f1; }
.notification-item.unread { background: #fdfdfd; border-left: 3px solid #3b82f6; }
.text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-clamp: 2; }
.avatar { width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; }
.avatar-inapp { background: #3b82f6; }
.avatar-email { background: #0ea5e9; }
.avatar-sms { background: #10b981; }
.avatar-default { background: #6b7280; }
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-custom {
  width: min(800px, 95vw);
  max-height: 85vh;
  overflow: auto;
}
.list-group-item {
  border-left: none;
  border-right: none;
}

.list-group-item:first-child {
  border-top: none;
}

.list-group-item:last-child {
  border-bottom: none;
}

.badge {
  font-size: 0.75em;
}
</style>