<template>
  <div class="sms-form">
    <h2>Send SMS with PhilSMS</h2>
    <form @submit.prevent="sendSms">
      <div class="form-group">
        <label for="to">To:</label>
        <input type="text" id="to" v-model="to" placeholder="e.g., 09171234567" required />
      </div>
      <div class="form-group">
        <label for="message">Message:</label>
        <textarea id="message" v-model="message" required></textarea>
      </div>
      <button type="submit" :disabled="sending">
        {{ sending ? 'Sending...' : 'Send SMS' }}
      </button>
    </form>
    <p v-if="response" class="response">{{ response }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      to: '',
      message: '',
      sending: false,
      response: null,
    };
  },
  methods: {
    async sendSms() {
      this.sending = true;
      this.response = null;
      try {
        const res = await axios.post('/send-sms', {
          to: this.to,
          message: this.message,
        });
        this.response = `Success: ${JSON.stringify(res.data)}`;
      } catch (error) {
        this.response = `Error: ${error.response ? error.response.data.error : error.message}`;
      } finally {
        this.sending = false;
      }
    },
  },
};
</script>

<style scoped>
.sms-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
}
input,
textarea {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
button {
  background-color: #4caf50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #cccccc;
}
.response {
  margin-top: 15px;
  padding: 10px;
  border-radius: 5px;
  background-color: #f0f0f0;
}
</style>
