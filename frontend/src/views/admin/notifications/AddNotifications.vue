<template>
  <AdminLayout>
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">
            Create Notification
          </h1>
          <p class="text-muted mb-0">
            Send notifications to users
          </p>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-8">
          <div class="card shadow">
            <div class="card-header">
              <h6 class="m-0 font-weight-bold text-primary">
                Notification Details
              </h6>
            </div>
            <div class="card-body">
              <form @submit.prevent="submitNotification">
                <!-- Recipient Selection -->
                <div class="mb-3">
                  <label class="form-label">Recipient Type</label>
                  <select
                    v-model="form.recipientType"
                    class="form-select"
                    @change="onRecipientTypeChange"
                  >
                    <option value="user">
                      Specific User
                    </option>
                    <option value="guardian">
                      All Guardians
                    </option>
                    <option value="healthworker">
                      All Health Workers
                    </option>
                    <option value="admin">
                      All Admins
                    </option>
                  </select>
                </div>

                <!-- User Selection (when specific user) -->
                <div
                  v-if="form.recipientType === 'user'"
                  class="mb-3"
                >
                  <label class="form-label">Select User</label>
                  <select
                    v-model="form.recipient_user_id"
                    class="form-select"
                    required
                  >
                    <option value="">
                      Choose a user...
                    </option>
                    <option
                      v-for="user in users"
                      :key="user.user_id || user.id"
                      :value="user.user_id || user.id"
                    >
                      {{ user.firstname }} {{ user.surname }} ({{ user.role }})
                    </option>
                  </select>
                </div>

                <!-- Channel -->
                <div class="mb-3">
                  <label class="form-label">Channel</label>
                  <select
                    v-model="form.channel"
                    class="form-select"
                    required
                  >
                    <option value="in-app">
                      In-App
                    </option>
                    <option value="email">
                      Email
                    </option>
                    <option value="sms">
                      SMS
                    </option>
                  </select>
                </div>

                <!-- Template Code -->
                <div class="mb-3">
                  <label class="form-label">Template</label>
                  <select
                    v-model="form.template_code"
                    class="form-select"
                  >
                    <option value="">
                      Custom Message
                    </option>
                    <option value="welcome_guardian">
                      Welcome Guardian
                    </option>
                    <option value="schedule_created">
                      Schedule Created
                    </option>
                    <option value="vaccination_reminder_14">
                      14-Day Reminder
                    </option>
                    <option value="vaccination_reminder_7">
                      7-Day Reminder
                    </option>
                    <option value="vaccination_reminder_0">
                      Due Date Reminder
                    </option>
                    <option value="vaccination_overdue">
                      Overdue Alert
                    </option>
                    <option value="immunization_confirmation">
                      Immunization Confirmation
                    </option>
                    <option value="low_stock_alert">
                      Low Stock Alert
                    </option>
                    <option value="password_reset">
                      Password Reset
                    </option>
                    <option value="role_change">
                      Role Change
                    </option>
                  </select>
                </div>

                <!-- Header Field - Only show for Custom Message -->
                <div
                  v-if="!form.template_code"
                  class="mb-3"
                >
                  <label class="form-label">Header</label>
                  <input
                    v-model="form.header"
                    type="text"
                    class="form-control"
                    placeholder="Enter notification header..."
                    required
                  >
                  <div class="form-text">
                    This header will be used as the notification template/title
                  </div>
                </div>

                <!-- Message Body -->
                <div class="mb-3">
                  <label class="form-label">Message</label>
                  <textarea
                    v-model="form.message_body"
                    class="form-control"
                    rows="4"
                    placeholder="Enter notification message..."
                    required
                  />
                </div>

                <!-- Scheduled At (optional) -->
                <div class="mb-3">
                  <label class="form-label">Schedule For (optional)</label>
                  <input
                    v-model="form.scheduled_at"
                    type="datetime-local"
                    class="form-control"
                  >
                </div>

                <!-- Submit Button -->
                <div class="d-flex gap-2">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="loading"
                  >
                    <span
                      v-if="loading"
                      class="spinner-border spinner-border-sm me-2"
                    />
                    Send Notification
                  </button>
                  <router-link
                    to="/admin/notifications-inbox"
                    class="btn btn-secondary"
                  >
                    View Inbox
                  </router-link>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Preview Panel -->
        <div class="col-lg-4">
          <div class="card shadow">
            <div class="card-header">
              <h6 class="m-0 font-weight-bold text-primary">
                Preview
              </h6>
            </div>
            <div class="card-body">
              <div class="alert alert-info">
                <strong>Channel:</strong> {{ form.channel || 'Not selected' }}<br>
                <strong>Recipient:</strong> {{ getRecipientPreview() }}<br>
                <strong>Template:</strong> {{ form.template_code || 'Custom Message' }}<br>
                <strong>Header:</strong>
                <span v-if="!form.template_code && form.header">{{ form.header }}</span>
                <span
                  v-else-if="form.template_code && form.header"
                >{{ form.header }}</span>
                <span
                  v-else-if="!form.template_code && !form.header"
                  class="text-muted"
                >Not provided</span>
                <span
                  v-else-if="form.template_code && !form.header"
                  class="text-muted"
                >Optional</span>
                <br>
                <strong>Message:</strong><br>
                {{ form.message_body || 'No message' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import AdminLayout from '@/components/layout/desktop/AdminLayout.vue'
import { notificationAPI } from '@/services/api'
import { usersAPI } from '@/services/users'
import { useToast } from '@/composables/useToast'

export default {
  name: 'CreateNotification',
  components: {
    AdminLayout
  },
  setup() {
    const { addToast } = useToast()
    return { addToast }
  },
  data() {
    return {
      loading: false,
      users: [],
      form: {
        recipientType: 'user',
        recipient_user_id: '',
        channel: 'in-app',
        template_code: '',
        message_body: '',
        header: '',
        scheduled_at: ''
      }
    }
  },
  async mounted() {
    await this.loadUsers()
  },
  methods: {
    async loadUsers() {
      try {
        // Request a large limit to get the full list (UI expects to be able to send to all users of a role)
        const response = await usersAPI.listUsers({ page: 1, limit: 10000 })
        // Possible response shapes:
        // - { users: [...], pagination: {...} } (backend controller returns this)
        // - axios response where data is the above: { data: { users: [...] } }
        // - older helper shapes
        const usersFromResponse = response?.users ?? response?.data?.users ?? response?.data ?? response ?? []
        this.users = Array.isArray(usersFromResponse) ? usersFromResponse : (usersFromResponse.users || [])
      } catch (error) {
        console.error('Failed to load users:', error)
        // use the setup-returned binding on this
        this.addToast({ title: 'Error', message: `Failed to load users: ${error?.message || error}`, type: 'error' })
      }
    },

    onRecipientTypeChange() {
      this.form.recipient_user_id = ''
    },

    getRecipientPreview() {
      if (this.form.recipientType === 'user') {
        const user = this.users.find(u => (u.user_id || u.id) === this.form.recipient_user_id)
        return user ? `${user.firstname} ${user.surname}` : 'Not selected'
      }
      return `All ${this.form.recipientType}s`
    },

    getDerivedHeader() {
      if (!this.form.message_body) return 'No header available'
      
      // Extract header from the first line or first sentence (same logic as backend)
      const lines = this.form.message_body.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        if (firstLine.length <= 50) {
          return firstLine;
        } else {
          // Take first sentence if line is long
          const firstSentence = this.form.message_body.split(/[.!?]/)[0].trim();
          if (firstSentence.length <= 50) {
            return firstSentence;
          }
        }
      }
      return 'Header too long - will be truncated';
    },

    async submitNotification() {
      this.loading = true
      try {
        const payload = { ...this.form }

        // For custom messages, header is required and used as the template
        // For predefined templates, header is optional

        // Handle bulk recipients
        if (this.form.recipientType !== 'user') {
          // For bulk, we'll need to create multiple notifications
          // For now, send to first user of that type as example
          const filteredUsers = this.users.filter(u => {
            const role = (u.role || '').toLowerCase()
            if (this.form.recipientType === 'guardian') return role.includes('guardian') || role.includes('parent')
            if (this.form.recipientType === 'healthworker') return role.includes('health') || role.includes('staff')
            if (this.form.recipientType === 'admin') return role.includes('admin')
            return false
          })

          if (!filteredUsers.length) {
            throw new Error('No recipients found for the selected recipient type')
          }

          // Send and count successful creations (limit to 10 for demo)
          let createdCount = 0
          for (const user of filteredUsers.slice(0, 10)) {
            try {
              const resp = await notificationAPI.create({
                ...payload,
                recipient_user_id: user.user_id || user.id,
                recipient_phone: user.contact_number,
                recipient_email: user.email
              })
              if (resp && resp.status && resp.status >= 200 && resp.status < 300) createdCount++
            } catch (err) {
              // Log and continue to next recipient
              console.warn('Failed to create notification for user', user.user_id, err)
            }
          }

          if (createdCount === 0) {
            throw new Error('Failed to create notifications for all recipients')
          }
        } else {
          await notificationAPI.create(payload)
        }

        this.addToast({ title: 'Success', message: 'Notification sent successfully', type: 'success' })
        this.resetForm()
      } catch (error) {
        console.error('Failed to send notification:', error)
        // Try to surface backend error message if available
        const backendMsg = error?.response?.data?.message || JSON.stringify(error?.response?.data || error?.message || 'Failed to send notification')
        this.addToast({ title: 'Error', message: backendMsg, type: 'error' })
      } finally {
        this.loading = false
      }
    },

    resetForm() {
      this.form = {
        recipientType: 'user',
        recipient_user_id: '',
        channel: 'in-app',
        template_code: '',
        message_body: '',
        header: '',
        scheduled_at: ''
      }
    }
  }
}
</script>

<style scoped>
.card {
  border: none;
  border-radius: 0.5rem;
}

.card-header {
  background-color: #f8f9fa;
  color: #495057;
  border-bottom: 1px solid #dee2e6;
  border-radius: 0.5rem 0.5rem 0 0 !important;
}

.font-weight-bold {
  font-weight: 600;
}
</style>