<template>
  <div class="login-container">
    <div class="container-fluid vh-100">
      <div class="row h-100">
        <!-- Login Form Section -->
        <div class="col-lg-6 d-flex align-items-center justify-content-center">
          <div class="login-form-container">
            <div class="text-center mb-5">
              <h1 class="display-5 fw-bold text-primary mb-3">
                <i class="bi bi-shield-check me-3"></i>ImmunizeMe
              </h1>
              <p class="lead text-muted">Immunization Management System</p>
            </div>

            <div class="card shadow-lg border-0">
              <div class="card-body p-5">
                <form @submit.prevent="handleLogin">
                  <div class="mb-3">
                    <label for="identifier" class="form-label">Email / Username / Phone</label>
                    <input
                      type="text"
                      class="form-control form-control-lg"
                      id="identifier"
                      v-model="form.identifier"
                      placeholder="Enter email, username, or phone"
                      required
                    />
                  </div>

                  <div class="mb-4">
                    <label for="password" class="form-label">Password</label>
                    <input
                      type="password"
                      class="form-control form-control-lg"
                      id="password"
                      v-model="form.password"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    class="btn btn-primary btn-lg w-100"
                    :disabled="loading"
                  >
                    <span v-if="loading">
                      <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                      Signing in...
                    </span>
                    <span v-else>
                      <i class="bi bi-box-arrow-in-right me-2"></i>
                      Sign In
                    </span>
                  </button>
                </form>

                <!-- Error Alert -->
                <div v-if="error" class="alert alert-danger mt-3" role="alert">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  {{ error }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Branding/Info Section -->
        <div class="col-lg-6 d-none d-lg-flex align-items-center justify-content-center bg-primary">
          <div class="text-center text-white">
            <div class="mb-4">
              <i class="bi bi-heart-pulse display-1 mb-4"></i>
            </div>
            <h2 class="display-6 mb-4">Keep Your Community Healthy</h2>
            <p class="lead mb-0">
              Streamline immunization tracking, manage patient records, 
              and ensure comprehensive vaccination coverage for your community.
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
import { useAuth } from '@/composables/useAuth'
import { login as loginApi } from '@/services/auth'

const router = useRouter()

// Form data
const form = reactive({
  identifier: '',
  password: ''
})

// Component state
const loading = ref(false)
const error = ref('')

// Handle form submission
const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!form.identifier || !form.password) {
      throw new Error('Please fill in all fields')
    }

    // Call backend login; identifier can be phone/email/username
    const { user, token } = await loginApi({ identifier: form.identifier, password: form.password })

    // Use auth composable to store auth data
    const { login } = useAuth()
    login(token, user.role, user)

    // Navigate based on user role from backend
    const role = (user.role || '').toLowerCase()
    if (role === 'admin') {
      router.push('/admin/dashboard')
    } else if (role === 'healthstaff' || role === 'health-worker') {
      router.push('/healthworker/dashboard')
    } else if (role === 'guardian') {
      router.push('/parent/dashboard')
    } else {
      throw new Error('Unknown user role. Please contact support.')
    }
  } catch (err) {
    error.value = err?.response?.data?.message || err.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>


