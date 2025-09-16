<template>
  <div class="login-container">
    <div class="container-fluid vh-100">
      <div class="row h-100">
        <!-- Login Form Section -->
        <div class="col-lg-6 d-flex align-items-center justify-content-center">
          <div class="login-form-container w-100" style="max-width: 500px;">
            <div class="text-center mb-5">
              <h1 class="display-5 fw-bold text-primary mb-3">
                <i class="bi bi-shield-check me-3"></i>ImmunizeMe
              </h1>
              <p class="lead text-muted">Immunization Management System</p>
            </div>

            <div class="card shadow-lg border-0">
              <div class="card-body p-5">
                <!-- Error Alert -->
                <div v-if="error" class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  {{ error }}
                  <button type="button" class="btn-close" @click="clearError"></button>
                </div>

                <!-- Success Alert -->
                <div v-if="successMessage" class="alert alert-success alert-dismissible fade show mb-4" role="alert">
                  <i class="bi bi-check-circle me-2"></i>
                  {{ successMessage }}
                  <button type="button" class="btn-close" @click="successMessage = ''"></button>
                </div>

                <form @submit.prevent="handleLogin">
                  <div class="mb-3">
                    <label for="username" class="form-label">Username or Email</label>
                    <div class="input-group input-group-lg">
                      <span class="input-group-text">
                        <i class="bi bi-person"></i>
                      </span>
                      <input
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': formErrors.username }"
                        id="username"
                        v-model="form.username"
                        placeholder="Enter username or email"
                        :disabled="isLoading"
                        required
                      />
                      <div v-if="formErrors.username" class="invalid-feedback">
                        {{ formErrors.username }}
                      </div>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label for="password" class="form-label">Password</label>
                    <div class="input-group input-group-lg">
                      <span class="input-group-text">
                        <i class="bi bi-lock"></i>
                      </span>
                      <input
                        :type="showPassword ? 'text' : 'password'"
                        class="form-control"
                        :class="{ 'is-invalid': formErrors.password }"
                        id="password"
                        v-model="form.password"
                        placeholder="Enter your password"
                        :disabled="isLoading"
                        required
                      />
                      <button
                        type="button"
                        class="btn btn-outline-secondary"
                        @click="togglePassword"
                        :disabled="isLoading"
                      >
                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                      </button>
                      <div v-if="formErrors.password" class="invalid-feedback">
                        {{ formErrors.password }}
                      </div>
                    </div>
                  </div>

                  <div class="mb-4">
                    <div class="form-check">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        id="rememberMe"
                        v-model="form.rememberMe"
                        :disabled="isLoading"
                      >
                      <label class="form-check-label" for="rememberMe">
                        Remember me
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    class="btn btn-primary btn-lg w-100 mb-3"
                    :disabled="isLoading"
                  >
                    <span v-if="isLoading">
                      <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                      Signing in...
                    </span>
                    <span v-else>
                      <i class="bi bi-box-arrow-in-right me-2"></i>
                      Sign In
                    </span>
                  </button>
                </form>

                <div class="text-center">
                  <p class="text-muted mb-0">
                    <a href="#" class="text-primary text-decoration-none" @click.prevent="showForgotPassword">
                      Forgot your password?
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <!-- Admin Only Notice -->
            <div class="card mt-4 bg-info bg-opacity-10">
              <div class="card-body p-3">
                <h6 class="card-title text-info">
                  <i class="bi bi-info-circle me-2"></i>Admin Access Only
                </h6>
                <p class="text-muted mb-2 small">
                  Only administrators can log in at this time. Other user accounts (Health Workers, Parents) 
                  will be created and managed by the admin through the dashboard.
                </p>
                <p class="text-muted mb-0 small">
                  Please use your admin credentials to access the system.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side Banner -->
        <div class="col-lg-6 bg-primary d-none d-lg-flex align-items-center justify-content-center text-white">
          <div class="text-center">
            <i class="bi bi-hospital display-1 mb-4"></i>
            <h2 class="display-6 fw-bold mb-4">Keep Communities Healthy</h2>
            <p class="lead mb-4">
              Streamline immunization tracking and management for healthcare providers and parents.
            </p>
            <div class="row mt-5">
              <div class="col-4 text-center">
                <i class="bi bi-calendar-check display-6 mb-3"></i>
                <h5>Schedule</h5>
                <p>Easy appointment scheduling</p>
              </div>
              <div class="col-4 text-center">
                <i class="bi bi-graph-up display-6 mb-3"></i>
                <h5>Track</h5>
                <p>Monitor vaccination progress</p>
              </div>
              <div class="col-4 text-center">
                <i class="bi bi-bell display-6 mb-3"></i>
                <h5>Notify</h5>
                <p>Automated reminders</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRoute } from 'vue-router'

export default {
  name: 'Login',
  setup() {
    const { login, isLoading, error, clearError } = useAuth()
    const route = useRoute()

    // Form data
    const form = ref({
      username: '',
      password: '',
      rememberMe: false
    })

    // Form validation errors
    const formErrors = ref({
      username: '',
      password: ''
    })

    // UI state
    const showPassword = ref(false)
    const successMessage = ref('')

    // Computed
    const redirectPath = computed(() => route.query.redirect || null)

    // Methods
    const togglePassword = () => {
      showPassword.value = !showPassword.value
    }

    const validateForm = () => {
      formErrors.value = {
        username: '',
        password: ''
      }

      let isValid = true

      if (!form.value.username.trim()) {
        formErrors.value.username = 'Username or email is required'
        isValid = false
      } else if (form.value.username.length < 3) {
        formErrors.value.username = 'Username must be at least 3 characters'
        isValid = false
      }

      if (!form.value.password) {
        formErrors.value.password = 'Password is required'
        isValid = false
      } else if (form.value.password.length < 6) {
        formErrors.value.password = 'Password must be at least 6 characters'
        isValid = false
      }

      return isValid
    }

    const handleLogin = async () => {
      if (!validateForm()) {
        return
      }

      try {
        const result = await login({
          username: form.value.username.trim(),
          password: form.value.password
        })

        if (result.success) {
          successMessage.value = 'Login successful! Redirecting...'
          
          // The useAuth composable will handle redirection
          // based on user role automatically
        }
      } catch (err) {
        console.error('Login error:', err)
        // Error is already handled by the auth store
      }
    }

    const showForgotPassword = () => {
      // TODO: Implement forgot password functionality
      alert('Forgot password functionality will be implemented soon!')
    }

    // Handle registration success message from query params
    if (route.query.registered === 'true') {
      successMessage.value = 'Registration successful! Please log in with your credentials.'
    }

    return {
      // Form data
      form,
      formErrors,
      
      // UI state
      showPassword,
      successMessage,
      isLoading,
      error,
      
      // Methods
      handleLogin,
      togglePassword,
      clearError,
      showForgotPassword
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form-container {
  padding: 2rem;
}

.card {
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.input-group-text {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

.btn-primary {
  background: linear-gradient(45deg, #007bff, #0056b3);
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,123,255,0.3);
}

.btn-primary:disabled {
  transform: none;
  opacity: 0.6;
}

.bg-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

@media (max-width: 768px) {
  .login-form-container {
    padding: 1rem;
  }
  
  .card-body {
    padding: 2rem !important;
  }
}
</style>