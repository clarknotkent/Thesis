<template>
  <div class="forgot-password-container">
    <div class="container-fluid vh-100">
      <div class="row h-100">
        <!-- Form Section -->
        <div class="col-lg-6 d-flex align-items-center justify-content-center">
          <div class="forgot-password-form-container">
            <div class="text-center mb-4">
              <router-link
                to="/auth/login"
                class="btn btn-link text-muted"
              >
                <i class="bi bi-arrow-left me-2" />Back to Login
              </router-link>
            </div>

            <div class="text-center mb-5">
              <div class="mb-3">
                <i class="bi bi-key-fill text-primary display-4" />
              </div>
              <h1 class="h3 fw-bold text-gray-800 mb-3">
                Forgot Password?
              </h1>
              <p class="text-muted">
                Enter your email, username, or phone number and we'll send you a reset code via SMS.
              </p>
            </div>

            <div class="card shadow-lg border-0">
              <div class="card-body p-5">
                <form
                  v-if="!submitted"
                  @submit.prevent="handleSubmit"
                >
                  <div class="mb-4">
                    <label
                      for="identifier"
                      class="form-label"
                    >Email / Username / Phone</label>
                    <input
                      id="identifier"
                      v-model="form.identifier"
                      type="text"
                      class="form-control form-control-lg"
                      placeholder="Enter your email, username, or phone"
                      required
                    >
                  </div>

                  <button
                    type="submit"
                    class="btn btn-primary btn-lg w-100"
                    :disabled="loading"
                  >
                    <span v-if="loading">
                      <span
                        class="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                      Sending...
                    </span>
                    <span v-else>
                      <i class="bi bi-phone me-2" />
                      Send Reset Code
                    </span>
                  </button>
                </form>

                <!-- Success Message -->
                <div
                  v-if="submitted && !error"
                  class="text-center"
                >
                  <div class="mb-3">
                    <i class="bi bi-check-circle-fill text-success display-4" />
                  </div>
                  <h5 class="text-success mb-3">
                    Reset Code Sent!
                  </h5>
                  <p class="text-muted mb-4">
                    A 6-digit reset code has been sent to your registered phone number
                    <strong v-if="phoneHint">{{ phoneHint }}</strong>.
                  </p>
                  <p class="text-muted small mb-4">
                    Please check your SMS. The code will expire in 15 minutes.
                  </p>
                  <router-link
                    to="/reset-password"
                    class="btn btn-primary w-100 mb-2"
                  >
                    <i class="bi bi-arrow-right me-2" />
                    Enter Reset Code
                  </router-link>
                  <router-link
                    to="/auth/login"
                    class="btn btn-outline-primary w-100"
                  >
                    <i class="bi bi-arrow-left me-2" />
                    Back to Login
                  </router-link>
                </div>

                <!-- Error Alert -->
                <div
                  v-if="error"
                  class="alert alert-danger mt-3"
                  role="alert"
                >
                  <i class="bi bi-exclamation-triangle me-2" />
                  {{ error }}
                </div>
              </div>
            </div>

            <div class="text-center mt-4">
              <p class="text-muted small">
                Remember your password? 
                <router-link
                  to="/auth/login"
                  class="text-primary text-decoration-none fw-semibold"
                >
                  Sign In
                </router-link>
              </p>
            </div>
          </div>
        </div>

        <!-- Branding/Info Section -->
        <div class="col-lg-6 d-none d-lg-flex align-items-center justify-content-center bg-primary">
          <div class="text-center text-white">
            <div class="mb-4">
              <i class="bi bi-shield-lock display-1 mb-4" />
            </div>
            <h2 class="display-6 mb-4">
              Secure Password Recovery
            </h2>
            <p class="lead mb-0">
              We'll help you regain access to your account securely. 
              Your security is our top priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// Form data
const form = reactive({
  identifier: ''
})

// Component state
const loading = ref(false)
const error = ref('')
const submitted = ref(false)
const phoneHint = ref('')

// Handle form submission
const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!form.identifier) {
      throw new Error('Please enter your email, username, or phone number')
    }

    const response = await axios.post('/api/auth/forgot-password', {
      identifier: form.identifier
    })

    if (response.data.success) {
      submitted.value = true
      phoneHint.value = response.data.phoneHint || ''
      // Store identifier for reset page
      sessionStorage.setItem('resetIdentifier', form.identifier)
    } else {
      throw new Error(response.data.message || 'Failed to send reset code')
    }

  } catch (err) {
    error.value = err?.response?.data?.message || err.message || 'Failed to send reset code. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-password-container {
  min-height: 100vh;
}

.forgot-password-form-container {
  width: 100%;
  max-width: 500px;
  padding: 20px;
}

.card {
  border-radius: 1rem;
}

.card-body {
  padding: 2.5rem;
}

.form-control-lg {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.bg-primary {
  background: linear-gradient(135deg, #4e73df 0%, #224abe 100%) !important;
}
</style>
