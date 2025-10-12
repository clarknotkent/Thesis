<template>
  <AdminLayout>
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Notifications Inbox</h1>
          <p class="text-muted mb-0">View and manage your notifications</p>
        </div>
        <router-link to="/admin/create-notification" class="btn btn-primary">
          <i class="bi bi-plus-circle me-2"></i>Create Notification
        </router-link>
      </div>

      <!-- Filters -->
      <div class="card shadow mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label">Status</label>
              <select v-model="filters.status" class="form-select" @change="loadNotifications">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Channel</label>
              <select v-model="filters.channel" class="form-select" @change="loadNotifications">
                <option value="">All</option>
                <option value="in-app">In-App</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Unread Only</label>
              <div class="form-check mt-2">
                <input v-model="filters.unreadOnly" class="form-check-input" type="checkbox" @change="loadNotifications">
                <label class="form-check-label">Show unread only</label>
              </div>
            </div>
            <div class="col-md-3">
              <label class="form-label">Search</label>
              <input v-model="filters.search" class="form-control" placeholder="Search messages..." @input="debouncedSearch">
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Notifications List -->
      <div v-else-if="notifications.length > 0" class="row">
        <div class="col-12">
          <div class="card shadow">
            <div class="card-body p-0">
              <div class="list-group list-group-flush">
                <div
                  v-for="notification in notifications"
                  :key="notification.notification_id"
                  class="list-group-item"
                  :class="{ 'list-group-item-action': !notification.read_at, 'bg-light': notification.read_at }"
                >
                  <div class="d-flex w-100 justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <div class="d-flex align-items-center mb-2">
                        <span
                          class="badge me-2"
                          :class="getStatusBadgeClass(notification.status)"
                        >
                          {{ notification.status }}
                        </span>
                        <span
                          class="badge me-2"
                          :class="getChannelBadgeClass(notification.channel)"
                        >
                          {{ notification.channel }}
                        </span>
                        <small class="text-muted">
                          {{ formatDate(notification.created_at) }}
                        </small>
                      </div>
                      <p class="mb-1">{{ notification.message_body }}</p>
                      <div class="d-flex align-items-center">
                        <small class="text-muted me-3">
                          Template: {{ notification.template_code || 'Custom' }}
                        </small>
                        <small v-if="notification.related_entity_type" class="text-muted">
                          Related: {{ notification.related_entity_type }}
                        </small>
                      </div>
                    </div>
                    <div class="d-flex flex-column gap-2">
                      <button
                        v-if="!notification.read_at"
                        @click="markAsRead(notification.notification_id)"
                        class="btn btn-sm btn-outline-primary"
                      >
                        Mark Read
                      </button>
                      <button
                        @click="deleteNotification(notification.notification_id)"
                        class="btn btn-sm btn-outline-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-5">
        <div class="mb-4">
          <i class="bi bi-bell-slash text-muted" style="font-size: 4rem;"></i>
        </div>
        <h5 class="text-muted">No notifications found</h5>
        <p class="text-muted">You don't have any notifications matching your filters.</p>
      </div>

      <!-- Pagination -->
      <div v-if="notifications.length > 0" class="d-flex justify-content-center mt-4">
        <nav>
          <ul class="pagination">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="changePage(currentPage - 1)">Previous</button>
            </li>
            <li
              v-for="page in visiblePages"
              :key="page"
              class="page-item"
              :class="{ active: page === currentPage }"
            >
              <button class="page-link" @click="changePage(page)">{{ page }}</button>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="changePage(currentPage + 1)">Next</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { notificationAPI } from '@/services/api'

export default {
  name: 'NotificationsInbox',
  components: {
    AdminLayout
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
      debounceTimer: null
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
    }
  },
  async mounted() {
    await this.loadNotifications()
  },
  methods: {
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
        this.$toast.error('Failed to load notifications')
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
        this.$toast.success('Notification marked as read')
      } catch (error) {
        console.error('Failed to mark as read:', error)
        this.$toast.error('Failed to mark notification as read')
      }
    },

    async deleteNotification(notificationId) {
      if (!confirm('Are you sure you want to delete this notification?')) return

      try {
        await notificationAPI.delete(notificationId)
        await this.loadNotifications() // Refresh list
        this.$toast.success('Notification deleted')
      } catch (error) {
        console.error('Failed to delete notification:', error)
        this.$toast.error('Failed to delete notification')
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

    formatDate(dateString) {
      return new Date(dateString).toLocaleString()
    }
  }
}
</script>

<style scoped>
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