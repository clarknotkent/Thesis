<template>
  <div class="container py-3">
    <h3>Create Notification</h3>
    <form @submit.prevent="send">
      <div class="mb-3">
        <label class="form-label">Message Type</label>
        <select v-model="form.template_code" class="form-select">
          <option value="general_notification">General Notification</option>
          <option value="appointment_reminder">Appointment Reminder</option>
          <option value="vaccination_due">Vaccination Due</option>
          <option value="missed_appointment">Missed Appointment</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Recipients (comma-separated phone numbers or 'all')</label>
        <input v-model="form.recipients" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">Message</label>
        <textarea v-model="form.message_body" class="form-control" rows="4"></textarea>
      </div>
      <button class="btn btn-primary" :disabled="loading">Send</button>
    </form>
  </div>
</template>

<script>
import api from '@/services/api'
import { ref } from 'vue'

export default {
  name: 'CreateNotification',
  setup() {
    const form = ref({ template_code: 'general_notification', recipients: '', message_body: '' })
    const loading = ref(false)

    const send = async () => {
      loading.value = true
      try {
        const recipients = (form.value.recipients || '').split(',').map(s=>s.trim()).filter(Boolean)
        // if recipients contains 'all' we'll send a single notification entry with recipient_user_id = null and channel = 'broadcast'
        if (recipients.length === 1 && recipients[0] === 'all') {
          await api.post('/notifications', { template_code: form.value.template_code, message_body: form.value.message_body, channel: 'broadcast' })
          alert('Broadcast queued')
        } else {
          // send individual notifications
          for (const r of recipients) {
            await api.post('/notifications', { template_code: form.value.template_code, message_body: form.value.message_body, recipient_phone: r, channel: 'sms' })
          }
          alert('Notifications queued')
        }
      } catch (e) {
        console.error(e)
        alert('Failed to queue notifications')
      } finally { loading.value = false }
    }

    return { form, send, loading }
  }
}
</script>
