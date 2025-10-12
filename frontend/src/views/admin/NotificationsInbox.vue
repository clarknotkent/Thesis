<template>
  <div class="notifications-inbox">
    <h2>Notifications</h2>
    <div>
      <button @click="fetchNotifications">Refresh</button>
      <router-link to="/admin/notifications/create">Create notification</router-link>
    </div>
    <ul>
      <li v-for="n in notifications" :key="n.notification_id">
        <strong>{{ n.template_code || n.channel }}</strong> — {{ n.message_body }}
        <div class="meta">To: {{ n.recipient_name || n.recipient_email || n.recipient_phone }} — {{ n.status }} — {{ n.created_at }}</div>
      </li>
    </ul>
  </div>
</template>

<script>
import api from '@/services/api'
import { ref } from 'vue'

export default {
  setup() {
    const notifications = ref([])

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications')
        notifications.value = res.data?.data || res.data || []
      } catch (err) {
        console.error('Failed to fetch notifications', err)
      }
    }

    fetchNotifications()
    return { notifications, fetchNotifications }
  }
}
</script>

<style scoped>
.meta { font-size: 0.85em; color: #666 }
</style>
