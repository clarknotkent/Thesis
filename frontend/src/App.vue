<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
        <div class="card mt-5">
          <div class="card-body p-5">
            <div class="text-center">
              <div class="twilio-icon">📱</div>
              <h1 class="card-title mb-4">Twilio SMS Demo</h1>
              <p class="text-muted mb-4">Send SMS messages using Twilio API</p>
            </div>

            <!-- Alert Messages -->
            <div v-if="alertMessage" :class="alertClass" class="alert alert-dismissible fade show" role="alert">
              {{ alertMessage }}
              <button type="button" class="btn-close" @click="clearAlert"></button>
            </div>

            <!-- SMS Form -->
            <form @submit.prevent="sendSMS">
              <div class="mb-3">
                <label for="phoneNumber" class="form-label fw-bold">Recipient Phone Number</label>
                <input
                  type="tel"
                  class="form-control form-control-lg"
                  id="phoneNumber"
                  v-model="phoneNumber"
                  placeholder="+1234567890"
                  required
                  :disabled="loading"
                />
                <div class="form-text">Include country code (e.g., +1 for US)</div>
              </div>

              <div class="mb-4">
                <label for="message" class="form-label fw-bold">Message</label>
                <textarea
                  class="form-control form-control-lg"
                  id="message"
                  v-model="message"
                  rows="4"
                  placeholder="Enter your message here..."
                  required
                  :disabled="loading"
                  maxlength="160"
                ></textarea>
                <div class="form-text">{{ message.length }}/160 characters</div>
              </div>

              <div class="d-grid">
                <button 
                  type="submit" 
                  class="btn btn-primary btn-lg"
                  :disabled="loading"
                >
                  <span v-if="loading">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending...
                  </span>
                  <span v-else>
                    📤 Send SMS
                  </span>
                </button>
              </div>
            </form>

            <!-- Info Section -->
            <div class="mt-4 p-3 bg-light rounded">
              <small class="text-muted">
                <strong>Note:</strong> Make sure your backend server is running on 
                <code>http://localhost:3000</code> and your Twilio credentials are configured.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios';

export default {
  name: 'App',
  setup() {
    const phoneNumber = ref('');
    const message = ref('');
    const loading = ref(false);
    const alertMessage = ref('');
    const alertType = ref('');

    const alertClass = ref('');

    const sendSMS = async () => {
      loading.value = true;
      clearAlert();

      try {
        const response = await axios.post('http://localhost:3000/api/send-sms', {
          to: phoneNumber.value,
          message: message.value
        });

        if (response.data.success) {
          alertMessage.value = '✅ SMS sent successfully!';
          alertType.value = 'success';
          alertClass.value = 'alert-success';
          
          // Clear form
          phoneNumber.value = '';
          message.value = '';
        }
      } catch (error) {
        alertMessage.value = `❌ Error: ${error.response?.data?.error || error.message || 'Failed to send SMS'}`;
        alertType.value = 'error';
        alertClass.value = 'alert-danger';
      } finally {
        loading.value = false;
      }
    };

    const clearAlert = () => {
      alertMessage.value = '';
      alertType.value = '';
      alertClass.value = '';
    };

    return {
      phoneNumber,
      message,
      loading,
      alertMessage,
      alertType,
      alertClass,
      sendSMS,
      clearAlert
    };
  }
};
</script>
