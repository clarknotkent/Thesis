<template>
  <div class="notification-create">
    <h2>Create Notification</h2>
    <form @submit.prevent="submit">
      <div>
        <label>Channel</label>
        <select v-model="form.channel">
          <option value="in-app">In-app</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
        </select>
      </div>
      <div>
        <label>Recipient user id (optional)</label>
        <input v-model="form.recipient_user_id" />
      </div>
      <div>
        <label>Recipient phone</label>
        <input v-model="form.recipient_phone" />
      </div>
      <div>
        <label>Recipient email</label>
        <input v-model="form.recipient_email" />
      </div>
      <div>
        <label>Template code</label>
        <input v-model="form.template_code" />
      </div>
      <div>
        <label>Message</label>
        <textarea v-model="form.message_body"></textarea>
      </div>
      <div>
        <button type="submit">Create</button>
        <router-link to="/admin/notifications">Cancel</router-link>
      </div>
    </form>
  </div>
</template>

<script>
import api from '@/services/api'
import { ref } from 'vue'

export default {
  setup() {
    const form = ref({ channel: 'in-app', recipient_user_id: '', recipient_phone: '', recipient_email: '', template_code: '', message_body: '' })

    const submit = async () => {
      try {
        const payload = { ...form.value }
        if (!payload.message_body && payload.template_code) {
          payload.message_body = payload.template_code
        }
        await api.post('/notifications', payload)
        alert('Notification created')
        window.location.href = '/admin/notifications'
      } catch (err) {
        console.error('Failed to create notification', err)
      }
    }

    return { form, submit }
  }
}
</script>
