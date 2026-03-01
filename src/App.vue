<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-10 col-lg-8 col-xl-7">
        <div class="card mt-5 shadow-lg">
          <div class="card-body p-5">
            <div class="text-center mb-5">
              <div class="philsms-icon">📱</div>
              <h1 class="card-title mb-3 fw-bold display-5">PhilSMS Demo</h1>
              <p class="text-muted fs-5">Send SMS messages instantly using PhilSMS API</p>
            </div>

            <!-- Alert Messages -->
            <transition name="alert-fade">
              <div v-if="alertMessage" :class="alertClass" class="alert alert-dismissible fade show" role="alert">
                <strong>{{ alertMessage }}</strong>
                <button type="button" class="btn-close" @click="clearAlert" aria-label="Close"></button>
              </div>
            </transition>

            <!-- SMS Form -->
            <form @submit.prevent="sendSMS">
              <div class="mb-5">
                <label for="phoneNumber" class="form-label fw-bold fs-5 mb-3">
                  📞 Recipient Phone Number
                </label>
                <div class="input-group input-group-lg">
                  <span class="input-group-text px-4 fs-4">🇵🇭</span>
                  <input
                    ref="phoneInput"
                    type="tel"
                    class="form-control form-control-lg fs-5"
                    :class="{ 'is-invalid': phoneError, 'is-valid': phoneValid }"
                    id="phoneNumber"
                    v-model="phoneNumber"
                    @input="validatePhone"
                    placeholder="09171234567"
                    required
                    :disabled="loading"
                    maxlength="11"
                  />
                </div>
                <div v-if="phoneError" class="invalid-feedback d-block mt-2 fs-6">
                  {{ phoneError }}
                </div>
                <div v-else class="form-text mt-2 fs-6">
                  ℹ️ Enter 11-digit mobile number starting with 09
                </div>
              </div>

              <div class="mb-5">
                <label for="message" class="form-label fw-bold fs-5 mb-3">
                  ✉️ Message
                </label>
                <textarea
                  class="form-control form-control-lg fs-5"
                  :class="{ 'is-warning': message.length > 140 }"
                  id="message"
                  v-model="message"
                  rows="6"
                  placeholder="Type your message here..."
                  required
                  :disabled="loading"
                  maxlength="160"
                ></textarea>
                <div class="d-flex justify-content-between align-items-center mt-3">
                  <small :class="characterCountClass" class="fs-6">
                    {{ message.length }}/160 characters
                  </small>
                  <small v-if="message.length > 140" class="text-warning fs-6">
                    ⚠️ Approaching limit
                  </small>
                </div>
              </div>

              <div class="d-grid gap-3">
                <button 
                  type="submit" 
                  class="btn btn-primary btn-lg send-btn py-3"
                  :disabled="loading || !isFormValid"
                >
                  <span v-if="loading">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending your message...
                  </span>
                  <span v-else>
                    📤 Send SMS
                  </span>
                </button>
                <button 
                  v-if="phoneNumber || message"
                  type="button" 
                  class="btn btn-outline-secondary btn-lg py-3"
                  @click="clearForm"
                  :disabled="loading"
                >
                  🔄 Clear Form
                </button>
              </div>
            </form>

            <!-- Info Section -->
            <div class="mt-5 p-4 info-box rounded">
              <small class="text-muted fs-6">
                <strong>💡 Tip:</strong> Enter an 11-digit Philippine mobile number starting with <code class="bg-white px-2 py-1 rounded">09</code> and keep your message under 160 characters.
              </small>
            </div>
          </div>
        </div>

        <!-- Quick Stats (if SMS sent) -->
        <transition name="fade">
          <div v-if="smsSentCount > 0" class="text-center mt-4 text-white">
            <div class="stats-badge">
              ✅ Total SMS sent this session: <strong>{{ smsSentCount }}</strong>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
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
    const phoneError = ref('');
    const phoneValid = ref(false);
    const smsSentCount = ref(0);
    const phoneInput = ref(null);

    // Computed properties
    const isFormValid = computed(() => {
      return phoneNumber.value.length === 11 && 
             phoneNumber.value.startsWith('09') && 
             message.value.length > 0 &&
             message.value.length <= 160;
    });

    const characterCountClass = computed(() => {
      const len = message.value.length;
      if (len === 0) return 'text-muted';
      if (len > 140) return 'text-warning fw-bold';
      if (len > 120) return 'text-info';
      return 'text-success';
    });

    // Validation
    const validatePhone = () => {
      const phone = phoneNumber.value;
      phoneError.value = '';
      phoneValid.value = false;

      if (phone.length === 0) {
        return;
      }

      if (!phone.startsWith('09')) {
        phoneError.value = '❌ Phone number must start with 09';
        return;
      }

      if (!/^\d+$/.test(phone)) {
        phoneError.value = '❌ Please enter numbers only';
        return;
      }

      if (phone.length < 11) {
        phoneError.value = `⚠️ Enter ${11 - phone.length} more digit(s)`;
        return;
      }

      if (phone.length === 11) {
        phoneValid.value = true;
      }
    };

    const sendSMS = async () => {
      if (!isFormValid.value) {
        alertMessage.value = '❌ Please check your input and try again';
        alertType.value = 'error';
        alertClass.value = 'alert-danger';
        return;
      }

      loading.value = true;
      clearAlert();

      try {
        const response = await axios.post('/send-sms', {
          to: phoneNumber.value,
          message: message.value
        });

        if (response.data) {
          alertMessage.value = '✅ Success! Your SMS has been sent';
          alertType.value = 'success';
          alertClass.value = 'alert-success';
          smsSentCount.value++;
          
          // Clear form after successful send
          setTimeout(() => {
            clearForm();
            clearAlert();
          }, 3000);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message || 'Failed to send SMS';
        alertMessage.value = `❌ Error: ${errorMsg}`;
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

    const clearForm = () => {
      phoneNumber.value = '';
      message.value = '';
      phoneError.value = '';
      phoneValid.value = false;
      clearAlert();
      if (phoneInput.value) {
        phoneInput.value.focus();
      }
    };

    // Auto-focus on mount
    onMounted(() => {
      if (phoneInput.value) {
        phoneInput.value.focus();
      }
    });

    return {
      phoneNumber,
      message,
      loading,
      alertMessage,
      alertType,
      alertClass,
      phoneError,
      phoneValid,
      smsSentCount,
      phoneInput,
      isFormValid,
      characterCountClass,
      validatePhone,
      sendSMS,
      clearAlert,
      clearForm
    };
  }
};
</script>
