<template>
  <div class="reset-password-container">
    <div class="container-fluid vh-100">
      <div class="row h-100">
        <!-- Form Section -->
        <div class="col-lg-6 d-flex align-items-center justify-content-center">
          <div class="reset-password-form-container">
            <div class="text-center mb-5">
              <div class="mb-3">
                <i class="bi bi-lock-fill text-primary display-4" />
              </div>
              <h1 class="h3 fw-bold text-gray-800 mb-3">
                Code Sent
              </h1>
              <p class="text-muted">
                Enter the 6-digit code sent to your phone and set your new password.
              </p>
            </div>

            <div class="card shadow-lg border-0">
              <div class="card-body p-5">
                <!-- Reset Form -->
                <form
                  v-if="!resetSuccess"
                  @submit.prevent="handleSubmit"
                >
                  <div class="mb-3">
                    <label
                      for="resetCode"
                      class="form-label"
                    >Reset Code <span class="text-danger">*</span></label>
                    <input
                      id="resetCode"
                      v-model="form.code"
                      type="text"
                      class="form-control form-control-lg text-center"
                      placeholder="Enter 6-digit code"
                      maxlength="6"
                      pattern="[0-9]{6}"
                      required
                      style="letter-spacing: 0.5em; font-size: 1.5rem;"
                    >
                    <div class="form-text">
                      Check your SMS for the 6-digit code
                    </div>
                  </div>

                  <div class="mb-3">
                    <label
                      for="newPassword"
                      class="form-label"
                    >New Password <span class="text-danger">*</span></label>
                    <div class="position-relative">
                      <input
                        id="newPassword"
                        v-model="form.newPassword"
                        :type="showPassword ? 'text' : 'password'"
                        class="form-control form-control-lg pe-5"
                        placeholder="Enter new password"
                        minlength="8"
                        required
                      >
                      <button
                        type="button"
                        class="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted"
                        style="border: none; background: transparent; padding-right: 10px;"
                        @click="showPassword = !showPassword"
                      >
                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" />
                      </button>
                    </div>
                    <div class="form-text">
                      Must be at least 8 characters long
                    </div>
                  </div>

                  <div class="mb-4">
                    <label
                      for="confirmPassword"
                      class="form-label"
                    >Confirm Password <span class="text-danger">*</span></label>
                    <div class="position-relative">
                      <input
                        id="confirmPassword"
                        v-model="form.confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        class="form-control form-control-lg pe-5"
                        :class="{ 'is-invalid': form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword }"
                        placeholder="Confirm new password"
                        minlength="8"
                        required
                      >
                      <button
                        type="button"
                        class="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted"
                        style="border: none; background: transparent; padding-right: 10px;"
                        @click="showConfirmPassword = !showConfirmPassword"
                      >
                        <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" />
                      </button>
                    </div>
                    <div
                      v-if="form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword"
                      class="invalid-feedback d-block"
                    >
                      Passwords do not match
                    </div>
                  </div>

                  <button
                    type="submit"
                    class="btn btn-primary btn-lg w-100"
                    :disabled="loading || form.newPassword !== form.confirmPassword || !form.code"
                  >
                    <span v-if="loading">
                      <span
                        class="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                      Resetting...
                    </span>
                    <span v-else>
                      <i class="bi bi-check-circle me-2" />
                      Reset Password
                    </span>
                  </button>

                  <div class="text-center mt-3">
                    <router-link
                      to="/forgot-password"
                      class="text-muted small"
                    >
                      Didn't receive code? Request new one
                    </router-link>
                  </div>
                </form>

                <!-- Success Message -->
                <div
                  v-if="resetSuccess"
                  class="text-center py-4"
                >
                  <div class="mb-3">
                    <i class="bi bi-check-circle-fill text-success display-4" />
                  </div>
                  <h5 class="text-success mb-3">
                    Password Reset Successful!
                  </h5>
                  <p class="text-muted mb-4">
                    Your password has been successfully reset. 
                    You can now login with your new password.
                  </p>
                  <router-link
                    to="/auth/login"
                    class="btn btn-primary"
                  >
                    <i class="bi bi-box-arrow-in-right me-2" />
                    Go to Login
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
              <i class="bi bi-shield-check display-1 mb-4" />
            </div>
            <h2 class="display-6 mb-4">
              Secure Your Account
            </h2>
            <p class="lead mb-0">
              Choose a strong password to protect your account and patient data. 
              Your security is our top priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// Form data
const form = reactive({
  code: '',
  newPassword: '',
  confirmPassword: ''
})

// Component state
const loading = ref(false)
const error = ref('')
const resetSuccess = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const identifier = ref('')

// Get identifier from session storage
onMounted(() => {
  identifier.value = sessionStorage.getItem('resetIdentifier') || ''
  if (!identifier.value) {
    console.warn('No reset identifier found, user may need to go back to forgot password')
  }
})

// Handle form submission
const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!form.code || !form.newPassword || !form.confirmPassword) {
      throw new Error('Please fill in all fields')
    }

    if (form.newPassword !== form.confirmPassword) {
      throw new Error('Passwords do not match')
    }

    if (form.newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    if (!identifier.value) {
      throw new Error('Session expired. Please start the password reset process again.')
    }

    // Call reset password API
    const response = await axios.post('/api/auth/reset-password', {
      identifier: identifier.value,
      code: form.code,
      newPassword: form.newPassword
    })

    if (response.data.success) {
      resetSuccess.value = true
      // Clear stored identifier
      sessionStorage.removeItem('resetIdentifier')

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } else {
      throw new Error(response.data.message || 'Failed to reset password')
    }

  } catch (err) {
    error.value = err?.response?.data?.message || err.message || 'Failed to reset password. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-password-container {
  min-height: 100vh;
}

.reset-password-form-container {
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
